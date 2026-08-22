import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
    type WeeklyReport,
    hasEditorNote,
    filterPublishedColumns,
    weekLabel,
    columnTitle,
    columnAuthor,
    columnDate,
    columnExcerpt,
    columnParagraphs,
    parseJsonColumn,
} from '@/lib/weeklyColumn';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: '주간 데이터 칼럼 | 법원 자산매각 집계와 해석',
    description: '로옥션이 매주 수집한 법원 회생·파산 자산매각 공고 집계에 편집자 해석을 더한 주간 칼럼입니다.',
    keywords: '주간통계, 자산매각, 회생파산, 매각공고, 법원경매, 주간칼럼',
    alternates: { canonical: '/trend' },
};

interface TrendingTag {
    tag: string;
    count: number;
}

export default async function TrendPage() {
    // Fetch all weekly reports, most recent first
    const { data } = await supabase
        .from('weekly_reports')
        .select('*')
        .order('week_end', { ascending: false })
        .limit(24);

    const reports = (data as WeeklyReport[]) || [];

    // 해석이 달린 주차 = 발행된 칼럼. 최신 칼럼을 머리기사로 세운다.
    const publishedColumns = filterPublishedColumns(reports);
    const featuredColumn = publishedColumns[0];
    const olderColumns = publishedColumns.slice(1);

    // 집계 수치는 해석 유무와 무관하게 최신 주차를 쓴다.
    const latestReport = reports[0];

    const trendingTags = parseJsonColumn<TrendingTag[]>(latestReport?.trending_tags, []);
    const categoryBreakdown = parseJsonColumn<Record<string, number>>(latestReport?.category_breakdown, {});

    const catNames: Record<string, string> = {
        real_estate: '🏠 부동산',
        vehicle: '🚗 차량/동산',
        asset: '📦 자산',
        bond: '💳 채권',
        stock: '📈 주식',
        patent: '💡 특허',
        electronics: '🖥️ 전자장비',
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* 헤더 */}
            <header className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
                    주간 데이터 칼럼
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed text-sm">
                    매주 수집한 법원 회생·파산 자산매각 공고를 집계하고, 그 주에 무엇이 눈에 띄었는지 편집자가 정리합니다.
                    수치는 탐색을 위한 참고 정보이며 실제 내용은 원문 공고에서 확인해야 합니다.
                </p>
            </header>

            {latestReport ? (
                <>
                    {/* 최신 리포트 */}
                    <article className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-12">
                        {/* 리포트 상단 히어로 */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-8 relative overflow-hidden">
                            {/* 배경 패턴 */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 bg-cyan-400/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-cyan-400/30">
                                            📊 최신 리포트
                                        </div>
                                        <h2 className="text-2xl font-extrabold tracking-tight">
                                            {latestReport.week_start} ~ {latestReport.week_end}
                                        </h2>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
                                            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1">총 공고</p>
                                            <p className="text-3xl font-extrabold">{latestReport.total_notices}<span className="text-sm font-normal text-slate-400">건</span></p>
                                        </div>
                                        {latestReport.top_department && (
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
                                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1">최다 법원</p>
                                                <p className="text-base font-bold mt-1">{latestReport.top_department}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 카테고리 태그 */}
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {Object.entries(categoryBreakdown).map(([cat, count]) => (
                                        <div key={cat} className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs border border-white/10 font-medium">
                                            {catNames[cat] || `📄 ${cat}`}: <span className="font-bold text-white">{count}</span>건
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>


                        {/* 트렌딩 태그 */}
                        {trendingTags.length > 0 && (
                            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-xs font-extrabold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    🔥 이번 주 트렌딩
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {trendingTags.map((item) => (
                                        <Link
                                            key={item.tag}
                                            href={`/?q=${encodeURIComponent(item.tag)}`}
                                            className="group inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-600 hover:text-indigo-700 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
                                        >
                                            <span className="text-indigo-400 group-hover:text-indigo-600">#</span>
                                            <span>{item.tag}</span>
                                            <span className="bg-gray-100 group-hover:bg-indigo-100 text-gray-400 group-hover:text-indigo-500 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.count}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 편집자 해석 (있을 때) 또는 집계 기준 안내 */}
                        {hasEditorNote(latestReport) ? (
                            <div className="px-8 py-10 sm:px-12">
                                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-gray-900">{columnTitle(latestReport)}</h3>
                                    <span className="text-xs text-gray-400">{columnDate(latestReport)}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">{columnAuthor(latestReport)}</p>
                                <div className="space-y-4 text-[15px] leading-8 text-gray-700">
                                    {columnParagraphs(latestReport).slice(0, 2).map((p, i) => (
                                        <p key={i}>{p}</p>
                                    ))}
                                </div>
                                {columnParagraphs(latestReport).length > 2 && (
                                    <Link
                                        href={`/trend/${latestReport.week_start}`}
                                        className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-indigo-700 hover:text-indigo-800"
                                    >
                                        칼럼 전문 읽기 &rarr;
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="px-8 py-10 sm:px-12">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">이 통계를 읽는 방법</h3>
                                <div className="space-y-3 text-sm leading-7 text-gray-600">
                                    <p>총 공고 수는 해당 주간에 수집된 공고를 기준으로 집계합니다.</p>
                                    <p>분류와 담당 법원 표기는 원문 및 수집 데이터에 따라 달라질 수 있으며, 중복·정정 공고로 실제 건수와 차이가 날 수 있습니다.</p>
                                    <p>가격 적정성, 권리관계, 물건 상태를 판단하는 분석 결과가 아닙니다. 참여 전 원문과 첨부 문서를 직접 확인하세요.</p>
                                    <p>
                                        <Link href="/editorial-policy" className="font-semibold text-indigo-700 underline">데이터·편집 원칙 자세히 보기</Link>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-8 py-8 text-center border-t border-indigo-100">
                            <p className="text-gray-600 text-sm mb-5 font-medium">
                                리포트에서 관심 있는 매물을 발견하셨나요? 지금 바로 검색해 보세요.
                            </p>
                            <div className="flex justify-center gap-3 flex-wrap">
                                <Link
                                    href="/"
                                    className="bg-indigo-600 text-white font-bold px-7 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 text-sm"
                                >
                                    🔍 공고 검색하기
                                </Link>
                                <Link
                                    href="/blog"
                                    className="bg-white text-gray-700 font-bold px-7 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm text-sm"
                                >
                                    📝 블로그 보기
                                </Link>
                            </div>
                        </div>
                    </article>


                </>
            ) : (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                    <p className="text-blue-700">
                        아직 집계된 주간 통계가 없습니다. 공고 데이터가 수집되면 주간 단위로 표시됩니다.
                    </p>
                </div>
            )}

            {/* 지난 주간 칼럼 — 편집자 해석이 달린 주차만 개별 글로 발행됩니다 */}
            {olderColumns.length > 0 && (
                <section className="mt-16 border-t border-gray-200 pt-10">
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">지난 주간 칼럼</h2>
                        <span className="text-sm text-gray-400 ml-auto">총 {olderColumns.length}편</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {olderColumns.map((report) => (
                            <Link
                                key={report.week_start}
                                href={`/trend/${report.week_start}`}
                                className="group block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-flex items-center bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                        {weekLabel(report)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {report.total_notices ? `${report.total_notices}건` : ''}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                                    {columnTitle(report)}
                                </h3>
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">
                                    {columnExcerpt(report)}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>{columnDate(report)}</span>
                                    <span className="font-medium group-hover:text-indigo-600 transition-colors">읽기 &rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 아직 칼럼이 없을 때 안내 */}
            {publishedColumns.length === 0 && latestReport && (
                <section className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-600 leading-7">
                    <p>주간 칼럼은 집계 수치에 편집자 해석을 더해 발행합니다. 해석이 작성된 주차부터 개별 글로 공개됩니다.</p>
                </section>
            )}

            {/* Schema.org 구조화 데이터 */}
            {latestReport && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Article",
                            "headline": `법원 자산매각 주간 동향 리포트 (${latestReport.week_start} ~ ${latestReport.week_end})`,
                            "description": `수집된 매각 공고 ${latestReport.total_notices || 0}건의 주간 분류별 집계`,
                            "datePublished": latestReport.week_end,
                            "dateModified": latestReport.week_end,
                            "author": {
                                "@type": "Organization",
                                "name": "CourtAuction.site"
                            },
                            "publisher": {
                                "@type": "Organization",
                                "name": "CourtAuction.site"
                            },
                            "mainEntityOfPage": {
                                "@type": "WebPage",
                                "@id": "https://www.courtauction.site/trend"
                            }
                        })
                    }}
                />
            )}
        </div>
    );
}
