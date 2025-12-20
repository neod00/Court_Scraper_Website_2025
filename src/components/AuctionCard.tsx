'use client';

import Link from 'next/link';
import Image from 'next/image';
import Badge from './Badge';

interface AuctionItem {
    id: string;
    site_id: string;
    title: string;
    department: string | null;
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

    // Category color mapping
    const getCategoryColor = (cat: string | null) => {
        switch (cat) {
            case 'apartment': return 'blue';
            case 'villa': return 'green';
            case 'officetel': return 'purple';
            case 'commercial': return 'yellow';
            default: return 'gray';
        }
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

    const discountRate = getDiscountRate();
    const dday = getDday();

    // Placeholder image based on category
    const getPlaceholderImage = (cat: string | null) => {
        return '/placeholder-building.svg'; // We'll create this
    };

    return (
        <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            {/* Image Section */}
            <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                {auction.thumbnail_url ? (
                    <img
                        src={auction.thumbnail_url}
                        alt={auction.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.currentTarget.src = getPlaceholderImage(auction.category);
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm">{getCategoryName(auction.category)}</span>
                        </div>
                    </div>
                )}
                
                {/* Discount Badge */}
                {discountRate && discountRate > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        {discountRate}% 할인
                    </div>
                )}
                
                {/* D-day Badge */}
                {dday && (
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${
                        dday === '종료' ? 'bg-gray-500 text-white' :
                        dday === 'D-Day' ? 'bg-orange-500 text-white animate-pulse' :
                        'bg-blue-600 text-white'
                    }`}>
                        {dday}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Category & Status */}
                <div className="flex items-center justify-between mb-3">
                    <Badge color={getCategoryColor(auction.category)}>
                        {getCategoryName(auction.category)}
                    </Badge>
                    {auction.status && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {auction.status}
                        </span>
                    )}
                </div>

                {/* Address */}
                <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[48px]">
                    {auction.address || auction.title}
                </h3>

                {/* Price Info */}
                <div className="space-y-2 mb-4">
                    {auction.appraised_price && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">감정가</span>
                            <span className="text-gray-400 line-through">
                                {formatPrice(auction.appraised_price)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">최저가</span>
                        <span className="text-xl font-bold text-indigo-600">
                            {formatPrice(auction.minimum_price)}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                        {auction.department}
                    </span>
                    {auction.auction_date && (
                        <span className="text-xs text-gray-500">
                            매각기일: {auction.auction_date}
                        </span>
                    )}
                </div>

                {/* View Detail Button */}
                {auction.detail_link && (
                    <a
                        href={auction.detail_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        법원 원문 보기
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                )}
            </div>
        </div>
    );
}
