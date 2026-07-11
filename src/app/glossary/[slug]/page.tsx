import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { glossaryTerms, getTermBySlug } from '@/data/glossary';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const term = getTermBySlug(slug);

    if (!term) {
        return {
            title: '용어를 찾을 수 없습니다',
        };
    }

    return {
        title: `${term.term} - 회생·파산 용어사전 | 대법원 자산매각 공고`,
        description: term.shortDescription,
        keywords: `${term.term}, ${term.relatedTerms.join(', ')}, 법률용어, 경매용어`,
        alternates: { canonical: `/glossary/${term.slug}` },
        robots: { index: false, follow: true },
    };
}

export async function generateStaticParams() {
    return glossaryTerms.map((term) => ({
        slug: term.slug,
    }));
}

export default async function GlossaryDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const term = getTermBySlug(slug);

    if (!term) {
        notFound();
    }

    // 관련 용어 찾기
    const relatedTermData = term.relatedTerms
        .map(relatedName => glossaryTerms.find(t => t.term === relatedName))
        .filter(Boolean);

    const categoryIcons: Record<string, string> = {
        '절차': '⚙️',
        '권리': '🔒',
        '비용': '💰',
        '문서': '📄',
        '기타': '📌',
    };

    return (
        <article className="max-w-4xl mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/glossary" className="hover:text-indigo-600">용어사전</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">{term.term}</span>
            </nav>

            {/* 헤더 */}
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        {categoryIcons[term.category]} {term.category}
                    </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                    {term.term}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                    {term.shortDescription}
                </p>
            </header>

            {/* 본문 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
                <div
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed
                    prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                    prose-strong:text-indigo-900
                    prose-ul:list-disc prose-li:mb-2
                    prose-table:border-collapse prose-table:w-full
                    prose-th:bg-gray-100 prose-th:p-3 prose-th:border prose-th:border-gray-200
                    prose-td:p-3 prose-td:border prose-td:border-gray-200"
                    style={{ whiteSpace: 'pre-line' }}
                >
                    {term.fullDescription.split('\n\n').map((paragraph, idx) => {
                        // 표 처리
                        if (paragraph.includes('|')) {
                            const lines = paragraph.trim().split('\n');
                            const headers = lines[0]?.split('|').filter(Boolean).map(s => s.trim());
                            const rows = lines.slice(1).map(line =>
                                line.split('|').filter(Boolean).map(s => s.trim())
                            );

                            return (
                                <div key={idx} className="overflow-x-auto my-6">
                                    <table className="w-full text-sm">
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

                        // 리스트 처리
                        if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('1. ')) {
                            const items = paragraph.trim().split('\n');
                            const isOrdered = items[0]?.trim().match(/^\d+\./);

                            if (isOrdered) {
                                return (
                                    <ol key={idx} className="list-decimal list-inside my-4 space-y-2">
                                        {items.map((item, i) => (
                                            <li key={i} className="text-gray-700">
                                                {item.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                                            </li>
                                        ))}
                                    </ol>
                                );
                            }

                            return (
                                <ul key={idx} className="list-disc list-inside my-4 space-y-2">
                                    {items.map((item, i) => (
                                        <li key={i} className="text-gray-700">
                                            {item.replace(/^-\s*/, '')}
                                        </li>
                                    ))}
                                </ul>
                            );
                        }

                        // 헤더 처리
                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                            return (
                                <h3 key={idx} className="text-xl font-bold text-gray-900 mt-8 mb-4">
                                    {paragraph.replace(/\*\*/g, '')}
                                </h3>
                            );
                        }

                        // 일반 문단
                        return (
                            <p key={idx} className="my-4" dangerouslySetInnerHTML={{
                                __html: paragraph
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-900">$1</strong>')
                            }} />
                        );
                    })}
                </div>
            </div>

            {/* 관련 용어 */}
            {relatedTermData.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        🔗 관련 용어
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {relatedTermData.map((related) => related && (
                            <Link
                                key={related.slug}
                                href={`/glossary/${related.slug}`}
                                className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-indigo-200 transition-all"
                            >
                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                                    {related.term}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {related.shortDescription}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 하단 네비게이션 */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-200">
                <Link
                    href="/glossary"
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    ← 용어사전 목록으로
                </Link>
                <div className="flex gap-4">
                    <Link
                        href="/"
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        🔍 공고 검색하기
                    </Link>
                    <Link
                        href="/guide"
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                    >
                        📚 입찰 가이드
                    </Link>
                </div>
            </div>
        </article>
    );
}
