"""
weekly_reports의 집계 수치를 실제 데이터로 다시 계산합니다.

배경:
  weekly_trend_generator가 source_type 필터 없이 집계해 경매(auction) 건이 섞여 있었습니다.
  이 사이트는 회생·파산 자산매각 공고(source_type='notice')만 다루므로,
  홈 화면(필터 적용)과 주간 통계(필터 누락)의 수치가 서로 달랐습니다.
  이 스크립트가 total_notices / category_breakdown / top_department를 정정합니다.

사용법:
  python scripts/recompute_weekly_stats.py            # 미리보기 (변경 없음)
  python scripts/recompute_weekly_stats.py --apply    # 실제 반영
"""
import os
import sys
import json
import argparse
from collections import Counter
from supabase import create_client, Client
from dotenv import load_dotenv

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env.local"))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("Supabase 환경변수가 없습니다 (.env.local 확인).")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def recompute(apply: bool):
    weeks = (supabase.table("weekly_reports")
             .select("week_start, week_end, total_notices, category_breakdown, top_department")
             .order("week_end", desc=True).limit(200).execute()).data or []

    if not weeks:
        print("주차 데이터가 없습니다.")
        return

    print(f"\n{len(weeks)}개 주차 검사 " + ("(실제 반영)" if apply else "(미리보기 — 변경 없음)") + "\n")
    changed = 0

    for w in weeks:
        rows = (supabase.table("court_notices")
                .select("category, department")
                .eq("source_type", "notice")
                .gte("date_posted", w["week_start"])
                .lte("date_posted", w["week_end"])
                .limit(3000).execute()).data or []

        total = len(rows)
        cats = dict(Counter(r.get("category") or "other" for r in rows))
        depts = Counter(r.get("department") or "기타" for r in rows)
        top_dept = depts.most_common(1)[0][0] if depts else None

        old_total = w.get("total_notices") or 0
        if old_total == total and w.get("top_department") == top_dept:
            continue

        changed += 1
        diff = old_total - total
        line = f"{w['week_start']} ~ {w['week_end']}:  {old_total}건 → {total}건  (경매 등 {diff}건 제외)"
        if w.get("top_department") != top_dept:
            line += f"  |  최다법원 {w.get('top_department')} → {top_dept}"
        print(line)

        if apply:
            supabase.table("weekly_reports").update({
                "total_notices": total,
                "category_breakdown": cats,
                "top_department": top_dept,
            }).eq("week_start", w["week_start"]).execute()

    print(f"\n정정 대상 {changed}개 주차.")
    if changed and not apply:
        print("실제로 반영하려면:  python scripts/recompute_weekly_stats.py --apply")
    elif apply:
        print("반영 완료.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="weekly_reports 집계 수치 정정")
    ap.add_argument("--apply", action="store_true", help="실제로 DB에 반영 (없으면 미리보기)")
    recompute(ap.parse_args().apply)
