-- Court Notices Table (Extended for Auction Details)
CREATE TABLE IF NOT EXISTS public.court_notices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id text NOT NULL,
    title text NOT NULL,
    department text,
    manager text,  -- Used for case_no (사건번호) in auction items
    date_posted date,
    detail_link text,
    content_text text,
    category text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    
    -- Auction-specific fields
    source_type text NOT NULL DEFAULT 'notice',
    minimum_price text,
    appraised_price text,
    auction_date date,
    address text,
    status text,
    thumbnail_url text,
    
    -- Extended auction detail fields (from XHR)
    building_info text,      -- 건물 구조/면적 (pjbBuldList)
    auction_location text,   -- 입찰 장소 (maePlace)
    longitude text,          -- 경도 (wgs84Xcordi)
    latitude text,           -- 위도 (wgs84Ycordi)
    note text,               -- 비고/특별조건 (mulBigo)
    view_count integer,      -- 조회수 (inqCnt)
    result_date date,        -- 매각결정기일 (maegyuljGiil)
    
    CONSTRAINT court_notices_site_id_source_key UNIQUE (site_id, source_type)
);

-- Indices for better performance
CREATE INDEX IF NOT EXISTS idx_court_notices_date_posted ON public.court_notices (date_posted);
CREATE INDEX IF NOT EXISTS idx_court_notices_category ON public.court_notices (category);
CREATE INDEX IF NOT EXISTS idx_court_notices_source_type ON public.court_notices (source_type);

-- Enable Row Level Security
ALTER TABLE public.court_notices ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Allow public read access" ON public.court_notices
    FOR SELECT TO public USING (true);

-- Note: The Python scraper will use the SERVICE_ROLE_KEY to bypass RLS for inserts.


-- Migration SQL for existing database (Run this in Supabase SQL Editor):
/*
ALTER TABLE public.court_notices
ADD COLUMN IF NOT EXISTS building_info text,
ADD COLUMN IF NOT EXISTS auction_location text,
ADD COLUMN IF NOT EXISTS longitude text,
ADD COLUMN IF NOT EXISTS latitude text,
ADD COLUMN IF NOT EXISTS note text,
ADD COLUMN IF NOT EXISTS view_count integer,
ADD COLUMN IF NOT EXISTS result_date date;
*/
