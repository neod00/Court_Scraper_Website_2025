import { supabase } from '@/lib/supabase';
import AuctionCard from '@/components/AuctionCard';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

interface AuctionPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuctionPage({ searchParams }: AuctionPageProps) {
    const params = await searchParams;

    // Parse search params
    const category = typeof params.cat === 'string' ? params.cat : '';
    const minPrice = typeof params.minPrice === 'string' ? params.minPrice : '';
    const maxPrice = typeof params.maxPrice === 'string' ? params.maxPrice : '';
    const keyword = typeof params.q === 'string' ? params.q : '';

    // Build query for auction items only
    let query = supabase
        .from('court_notices')
        .select('*', { count: 'exact' })
        .eq('source_type', 'auction');

    // Apply filters
    if (category) {
        query = query.eq('category', category);
    }
    if (minPrice) {
        query = query.gte('minimum_price', minPrice);
    }
    if (maxPrice) {
        query = query.lte('minimum_price', maxPrice);
    }
    if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,address.ilike.%${keyword}%`);
    }

    // Order by auction date (upcoming first)
    query = query.order('auction_date', { ascending: true }).limit(50);

    const { data: auctions, count, error } = await query;

    if (error) {
        console.error('Error fetching auctions:', error);
    }

    // Category options for filter
    const categories = [
        { value: '', label: '전체' },
        { value: 'apartment', label: '아파트' },
        { value: 'villa', label: '빌라/다세대' },
        { value: 'officetel', label: '오피스텔' },
        { value: 'commercial', label: '상가' },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-3xl">🏠</span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                        법원경매 물건 검색
                    </h1>
                </div>

                {/* Search & Filter Form */}
                <form method="GET" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Category Filter */}
                        <div>
                            <label htmlFor="cat" className="block text-sm font-medium text-gray-700 mb-2">
                                물건 종류
                            </label>
                            <select
                                id="cat"
                                name="cat"
                                defaultValue={category}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Min Price */}
                        <div>
                            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-2">
                                최저가 (하한)
                            </label>
                            <input
                                type="number"
                                id="minPrice"
                                name="minPrice"
                                defaultValue={minPrice}
                                placeholder="예: 100000000"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Max Price */}
                        <div>
                            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
                                최저가 (상한)
                            </label>
                            <input
                                type="number"
                                id="maxPrice"
                                name="maxPrice"
                                defaultValue={maxPrice}
                                placeholder="예: 500000000"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Keyword Search */}
                        <div>
                            <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-2">
                                주소/키워드 검색
                            </label>
                            <input
                                type="text"
                                id="q"
                                name="q"
                                defaultValue={keyword}
                                placeholder="예: 강남, 아파트"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Search Button */}
                    <button
                        type="submit"
                        className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        🔍 검색하기
                    </button>
                </form>

                {/* Results Section */}
                <div>
                    {(!auctions || auctions.length === 0) ? (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                            <div className="flex items-start">
                                <svg className="h-6 w-6 text-blue-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="text-lg font-medium text-blue-900 mb-1">경매 물건 데이터가 없습니다.</h3>
                                    <p className="text-sm text-blue-700">
                                        위에서 필터 조건을 변경하거나, 데이터 수집이 완료될 때까지 잠시 기다려 주세요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    📊 검색 결과
                                </h2>
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    총 {count}건
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {auctions.map((auction) => (
                                    <AuctionCard key={auction.id} auction={auction} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
