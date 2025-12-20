'use client';

import { useState } from 'react';
import Link from 'next/link';


interface AuctionItem {
    id: string;
    site_id: string;
    title: string;
    department: string | null;
    manager: string | null;  // case_no stored here
    address: string | null;
    minimum_price: string | null;
    appraised_price: string | null;
    auction_date: string | null;
    status: string | null;
    category: string | null;
    thumbnail_url: string | null;
    detail_link: string | null;
}

export default function AuctionCard({ auction }: { auction: AuctionItem }) {
    const [copied, setCopied] = useState(false);

    // Copy case number to clipboard
    const handleCopyCase = async () => {
        const caseNo = auction.manager;  // case_no is stored in manager field
        if (caseNo) {
            try {
                await navigator.clipboard.writeText(caseNo);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    // Format price with commas
    const formatPrice = (price: string | null) => {
        if (!price) return '가격정보 없음';
        const num = parseInt(price, 10);
        if (isNaN(num)) return price;
        return num.toLocaleString('ko-KR') + '원';
    };

    // Calculate discount rate
    const getDiscountRate = () => {
        if (!auction.minimum_price || !auction.appraised_price) return null;
        const min = parseInt(auction.minimum_price, 10);
        const appraised = parseInt(auction.appraised_price, 10);
        if (isNaN(min) || isNaN(appraised) || appraised === 0) return null;
        const rate = Math.round((1 - min / appraised) * 100);
        return rate > 0 ? rate : null;
    };

    // Calculate D-day
    const getDday = () => {
        if (!auction.auction_date) return null;
        const auctionDate = new Date(auction.auction_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        auctionDate.setHours(0, 0, 0, 0);
        const diff = Math.ceil((auctionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return '종료';
        if (diff === 0) return 'D-Day';
        return `D-${diff}`;
    };

    const getCategoryName = (cat: string | null) => {
        switch (cat) {
            case 'apartment': return '아파트';
            case 'villa': return '빌라/다세대';
            case 'officetel': return '오피스텔';
            case 'commercial': return '상가';
            default: return '기타';
        }
    };

    // Category color mapping with background gradients
    const getCategoryStyles = (cat: string | null) => {
        switch (cat) {
            case 'apartment':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                    text: 'text-blue-600',
                    badge: 'bg-blue-100 text-blue-700',
                    icon: (
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    )
                };
            case 'villa':
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100',
                    text: 'text-emerald-600',
                    badge: 'bg-emerald-100 text-emerald-700',
                    icon: (
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    )
                };
            case 'officetel':
                return {
                    bg: 'bg-indigo-50',
                    border: 'border-indigo-100',
                    text: 'text-indigo-600',
                    badge: 'bg-indigo-100 text-indigo-700',
                    icon: (
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                    )
                };
            case 'commercial':
                return {
                    bg: 'bg-purple-50',
                    border: 'border-purple-100',
                    text: 'text-purple-600',
                    badge: 'bg-purple-100 text-purple-700',
                    icon: (
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                };
            default:
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-100',
                    text: 'text-slate-600',
                    badge: 'bg-slate-100 text-slate-700',
                    icon: (
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    )
                };
        }
    };

    const styles = getCategoryStyles(auction.category);
    const discountRate = getDiscountRate();
    const dday = getDday();

    return (
        <Link href={`/auction/${auction.id}`} className="block group">
            <div className={`bg-white overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border ${styles.border} rounded-2xl`}>
                <div className="flex h-full">
                    {/* Left Side: Visual Identity (Approx 30%) */}
                    <div className={`w-32 flex-shrink-0 flex flex-col items-center justify-center p-4 ${styles.bg} border-r ${styles.border} group-hover:bg-opacity-80 transition-colors`}>
                        <div className={`${styles.text} transform group-hover:scale-110 transition-transform duration-300`}>
                            {styles.icon}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>
                            {getCategoryName(auction.category)}
                        </span>
                    </div>

                    {/* Right Side: Information (Approx 70%) */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                            {/* Header: Status & Tags */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-2">
                                    {auction.status && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${auction.status.includes('유찰') ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {auction.status}
                                        </span>
                                    )}
                                </div>
                                {dday && (
                                    <span className={`text-xs font-bold ${dday === 'D-Day' ? 'text-red-500' :
                                        dday.startsWith('D-') ? 'text-indigo-500' : 'text-gray-400'
                                        }`}>
                                        {dday}
                                    </span>
                                )}
                            </div>

                            {/* Title / Address */}
                            <h3 className="text-base font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
                                {auction.address || "주소 미상"}
                            </h3>
                            <div className="text-xs text-slate-500 font-mono mb-4">
                                {auction.manager}
                            </div>
                        </div>

                        {/* Price Section - Key Focus */}
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <div className="flex flex-col">
                                {auction.appraised_price && (
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-slate-400">감정가</span>
                                        <span className="text-xs text-slate-400 line-through decoration-slate-400">
                                            {parseInt(auction.appraised_price).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-semibold text-slate-600">최저가</span>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-slate-900">
                                            {formatPrice(auction.minimum_price).replace('원', '')}
                                        </span>
                                        <span className="text-sm text-slate-600 ml-0.5">원</span>
                                    </div>
                                </div>
                                {discountRate && discountRate > 0 && (
                                    <div className="mt-1 flex justify-end">
                                        <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                            ↓ {discountRate}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
