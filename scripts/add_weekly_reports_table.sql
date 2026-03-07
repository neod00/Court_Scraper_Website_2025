-- Run this in Supabase SQL Editor to create the weekly_reports table
-- This table stores AI-generated weekly trend analysis for the homepage

CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    briefing_text TEXT NOT NULL,          -- 3~4줄 짧은 브리핑 (메인화면용)
    full_report TEXT NOT NULL,            -- 전체 마크다운 리포트 (블로그 형태)
    trending_tags JSONB DEFAULT '[]',     -- [{"tag": "수의계약", "count": 5}, ...]
    total_notices INTEGER DEFAULT 0,
    category_breakdown JSONB DEFAULT '{}', -- {"real_estate": 15, "vehicle": 12, ...}
    top_department TEXT,                   -- 최다 공고 법원
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(week_start, week_end)           -- 같은 주 중복 방지 (upsert용)
);

-- Enable Row Level Security
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on weekly_reports"
ON weekly_reports FOR SELECT
TO anon
USING (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_end ON weekly_reports(week_end DESC);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'weekly_reports';
