import Link from 'next/link';
import type { Metadata } from 'next';
import { blogPosts, blogCategories, getFeaturedPosts, getRecentPosts } from '@/data/blog-posts';

export const metadata: Metadata = {
    title: '블로그 | 회생·파산 자산매각 전문 가이드',
    description: '법원 경매와 회생·파산 자산매각에 대한 전문 가이드, 입찰 전략, 권리분석, 세금 정보를 제공합니다.',
    keywords: '경매가이드, 회생자산, 파산매각, 입찰전략, 권리분석, 부동산경매, 취득세',
};

export default function BlogPage() {
    const featuredPosts = getFeaturedPosts();
    const recentPosts = getRecentPosts(10);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* 헤더 */}
            <header className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    📝 회생·파산 자산매각 블로그
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    법원 경매와 회생·파산 자산매각에 대한 전문 지식을 쉽게 풀어드립니다.
                    첫 입찰부터 고급 전략까지, 성공적인 투자를 위한 모든 정보를 제공합니다.
                </p>
            </header>

            {/* 카테고리 필터 */}
            <nav className="flex flex-wrap justify-center gap-3 mb-12">
                <Link
                    href="/blog"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors"
                >
                    전체
                </Link>
                {blogCategories.map((cat) => (
                    <Link
                        key={cat.name}
                        href={`/blog?category=${cat.name}`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
                    >
                        {cat.icon} {cat.label}
                    </Link>
                ))}
            </nav>

            {/* 추천 글 섹션 */}
            {featuredPosts.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        ⭐ 추천 글
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
                                    {blogCategories.find(c => c.name === post.category)?.icon} {post.category}
                                </span>
                                <h3 className="text-2xl font-bold mt-2 mb-4 group-hover:translate-x-1 transition-transform">
                                    {post.title}
                                </h3>
                                <p className="text-indigo-100 line-clamp-2 mb-4">
                                    {post.description}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-indigo-200">
                                    <span>{post.publishedAt}</span>
                                    <span>•</span>
                                    <span>{post.author}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 전체 글 목록 */}
            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    📚 전체 글 목록
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentPosts.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                        >
                            {/* 카드 상단 컬러 바 */}
                            <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500" />

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                                        {blogCategories.find(c => c.name === post.category)?.icon} {post.category}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {post.readingTime}분
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                    {post.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>{post.publishedAt}</span>
                                    <div className="flex gap-1">
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

            {/* 하단 CTA */}
            <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    💡 블로그 글이 도움이 되셨나요?
                </h3>
                <p className="text-gray-600 mb-6">
                    실제 매각 공고를 검색하고 분석해 보세요. 배운 지식을 바로 적용할 수 있습니다.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                    <Link
                        href="/"
                        className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        🔍 공고 검색하기
                    </Link>
                    <Link
                        href="/glossary"
                        className="bg-white text-gray-700 font-bold px-8 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        📚 용어사전 보기
                    </Link>
                </div>
            </div>
        </div>
    );
}
