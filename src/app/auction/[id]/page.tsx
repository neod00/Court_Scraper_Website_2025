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
}

function formatPrice(price: string | null): string {
    if (!price) return '-';
    const num = parseInt(price, 10);
    if (isNaN(num)) return '-';
    return num.toLocaleString('ko-KR') + '원';
}

function calculateDiscount(appraised: string | null, minimum: string | null): number | null {
    if (!appraised || !minimum) return null;
    const app = parseInt(appraised, 10);
    const min = parseInt(minimum, 10);
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
            }
            setLoading(false);
        }
        fetchAuction();
    }, [resolvedParams.id]);

    const handleCopy = async () => {
        if (auction?.manager) {
            await navigator.clipboard.writeText(auction.manager);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">로딩 중...</div>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-4">
                <div className="text-white text-xl">물건을 찾을 수 없습니다.</div>
                <Link href="/auction" className="text-blue-400 hover:underline">← 목록으로 돌아가기</Link>
            </div>
        );
    }

    const discount = calculateDiscount(auction.appraised_price, auction.minimum_price);
    const dDay = getDDay(auction.auction_date);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back button */}
                <Link
                    href="/auction"
                    className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    목록으로 돌아가기
                </Link>

                {/* Main Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">🏠</span>
                                    <h1 className="text-2xl font-bold text-white">{auction.manager}</h1>
                                    <button
                                        onClick={handleCopy}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${copied
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
                                            }`}
                                    >
                                        {copied ? '✓ 복사됨' : '복사'}
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-slate-400">
                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-sm">
                                        {auction.category === 'apartment' ? '아파트' :
                                            auction.category === 'villa' ? '빌라/다세대' :
                                                auction.category === 'officetel' ? '오피스텔' :
                                                    auction.category === 'commercial' ? '상가' : '부동산'}
                                    </span>
                                    <span>|</span>
                                    <span>{auction.department}</span>
                                </div>
                            </div>

                            {dDay && (
                                <div className={`px-4 py-2 rounded-xl text-lg font-bold ${dDay === 'D-Day' ? 'bg-red-500 text-white' :
                                        dDay.startsWith('D-') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                            'bg-slate-600/50 text-slate-400'
                                    }`}>
                                    {dDay}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="p-6 border-b border-slate-700/50">
                        <h2 className="text-sm font-medium text-slate-500 mb-2">📍 소재지</h2>
                        <p className="text-xl text-white">{auction.address}</p>
                        {auction.building_info && (
                            <p className="text-slate-400 mt-1">{auction.building_info}</p>
                        )}
                    </div>

                    {/* Map Section */}
                    {auction.longitude && auction.latitude && (
                        <div className="p-6 border-b border-slate-700/50">
                            <h2 className="text-sm font-medium text-slate-500 mb-3">🗺️ 위치</h2>
                            <div className="aspect-video bg-slate-700/30 rounded-xl overflow-hidden">
                                <iframe
                                    src={`https://map.kakao.com/link/map/${encodeURIComponent(auction.address)},${auction.latitude},${auction.longitude}`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            <div className="mt-2 flex gap-2">
                                <a
                                    href={`https://map.kakao.com/link/search/${encodeURIComponent(auction.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 hover:underline"
                                >
                                    카카오맵에서 보기 →
                                </a>
                                <a
                                    href={`https://map.naver.com/v5/search/${encodeURIComponent(auction.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-green-400 hover:underline"
                                >
                                    네이버지도에서 보기 →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Price Section */}
                    <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-green-900/10 to-emerald-900/10">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-sm font-medium text-slate-500 mb-1">감정가</h2>
                                <p className="text-xl text-slate-500 line-through">
                                    {formatPrice(auction.appraised_price)}
                                </p>
                            </div>
                            <div>
                                <h2 className="text-sm font-medium text-slate-500 mb-1">최저매각가격</h2>
                                <div className="flex items-center gap-3">
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {formatPrice(auction.minimum_price)}
                                    </p>
                                    {discount !== null && discount > 0 && (
                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold">
                                            {discount}% 할인
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="grid md:grid-cols-2 gap-y-4 gap-x-8">
                            <div className="flex justify-between">
                                <span className="text-slate-500">매각기일</span>
                                <span className="text-white font-medium">{formatDate(auction.auction_date)}</span>
                            </div>
                            {auction.auction_location && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">입찰장소</span>
                                    <span className="text-white">{auction.auction_location}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-500">상태</span>
                                <span className={`font-medium ${auction.status?.includes('유찰') ? 'text-orange-400' : 'text-green-400'
                                    }`}>{auction.status}</span>
                            </div>
                            {auction.result_date && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">매각결정기일</span>
                                    <span className="text-white">{formatDate(auction.result_date)}</span>
                                </div>
                            )}
                            {auction.view_count !== null && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">조회수</span>
                                    <span className="text-white">{auction.view_count.toLocaleString()}회</span>
                                </div>
                            )}
                            {auction.phone && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">연락처</span>
                                    <span className="text-white">{auction.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Note Section */}
                    {auction.note && (
                        <div className="p-6 border-b border-slate-700/50 bg-yellow-900/10">
                            <h2 className="text-sm font-medium text-yellow-500 mb-2">📋 비고 / 특별매각조건</h2>
                            <p className="text-white whitespace-pre-wrap">{auction.note}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="p-6 flex flex-wrap gap-4">
                        <a
                            href="https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[200px] py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-center transition-colors"
                        >
                            법원경매 검색 페이지 →
                        </a>
                        <button
                            onClick={handleCopy}
                            className="py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                        >
                            {copied ? '✓ 사건번호 복사됨' : '📋 사건번호 복사'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
