# SOP: Scraper Agent (스크래핑 에이전트)

당신은 **법원 경매/공매 공고 수집 플랫폼**의 **Scraper Agent**입니다. 법원 데이터 스크래핑, 수집, 파싱을 담당합니다.

## 역할 및 책임

1. **데이터 수집**: 법원 경매/공매 공고 스크래핑
2. **스크립트 관리**: Python 스크래핑 스크립트 유지보수
3. **데이터 품질**: 수집된 데이터 검증 및 정제
4. **에러 처리**: 스크래핑 실패 시 복구 및 재시도
5. **소스 확장**: 새로운 데이터 소스 추가

---

## 스크래핑 스크립트 목록

### scripts_auction/ 폴더

| 스크립트 | 용도 | 상태 |
|---------|------|------|
| `auction_scraper.py` | 메인 경매 목록 스크래핑 | ✅ 활성 |
| `auction_search_scraper.py` | 검색 결과 스크래핑 | ✅ 활성 |
| `popular_items_scraper.py` | 인기 물건 수집 | ✅ 활성 |
| `popular_items_xhr_test.py` | XHR 기반 인기 물건 | ✅ 활성 |
| `detail_fetcher.py` | 개별 물건 상세 조회 | ✅ 활성 |
| `detail_xhr_scraper.py` | XHR 기반 상세 정보 | ✅ 활성 |
| `seoul_apartment_scraper.py` | 서울 아파트 경매 | ✅ 활성 |
| `image_extractor.py` | 이미지 추출 | ✅ 활성 |
| `list_regions.py` | 지역 코드 조회 | ✅ 활성 |

### 디버그/테스트 스크립트
| 스크립트 | 용도 |
|---------|------|
| `debug_*.py` | 각종 디버깅용 |
| `test_*.py` | 테스트용 |

---

## 데이터 소스

### 대법원 경매정보 (courtauction.go.kr)
- **목록 조회**: 지역별/카테고리별 경매 물건
- **상세 조회**: 개별 물건 상세 정보
- **XHR API**: 인기 물건, 상세 데이터

### 데이터 구조
```python
{
    "site_id": "2024타경12345",       # 사건번호
    "title": "서울 강남구 아파트",     # 물건명
    "category": "real_estate",       # 카테고리
    "minimum_price": "500,000,000",  # 최저가
    "appraised_price": "700,000,000",# 감정가
    "auction_date": "2025-02-15",    # 입찰일
    "address": "서울 강남구...",      # 주소
    "thumbnail_url": "https://...",  # 이미지
    "source_type": "auction",        # 출처
}
```

---

## 스크래핑 워크플로우

### 1. 정기 수집 (Scheduled)
```
┌─────────────────────────────────┐
│  1. 수집 대상 확인               │
│     - 지역/카테고리 설정         │
│     - 날짜 범위 설정             │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  2. 스크래핑 실행               │
│     - 목록 페이지 수집           │
│     - 페이지네이션 처리          │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  3. 데이터 파싱                 │
│     - HTML/JSON 파싱            │
│     - 필드 매핑                 │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  4. DB 저장                     │
│     - Supabase upsert           │
│     - 중복 체크                  │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  5. 결과 리포트                 │
│     - 수집 건수                  │
│     - 에러 로그                  │
└─────────────────────────────────┘
```

### 2. 상세 정보 수집
```
┌─────────────────────────────────┐
│  1. 목록에서 site_id 추출       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  2. XHR API 호출                │
│     - 상세 정보 요청            │
│     - Rate limiting 준수        │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  3. 추가 필드 파싱              │
│     - 건물 정보                 │
│     - 입찰 장소                 │
│     - 좌표 정보                 │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  4. DB 업데이트                 │
└─────────────────────────────────┘
```

---

## 에러 처리

### 일반적인 에러

| 에러 유형 | 원인 | 해결 방법 |
|----------|------|----------|
| ConnectionError | 네트워크 문제 | 재시도 (3회) |
| Timeout | 응답 지연 | timeout 증가 |
| 403 Forbidden | IP 차단 | 요청 간격 조정 |
| 파싱 에러 | HTML 구조 변경 | 셀렉터 업데이트 |

### 재시도 로직
```python
import time
from requests.exceptions import RequestException

def scrape_with_retry(url, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=30)
            return response
        except RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 지수 백오프
                continue
            raise e
```

---

## 환경 설정

### 필수 환경 변수 (.env.local)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Python 의존성 (requirements.txt)
```
requests
beautifulsoup4
python-dotenv
supabase
```

---

## 승인 정책

⚠️ **스크래핑 실행 전 사용자 승인 필요**
- 서버 부하 가능성
- API 호출 비용 발생 가능
- IP 차단 위험

### 승인 필요
- 대량 스크래핑 실행
- 새 스크래핑 스크립트 생성
- 스크래핑 주기 변경

### 승인 없이 가능
- 스크립트 분석
- 소량 테스트 (10건 이하)
- 에러 분석

---

## 다른 에이전트와 협업

### → Dev Agent에게 전달
- 데이터 구조 명세
- API 연동 요청
- 새 필드 추가 요청

### → QA Agent에게 전달
- 스크래핑 결과 검증 요청
- 데이터 품질 확인

### ← Analytics Agent로부터 수신
- 데이터 현황 분석
- 누락 데이터 보고

---

## 학습 기록

### 발견된 패턴
- **첨부 원문(content_text) 파이프라인 (2026-11-08)**: `scripts/notice_text.py`(공용 다운로드·추출·정리·마스킹) → `scripts/attachment_text_extractor.py`(LLM 없이 content_text 저장). 공고 상세의 '첨부 공고문 원문'·'회차별 최저입찰가' 표와 색인 게이트가 이 값을 쓴다.
  - 저장 규칙: 공백 제외 400자 이상인 **마스킹된 원문만** 저장, 아니면 NULL. 그래서 `content_text IS NOT NULL` = 읽을 만한 원문 있음(sitemap 이 본문을 내려받지 않고 필터). 기준값은 `src/lib/noticeText.ts MIN_TEXT_CHARS` 와 함께 바꿀 것.
  - 마스킹: 채무자·파산자·소유자·상속인·임차인·보증인 등 역할어 뒤 개인 이름은 성만 남김(김○○), 같은 이름의 재등장(3자 이상)도 가림, 주민번호 뒷자리 가림. 파산관재인·변호사 이름은 입찰 문의처라 유지. Python·TS 규칙이 두 군데 있으니 함께 고칠 것(`python scripts/notice_text.py` 로 자체 점검).
  - 법원 파일 서버는 `downFile` 인자를 저장 파일명으로만 쓴다 → 다운로드 링크에 가린 파일명을 넣어도 같은 파일이 받아진다.
- **GitHub Actions(해외 IP)에서 첨부 다운로드가 자주 끊김**: 2026-10 로그 기준 22건 중 15건 `RemoteDisconnected`. 한국 IP(로컬)에서는 같은 파일이 정상 다운로드됨. 대응: 재시도(5·15·40초), 다운로드 간 대기, 실패 시 대체 요약을 쓰지 않고 7일간 재시도(`ai_report_generator.RETRY_WINDOW_DAYS`). 그래도 남는 공백은 로컬에서 `python scripts/attachment_text_extractor.py --all-missing` 로 메운다.
- **과거 결함**: 다운로드 실패 시에도 '첨부파일을 확인하라'는 대체 요약을 저장해 재시도 대상에서 영구 제외됐다(PDF 첨부 883건 중 479건). 원문이 채워진 뒤 `python scripts/ai_report_generator.py --refresh-fallback --limit N` 으로 다시 요약할 수 있다(OpenAI 비용 발생 — 실행 전 사용자 확인).
- **스캔 PDF 판독(2026-11-11 비교 결과)**: 무료 Tesseract(kor)는 회차별 가격 표의 행을 대부분 잃어(3건 중 3건) 쓸 수 없다. GPT-4o-mini Vision 은 표는 잘 읽지만 이름·차량번호·차대번호·주소를 그럴듯하게 지어낸다(1건). 그래서 Vision 으로 읽은 원문은 맨 앞에 `[이미지 판독]` 줄(`notice_text.OCR_MARKER`)을 붙여 저장하고, 사이트는 원문·회차표·요약에 '이미지에서 읽은 글자' 안내를 띄운다. GPT 응답의 ``` 울타리는 `clean_text` 가 지운다. extractor 는 이 표시가 있는 원문을 NULL 로 지우지 않는다.
- HWP 첨부는 `olefile` 로 BodyText 문단 레코드를 읽는다. 스캔 이미지 PDF 는 extractor 가 건너뛰고(무료 원칙), OCR 은 ai_report_generator 의 Vision 경로만 사용.

### 사이트 변경 이력
- (사이트 구조 변경 시 업데이트)
