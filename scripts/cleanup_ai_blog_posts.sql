-- ============================================================================
-- AI 자동생성 블로그 글 정리 (AdSense thin / scaled-content 대응)
-- 실행 위치: Supabase 대시보드 > SQL Editor (단계별로 실행)
--
-- 배경:
--   blog_posts 테이블은 전량 "자동생성" 글입니다 (주간/월간 AI 리포트).
--   공개 사이트(블로그 목록·상세·sitemap)에는 is_published = true 인 글만 노출됩니다.
--   => is_published = false 로 내리면 글은 보존된 채 색인/노출에서만 빠집니다(되돌리기 가능).
--
-- 권장 전략: 일단 전부 비공개 처리 -> 사람이 검수한 좋은 글만 다시 공개.
-- ============================================================================


-- ── STEP 1. 현황 파악 (먼저 무엇이 공개 중인지 확인) ─────────────────────────

-- 1-a) 공개/비공개 개수
SELECT is_published, count(*) AS cnt
FROM blog_posts
GROUP BY is_published;

-- 1-b) 공개 중인 글 목록 (검수용)
SELECT slug, title, author, source, category, published_at, view_count
FROM blog_posts
WHERE is_published = true
ORDER BY published_at DESC;


-- ── STEP 2. (권장) 공개글 전부 비공개 — 되돌릴 수 있음, 삭제 아님 ────────────
--   자동생성 글을 모두 목록/색인/사이트맵에서 내립니다. 글 자체는 남아 있습니다.
--   실행 후 STEP 4에서 검수한 글만 골라 다시 공개하세요.

UPDATE blog_posts
SET is_published = false, updated_at = now()
WHERE is_published = true;


-- ── STEP 2-ALT. (선택) 전체 대신 AI 마커 글만 비공개하고 싶을 때 ─────────────
--   위 STEP 2 대신 아래를 쓰면 source/author/category 가 AI 계열인 글만 내립니다.
--
-- UPDATE blog_posts
-- SET is_published = false, updated_at = now()
-- WHERE is_published = true
--   AND ( source IN ('weekly_report', 'monthly_stats')
--         OR author = 'AI 애널리스트'
--         OR category = '시장분석' );


-- ── STEP 3. (선택) 명백한 저품질 글 영구 삭제 — 주의: 되돌릴 수 없음 ─────────
--   먼저 SELECT 로 대상을 확인한 뒤 DELETE 하세요.
--
-- SELECT slug, title FROM blog_posts WHERE slug IN ('지울-슬러그-1', '지울-슬러그-2');
-- DELETE FROM blog_posts            WHERE slug IN ('지울-슬러그-1', '지울-슬러그-2');


-- ── STEP 4. 검수 후 좋은 글만 다시 공개 ─────────────────────────────────────
--
-- UPDATE blog_posts
-- SET is_published = true, updated_at = now()
-- WHERE slug IN ('살릴-슬러그-1', '살릴-슬러그-2');


-- ── STEP 5. 최종 확인 ───────────────────────────────────────────────────────
SELECT is_published, count(*) AS cnt
FROM blog_posts
GROUP BY is_published;
