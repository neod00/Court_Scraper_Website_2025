'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface AuctionItem {
    caseNo: string;
    court: string;
    department: string;
    itemType: string;
    address: string;
    minPrice: string;
    appraisalPrice: string;
    priceRatio: string;
    failCount: string;
    interestCount: string;
    remarks: string;
    auctionDate: string;
    detailLink: string;
    saNo: string;
    boCd: string;
    maemulSer: string;
}

function getItemTypeIcon(type: string): string {
    if (type.includes('아파트')) return '🏢';
    if (type.includes('빌라') || type.includes('다세대')) return '🏘️';
    if (type.includes('오피스텔')) return '🏬';
    if (type.includes('상가') || type.includes('근린')) return '🏪';
    if (type.includes('단독')) return '🏠';
    if (type.includes('토지') || type.includes('대지')) return '🌍';
    return '🏗️';
}

function formatAuctionDate(dateStr: string): string {
    if (!dateStr || dateStr.length < 8) return '-';
    return `${dateStr.slice(0, 4)}.${dateStr.slice(4, 6)}.${dateStr.slice(6, 8)}`;
}

function AuctionPageContent() {
    const [items, setItems] = useState<AuctionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Pagination calculations
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = items.slice(startIndex, endIndex);

    const fetchPopularItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/popular-auctions');
            const data = await res.json();

            if (data.success && data.items) {
                setItems(data.items);
            } else {
                setError(data.message || '데이터를 불러오지 못했습니다.');
            }
        } catch (err) {
            setError('서버 연결에 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPopularItems();
    }, []);

    return (
        <div className="flex flex-col lg:flex-row gap-8 pb-20">
            <Sidebar />

            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🔥</span>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                다수관심물건 {totalItems > 0 && <span className="text-indigo-600">({totalItems}개)</span>}
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">현재 투자자들이 가장 많이 보는 경매 물건</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchPopularItems}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                수집 중...
                            </>
                        ) : (
                            <>🔄 새로고침</>
                        )}
                    </button>
                </div>

                {/* Loading State */}
                {loading && items.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">법원 경매정보를 수집하고 있습니다...</p>
                        <p className="text-xs text-slate-400 mt-1">약 10-20초 소요됩니다</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="py-12 text-center bg-red-50 rounded-2xl border border-red-100">
                        <div className="text-3xl mb-3">⚠️</div>
                        <p className="text-red-600 font-medium">{error}</p>
                        <button
                            onClick={fetchPopularItems}
                            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {/* Items Grid */}
                {!loading && !error && items.length > 0 && (
                    <>
                        {/* Pagination Info */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-slate-500">
                                {startIndex + 1}-{endIndex} / {totalItems}개 표시 중
                            </p>
                            <p className="text-sm text-slate-400">
                                {currentPage} / {totalPages} 페이지
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentItems.map((item, idx) => (
                                <div
                                    key={`${item.saNo}_${item.maemulSer}_${idx}`}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
                                >
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{getItemTypeIcon(item.itemType)}</span>
                                                <div>
                                                    <p className="text-white font-bold">{item.caseNo}</p>
                                                    <p className="text-slate-400 text-xs">{item.court} {item.department}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                    {item.itemType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5">
                                        {/* Address */}
                                        <p className="text-slate-700 text-sm mb-4 line-clamp-2">{item.address}</p>

                                        {/* Price Info */}
                                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-slate-500">최저매각가격</span>
                                                <span className="text-lg font-bold text-indigo-600">₩{item.minPrice}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-500">감정가</span>
                                                <span className="text-sm text-slate-600">₩{item.appraisalPrice} <span className="text-red-500 font-bold">({item.priceRatio})</span></span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex gap-4 mb-4">
                                            <div className="flex-1 text-center bg-red-50 rounded-lg py-2">
                                                <p className="text-xs text-red-500 mb-1">유찰횟수</p>
                                                <p className="text-lg font-bold text-red-600">🔻 {item.failCount}회</p>
                                            </div>
                                            <div className="flex-1 text-center bg-blue-50 rounded-lg py-2">
                                                <p className="text-xs text-blue-500 mb-1">관심등록수(법원기준)</p>
                                                <p className="text-lg font-bold text-blue-600">👁 {item.interestCount}명</p>
                                            </div>
                                        </div>

                                        {/* Auction Date */}
                                        <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                                            <span>📅</span>
                                            <span>매각기일: <strong>{formatAuctionDate(item.auctionDate)}</strong></span>
                                        </div>

                                        {/* Remarks */}
                                        {item.remarks && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-amber-600">⚠️</span>
                                                    <p className="text-xs text-amber-800 whitespace-pre-line">{item.remarks}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="space-y-2">
                                            <Link
                                                href={`/auction/live?saNo=${item.saNo}&boCd=${item.boCd}&maemulSer=${item.maemulSer}&caseNo=${encodeURIComponent(item.caseNo)}&court=${encodeURIComponent(item.court)}&department=${encodeURIComponent(item.department)}&itemType=${encodeURIComponent(item.itemType)}&address=${encodeURIComponent(item.address)}&minPrice=${encodeURIComponent(item.minPrice)}&appraisalPrice=${encodeURIComponent(item.appraisalPrice)}&priceRatio=${encodeURIComponent(item.priceRatio)}&failCount=${item.failCount}&interestCount=${item.interestCount}&remarks=${encodeURIComponent(item.remarks || '')}&auctionDate=${item.auctionDate}`}
                                                className="block w-full text-center bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all"
                                            >
                                                상세 정보 보기 →
                                            </Link>
                                            <a
                                                href="https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ155M00.xml&pgmDvsNum=2"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center bg-slate-100 text-slate-700 font-medium py-2 rounded-xl hover:bg-slate-200 transition-all text-sm"
                                            >
                                                법원 공식 페이지에서 보기
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Buttons */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← 이전
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 text-sm font-bold rounded-lg transition-all ${currentPage === page
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    다음 →
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {!loading && !error && items.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-slate-500 font-medium">표시할 물건이 없습니다.</p>
                        <p className="text-xs text-slate-400 mt-1">새로고침 버튼을 눌러 다시 시도해 보세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AuctionPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">로딩 중...</div>}>
            <AuctionPageContent />
        </Suspense>
    );
}
