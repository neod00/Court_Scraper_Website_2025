"""
공고 첨부문서 원문 추출 공용 모듈
==================================

법원 공고 첨부파일(PDF·HWP)을 내려받아 본문 텍스트를 뽑고, 읽기 좋게 정리한 뒤
개인 이름·주민등록번호를 가려서 돌려준다. 네트워크 호출 외의 부작용은 없다.

쓰는 곳:
  - scripts/attachment_text_extractor.py : content_text 백필·일일 추출
  - scripts/ai_report_generator.py        : 요약 생성 시 같은 다운로드/추출 로직 재사용

저장 규칙 (src/lib/noticeText.ts 의 hasSubstantialText 와 반드시 일치):
  - court_notices.content_text 에는 '마스킹된 원문'만 저장한다.
  - 공백 제외 MIN_STORE_CHARS 자 미만이면 저장하지 않고 NULL 로 둔다.
    → content_text 가 NULL 이 아니면 곧 '읽을 만한 원문이 있다'는 뜻이 되어,
      sitemap 등 목록 쿼리가 본문을 내려받지 않고도 필터할 수 있다(egress 절약).
"""

from __future__ import annotations

import io
import os
import re
import sys
import time
import zlib
import struct
from typing import Optional
from urllib.parse import quote

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from column_guard import NAME_STOPWORDS, _ORG_SUFFIXES  # noqa: E402  (stdlib 만 import 하는 모듈)

# src/lib/noticeText.ts MIN_TEXT_CHARS 와 같은 값이어야 한다.
MIN_STORE_CHARS = 400
MAX_STORE_CHARS = 20000

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


# ── 1. 다운로드 ───────────────────────────────────────────────────────

def court_file_url(server_filename: str, original_filename: str, path: str = "011") -> str:
    """법원 파일 서버 URL. 원본 파일명은 EUC-KR 퍼센트 인코딩 (src/app/api/download/route.ts 와 동일)."""
    try:
        encoded_original = "".join(f"%{b:02X}" for b in original_filename.encode("euc-kr"))
    except (UnicodeEncodeError, UnicodeDecodeError):
        encoded_original = quote(original_filename)
    return (
        f"https://file.scourt.go.kr/AttachDownload?path={path}"
        f"&file={quote(server_filename)}&downFile={encoded_original}"
    )


def download_attachment(
    server_filename: str,
    original_filename: str,
    path: str = "011",
    retries: int = 3,
    backoff: tuple = (5, 15, 40),
    log=print,
) -> Optional[bytes]:
    """첨부파일 바이트를 돌려준다. 실패하면 None.

    GitHub Actions(해외 IP)에서는 법원 파일 서버가 연결을 자주 끊는다
    ('Remote end closed connection', 2026-10 로그 기준 22건 중 15건).
    그래서 연결 오류는 간격을 늘려 가며 재시도한다. HTTP 4xx 는 재시도하지 않는다.
    """
    url = court_file_url(server_filename, original_filename, path)
    for attempt in range(retries):
        try:
            r = requests.get(url, verify=False, timeout=40, headers={"User-Agent": USER_AGENT})
            if r.status_code == 200 and len(r.content) >= 100:
                return r.content
            if 400 <= r.status_code < 500:
                log(f"    다운로드 실패 HTTP {r.status_code} (재시도 안 함)")
                return None
            log(f"    다운로드 응답 이상 HTTP {r.status_code}, {len(r.content)} bytes")
        except requests.RequestException as e:
            log(f"    다운로드 오류({attempt + 1}/{retries}): {type(e).__name__}")
        if attempt < retries - 1:
            time.sleep(backoff[min(attempt, len(backoff) - 1)])
    return None


# ── 2. 형식별 텍스트 추출 ─────────────────────────────────────────────

def extract_pdf_text(data: bytes) -> str:
    """텍스트 레이어가 있는 PDF 만 처리한다. 스캔 이미지 PDF 는 빈 문자열(OCR 은 유료라 여기서 하지 않음)."""
    text = ""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            text = "\n".join((p.extract_text() or "") for p in pdf.pages)
    except Exception:
        text = ""
    if len(text.strip()) >= 50:
        return text
    try:  # pdfplumber 가 못 읽는 일부 PDF 는 pymupdf 로 한 번 더
        import fitz
        with fitz.open(stream=data, filetype="pdf") as doc:
            text = "\n".join(page.get_text() for page in doc)
    except Exception:
        pass
    return text


def extract_hwp_text(data: bytes) -> str:
    """HWP 5.0 본문(BodyText/SectionN)의 문단 텍스트 레코드(HWPTAG_PARA_TEXT=67)를 읽는다."""
    try:
        import olefile
    except ImportError:
        return ""
    try:
        ole = olefile.OleFileIO(io.BytesIO(data))
    except Exception:
        return ""
    try:
        header = ole.openstream("FileHeader").read()
        compressed = bool(header[36] & 1)
        sections = sorted(
            (e for e in ole.listdir() if len(e) == 2 and e[0] == "BodyText" and e[1].startswith("Section")),
            key=lambda e: int(e[1][len("Section"):] or 0),
        )
        out = []
        for sec in sections:
            raw = ole.openstream(sec).read()
            if compressed:
                raw = zlib.decompress(raw, -15)
            i = 0
            while i + 4 <= len(raw):
                header_val = struct.unpack_from("<I", raw, i)[0]
                tag = header_val & 0x3FF
                size = (header_val >> 20) & 0xFFF
                i += 4
                if size == 0xFFF:
                    size = struct.unpack_from("<I", raw, i)[0]
                    i += 4
                if tag == 67:
                    out.append(_hwp_para_text(raw[i:i + size]))
                i += size
        return "\n".join(out)
    except Exception:
        return ""
    finally:
        ole.close()


def _hwp_para_text(chunk: bytes) -> str:
    """문단 텍스트의 제어문자(인라인/확장 컨트롤은 8 wchar 차지)를 건너뛴다."""
    chars = []
    i = 0
    n = len(chunk) // 2
    while i < n:
        c = struct.unpack_from("<H", chunk, i * 2)[0]
        if c >= 32:
            chars.append(chr(c))
            i += 1
        elif c in (9,):
            chars.append(" ")
            i += 1
        elif c in (10, 13):
            chars.append("\n")
            i += 1
        elif c in (1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23):
            i += 8
        else:
            i += 1
    return "".join(chars)


# ── 3. 정리 ──────────────────────────────────────────────────────────

_PAGE_NO = re.compile(r"^\s*[-–]\s*\d{1,3}\s*[-–]\s*$|^\s*\d{1,3}\s*/\s*\d{1,3}\s*$")


def clean_text(raw: str) -> str:
    """제어문자·페이지 번호 줄·과도한 빈 줄을 정리한다. 줄바꿈은 보존(표 행 복원에 필요)."""
    if not raw:
        return ""
    t = raw.replace("\r\n", "\n").replace("\r", "\n").replace(" ", " ").replace("　", " ")
    t = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f�]", "", t)
    # 짝 없는 서로게이트(HWP·PDF 글꼴 깨짐)는 UTF-8 로 인코딩되지 않아 DB 전송 단계에서 예외가 난다.
    t = t.encode("utf-8", "ignore").decode("utf-8")
    lines = []
    for line in t.split("\n"):
        line = re.sub(r"[ \t]+", " ", line).strip()
        if _PAGE_NO.match(line):
            continue
        lines.append(line)
    t = "\n".join(lines)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    return t


# ── 4. 개인정보 마스킹 ───────────────────────────────────────────────
# 개인 채무자·파산자·소유자·상속인·임차인 이름은 성만 남기고 가린다(김○○).
# 파산관재인·변호사 이름은 입찰 문의 대상으로 공고에 공개된 직무 정보라 가리지 않는다.
# 같은 규칙이 src/lib/noticeText.ts maskPersonNames 에 있다 — 함께 고칠 것.

_PERSON_ROLE = (
    r"(주채무자|채무자|파산자|피상속인|상속인|소유자|매도인|임차인|세입자|점유자|신청인|"
    r"연대보증인|보증인|차주|(?<![가-힣])망)"
)
_CORP_LOOKAHEAD = r"(?!주식회사|유한회사|유한책임|합자회사|합명회사|사단법인|재단법인|농업회사|영농조합|협동조합|㈜|\(주\))"
_NAME_RE = re.compile(
    _PERSON_ROLE + r"([\s:：]+)(망\s*)?" + _CORP_LOOKAHEAD
    + r"([가-힣]{2,4}?)(?=(?:의|은|는|이|가|과|와|에게|에|소유|명의)?(?![가-힣]))"
)
_RRN = re.compile(r"(?<!\d)(\d{6})\s*-\s*([1-8])\d{6}(?!\d)")
EXTRA_STOPWORDS = {
    "현황", "존재", "있음", "여부", "관련", "전원", "일동", "본인", "측", "앞", "명의로", "소유로", "소유의",
    "회사의", "회사는", "법인의", "재단의", "들", "모두", "으로", "에게", "로부터", "등의", "부담", "제출",
}


def _is_name(token: str) -> bool:
    if not re.fullmatch(r"[가-힣]{2,4}", token or ""):
        return False
    if token in NAME_STOPWORDS or token in EXTRA_STOPWORDS:
        return False
    if len(token) >= 3 and any(token.endswith(s) for s in _ORG_SUFFIXES):
        return False
    if re.search(r"회사|법인|조합|산업|건설|상사|은행|공사|재단|센터|그룹|홀딩스|코리아", token):
        return False
    return True


def mask_name(name: str) -> str:
    return name[0] + "○" * (len(name) - 1)


def mask_personal_info(text: str) -> str:
    if not text:
        return text or ""

    found: set[str] = set()

    def repl(m: re.Match) -> str:
        role, sep, mang, name = m.group(1), m.group(2), m.group(3) or "", m.group(4)
        if not _is_name(name):
            return m.group(0)
        found.add(name)
        return f"{role}{sep}{mang}{mask_name(name)}"

    t = _NAME_RE.sub(repl, text)
    # 역할어 없이 다시 나오는 같은 이름("이은영은 연락두절")도 가린다. 3자 이상 이름만 — 2자는 일반 낱말과 겹치기 쉽다.
    for name in sorted(found, key=len, reverse=True):
        if len(name) >= 3:
            t = re.sub(rf"(?<![가-힣]){re.escape(name)}", mask_name(name), t)
    t = _RRN.sub(lambda m: f"{m.group(1)}-{m.group(2)}******", t)
    return t


# ── 5. 공고 단위 조립 ────────────────────────────────────────────────

def visible_len(text: str) -> int:
    return len(re.sub(r"\s", "", text or ""))


def build_notice_text(file_info, sleep: float = 0.0, log=print) -> tuple[str, dict]:
    """공고의 모든 첨부(PDF·HWP)에서 원문을 모아 정리·마스킹한 문자열과 진단 정보를 돌려준다.

    반환 text 가 '' 이면 저장할 만한 원문이 없다는 뜻이다(meta['reason'] 참고).
    """
    meta = {"files": 0, "downloaded": 0, "download_failed": 0, "formats": [], "reason": ""}
    if not file_info or not isinstance(file_info, list):
        meta["reason"] = "no_attachment"
        return "", meta

    parts = []
    for entry in file_info:
        original = entry.get("original_filename") or ""
        server = entry.get("server_filename") or ""
        ext = os.path.splitext(original)[1].lower()
        if ext not in (".pdf", ".hwp", ""):
            continue
        meta["files"] += 1
        data = download_attachment(server, original, log=log)
        if sleep:
            time.sleep(sleep)
        if not data:
            meta["download_failed"] += 1
            continue
        meta["downloaded"] += 1
        if data[:4] == b"%PDF" or ext == ".pdf":
            raw, fmt = extract_pdf_text(data), "pdf"
        else:
            raw, fmt = extract_hwp_text(data), "hwp"
        meta["formats"].append(fmt)
        cleaned = clean_text(raw)
        if cleaned:
            parts.append(cleaned if len(file_info) == 1 else f"[{original}]\n{cleaned}")

    if meta["files"] == 0:
        meta["reason"] = "no_supported_attachment"
        return "", meta
    if meta["downloaded"] == 0:
        meta["reason"] = "download_failed"
        return "", meta

    text = mask_personal_info("\n\n".join(parts))
    if visible_len(text) < MIN_STORE_CHARS:
        meta["reason"] = "too_short_or_scanned"
        return "", meta
    if len(text) > MAX_STORE_CHARS:
        text = text[:MAX_STORE_CHARS].rsplit("\n", 1)[0] + "\n\n(이하 생략 — 전체 내용은 법원 원문 첨부파일에서 확인)"
    meta["reason"] = "ok"
    return text, meta


def _selftest() -> int:
    cases = [
        ("채무자 김상건의 파산관재인 박광흠", "채무자 김○○의 파산관재인 박광흠"),
        ("채무자 망 김오승의 상속재산 파산관재인 변호사 기은현", "채무자 망 김○○의 상속재산 파산관재인 변호사 기은현"),
        ("채무자 주식회사 제이제이비투비 파산관재인 이명헌", "채무자 주식회사 제이제이비투비 파산관재인 이명헌"),
        ("채무자 클라비스테라퓨틱스 주식회사 파산관재인 신상헌", "채무자 클라비스테라퓨틱스 주식회사 파산관재인 신상헌"),
        ("채무자 소유 부동산", "채무자 소유 부동산"),
        ("임차인 홍길동 보증금 5,000만 원", "임차인 홍○○ 보증금 5,000만 원"),
        ("채무자로부터 인수", "채무자로부터 인수"),
        ("주민번호 800101-1234567", "주민번호 800101-1******"),
        ("채무자: 이광동", "채무자: 이○○"),
        ("연대보증인 이은영 이은영은 연락두절", "연대보증인 이○○ 이○○은 연락두절"),
        ("보증인 및 차주 현황", "보증인 및 차주 현황"),
    ]
    bad = 0
    for src, want in cases:
        got = mask_personal_info(src)
        ok = got == want
        bad += 0 if ok else 1
        print(("ok  " if ok else "FAIL"), src, "→", got)
    return bad


if __name__ == "__main__":
    sys.exit(1 if _selftest() else 0)
