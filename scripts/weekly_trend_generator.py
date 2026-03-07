"""
Weekly Trend Report Generator
==============================
Aggregates AI summaries from the current week's court notices
and generates:
  1. A short briefing (3-4 lines) for the homepage trend section
  2. A full markdown report (blog-style weekly analysis)
  3. Trending tags extracted from summaries

Usage:
    python scripts/weekly_trend_generator.py
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List

from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# ── Environment Setup ──────────────────────────────────────────────
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '.env.local'))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found.")
    sys.exit(1)

if not OPENAI_API_KEY:
    print("Error: OPENAI_API_KEY not found.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)


# ── 1. Data Collection ────────────────────────────────────────────

def get_weekly_data() -> Dict:
    """
    Collects this week's notice data and AI summaries from Supabase.
    Returns a dict with counts, categories, summaries, etc.
    """
    today = datetime.now()
    week_ago = today - timedelta(days=7)
    two_weeks_ago = today - timedelta(days=14)

    today_str = today.strftime('%Y-%m-%d')
    week_ago_str = week_ago.strftime('%Y-%m-%d')
    two_weeks_ago_str = two_weeks_ago.strftime('%Y-%m-%d')

    # This week's notices with AI summaries
    result = supabase.table('court_notices') \
        .select('title, category, department, ai_summary, date_posted') \
        .gte('date_posted', week_ago_str) \
        .lte('date_posted', today_str) \
        .execute()

    this_week = result.data or []

    # Last week's count for comparison
    last_result = supabase.table('court_notices') \
        .select('id', count='exact') \
        .gte('date_posted', two_weeks_ago_str) \
        .lt('date_posted', week_ago_str) \
        .execute()

    last_week_count = last_result.count or 0

    # Category breakdown
    category_counts = {}
    department_counts = {}
    summaries_with_category = []

    for notice in this_week:
        cat = notice.get('category', 'other')
        dept = notice.get('department', '기타')
        category_counts[cat] = category_counts.get(cat, 0) + 1
        department_counts[dept] = department_counts.get(dept, 0) + 1

        if notice.get('ai_summary'):
            summaries_with_category.append({
                'title': notice['title'],
                'category': cat,
                'department': dept,
                'summary': notice['ai_summary'][:500]  # Limit for token control
            })

    # Top department
    top_dept = max(department_counts.items(), key=lambda x: x[1]) if department_counts else ('N/A', 0)

    return {
        'week_start': week_ago_str,
        'week_end': today_str,
        'total': len(this_week),
        'last_week_total': last_week_count,
        'category_counts': category_counts,
        'top_department': top_dept[0],
        'top_department_count': top_dept[1],
        'summaries': summaries_with_category[:30],  # Top 30 summaries to keep tokens manageable
    }


# ── 2. AI Generation ──────────────────────────────────────────────

TREND_PROMPT = """당신은 법원 회생·파산 자산매각 시장의 주간 동향을 분석하는 AI 에디터입니다.

아래는 이번 주({week_start} ~ {week_end}) 법원 공고 데이터입니다:

📊 총 공고 건수: {total}건 (전주 {last_week_total}건)
📁 카테고리별: {category_breakdown}
🏛️ 최다 공고 법원: {top_department} ({top_department_count}건)

📝 이번 주 주요 공고 AI 요약 (최대 30건):
{summaries_text}

---

위 데이터를 바탕으로 다음 3가지를 JSON으로 생성해 주세요:

1. "briefing": 메인화면에 표시될 3~4줄 짧은 브리핑 (150~250자).
   - 이번 주 전체 시장 흐름을 한눈에 파악할 수 있도록 작성
   - 주목할 만한 매물이나 트렌드를 구체적으로 언급
   - "~입니다" 체로 작성

2. "full_report": 블로그 형태의 전체 주간 리포트 (마크다운, 1500~2500자).
   구성:
   - ## 📊 {week_start} ~ {week_end} 주간 자산매각 동향 리포트
   - ### 1. 이번 주 시장 개요 (전주 대비 증감, 전반적 흐름)
   - ### 2. 카테고리별 핵심 동향 (부동산/차량/기타 각각 분석)
   - ### 3. 주목할 매물 TOP 3 (AI요약에서 가장 투자 가치가 있어 보이는 공고를 골라 간략히 소개)
   - ### 4. 이번 주 투자자 Action Point (구체적 행동 추천)

3. "trending_tags": 이번 주 AI 요약에서 자주 등장하거나 주목할 만한 키워드 태그 8~12개.
   각 태그는 {{"tag": "키워드", "count": 등장횟수}} 형식.
   태그 예시: 수의계약, 역세권, BMW, 반값매물, 공장부지, 무사고차량, 오피스텔, 특허권 등
   - 구체적이고 클릭을 유발할 수 있는 단어 선택
   - 너무 일반적인 단어(부동산, 매각 등)는 제외

JSON 형식으로만 응답하세요:
{{"briefing": "...", "full_report": "...", "trending_tags": [...]}}
"""


def generate_weekly_report(data: Dict) -> Optional[Dict]:
    """
    Uses GPT-4o-mini to generate the weekly trend briefing, report, and tags.
    """
    # Prepare summaries text
    summaries_text = ""
    for i, s in enumerate(data['summaries'], 1):
        cat_name = {'real_estate': '부동산', 'vehicle': '차량'}.get(s['category'], '기타')
        summaries_text += f"\n[{i}] [{cat_name}] {s['title']}\n{s['summary'][:300]}\n"

    if not summaries_text.strip():
        summaries_text = "(이번 주 AI 요약 데이터 없음)"

    # Category breakdown text
    cat_names = {'real_estate': '부동산', 'vehicle': '차량/동산'}
    cat_text = ", ".join(
        f"{cat_names.get(k, '기타')}: {v}건"
        for k, v in data['category_counts'].items()
    )

    prompt = TREND_PROMPT.format(
        week_start=data['week_start'],
        week_end=data['week_end'],
        total=data['total'],
        last_week_total=data['last_week_total'],
        category_breakdown=cat_text or "데이터 없음",
        top_department=data['top_department'],
        top_department_count=data['top_department_count'],
        summaries_text=summaries_text
    )

    try:
        print("🤖 Generating weekly trend report...")
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 법원 자산매각 시장 전문 분석가입니다. 수집된 데이터만을 기반으로 객관적이고 유용한 분석을 제공합니다. 반드시 유효한 JSON으로만 응답하세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.4,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else 0
        print(f"✅ Report generated (tokens: {tokens_used})")

        result = json.loads(content)

        # Validate required fields
        if not result.get('briefing') or not result.get('full_report'):
            print("❌ Missing required fields in response")
            return None

        return result

    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse AI response as JSON: {e}")
        return None
    except Exception as e:
        print(f"❌ AI generation failed: {e}")
        return None


# ── 3. Save to Supabase ───────────────────────────────────────────

def save_report(data: Dict, report: Dict) -> bool:
    """
    Saves the weekly report to the weekly_reports table (upsert).
    """
    try:
        record = {
            "week_start": data['week_start'],
            "week_end": data['week_end'],
            "briefing_text": report['briefing'],
            "full_report": report['full_report'],
            "trending_tags": json.dumps(report.get('trending_tags', []), ensure_ascii=False),
            "total_notices": data['total'],
            "category_breakdown": json.dumps(data['category_counts'], ensure_ascii=False),
            "top_department": data['top_department'],
        }

        # Upsert based on week_start + week_end unique constraint
        result = supabase.table('weekly_reports') \
            .upsert(record, on_conflict='week_start,week_end') \
            .execute()

        if result.data:
            print(f"✅ Weekly report saved: {data['week_start']} ~ {data['week_end']}")
            return True
        else:
            print(f"❌ Failed to save weekly report")
            return False

    except Exception as e:
        print(f"❌ DB save error: {e}")
        return False


# ── 4. Main Pipeline ─────────────────────────────────────────────

def generate_weekly_trend():
    """
    Main entry point: collects data, generates report, saves to DB.
    """
    print("\n" + "=" * 60)
    print("📊 Weekly Trend Report Generator")
    print("=" * 60)

    # Step 1: Collect data
    print("\n📥 Step 1: Collecting weekly data...")
    data = get_weekly_data()
    print(f"   Total notices this week: {data['total']}")
    print(f"   Notices with AI summary: {len(data['summaries'])}")
    print(f"   Category breakdown: {data['category_counts']}")

    if data['total'] == 0:
        print("⚠️ No notices found this week. Skipping report generation.")
        return

    if len(data['summaries']) == 0:
        print("⚠️ No AI summaries available. Skipping trend report.")
        return

    # Step 2: Generate AI report
    print("\n🤖 Step 2: Generating AI trend report...")
    report = generate_weekly_report(data)

    if not report:
        print("❌ Failed to generate report. Aborting.")
        return

    print(f"   Briefing: {report['briefing'][:80]}...")
    print(f"   Full report: {len(report['full_report'])} chars")
    print(f"   Trending tags: {len(report.get('trending_tags', []))} tags")

    # Step 3: Save to DB
    print("\n💾 Step 3: Saving to database...")
    save_report(data, report)

    print("\n✅ Weekly trend report generation complete!")


# ── CLI Entry Point ───────────────────────────────────────────────
if __name__ == "__main__":
    generate_weekly_trend()
