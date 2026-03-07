import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Metadata } from 'next';

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
        .limit(12); // Last 12 weeks

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
        real_estate: '부동산',
        vehicle: '차량/동산',
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* 헤더 */}
            <header className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-700 text-sm font-bold mb-4">
                    🤖 AI 자동 분석 리포트
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                    📊 주간 자산매각 시장 동향
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
                    매주 수집되는 법원 회생·파산 자산매각 공고의 AI 요약 데이터를 종합 분석하여,
                    투자자에게 필요한 핵심 인사이트를 자동 생성합니다.
                </p>
            </header>

            {latestReport ? (
                <>
                    {/* 최신 리포트 */}
                    <article className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-12">
                        {/* 리포트 상단 메타 */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-cyan-300 text-sm font-bold mb-1">최신 리포트</p>
                                    <h2 className="text-xl font-bold">
                                        {latestReport.week_start} ~ {latestReport.week_end}
                                    </h2>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                                        <p className="text-slate-400 text-xs">총 공고</p>
                                        <p className="text-xl font-bold">{latestReport.total_notices}<span className="text-sm font-normal">건</span></p>
                                    </div>
                                    {latestReport.top_department && (
                                        <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                                            <p className="text-slate-400 text-xs">최다 법원</p>
                                            <p className="text-sm font-bold mt-1">{latestReport.top_department}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 카테고리 막대 */}
                            <div className="mt-4 flex gap-2">
                                {Object.entries(categoryBreakdown).map(([cat, count]) => (
                                    <div key={cat} className="bg-white/10 rounded-full px-3 py-1 text-xs">
                                        {catNames[cat] || '기타'}: <span className="font-bold">{count}</span>건
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI 브리핑 하이라이트 */}
                        {latestReport.briefing_text && (
                            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 border-b border-gray-100">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl mt-0.5">✨</span>
                                    <div>
                                        <h3 className="text-sm font-bold text-cyan-700 mb-2">AI 핵심 요약</h3>
                                        <p className="text-gray-700 leading-relaxed">{latestReport.briefing_text}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 트렌딩 태그 */}
                        {trendingTags.length > 0 && (
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                    🔥 이번 주 트렌딩 키워드
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {trendingTags.map((item) => (
                                        <Link
                                            key={item.tag}
                                            href={`/?q=${encodeURIComponent(item.tag)}`}
                                            className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                                        >
                                            <span>#{item.tag}</span>
                                            <span className="bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full text-xs">{item.count}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 전체 리포트 본문 */}
                        <div className="p-6 sm:p-8">
                            <div
                                className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-gray-900"
                                dangerouslySetInnerHTML={{
                                    __html: latestReport.full_report
                                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\n\n/g, '</p><p>')
                                        .replace(/\n- (.*)/g, '<li>$1</li>')
                                        .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
                                        .replace(/^(?!<[hup]|<li|<ul)(.*)/gm, '<p>$1</p>')
                                }}
                            />
                        </div>

                        {/* CTA */}
                        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                            <p className="text-gray-600 text-sm mb-4">
                                리포트에서 관심 있는 매물을 발견하셨나요? 지금 바로 검색해 보세요.
                            </p>
                            <div className="flex justify-center gap-3 flex-wrap">
                                <Link
                                    href="/"
                                    className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                >
                                    🔍 공고 검색하기
                                </Link>
                                <Link
                                    href="/blog"
                                    className="bg-white text-gray-700 font-bold px-6 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                                >
                                    📝 블로그 보기
                                </Link>
                            </div>
                        </div>
                    </article>

                    {/* 이전 리포트 아카이브 */}
                    {reports && reports.length > 1 && (
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                📁 이전 주간 리포트
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {reports.slice(1).map((report) => (
                                    <div
                                        key={report.id}
                                        className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-gray-700">
                                                {report.week_start} ~ {report.week_end}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {report.total_notices}건
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm line-clamp-2">
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
