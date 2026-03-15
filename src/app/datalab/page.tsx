import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Metadata } from 'next';
import DDayChart from '@/components/DDayChart';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'AI 데이터랩 | 법원 자산매각 주간 누적 통계',
    description: 'AI가 분석한 최근 법원 자산매각의 통계 데이터를 확인하세요. 경매 마감(D-Day) 분포, 가격대별 랭킹 등 투자 인사이트를 제공합니다.',
    keywords: 'AI데이터랩, 경매통계, 데이터분석, 법원경매, 매각물건통계',
};

export default async function DataLabPage() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 미래 30일 계산
    const future30Days = new Date(today);
    future30Days.setDate(today.getDate() + 30);
    const future30DaysStr = future30Days.toISOString().split('T')[0];

    // 1. D-Day 분포 데이터 (오늘 ~ +30일 물건)
    const { data: dDayData } = await supabase
        .from('court_notices')
        .select('id, title, auction_date, minimum_price')
        .gte('auction_date', todayStr)
        .lte('auction_date', future30DaysStr);

    const rawChartItems = (dDayData || []).map(item => {
        const title = item.title || '';
        let type = '기타';
        if (title.match(/아파트|다세대|빌라|주택|오피스텔|도시형|연립/)) type = '주거용';
        else if (title.match(/상가|근린|공장|숙박|오피스|지식산업|창고/)) type = '상업용';
        else if (title.match(/토지|대지|임야|전|답|과수원|잡종지/)) type = '토지';
        
        return {
            date: item.auction_date,
            type,
            min_price: parseInt(item.minimum_price || '0', 10)
        };
    });

    // 2. 최근 한 달 기준 최저가/최고가 물건 데이터
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: allPricedNotices } = await supabase
        .from('court_notices')
        .select('id, title, minimum_price, appraised_price, department, status')
        .gte('date_posted', thirtyDaysAgoStr)
        .not('minimum_price', 'is', null)
        .neq('minimum_price', '0')
        .limit(1000); // 충분한 샘플 확보

    let highestPriceItems: any[] = [];
    let lowestPriceItems: any[] = [];

    if (allPricedNotices) {
        const parsedItems = allPricedNotices.map(item => ({
            ...item,
            min: parseInt(item.minimum_price || '0', 10),
            app: parseInt(item.appraised_price || '0', 10),
        })).filter(item => item.min > 0);

        // 최고가 Top 3
        highestPriceItems = [...parsedItems].sort((a, b) => b.min - a.min).slice(0, 3);
        
        // 최저가 Top 3 (너무 낮은 100원짜리 등 쓰레기 데이터 제외 위해 100만원 이상으로 필터링)
        lowestPriceItems = [...parsedItems].filter(item => item.min >= 1000000).sort((a, b) => a.min - b.min).slice(0, 3);
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <header className="mb-10 sm:mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-sm font-bold mb-4 border border-emerald-100">
                    <span className="text-emerald-500">📊</span>
                    실시간 데이터 연동 중
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    AI 데이터랩 <span className="text-gray-400 font-light">| 주간 누적 통계</span>
                </h1>
                <p className="text-gray-500 max-w-2xl leading-relaxed text-sm">
                    대법원 공고 원천 데이터를 바탕으로 이번 달의 자산매각 트렌드를 시각적으로 분석합니다.
                    입찰 마감일 분포와 주목해야 할 가격대별 매물을 한눈에 파악하세요.
                </p>
            </header>

            <div className="space-y-12">
                {/* 1. D-Day 분포그래프 섹션 (애드센스 친화적 텍스트 포함) */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span>📉</span> 향후 30일 입찰 마감(D-Day) 분포도
                        </h2>
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                            매각 기일(입찰일)이 다가오는 물건들의 일자별 분포를 나타냅니다. 
                            그래프가 높게 솟은 날은 많은 자산이 시장에 풀리는 <strong>'슈퍼 입찰일'</strong>입니다. 
                            이러한 날에는 투자자들의 관심이 분산되어 단독 입찰이나 저가 낙찰의 기회가 상대적으로 높아질 수 있습니다. 반면 물건이 적은 날에는 인기가 몰려 낙찰가율이 상승할 수 있으니 주의 깊은 전략이 필요합니다.
                        </p>
                    </div>
                    <div className="p-6 sm:p-8">
                        {rawChartItems.length > 0 ? (
                            <DDayChart rawItems={rawChartItems} />
                        ) : (
                            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400">
                                데이터가 부족합니다.
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. 최고가 & 최저가 랭킹 섹션 */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* 최고가 매물 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                👑 최고가 매물 Top 3
                            </h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            현재 진행 중인 공고 중 최저가가 가장 높은 대형 자산들입니다. 공장, 대형 상가, 토지 등 
                            기관이나 기업 투자자가 주목할 만한 굵직한 물건들이 랭크되어 있습니다.
                        </p>
                        <div className="space-y-4">
                            {highestPriceItems.map((item, idx) => (
                                <Link href={`/notice/${item.id}`} key={item.id} className="block group">
                                    <div className="flex flex-col p-4 rounded-xl border border-gray-100 bg-gray-50/30 group-hover:border-blue-300 group-hover:bg-blue-50/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-black text-gray-400 text-lg italic pr-3">{idx + 1}</span>
                                            <h3 className="flex-1 font-bold text-gray-800 text-sm line-clamp-2 leading-relaxed group-hover:text-blue-700">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pl-6">
                                            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">
                                                {item.department?.split(' ')[0] || '법원'}
                                            </span>
                                            <span className="font-extrabold text-blue-600">
                                                {(item.min).toLocaleString()}원
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* 최저가 매물 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                💎 소액 투자 매물 Top 3
                            </h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            (100만 원 이상 기준) 현재 최저가가 가장 낮은 소박한 자산들입니다. 
                            소자본으로 경매나 공매를 처음 시작하시는 분들이 실전 연습용으로 살펴보기에 좋은 물건들입니다.
                        </p>
                        <div className="space-y-4">
                            {lowestPriceItems.map((item, idx) => (
                                <Link href={`/notice/${item.id}`} key={item.id} className="block group">
                                    <div className="flex flex-col p-4 rounded-xl border border-gray-100 bg-gray-50/30 group-hover:border-emerald-300 group-hover:bg-emerald-50/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-black text-gray-400 text-lg italic pr-3">{idx + 1}</span>
                                            <h3 className="flex-1 font-bold text-gray-800 text-sm line-clamp-2 leading-relaxed group-hover:text-emerald-700">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pl-6">
                                            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">
                                                {item.department?.split(' ')[0] || '법원'}
                                            </span>
                                            <span className="font-extrabold text-emerald-600">
                                                {(item.min).toLocaleString()}원
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
            
            {/* 하단 CTA */}
            <div className="mt-16 text-center bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <span className="text-3xl mb-4 block">🔍</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">더 많은 데이터가 궁금하신가요?</h3>
                <p className="text-gray-500 text-sm mb-6">검색 기능을 통해 조건에 맞는 세부 매물을 직접 확인해보세요.</p>
                <Link href="/" className="inline-block bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors">
                    매물 검색하러 가기
                </Link>
            </div>
        </div>
    );
}
