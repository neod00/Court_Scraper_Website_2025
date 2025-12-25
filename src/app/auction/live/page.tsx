'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function safeDecodeURIComponent(str: string | null): string {
    if (!str) return '';
    try {
        return decodeURIComponent(str);
    } catch {
        return str;
    }
}

function formatPrice(price: string): string {
    if (!price) return '-';
    const num = parseInt(price.replace(/,/g, ''), 10);
    if (isNaN(num)) return price;
    return '₩' + num.toLocaleString('ko-KR');
}

function formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length < 8) return '-';
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
}

function LiveDetailContent() {
    const searchParams = useSearchParams();

    // Get all data from URL params (passed from list page)
    const saNo = searchParams.get('saNo') || '';
    const boCd = searchParams.get('boCd') || '';
    const maemulSer = searchParams.get('maemulSer') || '1';
    const caseNo = searchParams.get('caseNo') || '';
    const court = searchParams.get('court') || '';
    const department = searchParams.get('department') || '';
    const itemType = searchParams.get('itemType') || '';
    const address = searchParams.get('address') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const appraisalPrice = searchParams.get('appraisalPrice') || '';
    const priceRatio = searchParams.get('priceRatio') || '';
    const failCount = searchParams.get('failCount') || '0';
    const interestCount = searchParams.get('interestCount') || '0';
    const remarks = safeDecodeURIComponent(searchParams.get('remarks'));
    const auctionDate = searchParams.get('auctionDate') || '';

    const popularItemsUrl = 'https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml&pgmDvsNum=2';

    // Calculate deposit (10% of min price)
    const depositNum = parseInt(minPrice.replace(/,/g, ''), 10);
    const deposit = isNaN(depositNum) ? '-' : '₩' + Math.floor(depositNum * 0.1).toLocaleString('ko-KR');

    if (!saNo || !boCd) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <div className="text-4xl">⚠️</div>
                <p className="text-red-600 font-medium">필수 파라미터가 누락되었습니다.</p>
                <Link href="/auction" className="text-indigo-600 hover:underline">← 목록으로 돌아가기</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/auction" className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        목록으로
                    </Link>
                    <div className="font-bold text-lg text-slate-800">{caseNo}</div>
                    <a
                        href={popularItemsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg border bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
                    >
                        법원 공식
                    </a>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Top Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
                                {itemType || '부동산'}
                            </span>
                            <span className="text-slate-400 text-sm">{court} {department}</span>
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                🔻 {failCount}회 유찰
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                                👁 {interestCount}명 관심
                            </span>
                        </div>

                        <h1 className="text-xl font-bold text-slate-900 mb-6 leading-tight">
                            {address || '주소 정보 없음'}
                        </h1>

                        {/* Price Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">감정가</p>
                                <p className="text-lg font-bold text-slate-700">{formatPrice(appraisalPrice)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">최저매각가격</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xl font-extrabold text-indigo-600">{formatPrice(minPrice)}</p>
                                    {priceRatio && <span className="text-sm font-bold text-red-500">({priceRatio})</span>}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">매각기일</p>
                                <p className="text-base font-bold text-slate-700">{formatDate(auctionDate)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">입찰보증금 (10%)</p>
                                <p className="text-base font-bold text-orange-600">{deposit}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Remarks / Special Conditions */}
                {remarks && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                        <div className="p-4 border-b border-slate-100 bg-amber-50">
                            <h3 className="font-bold text-amber-800">⚠️ 비고 / 특별매각조건</h3>
                        </div>
                        <div className="p-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-amber-800 text-sm leading-relaxed whitespace-pre-wrap">
                                    {remarks}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Document Links */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">📄 법원 공식 문서</h3>
                    </div>
                    <div className="p-6">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                            <p className="text-indigo-800 text-sm">
                                아래 버튼을 클릭하면 법원 공식 페이지로 이동합니다.<br />
                                페이지 내에서 <strong>매각물건명세서</strong>, <strong>현황조사서</strong>, <strong>감정평가서</strong> 버튼을 클릭하여 문서를 확인하세요.
                            </p>
                        </div>
                        <a
                            href={popularItemsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold transition-all"
                        >
                            <span>⚖️</span>
                            법원 공식 페이지에서 문서 확인하기
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                </div>

                {/* Map Links */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">📍 위치 확인</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-slate-600 mb-4 text-center">{address}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <a
                                href={`https://map.kakao.com/link/search/${encodeURIComponent(address)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-center text-sm font-bold text-slate-700 bg-[#FEE500] hover:bg-[#FDD835] py-4 rounded-xl transition-all shadow-sm"
                            >
                                카카오맵에서 보기
                            </a>
                            <a
                                href={`https://map.naver.com/p/search/${encodeURIComponent(address)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-center text-sm font-bold text-white bg-[#03C75A] hover:bg-[#02B351] py-4 rounded-xl transition-all shadow-sm"
                            >
                                네이버지도에서 보기
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function LiveDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
            <LiveDetailContent />
        </Suspense>
    );
}
