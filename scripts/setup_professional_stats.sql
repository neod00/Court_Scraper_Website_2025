-- ============================================================
-- Professional Statistics Engine v1.0
-- 법원 회생/파산 공고 플랫폼 - 전문 통계 시스템 설정
-- ============================================================
-- 이 SQL을 Supabase Dashboard > SQL Editor에서 실행해 주세요.
-- ============================================================

-- 1. 조회수 컬럼 추가 (메인 테이블)
ALTER TABLE court_notices ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. 공고 아카이브 테이블 (영구 보관용)
CREATE TABLE IF NOT EXISTS court_notices_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id TEXT,
  source_type TEXT DEFAULT 'notice',
  title TEXT,
  category TEXT,
  department TEXT,
  manager TEXT,
  date_posted DATE,
  detail_link TEXT,
  file_info JSONB,
  ai_summary TEXT,
  content_text TEXT,
  sale_org TEXT,
  expiry_date DATE,
  phone TEXT,
  minimum_price BIGINT,
  appraised_price BIGINT,
  auction_date DATE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, source_type)
);

-- 3. 일일 통계 테이블
CREATE TABLE IF NOT EXISTS daily_stats (
  id BIGSERIAL PRIMARY KEY,
  stat_date DATE UNIQUE NOT NULL,
  total_count INTEGER DEFAULT 0,
  real_estate_count INTEGER DEFAULT 0,
  vehicle_count INTEGER DEFAULT 0,
  asset_count INTEGER DEFAULT 0,
  bond_count INTEGER DEFAULT 0,
  stock_count INTEGER DEFAULT 0,
  patent_count INTEGER DEFAULT 0,
  electronics_count INTEGER DEFAULT 0,
  other_count INTEGER DEFAULT 0,
  total_appraisal_price BIGINT DEFAULT 0,
  avg_appraisal_price BIGINT DEFAULT 0,
  max_appraisal_price BIGINT DEFAULT 0,
  top_court TEXT,
  total_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 조회수 증가 RPC 함수 (원자적 증가, 동시성 안전)
CREATE OR REPLACE FUNCTION increment_view_count(target_id UUID)
RETURNS void AS $$
DECLARE
    v_site_id TEXT;
    v_source_type TEXT;
BEGIN
    -- 메인 테이블 조회수 +1
    UPDATE court_notices
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = target_id
    RETURNING site_id, source_type INTO v_site_id, v_source_type;

    -- 아카이브 테이블도 동기화
    IF v_site_id IS NOT NULL THEN
        UPDATE court_notices_history
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE site_id = v_site_id AND source_type = v_source_type;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS 정책 (필요시)
-- ALTER TABLE court_notices_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 설정 완료! 이제 데이터가 영구적으로 축적됩니다.
-- ============================================================
