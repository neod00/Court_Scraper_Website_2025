import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Metadata } from 'next';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: '주간 시장 동향 리포트 | 법원 자산매각 AI 분석',
    description: 'AI가 분석한 법원 회생·파산 자산매각 주간 시장 동향 리포트. 매주 업데이트되는 부동산, 차량, 기타 자산의 매각 트렌드를 확인하세요.',
    keywords: '주간동향, 시장분석, AI분석, 자산매각, 회생파산, 트렌드리포트, 법원경매',
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
                    AI 자동 분석 · 매주 업데이트
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
                    주간 자산매각 시장 동향 리포트
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed text-sm">
                    매주 수집되는 법원 회생·파산 자산매각 공고의 AI 요약 데이터를 종합 분석하여,
                    투자자에게 필요한 핵심 인사이트를 자동으로 생성합니다.
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

                        {/* AI 브리핑 하이라이트 */}
                        {latestReport.briefing_text && (
                            <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 px-8 py-6 border-b border-amber-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                                        ✨
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-amber-800 mb-2 uppercase tracking-wider">에디터 핵심 요약</h3>
                                        <p className="text-gray-700 leading-relaxed text-[15px]">{latestReport.briefing_text}</p>
                                    </div>
                                </div>
                            </div>
                        )}

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

                        {/* 전체 리포트 본문 - react-markdown */}
                        <div className="px-8 py-10 sm:px-12">
                            <MarkdownRenderer content={latestReport.full_report} />
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

                    {/* 이전 리포트 아카이브 */}
                    {reports && reports.length > 1 && (
                        <section className="mb-12">
                            <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                                📁 이전 주간 리포트 아카이브
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {reports.slice(1).map((report) => (
                                    <div
                                        key={report.id}
                                        className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-gray-800">
                                                {report.week_start} ~ {report.week_end}
                                            </span>
                                            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">
                                                {report.total_notices}건
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                                            {report.briefing_text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            ) : (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                    <p className="text-blue-700">
                        아직 생성된 주간 리포트가 없습니다. 데이터가 충분히 수집되면 AI가 자동으로 분석 리포트를 생성합니다.
                    </p>
                </div>
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
                            "description": latestReport.briefing_text,
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
                                "@id": "https://courtauction.site/trend"
                            }
                        })
                    }}
                />
            )}
        </div>
    );
}
