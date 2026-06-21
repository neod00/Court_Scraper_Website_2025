"""
AI 자동생성 블로그 글 정리 스크립트 (AdSense thin / scaled-content 대응).

blog_posts 테이블은 전량 "자동생성"(주간/월간 AI 리포트)입니다.
공개 사이트에는 is_published=true 인 글만 노출되므로, 검수 전까지 비공개로 내려둡니다.
글 자체는 보존되며 언제든 다시 공개할 수 있습니다(--republish).

사용 예:
  python scripts/cleanup_ai_blog_posts.py                       # (기본) 현황만 출력, 변경 없음
  python scripts/cleanup_ai_blog_posts.py --unpublish-all       # 공개글 전부 비공개(되돌리기 가능)
  python scripts/cleanup_ai_blog_posts.py --unpublish-ai        # AI 마커(소스/저자/카테고리) 글만 비공개
  python scripts/cleanup_ai_blog_posts.py --republish slug-a slug-b   # 검수 후 다시 공개
  python scripts/cleanup_ai_blog_posts.py --delete slug-x       # 영구 삭제(주의: 되돌릴 수 없음)

주의: 쓰기 작업에는 .env.local 의 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다(RLS 우회).
"""
import os
import sys
import argparse
from supabase import create_client, Client
from dotenv import load_dotenv

# Windows 콘솔(cp949)에서도 한글/기호가 깨지지 않도록 UTF-8 출력 강제
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '.env.local'))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# 쓰기는 service role 키 필요(RLS 우회). 없으면 anon 키로 읽기만 가능.
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("Supabase 환경변수가 없습니다 (.env.local 확인).")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 자동생성으로 간주하는 마커
AI_SOURCES = ("weekly_report", "monthly_stats")
AI_AUTHOR = "AI 애널리스트"
AI_CATEGORY = "시장분석"


def is_ai_post(row: dict) -> bool:
    return (
        row.get("source") in AI_SOURCES
        or row.get("author") == AI_AUTHOR
        or row.get("category") == AI_CATEGORY
    )


def list_posts():
    res = (
        supabase.table("blog_posts")
        .select("slug, title, author, source, category, published_at, is_published, view_count")
        .order("published_at", desc=True)
        .execute()
    )
    rows = res.data or []
    pub = [r for r in rows if r.get("is_published")]
    print(f"\n총 {len(rows)}건  (공개 {len(pub)} / 비공개 {len(rows) - len(pub)})\n")
    for r in rows:
        flag = "[공개]  " if r.get("is_published") else "[비공개]"
        ai = "AI" if is_ai_post(r) else "  "
        print(f"{flag} [{ai}] {r.get('published_at')} | {r.get('source')}/{r.get('category')} | {r.get('author')}")
        print(f"          {r.get('slug')}  -  {r.get('title')}")
    if not rows:
        print("(blog_posts 테이블이 비어 있거나 접근할 수 없습니다.)")
    return rows


def unpublish(ai_only: bool):
    res = (
        supabase.table("blog_posts")
        .select("slug, source, author, category")
        .eq("is_published", True)
        .execute()
    )
    rows = res.data or []
    if ai_only:
        rows = [r for r in rows if is_ai_post(r)]
    slugs = [r["slug"] for r in rows]
    if not slugs:
        print("비공개 처리할 대상이 없습니다.")
        return
    # in_() 청크(대량 대비)
    for i in range(0, len(slugs), 100):
        chunk = slugs[i:i + 100]
        supabase.table("blog_posts").update({"is_published": False}).in_("slug", chunk).execute()
    print(f"[완료] 비공개 처리: {len(slugs)}건")


def republish(slugs):
    supabase.table("blog_posts").update({"is_published": True}).in_("slug", slugs).execute()
    print(f"[완료] 다시 공개: {len(slugs)}건 - {', '.join(slugs)}")


def delete(slugs):
    supabase.table("blog_posts").delete().in_("slug", slugs).execute()
    print(f"[삭제] 영구 삭제: {len(slugs)}건 - {', '.join(slugs)}")


def main():
    ap = argparse.ArgumentParser(description="AI 자동생성 블로그 글 정리")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--unpublish-all", action="store_true", help="공개글 전부 비공개(되돌리기 가능)")
    g.add_argument("--unpublish-ai", action="store_true", help="AI 마커 글만 비공개")
    g.add_argument("--republish", nargs="+", metavar="SLUG", help="해당 슬러그 다시 공개")
    g.add_argument("--delete", nargs="+", metavar="SLUG", help="해당 슬러그 영구 삭제(주의)")
    args = ap.parse_args()

    if args.unpublish_all:
        unpublish(ai_only=False)
    elif args.unpublish_ai:
        unpublish(ai_only=True)
    elif args.republish:
        republish(args.republish)
    elif args.delete:
        delete(args.delete)
    else:
        list_posts()  # 기본: 현황만 출력(변경 없음)


if __name__ == "__main__":
    main()
