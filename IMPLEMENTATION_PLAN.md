# Court Scraper Website 2025 - Implementation Plan

## 1. Project Overview
- **Goal**: Create a profitable, SEO-optimized website that provides court auction/sale notices.
- **Strategy**: Hybrid Architecture
  - **Backend (Miner)**: Python script runs periodically to collect data and store it in Supabase.
  - **Database (Warehouse)**: Supabase (PostgreSQL) stores lightweight metadata (links, titles, dates) instead of heavy files.
  - **Frontend (Showroom)**: Next.js website serves content to users with high speed and SEO optimization.

## 2. Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL, Auth - optional)
- **Data Collection**: Python 3.x (Requests, BeautifulSoup), GitHub Actions (Scheduler)
- **Deployment**: Vercel (Frontend), GitHub Actions (Cron Jobs)

## 3. Database Schema (Supabase)

We will use a single main table `court_notices` to store the auction items.

### Table: `court_notices`
| Column Name | Type | Description | Index |
|:--- |:--- |:--- |:--- |
| `id` | `uuid` | Primary Key (Default: `gen_random_uuid()`) | PK |
| `site_id` | `text` | Unique ID from source (e.g., `seq_id` from court URL) | Unique |
| `title` | `text` | Notice Title (e.g., "부동산 매각 공고") | |
| `department` | `text` | Court Department (e.g., "서울중앙지방법원") | |
| `manager` | `text` | Manager/Writer (e.g., "재판부") | |
| `date_posted` | `date` | Original posting date | Index (Sort) |
| `views` | `int8` | View count (Default: 0) | |
| `file_info` | `jsonb` | JSON containing filename, server_filename, etc. | |
| `detail_link` | `text` | URL to the original detail page | |
| `content_text` | `text` | (Optional) Summarized content or keywords for SEO | Search |
| `category` | `text` | 'real_estate', 'vehicle', 'etc' (Derived from title) | Index |
| `created_at` | `timestamptz`| Record creation time (Default: `now()`) | |

> **Note**: We do NOT store the actual PDF files. We store `file_info` (JSON) which contains all necessary parameters (`server_filename`, `original_filename`) to reconstruct the download request (GET or POST) on the frontend.

## 4. Directory Structure
```
Court_Scraper_Website_2025/
├── .github/
│   └── workflows/
│       └── scraper.yml      # CI/CD for Daily Scraping
├── scripts/
│   ├── scraper.py           # The Python "Miner" script
│   └── requirements.txt     # Python dependencies
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Home (Listings)
│   │   ├── notice/
│   │   │   └── [id]/        # Detail Page (SEO Target)
│   │   └── layout.tsx
│   ├── lib/
│   │   └── supabase.ts      # Supabase Client
│   └── components/          # UI Components (Header, footer, specialized cards)
├── public/                  # Static assets (ads.txt, robots.txt)
└── ...config files
```

## 5. Step-by-Step Implementation Guide

### Phase 1: Environment & Database Setup
1.  **Initialize Next.js**: Create the project skeleton.
2.  **Setup Supabase**:
    - Create a new project.
    - Run SQL to create `court_notices` table.
    - Set up RLS (Row Level Security) policies (Public Read, Service Role Write).

### Phase 2: The "Miner" (Python Backend)
1.  **Adapt `scraper.py`**:
    - Modify existing `app.py` logic.
    - Remove Streamlit dependencies.
    - Add Supabase connection logic (`supabase-py`).
    - Implement "Upsert" logic (Insert if new, update if exists, ignore if old).
2.  **Test Locally**: Run the script to populate the DB with initial data.
3.  **Automate**: Configure GitHub Actions to run this script every day at 04:00 AM.

### Phase 3: The "Showroom" (Next.js Frontend)
1.  **UI Construction**:
    - Build a clean, trustworthy design (Court/Legal theme).
    - Create a responsive Table/Grid view for notices.
2.  **Data Wiring**:
    - Fetch data from Supabase in `page.tsx` (Server Component).
    - Implement Pagination (Supabase `range` query).
    - Implement Search & Filter (Supabase `ilike` or `textSearch`).
3.  **Detail Page**:
    - Create dynamic route `/notice/[id]`.
    - Display all details + "Download Original File" button (Outlink).

### Phase 4: Profit & SEO
1.  **SEO Optimization**:
    - Generate dynamic `metadata` (Title, Description) for each notice page.
    - Create `sitemap.xml` dynamically from DB data.
2.  **AdSense Integration**:
    - Place Ad units: Top Banner, Sidebar, Between List Items.
    - Add `ads.txt` to public folder.

## 6. Next Steps
- [ ] Confirm this plan.
- [ ] Initialize Next.js project.
- [ ] Write the SQL query for your Supabase execution.
