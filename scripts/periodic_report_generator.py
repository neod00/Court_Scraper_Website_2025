import os
import json
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import openai
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv(dotenv_path='.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY]):
    print("Error: Missing environment variables. Please check .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai.api_key = OPENAI_API_KEY

def get_stats_for_period(start_date: str, end_date: str) -> Dict:
    """주어진 기간 동안의 통계를 daily_stats 테이블에서 집계합니다."""
    print(f"Aggregating stats from {start_date} to {end_date}...")
    
    response = supabase.from_("daily_stats").select("*").gte("stat_date", start_date).lte("stat_date", end_date).execute()
    stats_list = response.data
    
    if not stats_list:
        return {}
    
    # 기초 집계
    summary = {
        "total_notices": sum(s.get("total_count", 0) for s in stats_list),
        "total_appraisal_price": sum(s.get("total_appraisal_price", 0) for s in stats_list),
        "total_views": sum(s.get("total_views", 0) for s in stats_list),
        "categories": {
            "real_estate": sum(s.get("real_estate_count", 0) for s in stats_list),
            "vehicle": sum(s.get("vehicle_count", 0) for s in stats_list),
            "asset": sum(s.get("asset_count", 0) for s in stats_list),
            "bond": sum(s.get("bond_count", 0) for s in stats_list),
            "stock": sum(s.get("stock_count", 0) for s in stats_list),
            "patent": sum(s.get("patent_count", 0) for s in stats_list),
        },
        "days_count": len(stats_list)
    }
    
    # 평균 및 최고가 계산
    if summary["days_count"] > 0:
        summary["avg_daily_notices"] = round(summary["total_notices"] / summary["days_count"], 1)
        summary["max_appraisal_price"] = max(s.get("max_appraisal_price", 0) for s in stats_list)
        
    # 최다 발생 법원 찾기 (단일 추출이 어려우므로 전체 리스트에서 빈도 계산)
    courts = [s.get("top_court") for s in stats_list if s.get("top_court")]
    if courts:
        from collections import Counter
        summary["top_court"] = Counter(courts).most_common(1)[0][0]
        
    return summary

def generate_report_with_ai(period_name: str, stats: Dict, start_date: str, end_date: str) -> Dict:
    """AI를 사용하여 전문적인 리포트를 생성합니다."""
    print(f"Generating AI analysis for {period_name}...")
    
    prompt = f"""
당신은 대한민국 법원 회생/파산 자산매각 시장의 수석 애널리스트입니다. 
다음은 {start_date}부터 {end_date}까지({period_name}) 수집된 법원 공고 데이터 통계입니다.

[집계 데이터]
- 총 공고 건수: {stats['total_notices']}건
- 총 감정가액: {stats['total_appraisal_price']:,}원
- 카테고리별 비중: {json.dumps(stats['categories'], ensure_ascii=False)}
- 총 조회수(관심도): {stats['total_views']}회
- 최다 매각 공고 법원: {stats.get('top_court', '전국 법원')}
- 기간 내 최고 감정가 물건: {stats.get('max_appraisal_price', 0):,}원

이 데이터를 바탕으로 투자자와 대중에게 유익한 '프리미엄 시장 분석 보고서'를 작성하세요.
보고서는 다음 요소를 포함해야 합니다:

1. 제목: 흥미를 유발하는 전문적인 제목 (예: [데이터 분석] 2026년 상반기 자산 유동화 트렌드...)
2. 한 줄 요약: 전체 시장 흐름을 정의하는 짧은 문구
3. 상세 분석: 데이터 뒤에 숨겨진 의미 설명 (예: 차량 공고가 늘어난 이유, 특정 법원 쏠림 현상 등)
4. 투자 가이드: 현재 데이터로 볼 때 어떤 자산에 관심을 가져야 하는지 제언
5. 핵심 요약 테이블 (Markdown 형식)

어조: 신뢰감 있는 전문적인 어조 (경어체)
형식: Markdown 포맷으로 작성하세요. 이미지나 차트는 없으므로 텍스트와 표(Table) 위주로 구성하세요.
JSON 형식으로 결과를 반환하세요: {{ "title": "제목", "description": "메타 설명(짧은 요약)", "content": "본문 Markdown" }}
"""

    response = openai.ChatCompletion.create(
        model="gpt-4-turbo-preview",
        messages=[{"role": "system", "content": "You are a professional market analyst expert."}, {"role": "user", "content": prompt}],
        response_format={ "type": "json_object" }
    )
    
    result = json.loads(response.choices[0].message.content)
    return result

def save_report_to_blog(report: Dict, period_name: str, start_date: str, end_date: str):
    """생성된 리포트를 blog_posts 테이블에 저장합니다."""
    print("Saving report to blog posts...")
    
    # 슬러그 생성 (예: monthly-report-2026-03)
    slug = f"{period_name.replace(' ', '-').lower()}-{end_date}"
    
    # 태그 추가
    tags = ["시장분석", period_name, "데이터분석", "회생파산", "법원경매"]
    
    post_data = {
        "slug": slug,
        "title": report["title"],
        "description": report["description"],
        "content": report["content"],
        "author": "AI 애널리스트",
        "category": "시장분석",
        "tags": tags,
        "is_published": True,
        "published_at": datetime.now().isoformat(),
        "featured": True if "Yearly" in period_name or "Quarterly" in period_name else False
    }
    
    response = supabase.from_("blog_posts").upsert(post_data).execute()
    print(f"Report saved successfully as: /blog/{slug}")

def run_periodic_reports():
    """날짜를 체크하여 필요한 모든 정기 보고서를 생성합니다."""
    today = datetime.now().date()
    # today = datetime(2026, 4, 1).date() # Test for Quarter

    # 1. 월간 보고서 (매월 1일 전월분 생성)
    if today.day == 1 or True: # True for testing via script run
        last_month_end = today - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        
        # 실제 운영시는 check if exists, 여기서는 일단 생성 로직만
        stats = get_stats_for_period(last_month_start.isoformat(), last_month_end.isoformat())
        if stats and stats["total_notices"] > 0:
            period_name = f"{last_month_end.year}년 {last_month_end.month}월 월간 리포트"
            report = generate_report_with_ai(period_name, stats, last_month_start.isoformat(), last_month_end.isoformat())
            save_report_to_blog(report, "Monthly", last_month_start.isoformat(), last_month_end.isoformat())

    # 2. 분기 보고서 (1/1, 4/1, 7/1, 10/1)
    if today.month in [1, 4, 7, 10] and today.day == 1:
        # 지난 분기 계산 로직... (생략 및 구현 가능)
        pass

    # 3. 반기/연간 보고서도 유사한 로직으로 구현 가능...

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate periodic market reports using AI.")
    parser.add_argument("--period", choices=["monthly", "quarterly", "yearly", "manual"], default="manual", help="Report period")
    parser.add_argument("--start", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end", help="End date (YYYY-MM-DD)")
    
    args = parser.parse_args()
    
    if args.period == "manual" and args.start and args.end:
        stats = get_stats_for_period(args.start, args.end)
        if stats:
            p_name = f"수동 생성 리포트 ({args.start} ~ {args.end})"
            report = generate_report_with_ai(p_name, stats, args.start, args.end)
            save_report_to_blog(report, "Special", args.start, args.end)
    else:
        run_periodic_reports()
