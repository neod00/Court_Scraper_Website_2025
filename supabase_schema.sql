-- Create the main table for court notices and auctions
create table public.court_notices (
  id uuid not null default gen_random_uuid (),
  site_id text not null,
  title text not null,
  department text null,
  manager text null,
  date_posted date not null,
  views bigint not null default 0,
  file_info jsonb null, -- Stores filename, server_filename to reconstruct download
  detail_link text not null,
  content_text text null,
  category text null,
  sale_org text null,       -- 매각기관
  expiry_date date null,    -- 공고만료일
  phone text null,          -- 전화번호
  -- New auction-specific fields
  source_type text not null default 'notice', -- 'notice' or 'auction'
  minimum_price text null,   -- 최저매각가격
  appraised_price text null, -- 감정평가액
  auction_date date null,    -- 매각기일
  address text null,         -- 물건지 상세주소
  status text null,          -- 물건상태 (신건/유찰 등)
  thumbnail_url text null,   -- 물건 이미지 URL
  created_at timestamp with time zone not null default now(),
  constraint court_notices_pkey primary key (id),
  constraint court_notices_site_id_source_key unique (site_id, source_type)
);

-- Establish separate indices for better performance
create index idx_court_notices_date_posted on public.court_notices (date_posted);
create index idx_court_notices_category on public.court_notices (category);

-- Enable Row Level Security (RLS)
alter table public.court_notices enable row level security;

-- Policy: Allow public read access (Anyone can view notices)
create policy "Allow public read access"
  on public.court_notices
  for select
  to public
  using (true);

-- Note: The Python miner script will use the SERVICE_ROLE_KEY to bypass RLS for inserts.
