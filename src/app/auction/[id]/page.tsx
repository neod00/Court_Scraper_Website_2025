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
    const isYuchal = auction.status?.includes('유찰');

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
                    <div className="w-20"></div> {/* Spacer for center alignment */}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">

                {/* 2. Top Summary Section */}
                <div className="grid md:grid-cols-12 gap-6 mb-8">

                    {/* Left: Key Info Card (Cols 1-8) */}
                    <div className="md:col-span-7 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold 
                                    ${auction.category === 'apartment' ? 'bg-blue-100 text-blue-700' :
                                        auction.category === 'villa' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {auction.category === 'apartment' ? '아파트' :
                                        auction.category === 'villa' ? '빌라/다세대' :
                                            auction.category === 'commercial' ? '상가' : '부동산'}
                                </span>
                                {dDay && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${dDay === 'D-Day' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
                                        {dDay}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">
                                {auction.address}
                            </h1>
                            <p className="text-slate-500 text-lg mb-6">{auction.building_info || "건물 정보 없음"}</p>

                            {/* Price Timeline Visualization */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative overflow-hidden">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                    <div className="text-center md:text-left opacity-60 grayscale filter">
                                        <div className="text-sm text-slate-500 mb-1">1차 감정가</div>
                                        <div className="text-xl font-bold text-slate-400 line-through decoration-slate-400">
                                            {formatPrice(auction.appraised_price)}
                                        </div>
                                    </div>

                                    <div className="hidden md:block flex-1 border-t-2 border-dashed border-slate-300 mx-4 relative top-2">
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-50 px-2 text-xs text-slate-400 font-medium">
                                            {discount ? `${discount}% 하락` : '진행'}
                                        </div>
                                    </div>

                                    <div className="text-center md:text-right">
                                        <div className="flex items-center justify-center md:justify-end gap-2 mb-1">
                                            <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">현재 최저가</span>
                                            {discount && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">-{discount}%</span>}
                                        </div>
                                        <div className="text-3xl font-extrabold text-blue-600">
                                            {formatPrice(auction.minimum_price)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <a
                                href="https://www.courtauction.go.kr/"
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-center transition-colors shadow-lg shadow-indigo-200"
                            >
                                대법원 공고 원문 보기
                            </a>
                            <button
                                onClick={handleCopy}
                                className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors"
                            >
                                {copied ? '✓ 복사완료' : '사건번호 복사'}
                            </button>
                        </div>
                    </div>

                    {/* Right: Map Section (Cols 9-12) */}
                    <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[300px]">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <span>🗺️</span> 위치
                                </h3>
                                <div className="text-xs text-slate-400">카카오맵 기반</div>
                            </div>
                            <div className="flex-1 relative bg-slate-100">
                                {auction.longitude && auction.latitude ? (
                                    <iframe
                                        src={`https://map.kakao.com/link/map/${encodeURIComponent(auction.address || '')},${auction.latitude},${auction.longitude}`}
                                        className="absolute inset-0 w-full h-full"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                        좌표 정보 없음
                                    </div>
                                )}
                            </div>
                            <div className="p-3 bg-white border-t border-slate-100 grid grid-cols-2 gap-2">
                                <a
                                    href={`https://map.kakao.com/link/to/${encodeURIComponent(auction.address || '')},${auction.latitude},${auction.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-center text-xs font-bold text-slate-700 bg-yellow-400/20 hover:bg-yellow-400/30 py-2 rounded-lg transition-colors"
                                >
                                    카카오 길찾기
                                </a>
                                <a
                                    href={`https://map.kakao.com/link/roadview/${auction.latitude},${auction.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg transition-colors"
                                >
                                    로드뷰 보기
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Detail Grid Sections */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                            <span>📄</span> 사건 기본 정보
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">담당계</span>
                                <span className="font-medium text-slate-900">{auction.department}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">매각기일</span>
                                <span className="font-medium text-slate-900">{formatDate(auction.auction_date)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">매각결정기일</span>
                                <span className="font-medium text-slate-900">{formatDate(auction.result_date)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">조회수</span>
                                <span className="font-medium text-slate-900">{auction.view_count?.toLocaleString()}회</span>
                            </div>
                        </div>
                    </section>

                    {/* Additional Info / Notes */}
                    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                            <span>💡</span> 참고 사항
                        </h2>
                        {auction.note ? (
                            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm leading-relaxed border border-yellow-100">
                                <span className="font-bold block mb-1">⚠️ 주의사항/비고</span>
                                {auction.note}
                            </div>
                        ) : (
                            <div className="text-slate-400 text-center py-8">
                                특이사항이 없습니다.
                            </div>
                        )}
                    </section>
                </div>

            </main>
        </div>
    );
}
