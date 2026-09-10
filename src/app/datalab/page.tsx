import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Metadata } from 'next';
import DDayChart from '@/components/DDayChart';
import { filterQualityNotices } from '@/lib/noticeQuality';

export const revalidate = 600;

export const metadata: Metadata = {
    title: '데이터랩 | 법원 자산매각 입찰일·가격대 통계',
    description: '로옥션이 수집한 대법원 회생·파산 자산매각 공고를 집계했습니다. 향후 30일 입찰 마감일 분포와 최근 30일 최저매각가 상위·하위 공고를 집계 기준과 함께 제공합니다.',
    keywords: '경매통계, 데이터분석, 법원경매, 매각물건통계, 입찰일분포',
    alternates: { canonical: '/datalab' },
};

interface PricedNoticeRow {
    id: string;
    title: string;
    minimum_price: string | null;
    department: string | null;
    date_posted: string | null;
    ai_summary: string | null;
}

interface PriceItem {
    id: string;
    title: string;
    department: string | null;
    datePosted: string | null;
    subject: string;
    min: number;
}

/**
 * 개인 실명이 섞여 있을 가능성이 있는 구절을 걸러내는 보수적 패턴.
 * '채권자 홍길동', '소유자: 김OO' 처럼 역할 표기 뒤에 2~4자 한글 이름이 오면 개인으로 본다.
 * 법인 표기(주식회사·(주)·유한·재단 등)가 이어지는 경우는 제외한다.
 */
const PRIVATE_NAME_PATTERN =
    /(채권자|채무자|소유자|소유|원고|피고|망|상속인|피상속인|임차인|보증인|매도인)\s*[:：]?\s*(?!주식회사|\(주\)|㈜|유한|합자|합명|농업회사법인|재단|법인|사단)[가-힣]{2,4}(?=[\s,.)]|$)/;

/** AI 요약(마크다운)에서 '매각 대상' 항목의 첫 구절만 뽑아 마크다운을 제거한다. 개인 실명이 의심되면 빈 문자열을 돌려준다. */
function extractSubject(summary: string | null | undefined, max = 90): string {
    if (!summary) return '';
    // 다음 번호/불릿 항목(굵게 여부 무관) 또는 줄바꿈에서 멈춘다.
    const match = summary.match(/매각\s*대상\**\s*[:：]\s*([\s\S]*?)(?=\s*(?:\d+\.|[-•*]+)\s*\**\s*[가-힣]|\n|$)/);
    const raw = match?.[1] ?? '';
    const cleaned = raw
        .replace(/\(\s*소유[^)]*\)/g, '')
        .replace(/[*_`#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned) return '';
    if (PRIVATE_NAME_PATTERN.test(cleaned)) return '';
    return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
}

function toPriceItem(row: PricedNoticeRow): PriceItem {
    return {
        id: row.id,
        title: row.title,
        department: row.department,
        datePosted: row.date_posted ? row.date_posted.slice(0, 10) : null,
        subject: extractSubject(row.ai_summary),
        min: parseInt(row.minimum_price || '0', 10),
    };
}

function PriceList({ items, accent }: { items: PriceItem[]; accent: 'blue' | 'emerald' }) {
    const hover = accent === 'blue'
        ? 'group-hover:border-blue-300 group-hover:bg-blue-50/30'
        : 'group-hover:border-emerald-300 group-hover:bg-emerald-50/30';
    const titleHover = accent === 'blue' ? 'group-hover:text-blue-700' : 'group-hover:text-emerald-700';
    const price = accent === 'blue' ? 'text-blue-600' : 'text-emerald-600';

    return (
        <ol className="space-y-4">
            {items.map((item, idx) => (
                <li key={item.id}>
                    <Link href={`/notice/${item.id}`} className="block group">
                        <div className={`flex flex-col p-4 rounded-xl border border-gray-100 bg-gray-50/30 transition-all ${hover}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-black text-gray-400 text-lg italic pr-3">{idx + 1}</span>
                                <h3 className={`flex-1 font-bold text-gray-800 text-sm line-clamp-2 leading-relaxed ${titleHover}`}>
                                    {item.title}
                                </h3>
                            </div>
                            {item.subject && (
                                <p className="pl-6 text-xs text-gray-500 leading-relaxed line-clamp-2">
                                    {item.subject}
                                </p>
                            )}
                            <div className="flex justify-between items-center mt-3 pl-6 gap-3">
                                <span className="text-[11px] text-gray-500">
                                    {item.department?.split(' ')[0] || '법원'}
                                    {item.datePosted && <> · {item.datePosted}</>}
                                </span>
                                <span className={`font-extrabold whitespace-nowrap ${price}`}>
                                    {item.min.toLocaleString()}원
                                </span>
                            </div>
                        </div>
                    </Link>
                </li>
            ))}
        </ol>
    );
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

    // 2. 최근 30일 최저매각가 상위·하위 공고
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: allPricedNotices } = await supabase
        .from('court_notices')
        .select('id, title, minimum_price, department, date_posted, ai_summary')
        .eq('source_type', 'notice')
        .gte('date_posted', thirtyDaysAgoStr)
        .not('minimum_price', 'is', null)
        .neq('minimum_price', '0')
        .limit(1000); // 충분한 샘플 확보

    let highestPriceItems: PriceItem[] = [];
    let lowestPriceItems: PriceItem[] = [];

    if (allPricedNotices) {
        // 요약 품질 게이트를 통과한 공고만 링크한다 (첨부파일 fallback·짧은 요약 제외)
        const parsedItems = filterQualityNotices(allPricedNotices as PricedNoticeRow[])
            .map(toPriceItem)
            .filter(item => item.min > 0);

        // 최저매각가 상위 3건
        highestPriceItems = [...parsedItems].sort((a, b) => b.min - a.min).slice(0, 3);

        // 최저매각가 하위 3건 (자료 오류로 보이는 극소액 건 제외: 100만 원 이상)
        lowestPriceItems = [...parsedItems].filter(item => item.min >= 1000000).sort((a, b) => a.min - b.min).slice(0, 3);
    }

    const showHighest = highestPriceItems.length >= 3;
    const showLowest = lowestPriceItems.length >= 3;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <header className="mb-10 sm:mb-14">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    데이터랩 <span className="text-gray-400 font-light">| 입찰일·가격대 통계</span>
                </h1>
                <p className="text-gray-500 max-w-2xl leading-relaxed text-sm">
                    로옥션이 수집한 대법원 회생·파산 자산매각 공고를 집계했습니다.
                    향후 30일간의 입찰 마감일 분포와 최근 30일 공고 중 최저매각가 상위·하위 건을 보여줍니다.
                    수치는 공고에 기재된 예정 금액 기준이며, 낙찰 결과가 아닙니다.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                    집계 기준일 {todayStr} · 자료 출처 대한민국 법원 공고 · 집계 방법은 <a href="#methodology" className="underline hover:text-gray-600">아래 방법론</a> 참조
                </p>
                <nav aria-label="페이지 내 이동" className="mt-4 flex flex-wrap gap-2 text-xs">
                    <a href="#dday" className="border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-gray-50">입찰 마감일 분포</a>
                    {showHighest && <a href="#highest" className="border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-gray-50">최저매각가 상위</a>}
                    {showLowest && <a href="#lowest" className="border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-gray-50">최저매각가 하위</a>}
                    <a href="#methodology" className="border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-gray-50">집계 방법과 한계</a>
                </nav>
            </header>

            <div className="space-y-12">
                {/* 1. 입찰 마감일 분포 */}
                <section id="dday" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-6">
                    <div className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            향후 30일 입찰 마감일 분포
                        </h2>
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                            매각 기일(입찰일)이 공고에 기재된 공고를 일자별로 집계했습니다. 막대는 자산 종류별 건수,
                            선은 해당 일자 공고들의 최저매각가 합계입니다. 막대가 높은 날은 같은 날 입찰 마감이 몰리는 일자입니다.
                        </p>
                    </div>
                    <div className="p-6 sm:p-8">
                        {rawChartItems.length > 0 ? (
                            <DDayChart rawItems={rawChartItems} />
                        ) : (
                            <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400">
                                집계할 공고가 없습니다.
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. 최저매각가 상위·하위 */}
                {(showHighest || showLowest) && (
                    <div className="grid md:grid-cols-2 gap-8">
                        {showHighest && (
                            <section id="highest" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 scroll-mt-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    최저매각가 상위 3건
                                </h2>
                                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                    최근 30일 게시 공고 중 공고에 기재된 최저매각가가 가장 높은 3건입니다.
                                    법원·게시일과 요약에서 뽑은 매각 대상을 함께 표시합니다.
                                </p>
                                <PriceList items={highestPriceItems} accent="blue" />
                            </section>
                        )}

                        {showLowest && (
                            <section id="lowest" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 scroll-mt-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    최저매각가 하위 3건(100만 원 이상)
                                </h2>
                                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                    최근 30일 게시 공고 중 최저매각가가 100만 원 이상인 건에서 금액이 가장 낮은 3건입니다.
                                    100만 원 미만은 자료 오류 가능성이 있어 제외했습니다.
                                </p>
                                <PriceList items={lowestPriceItems} accent="emerald" />
                            </section>
                        )}
                    </div>
                )}
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
                            최저매각가 상위·하위 목록은 최근 30일 이내 게시된 공고 중 최저매각가가 확인되고 요약이 추출된 건을 대상으로 하며,
                            하위 목록은 자료 오류로 보이는 극소액 건을 걸러내기 위해 100만 원 이상만 포함합니다. 조건에 맞는 공고가 3건 미만이면 해당 목록은 표시하지 않습니다.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-bold text-gray-900">금액의 의미</dt>
                        <dd className="text-gray-600">
                            표시되는 금액은 공고에 기재된 <strong>최저매각가</strong>이며 낙찰가가 아닙니다.
                            로옥션은 입찰 결과를 수집하지 않으므로 입찰 결과에 기반한 지표는 제공하지 않습니다.
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
                            공고 수집은 매일 자동 실행되며, 이 페이지는 10분 단위로 데이터베이스를 다시 집계합니다.
                            데이터 처리와 편집 원칙은 <Link href="/editorial-policy" className="text-indigo-700 underline font-semibold">데이터·편집 원칙</Link>에 정리되어 있습니다.
                        </dd>
                    </div>
                </dl>
            </section>

            {/* 하단 이동 링크 */}
            <div className="mt-10 text-center bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">개별 공고를 찾고 계신가요?</h3>
                <p className="text-gray-500 text-sm mb-6">검색에서 기간·분야·키워드로 조건에 맞는 공고를 직접 확인할 수 있습니다.</p>
                <div className="flex justify-center gap-3 flex-wrap">
                    <Link href="/" className="inline-block bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm">
                        공고 검색하기
                    </Link>
                    <Link href="/trend" className="inline-block bg-white text-gray-700 font-bold px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                        주간 칼럼 보기
                    </Link>
                </div>
            </div>
        </div>
    );
}
