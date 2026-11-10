"""
공고 첨부문서 원문 추출기 (content_text 백필·일일 추출)
=====================================================

court_notices.content_text 에 첨부파일(PDF·HWP) 본문을 정리·마스킹해 저장한다.
LLM 을 쓰지 않으므로 비용이 들지 않는다. 스캔 이미지 PDF 는 건너뛴다(OCR 은 ai_report_generator 담당).

저장 규칙은 scripts/notice_text.py 머리말 참고 — content_text 가 NULL 이 아니면 '읽을 만한 원문 있음'.

사용 예:
    # 아직 원문이 없거나 예전 '제목 복제' 값인 공고 전부 (로컬 백필, 한국 IP 권장)
    python scripts/attachment_text_extractor.py --all-missing

    # 최근 7일 공고만 (GitHub Actions 일일 실행용)
    python scripts/attachment_text_extractor.py --days 7 --limit 200

    # 특정 공고만, DB 에 쓰지 않고 결과만 보기
    python scripts/attachment_text_extractor.py --ids <uuid> <uuid> --dry-run --show
"""

from __future__ import annotations

import os
import sys
import time
import argparse
from collections import Counter
from datetime import date, timedelta

from dotenv import load_dotenv
from supabase import create_client

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from notice_text import OCR_MARKER, build_notice_text, visible_len  # noqa: E402

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env.local"))

PAGE = 500


def get_client():
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.")
        sys.exit(1)
    return create_client(url, key)


def needs_text(row: dict) -> bool:
    """원문이 비어 있거나, 예전 스크래퍼가 넣은 '제목 복제'·짧은 값이면 다시 추출한다."""
    ct = row.get("content_text")
    if not ct:
        return True
    if ct.strip() == (row.get("title") or "").strip():
        return True
    return visible_len(ct) < 400


def fetch_rows(sb, args) -> list[dict]:
    cols = "id, site_id, source_type, title, file_info, content_text, date_posted"
    if args.ids:
        res = sb.table("court_notices").select(cols).in_("id", args.ids).execute()
        return res.data or []
    rows, offset = [], 0
    since = (date.today() - timedelta(days=args.days)).isoformat() if args.days else None
    while True:
        q = sb.table("court_notices").select(cols).eq("source_type", "notice")
        if since:
            q = q.gte("date_posted", since)
        res = q.order("date_posted", desc=True).range(offset, offset + PAGE - 1).execute()
        batch = res.data or []
        rows.extend(batch)
        if len(batch) < PAGE:
            break
        offset += PAGE
    if not args.force:
        rows = [r for r in rows if needs_text(r)]
    if args.limit:
        rows = rows[: args.limit]
    return rows


def save(sb, row: dict, text: str | None) -> None:
    payload = {"content_text": text}
    sb.table("court_notices").update(payload).eq("id", row["id"]).execute()
    if row.get("site_id"):
        try:  # 영구 보관 테이블도 같은 값으로 (없는 행이면 0건 갱신)
            sb.table("court_notices_history").update(payload) \
                .eq("site_id", row["site_id"]).eq("source_type", row.get("source_type") or "notice").execute()
        except Exception:
            pass


def main() -> None:
    ap = argparse.ArgumentParser(description="공고 첨부문서 원문을 content_text 에 저장")
    ap.add_argument("--all-missing", action="store_true", help="기간 제한 없이 원문이 필요한 공고 전부")
    ap.add_argument("--days", type=int, default=None, help="최근 N일 게시 공고만")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--ids", nargs="*", help="특정 공고 id")
    ap.add_argument("--force", action="store_true", help="이미 원문이 있어도 다시 추출")
    ap.add_argument("--sleep", type=float, default=1.0, help="다운로드 사이 대기(초) — 법원 서버 부담 완화")
    ap.add_argument("--dry-run", action="store_true", help="DB 에 쓰지 않음")
    ap.add_argument("--show", action="store_true", help="추출 결과 앞부분 출력")
    args = ap.parse_args()
    if not (args.all_missing or args.days or args.ids):
        ap.error("--all-missing, --days, --ids 중 하나가 필요합니다.")

    sb = get_client()
    rows = fetch_rows(sb, args)
    print(f"대상 {len(rows)}건 (dry-run={args.dry_run})")

    stats = Counter()
    started = time.time()
    for i, row in enumerate(rows, 1):
        try:
            text, meta = build_notice_text(row.get("file_info"), sleep=args.sleep, log=lambda m: print(m))
        except Exception as e:  # 공고 한 건의 추출 오류가 전체 백필을 멈추지 않게 한다
            print(f"[{i}/{len(rows)}] 추출 오류, 건너뜀: {type(e).__name__} {e}")
            stats["extract_error"] += 1
            continue
        reason = meta["reason"]
        stats[reason] += 1
        print(f"[{i}/{len(rows)}] {row['date_posted']} {reason:22} {visible_len(text):6}자 | {(row['title'] or '')[:40]}")
        if args.show and text:
            print("    " + text[:400].replace("\n", "\n    "))

        if args.dry_run:
            continue
        try:
            if text:
                save(sb, row, text)
            elif reason == "download_failed":
                # 일시 장애일 수 있으므로 기존 값을 건드리지 않는다(다음 실행에서 재시도).
                # 단 '제목 복제' 값은 원문이 아니므로 지운다.
                if row.get("content_text") and needs_text(row):
                    save(sb, row, None)
            else:
                # 첨부 없음·스캔본·너무 짧음 → 원문 없음으로 확정(NULL).
                # 단 ai_report_generator 가 스캔본을 GPT 로 읽어 둔 원문은 남긴다.
                if row.get("content_text") and not row["content_text"].startswith(OCR_MARKER):
                    save(sb, row, None)
        except Exception as e:
            print(f"    저장 오류, 건너뜀: {type(e).__name__} {str(e)[:120]}")
            stats["save_error"] += 1

        if i % 50 == 0:
            el = time.time() - started
            print(f"  … {i}건 처리, {el / 60:.1f}분 경과, 남은 예상 {el / i * (len(rows) - i) / 60:.0f}분, {dict(stats)}")

    print("\n결과:", dict(stats))
    ok = stats.get("ok", 0)
    print(f"원문 저장 {ok}건 / 대상 {len(rows)}건")
    # 일일 실행에서 다운로드가 전부 막히면 실패로 알린다(조용한 실패 방지).
    if rows and stats.get("download_failed", 0) == len(rows) and len(rows) >= 5:
        print("모든 다운로드가 실패했습니다 — 법원 파일 서버 접속 차단 여부를 확인하세요.")
        sys.exit(2)


if __name__ == "__main__":
    main()
