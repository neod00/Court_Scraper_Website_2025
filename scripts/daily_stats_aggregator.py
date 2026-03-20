"""
Daily Statistics Aggregator for Court Notice Platform
=====================================================
Aggregates daily statistics from court_notices and saves to daily_stats table.
This enables fast loading of long-term professional statistics (quarterly, semi-annual, annual).

Usage:
    python scripts/daily_stats_aggregator.py              # Aggregate today's stats
    python scripts/daily_stats_aggregator.py --date 2026-03-20  # Aggregate specific date
    python scripts/daily_stats_aggregator.py --backfill 30      # Backfill last 30 days
"""

import os
import sys
import argparse
from datetime import datetime, date, timedelta
from typing import Optional

from supabase import create_client, Client
from dotenv import load_dotenv

# ── Environment Setup ──────────────────────────────────────────────
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '.env.local'))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Category mapping for counting
CATEGORY_MAP = {
    'real_estate': 'real_estate_count',
    'vehicle': 'vehicle_count',
    'asset': 'asset_count',
    'bond': 'bond_count',
    'stock': 'stock_count',
    'patent': 'patent_count',
    'electronics': 'electronics_count',
}


def aggregate_daily_stats(target_date: date) -> bool:
    """
    Aggregates statistics for a specific date and upserts to daily_stats table.
    Returns True on success, False on failure.
    """
    date_str = target_date.isoformat()
    print(f"\n📊 Aggregating stats for {date_str}...")

    try:
        # Fetch all notices for this date (notice type only)
        result = supabase.table("court_notices") \
            .select("id, category, department, appraised_price, minimum_price, view_count") \
            .eq("source_type", "notice") \
            .eq("date_posted", date_str) \
            .execute()

        notices = result.data or []
        total_count = len(notices)

        if total_count == 0:
            print(f"  ℹ️ No notices found for {date_str}, skipping.")
            return True

        # Count by category
        category_counts = {v: 0 for v in CATEGORY_MAP.values()}
        category_counts['other_count'] = 0

        total_appraisal = 0
        max_appraisal = 0
        price_count = 0
        total_views = 0
        court_counts = {}

        for notice in notices:
            cat = notice.get('category', 'etc')
            col_name = CATEGORY_MAP.get(cat, 'other_count')
            category_counts[col_name] = category_counts.get(col_name, 0) + 1

            # Appraisal price aggregation
            price = notice.get('appraised_price') or notice.get('minimum_price')
            if price:
                try:
                    p = int(price)
                    total_appraisal += p
                    price_count += 1
                    if p > max_appraisal:
                        max_appraisal = p
                except (ValueError, TypeError):
                    pass

            # View count aggregation
            vc = notice.get('view_count') or 0
            total_views += vc

            # Court distribution
            dept = notice.get('department', '기타')
            court_counts[dept] = court_counts.get(dept, 0) + 1

        # Find top court
        top_court = max(court_counts, key=court_counts.get) if court_counts else '없음'
        avg_appraisal = total_appraisal // price_count if price_count > 0 else 0

        # Build stats record
        stats_data = {
            "stat_date": date_str,
            "total_count": total_count,
            "real_estate_count": category_counts.get('real_estate_count', 0),
            "vehicle_count": category_counts.get('vehicle_count', 0),
            "asset_count": category_counts.get('asset_count', 0),
            "bond_count": category_counts.get('bond_count', 0),
            "stock_count": category_counts.get('stock_count', 0),
            "patent_count": category_counts.get('patent_count', 0),
            "electronics_count": category_counts.get('electronics_count', 0),
            "other_count": category_counts.get('other_count', 0),
            "total_appraisal_price": total_appraisal,
            "avg_appraisal_price": avg_appraisal,
            "max_appraisal_price": max_appraisal,
            "top_court": top_court,
            "total_views": total_views,
        }

        # Upsert to daily_stats (update if date already exists)
        result = supabase.table("daily_stats") \
            .upsert(stats_data, on_conflict="stat_date") \
            .execute()

        if result.data:
            print(f"  ✅ {date_str}: {total_count}건 | "
                  f"부동산 {category_counts.get('real_estate_count', 0)} | "
                  f"차량 {category_counts.get('vehicle_count', 0)} | "
                  f"자산 {category_counts.get('asset_count', 0)} | "
                  f"채권 {category_counts.get('bond_count', 0)} | "
                  f"기타 {category_counts.get('other_count', 0)} | "
                  f"감정가총액 {total_appraisal:,}원 | "
                  f"최다법원 {top_court}")
            return True
        else:
            print(f"  ❌ Failed to save stats for {date_str}")
            return False

    except Exception as e:
        print(f"  ❌ Error aggregating stats for {date_str}: {e}")
        return False


def run_aggregation(target_date_str: Optional[str] = None, backfill_days: int = 0):
    """
    Main entry point for daily stats aggregation.
    """
    print("\n" + "=" * 60)
    print("📈 Daily Statistics Aggregator - Starting")
    print("=" * 60)

    if backfill_days > 0:
        # Backfill mode: aggregate stats for the last N days
        print(f"🔄 Backfill mode: processing last {backfill_days} days")
        success = 0
        for i in range(backfill_days):
            d = date.today() - timedelta(days=i)
            if aggregate_daily_stats(d):
                success += 1
        print(f"\n✅ Backfill complete: {success}/{backfill_days} days processed")
    else:
        # Single date mode
        if target_date_str:
            try:
                target = datetime.strptime(target_date_str, '%Y-%m-%d').date()
            except ValueError:
                print(f"❌ Invalid date format: {target_date_str}. Use YYYY-MM-DD.")
                return
        else:
            target = date.today()

        aggregate_daily_stats(target)

    print("\n" + "=" * 60)
    print("📈 Daily Statistics Aggregator - Complete")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Daily Statistics Aggregator')
    parser.add_argument('--date', type=str, help='Target date (YYYY-MM-DD), defaults to today')
    parser.add_argument('--backfill', type=int, default=0, help='Backfill last N days')
    args = parser.parse_args()

    run_aggregation(target_date_str=args.date, backfill_days=args.backfill)
