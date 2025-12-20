'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { use } from 'react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuctionDetail {
    id: string;
    site_id: string;
    title: string;
    department: string;
    manager: string; // case number
    address: string;
    minimum_price: string;
    appraised_price: string;
    auction_date: string;
    status: string;
    category: string;
    building_info: string | null;
    auction_location: string | null;
    longitude: string | null;
    latitude: string | null;
    note: string | null;
    view_count: number | null;
    result_date: string | null;
    phone: string | null;
    detail_link: string | null;
    lawd_cd: string | null;
}

function formatPrice(price: string | null, unit: string = '원'): string {
    if (!price) return '-';
    const num = parseInt(price.replace(/,/g, ''), 10);
    if (isNaN(num)) return '-';
    return num.toLocaleString('ko-KR') + unit;
}

function calculateDiscount(appraised: string | null, minimum: string | null): number | null {
    if (!appraised || !minimum) return null;
    const app = parseInt(appraised.replace(/,/g, ''), 10);
    const min = parseInt(minimum.replace(/,/g, ''), 10);
    if (isNaN(app) || isNaN(min) || app === 0) return null;
    return Math.round(((app - min) / app) * 100);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getDDay(dateStr: string | null): string {
    if (!dateStr) return '';
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [auction, setAuction] = useState<AuctionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [marketPrices, setMarketPrices] = useState<any[]>([]);
    const [loadingPrices, setLoadingPrices] = useState(false);

    useEffect(() => {
        async function fetchAuction() {
            const { data, error } = await supabase
                .from('court_notices')
                .select('*')
                .eq('id', resolvedParams.id)
                .eq('source_type', 'auction')
                .single();

            if (!error && data) {
                setAuction(data);
                if (data.category === 'apartment' && data.lawd_cd) {
                    fetchMarketPrices(data.lawd_cd);
                }
            }
            setLoading(false);
        }
        fetchAuction();
    }, [resolvedParams.id]);

    const fetchMarketPrices = async (lawdCd: string) => {
        setLoadingPrices(true);
        try {
            // Using a sample month for demonstration
            const res = await fetch(`/api/market-prices?lawdCd=${lawdCd}&dealYmd=202410`);
            const data = await res.json();
            if (data.items) {
                setMarketPrices(data.items);
            }
        } catch (err) {
            console.error('Market price fetch error:', err);
        } finally {
            setLoadingPrices(false);
        }
    };

    const handleCopy = async () => {
        if (auction?.manager) {
            await navigator.clipboard.writeText(auction.manager);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-slate-600 font-medium whitespace-nowrap">데이터를 불러오는 중입니다...</div>
                </div>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <div className="text-slate-800 text-xl font-bold">물건을 찾을 수 없습니다.</div>
                <Link href="/auction" className="text-blue-600 hover:underline">← 목록으로 돌아가기</Link>
            </div>
        );
    }

    const discount = calculateDiscount(auction.appraised_price, auction.minimum_price);
    const dDay = getDDay(auction.auction_date);
    const deposit = auction.minimum_price ? Math.floor(parseInt(auction.minimum_price.replace(/,/g, ''), 10) * 0.1) : 0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* 1. Header Navigation */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/auction" className="flex items-center text-slate-500 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        목록으로
                    </Link>
                    <div className="font-bold text-lg text-slate-800">{auction.manager}</div>
                    <button
                        onClick={handleCopy}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        {copied ? '복사됨!' : '사건번호 복사'}
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">

                {/* 2. Top Summary Section */}
                <div className="grid md:grid-cols-12 gap-6 mb-8">

                    {/* Left: Key Info Card (Cols 1-8) */}
                    <div className="md:col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap flex-shrink-0
                                    ${auction.category === 'apartment' ? 'bg-blue-100 text-blue-700' :
                                        auction.category === 'villa' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {auction.category === 'apartment' ? '아파트' :
                                        auction.category === 'villa' ? '빌라/다세대' :
                                            auction.category === 'commercial' ? '상가' : '부동산'}
                                </span>
                                {dDay && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap flex-shrink-0
                                        ${dDay === 'D-Day' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {dDay}
                                    </span>
                                )}
                                <span className="text-slate-400 text-sm whitespace-nowrap">{auction.status}</span>
                            </div>

                            <h1 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">
                                {auction.address}
                            </h1>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">감정가</p>
                                    <p className="text-lg font-bold text-slate-700">{formatPrice(auction.appraised_price)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">최저가</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-extrabold text-blue-600">{formatPrice(auction.minimum_price)}</p>
                                        {discount && discount > 0 && <span className="text-sm font-bold text-red-500">↓{discount}%</span>}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">매각일자</p>
                                    <p className="text-base font-bold text-slate-700">{formatDate(auction.auction_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">입찰보증금 (10%)</p>
                                    <p className="text-base font-bold text-orange-600">{formatPrice(deposit.toString())}</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Price Timeline */}
                        <div className="px-6 pb-6 mt-4">
                            <div className="relative pt-10 pb-4">
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 rounded-full"></div>
                                <div className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full" style={{ width: `${100 - (discount || 0)}%` }}></div>

                                <div className="flex justify-between mt-2">
                                    <div className="text-center">
                                        <div className="absolute top-0 left-0 w-3 h-3 bg-white border-2 border-slate-300 rounded-full -translate-y-1"></div>
                                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">감정평가</p>
                                        <p className="text-xs font-bold text-slate-500">{formatPrice(auction.appraised_price)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-white border-4 border-blue-600 rounded-full -translate-y-1.5 shadow-sm"></div>
                                        <p className="text-[10px] text-blue-600 font-bold mb-1 uppercase tracking-wider">현재 최저가</p>
                                        <p className="text-sm font-extrabold text-blue-600">{formatPrice(auction.minimum_price)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Map Search & Official Links (Cols 9-12) */}
                    <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-lg">📍</span> 위치 확인
                                </h3>
                            </div>
                            <div className="flex-1 relative bg-slate-50 min-h-[220px] flex flex-col items-center justify-center p-6 text-center">
                                <div className="text-4xl mb-3">🗺️</div>
                                <p className="font-medium text-slate-600 mb-1">지도 앱에서 위치를 확인하세요</p>
                                <p className="text-sm text-slate-400 mb-6">정확한 위치 확인을 위해 아래 버튼을 이용해 주세요.</p>

                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <a
                                        href={`https://map.kakao.com/link/search/${encodeURIComponent(auction.address || '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-center text-sm font-bold text-slate-700 bg-[#FEE500] hover:bg-[#FDD835] py-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                    >
                                        카카오맵
                                    </a>
                                    <a
                                        href={`https://map.naver.com/p/search/${encodeURIComponent(auction.address || '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-center text-sm font-bold text-white bg-[#03C75A] hover:bg-[#02B351] py-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                    >
                                        네이버지도
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 p-6 text-white overflow-hidden relative group min-h-[160px] flex flex-col justify-center">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-2">⚖️ 법원 공식 정보</h3>
                                <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                                    공식 매각물건명세서 원본 확인
                                </p>
                                <a
                                    href={auction.detail_link || 'https://www.courtauction.go.kr'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 bg-white text-indigo-600 px-5 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                                >
                                    법원 공고 원문 보기
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Market Prices Section */}
                {auction.category === 'apartment' && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="text-lg">📊</span> 인근 아파트 실거래가 (최근)
                            </h2>
                            <span className="text-xs text-slate-400">국토교통부 실거래가 기준</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {loadingPrices ? (
                                <div className="p-12 flex flex-col items-center justify-center gap-3">
                                    <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <p className="text-sm text-slate-500">실거래 데이터 조회 중...</p>
                                </div>
                            ) : marketPrices.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">거래일</th>
                                                <th className="px-6 py-4">아파트/단지명</th>
                                                <th className="px-6 py-4">전용면적</th>
                                                <th className="px-6 py-4 text-right">거래금액</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {marketPrices.slice(0, 10).map((price, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{price.dealDay}일</td>
                                                    <td className="px-6 py-4 font-bold text-slate-700">{price.aptNm}</td>
                                                    <td className="px-6 py-4 text-slate-500">{price.excluArea}㎡</td>
                                                    <td className="px-6 py-4 text-right font-extrabold text-slate-900">{price.dealAmount.trim()}만원</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p>현재 지역에 대한 매매 실거래 정보가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. Detail Grid Sections */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">📋 기본 정보</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start pb-4 border-b border-slate-50">
                                    <span className="text-sm text-slate-400">관할법원</span>
                                    <span className="text-sm font-bold text-slate-700 text-right">{auction.department}</span>
                                </div>
                                <div className="flex justify-between pb-4 border-b border-slate-50">
                                    <span className="text-sm text-slate-400">사건번호</span>
                                    <span className="text-sm font-bold text-slate-700">{auction.manager}</span>
                                </div>
                                <div className="flex justify-between pb-4 border-b border-slate-50">
                                    <span className="text-sm text-slate-400">용도</span>
                                    <span className="text-sm font-bold text-slate-700">{auction.category === 'apartment' ? '아파트' : '부동산'}</span>
                                </div>
                                <div className="flex justify-between pb-4 border-b border-slate-50">
                                    <span className="text-sm text-slate-400">건물 정보</span>
                                    <span className="text-sm font-bold text-slate-700 text-right">{auction.building_info || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-400">입찰 장소</span>
                                    <span className="text-sm font-bold text-slate-700 text-right">{auction.auction_location || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes & Special Conditions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">📝 비고 / 특별매각조건</h3>
                        </div>
                        <div className="p-6">
                            {auction.note ? (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                                    <p className="text-orange-800 text-sm leading-relaxed whitespace-pre-wrap">
                                        {auction.note}
                                    </p>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 py-10">
                                    특이사항이 없습니다.
                                </div>
                            )}

                            {auction.phone && (
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">경매 문의</p>
                                            <p className="text-sm font-bold text-slate-700">{auction.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
