"""
자동 칼럼·노트 공용 가드 (DB 접근 없음, 네트워크 없음).

write_weekly_column.py --auto 와 monthly_report_builder.py --auto-publish 가 함께 씁니다.
LLM 이 쓴 글을 발행하기 전에, 글이 '집계 payload 에 있는 사실'만 담았는지 코드로 검증합니다.

검증 항목 (verify_text):
  - 금지어(FORBIDDEN_WORDS) · 원인 단정/전망 표현(CAUSAL_PATTERNS)
  - 개인 이름(denylist: 그 기간 공고 행에서 뽑은 채무자·관재인·담당자 이름)
  - 본문의 모든 숫자가 payload 숫자 집합(allowed_numbers)에 있는지 — 만·억 단위 환산 포함
  - 사건번호는 payload 에 그대로 있는지
  - 글자 수(공백 제외) · 문단 수 · 마크다운 기호 · 마스킹 잔여(○○○)
그 다음 LLM 교차 검증(llm_factcheck)으로 비교·순위·법원명처럼 숫자가 아닌 주장을 한 번 더 봅니다.
둘 다 통과해야 발행합니다. max_attempts 안에 통과하지 못하면 GuardFailed 를 던집니다(발행 보류).

자체 점검 (네트워크 불필요):
  python scripts/column_guard.py --selftest
"""
import os
import re
import sys
import json
import argparse

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# ── 규칙 ─────────────────────────────────────────────────────────────

FORBIDDEN_WORDS = [
    "낙찰가율", "경쟁률", "수익률", "투자 기회", "주목", "추천", "저렴",
    "블루오션", "노하우", "유망", "기회",
]

# 원인 단정·전망 표현. 하나라도 걸리면 문제로 본다.
CAUSAL_PATTERNS = [
    r"때문", r"영향으로", r"영향을 (?:미|받)", r"로 보입니다", r"것으로 보",
    r"추정", r"전망", r"예상됩니다", r"회복세", r"활발",
]
_CAUSAL_RE = [re.compile(p) for p in CAUSAL_PATTERNS]

# 두 스크립트의 작성 프롬프트가 공유하는 규칙 문단 (단일 출처).
RULES_BLOCK = """반드시 지킬 것:
1. 집계 데이터(JSON)에 있는 사실만 씁니다. 데이터에 없는 숫자·법원·분야·기간·비교·배경 설명을 만들지 않습니다. 비율·배수·차이를 직접 계산하지 말고, 데이터에 적힌 값만 그대로 옮깁니다. 금액은 데이터의 '표기' 값이 있으면 그 표기를 그대로 씁니다.
2. 원인을 설명하지 않습니다. "~때문", "~영향으로", "~로 보입니다", "~것으로 보인다", "추정", "전망", "예상" 같은 표현을 쓰지 않습니다. 조언·권유·평가·전망을 쓰지 않습니다.
3. 다음 낱말은 쓰지 않습니다: 낙찰가율, 경쟁률, 수익률, 투자 기회, 주목, 추천, 저렴, 블루오션, 노하우, 유망, 기회.
4. 사람 이름을 쓰지 않습니다(채무자·채권자·파산관재인·담당자 등). 데이터에서 '○○○'로 가려진 자리는 문장에서 아예 빼고 씁니다. '○○○'를 옮겨 적지 않습니다. 법인명은 건수를 설명할 때 한 번까지만 씁니다.
5. 데이터의 한계를 한 문장 이상 밝힙니다. 예: 금액이 확인된 공고는 일부라는 점, 사건 묶음은 제목에 사건번호가 있는 공고만 잡힌다는 점, 낙찰 결과는 수집하지 않는다는 점, 요약 추출에 실패한 공고 비율.
6. 문체는 담담한 정보 전달체, '~입니다' 체입니다. 과장·수식어·감탄 없이 씁니다. 머리말·소제목·글머리표·마크다운 기호(#, *, -, |)를 쓰지 않습니다.
7. 문단은 빈 줄로 구분합니다. 문단 안에서는 줄을 바꾸지 않습니다."""

# ── 이름 처리 ─────────────────────────────────────────────────────────

_CORP_MARKERS = re.compile(r"주식회사|㈜|\(주\)|유한|법인|조합|회사|은행|공사|재단|산업|상사|건설")
_CORP_PREFIX = r"(?!주식회사|유한회사|유한책임|합자회사|합명회사|㈜|\(주\)|법인)"

# 역할어 뒤에 붙은 2~4자 한글을 이름으로 본다. '망'은 '전망·통신망' 같은 낱말 속 글자를 피하기 위해
# 앞에 한글이 없고 뒤에 공백(또는 콜론)이 반드시 있을 때만 역할어로 본다.
_PERSON_ROLE = r"(채무자|채권자|파산자|(?<![가-힣])망(?=[\s:：])|소유자|상속인|매도인|임차인)"
_STAFF_ROLE = r"(변호사|파산관재인|관리인|담당자)"
# 역할어가 연달아 오는 경우("파산관재인 변호사 김영희", "관리인 법무사 ○○○")를 위해 두 번째 역할어를 건너뛴다.
_STAFF_CHAIN = r"(?:[\s:：]*(?:변호사|법무사|회계사|세무사|파산관재인|관리인))*"
_MASK_PERSON = re.compile(_PERSON_ROLE + r"[\s:：]*" + _CORP_PREFIX + r"[가-힣]{2,4}")
_MASK_STAFF = re.compile(_STAFF_ROLE + _STAFF_CHAIN + r"[\s:：]*" + _CORP_PREFIX + r"[가-힣]{2,4}")
_FIND_PERSON = re.compile(_PERSON_ROLE + r"[\s:：]*([가-힣]{2,4})(?![가-힣])")
_FIND_STAFF = re.compile(_STAFF_ROLE + _STAFF_CHAIN + r"[\s:：]*([가-힣]{2,4})(?![가-힣])")

# 역할어 뒤에 오지만 이름이 아닌 흔한 낱말. (오탐 = 멀쩡한 글이 막힘, 누락 = 이름 노출. 누락 쪽이 더 나쁘므로 최소한만 둔다.)
NAME_STOPWORDS = {
    "소유", "재산", "상속", "지분", "명의", "법인", "회사", "주식", "주식회사", "유한회사", "부동산", "채무자",
    "채권자", "파산", "회생", "사건", "기타", "일체", "토지", "건물", "차량", "물건", "재고", "비품", "및",
    "합계", "전부", "각각", "해당", "소재", "공장", "점유", "임차인", "세입자", "농업", "법인택시", "미상",
    "없음", "확인", "문의", "연락", "연락처", "전화", "이메일", "담당", "담당자", "사무관", "관재인", "관리인",
    "변호사", "법무", "법률", "사무소", "사무실", "법원", "지원", "본원", "파산과", "회생과", "민사과", "총무과",
    "계장", "주사", "주사보", "서기", "서기관", "실무관", "참여관", "사무국", "경매계", "공고", "일반", "개인",
    "본인", "대표", "대표자", "대표이사", "이사", "감사", "외", "등", "겸", "인의", "망인", "고인", "이하", "상기",
    "위와", "아래", "다음", "별지", "목록", "기재", "표시", "생략", "참조", "매각", "매수", "매도", "입찰", "경매",
    "공매", "임대", "임차", "보증금", "권리", "관계", "지위", "역할", "성명", "이름", "주소", "거주", "생년",
    "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북",
    "전남", "경북", "경남", "제주", "수원", "창원", "의정부", "춘천", "청주", "전주", "지방", "회생법원",
}
_ORG_SUFFIXES = ("법원", "지방법원", "회생법원", "과", "팀", "부", "실", "국", "처", "계", "청", "시", "군", "읍", "면")


def mask_person_names(text):
    """역할어(채무자·채권자·파산자·망·소유자·상속인·매도인·임차인·변호사·파산관재인·관리인·담당자) 뒤의
    2~4자 한글 이름을 '○○○'로 가린다. 프롬프트에 들어가는 모든 제목·매각 대상·기관 문자열에 적용한다."""
    if not text:
        return text or ""
    t = _MASK_PERSON.sub(lambda m: f"{m.group(1)} ○○○", str(text))
    t = _MASK_STAFF.sub(lambda m: f"{m.group(1)} ○○○", t)
    return t


def _looks_like_name(tok: str) -> bool:
    if not re.fullmatch(r"[가-힣]{2,4}", tok or ""):
        return False
    if tok in NAME_STOPWORDS:
        return False
    if len(tok) >= 3 and any(tok.endswith(s) for s in _ORG_SUFFIXES):
        return False
    return True


def _names_in(text: str) -> set:
    names = set()
    text = text or ""
    for m in _FIND_PERSON.finditer(text):
        tok = m.group(2)
        window = text[m.start(): m.end() + 12]
        if _CORP_MARKERS.search(window):        # 법인 채무자는 개인이 아니다
            continue
        if _looks_like_name(tok):
            names.add(tok)
    for m in _FIND_STAFF.finditer(text):
        tok = m.group(2)
        if _looks_like_name(tok):
            names.add(tok)
    return names


def _manager_names(value: str) -> set:
    """'작성자' 필드 값 중 2~4자 한글 이름처럼 보이는 토큰."""
    names = set()
    for tok in re.split(r"[\s,/()·:：|]+", value or ""):
        tok = tok.strip()
        if _looks_like_name(tok) and not _CORP_MARKERS.search(tok):
            names.add(tok)
    return names


def person_denylist(rows) -> set:
    """공고 행(title, sale_org, manager, ai_summary[:400])에서 개인 이름 후보를 뽑는다.
    반환값의 이름이 본문에 나오면 verify_text 가 막는다. 2자 미만은 버린다."""
    names = set()
    for r in rows or []:
        if not isinstance(r, dict):
            continue
        for key in ("title", "sale_org"):
            names |= _names_in(str(r.get(key) or ""))
        names |= _names_in(str(r.get("ai_summary") or "")[:400])
        names |= _manager_names(str(r.get("manager") or ""))
    return {n for n in names if len(n) >= 2}


def _name_in_text(name: str, text: str) -> bool:
    # 3자 이상은 조사가 붙어도 잡히게 부분 일치, 2자는 낱말 경계로만 (일반 낱말 오탐을 줄인다).
    if len(name) >= 3:
        return name in text
    return re.search(r"(?<![가-힣])" + re.escape(name) + r"(?![가-힣])", text) is not None


# ── 숫자 처리 ─────────────────────────────────────────────────────────

CASE_NO_RE = re.compile(r"20\d{2}[가-힣]+\d+")


def _norm(tok: str) -> str:
    """'4,700' → '4700', '38.50' → '38.5', '95.0' → '95', '08' → '8'."""
    tok = str(tok).replace(",", "").strip()
    if not tok:
        return tok
    if "." in tok:
        try:
            f = float(tok)
        except ValueError:
            return tok
        if f == int(f):
            return str(int(f))
        return f"{f:f}".rstrip("0").rstrip(".")
    try:
        return str(int(tok))
    except ValueError:
        return tok


def _add_number(allowed: set, n):
    """정수 n 과, 글에서 흔히 쓰는 환산값(만·천만·억, 억 뒤의 만 단위, 만 뒤의 원 단위, 반올림값)을 넣는다."""
    n = abs(int(n))
    allowed.add(str(n))
    if n < 10_000:
        return
    allowed.add(str(n // 10_000))                       # 4,228,161 → 422(만)
    allowed.add(str(round(n / 10_000)))                 # 5,025,901 → 503(만) 반올림
    allowed.add(str((n % 100_000_000) // 10_000))       # 147,000,000 → 4700 (1억 4,700만)
    allowed.add(str(n % 10_000))                        # 4,228,161 → 8161 (422만 8,161원)
    allowed.add(str(n // 10_000_000))                   # 50,000,000 → 5(천만)
    if n >= 100_000_000:
        allowed.add(str(n // 100_000_000))              # 1,700,000,000 → 17(억)
        allowed.add(str(round(n / 100_000_000)))
        allowed.add(_norm(f"{n / 100_000_000:.1f}"))    # 170,000,000 → 1.7
        allowed.add(_norm(f"{n / 100_000_000:.2f}"))    # 588,000,000 → 5.88
        allowed.add(str((n % 100_000_000) // 1_000_000))  # 8억 4천만 → 40 은 아래 천만 단위로
        allowed.add(str((n % 100_000_000) // 10_000_000))  # 840,000,000 → 4 (8억 4천만)


def allowed_numbers(payload) -> set:
    """payload 안의 모든 숫자(정수·실수·문자열 속 숫자)와 그 환산값. 0~12 는 항상 허용."""
    allowed = {str(i) for i in range(13)}

    def walk(v):
        if isinstance(v, bool):
            return
        if isinstance(v, int):
            _add_number(allowed, v)
        elif isinstance(v, float):
            allowed.add(_norm(str(abs(v))))
            allowed.add(str(int(abs(v))))
            allowed.add(str(round(abs(v))))
            _add_number(allowed, int(abs(v)))
        elif isinstance(v, str):
            s = re.sub(r"(?<=\d),(?=\d)", "", v)
            for tok in re.findall(r"\d+(?:\.\d+)?", s):
                allowed.add(_norm(tok))
                if "." in tok:
                    allowed.add(str(int(float(tok))))
                    allowed.add(str(round(float(tok))))
                else:
                    _add_number(allowed, int(tok))
        elif isinstance(v, dict):
            for k, x in v.items():
                walk(k)
                walk(x)
        elif isinstance(v, (list, tuple, set)):
            for x in v:
                walk(x)

    walk(payload)
    return allowed


def extract_case_numbers(text: str) -> set:
    return set(CASE_NO_RE.findall(text or ""))


def extract_numbers(text: str) -> set:
    """본문의 숫자 토큰(쉼표 제거, 소수는 한 토큰). 사건번호 속 숫자는 뺀다(따로 검사)."""
    t = CASE_NO_RE.sub(" ", text or "")
    t = re.sub(r"(?<=\d),(?=\d)", "", t)
    return {_norm(tok) for tok in re.findall(r"\d+(?:\.\d+)?", t)}


def _numkey(s: str):
    try:
        return (0, float(s))
    except ValueError:
        return (1, s)


def _snippet(text: str, m) -> str:
    a, b = max(0, m.start() - 8), min(len(text), m.end() + 8)
    return text[a:b].replace("\n", " ")


# ── 검증 ─────────────────────────────────────────────────────────────

def verify_text(text, payload, denylist, *, min_chars, max_chars, min_paras=3, max_paras=4) -> list:
    """빈 리스트 = 통과. 각 항목은 LLM 에 그대로 돌려줄 수 있는 한국어 문제 설명."""
    problems = []
    text = (text or "").replace("\r\n", "\n").strip()
    if not text:
        return ["본문이 비어 있습니다"]

    for w in FORBIDDEN_WORDS:
        if w in text:
            problems.append(f"금지어 사용: '{w}'")
    for pat in _CAUSAL_RE:
        m = pat.search(text)
        if m:
            problems.append(f"원인 단정·전망 표현: '…{_snippet(text, m)}…' (사실만 쓰고 원인·전망은 빼세요)")
    for name in sorted(denylist or ()):
        if _name_in_text(name, text):
            problems.append(f"개인 이름 포함: '{name}' (이름 없이 쓰세요)")

    allowed = allowed_numbers(payload)
    extra = sorted(extract_numbers(text) - allowed, key=_numkey)
    if extra:
        problems.append("집계 데이터에 없는 숫자: " + ", ".join(extra) + " (직접 계산하지 말고 데이터의 값만 쓰세요)")

    payload_text = json.dumps(payload, ensure_ascii=False).replace(" ", "")
    payload_cases = set(CASE_NO_RE.findall(payload_text))
    bad_cases = sorted(extract_case_numbers(text) - payload_cases)
    if bad_cases:
        problems.append("집계 데이터에 없는 사건번호: " + ", ".join(bad_cases))

    n_chars = len(re.sub(r"\s", "", text))
    if n_chars < min_chars:
        problems.append(f"본문이 짧습니다: 공백 제외 {n_chars}자 (최소 {min_chars}자)")
    elif n_chars > max_chars:
        problems.append(f"본문이 깁니다: 공백 제외 {n_chars}자 (최대 {max_chars}자)")

    paras = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    if not (min_paras <= len(paras) <= max_paras):
        problems.append(f"문단 수 {len(paras)}개 (허용 {min_paras}~{max_paras}개, 문단은 빈 줄로 구분)")

    for line in text.splitlines():
        s = line.lstrip()
        if s and (s[0] in "#*-|" or re.match(r"\d+[.)]\s", s)):
            problems.append(f"마크다운·목록 기호로 시작하는 줄: '{s[:20]}'")
            break
    if "**" in text:
        problems.append("마크다운 강조(**) 사용")
    if "○○" in text:
        problems.append("마스킹 기호(○○○)가 본문에 남아 있음 (이름 자리는 문장에서 빼고 쓰세요)")
    return problems


def verify_title(title, payload, denylist, max_len=40) -> list:
    problems = []
    title = (title or "").strip()
    if not title:
        return ["제목이 비어 있습니다"]
    if "\n" in title:
        problems.append("제목에 줄바꿈이 있습니다")
    if len(title) > max_len:
        problems.append(f"제목이 깁니다: {len(title)}자 (최대 {max_len}자)")
    for w in FORBIDDEN_WORDS:
        if w in title:
            problems.append(f"제목에 금지어: '{w}'")
    for pat in _CAUSAL_RE:
        if pat.search(title):
            problems.append(f"제목에 원인 단정·전망 표현: '{title}'")
            break
    for name in sorted(denylist or ()):
        if _name_in_text(name, title):
            problems.append(f"제목에 개인 이름: '{name}'")
    extra = sorted(extract_numbers(title) - allowed_numbers(payload), key=_numkey)
    if extra:
        problems.append("제목에 집계 데이터에 없는 숫자: " + ", ".join(extra))
    if "○○" in title or any(ch in title for ch in "#*|"):
        problems.append("제목에 마스킹 기호나 마크다운 기호가 있습니다")
    return problems


# ── LLM 호출 ─────────────────────────────────────────────────────────

def _parse_json_object(content: str) -> dict:
    content = (content or "").strip()
    if content.startswith("```"):
        content = re.sub(r"^```[a-zA-Z]*\s*|\s*```$", "", content)
    try:
        data = json.loads(content)
    except Exception:
        m = re.search(r"\{.*\}", content, re.S)
        data = json.loads(m.group(0)) if m else {}
    return data if isinstance(data, dict) else {}


def _normalize_body(body) -> str:
    if isinstance(body, (list, tuple)):
        body = "\n\n".join(str(p) for p in body)
    body = str(body or "").replace("\r\n", "\n").replace("\\n", "\n")
    body = "\n".join(line.strip() for line in body.split("\n")).strip()
    if "\n\n" not in body and "\n" in body:      # 한 줄바꿈으로만 나눈 문단을 빈 줄 구분으로
        body = body.replace("\n", "\n\n")
    return re.sub(r"\n{3,}", "\n\n", body)


def llm_generate(client, system_prompt, payload, feedback=None, model="gpt-4o-mini", previous=None, attempt=1) -> dict:
    """{"title": ..., "body": ...} 를 돌려준다. feedback(이전 초안 문제점 목록)이 있으면 수정을 요구한다."""
    user = json.dumps(payload, ensure_ascii=False, indent=1)
    if feedback:
        user += "\n\n이전 초안의 문제점:\n" + "\n".join(f"- {p}" for p in feedback)
        if previous:
            user += "\n\n이전 초안:\n" + json.dumps(previous, ensure_ascii=False, indent=1)
        user += (
            "\n\n위 문제점을 모두 고쳐 완전히 새로 작성하세요(이전 초안을 그대로 되풀이하지 마세요). "
            "지적된 숫자·표현·이름은 본문에서 빼거나 집계 데이터에 적힌 값으로 바꿉니다. 비율·배수·차이는 "
            "집계 데이터에 미리 계산된 값(예: 배수, 증감)만 옮기고 직접 계산하지 마세요. "
            "'본문이 짧습니다'가 있으면 데이터에 있는 다른 사실(법원별 차이, 금액 확인 비율, 사건 묶음, 요약 실패 비율, "
            "제목만으로 물건을 알기 어려운 점)을 한 문단 더 써서 분량을 채웁니다. "
            "반드시 {\"title\": ..., \"body\": ...} JSON 으로만 답합니다."
        )
    resp = client.chat.completions.create(
        model=model,
        temperature=0.2 if attempt <= 1 else 0.7,   # 재시도는 같은 글을 되풀이하지 않도록 온도를 올린다
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user},
        ],
    )
    data = _parse_json_object(resp.choices[0].message.content or "")
    return {
        "title": str(data.get("title") or "").strip().replace("\n", " "),
        "body": _normalize_body(data.get("body")),
    }


FACTCHECK_PROMPT = """당신은 데이터 글의 사실 검증자입니다. 글을 고치지 않고, 집계 데이터와 '어긋나는' 문장만 찾습니다.

'집계_데이터'(JSON)와 그 데이터만으로 쓴 '본문'을 받습니다. 본문의 숫자 자체는 이미 코드로 검증됐습니다. 당신은 문장마다 (1) 문장이 주장하는 값과 (2) 데이터에 적힌 값을 나란히 적고, 둘이 어긋나는지 판정합니다.

절차: 본문의 각 문장에 대해 다음 항목을 만듭니다.
- sentence: 문장 인용
- claim: 문장이 주장하는 사실을 값으로 요약 (예: "대전회생법원 51건, 순위 4→2")
- data: 그 주장을 뒷받침하거나 반박하는 데이터 항목의 키와 값 (예: "법원별.top[1]: n=51, prev_rank=4, rank=2")
- conflict: claim 과 data 가 어긋나면 true, 같은 뜻이면 false
- reason: conflict 가 true 일 때만, 무엇이 다른지 한 문장

conflict=true 로 판정할 것:
1. 데이터와 반대인 비교·순위 (데이터에서 A>B 인데 "A가 B보다 적다", rank/prev_rank 와 다른 순위 변화, 최댓값이 아닌 항목을 "가장 많다"고 쓴 경우)
2. 숫자와 대상이 뒤바뀐 경우 (다른 법원·다른 공고의 값을 붙임, 만·억 환산이 틀린 경우)
3. 원인 설명(~때문에, ~영향으로, ~로 보인다), 전망, 조언·권유, 평가(좋다·저렴하다·주목)
4. 사람 이름
5. 집계 데이터에 전혀 없는 사실 (다른 기간, 배경 지식, 일반론, 데이터에 없는 법원·분야·물건 설명)

conflict=false 인 것 (문제가 아닙니다):
- 데이터의 두 값을 비교해 "늘었다/줄었다/많다/적다/두 배/절반/가장 많다/1위·2위/4위에서 2위로"라고 쓴 것 — 데이터의 값이 그 비교를 뒷받침하면 정당합니다
- rank, prev_rank, diff, diff_pct, pct, 배수, 증감 같은 미리 계산된 값을 문장으로 옮긴 것
- 1700000000 을 "17억 원"으로, 4000000 을 "400만 원"으로 쓴 것처럼 단위만 바꾼 것 (같은 값입니다)
- 앞으로의 입찰 기일을 "예정"이라고 쓴 것
- 데이터의 한계를 밝히는 문장 (금액이 확인된 공고는 일부, 낙찰 결과 미수집, 요약 추출 실패 비율 등)
- 데이터 키를 자연어로 바꿔 쓴 것 (median → 중앙값, priced_n → 금액이 확인된 공고, summary_fallback → 요약 추출 실패)
- 문체·길이·표현의 어색함

데이터가 문장을 뒷받침하면 반드시 conflict=false 입니다. 확실하지 않으면 conflict=false 로 둡니다.
반드시 JSON 으로만 답합니다: {"checks": [{"sentence": "...", "claim": "...", "data": "...", "conflict": false, "reason": ""}, ...]}"""


def llm_factcheck(client, body, payload, model=None) -> list:
    """LLM 교차 검증. 문장별 claim/data 쌍을 받아 conflict=true 인 것만 문제로 돌려준다. 빈 리스트 = 통과.
    모델은 GUARD_CHECK_MODEL 환경변수로 바꿀 수 있다 (기본 gpt-4o-mini)."""
    model = model or os.getenv("GUARD_CHECK_MODEL", "gpt-4o-mini")
    resp = client.chat.completions.create(
        model=model,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": FACTCHECK_PROMPT},
            {"role": "user", "content": json.dumps({"집계_데이터": payload, "본문": body}, ensure_ascii=False, indent=1)},
        ],
    )
    data = _parse_json_object(resp.choices[0].message.content or "")
    checks = data.get("checks")
    if not isinstance(checks, list):
        # 구조가 다르면 옛 형식(problems 목록)으로 해석한다.
        raw = data.get("problems") or []
        if isinstance(raw, str):
            raw = [raw]
        return [str(p).strip() for p in raw if str(p).strip()]
    problems = []
    for c in checks:
        if not isinstance(c, dict):
            continue
        conflict = c.get("conflict")
        if conflict is True or str(conflict).strip().lower() == "true":
            sentence = str(c.get("sentence") or "").strip()
            claim = str(c.get("claim") or "").strip()
            datum = str(c.get("data") or "").strip()
            reason = str(c.get("reason") or "").strip()
            problems.append(f"{sentence} — 주장: {claim} / 데이터: {datum} / {reason}".strip(" /"))
    return problems


class GuardFailed(Exception):
    """max_attempts 안에 검증을 통과하지 못했다. problems / last_draft / attempts_log 를 들고 있다."""

    def __init__(self, problems, last_draft, attempts_log=None):
        super().__init__("; ".join(problems)[:500] if problems else "검증 실패")
        self.problems = list(problems or [])
        self.last_draft = last_draft or {}
        self.attempts_log = list(attempts_log or [])


def generate_with_guard(client, system_prompt, payload, denylist, *, min_chars, max_chars,
                        max_attempts=3, model="gpt-4o-mini", log=print):
    """작성 → 코드 검증 → LLM 교차 검증을 max_attempts 회 반복. (title, body, attempts_log) 또는 GuardFailed."""
    feedback, previous, attempts_log, problems = None, None, [], []
    for attempt in range(1, max_attempts + 1):
        draft = llm_generate(client, system_prompt, payload, feedback=feedback, previous=previous, model=model, attempt=attempt)
        title, body = draft["title"], draft["body"]
        problems = verify_title(title, payload, denylist)
        problems += verify_text(body, payload, denylist, min_chars=min_chars, max_chars=max_chars)
        if not problems:
            problems = [f"[교차검증] {p}" for p in llm_factcheck(client, body, payload, model=model)]
        n_chars = len(re.sub(r"\s", "", body))
        attempts_log.append({"attempt": attempt, "title": title, "chars": n_chars, "problems": list(problems)})
        if log:
            state = "통과" if not problems else f"문제 {len(problems)}건"
            log(f"  [시도 {attempt}/{max_attempts}] {n_chars}자 · {state}")
            for p in problems:
                log(f"      - {p}")
        if not problems:
            return title, body, attempts_log
        feedback, previous = problems, draft
    raise GuardFailed(problems, previous, attempts_log)


def auto_publish_disabled() -> bool:
    """환경변수 AUTO_PUBLISH_DISABLED=true 면 자동 발행을 전부 건너뛴다 (GitHub 저장소 변수로 끈다)."""
    return os.getenv("AUTO_PUBLISH_DISABLED", "").strip().lower() in ("1", "true", "yes", "on")


def won_label(n) -> str:
    """4228161 → '422만 8,161원', 1700000000 → '17억 원', 787500 → '78만 7,500원'. (monthlyReport.ts formatWon 과 같은 규칙)"""
    try:
        n = int(n)
    except (TypeError, ValueError):
        return "-"
    if n <= 0:
        return "-"
    eok, rest = divmod(n, 100_000_000)
    man, won = divmod(rest, 10_000)
    parts = []
    if eok:
        parts.append(f"{eok:,}억")
    if man:
        parts.append(f"{man:,}만")
    if won:
        parts.append(f"{won:,}")
    if not parts:
        return f"{n:,}원"
    return f"{' '.join(parts)}원" if won else f"{' '.join(parts)} 원"


def mask_payload(value, drop_keys=("sale_org", "manager")):
    """payload 의 모든 문자열에 mask_person_names 를 적용하고, 원본 기관·담당자 필드 키는 버린다."""
    if isinstance(value, dict):
        return {
            k: mask_payload(v, drop_keys)
            for k, v in value.items()
            if not any(d in str(k).lower() for d in drop_keys)
        }
    if isinstance(value, (list, tuple)):
        return [mask_payload(v, drop_keys) for v in value]
    if isinstance(value, str):
        return mask_person_names(value)
    return value


# ── 자체 점검 ─────────────────────────────────────────────────────────

def _selftest() -> int:
    payload = {
        "주차": "8월 4주차",
        "기간": "2026-08-24 ~ 2026-08-28",
        "이번주_총건수": 93,
        "직전4주_주당평균": 95.5,
        "법원별_건수": {"서울회생법원": 30, "대전회생법원": 14, "춘천지방법원": 6},
        "법원별_직전4주_주당평균": {"서울회생법원": 41.2, "대전회생법원": 8.2},
        "한사건_다건공고": [{"법원_사건번호": "춘천지방법원 2026하단1154", "공고건수": 3}],
        "제목에_사건번호_표기": "9/93건",
        "금액_확인_공고": {"건수": 41, "총건수": 93, "비율": "44.1%"},
        "최고가_3건": [
            {"법원": "서울회생법원", "제목": "부동산 매각 공고", "최저매각가": 1200000000, "최저매각가_표기": "12억 원"},
            {"법원": "수원회생법원", "제목": "채무자 ○○○ 소유 아파트 매각", "최저매각가": 147000000, "최저매각가_표기": "1억 4,700만 원"},
        ],
    }
    rows = [
        {"title": "채무자 홍길동 소유 부동산 매각공고", "sale_org": "파산관재인 변호사 김영희", "manager": "박철수", "ai_summary": "1. 매각 대상: 채무자 홍길동 소유 아파트 2. 망 이순신 상속재산"},
        {"title": "주식회사 대성산업 파산재단 자산매각", "sale_org": "채무자 주식회사 대성산업", "manager": "서울회생법원 파산과", "ai_summary": None},
    ]
    denylist = person_denylist(rows)
    expected_names = {"홍길동", "김영희", "박철수", "이순신"}
    ok = True

    print("[1] person_denylist:", sorted(denylist))
    if not expected_names <= denylist:
        print("    FAIL: 빠진 이름", expected_names - denylist)
        ok = False
    if "대성산업" in denylist or "파산과" in denylist or "서울회생법원" in denylist:
        print("    FAIL: 법인·부서명이 이름으로 잡힘")
        ok = False

    masked = mask_person_names("채무자 홍길동 소유 부동산 / 파산관재인 변호사 김영희 / 전망 좋은 토지 / 채무자 주식회사 대성산업")
    print("[2] mask_person_names:", masked)
    if "홍길동" in masked or "김영희" in masked or "전망 ○○○" in masked or "대성산업" not in masked:
        print("    FAIL: 마스킹 결과가 기대와 다름")
        ok = False

    allowed = allowed_numbers(payload)
    print("[3] allowed_numbers 일부:", sorted((n for n in allowed if n in {"93", "95.5", "12", "4700", "1.2", "44.1", "2026", "8"}), key=_numkey))
    for must in ("93", "95.5", "41", "12", "4700", "44.1", "2026", "1154"):
        if must not in allowed:
            print("    FAIL: 허용 숫자 누락", must)
            ok = False

    bad = (
        "이번 주 93건은 직전 4주 평균 95.5건과 비슷하지만, 대전회생법원 14건은 법인파산 증가 때문에 늘어난 것으로 보입니다. "
        "서울회생법원은 30건으로 직전 4주 평균 41.2건보다 적었고, 채무자 홍길동 소유 부동산이 12억 원에 나왔습니다.\n\n"
        "최저가가 확인된 공고는 93건 중 41건이고 중앙값은 472만 원입니다. 이런 물건은 투자 기회로 주목받고 있어 낙찰가율이 높습니다. "
        "춘천지방법원 2026하단1154 사건에서 3건이 나왔고, 대구회생법원 2025하단99999 사건도 있습니다.\n\n"
        "- 부동산이 30건으로 가장 많았습니다. 자세한 내용은 별도 문의 바랍니다."
    )
    problems = verify_text(bad, payload, denylist, min_chars=100, max_chars=800)
    print("[4] 나쁜 글 →", len(problems), "건")
    for p in problems:
        print("    -", p)
    kinds = "\n".join(problems)
    for must in ("금지어", "원인 단정", "개인 이름 포함: '홍길동'", "집계 데이터에 없는 숫자: 472", "없는 사건번호", "마크다운"):
        if must not in kinds:
            print("    FAIL: 잡혀야 할 문제가 없음 →", must)
            ok = False

    good = (
        "이번 주 수집 공고는 93건으로 직전 4주 주당 평균 95.5건과 비슷한 수준입니다. 법원별로는 서울회생법원 30건, 대전회생법원 14건, "
        "춘천지방법원 6건 순이며, 서울회생법원은 직전 4주 주당 평균 41.2건보다 적고 대전회생법원은 8.2건보다 많습니다.\n\n"
        "금액이 확인된 공고는 93건 중 41건(44.1%)입니다. 가장 큰 건은 서울회생법원의 부동산 매각 공고로 최저매각가 12억 원이고, "
        "수원회생법원의 아파트 매각 공고는 1억 4,700만 원입니다. 나머지 공고는 금액 없이 집계에 들어가 있습니다.\n\n"
        "제목에 사건번호가 적힌 공고는 93건 중 9건이며, 춘천지방법원 2026하단1154 사건에서 3건이 나뉘어 공고됐습니다. "
        "사건 단위 묶음은 제목에 사건번호가 있는 공고에서만 잡히고, 로옥션은 낙찰 결과를 수집하지 않습니다."
    )
    problems = verify_text(good, payload, denylist, min_chars=100, max_chars=800)
    print("[5] 좋은 글 →", "통과" if not problems else problems)
    if problems:
        ok = False

    tp = verify_title("서울 30건으로 줄고 대전 14건, 충전기 2,940대", payload, denylist)
    print("[6] 제목(집계에 없는 2,940) →", tp)
    if not tp:
        print("    FAIL: 제목의 없는 숫자를 잡지 못함")
        ok = False
    tp = verify_title("서울 30건, 대전 14건으로 평균의 두 배", payload, denylist)
    print("[7] 제목(정상) →", "통과" if not tp else tp)
    if tp:
        ok = False

    if won_label(4228161) != "422만 8,161원" or won_label(1700000000) != "17억 원" or won_label(787500) != "78만 7,500원":
        print("    FAIL: won_label", won_label(4228161), won_label(1700000000), won_label(787500))
        ok = False

    print("\nSELFTEST", "PASS" if ok else "FAIL")
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description="자동 칼럼·노트 공용 가드 (자체 점검)")
    ap.add_argument("--selftest", action="store_true", help="네트워크 없이 검증 규칙을 점검")
    args = ap.parse_args()
    if args.selftest:
        raise SystemExit(_selftest())
    ap.print_help()


if __name__ == "__main__":
    main()
