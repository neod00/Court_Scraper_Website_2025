import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
    type WeeklyReport,
    filterPublishedColumns,
    weekLabel,
    columnTitle,
    columnAuthor,
    columnDate,
    columnExcerpt,
    columnParagraphs,
    parseJsonColumn,
    categoryLabel,
} from '@/lib/weeklyColumn';

export const revalidate = 600;

const siteUrl = 'https://www.courtauction.site';

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

/** category_breakdown에서 건수 기준 상위 n개 분류를 뽑는다. */
function topCategories(report: WeeklyReport, n = 3): { key: string; count: number }[] {
    const breakdown = parseJsonColumn<Record<string, number>>(report.category_breakdown, {});
    return Object.entries(breakdown)
        .map(([key, count]) => ({ key, count: Number(count) || 0 }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
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
    const featuredColumn: WeeklyReport | undefined = publishedColumns[0];
    const olderColumns = publishedColumns.slice(1);

    // 집계 수치는 해석 유무와 무관하게 최신 주차를 쓴다.
    const latestReport: WeeklyReport | undefined = reports[0];

    const trendingTags = parseJsonColumn<TrendingTag[]>(latestReport?.trending_tags, []);
    const categoryBreakdown = parseJsonColumn<Record<string, number>>(latestReport?.category_breakdown, {});

    // 칼럼이 아직 없을 때 보여 줄 최근 4주 집계표
    const recentWeeks = reports.slice(0, 4);
    // 아직 끝나지 않은 주차는 '집계 중'으로 표시한다 (서버 시각, KST 기준).
    const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const inProgress = (r: WeeklyReport) => r.week_end > todayStr;

    const jsonLd = featuredColumn
        ? {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: columnTitle(featuredColumn),
            description: columnExcerpt(featuredColumn, 155),
            datePublished: columnDate(featuredColumn),
            dateModified: columnDate(featuredColumn),
            author: featuredColumn.editor_note_by?.trim()
                ? { '@type': 'Person', name: columnAuthor(featuredColumn).split('·')[0].trim() }
                : { '@type': 'Organization', name: '로옥션(LawAuction)', url: siteUrl },
            publisher: { '@type': 'Organization', name: '로옥션(LawAuction)', url: siteUrl },
            mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/trend/${featuredColumn.week_start}` },
        }
        : {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: '주간 데이터 칼럼',
            about: '법원 회생·파산 자산매각 공고 주간 집계',
            url: `${siteUrl}/trend`,
            publisher: { '@type': 'Organization', name: '로옥션(LawAuction)', url: siteUrl },
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
                    {/* 최신 집계 */}
                    <article className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-12">
                        {/* 상단 히어로 */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-8 relative overflow-hidden">
                            {/* 배경 패턴 */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 bg-cyan-400/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-cyan-400/30">
                                            최신 주간 집계
                                        </div>
                                        <h2 className="text-2xl font-extrabold tracking-tight">
                                            {latestReport.week_start} ~ {latestReport.week_end}{inProgress(latestReport) ? ' · 집계 중' : ''}
                                        </h2>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
                                            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1">수집 공고</p>
                                            <p className="text-3xl font-extrabold">{latestReport.total_notices ?? 0}<span className="text-sm font-normal text-slate-400">건</span></p>
                                        </div>
                                        {latestReport.top_department && (
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
                                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1">최다 공고 법원</p>
                                                <p className="text-base font-bold mt-1">{latestReport.top_department}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 분류별 건수 */}
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {Object.entries(categoryBreakdown).map(([cat, count]) => (
                                        <div key={cat} className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs border border-white/10 font-medium">
                                            {categoryLabel(cat)}: <span className="font-bold text-white">{count}</span>건
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 자주 등장한 키워드 — 검색 결과 페이지는 색인 대상이 아니므로 링크하지 않는다 */}
                        {trendingTags.length > 0 && (
                            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-xs font-extrabold text-gray-400 mb-3 uppercase tracking-wider">
                                    이번 주 자주 등장한 키워드
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {trendingTags.map((item) => (
                                        <span
                                            key={item.tag}
                                            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm"
                                        >
                                            <span className="text-indigo-400">#</span>
                                            <span>{item.tag}</span>
                                            <span className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.count}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 최신 칼럼(있을 때) 또는 집계 기준 안내 */}
                        {featuredColumn ? (
                            <div className="px-8 py-10 sm:px-12">
                                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-gray-900">{columnTitle(featuredColumn)}</h3>
                                    <span className="text-xs text-gray-400">{columnDate(featuredColumn)}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">
                                    {columnAuthor(featuredColumn)}
                                    {featuredColumn.week_start !== latestReport.week_start && (
                                        <span className="text-gray-400"> · {weekLabel(featuredColumn)} 집계 기준</span>
                                    )}
                                </p>
                                <div className="space-y-4 text-[15px] leading-8 text-gray-700">
                                    {columnParagraphs(featuredColumn).slice(0, 2).map((p, i) => (
                                        <p key={i}>{p}</p>
                                    ))}
                                </div>
                                <Link
                                    href={`/trend/${featuredColumn.week_start}`}
                                    className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-indigo-700 hover:text-indigo-800"
                                >
                                    칼럼 전문 읽기 &rarr;
                                </Link>
                            </div>
                        ) : (
                            <div className="px-8 py-10 sm:px-12">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">이 통계를 읽는 방법</h3>
                                <div className="space-y-3 text-sm leading-7 text-gray-600">
                                    <p>수집 공고 수는 해당 주간에 로옥션이 수집한 공고를 기준으로 집계합니다.</p>
                                    <p>분류와 담당 법원 표기는 원문 및 수집 데이터에 따라 달라질 수 있으며, 중복·정정 공고로 실제 건수와 차이가 날 수 있습니다.</p>
                                    <p>가격 적정성, 권리관계, 물건 상태를 판단한 결과가 아닙니다. 참여 전 원문과 첨부 문서를 직접 확인해야 합니다.</p>
                                    <p>
                                        <Link href="/editorial-policy" className="font-semibold text-indigo-700 underline">데이터·편집 원칙 자세히 보기</Link>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 이동 링크 */}
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-8 py-8 text-center border-t border-indigo-100">
                            <p className="text-gray-600 text-sm mb-5 font-medium">
                                개별 공고는 검색에서 기간·분야·키워드로 확인할 수 있습니다.
                            </p>
                            <div className="flex justify-center gap-3 flex-wrap">
                                <Link
                                    href="/"
                                    className="bg-indigo-600 text-white font-bold px-7 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 text-sm"
                                >
                                    공고 검색하기
                                </Link>
                                <Link
                                    href="/datalab"
                                    className="bg-white text-gray-700 font-bold px-7 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm text-sm"
                                >
                                    데이터랩 통계
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

            {/* 칼럼이 아직 없을 때 — 최근 4주 집계표 */}
            {publishedColumns.length === 0 && recentWeeks.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">최근 4주 집계</h2>
                    <p className="text-sm text-gray-500 mb-5 leading-6">
                        주간별 수집 공고 수와 최다 공고 법원, 건수 기준 상위 분류입니다. 분류는 공고 제목·요약 기준 자동 분류이며 원문과 다를 수 있습니다.
                    </p>
                    <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th scope="col" className="px-4 py-3 font-bold">주간</th>
                                    <th scope="col" className="px-4 py-3 font-bold text-right">수집 공고</th>
                                    <th scope="col" className="px-4 py-3 font-bold">최다 공고 법원</th>
                                    <th scope="col" className="px-4 py-3 font-bold">상위 분류</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentWeeks.map((report) => {
                                    const cats = topCategories(report, 3);
                                    return (
                                        <tr key={report.week_start} className="align-top">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-semibold text-gray-900">{weekLabel(report)}</span>
                                                <span className="block text-xs text-gray-400">{report.week_start} ~ {report.week_end}{inProgress(report) ? ' · 집계 중' : ''}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                                                {report.total_notices ?? 0}건
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                                {report.top_department || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {cats.length > 0
                                                    ? cats.map((c) => `${categoryLabel(c.key)} ${c.count}건`).join(' · ')
                                                    : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Schema.org 구조화 데이터 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </div>
    );
}
