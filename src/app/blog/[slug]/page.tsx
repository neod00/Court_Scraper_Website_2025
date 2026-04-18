import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { blogPosts, getPostBySlug, getRelatedPosts, blogCategories } from '@/data/blog-posts';
import { supabase } from '@/lib/supabase';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ViewTracker from '@/components/ViewTracker';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Fetch a dynamic post from Supabase
async function getDynamicPost(slug: string) {
    try {
        const { data } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();
        return data;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const siteUrl = 'https://www.courtauction.site';

    // Try static first, then dynamic
    const staticPost = getPostBySlug(slug);
    if (staticPost) {
        return {
            title: `${staticPost.title} | 로옥션 블로그`,
            description: staticPost.description,
            keywords: staticPost.tags.join(', '),
            alternates: {
                canonical: `${siteUrl}/blog/${slug}`,
            },
            openGraph: {
                title: staticPost.title,
                description: staticPost.description,
                url: `${siteUrl}/blog/${slug}`,
                type: 'article',
                publishedTime: staticPost.publishedAt,
                modifiedTime: staticPost.updatedAt,
                authors: [staticPost.author],
                tags: staticPost.tags,
            },
        };
    }

    const dynamicPost = await getDynamicPost(slug);
    if (dynamicPost) {
        return {
            title: `${dynamicPost.title} | 로옥션 블로그`,
            description: dynamicPost.description,
            keywords: (dynamicPost.tags || []).join(', '),
            alternates: {
                canonical: `${siteUrl}/blog/${slug}`,
            },
            openGraph: {
                title: dynamicPost.title,
                description: dynamicPost.description,
                url: `${siteUrl}/blog/${slug}`,
                type: 'article',
                publishedTime: dynamicPost.published_at,
                authors: [dynamicPost.author],
                tags: dynamicPost.tags,
            },
        };
    }

    return { title: '글을 찾을 수 없습니다' };
}

export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;

    // Try static post first
    const staticPost = getPostBySlug(slug);

    if (staticPost) {
        // Render static post with existing inline markdown renderer
        const relatedPosts = getRelatedPosts(slug);
        const category = blogCategories.find(c => c.name === staticPost.category);

        const renderContent = (content: string) => {
            return content
                .split('\n\n')
                .map((block, idx) => {
                    const trimmed = block.trim();

                    if (trimmed.startsWith('## ')) {
                        return (
                            <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">
                                {trimmed.replace('## ', '')}
                            </h2>
                        );
                    }

                    if (trimmed.startsWith('### ')) {
                        return (
                            <h3 key={idx} className="text-xl font-bold text-gray-900 mt-8 mb-3">
                                {trimmed.replace('### ', '')}
                            </h3>
                        );
                    }

                    if (trimmed === '---') {
                        return <hr key={idx} className="my-8 border-gray-200" />;
                    }

                    if (trimmed.startsWith('```')) {
                        const codeContent = trimmed.replace(/```\w*\n?/g, '').trim();
                        return (
                            <pre key={idx} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm">
                                <code>{codeContent}</code>
                            </pre>
                        );
                    }

                    if (trimmed.includes('|') && trimmed.split('\n').length > 1) {
                        const lines = trimmed.split('\n').filter(line => line.trim() && !line.includes('---'));
                        const headers = lines[0]?.split('|').filter(Boolean).map(s => s.trim());
                        const rows = lines.slice(1).map(line =>
                            line.split('|').filter(Boolean).map(s => s.trim())
                        );

                        return (
                            <div key={idx} className="overflow-x-auto my-6">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr>
                                            {headers?.map((h, i) => (
                                                <th key={i} className="bg-gray-100 p-3 border border-gray-200 text-left font-bold">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, ri) => (
                                            <tr key={ri}>
                                                {row.map((cell, ci) => (
                                                    <td key={ci} className="p-3 border border-gray-200">
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    }

                    if (trimmed.includes('- [ ]') || trimmed.includes('- [x]')) {
                        const items = trimmed.split('\n');
                        return (
                            <ul key={idx} className="my-4 space-y-2">
                                {items.map((item, i) => {
                                    const checked = item.includes('[x]');
                                    const text = item.replace(/- \[.\] /, '');
                                    return (
                                        <li key={i} className="flex items-center gap-2">
                                            <input type="checkbox" checked={checked} readOnly className="w-4 h-4" />
                                            <span className={checked ? 'text-gray-500 line-through' : 'text-gray-700'}>
                                                {text}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        );
                    }

                    if (/^\d+\.\s/.test(trimmed)) {
                        const items = trimmed.split('\n');
                        return (
                            <ol key={idx} className="list-decimal list-inside my-4 space-y-2 text-gray-700">
                                {items.map((item, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{
                                        __html: item
                                            .replace(/^\d+\.\s*/, '')
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                                    }} />
                                ))}
                            </ol>
                        );
                    }

                    if (trimmed.startsWith('- ')) {
                        const items = trimmed.split('\n');
                        return (
                            <ul key={idx} className="list-disc list-inside my-4 space-y-2 text-gray-700">
                                {items.map((item, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{
                                        __html: item
                                            .replace(/^-\s*/, '')
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                                    }} />
                                ))}
                            </ul>
                        );
                    }

                    return (
                        <p key={idx} className="my-4 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{
                            __html: trimmed
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline">$1</a>')
                        }} />
                    );
                });
        };

        return (
            <article className="max-w-4xl mx-auto px-4 py-8">
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                    <Link href="/" className="hover:text-indigo-600">홈</Link>
                    <span>/</span>
                    <Link href="/blog" className="hover:text-indigo-600">블로그</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium line-clamp-1">{staticPost.title}</span>
                </nav>

                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">
                            {category?.icon} {category?.label}
                        </span>
                        <span className="text-gray-400 text-sm">
                            {staticPost.readingTime}분 읽기
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                        {staticPost.title}
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed mb-6">
                        {staticPost.description}
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>✍️ {staticPost.author}</span>
                            <span>📅 {staticPost.publishedAt}</span>
                            {staticPost.updatedAt !== staticPost.publishedAt && (
                                <span className="text-green-600">🔄 {staticPost.updatedAt} 업데이트</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {staticPost.tags.map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="prose prose-lg max-w-none">
                    {renderContent(staticPost.content)}
                </div>

                {/* References and Sources for E-E-A-T */}
                <div className="mt-12 pt-6 border-t border-gray-100">
                    <details className="cursor-pointer group bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <summary className="text-base font-bold text-gray-800 flex items-center gap-2 hover:text-indigo-600 transition-colors">
                            📚 본문 자료 출처 및 분석 방법론
                        </summary>
                        <div className="mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
                            <p>본 칼럼은 다음과 같은 공신력 있는 자료를 바탕으로 <strong>로옥션 전문 분석팀</strong>에서 작성되었습니다:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>대한민국 법원경매정보시스템(Courtauction) 공고 데이터</li>
                                  <li>국토교통부 실거래가 공개시스템 시세 데이터</li>
                                <li>대법원 판례 및 민사집행법 관련 법령 자료</li>
                                <li>주요 은행별 NPL(부실채권) 매각 통계 및 시장 리포트</li>
                            </ul>
                            <p className="text-xs text-gray-500 mt-2 italic">※ 본 콘텐츠의 저작권은 로옥션(LawAuction)에 있으며, 무단 전재 및 재배포를 금합니다.</p>
                        </div>
                    </details>
                </div>

                {relatedPosts.length > 0 && (
                    <section className="mt-16 pt-8 border-t border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">📖 관련 글</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {relatedPosts.map((related) => (
                                <Link
                                    key={related.slug}
                                    href={`/blog/${related.slug}`}
                                    className="group bg-gray-50 rounded-xl p-5 hover:bg-indigo-50 transition-colors"
                                >
                                    <span className="text-xs text-indigo-600 font-bold">
                                        {blogCategories.find(c => c.name === related.category)?.icon} {related.category}
                                    </span>
                                    <h3 className="font-bold text-gray-900 mt-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        {related.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                        {related.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Link href="/blog" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                        ← 블로그 목록으로
                    </Link>
                    <div className="flex gap-4">
                        <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                            🔍 공고 검색하기
                        </Link>
                    </div>
                </div>
            </article>
        );
    }

    // Try dynamic post from Supabase
    const dynamicPost = await getDynamicPost(slug);

    if (!dynamicPost) {
        notFound();
    }

    const tags = dynamicPost.tags || [];
    const readingTime = dynamicPost.reading_time || 5;

    return (
        <article className="max-w-4xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-indigo-600">블로그</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium line-clamp-1">{dynamicPost.title}</span>
            </nav>

            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">
                        📊 {dynamicPost.category || '시장분석'}
                    </span>
                    <span className="text-gray-400 text-sm">
                        {readingTime}분 읽기
                    </span>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">
                        🤖 AI 자동 생성
                    </span>
                    <ViewTracker 
                        tableName="blog_posts" 
                        idColumn="slug" 
                        idValue={slug} 
                        initialCount={dynamicPost.view_count || 0}
                        className="text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100"
                    />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                    {dynamicPost.title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed mb-6">
                    {dynamicPost.description}
                </p>
                <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>🤖 {dynamicPost.author || 'AI 애널리스트'}</span>
                        <span>📅 {dynamicPost.published_at}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {tags.map((tag: string) => (
                            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {/* Dynamic posts use MarkdownRenderer for rich formatting */}
            <div className="prose prose-lg max-w-none">
                <MarkdownRenderer content={dynamicPost.content} />
            </div>

            {/* References and Sources for E-E-A-T */}
            <div className="mt-12 pt-6 border-t border-gray-100">
                <details className="cursor-pointer group bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <summary className="text-base font-bold text-gray-800 flex items-center gap-2 hover:text-indigo-600 transition-colors">
                        📚 본문 자료 출처 및 분석 방법론
                    </summary>
                    <div className="mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
                        <p>본 칼럼은 <strong>로옥션 AI 분석 엔진</strong>을 통해 최신 시장 통계 및 법원 데이터를 종합하여 생성되었습니다:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>대한민국 법원 실시간 경매 공고 데이터 (Grounding Data)</li>
                            <li>실시간 지역별 낙찰가율 및 경쟁률 통계</li>
                            <li>정부 부처 보도자료 및 부동산 정책 데이터베이스</li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-2">본 정보는 AI 생성 정보이므로 입찰 등 실무 적용 시 법원 원문 확인이 필수적입니다.</p>
                    </div>
                </details>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Link href="/blog" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                    ← 블로그 목록으로
                </Link>
                <div className="flex gap-4">
                    <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                        🔍 공고 검색하기
                    </Link>
                    <Link href="/trend" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                        📊 최신 리포트 보기
                    </Link>
                </div>
            </div>
        </article>
    );
}
