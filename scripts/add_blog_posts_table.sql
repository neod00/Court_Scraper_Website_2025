-- Run this in Supabase SQL Editor to create the blog_posts table
-- This table stores auto-generated blog posts (weekly reports, statistics, etc.)

CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'AI 애널리스트',
    published_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    category TEXT DEFAULT '시장분석',
    tags TEXT[] DEFAULT '{}',
    reading_time INTEGER DEFAULT 5,
    featured BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'weekly_report',     -- 'weekly_report', 'monthly_stats', 'manual'
    source_id UUID,                          -- References weekly_reports.id if applicable
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access for published posts
CREATE POLICY "Allow public read access on blog_posts"
ON blog_posts FOR SELECT
TO anon
USING (is_published = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blog_posts';
