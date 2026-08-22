import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Metadata } from 'next';
import DDayChart from '@/components/DDayChart';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: '데이터랩 | 법원 자산매각 입찰일·가격대 통계',
    description: '로옥션이 수집한 대법원 회생·파산 자산매각 공고를 집계했습니다. 향후 30일 입찰 마감일 분포와 최근 30일 가격대별 물건 현황을 집계 기준과 함께 제공합니다.',
    keywords: '경매통계, 데이터분석, 법원경매, 매각물건통계, 입찰일분포',
    alternates: { canonical: '/datalab' },
};
interface PriceItem {
    id: string;
    title: string;
    department: string | null;
    min: number;
    app: number;
}


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
        .select('id, title, auction_date, minimum_price, ai_summary')
        .eq('source_type', 'notice')
        .gte('auction_date', todayStr)
        .lte('auction_date', future30DaysStr);

    const rawChartItems = (dDayData || []).map(item => {
        const fullText = (item.title || '') + ' ' + (item.ai_summary || '');
        let type = '기타';
        if (fullText.match(/아파트|다세대|빌라|주택|오피스텔|도시형|연립/)) type = '주거용';
        else if (fullText.match(/상가|근린|공장|숙박|오피스|지식산업|창고/)) type = '상업용';
        else if (fullText.match(/토지|대지|임야|전|답|과수원|잡종지/)) type = '토지';
        else if (fullText.match(/차량|자동차|승용차|트럭|버스|중기|덤프|굴삭기|화물차/)) type = '차량';
        
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
        .eq('source_type', 'notice')
        .gte('date_posted', thirtyDaysAgoStr)
        .not('minimum_price', 'is', null)
        .neq('minimum_price', '0')
        .limit(1000); // 충분한 샘플 확보

    let highestPriceItems: PriceItem[] = [];
    let lowestPriceItems: PriceItem[] = [];

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
            <header className="mb-10 sm:mb-14">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    데이터랩 <span className="text-gray-400 font-light">| 입찰일·가격대 통계</span>
                </h1>
                <p className="text-gray-500 max-w-2xl leading-relaxed text-sm">
                    로옥션이 수집한 대법원 회생·파산 자산매각 공고를 집계했습니다.
                    향후 30일간의 입찰 마감일 분포와 최근 30일 공고의 가격대별 현황을 보여줍니다.
                    수치는 공고에 기재된 예정 금액 기준이며, 낙찰 결과가 아닙니다.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                    집계 기준일 {todayStr} · 자료 출처 대한민국 법원 공고 · 집계 방법은 <a href="#methodology" className="underline hover:text-gray-600">아래 방법론</a> 참조
                </p>
            </header>

            <div className="space-y-12">
                {/* 1. D-Day 분포그래프 섹션 (애드센스 친화적 텍스트 포함) */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            향후 30일 입찰 마감일 분포
                        </h2>
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                            매각 기일(입찰일)이 공고에 기재된 물건을 일자별로 집계했습니다. 막대는 자산 종류별 건수,
                            선은 해당 일자 물건들의 최저매각가 합계입니다. 그래프가 높은 날은 같은 날 입찰이 몰리는 일자이므로
                            일정을 겹치지 않게 계획하는 데 참고할 수 있습니다.
                        </p>
                        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                            자산 종류는 공고 제목과 요약의 키워드로 자동 분류한 값이라 실제와 다를 수 있고, 입찰 결과(낙찰 여부·낙찰가)는
                            수집 대상이 아니므로 이 그래프로 경쟁률이나 낙찰가율을 추정할 수는 없습니다.
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
            
            {/* 방법론 */}
            <section id="methodology" className="mt-16 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 scroll-mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">집계 방법과 한계</h2>
                <dl className="space-y-5 text-sm leading-7">
                    <div>
                        <dt className="font-bold text-gray-900">자료 출처</dt>
                        <dd className="text-gray-600">
                            대한민국 법원이 공개하는 회생·파산 자산매각 공고입니다. 로옥션이 공고 목록과 첨부문서를 매일 수집해
                            자체 데이터베이스에 보관하며, 이 페이지는 그 데이터를 집계한 결과입니다.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-bold text-gray-900">집계 대상과 기간</dt>
                        <dd className="text-gray-600">
                            입찰 마감일 분포는 매각 기일이 {todayStr}부터 향후 30일 이내인 공고를 대상으로 합니다.
                            가격대별 현황은 최근 30일 이내 게시된 공고 중 최저매각가가 확인되는 건을 대상으로 하며,
                            소액 물건 목록은 자료 오류로 보이는 극소액 건을 걸러내기 위해 100만 원 이상만 포함합니다.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-bold text-gray-900">금액의 의미</dt>
                        <dd className="text-gray-600">
                            표시되는 금액은 공고에 기재된 <strong>최저매각가</strong>이며 낙찰가가 아닙니다.
                            로옥션은 입찰 결과를 수집하지 않으므로 낙찰가율·경쟁률·수익률은 제공하지 않습니다.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-bold text-gray-900">알려진 한계</dt>
                        <dd className="text-gray-600">
                            자산 종류 분류는 공고 제목과 요약의 키워드에 기반한 자동 분류라 오분류가 있을 수 있습니다.
                            금액은 첨부문서에서 자동 추출한 값이므로 원문과 다를 수 있고, 추출에 실패한 공고는 집계에서 빠집니다.
                            정정·취소·재공고로 실제 건수와 차이가 날 수 있습니다. 수치는 탐색용 참고 자료이며,
                            입찰 전에는 반드시 원문 공고와 첨부문서를 확인하시기 바랍니다.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-bold text-gray-900">갱신 주기</dt>
                        <dd className="text-gray-600">
                            공고 수집은 매일 자동 실행되며, 이 페이지는 접속 시점의 데이터베이스를 기준으로 매번 다시 집계합니다.
                            데이터 처리와 편집 원칙은 <Link href="/editorial-policy" className="text-indigo-700 underline font-semibold">데이터·편집 원칙</Link>에 정리되어 있습니다.
                        </dd>
                    </div>
                </dl>
            </section>

            {/* 하단 CTA */}
            <div className="mt-10 text-center bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">개별 공고를 찾고 계신가요?</h3>
                <p className="text-gray-500 text-sm mb-6">검색에서 기간·분야·키워드로 조건에 맞는 공고를 직접 확인할 수 있습니다.</p>
                <div className="flex justify-center gap-3 flex-wrap">
                    <Link href="/" className="inline-block bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm">
                        공고 검색하기
                    </Link>
                    <Link href="/trend" className="inline-block bg-white text-gray-700 font-bold px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                        주간 통계 보기
                    </Link>
                </div>
            </div>
        </div>
    );
}
