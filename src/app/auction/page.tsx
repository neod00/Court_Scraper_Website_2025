'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuctionTable from '@/components/AuctionTable';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

const REGIONS = [
    { label: '전체 지역', value: '' },
    { label: '서울 (서울특별시)', value: '서울특별시' },
    { label: '인천 (인천광역시)', value: '인천광역시' },
    { label: '경기 (경기도)', value: '경기도' },
    { label: '충북 (충청북도)', value: '충청북도' },
    { label: '충남 (충청남도)', value: '충청남도' },
    { label: '강원 (강원특별자치도)', value: '강원특별자치도' },
];

const CATEGORIES = [
    { value: '', label: '전체 물건' },
    { value: 'apartment', label: '아파트' },
    { value: 'villa', label: '빌라/다세대' },
    { value: 'officetel', label: '오피스텔' },
    { value: 'commercial', label: '상가' },
];

function AuctionPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [auctions, setAuctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters State initialized from URL
    const [filters, setFilters] = useState({
        cat: searchParams.get('cat') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        q: searchParams.get('q') || '',
        region: searchParams.get('region') || '',
        start: searchParams.get('start') || '',
        end: searchParams.get('end') || ''
    });

    const fetchAuctions = async (page = 1) => {
        setLoading(true);
        try {
            let query = supabase
                .from('court_notices')
                .select('*', { count: 'exact' })
                .eq('source_type', 'auction');

            if (filters.cat) query = query.eq('category', filters.cat);
            if (filters.minPrice) query = query.gte('minimum_price', filters.minPrice);
            if (filters.maxPrice) query = query.lte('minimum_price', filters.maxPrice);
            if (filters.q) query = query.or(`title.ilike.%${filters.q}%,address.ilike.%${filters.q}%`);

            // Region filter (simple text match for and-condition)
            if (filters.region) {
                query = query.ilike('address', `%${filters.region.substring(0, 2)}%`);
            }

            // Exclude old data if needed or sort
            query = query.order('auction_date', { ascending: true })
                .range((page - 1) * 10, page * 10 - 1);

            const { data, count, error } = await query;
            if (data && data.length > 5) { // If we have at least some data, show it
                setAuctions(data);
                setTotalCount(count || 0);
            } else if (page === 1 || filters.region) {
                // If no data found OR very little data for the current filter/page, trigger scraping
                await triggerScrape(page);
            } else {
                setAuctions([]);
                setTotalCount(0);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const triggerScrape = async (page = 1) => {
        setScraping(true);
        try {
            const params = new URLSearchParams({
                max: '50', // Fetch 50 items (5 pages worth) at once
                page: '1', // Always start from page 1 of court site to get the top 50
                region: filters.region,
                start: filters.start?.replace(/-/g, '.'),
                end: filters.end?.replace(/-/g, '.')
            });

            const res = await fetch(`/api/scrape?${params.toString()}`);
            const result = await res.json();

            if (result.success) {
                // Re-fetch after scraping saves to DB
                const { data, count } = await supabase
                    .from('court_notices')
                    .select('*', { count: 'exact' })
                    .eq('source_type', 'auction')
                    .ilike('address', `%${filters.region.substring(0, 2)}%`)
                    .order('auction_date', { ascending: true })
                    .range((page - 1) * 10, page * 10 - 1);

                if (data) {
                    setAuctions(data);
                    setTotalCount(count || 0);
                }
            }
        } catch (err) {
            console.error('Scrape trigger error:', err);
        } finally {
            setScraping(false);
        }
    };

    useEffect(() => {
        fetchAuctions(currentPage);
    }, [currentPage]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        // Update URL with filters
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
            if (val) params.set(key, val);
        });
        router.push(`/auction?${params.toString()}`);

        setCurrentPage(1);
        fetchAuctions(1);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 pb-20">
            <Sidebar />

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚖️</span>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">현장 경매물건 전문 필터링</h1>
                    </div>
                    {scraping && (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full animate-pulse">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                            <span className="text-xs font-bold text-indigo-700">법원 데이터 실시간 수집 중...</span>
                        </div>
                    )}
                </div>

                {/* Advanced Search Form */}
                <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">물건 종류</label>
                            <select
                                value={filters.cat}
                                onChange={(e) => setFilters({ ...filters, cat: e.target.value })}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all py-3"
                            >
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">수집 지역</label>
                            <select
                                value={filters.region}
                                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all py-3"
                            >
                                {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">키워드/주소 검색</label>
                            <input
                                type="text"
                                value={filters.q}
                                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                                placeholder="예: 아파트, 역세권, 하이츠"
                                className="w-full bg-slate-50 border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all py-3"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">최저가 하한 (원)</label>
                            <input
                                type="number"
                                value={filters.minPrice}
                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl text-sm py-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">최저가 상한 (원)</label>
                            <input
                                type="number"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl text-sm py-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">조회 시작일</label>
                            <input
                                type="date"
                                value={filters.start}
                                onChange={(e) => setFilters({ ...filters, start: e.target.value })}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl text-sm py-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">조회 종료일</label>
                            <input
                                type="date"
                                value={filters.end}
                                onChange={(e) => setFilters({ ...filters, end: e.target.value })}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl text-sm py-3"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={scraping}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                    >
                        {scraping ? '수집 로봇 가동 중...' : '🔍 조건에 맞는 물건 찾기'}
                    </button>
                </form>

                {/* Results Table */}
                {loading && !scraping ? (
                    <div className="py-20 flex justify-center">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : auctions.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-sm font-bold text-slate-500">
                                신규 검색 결과 <span className="text-indigo-600 ml-1">{totalCount}</span>
                                <span className="text-slate-300 ml-1">/ 10개씩 보기</span>
                            </h2>
                        </div>
                        <AuctionTable auctions={auctions} />

                        {/* Pagination */}
                        <div className="mt-10 flex justify-center gap-2">
                            {Array.from({ length: Math.ceil(totalCount / 10) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-slate-500 font-medium">검색 결과가 없습니다.</p>
                        <p className="text-xs text-slate-400 mt-1">상단의 수집 지역을 변경하거나 검색어를 조정해 보세요.</p>
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
