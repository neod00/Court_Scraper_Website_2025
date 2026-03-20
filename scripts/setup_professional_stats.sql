-- ============================================================
-- Professional Statistics Engine v1.1
-- 법원 회생/파산 공고 플랫폼 - 전방위 전문 통계 시스템 설정
-- ============================================================


-- 1. 조회수 컬럼 추가 (모든 핵심 콘텐츠 테이블)
ALTER TABLE court_notices ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;


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


-- 4. 범용 조회수 증가 RPC 함수 (보안 강화 및 모든 테이블 지원)
CREATE OR REPLACE FUNCTION increment_content_view(table_name TEXT, target_id_col TEXT, target_id_val TEXT)
RETURNS void AS $$
BEGIN
  -- SQL Injection 방지를 위해 I (Identifier) 포맷 사용 (단, 컬럼명과 테이블명에 한함)
  EXECUTE format('UPDATE %I SET view_count = COALESCE(view_count, 0) + 1 WHERE %I = $1', table_name, target_id_col)
  USING target_id_val;

  -- 만약 court_notices 테이블인 경우 아카이브도 함께 업데이트 (동기화)
  IF table_name = 'court_notices' THEN
      -- 공고 테이블은 ID(UUID)로 업데이트하므로 site_id를 찾아서 history에 반영
      UPDATE court_notices_history
      SET view_count = COALESCE(view_count, 0) + 1
      WHERE site_id = (SELECT site_id FROM court_notices WHERE id::text = target_id_val);
  END IF;
END;
$$ LANGUAGE plpgsql;


-- 5. 정기 보고서(Monthly/Quarterly)를 위한 뷰 및 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats (stat_date);
CREATE INDEX IF NOT EXISTS idx_court_notices_date ON court_notices (date_posted);


-- ============================================================
-- 설정 완료! 이제 모든 콘텐츠의 인기도가 정밀 측정됩니다.
-- ============================================================
