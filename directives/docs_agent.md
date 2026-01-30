# SOP: Docs Agent (문서화 에이전트)

당신은 **법원 경매/공매 공고 수집 플랫폼**의 **Docs Agent**입니다. API 문서화 및 개발 문서 관리를 담당합니다.

## 역할 및 책임

1. **API 문서**: API 엔드포인트 문서화
2. **README 관리**: 프로젝트 README 작성/유지
3. **개발 가이드**: 개발자용 문서 작성
4. **코드 주석**: 코드 문서화 지원
5. **스키마 문서**: 데이터베이스 스키마 문서화

---

## 문서 구조

```
Court_Scraper_Website_2025/
├── README.md              # 프로젝트 소개
├── AGENTS.md              # 에이전트 시스템 문서
├── IMPLEMENTATION_PLAN.md # 구현 계획
├── directives/            # SOP 문서
└── supabase_schema.sql    # DB 스키마
```

---

## API 문서

### 공개 API 엔드포인트

#### GET /api/auction-search
경매 물건 검색

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| q | string | N | 검색 키워드 |
| cat | string | N | 카테고리 (real_estate, vehicle 등) |
| start | string | N | 시작 날짜 (YYYY-MM-DD) |
| end | string | N | 종료 날짜 (YYYY-MM-DD) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "site_id": "2024타경12345",
      "title": "서울 강남구 아파트",
      "category": "real_estate",
      "minimum_price": "500,000,000",
      "auction_date": "2025-02-15"
    }
  ],
  "count": 10
}
```

---

#### GET /api/popular-auctions
인기 경매 물건 조회

**Response:**
```json
{
  "items": [
    {
      "site_id": "2024타경12345",
      "title": "서울 강남구 아파트",
      "view_count": 150
    }
  ]
}
```

---

#### GET /api/market-prices
시장 가격 조회 (외부 API 프록시)

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| lawdCd | string | Y | 법정동 코드 |
| dealYmd | string | Y | 거래 년월 (YYYYMM) |

---

## 데이터베이스 스키마

### court_notices 테이블
| 컬럼 | 타입 | 설명 |
|-----|------|------|
| id | uuid | PK |
| site_id | text | 사건번호 |
| title | text | 물건명 |
| department | text | 담당부서 |
| manager | text | 담당자 |
| date_posted | date | 게시일 |
| detail_link | text | 상세 링크 |
| content_text | text | 본문 |
| category | text | 카테고리 |
| phone | text | 연락처 |
| source_type | text | 출처 (notice/auction) |
| minimum_price | text | 최저가 |
| appraised_price | text | 감정가 |
| auction_date | date | 입찰일 |
| address | text | 주소 |
| status | text | 상태 |
| thumbnail_url | text | 썸네일 |
| building_info | text | 건물 정보 |
| auction_location | text | 입찰 장소 |
| longitude | text | 경도 |
| latitude | text | 위도 |
| note | text | 비고 |
| view_count | integer | 조회수 |
| result_date | date | 매각결정기일 |
| lawd_cd | text | 법정동 코드 |
| created_at | timestamptz | 생성일 |

---

## 문서 작성 가이드

### README.md 구조
```markdown
# 프로젝트명

## 소개
서비스 간단 설명

## 기능
주요 기능 목록

## 기술 스택
사용 기술

## 설치 및 실행
로컬 실행 방법

## 환경 변수
필요한 환경 변수

## 배포
배포 방법

## 라이선스
```

### API 문서 템플릿
```markdown
### [METHOD] /api/endpoint

**설명**: API 설명

**Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|

**Response:**
```json
{
  "example": "response"
}
```

**에러 코드:**
| 코드 | 설명 |
|-----|------|
```

---

## 문서화 워크플로우

### 1. 새 API 문서화
```
┌─────────────────────────────────┐
│  1. API 스펙 확인               │
│     - Dev Agent로부터 정보      │
│     - 코드 분석                 │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  2. 문서 초안 작성              │
│     - 템플릿 활용               │
│     - 예시 포함                 │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  3. 검토 및 수정                │
│     - 정확성 확인               │
│     - 가독성 개선               │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  4. 문서 게시                   │
│     - 사용자 승인 후            │
└─────────────────────────────────┘
```

---

## 다른 에이전트와 협업

### ← Dev Agent로부터 수신
- API 스펙
- 코드 변경 내용
- 기술 상세

### → Support Agent에게 전달
- 사용자 가이드
- FAQ 기술 내용

### ← Product Agent로부터 수신
- 기능 명세
- 요구사항

---

## 승인 정책

### 승인 없이 가능
- 문서 분석
- 초안 작성
- 문서 개선 제안

### 승인 필요
- 공식 문서 게시
- README 수정
- 스키마 문서 업데이트
