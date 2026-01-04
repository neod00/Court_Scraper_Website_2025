import { supabase } from '@/lib/supabase';
import NoticeCard from '@/components/NoticeCard';
import SearchForm from '@/components/SearchForm';
import Sidebar from '@/components/Sidebar';

// Force dynamic rendering to handle searchParams correctly
export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  // Await searchParams (required in Next.js 15+)
  const params = await searchParams;

  // Parse Search Params
  const start = typeof params.start === 'string' ? params.start : '';
  const end = typeof params.end === 'string' ? params.end : '';
  const keyword = typeof params.q === 'string' ? params.q : '';
  const category = typeof params.cat === 'string' ? params.cat : '';

  // Check if any search parameter is provided
  const hasSearchParams = start || end || keyword || category;

  // Only execute search query if user has provided search params
  let notices: any[] | null = null;
  let count: number | null = null;
  let error: any = null;

  if (hasSearchParams) {
    // Build Query for search results
    let query = supabase
      .from('court_notices')
      .select('*', { count: 'exact' });

    // Apply Filters
    if (start) {
      query = query.gte('date_posted', start);
    }
    if (end) {
      query = query.lte('date_posted', end);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,content_text.ilike.%${keyword}%`);
    }

    // Default Order & Limit
    query = query.order('date_posted', { ascending: false }).limit(50);

    const result = await query;
    notices = result.data;
    count = result.count;
    error = result.error;

    if (error) {
      console.error('Error fetching notices:', error);
    }
  }

  // Calculate dates for weekly notices (last 7 days)
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const todayStr = today.toISOString().split('T')[0];
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  // Query for weekly real estate notices
  const { data: realEstateNotices } = await supabase
    .from('court_notices')
    .select('*')
    .gte('date_posted', weekAgoStr)
    .lte('date_posted', todayStr)
    .eq('category', 'real_estate')
    .order('date_posted', { ascending: false })
    .limit(10);

  // Query for weekly vehicle notices
  const { data: vehicleNotices } = await supabase
    .from('court_notices')
    .select('*')
    .gte('date_posted', weekAgoStr)
    .lte('date_posted', todayStr)
    .eq('category', 'vehicle')
    .order('date_posted', { ascending: false })
    .limit(10);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header Title */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">🏛️</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            대법원 회생·파산 자산매각 공고 수집기
          </h1>
        </div>

        {/* Service Introduction for AdSense/SEO */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <p className="text-gray-700 leading-relaxed">
            본 서비스는 <strong>대한민국법원 회생·파산 자산매각 공고</strong> 정보를 실시간으로 수집하여 제공하는 전문 검색 플랫폼입니다.
            복잡한 법정 공고들 중에서 사용자가 원하는 부동산, 차량, 비상장 주식, 채권, 지식재산권 등의 자산을
            정확하고 빠르게 찾을 수 있도록 돕기 위해 구축되었습니다. 모든 정보는 법원 공식 데이터를 기반으로 하며,
            사용자의 편의를 위해 카테고리별 필터링과 키워드 검색 기능을 무료로 제공하고 있습니다.
          </p>
        </div>

        {/* Search Form */}
        <SearchForm />

        {/* Result Message / Data List */}
        <div className="mt-8">
          {(!notices || notices.length === 0) ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    수집된 데이터가 없습니다. 위에서 검색 조건을 설정하고 수집(조회)을 시작해주세요.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  📊 검색 결과
                </h2>
                <span className="text-sm text-gray-500">
                  {count !== null ? `총 ${count}건` : '조회 완료'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {notices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Notices Section - Bottom of Page */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">📌</span>
            <h2 className="text-xl font-bold text-gray-900">
              최근 1주일 주요 공고
            </h2>
            <span className="text-sm text-gray-500 ml-2">
              ({weekAgoStr} ~ {todayStr})
            </span>
          </div>

          {/* Real Estate Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🏠 부동산
              </span>
              <span className="text-sm text-gray-500">
                {realEstateNotices?.length || 0}건
              </span>
            </div>
            {realEstateNotices && realEstateNotices.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {realEstateNotices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
                최근 1주일간 부동산 관련 공고가 없습니다.
              </p>
            )}
          </div>

          {/* Vehicle Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                🚗 차량/중기
              </span>
              <span className="text-sm text-gray-500">
                {vehicleNotices?.length || 0}건
              </span>
            </div>
            {vehicleNotices && vehicleNotices.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {vehicleNotices.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
                최근 1주일간 차량/중기 관련 공고가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
