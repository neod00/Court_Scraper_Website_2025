import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { categories, getCategoryBySlug } from '@/data/categories';
import { supabase } from '@/lib/supabase';
import NoticeCard from '@/components/NoticeCard';

interface PageProps {
    params: Promise<{
        category: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category } = await params;
    const categoryInfo = getCategoryBySlug(category);

    if (!categoryInfo) {
        return {
            title: '카테고리를 찾을 수 없습니다',
        };
    }

    return {
        title: `${categoryInfo.icon} ${categoryInfo.name} 매각 공고 | 대법원 자산매각`,
        description: categoryInfo.description,
        keywords: `${categoryInfo.name}, 매각공고, 회생, 파산, 경매, ${categoryInfo.relatedTerms.join(', ')}`,
    };
}

export async function generateStaticParams() {
    return categories.map((cat) => ({
        category: cat.slug,
    }));
}

export default async function CategoryPage({ params }: PageProps) {
    const { category } = await params;
    const categoryInfo = getCategoryBySlug(category);

    if (!categoryInfo) {
        notFound();
    }

    // 해당 카테고리의 최근 공고 가져오기
    let notices: any[] = [];

    if (categoryInfo.dbCategory) {
        const { data } = await supabase
            .from('court_notices')
            .select('*')
            .eq('category', categoryInfo.dbCategory)
            .order('date_posted', { ascending: false })
            .limit(12);
        notices = data || [];
    }

    // 마크다운 스타일 콘텐츠 렌더링
    const renderContent = (content: string) => {
        return content
            .trim()
            .split('\n\n')
            .map((block, idx) => {
                const trimmed = block.trim();

                if (trimmed.startsWith('## ')) {
                    return (
                        <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                            {trimmed.replace('## ', '')}
                        </h2>
                    );
                }

                if (trimmed.startsWith('### ')) {
                    return (
                        <h3 key={idx} className="text-xl font-bold text-gray-800 mt-6 mb-3">
                            {trimmed.replace('### ', '')}
                        </h3>
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
                                    <li key={i} className="flex items-center gap-2 text-gray-700">
                                        <span className={`w-5 h-5 rounded border ${checked ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center text-white text-xs`}>
                                            {checked && '✓'}
                                        </span>
                                        {text}
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
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                }} />
                            ))}
                        </ol>
                    );
                }

                if (trimmed.startsWith('- ')) {
                    const items = trimmed.split('\n');
                    return (
                        <ul key={idx} className="list-disc list-inside my-4 space-y-1 text-gray-700">
                            {items.map((item, i) => (
                                <li key={i}>{item.replace(/^-\s*/, '')}</li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <p key={idx} className="my-4 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{
                        __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }} />
                );
            });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">{categoryInfo.name}</span>
            </nav>

            {/* 헤더 */}
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl">{categoryInfo.icon}</span>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                            {categoryInfo.name} 매각 공고
                        </h1>
                        <p className="text-lg text-gray-600 mt-2">
                            {categoryInfo.description}
                        </p>
                    </div>
                </div>

                {/* 빠른 검색 버튼 */}
                <div className="flex gap-3 mt-6">
                    <Link
                        href={categoryInfo.dbCategory ? `/?cat=${categoryInfo.dbCategory}` : '/'}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        🔍 {categoryInfo.name} 공고 검색하기
                    </Link>
                    <Link
                        href="/glossary"
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                    >
                        📖 용어사전
                    </Link>
                </div>
            </header>

            {/* 최근 공고 */}
            {notices.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        📌 최근 {categoryInfo.name} 공고
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notices.map((notice) => (
                            <NoticeCard key={notice.id} notice={notice} />
                        ))}
                    </div>
                    {notices.length >= 12 && (
                        <div className="text-center mt-6">
                            <Link
                                href={`/?cat=${categoryInfo.dbCategory}`}
                                className="text-indigo-600 font-bold hover:underline"
                            >
                                더 많은 {categoryInfo.name} 공고 보기 →
                            </Link>
                        </div>
                    )}
                </section>
            )}

            {/* 가이드 콘텐츠 */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
                <div className="prose prose-lg max-w-none">
                    {renderContent(categoryInfo.guideContent)}
                </div>
            </section>

            {/* 투자 팁 */}
            <section className="bg-amber-50 rounded-2xl p-8 mb-12">
                <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-2">
                    💡 {categoryInfo.name} 투자 팁
                </h2>
                <ul className="space-y-3">
                    {categoryInfo.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-amber-800">
                            <span className="bg-amber-200 text-amber-900 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {idx + 1}
                            </span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </section>

            {/* 관련 용어 */}
            {categoryInfo.relatedTerms.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        📖 관련 용어
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {categoryInfo.relatedTerms.map((term) => (
                            <Link
                                key={term}
                                href={`/glossary/${term.toLowerCase().replace(/\//g, '-')}`}
                                className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium hover:bg-indigo-200 transition-colors"
                            >
                                {term}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 관련 가이드 */}
            {categoryInfo.relatedGuides.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        📚 추천 가이드
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {categoryInfo.relatedGuides.map((guide) => (
                            <Link
                                key={guide.slug}
                                href={`/blog/${guide.slug}`}
                                className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
                            >
                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {guide.title}
                                </h3>
                                <span className="text-indigo-600 text-sm mt-2 inline-block">
                                    읽어보기 →
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 다른 카테고리 */}
            <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🗂️ 다른 카테고리 둘러보기
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.filter(c => c.slug !== category).map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/category/${cat.slug}`}
                            className="bg-gray-50 rounded-xl p-6 text-center hover:bg-indigo-50 transition-colors group"
                        >
                            <span className="text-4xl block mb-2">{cat.icon}</span>
                            <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {cat.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
