import Link from 'next/link';
import type { Metadata } from 'next';
import { blogCategories, getFeaturedPosts, getPublicBlogPosts } from '@/data/blog-posts';
import { supabase } from '@/lib/supabase';
import { ALLOW_DATABASE_BLOG_POSTS } from '@/lib/contentPolicy';

const siteUrl = 'https://www.courtauction.site';
const pageTitle = '블로그: 법원 경매·회생·파산 매각 공고 확인 가이드';
const pageDescription =
    '법원 경매와 회생·파산 자산매각 공고를 읽는 데 필요한 절차, 확인 문서, 법령 근거를 로옥션 편집팀이 확인해 정리한 글입니다. 수치는 로옥션이 수집한 공고를 직접 집계한 값입니다.';

export const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    // 카테고리 필터(?category=)는 같은 목록의 부분집합이므로 정규 URL은 항상 /blog 입니다.
    alternates: { canonical: '/blog' },
    openGraph: {
        title: pageTitle,
        description: pageDescription,
        url: `${siteUrl}/blog`,
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: pageTitle,
        description: pageDescription,
    },
};

// Unified post type for both static and dynamic posts
interface UnifiedPost {
    slug: string;
    title: string;
    description: string;
    author: string;
    publishedAt: string;
    reviewedAt: string;
    category: string;
    tags: string[];
    readingTime: number;
    featured: boolean;
    source: 'static' | 'dynamic';
}

interface PageProps {
    searchParams: Promise<{ category?: string }>;
}

function categoryLabel(name: string): string {
    return blogCategories.find((category) => category.name === name)?.label ?? name;
}

export default async function BlogPage({ searchParams }: PageProps) {
    const { category: requestedCategory } = await searchParams;
    const selectedCategory = requestedCategory?.trim();
    const featuredPosts = getFeaturedPosts();

    // Fetch dynamic blog posts from Supabase (disabled while ALLOW_DATABASE_BLOG_POSTS is false)
    let dynamicPosts: UnifiedPost[] = [];
    if (ALLOW_DATABASE_BLOG_POSTS) try {
        const { data } = await supabase
            .from('blog_posts')
            .select('slug, title, description, author, published_at, updated_at, category, tags, reading_time, featured')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(50);

        if (data) {
            dynamicPosts = data.map(p => ({
                slug: p.slug,
                title: p.title,
                description: p.description,
                author: p.author || '로옥션',
                publishedAt: p.published_at,
                reviewedAt: p.updated_at || p.published_at,
                category: p.category || '시장분석',
                tags: p.tags || [],
                readingTime: p.reading_time || 5,
                featured: p.featured || false,
                source: 'dynamic' as const,
            }));
        }
    } catch {
        // blog_posts table may not exist yet, continue with static only
    }

    // Convert static posts to unified format (readingTime is computed from the body in getPublicBlogPosts)
    const staticPosts: UnifiedPost[] = getPublicBlogPosts().map(p => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        author: p.author,
        publishedAt: p.publishedAt,
        reviewedAt: p.reviewedAt ?? p.updatedAt,
        category: p.category,
        tags: p.tags,
        readingTime: p.readingTime,
        featured: p.featured,
        source: 'static' as const,
    }));

    // Merge and sort by the last confirmed date, then by publish date (newest first)
    const mergedPosts = [...dynamicPosts, ...staticPosts]
        .sort((a, b) =>
            (new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
            || (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()));

    const availableCategoryNames = new Set(mergedPosts.map((post) => post.category));
    const allCategories = blogCategories.filter((category) => availableCategoryNames.has(category.name));
    const validSelectedCategory = selectedCategory && availableCategoryNames.has(selectedCategory)
        ? selectedCategory
        : undefined;
    const allPosts = validSelectedCategory
        ? mergedPosts.filter((post) => post.category === validSelectedCategory)
        : mergedPosts;

    const chipBase = 'px-4 py-2 rounded-full text-sm font-medium transition-colors';
    const chipActive = 'bg-indigo-600 text-white';
    const chipIdle = 'bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white';

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    법원 경매·회생·파산 매각 공고 확인 가이드
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    공고를 읽을 때 필요한 절차 구분, 확인 문서, 법령 근거를 정리한 글입니다.
                    글에 나오는 수치는 로옥션이 수집한 공고를 집계한 값이며, 실제 참여 전에는 원문 공고와 최신 법령을 확인해야 합니다.
                </p>
            </header>

            {/* 카테고리 필터: 정규 URL은 /blog 이므로 필터 링크는 nofollow */}
            <nav aria-label="카테고리 필터" className="flex flex-wrap justify-center gap-3 mb-12">
                <Link href="/blog" className={`${chipBase} ${!validSelectedCategory ? chipActive : chipIdle}`}>
                    전체
                </Link>
                {allCategories.map((cat) => (
                    <Link
                        key={cat.name}
                        href={`/blog?category=${encodeURIComponent(cat.name)}`}
                        rel="nofollow"
                        className={`${chipBase} ${validSelectedCategory === cat.name ? chipActive : chipIdle}`}
                    >
                        {cat.label}
                    </Link>
                ))}
            </nav>

            {/* 주요 글 */}
            {!validSelectedCategory && featuredPosts.length > 0 && (
                <section className="mb-16" aria-labelledby="featured-heading">
                    <h2 id="featured-heading" className="text-2xl font-bold text-gray-900 mb-6">
                        먼저 읽을 글
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {featuredPosts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="group relative bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 text-white hover:shadow-2xl transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                                    {post.readingTime}분 읽기
                                </div>
                                <span className="text-indigo-200 text-sm font-medium">
                                    {categoryLabel(post.category)}
                                </span>
                                <h3 className="text-2xl font-bold mt-2 mb-4 group-hover:translate-x-1 transition-transform">
                                    {post.title}
                                </h3>
                                <p className="text-indigo-100 line-clamp-2 mb-4">
                                    {post.description}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-indigo-200">
                                    <span>최종 확인 {post.reviewedAt ?? post.updatedAt}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>{post.author}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 전체 글 목록 */}
            <section aria-labelledby="all-posts-heading">
                <h2 id="all-posts-heading" className="text-2xl font-bold text-gray-900 mb-6">
                    {validSelectedCategory ? `${categoryLabel(validSelectedCategory)} 글` : '전체 글'}
                    <span className="ml-2 text-base font-medium text-gray-500">{allPosts.length}편</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allPosts.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                        >
                            <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500" />

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                                        {categoryLabel(post.category)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {post.readingTime}분 읽기
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                                    {post.description}
                                </p>
                                <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                                    <span>최종 확인 {post.reviewedAt}</span>
                                    <div className="flex gap-1 flex-wrap justify-end">
                                        {post.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="bg-gray-100 px-2 py-0.5 rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 함께 보기 */}
            <section className="mt-16 bg-gray-50 rounded-2xl p-8" aria-labelledby="more-heading">
                <h2 id="more-heading" className="text-xl font-bold text-gray-900 mb-2">
                    함께 보기
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                    글에서 다룬 용어와 수치는 용어사전, 주간 칼럼, 데이터랩에서 다시 확인할 수 있습니다.
                    모든 글은 로옥션 편집팀이 작성하고 법령 원문과 수집 공고에 대조해 확인합니다.{' '}
                    <Link href="/editorial-policy" className="font-semibold text-indigo-700 hover:underline">편집 원칙 보기</Link>
                </p>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/" className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                        공고 검색
                    </Link>
                    <Link href="/glossary" className="bg-white text-gray-700 font-bold px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        용어사전
                    </Link>
                    <Link href="/trend" className="bg-white text-gray-700 font-bold px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        주간 칼럼
                    </Link>
                    <Link href="/datalab" className="bg-white text-gray-700 font-bold px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        데이터랩
                    </Link>
                </div>
            </section>
        </div>
    );
}
