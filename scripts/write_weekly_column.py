"""
주간 데이터 칼럼 작성 도구.

주간 집계 수치를 보여주고, 편집자가 쓴 해석을 weekly_reports.editor_note에 저장합니다.
해석이 저장된 주차만 /trend/{week_start} 개별 URL로 공개·색인됩니다.

주간 워크플로우 (실제 소요 10~15분):

  # 0) 어떤 주차에 칼럼이 없는지 확인
  python scripts/write_weekly_column.py

  # 1) AI가 데이터에서 '확인해볼 지점'을 뽑고 메모 파일을 만든다  [자동]
  python scripts/write_weekly_column.py --analyze 2026-08-17

  # 2) 메모 파일을 열어 '메모:' 뒤에 아는 것을 한 줄씩 적는다     [사람 · 5분]
  #    drafts/weekly-columns/2026-08-17.notes.md
  #    → 여기가 칼럼의 핵심입니다. 한두 개만 채워도 됩니다.

  # 3) 메모를 문단으로 정리해 초안을 만든다                        [자동]
  python scripts/write_weekly_column.py --draft 2026-08-17

  # 4) 초안을 열어 사실 확인 후 표현을 고친다                      [사람 · 5분]
  #    drafts/weekly-columns/2026-08-17.md

  # 5) 발행
  python scripts/write_weekly_column.py --publish 2026-08-17

기타:
  --show 2026-08-17         집계 수치만 보기
  --draft ... --blank       AI 보조 없이 빈 초안
  --unpublish 2026-08-17    발행 취소 (색인에서 빠짐)

AI의 역할은 (1) 살펴볼 지점 제시와 (3) 문장 다듬기까지입니다.
무엇이 중요한지 판단하고 사실을 검증하는 것은 사람의 몫이며, 그것이 이 칼럼의 가치입니다.
2단계를 건너뛰면 예전의 자동 생성 글과 같아집니다.

주차 슬러그는 week_start(월요일, YYYY-MM-DD)입니다.
"""
import os
import sys
import json
import argparse
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env.local"))
DRAFT_DIR = os.path.join(BASE_DIR, "drafts", "weekly-columns")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("Supabase 환경변수가 없습니다 (.env.local 확인).")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def _openai():
    """OpenAI 클라이언트. 키가 없으면 안내 후 종료."""
    if not OPENAI_API_KEY:
        raise SystemExit("OPENAI_API_KEY가 없습니다 (.env.local 확인). AI 보조 없이 쓰려면 --draft --blank 를 쓰세요.")
    from openai import OpenAI
    return OpenAI(api_key=OPENAI_API_KEY)

MIN_LENGTH = 200  # src/lib/weeklyColumn.ts 의 hasEditorNote 기준과 반드시 일치
DEFAULT_AUTHOR = "김달 · 로옥션 편집팀"

CATEGORY_LABELS = {
    "real_estate": "부동산", "vehicle": "차량/동산", "asset": "자산",
    "bond": "채권", "stock": "주식", "patent": "특허",
    "intangible": "무체재산", "electronics": "전자장비",
}


def _parse_json(value, fallback):
    if value is None:
        return fallback
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return fallback
    return value


def _week_label(week_start: str) -> str:
    try:
        y, m, d = (int(x) for x in week_start.split("-"))
    except Exception:
        return week_start
    nth = 1 if d <= 7 else 2 if d <= 14 else 3 if d <= 21 else 4 if d <= 28 else 5
    return f"{m}월 {nth}주차"


def _fetch(week_start: str):
    res = supabase.table("weekly_reports").select("*").eq("week_start", week_start).limit(1).execute()
    rows = res.data or []
    return rows[0] if rows else None


def list_weeks():
    res = (supabase.table("weekly_reports")
           .select("week_start, week_end, total_notices, top_department, editor_note")
           .order("week_end", desc=True).limit(30).execute())
    rows = res.data or []
    published = [r for r in rows if (r.get("editor_note") or "").strip()]
    print(f"\n주차 {len(rows)}개  (칼럼 발행 {len(published)} / 미작성 {len(rows) - len(published)})\n")
    for r in rows:
        note = (r.get("editor_note") or "").strip()
        flag = f"[발행 {len(note)}자]" if note else "[미작성]  "
        print(f"{flag} {r['week_start']} ~ {r['week_end']}  {_week_label(r['week_start'])}  "
              f"공고 {r.get('total_notices') or 0}건  {r.get('top_department') or ''}")
    if rows:
        print("\n해석을 쓸 주차를 고르세요:  python scripts/write_weekly_column.py --draft <week_start>")


def show(week_start: str):
    row = _fetch(week_start)
    if not row:
        raise SystemExit(f"{week_start} 주차 데이터가 없습니다. 목록: python scripts/write_weekly_column.py")

    cats = _parse_json(row.get("category_breakdown"), {})
    tags = _parse_json(row.get("trending_tags"), [])

    print(f"\n=== {_week_label(week_start)}  ({row['week_start']} ~ {row['week_end']}) ===")
    print(f"수집 공고     : {row.get('total_notices') or 0}건")
    print(f"최다 공고 법원 : {row.get('top_department') or '-'}")
    if cats:
        print("\n분류별:")
        for k, v in sorted(cats.items(), key=lambda kv: -kv[1]):
            print(f"  - {CATEGORY_LABELS.get(k, k)}: {v}건")
    if tags:
        print("\n자주 등장한 키워드:")
        for t in tags[:10]:
            if isinstance(t, dict):
                print(f"  - {t.get('tag')} ({t.get('count')})")
    note = (row.get("editor_note") or "").strip()
    print(f"\n편집자 해석: {'작성됨 (' + str(len(note)) + '자)' if note else '없음'}")
    if note:
        print("-" * 50)
        print(note)


# ── 특이점 탐지 (코드로 계산 → AI가 질문으로 정리) ────────────────────

def _notes_path(week_start: str) -> str:
    return os.path.join(DRAFT_DIR, f"{week_start}.notes.md")


def _collect_signals(week_start: str, week_end: str) -> dict:
    """이번 주 데이터를 지난 4주와 비교해 '확인해볼 지점'의 재료를 계산한다.
    여기서는 사실만 계산하고, 해석은 하지 않는다."""
    start = datetime.strptime(week_start, "%Y-%m-%d").date()
    prev_start = (start - timedelta(days=28)).isoformat()

    def fetch(a, b):
        res = (supabase.table("court_notices")
               .select("title, category, department, date_posted, minimum_price")
               .eq("source_type", "notice")
               .gte("date_posted", a).lte("date_posted", b)
               .limit(2000).execute())
        return res.data or []

    this_week = fetch(week_start, week_end)
    prior = fetch(prev_start, (start - timedelta(days=1)).isoformat())

    def by(rows, key):
        out = {}
        for r in rows:
            k = r.get(key) or "미상"
            out[k] = out.get(k, 0) + 1
        return out

    this_dept, prior_dept = by(this_week, "department"), by(prior, "department")
    this_cat, prior_cat = by(this_week, "category"), by(prior, "category")

    # 법원별 급증: 이번 주 3건 이상이면서 4주 평균의 2배 이상
    dept_spikes = []
    for dept, count in sorted(this_dept.items(), key=lambda kv: -kv[1])[:8]:
        avg = prior_dept.get(dept, 0) / 4
        if count >= 3 and (avg == 0 or count >= avg * 2):
            dept_spikes.append({"법원": dept, "이번주": count, "직전4주평균": round(avg, 1)})

    # 분야별 비중 변화
    total_now, total_prior = len(this_week) or 1, len(prior) or 1
    cat_shifts = []
    for cat, count in this_cat.items():
        now_pct = count / total_now * 100
        prior_pct = prior_cat.get(cat, 0) / total_prior * 100
        if abs(now_pct - prior_pct) >= 8 and count >= 3:
            cat_shifts.append({
                "분야": CATEGORY_LABELS.get(cat, cat),
                "이번주비중": f"{now_pct:.0f}%",
                "직전4주비중": f"{prior_pct:.0f}%",
                "이번주건수": count,
            })

    # 같은 법원에 여러 건 몰린 경우(제목이 유사한 묶음일 가능성)
    clustered = [
        {"법원": d, "건수": c}
        for d, c in sorted(this_dept.items(), key=lambda kv: -kv[1])[:3] if c >= 5
    ]

    # 가격 이상치
    priced = []
    for r in this_week:
        try:
            v = int(r.get("minimum_price") or 0)
        except (TypeError, ValueError):
            v = 0
        if v > 0:
            priced.append({"제목": (r.get("title") or "")[:60], "법원": r.get("department"), "최저매각가": v})
    priced.sort(key=lambda x: -x["최저매각가"])

    return {
        "이번주_총건수": len(this_week),
        "직전4주_주당평균": round(len(prior) / 4, 1),
        "법원별_급증": dept_spikes,
        "분야_비중변화": cat_shifts,
        "특정법원_집중": clustered,
        "최고가_3건": priced[:3],
        "분야별_건수": {CATEGORY_LABELS.get(k, k): v for k, v in sorted(this_cat.items(), key=lambda kv: -kv[1])},
    }


OBSERVER_PROMPT = """당신은 데이터 리서치 보조입니다. 기사를 쓰는 사람이 아니라, 편집자가 무엇을 살펴봐야 할지 짚어주는 역할입니다.

아래는 한국 법원 회생·파산 자산매각 공고의 한 주간 집계와 직전 4주 비교 데이터입니다.
편집자가 이번 주 칼럼에서 다룰 만한 '확인해볼 지점'을 최대 4개 뽑아주세요.

반드시 지킬 것:
1. 결론을 내리지 마세요. 원인을 단정하지 마세요. 데이터에서 보이는 사실과, 편집자가 확인해야 할 질문만 제시합니다.
   (O) "수원회생법원 공고가 20건으로 직전 4주 평균 6건의 3배입니다. 같은 사건에서 나온 물건인지 확인이 필요합니다."
   (X) "수원회생법원의 법인파산이 증가하면서 매물이 늘었습니다."
2. 낙찰가율·경쟁률·수익률은 언급 금지입니다. 낙찰 결과 데이터가 없습니다.
3. "투자 기회", "주목받고 있다" 같은 표현 금지입니다.
4. 데이터에 없는 수치를 만들지 마세요.

출력 형식 (그대로 지킬 것, 다른 말 붙이지 마세요):
1. [사실 한 문장] / 확인 질문: [편집자가 확인할 것 한 문장]
2. ...
"""


def analyze(week_start: str):
    row = _fetch(week_start)
    if not row:
        raise SystemExit(f"{week_start} 주차 데이터가 없습니다. 목록: python scripts/write_weekly_column.py")

    print(f"데이터를 분석하는 중… ({week_start} ~ {row['week_end']})")
    signals = _collect_signals(week_start, row["week_end"])

    client = _openai()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        messages=[
            {"role": "system", "content": OBSERVER_PROMPT},
            {"role": "user", "content": json.dumps(signals, ensure_ascii=False, indent=2)},
        ],
    )
    observations = (resp.choices[0].message.content or "").strip()

    os.makedirs(DRAFT_DIR, exist_ok=True)
    path = _notes_path(week_start)

    lines = [
        f"# {_week_label(week_start)} 메모  ({row['week_start']} ~ {row['week_end']})",
        "#",
        "# 아래는 AI가 데이터에서 뽑은 '확인해볼 지점'입니다. 결론이 아니라 질문입니다.",
        "# 각 항목의 '메모:' 뒤에 아시는 것을 한 줄씩 적어주세요. 모르면 비워두면 됩니다.",
        "# 한두 개만 채워도 충분합니다. 이 메모가 칼럼의 핵심이 됩니다.",
        "#",
        f"# 이번 주 {signals['이번주_총건수']}건 / 직전 4주 주당 평균 {signals['직전4주_주당평균']}건",
        "#" + "-" * 60,
        "",
    ]
    for obs in observations.splitlines():
        obs = obs.strip()
        if not obs:
            continue
        lines.append(f"# {obs}")
        lines.append("메모: ")
        lines.append("")

    lines += [
        "#" + "-" * 60,
        "# 위 항목과 별개로 이번 주에 하고 싶은 말이 있으면 여기에 적어주세요.",
        "메모: ",
        "",
    ]

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print("\n" + observations + "\n")
    print(f"메모 파일을 만들었습니다: {path}")
    print("→ 파일을 열어 '메모:' 뒤를 채운 뒤:")
    print(f"   python scripts/write_weekly_column.py --draft {week_start}")


def _read_memos(week_start: str) -> list:
    """메모 파일에서 사람이 쓴 부분만 추출."""
    path = _notes_path(week_start)
    if not os.path.exists(path):
        return []
    memos = []
    context = None
    with open(path, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if s.startswith("#"):
                stripped = s.lstrip("#").strip()
                if stripped and stripped[0].isdigit():
                    context = stripped
            elif s.startswith("메모:"):
                text = s[len("메모:"):].strip()
                if text:
                    memos.append({"관찰": context, "편집자메모": text})
    return memos


WRITER_PROMPT = """당신은 편집자의 메모를 문단으로 다듬는 교정자입니다. 저자가 아닙니다.

편집자가 이번 주 데이터를 보고 남긴 메모를 받게 됩니다. 이것을 독자가 읽을 칼럼 문단으로 정리하세요.

반드시 지킬 것:
1. 편집자 메모에 없는 내용을 추가하지 마세요. 새로운 주장, 원인 설명, 조언을 만들어내면 안 됩니다.
2. 메모의 판단을 바꾸지 마세요. 표현만 다듬습니다.
3. 집계 수치는 맥락으로만 짧게 쓰고, 수치 나열은 하지 마세요. 페이지에 이미 표시됩니다.
4. 낙찰가율·경쟁률·수익률 언급 금지. "투자 기회", "추천" 등 권유 표현 금지.
5. 문단 2~4개, 전체 400~700자. 각 문단은 빈 줄로 구분.
6. 완성된 글만 출력하세요. 제목, 머리말, 설명을 붙이지 마세요.

문체: 담담한 정보 전달체. '~입니다' 체. 과장 없이."""


def _write_from_memos(week_start: str, row: dict, memos: list) -> str:
    signals = _collect_signals(week_start, row["week_end"])
    payload = {
        "주차": f"{row['week_start']} ~ {row['week_end']}",
        "이번주_총건수": signals["이번주_총건수"],
        "직전4주_주당평균": signals["직전4주_주당평균"],
        "분야별_건수": signals["분야별_건수"],
        "편집자_메모": memos,
    }
    client = _openai()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {"role": "system", "content": WRITER_PROMPT},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False, indent=2)},
        ],
    )
    return (resp.choices[0].message.content or "").strip()


def draft(week_start: str, blank: bool = False):
    row = _fetch(week_start)
    if not row:
        raise SystemExit(f"{week_start} 주차 데이터가 없습니다.")

    os.makedirs(DRAFT_DIR, exist_ok=True)
    path = os.path.join(DRAFT_DIR, f"{week_start}.md")

    if os.path.exists(path):
        print(f"이미 초안이 있습니다: {path}")
        print("작성 후:  python scripts/write_weekly_column.py --publish " + week_start)
        return

    # 메모가 있으면 AI가 문단으로 다듬어 초안을 채운다.
    ai_body = ""
    if not blank:
        memos = _read_memos(week_start)
        if memos:
            print(f"편집자 메모 {len(memos)}건을 문단으로 정리하는 중…")
            ai_body = _write_from_memos(week_start, row, memos)
        else:
            print("메모가 없어 빈 초안을 만듭니다.")
            print(f"  (AI 보조를 쓰려면 먼저: python scripts/write_weekly_column.py --analyze {week_start})")

    cats = _parse_json(row.get("category_breakdown"), {})
    tags = _parse_json(row.get("trending_tags"), [])
    cat_lines = "\n".join(
        f"#   - {CATEGORY_LABELS.get(k, k)}: {v}건"
        for k, v in sorted(cats.items(), key=lambda kv: -kv[1])
    ) or "#   (분류 데이터 없음)"
    tag_line = ", ".join(
        f"{t.get('tag')}({t.get('count')})" for t in tags[:10] if isinstance(t, dict)
    ) or "(없음)"

    existing = (row.get("editor_note") or "").strip()
    body = ai_body or existing
    ai_notice = (
        "# ※ 아래 본문은 대표님 메모를 바탕으로 AI가 문단으로 다듬은 초안입니다.\n"
        "#   반드시 읽고 사실이 맞는지 확인한 뒤, 표현을 본인 것으로 고쳐서 발행하세요.\n"
        "#   읽지 않고 그대로 발행하면 자동 생성 글과 다를 바 없습니다.\n#\n"
    ) if ai_body else ""

    template = f"""제목: {_week_label(week_start)} 매각 공고 리뷰
작성자: {DEFAULT_AUTHOR}
---
# ↑ '---' 윗부분은 설정입니다. 제목은 바꿔도 되고, 비워두면 기본 제목이 쓰입니다.
# ↓ '---' 아랫부분이 본문입니다. 빈 줄로 문단을 나눕니다. '#'로 시작하는 줄은 저장되지 않습니다.
#
{ai_notice}# === 이번 주 집계 ({row['week_start']} ~ {row['week_end']}) ===
#   수집 공고: {row.get('total_notices') or 0}건
#   최다 공고 법원: {row.get('top_department') or '-'}
{cat_lines}
#   키워드: {tag_line}
#
# === 쓸 때 참고 ===
#   - 수치가 '무엇을 의미하는지'를 쓰세요. 수치 반복은 이미 페이지에 있습니다.
#   - 낙찰 결과는 수집하지 않으므로 낙찰가율·경쟁률을 단정하지 마세요.
#   - 최소 {MIN_LENGTH}자 이상이어야 발행됩니다. 2~4문단이면 충분합니다.

{body}
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(template)

    print(f"초안을 만들었습니다: {path}")
    print("편집기로 열어 작성한 뒤:")
    print(f"  python scripts/write_weekly_column.py --publish {week_start}")


def publish(week_start: str):
    path = os.path.join(DRAFT_DIR, f"{week_start}.md")
    if not os.path.exists(path):
        raise SystemExit(f"초안이 없습니다: {path}\n먼저 --draft {week_start} 를 실행하세요.")

    with open(path, encoding="utf-8") as f:
        raw = f.read()

    title, author = None, None
    body = raw
    if "\n---\n" in raw:
        head, body = raw.split("\n---\n", 1)
        for line in head.splitlines():
            if line.startswith("제목:"):
                title = line.split(":", 1)[1].strip() or None
            elif line.startswith("작성자:"):
                author = line.split(":", 1)[1].strip() or None

    note = "\n".join(l for l in body.splitlines() if not l.lstrip().startswith("#")).strip()

    if len(note) < MIN_LENGTH:
        raise SystemExit(
            f"해석이 {len(note)}자입니다. 최소 {MIN_LENGTH}자 이상이어야 발행됩니다.\n"
            f"파일을 더 채운 뒤 다시 실행하세요: {path}"
        )

    payload = {
        "editor_note": note,
        "editor_note_title": title,
        "editor_note_by": author or DEFAULT_AUTHOR,
        "editor_note_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("weekly_reports").update(payload).eq("week_start", week_start).execute()

    print(f"[발행 완료] {week_start} — {len(note)}자")
    print(f"  제목: {title or _week_label(week_start) + ' 매각 공고 리뷰'}")
    print(f"  URL : https://www.courtauction.site/trend/{week_start}")


def unpublish(week_start: str):
    supabase.table("weekly_reports").update({
        "editor_note": None, "editor_note_title": None,
        "editor_note_by": None, "editor_note_at": None,
    }).eq("week_start", week_start).execute()
    print(f"[발행 취소] {week_start} — 해석이 삭제되어 색인에서 빠집니다.")


def main():
    ap = argparse.ArgumentParser(description="주간 데이터 칼럼 작성 도구")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--show", metavar="WEEK_START", help="해당 주차 집계 수치 보기")
    g.add_argument("--analyze", metavar="WEEK_START", help="[1단계] 확인해볼 지점 분석 + 메모 파일 생성")
    g.add_argument("--draft", metavar="WEEK_START", help="[2단계] 메모를 문단으로 정리해 초안 생성")
    g.add_argument("--publish", metavar="WEEK_START", help="[3단계] 초안을 저장(발행)")
    g.add_argument("--unpublish", metavar="WEEK_START", help="발행 취소")
    ap.add_argument("--blank", action="store_true", help="--draft와 함께: AI 보조 없이 빈 초안 생성")
    args = ap.parse_args()

    if args.show:
        show(args.show)
    elif args.analyze:
        analyze(args.analyze)
    elif args.draft:
        draft(args.draft, blank=args.blank)
    elif args.publish:
        publish(args.publish)
    elif args.unpublish:
        unpublish(args.unpublish)
    else:
        list_weeks()


if __name__ == "__main__":
    main()
