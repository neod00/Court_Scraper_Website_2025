import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { blogPosts, getPostBySlug, getRelatedPosts, blogCategories } from '@/data/blog-posts';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        return {
            title: '글을 찾을 수 없습니다',
        };
    }

    return {
        title: `${post.title} | 회생·파산 자산매각 블로그`,
        description: post.description,
        keywords: post.tags.join(', '),
        openGraph: {
            title: post.title,
            description: post.description,
            type: 'article',
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt,
            authors: [post.author],
            tags: post.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
        }
    };
}

export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = getRelatedPosts(slug);
    const category = blogCategories.find(c => c.name === post.category);

    // 마크다운 스타일 콘텐츠를 HTML로 변환 (간단한 버전)
    const renderContent = (content: string) => {
        return content
            .split('\n\n')
            .map((block, idx) => {
                const trimmed = block.trim();

                // H2 헤더
                if (trimmed.startsWith('## ')) {
                    return (
                        <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">
                            {trimmed.replace('## ', '')}
                        </h2>
                    );
                }

                // H3 헤더
                if (trimmed.startsWith('### ')) {
                    return (
                        <h3 key={idx} className="text-xl font-bold text-gray-900 mt-8 mb-3">
                            {trimmed.replace('### ', '')}
                        </h3>
                    );
                }

                // 구분선
                if (trimmed === '---') {
                    return <hr key={idx} className="my-8 border-gray-200" />;
                }

                // 코드 블록
                if (trimmed.startsWith('```')) {
                    const codeContent = trimmed.replace(/```\w*\n?/g, '').trim();
                    return (
                        <pre key={idx} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm">
                            <code>{codeContent}</code>
                        </pre>
                    );
                }

                // 표
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

                // 체크리스트
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

                // 순서 있는 리스트
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

                // 순서 없는 리스트
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

                // 일반 문단
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
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-indigo-600">블로그</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium line-clamp-1">{post.title}</span>
            </nav>

            {/* 헤더 */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">
                        {category?.icon} {category?.label}
                    </span>
                    <span className="text-gray-400 text-sm">
                        {post.readingTime}분 읽기
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                    {post.title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed mb-6">
                    {post.description}
                </p>
                <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>✍️ {post.author}</span>
                        <span>📅 {post.publishedAt}</span>
                        {post.updatedAt !== post.publishedAt && (
                            <span className="text-green-600">🔄 {post.updatedAt} 업데이트</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {post.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {/* 본문 */}
            <div className="prose prose-lg max-w-none">
                {renderContent(post.content)}
            </div>

            {/* 관련 글 */}
            {relatedPosts.length > 0 && (
                <section className="mt-16 pt-8 border-t border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        📖 관련 글
                    </h2>
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

            {/* 하단 네비게이션 */}
            <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Link
                    href="/blog"
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    ← 블로그 목록으로
                </Link>
                <div className="flex gap-4">
                    <Link
                        href="/"
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        🔍 공고 검색하기
                    </Link>
                    <Link
                        href="/glossary"
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                    >
                        📚 용어사전
                    </Link>
                </div>
            </div>
        </article>
    );
}
