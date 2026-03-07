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
    # Separate summaries by category for targeted reporting
    re_summaries = []     # 부동산 - all included for table
    veh_summaries = []    # 차량 - all included for table
    other_summaries = []  # 기타 - limited

    for notice in this_week:
        cat = notice.get('category', 'other')
        dept = notice.get('department', '기타')
        category_counts[cat] = category_counts.get(cat, 0) + 1
        department_counts[dept] = department_counts.get(dept, 0) + 1

        if notice.get('ai_summary'):
            entry = {
                'title': notice['title'],
                'category': cat,
                'department': dept,
                'summary': notice['ai_summary'][:600]
            }
            if cat == 'real_estate':
                re_summaries.append(entry)
            elif cat == 'vehicle':
                veh_summaries.append(entry)
            else:
                other_summaries.append(entry)

    # Top department
    top_dept = max(department_counts.items(), key=lambda x: x[1]) if department_counts else ('N/A', 0)

    # Combine: all real_estate + all vehicle + limited others
    all_summaries = re_summaries + veh_summaries + other_summaries[:15]

    return {
        'week_start': week_ago_str,
        'week_end': today_str,
        'total': len(this_week),
        'last_week_total': last_week_count,
        'category_counts': category_counts,
        'top_department': top_dept[0],
        'top_department_count': top_dept[1],
        'summaries': all_summaries,
    }


# ── 2. AI Generation ──────────────────────────────────────────────

TREND_PROMPT = """당신은 법원 회생·파산 자산매각 분야에서 10년 이상 경력을 가진 **전문 애널리스트** 겸 **투자 컨설턴트**입니다.
실제 공고 데이터를 분석하여, 사실(Fact) 기반의 정보와 실무 전문가로서의 통찰을 함께 제공하는 고품질 주간 리포트를 작성합니다.

🚨 [작성 원칙] 🚨
1. 모든 정보는 전달된 데이터에 근거해야 합니다. 데이터에 없는 내용은 추측하지 마세요.
2. "투자자들의 관심을 끌고 있습니다", "매력적인 매물입니다" 등 근거 없는 미사여구는 금지합니다.
3. 단, 데이터에 근거한 실무적 시사점이나 주의사항은 '💬 전문가 코멘트'로 적극 제공하세요.
4. 출력 본문에 "아래 항목을 작성하세요", "분석하세요" 같은 지시문을 절대 포함하지 마세요. 완성된 글만 출력합니다.

💬 전문가 코멘트 작성 가이드:
- 데이터에서 읽히는 실무적 시사점 (예: "지분 매각 물건은 나머지 지분 확보가 관건이므로 사전 확인 필수")
- 입찰 시 유의할 현실적 조언 (예: "이 가격대 SUV는 사고차 확인이 최우선")
- 시장 구조적 특징 해석 (예: "기타 자산 공고 비중이 높다는 것은 법인 파산 사건이 증가했음을 시사")
- 절대 "좋은 투자 기회", "추천" 등 투자 권유성 표현은 사용 금지

아래는 이번 주({week_start} ~ {week_end}) 법원 공고 데이터입니다:

📊 총 공고 건수: {total}건 (전주 {last_week_total}건)
📁 카테고리별: {category_breakdown}
🏛️ 최다 공고 법원: {top_department} ({top_department_count}건)

📝 이번 주 주요 공고 AI 요약 (최대 30건):
{summaries_text}

---

위 데이터를 바탕으로 다음 3가지를 JSON으로 생성해 주세요:

1. "briefing": 메인화면에 표시될 3~4줄 짧은 브리핑 (150~250자).
   - 이번 주 전체 시장 흐름을 데이터(증감, 카테고리 분포) 위주로 요약
   - "~입니다" 체로 객관적으로 작성.

2. "full_report": 아래 구조를 **정확히** 따른 마크다운 리포트 (3000~5000자).

⚠️ 중요: 아래 ```안의 구조는 **완성된 글의 형태**입니다. 괄호() 안의 내용은 당신이 데이터를 분석하여 채워 넣을 내용의 가이드이며, 괄호와 가이드 텍스트 자체는 출력하지 마세요. 지시문("작성하세요", "분석하세요" 등)은 절대 출력에 포함하지 마세요.

```
## 📊 {week_start} ~ {week_end} 주간 자산매각 데이터 리포트

> 💡 **이번 주 시장 요약**: (한 줄로 이번 주 핵심 트렌드 정리)

---

### 📈 1. 이번 주 시장 개요

(이번 주 시장 전체 흐름을 2~3문장으로 서술. 총 공고 건수, 전주 대비 증감률, 가장 공고가 많은 법원과 자산군을 자연스럽게 녹여 서술.)

| 구분 | 이번 주 | 전주 | 증감 |
|------|---------|------|------|
| 총 공고 | X건 | Y건 | +Z% |
| 부동산 | X건 | - | - |
| 차량/동산 | X건 | - | - |
| 기타 자산 | X건 | - | - |

> 💬 **전문가 코멘트**: (시장 개요에서 읽히는 구조적 특징이나 변화에 대한 전문가 시각 1~2문장. 예: 기타 자산 비중이 높다면 법인 파산 사건 증가 시사 등)

---

### 🏠 2. 부동산 매각 동향

(부동산 공고의 전반적 특징을 1~2문장으로 서술)

| 매물 종류 | 소재지 | 면적/규모 | 최저매각가 | 특이사항 |
|-----------|--------|-----------|------------|----------|
| (아파트/토지/임야 등) | (시/군/구) | (면적㎡) | (금액) | (지분매각, 압류 등) |
| ... | ... | ... | ... | ... |

(AI 요약 데이터에서 확인된 모든 부동산 매물을 위 표에 한 행씩 기재. 데이터에 없는 항목은 "-"로 표시. 최대 15행.)

> 💬 **전문가 코멘트**: (부동산 데이터에서 입찰자가 유의할 실무적 포인트 1~2문장)

### 🚗 3. 차량/동산 매각 동향

(차량/동산 공고의 전반적 특징을 1~2문장으로 서술)

| 차종/모델 | 연식 | 주행거리 | 최저매각가 | 특이사항 |
|-----------|------|----------|------------|----------|
| (모델명) | (연도) | (km) | (금액) | (사고이력, 압류 등) |
| ... | ... | ... | ... | ... |

(AI 요약 데이터에서 확인된 모든 차량을 위 표에 한 행씩 기재. 데이터에 없는 항목은 "-"로 표시. 최대 15행.)

> 💬 **전문가 코멘트**: (차량 입찰 시 유의할 실무적 팁 1~2문장)

### 📦 4. 기타 자산 동향

(주식, 채권, 특허권, 기계장비 등 기타 자산의 전반적 특징을 2~3문장으로 서술)

- **💎 자산 유형**: (확인된 구체적 자산군)
- **💰 가격대**: (확인된 최저매각가 범위)
- **📋 주목할 매물**: (가장 규모가 크거나 특이한 기타 자산 1~2건 간략 소개)

> 💬 **전문가 코멘트**: (기타 자산 입찰 시 일반인이 놓치기 쉬운 실무적 유의사항 1~2문장)

---

### 📌 5. 주요 공고 요약 (TOP 3)

**1. (매물명 또는 요약 제목)**
- 🏷️ 매각대상: (핵심 자산 명칭)
- 📍 관할: (법원명)
- 💰 최저매각가: (금액)
- 📋 주요 정보: (면적, 연식, 특이사항 등 1~2줄)

**2. (매물명)**
- 🏷️ 매각대상: (자산 명칭)
- 📍 관할: (법원명)
- 💰 최저매각가: (금액)
- 📋 주요 정보: (1~2줄)

**3. (매물명)**
- 🏷️ 매각대상: (자산 명칭)
- 📍 관할: (법원명)
- 💰 최저매각가: (금액)
- 📋 주요 정보: (1~2줄)

---

### ✅ 6. 이번 주 입찰 체크리스트

- [ ] (데이터에서 도출된 실무적 유의사항 3~4개를 체크리스트 형태로 제공. 예: "지분 매각 물건은 나머지 지분 확보 가능성 사전 확인" 등)

---

> 📌 **주의사항**: 본 리포트는 AI가 공고문 내 데이터를 추출하여 자동 요약한 것으로, 시장의 반응이나 실제 가치를 보장하지 않습니다. 입찰 전 반드시 법원 열람 및 현장 조사를 진행하시기 바랍니다.
```

3. "trending_tags": 이번 주 데이터에서 자주 등장하는 고유명사나 특정 속성 키워드 8~12개.
   각 태그는 {{"tag": "키워드", "count": 등장횟수}} 형식.
   태그 예시: 화성시, 공장용지, 쏘나타, 2018년식, 대지권미등기, 압류해제 등
   - "매력적인", "주목할" 같은 부사/형용사 금지
   - 너무 일반적인 단어(부동산, 매각, 법원 등)는 제외

JSON 형식으로만 응답하세요:
{{"briefing": "...", "full_report": "...", "trending_tags": [...]}}
"""


def generate_weekly_report(data: Dict) -> Optional[Dict]:
    """
    Uses GPT-4o-mini to generate the weekly trend briefing, report, and tags.
    """
    # Prepare summaries text - categorized for clarity
    summaries_text = ""
    for i, s in enumerate(data['summaries'], 1):
        cat_name = {'real_estate': '부동산', 'vehicle': '차량'}.get(s['category'], '기타')
        summaries_text += f"\n[{i}] [{cat_name}] {s['title']}\n{s['summary']}\n"

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
                {"role": "system", "content": "당신은 법원 회생·파산 자산매각 분야에서 10년 이상 실무 경험을 보유한 전문 애널리스트입니다. 데이터에 근거한 객관적 분석과 함께, 실무 경험에서 우러나온 전문가 코멘트를 제공합니다. 근거 없는 미사여구나 투자 권유성 표현은 사용하지 않되, '💬 전문가 코멘트' 항목에서는 입찰자가 유의해야 할 실무적 포인트를 적극적으로 안내합니다. 모든 출력은 완성된 글이어야 하며, 프롬프트 지시문(~하세요, ~작성하세요)이 본문에 노출되면 안 됩니다. 마크다운을 적극 활용하고 반드시 JSON으로 응답하세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=6000,
            temperature=0.3,
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


def save_as_blog_post(data: Dict, report: Dict) -> bool:
    """
    Saves the weekly report as a blog post in the blog_posts table.
    This enables auto-publishing weekly reports to the /blog page.
    """
    try:
        week_start = data['week_start']
        week_end = data['week_end']
        
        # Generate slug from dates
        slug = f"weekly-trend-{week_start}-to-{week_end}"
        
        # Generate blog title and description
        total = data['total']
        title = f"📊 {week_start} ~ {week_end} 주간 자산매각 시장 동향 리포트"
        description = report['briefing'][:200]
        
        # Calculate reading time (approx 500 chars/min for Korean)
        reading_time = max(3, len(report['full_report']) // 500)
        
        # Extract tags
        tags = []
        for t in report.get('trending_tags', []):
            if isinstance(t, dict) and 'tag' in t:
                tags.append(t['tag'])
            elif isinstance(t, str):
                tags.append(t)
        tags = tags[:8]  # Limit to 8 tags
        
        record = {
            "slug": slug,
            "title": title,
            "description": description,
            "content": report['full_report'],
            "author": "AI 애널리스트",
            "published_at": week_end,
            "category": "시장분석",
            "tags": tags,
            "reading_time": reading_time,
            "featured": False,
            "source": "weekly_report",
            "is_published": True,
        }
        
        result = supabase.table('blog_posts') \
            .upsert(record, on_conflict='slug') \
            .execute()
        
        if result.data:
            print(f"✅ Blog post published: {slug}")
            return True
        else:
            print(f"❌ Failed to publish blog post")
            return False
            
    except Exception as e:
        print(f"⚠️ Blog post save skipped (table may not exist yet): {e}")
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

    # Step 4: Auto-publish as blog post
    print("\n📝 Step 4: Publishing as blog post...")
    save_as_blog_post(data, report)

    print("\n✅ Weekly trend report generation complete!")


# ── CLI Entry Point ───────────────────────────────────────────────
if __name__ == "__main__":
    generate_weekly_trend()
