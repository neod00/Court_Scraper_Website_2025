"""
월간 리포트 집계 빌더 (DB 읽기 전용).

court_notices(source_type='notice')를 달력 월 단위로 집계해 src/content/reports/YYYY-MM.json 에
고정 저장합니다. 페이지(/reports/[month])는 이 JSON만 읽고 요청 시 재집계하지 않으므로,
늦게 수집된 공고로 숫자가 흔들리지 않습니다. DB에는 아무것도 쓰지 않습니다.

사용법:
  python scripts/monthly_report_builder.py --month 2026-08          # 집계 → JSON (status는 유지)
  python scripts/monthly_report_builder.py --all                    # 2026-03 ~ 직전 달 전부
  python scripts/monthly_report_builder.py --show 2026-08           # 집계 요약과 노트 상태 보기
  python scripts/monthly_report_builder.py --set-note 2026-08 --file 노트.txt [--ai-draft]
                                                                    # 편집자 노트 저장 (기본 reviewed)
  python scripts/monthly_report_builder.py --publish 2026-08 [--reviewed]
                                                                    # status=published, published_at=지금
  python scripts/monthly_report_builder.py --unpublish 2026-08

발행 규칙 (src/lib/monthlyReport.ts 의 isPublishable 과 반드시 일치):
  - status == 'published' 이고 editor_note 가 300자 이상일 때만 색인·사이트맵 대상
  - published_at 은 --publish 를 실행한 실제 시각(Asia/Seoul)으로만 찍힙니다. 소급 불가.
  - editor_note_status 가 'ai-draft' 인 리포트는 --reviewed 없이 발행되지 않습니다.
    (AI 초안은 사람이 읽고 고친 뒤 발행합니다. 읽지 않고 발행하면 자동 생성 글과 같습니다.)
    페이지 쪽 isPublishable 도 'ai-draft' 를 발행 불가로 보므로, JSON 을 손으로 고쳐도 초안은 노출되지 않습니다.

재집계(--month)는 편집 필드(editor_note*, status, published_at)를 보존합니다.
집계 규칙 요약:
  - 중앙값·p25·p75: 오름차순 정렬값의 floor(n×q) 번째(0부터) — 짝수 개면 위쪽 중앙값.
  - 입찰 기일: 게시일보다 앞서거나 게시일로부터 1년 넘게 뒤인 값은 표기 오류로 보고 제외(excluded_n 에 건수).
  - 법원 순위: 동점은 같은 순위. 주요 공고: 제외 사유를 실행 시 '[주요 공고 제외]' 로 출력한다.
"""
import os
import re
import sys
import json
import argparse
import calendar
from collections import Counter
from datetime import date, datetime, timedelta

from supabase import create_client, Client
from dotenv import load_dotenv

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env.local"))
REPORT_DIR = os.path.join(BASE_DIR, "src", "content", "reports")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

try:
    from zoneinfo import ZoneInfo
    KST = ZoneInfo("Asia/Seoul")
except Exception:  # Windows 등 tzdata 미설치 환경 — 한국은 DST 가 없어 고정 +9 로 대체
    from datetime import timezone as _tz, timedelta as _td
    KST = _tz(_td(hours=9), name="Asia/Seoul")
FIRST_MONTH = "2026-03"            # 수집이 안정된 첫 달
MIN_NOTE_LENGTH = 300              # monthlyReport.ts isPublishable 과 동일
DEFAULT_AUTHOR = "로옥션"
SCHEMA_VERSION = 1

# 자동 분류 8종 (표시 순서 고정). 라벨은 monthlyReport.ts 와 같아야 한다.
CATEGORY_KEYS = ["real_estate", "asset", "bond", "etc", "vehicle", "patent", "electronics", "stock"]
CATEGORY_LABELS = {
    "real_estate": "부동산", "asset": "자산", "bond": "채권", "etc": "기타",
    "vehicle": "차량/동산", "patent": "특허", "electronics": "전자장비", "stock": "주식",
}

PRICE_BANDS = [
    ("1천만 원 미만", 0, 10_000_000),
    ("1천만~1억 원", 10_000_000, 100_000_000),
    ("1억~5억 원", 100_000_000, 500_000_000),
    ("5억~10억 원", 500_000_000, 1_000_000_000),
    ("10억 원 이상", 1_000_000_000, None),
]

CASE_PAT = re.compile(r"(20\d{2}\s*[가-힣]{1,3}\s*\d{1,6})")

# 매각 대상 문구에 개인 이름이 섞이는 전형 패턴. 하나라도 걸리면 그 공고는 '주요 공고'에서 제외한다.
# (보수적으로 판정한다. 이름이 아닌 일반 명사는 NAME_STOPWORDS 로 걸러 오탐을 줄인다.)
PRIVATE_NAME_PATTERNS = [
    # '소유: 홍길동', '채무자 홍길동' — 키워드 뒤에 콜론이나 공백이 있어야 한다 ('소유권대지권' 같은 낱말은 걸리지 않게).
    re.compile(r"(?:채권자|채무자|원고|피고|소유자|소유|명의|망)\s*[:：]\s*([가-힣]{2,4})(?![가-힣])"),
    re.compile(r"(?:채권자|채무자|원고|피고|소유자|망)\s+([가-힣]{2,4})(?![가-힣])"),
    re.compile(r"([가-힣]{2,4})\s*(?:지번|의\s*상속|외\s*\d+\s*명)"),
    re.compile(r"파산자\s+([가-힣]{2,4})(?![가-힣])"),
]
NAME_STOPWORDS = {
    "소유", "재산", "상속", "지분", "명의", "법인", "회사", "주식", "주식회사", "유한회사", "부동산", "채무자",
    "채권자", "파산", "회생", "사건", "기타", "일체", "토지", "건물", "차량", "물건", "재고", "비품", "및",
    "합계", "전부", "각각", "해당", "소재", "공장", "점유", "임차인", "세입자", "농업", "법인택시",
}
CORP_PATTERN = re.compile(
    r"(주식회사|유한회사|유한책임회사|합자회사|합명회사|농업회사법인|영농조합법인|\(주\)|㈜)\s*[가-힣A-Za-z0-9&·]+"
)

# 제목의 자산 종류 ↔ 매각 대상 문구의 자산 종류가 어긋나면 요약 오류 가능성이 높아 제외한다.
KIND_RULES = [
    ("주식", re.compile(r"주식|유가증권|출자지분")),
    ("채권", re.compile(r"채권")),
    ("특허", re.compile(r"특허|상표|디자인권")),
    ("차량", re.compile(r"차량|자동차|승용|화물|버스|중기|굴삭기|지게차")),
    ("부동산", re.compile(r"부동산|토지|대지|임야|건물|아파트|주택|오피스텔|상가|공장|호실|㎡|\b전\b|\b답\b")),
]


def _supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise SystemExit("Supabase 환경변수가 없습니다 (.env.local 확인).")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ── 날짜 유틸 ──────────────────────────────────────────────────────────

def month_bounds(month: str):
    y, m = (int(x) for x in month.split("-"))
    last = calendar.monthrange(y, m)[1]
    return date(y, m, 1), date(y, m, last)


def shift_month(month: str, delta: int) -> str:
    y, m = (int(x) for x in month.split("-"))
    idx = (y * 12 + (m - 1)) + delta
    return f"{idx // 12:04d}-{idx % 12 + 1:02d}"


def is_month(s: str) -> bool:
    return bool(re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", s or ""))


def month_label(month: str) -> str:
    y, m = (int(x) for x in month.split("-"))
    return f"{y}년 {m}월"


# ── 조회 (읽기 전용) ───────────────────────────────────────────────────

def fetch_month(sb: Client, month: str, with_summary: bool = True) -> list:
    start, end = month_bounds(month)
    cols = "id, title, department, category, date_posted, minimum_price, auction_date"
    if with_summary:
        cols += ", ai_summary"
    rows, off, page = [], 0, 1000
    while True:
        res = (sb.table("court_notices").select(cols)
               .eq("source_type", "notice")
               .gte("date_posted", start.isoformat()).lte("date_posted", end.isoformat())
               .order("date_posted", desc=False).order("id", desc=False)
               .range(off, off + page - 1).execute())
        chunk = res.data or []
        rows += chunk
        if len(chunk) < page:
            break
        off += page
    return rows


# ── 집계 보조 ─────────────────────────────────────────────────────────

def _price(r) -> int:
    try:
        v = int(str(r.get("minimum_price") or "0").replace(",", "").strip())
    except ValueError:
        return 0
    return v if v > 0 else 0


def _pct(part: int, whole: int) -> float:
    return round(part / whole * 100, 1) if whole else 0.0


def _quantile(sorted_vals: list, q: float) -> int:
    """오름차순 정렬값에서 floor(n×q) 번째(0부터 셈) 값. q=0.5 이면 vals[n//2] — 짝수 개일 때 위쪽 중앙값.
    (scratchpad facts.py 의 중앙값 규칙과 같다. 이전의 round((n-1)q) 는 짝수 개에서 아래쪽 값을 골라 어긋났다.)"""
    if not sorted_vals:
        return 0
    idx = min(len(sorted_vals) - 1, int(len(sorted_vals) * q))
    return int(sorted_vals[idx])


def _competition_rank(counter: Counter) -> dict:
    """동점은 같은 순위(1,2,2,4 방식). most_common 순서에 따라 동점 순위가 갈리는 문제를 피한다."""
    ranks = {}
    for name, cnt in counter.items():
        ranks[name] = 1 + sum(1 for v in counter.values() if v > cnt)
    return ranks


def _auction_date_ok(auction_date, date_posted) -> bool:
    """게시일보다 앞서거나 게시일로부터 1년 넘게 뒤인 기일은 원문 표기·파싱 오류로 보고 집계에서 뺀다."""
    try:
        ad = date.fromisoformat(str(auction_date)[:10])
        dp = date.fromisoformat(str(date_posted)[:10])
    except (TypeError, ValueError):
        return False
    return dp <= ad <= dp + timedelta(days=366)


def _is_fallback(summary) -> bool:
    return (not summary) or ("첨부파일" in summary)


def _is_quality(summary) -> bool:
    # src/lib/noticeQuality.ts isQualityNotice 와 같은 기준
    return bool(summary) and ("첨부파일" not in summary) and len(summary) > 300


def _clean_md(s: str) -> str:
    s = re.sub(r"\*\*|__|`", "", s or "")
    return re.sub(r"\s+", " ", s).strip()


def _target_phrase(summary: str) -> str:
    """요약의 '매각 대상' 항목만 추출. 다음 번호 항목(' 2. ')이 나오기 전까지."""
    text = _clean_md(summary)
    m = re.search(r"매각\s*대상\s*[:：]\s*(.+?)(?=\s+\d\.\s|$)", text)
    return (m.group(1) if m else "").strip(" ,.;")


def _price_phrase(summary: str) -> str:
    text = _clean_md(summary)
    m = re.search(r"매각\s*가격\s*[:：]\s*(.+?)(?=\s+\d\.\s|$)", text)
    return (m.group(1) if m else "").strip()


def _kind(text: str):
    for name, pat in KIND_RULES:
        if pat.search(text or ""):
            return name
    return None


def _title_mismatch(title: str, target: str) -> bool:
    # 법인명('주식회사 …')은 자산 종류 판정에서 빼고 본다 — 소유자 표기 때문에 '주식'으로 오판하지 않게.
    tk, ck = _kind(title), _kind(CORP_PATTERN.sub("", target or ""))
    return bool(tk and ck and tk != ck)


def _has_private_name(text: str) -> bool:
    for pat in PRIVATE_NAME_PATTERNS:
        for m in pat.finditer(text or ""):
            if m.group(1) not in NAME_STOPWORDS:
                return True
    return False


def _round_drop_anomaly(price_phrase: str) -> bool:
    """회차 사이 75% 넘게 떨어지면 자릿수 오독 가능성이 커 제외."""
    nums = [int(n.replace(",", "")) for n in re.findall(r"\d[\d,]{6,}", price_phrase or "")]
    nums = [n for n in nums if n >= 1_000_000]
    for a, b in zip(nums, nums[1:]):
        if a > 0 and b < a * 0.25:
            return True
    return False


CIVIL_CASE_PATTERN = re.compile(r"(?:[가-힣]+법원\s*)?20\d{2}\s*(?:가합|가단|가소|나|다|카합|카단|타경|타채)\s*\d{1,6}")

# 요약 문구가 눈에 띄게 깨진 공고의 매각 대상 표기를 손으로 바로잡는다 (공고 id → 대체 문구).
# 원문 확인 없이 단지명을 '복원'하지 않고, 확인되는 주소·호수만 남긴다.
NOTABLE_TARGET_FIXES = {
    "c2d3a8cc-e890-476e-818b-6bed76300729": "인천광역시 부평구 청천동 36-3번지 일원 아파트 217동 3104호, 84.5725㎡",
}


def _price_consistent(min_price: int, price_phrase: str) -> bool:
    """DB의 minimum_price 가 요약의 '매각 가격' 문구에 나오는 금액 중 하나여야 한다.
    (문구에 100만 원 이상 금액이 있는데 그중 하나도 아니면, 어느 한쪽이 잘못된 것이라 주요 공고에서 뺀다.)"""
    nums = {int(n.replace(",", "")) for n in re.findall(r"\d[\d,]{6,}", price_phrase or "")}
    nums = {n for n in nums if n >= 1_000_000}
    return (not nums) or (min_price in nums)


def _rounds_noted(summary: str) -> bool:
    """'회차별' 뿐 아니라 '1차 최저입찰가 …, 2차 …' 식 표기도 회차 표기로 본다."""
    s = summary or ""
    return bool(re.search(r"회차|(?<!\d)[1-9]\s*차\s*(?:최저|입찰|매각|[:：\-])", s))


def _scrub_target(target: str) -> str:
    t = re.sub(r"\([^)]*(소유|채무자|상속|명의|상호)[^)]*\)", "", target)   # (소유: …), (상호 …) 류 괄호 제거
    t = CORP_PATTERN.sub("(법인명 생략)", t)
    t = CIVIL_CASE_PATTERN.sub("(사건번호 생략)", t)                    # 민사 사건번호로 당사자가 특정되지 않게
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"\s+([,.;])", r"\1", t).strip(" ,.;")
    if len(t) > 80:
        t = t[:80].rstrip(" ,.;") + "…"
    return t


def _clean_title(title: str) -> str:
    return re.sub(r"\s+", " ", title or "").strip()


def _notable_skip_reason(r: dict, p: int):
    """'주요 공고' 후보를 빼야 하는 이유. 없으면 None. (집계 실행 시 제외 사유를 출력해 검토자가 확인한다.)"""
    summary = r.get("ai_summary")
    if not _is_quality(summary):
        return "요약 없음/실패"
    title = _clean_title(r.get("title"))
    target = _target_phrase(summary)
    if not target:
        return "매각 대상 문구 없음"
    if _title_mismatch(title, target):
        return "제목·매각 대상 자산 종류 불일치"
    if _has_private_name(title) or _has_private_name(target):
        return "개인 이름 포함 가능"
    price_phrase = _price_phrase(summary)
    if _round_drop_anomaly(price_phrase):
        return "회차 간 가격 급락(자릿수 오독 가능)"
    if not _price_consistent(p, price_phrase):
        return f"DB 최저가가 요약의 가격 문구와 불일치 ({price_phrase[:60]})"
    return None


# ── 월간 집계 ─────────────────────────────────────────────────────────

def build_stats(sb: Client, month: str) -> dict:
    start, end = month_bounds(month)
    prev_month = shift_month(month, -1)
    next_month = shift_month(month, 1)

    rows = fetch_month(sb, month, with_summary=True)
    prev_rows = fetch_month(sb, prev_month, with_summary=False)
    n, prev_n = len(rows), len(prev_rows)

    # 1) 한눈에 — 주별(월요일 시작) 건수, 주당 평균
    weekly = Counter()
    for r in rows:
        d = date.fromisoformat(r["date_posted"])
        weekly[(d - timedelta(days=d.weekday())).isoformat()] += 1
    weekly_counts = []
    for ws in sorted(weekly):
        wsd = date.fromisoformat(ws)
        wed = wsd + timedelta(days=6)
        weekly_counts.append({
            "week_start": ws,
            "week_end": wed.isoformat(),
            "n": weekly[ws],
            "partial": wsd < start or wed > end,
        })
    days = (end - start).days + 1
    weekly_avg = round(n / (days / 7), 1) if n else 0.0

    # 2) 법원별 — top 8, 전월 건수·순위
    courts = Counter((r.get("department") or "").strip() or "미상" for r in rows)
    prev_courts = Counter((r.get("department") or "").strip() or "미상" for r in prev_rows)
    rank = _competition_rank(courts)          # 동점은 같은 순위
    prev_rank = _competition_rank(prev_courts)
    top_courts = []
    for name, cnt in courts.most_common(8):
        top_courts.append({
            "name": name, "n": cnt, "pct": _pct(cnt, n), "rank": rank[name],
            "prev_n": prev_courts.get(name, 0), "prev_rank": prev_rank.get(name),
        })
    top_sum = sum(c["n"] for c in top_courts)

    # 3) 자산 유형 — 자동 분류 8종
    cats = Counter((r.get("category") or "").strip() or "etc" for r in rows)
    categories = [
        {"key": k, "label": CATEGORY_LABELS[k], "n": cats.get(k, 0), "pct": _pct(cats.get(k, 0), n)}
        for k in CATEGORY_KEYS
    ]
    unclassified = sum(v for k, v in cats.items() if k not in CATEGORY_KEYS)

    # 4) 최저매각가 — 기재된 건만, 합계·평균 없음
    prices = sorted(p for p in (_price(r) for r in rows) if p > 0)
    bands = []
    for label, lo, hi in PRICE_BANDS:
        cnt = sum(1 for p in prices if p >= lo and (hi is None or p < hi))
        bands.append({"label": label, "n": cnt, "pct": _pct(cnt, len(prices))})
    price = {
        "priced_n": len(prices), "pct": _pct(len(prices), n),
        "median": _quantile(prices, 0.5), "p25": _quantile(prices, 0.25), "p75": _quantile(prices, 0.75),
        "ge_100m_n": sum(1 for p in prices if p >= 100_000_000),
        "max": prices[-1] if prices else 0,
        "bands": bands,
    }

    # 5) 입찰 일정 — 게시일 이후 1년 안의 기일만 (그 밖은 표기·파싱 오류로 보고 제외 건수만 적는다)
    raw_dated = [r for r in rows if r.get("auction_date")]
    dated = [str(r["auction_date"])[:10] for r in raw_dated if _auction_date_ok(r["auction_date"], r["date_posted"])]
    by_month = Counter(d[:7] for d in dated)
    top_dates = [{"date": d, "n": c} for d, c in Counter(dated).most_common(3)]
    schedule = {
        "with_auction_date_n": len(dated), "pct": _pct(len(dated), n),
        "excluded_n": len(raw_dated) - len(dated),
        "in_month_n": by_month.get(month, 0),
        "next_month_n": by_month.get(next_month, 0),
        "other_n": len(dated) - by_month.get(month, 0) - by_month.get(next_month, 0),
        "by_month": [{"month": m, "n": c} for m, c in sorted(by_month.items())],
        "top_dates": top_dates,
    }

    # 6) 사건 묶음 — 제목의 사건번호만 사용 (채무자명 사용 안 함)
    case_counter = Counter()
    titled = 0
    for r in rows:
        m = CASE_PAT.search(r.get("title") or "")
        if not m:
            continue
        titled += 1
        court = (r.get("department") or "").strip() or "미상"
        case_counter[(court, m.group(1).replace(" ", ""))] += 1
    multi = [
        {"court": c, "case_no": no, "n": cnt}
        for (c, no), cnt in case_counter.most_common() if cnt > 1
    ][:3]
    cases = {
        "titled_with_case_n": titled,
        "distinct_cases_n": len(case_counter),
        "multi_case_n": sum(1 for cnt in case_counter.values() if cnt > 1),
        "multi_case_examples": multi,
    }

    # 주요 공고 ≤5 — 최저매각가 상위부터, 요약 품질·제목 일치·개인정보 검사를 통과한 것만
    notable, skipped = [], []
    for r in sorted(rows, key=lambda x: -_price(x)):
        if len(notable) >= 5:
            break
        p = _price(r)
        if p <= 0:
            break
        reason = _notable_skip_reason(r, p)
        if reason:
            skipped.append(f"{(r.get('department') or '').strip()} {p:,}원 {_clean_title(r.get('title'))[:30]}: {reason}")
            continue
        title = _clean_title(r.get("title"))
        target = _target_phrase(r.get("ai_summary"))
        notable.append({
            "id": r["id"],
            "court": (r.get("department") or "").strip() or "미상",
            "title": title[:60],
            "min_price": p,
            "target": NOTABLE_TARGET_FIXES.get(r["id"]) or _scrub_target(target),
            "rounds_noted": _rounds_noted(r.get("ai_summary")),
        })
    for line in skipped:
        print(f"   [주요 공고 제외] {line}")

    # 데이터 품질
    fallback_n = sum(1 for r in rows if _is_fallback(r.get("ai_summary")))
    quality_n = sum(1 for r in rows if _is_quality(r.get("ai_summary")))
    data_quality = {
        "summary_fallback_n": fallback_n, "summary_fallback_pct": _pct(fallback_n, n),
        "summary_quality_n": quality_n, "summary_quality_pct": _pct(quality_n, n),
        "min_price_n": len(prices), "auction_date_n": len(dated),
        "unclassified_n": unclassified,
    }

    return {
        "schema_version": SCHEMA_VERSION,
        "month": month,
        "month_label": month_label(month),
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "snapshot_date": datetime.now(KST).date().isoformat(),
        "totals": {
            "n": n, "prev_month": prev_month, "prev_month_n": prev_n,
            "diff": n - prev_n, "diff_pct": round((n - prev_n) / prev_n * 100, 1) if prev_n else None,
            # 수집이 안정된 첫 달(FIRST_MONTH)은 전월이 부분 수집이라 비교하지 않는다.
            "prev_comparable": month > FIRST_MONTH and prev_n > 0,
            "weekly_avg": weekly_avg, "weekly_counts": weekly_counts,
        },
        "courts": {"top": top_courts, "other_n": n - top_sum, "distinct_n": len(courts)},
        "categories": categories,
        "price": price,
        "schedule": schedule,
        "cases": cases,
        "notable": notable,
        "data_quality": data_quality,
    }


# ── 파일 입출력 ───────────────────────────────────────────────────────

def report_path(month: str) -> str:
    return os.path.join(REPORT_DIR, f"{month}.json")


def load_report(month: str):
    p = report_path(month)
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


EDITORIAL_FIELDS = {
    "editor_note": "", "editor_note_title": "", "editor_note_by": DEFAULT_AUTHOR,
    "editor_note_status": "", "status": "draft", "published_at": None,
}


def save_report(report: dict):
    os.makedirs(REPORT_DIR, exist_ok=True)
    with open(report_path(report["month"]), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
        f.write("\n")
    write_index()


def write_index():
    """src/content/reports/index.ts — JSON을 정적 import 로 묶는다(번들에 확실히 포함되도록)."""
    os.makedirs(REPORT_DIR, exist_ok=True)
    months = sorted(
        f[:-5] for f in os.listdir(REPORT_DIR) if re.fullmatch(r"\d{4}-\d{2}\.json", f)
    )
    lines = [
        "// AUTO-GENERATED by scripts/monthly_report_builder.py — 직접 수정하지 마세요.",
        "// 월별 집계 JSON을 정적 import 로 묶어 서버 번들에 포함시킵니다.",
    ]
    for m in months:
        lines.append(f"import r{m.replace('-', '_')} from './{m}.json';")
    lines.append("")
    lines.append("export const REPORT_FILES: unknown[] = [")
    for m in months:
        lines.append(f"    r{m.replace('-', '_')},")
    lines.append("];")
    lines.append("")
    with open(os.path.join(REPORT_DIR, "index.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


# ── 명령 ─────────────────────────────────────────────────────────────

def build(sb: Client, month: str):
    if not is_month(month):
        raise SystemExit(f"월 형식이 잘못되었습니다: {month} (예: 2026-08)")
    stats = build_stats(sb, month)
    existing = load_report(month) or {}
    report = dict(stats)
    for k, default in EDITORIAL_FIELDS.items():
        report[k] = existing.get(k, default)
    if not report.get("editor_note_title"):
        report["editor_note_title"] = ""
    save_report(report)
    t = report["totals"]
    print(f"[집계] {month}: 공고 {t['n']}건 (전월 {t['prev_month_n']}건), 최저매각가 기재 {report['price']['priced_n']}건, "
          f"입찰기일 기재 {report['schedule']['with_auction_date_n']}건, 주요 공고 {len(report['notable'])}건, "
          f"status={report['status']}  → {report_path(month)}")


def build_all(sb: Client):
    today = datetime.now(KST).date()
    last_full = shift_month(today.strftime("%Y-%m"), -1)
    m = FIRST_MONTH
    while m <= last_full:
        build(sb, m)
        m = shift_month(m, 1)


def show(month: str):
    r = load_report(month)
    if not r:
        raise SystemExit(f"리포트 파일이 없습니다: {report_path(month)}  (먼저 --month {month})")
    t, p, s = r["totals"], r["price"], r["schedule"]
    print(f"\n=== {r['month_label']} ({r['period']['start']} ~ {r['period']['end']}) 집계 기준일 {r['snapshot_date']} ===")
    print(f"수집 공고 {t['n']}건 (전월 {t['prev_month_n']}건, {t['diff']:+d}) · 주당 평균 {t['weekly_avg']}건")
    print("법원별: " + ", ".join(f"{c['name']} {c['n']}" for c in r["courts"]["top"][:6]))
    print("분류별: " + ", ".join(f"{c['label']} {c['n']}" for c in r["categories"]))
    print(f"최저매각가 기재 {p['priced_n']}건({p['pct']}%) 중앙값 {p['median']:,}원 p25 {p['p25']:,} p75 {p['p75']:,} 1억 이상 {p['ge_100m_n']}건")
    print(f"입찰기일 기재 {s['with_auction_date_n']}건({s['pct']}%), 다음 달 기일 {s['next_month_n']}건, "
          f"게시일 이전·1년 초과로 제외 {s.get('excluded_n', 0)}건")
    c = r["cases"]
    print(f"사건번호 표기 {c['titled_with_case_n']}건 / {c['distinct_cases_n']}사건, 다건 사건 {c['multi_case_n']}개")
    for ex in c["multi_case_examples"]:
        print(f"   - {ex['court']} {ex['case_no']}: {ex['n']}건")
    print("주요 공고:")
    for it in r["notable"]:
        print(f"   - {it['court']} · {it['min_price']:,}원 · {it['title']} · {it['target']}")
    q = r["data_quality"]
    print(f"요약 실패 {q['summary_fallback_n']}건({q['summary_fallback_pct']}%), 품질 요약 {q['summary_quality_n']}건")
    note = (r.get("editor_note") or "").strip()
    print(f"\n편집자 노트: {len(note)}자 (상태 {r.get('editor_note_status') or '-'}) · status={r['status']} · published_at={r.get('published_at')}")
    if note:
        print("-" * 50)
        print(note)


def set_note(month: str, path: str, ai_draft: bool, title: str = None, author: str = None):
    r = load_report(month)
    if not r:
        raise SystemExit(f"리포트 파일이 없습니다: {report_path(month)}  (먼저 --month {month})")
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    note = "\n".join(l for l in raw.splitlines() if not l.lstrip().startswith("#")).strip()
    r["editor_note"] = note
    r["editor_note_status"] = "ai-draft" if ai_draft else "reviewed"
    if title is not None:
        r["editor_note_title"] = title.strip()
    if author is not None:
        r["editor_note_by"] = author.strip() or DEFAULT_AUTHOR
    save_report(r)
    print(f"[노트 저장] {month}: {len(note)}자, 상태 {r['editor_note_status']} (status={r['status']})")
    if len(note) < MIN_NOTE_LENGTH:
        print(f"  ※ {MIN_NOTE_LENGTH}자 미만이라 발행되지 않습니다.")


def publish(month: str, reviewed: bool):
    r = load_report(month)
    if not r:
        raise SystemExit(f"리포트 파일이 없습니다: {report_path(month)}")
    note = (r.get("editor_note") or "").strip()
    if len(note) < MIN_NOTE_LENGTH:
        raise SystemExit(f"편집자 노트가 {len(note)}자입니다. {MIN_NOTE_LENGTH}자 이상이어야 발행됩니다.")
    if r.get("editor_note_status") == "ai-draft" and not reviewed:
        raise SystemExit(
            "편집자 노트가 AI 초안(ai-draft) 상태입니다. 본문을 읽고 사실을 확인·수정한 뒤\n"
            f"  python scripts/monthly_report_builder.py --publish {month} --reviewed\n"
            "로 발행하세요."
        )
    if reviewed:
        r["editor_note_status"] = "reviewed"
    if r.get("status") == "published" and r.get("published_at"):
        print(f"이미 발행된 리포트입니다 ({r['published_at']}). 발행일은 바꾸지 않습니다.")
        save_report(r)
        return
    r["status"] = "published"
    r["published_at"] = datetime.now(KST).isoformat(timespec="seconds")   # 실제 발행 시각. 소급 금지.
    r["editor_note_by"] = (r.get("editor_note_by") or "").strip() or DEFAULT_AUTHOR
    save_report(r)
    print(f"[발행] {month} — 노트 {len(note)}자, published_at={r['published_at']}")
    print(f"  URL: https://www.courtauction.site/reports/{month}")
    print("  변경된 JSON·index.ts 를 커밋·배포해야 사이트에 반영됩니다.")


def unpublish(month: str):
    r = load_report(month)
    if not r:
        raise SystemExit(f"리포트 파일이 없습니다: {report_path(month)}")
    r["status"] = "draft"
    r["published_at"] = None
    save_report(r)
    print(f"[발행 취소] {month} — 색인·사이트맵에서 빠집니다. 다시 발행하면 새 시각이 찍힙니다.")


def main():
    ap = argparse.ArgumentParser(description="월간 리포트 집계 빌더 (DB 읽기 전용)")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--month", metavar="YYYY-MM", help="해당 월 집계 → JSON")
    g.add_argument("--all", action="store_true", help=f"{FIRST_MONTH} 부터 직전 달까지 전부 집계")
    g.add_argument("--show", metavar="YYYY-MM", help="집계 요약과 노트 상태 보기")
    g.add_argument("--set-note", metavar="YYYY-MM", help="편집자 노트를 파일에서 읽어 저장 (--file 필요)")
    g.add_argument("--publish", metavar="YYYY-MM", help="발행 (published_at=지금)")
    g.add_argument("--unpublish", metavar="YYYY-MM", help="발행 취소")
    g.add_argument("--reindex", action="store_true", help="index.ts 만 다시 생성")
    ap.add_argument("--file", help="--set-note 와 함께: 노트 텍스트 파일 ('#'로 시작하는 줄은 무시)")
    ap.add_argument("--title", help="--set-note 와 함께: 리포트 제목 (비우면 기본 제목)")
    ap.add_argument("--author", help="--set-note 와 함께: 작성자 표기")
    ap.add_argument("--ai-draft", action="store_true", help="--set-note 와 함께: AI 초안으로 표시 (검토 전)")
    ap.add_argument("--reviewed", action="store_true", help="--publish 와 함께: AI 초안을 검토했음을 확인")
    args = ap.parse_args()

    if args.month:
        build(_supabase(), args.month)
    elif args.all:
        build_all(_supabase())
    elif args.show:
        show(args.show)
    elif args.set_note:
        if not args.file:
            raise SystemExit("--set-note 에는 --file 이 필요합니다.")
        set_note(args.set_note, args.file, args.ai_draft, args.title, args.author)
    elif args.publish:
        publish(args.publish, args.reviewed)
    elif args.unpublish:
        unpublish(args.unpublish)
    elif args.reindex:
        write_index()
        print("index.ts 를 다시 생성했습니다.")


if __name__ == "__main__":
    main()
