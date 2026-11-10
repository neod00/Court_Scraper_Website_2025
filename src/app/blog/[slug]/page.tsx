import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostBySlug, getPublicBlogPosts, getRelatedPosts, blogCategories } from '@/data/blog-posts';
import { supabase } from '@/lib/supabase';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import RelatedNoticesRSS from '@/components/RelatedNoticesRSS';
import { ALLOW_DATABASE_BLOG_POSTS } from '@/lib/contentPolicy';

// 편집 글은 정적으로 생성하고, 사이드바의 최근 공고만 1시간 단위로 갱신합니다.
export const revalidate = 3600;

const siteUrl = 'https://www.courtauction.site';
const siteName = '로옥션(LawAuction)';
const editorialTeamUrl = `${siteUrl}/authors/lawauction-editorial-team`;

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Fetch a dynamic post from Supabase
async function getDynamicPost(slug: string) {
    if (!ALLOW_DATABASE_BLOG_POSTS) return null;
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

function categoryLabel(name: string): string {
    return blogCategories.find((category) => category.name === name)?.label ?? name;
}

// 인라인 마크다운(굵게, 링크)을 HTML로 바꿉니다. 본문은 저장소 안의 편집 글이라 신뢰할 수 있는 입력입니다.
function inlineMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#161616]">$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[#1F3D7A] hover:underline" rel="noopener">$1</a>');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    // Try static first, then dynamic
    const staticPost = getPostBySlug(slug);
    if (staticPost) {
        const modified = staticPost.reviewedAt ?? staticPost.updatedAt;
        return {
            // 레이아웃의 title 템플릿(%s | 로옥션)이 사이트명을 붙입니다.
            title: staticPost.title,
            description: staticPost.description,
            keywords: staticPost.tags.join(', '),
            alternates: {
                canonical: `${siteUrl}/blog/${slug}`,
            },
            openGraph: {
                title: staticPost.title,
                description: staticPost.description,
                url: `${siteUrl}/blog/${slug}`,
                siteName,
                locale: 'ko_KR',
                type: 'article',
                publishedTime: staticPost.publishedAt,
                modifiedTime: modified,
                authors: [editorialTeamUrl],
                tags: staticPost.tags,
            },
            twitter: {
                card: 'summary',
                title: staticPost.title,
                description: staticPost.description,
            },
        };
    }

    const dynamicPost = await getDynamicPost(slug);
    if (dynamicPost) {
        return {
            title: dynamicPost.title,
            description: dynamicPost.description,
            keywords: (dynamicPost.tags || []).join(', '),
            alternates: {
                canonical: `${siteUrl}/blog/${slug}`,
            },
            openGraph: {
                title: dynamicPost.title,
                description: dynamicPost.description,
                url: `${siteUrl}/blog/${slug}`,
                siteName,
                locale: 'ko_KR',
                type: 'article',
                publishedTime: dynamicPost.published_at,
                authors: [dynamicPost.author],
                tags: dynamicPost.tags,
            },
            twitter: {
                card: 'summary',
                title: dynamicPost.title,
                description: dynamicPost.description,
            },
        };
    }

    return { title: '글을 찾을 수 없습니다', robots: { index: false, follow: false } };
}

export async function generateStaticParams() {
    return getPublicBlogPosts().map((post) => ({
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
        const lastConfirmed = staticPost.reviewedAt ?? staticPost.updatedAt;
        const pageUrl = `${siteUrl}/blog/${slug}`;

        const blogPostingJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: staticPost.title,
            description: staticPost.description,
            datePublished: staticPost.publishedAt,
            dateModified: lastConfirmed,
            author: {
                '@type': 'Organization',
                name: '로옥션 편집팀',
                url: editorialTeamUrl,
            },
            publisher: {
                '@type': 'Organization',
                '@id': `${siteUrl}/#organization`,
                name: siteName,
                url: siteUrl,
                logo: {
                    '@type': 'ImageObject',
                    url: `${siteUrl}/logo.png`,
                },
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': pageUrl,
            },
            url: pageUrl,
            inLanguage: 'ko-KR',
            articleSection: categoryLabel(staticPost.category),
            keywords: staticPost.tags.join(', '),
            isAccessibleForFree: true,
        };

        const renderContent = (content: string) => {
            return content
                .split('\n\n')
                .map((block, idx) => {
                    const trimmed = block.trim();

                    if (trimmed.startsWith('## ')) {
                        return (
                            <h2 key={idx} className="text-2xl font-bold text-[#161616] mt-10 mb-4 pb-2 border-b border-[#161616]">
                                {trimmed.replace('## ', '')}
                            </h2>
                        );
                    }

                    if (trimmed.startsWith('### ')) {
                        return (
                            <h3 key={idx} className="text-xl font-bold text-[#161616] mt-8 mb-3">
                                {trimmed.replace('### ', '')}
                            </h3>
                        );
                    }

                    if (trimmed === '---') {
                        return <hr key={idx} className="my-8 border-[#161616]" />;
                    }

                    if (trimmed.startsWith('```')) {
                        const codeContent = trimmed.replace(/```\w*\n?/g, '').trim();
                        return (
                            <pre key={idx} className="bg-[#161616] text-gray-100 p-4 rounded-none overflow-x-auto my-4 text-sm">
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
                                                <th key={i} className="bg-[#E9E4D8] p-3 border border-[#161616] text-left font-bold">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, ri) => (
                                            <tr key={ri}>
                                                {row.map((cell, ci) => (
                                                    <td key={ci} className="p-3 border border-[#161616]">
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
                                            <span className={checked ? 'text-[#57534E] line-through' : 'text-[#2E2B27]'}>
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
                            <ol key={idx} className="list-decimal list-inside my-4 space-y-2 text-[#2E2B27]">
                                {items.map((item, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{
                                        __html: inlineMarkdown(item.replace(/^\d+\.\s*/, ''))
                                    }} />
                                ))}
                            </ol>
                        );
                    }

                    if (trimmed.startsWith('- ')) {
                        const items = trimmed.split('\n');
                        return (
                            <ul key={idx} className="list-disc list-inside my-4 space-y-2 text-[#2E2B27]">
                                {items.map((item, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{
                                        __html: inlineMarkdown(item.replace(/^-\s*/, ''))
                                    }} />
                                ))}
                            </ul>
                        );
                    }

                    return (
                        <p key={idx} className="my-4 text-[#2E2B27] leading-relaxed" dangerouslySetInnerHTML={{
                            __html: inlineMarkdown(trimmed)
                        }} />
                    );
                });
        };

        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd).replace(/</g, '\\u003c') }}
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <article className="lg:col-span-2">
                <nav aria-label="현재 위치" className="flex items-center gap-2 text-sm text-[#57534E] mb-8">
                    <Link href="/" className="hover:text-[#1F3D7A]">홈</Link>
                    <span>/</span>
                    <Link href="/blog" className="hover:text-[#1F3D7A]">블로그</Link>
                    <span>/</span>
                    <span className="text-[#161616] font-medium line-clamp-1">{staticPost.title}</span>
                </nav>

                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-[#D7E7DF] text-[#1F3D7A] text-sm font-bold px-3 py-1 rounded-none border border-[#161616]">
                            {categoryLabel(staticPost.category)}
                        </span>
                        <span className="text-[#6B655C] text-sm">
                            {staticPost.readingTime}분 읽기
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161616] leading-tight mb-4">
                        {staticPost.title}
                    </h1>
                    <p className="text-xl text-[#3A3A3A] leading-relaxed mb-6">
                        {staticPost.description}
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-[#161616]">
                        <dl className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-[#57534E]">
                            <div><dt className="inline">작성 </dt><dd className="inline text-[#2E2B27]">{staticPost.author}</dd></div>
                            <div><dt className="inline">게시 </dt><dd className="inline"><time dateTime={staticPost.publishedAt}>{staticPost.publishedAt}</time></dd></div>
                            <div><dt className="inline">최종 확인 </dt><dd className="inline text-[#2E2B27]"><time dateTime={lastConfirmed}>{lastConfirmed}</time></dd></div>
                        </dl>
                        <div className="flex gap-2 flex-wrap">
                            {staticPost.tags.map(tag => (
                                <span key={tag} className="bg-[#E9E4D8] text-[#3A3A3A] text-xs px-2 py-1 rounded-none">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="prose prose-lg max-w-none">
                    {renderContent(staticPost.content)}
                </div>

                <div className="mt-12 rounded-none border border-[#161616] bg-[#D7E7DF] p-6 text-sm leading-6 text-[#1F4D3F]">
                    <h2 className="font-bold mb-2">작성·검수 안내</h2>
                    <dl className="space-y-1">
                        <div><dt className="inline font-semibold">작성:</dt> <dd className="inline"><Link href="/authors/lawauction-editorial-team" className="underline">{staticPost.author}</Link></dd></div>
                        <div><dt className="inline font-semibold">최종 사실 확인:</dt> <dd className="inline">{lastConfirmed}</dd></div>
                        {staticPost.reviewMethod && <div><dt className="inline font-semibold">확인 방법:</dt> <dd className="inline">{staticPost.reviewMethod}</dd></div>}
                    </dl>
                    <p className="mt-3">
                        <Link href="/editorial-policy" className="font-semibold underline">편집·검수 원칙 보기</Link>
                    </p>
                </div>

                {staticPost.sources && staticPost.sources.length > 0 && (
                    <section className="mt-8 rounded-none border border-[#161616] bg-[#FAF7EC] p-6" aria-labelledby="sources-heading">
                        <h2 id="sources-heading" className="text-lg font-bold text-[#161616] mb-3">공식 참고자료</h2>
                        <ul className="space-y-2 text-sm">
                            {staticPost.sources.map((source) => (
                                <li key={source.url}>
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[#1F3D7A] underline">
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {relatedPosts.length > 0 && (
                    <section className="mt-16 pt-8 border-t border-[#161616]" aria-labelledby="related-heading">
                        <h2 id="related-heading" className="text-2xl font-bold text-[#161616] mb-6">관련 글</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {relatedPosts.map((related) => (
                                <Link
                                    key={related.slug}
                                    href={`/blog/${related.slug}`}
                                    className="group bg-[#F4F0E6] rounded-none p-5 hover:bg-[#D7E7DF] transition-colors"
                                >
                                    <span className="text-xs text-[#1F3D7A] font-bold">
                                        {categoryLabel(related.category)}
                                    </span>
                                    <h3 className="font-bold text-[#161616] mt-2 group-hover:text-[#1F3D7A] transition-colors line-clamp-2">
                                        {related.title}
                                    </h3>
                                    <p className="text-sm text-[#57534E] mt-2 line-clamp-2">
                                        {related.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <div className="mt-12 pt-8 border-t border-[#161616] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Link href="/blog" className="flex items-center gap-2 text-[#1F3D7A] hover:text-[#1F3D7A] font-medium">
                        &larr; 블로그 목록으로
                    </Link>
                    <Link href="/" className="bg-[#161616] text-white px-6 py-3 rounded-none font-bold hover:bg-[#161616] transition-colors">
                        공고 검색하기
                    </Link>
                </div>
                    </article>

                    <aside className="space-y-8 sticky top-6">
                        <RelatedNoticesRSS
                            currentId="blog-static"
                            category="real_estate"
                            courtName="로옥션 편집팀"
                        />
                    </aside>
                </div>
            </div>
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
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <article className="lg:col-span-2">
            <nav aria-label="현재 위치" className="flex items-center gap-2 text-sm text-[#57534E] mb-8">
                <Link href="/" className="hover:text-[#1F3D7A]">홈</Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-[#1F3D7A]">블로그</Link>
                <span>/</span>
                <span className="text-[#161616] font-medium line-clamp-1">{dynamicPost.title}</span>
            </nav>

            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="bg-[#D7E7DF] text-[#1F4D3F] text-sm font-bold px-3 py-1 rounded-none border border-[#161616]">
                        {dynamicPost.category || '시장분석'}
                    </span>
                    <span className="text-[#6B655C] text-sm">
                        {readingTime}분 읽기
                    </span>
                    <span className="bg-[#F6F1C4] text-[#161616] text-xs font-bold px-2 py-1 rounded-none">
                        AI 초안
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161616] leading-tight mb-4">
                    {dynamicPost.title}
                </h1>
                <p className="text-xl text-[#3A3A3A] leading-relaxed mb-6">
                    {dynamicPost.description}
                </p>
                <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-[#161616]">
                    <div className="flex items-center gap-4 text-sm text-[#57534E]">
                        <span>{dynamicPost.author || '로옥션'}</span>
                        <span>{dynamicPost.published_at}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {tags.map((tag: string) => (
                            <span key={tag} className="bg-[#E9E4D8] text-[#3A3A3A] text-xs px-2 py-1 rounded-none">
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

            <div className="mt-12 rounded-none border border-[#161616] bg-[#F6F1C4] p-6 text-sm leading-6 text-[#161616]">
                <h2 className="font-bold mb-2">작성 안내</h2>
                <p>
                    이 글은 로옥션이 수집한 공고 데이터를 바탕으로 만든 초안이며, 편집팀의 사실 확인 절차는{' '}
                    <Link href="/editorial-policy" className="font-semibold underline">편집·검수 원칙</Link>을 따릅니다.
                </p>
            </div>

            <div className="mt-12 pt-8 border-t border-[#161616] flex flex-col sm:flex-row justify-between items-center gap-4">
                <Link href="/blog" className="flex items-center gap-2 text-[#1F3D7A] hover:text-[#1F3D7A] font-medium">
                    &larr; 블로그 목록으로
                </Link>
                <div className="flex gap-4">
                    <Link href="/" className="bg-[#161616] text-white px-6 py-3 rounded-none font-bold hover:bg-[#161616] transition-colors">
                        공고 검색하기
                    </Link>
                    <Link href="/tools" className="bg-[#161616] text-white px-6 py-3 rounded-none font-bold hover:bg-[#161616] transition-colors">
                        계산기 보기
                    </Link>
                </div>
            </div>
                </article>

                <aside className="space-y-8 sticky top-6">
                    <RelatedNoticesRSS
                        currentId="blog-dynamic"
                        category="real_estate"
                        courtName="로옥션"
                    />
                </aside>
            </div>
        </div>
    );
}
