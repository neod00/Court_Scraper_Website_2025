import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: '주간 매각 공고 통계 | 법원 자산매각',
    description: '수집된 법원 회생·파산 자산매각 공고의 주간 건수와 분류별 집계를 확인하세요.',
    keywords: '주간통계, 자산매각, 회생파산, 매각공고, 법원경매',
    alternates: { canonical: '/trend' },
};

interface TrendingTag {
    tag: string;
    count: number;
}

export default async function TrendPage() {
    // Fetch all weekly reports, most recent first
    const { data: reports } = await supabase
        .from('weekly_reports')
        .select('*')
        .order('week_end', { ascending: false })
        .limit(12);

    const latestReport = reports?.[0];

    // Parse trending tags
    let trendingTags: TrendingTag[] = [];
    if (latestReport?.trending_tags) {
        try {
            trendingTags = typeof latestReport.trending_tags === 'string'
                ? JSON.parse(latestReport.trending_tags)
                : latestReport.trending_tags;
        } catch { trendingTags = []; }
    }

    // Parse category breakdown
    let categoryBreakdown: Record<string, number> = {};
    if (latestReport?.category_breakdown) {
        try {
            categoryBreakdown = typeof latestReport.category_breakdown === 'string'
                ? JSON.parse(latestReport.category_breakdown)
                : latestReport.category_breakdown;
        } catch { categoryBreakdown = {}; }
    }

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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-50 to-indigo-50 text-indigo-700 text-sm font-bold mb-4 border border-indigo-100">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    공고 데이터 자동 집계 · 매주 업데이트
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
                    주간 매각 공고 통계
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed text-sm">
                    수집된 공고를 주차·분류·담당 법원 기준으로 집계합니다.
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

                        {/* 집계 기준 안내 */}
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

            {/* 📁 이전 주간 리포트 아카이브 */}
            {reports && reports.length > 1 && (
                <section className="mt-16 border-t border-gray-200 pt-10">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl">📁</span>
                        <h2 className="text-xl font-bold text-gray-900">이전 주간 리포트 아카이브</h2>
                        <span className="text-sm text-gray-400 ml-auto">총 {reports.length - 1}건</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reports.slice(1).map((report: any, idx: number) => {
                            // Use week_start (Monday) for month label
                            const startDate = new Date(report.week_start);
                            const month = startDate.getMonth() + 1;
                            const day = startDate.getDate();
                            // Week number based on Monday's position in month
                            const weekOfMonth = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : day <= 28 ? 4 : 5;
                            const weekLabel = `${month}월 ${weekOfMonth}주차`;

                            let cats: Record<string, number> = {};
                            try {
                                cats = typeof report.category_breakdown === 'string'
                                    ? JSON.parse(report.category_breakdown)
                                    : (report.category_breakdown || {});
                            } catch { cats = {}; }
                            const totalNotices = Object.values(cats).reduce((a: number, b: number) => a + b, 0);

                            return (
                                <article
                                    key={report.id || idx}
                                    className="block bg-white border border-gray-200 rounded-xl p-5"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            📊 {weekLabel}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {totalNotices > 0 ? `${totalNotices}건` : ''}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm mb-2">
                                        {weekLabel} 매각 공고 집계
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                                        수집 공고 {totalNotices || report.total_notices || 0}건을 분류별로 집계한 기록입니다.
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">
                                            {report.week_start} ~ {report.week_end}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            자동 집계
                                        </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
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
