import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { categories, getCategoryBySlug } from '@/data/categories';
import { INDEX_DAYS, getNoticeIndex, groupStats, upcomingRounds } from '@/lib/noticeIndex';
import { CountChips, RecentNoticeList, StatsCards, UpcomingTable } from '@/components/NoticeIndexViews';
import { getCourtByName } from '@/data/courts';
import { glossaryTerms } from '@/data/glossary';
import { isPublicBlogSlug } from '@/lib/contentPolicy';

export const dynamic = 'force-dynamic';

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
        title: `${categoryInfo.name} 매각 공고`,
        description: categoryInfo.description,
        keywords: `${categoryInfo.name}, 매각공고, 회생, 파산, ${categoryInfo.relatedTerms.join(', ')}`,
        alternates: { canonical: `/category/${categoryInfo.slug}` },
        robots: { index: true, follow: true },
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

    // 원문이 저장된 최근 공고 색인(6시간 캐시)에서 이 유형만 고른다.
    const index = await getNoticeIndex();
    const list = index.filter((n) => categoryInfo.dbCategories.includes(n.category));
    const stats = groupStats(list);
    const upcoming = upcomingRounds(list, 14).slice(0, 15);
    const recent = list.slice(0, 20);

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
                    // categories.ts(공용 파일)의 '투자 팁' 소제목은 표시 시 중립 표현으로 바꿉니다.
                    const heading = trimmed.replace('### ', '').replace(/투자 팁/g, '확인 사항');
                    return (
                        <h3 key={idx} className="text-xl font-bold text-gray-800 mt-6 mb-3">
                            {heading}
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
                        href={`/?cat=${categoryInfo.dbCategory}`}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        {categoryInfo.name} 공고 검색
                    </Link>
                    <Link
                        href="/glossary"
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                    >
                        용어사전
                    </Link>
                </div>
            </header>

            {/* 데이터 범위와 확인 방법 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100 text-gray-700 leading-relaxed text-[15px] shadow-sm">
                <p>
                    이 페이지는 대한민국 법원에 공개된 회생·파산 관련 <strong>{categoryInfo.name}</strong> 자산매각 공고를 모아 보여줍니다.
                    최근 {INDEX_DAYS}일 동안 첨부 공고문 원문을 확인한 공고만 모았고, 회차별 최저입찰가는 원문 표에서 읽은 값입니다.
                    공고마다 매각 방식, 권리관계, 자산 상태와 계약 조건이 다르므로 입찰 전에는 공고 상세의 원문과 법원 게시물을 확인해야 합니다.
                    확인 방법은 <Link href="/editorial-policy" className="underline hover:text-indigo-600">데이터·편집 원칙</Link>에 정리되어 있습니다.
                </p>
            </div>

            {/* 집계 */}
            <section className="mb-12" aria-labelledby="stats-heading">
                <h2 id="stats-heading" className="text-2xl font-bold text-gray-900 mb-4">{categoryInfo.name} 공고 현황</h2>
                <StatsCards stats={stats} days={INDEX_DAYS} />
                {stats.medianLastRatio && (
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                        회차표가 있는 공고는 마지막 회차 최저가가 1회차의 {Math.round(stats.medianLastRatio * 100)}% 수준(중앙값)까지 내려갑니다.
                        회차마다 얼마씩 낮추는지는 공고마다 다르므로 개별 공고의 회차표를 확인하세요.
                    </p>
                )}
                {stats.byCourt.length > 0 && (
                    <div className="mt-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">법원별 공고 수</h3>
                        <CountChips
                            items={stats.byCourt}
                            hrefOf={(name) => {
                                const court = getCourtByName(name);
                                return court ? `/court/${court.slug}` : null;
                            }}
                        />
                    </div>
                )}
            </section>

            {/* 마감 임박 */}
            <section className="mb-12" aria-labelledby="upcoming-heading">
                <h2 id="upcoming-heading" className="text-2xl font-bold text-gray-900 mb-2">2주 안에 입찰일이 있는 {categoryInfo.name} 공고</h2>
                <p className="text-sm text-gray-600 mb-4">원문 회차표에서 오늘 이후 가장 가까운 회차를 골랐습니다. 앞 회차에서 낙찰되면 뒤 회차는 열리지 않습니다.</p>
                <UpcomingTable rows={upcoming} showCategory={categoryInfo.dbCategories.length > 1} />
            </section>

            {/* 최근 공고 */}
            <section className="mb-12" aria-labelledby="recent-heading">
                <div className="flex items-end justify-between gap-4 mb-4">
                    <h2 id="recent-heading" className="text-2xl font-bold text-gray-900">최근 {categoryInfo.name} 공고</h2>
                    <Link href={`/?cat=${categoryInfo.dbCategory}`} className="text-sm text-indigo-600 font-bold hover:underline whitespace-nowrap">전체 검색 →</Link>
                </div>
                <RecentNoticeList notices={recent} showCategory={categoryInfo.dbCategories.length > 1} />
            </section>

            {/* 가이드 콘텐츠 */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
                <div className="prose prose-lg max-w-none">
                    {renderContent(categoryInfo.guideContent)}
                </div>
            </section>

            {/* 확인 사항 */}
            <section className="bg-amber-50 rounded-2xl p-8 mb-12">
                <h2 className="text-2xl font-bold text-amber-900 mb-6">
                    {categoryInfo.name} 공고 확인 사항
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
                        관련 용어
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {categoryInfo.relatedTerms.map((term) => {
                            const glossaryTerm = glossaryTerms.find((item) => item.term === term);
                            return (
                            <Link
                                key={term}
                                href={glossaryTerm ? `/glossary/${glossaryTerm.slug}` : '/glossary'}
                                className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium hover:bg-indigo-200 transition-colors"
                            >
                                {term}
                            </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* 관련 편집 글 */}
            {categoryInfo.relatedGuides.some((guide) => isPublicBlogSlug(guide.slug)) && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        관련 편집 글
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {categoryInfo.relatedGuides.filter((guide) => isPublicBlogSlug(guide.slug)).map((guide) => (
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
                    다른 카테고리
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
