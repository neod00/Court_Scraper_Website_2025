import { supabase } from '@/lib/supabase';
import NoticeCard from '@/components/NoticeCard';
import SearchForm from '@/components/SearchForm';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { getRecentPosts, blogCategories } from '@/data/blog-posts';
import { glossaryTerms } from '@/data/glossary';

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

  // Calculate dates for weekly notices
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  const todayStr = today.toISOString().split('T')[0];
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

  // ===== 주간 트렌드 통계 쿼리 =====
  // 이번 주 전체 공고 (카테고리별 집계용)
  const { data: thisWeekAll, count: thisWeekCount } = await supabase
    .from('court_notices')
    .select('category, department', { count: 'exact' })
    .gte('date_posted', weekAgoStr)
    .lte('date_posted', todayStr);

  // 지난 주 전체 공고 수
  const { count: lastWeekCount } = await supabase
    .from('court_notices')
    .select('*', { count: 'exact', head: true })
    .gte('date_posted', twoWeeksAgoStr)
    .lt('date_posted', weekAgoStr);

  // 카테고리별 집계
  const categoryCounts: Record<string, number> = {};
  const departmentCounts: Record<string, number> = {};
  if (thisWeekAll) {
    thisWeekAll.forEach((item: any) => {
      const cat = item.category || 'other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      const dept = item.department || '기타';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });
  }

  // 전주 대비 증감율 계산
  const weeklyTotal = thisWeekCount || 0;
  const lastTotal = lastWeekCount || 0;
  const changeRate = lastTotal > 0
    ? Math.round(((weeklyTotal - lastTotal) / lastTotal) * 100)
    : 0;

  // 가장 활발한 법원 (최다 공고)
  const topDepartment = Object.entries(departmentCounts)
    .sort(([, a], [, b]) => b - a)[0];


  // ===== 기존 주간 공고 쿼리 =====
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
    <div className="flex flex-col xl:flex-row gap-8 xl:gap-12">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">

        {/* Premium Hero Section */}
        <div className="relative rounded-3xl bg-slate-900 overflow-hidden shadow-2xl mb-12 border border-slate-800">
          {/* Abstract Background Effects */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_100%)] pointer-events-none" />

          <div className="relative p-8 sm:p-10 z-10 flex flex-col justify-center min-h-[220px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold tracking-wide w-fit mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              실시간 데이터 연동 중
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              법원 자산매각 공고<br className="max-sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">프리미엄 수집 플랫폼</span>
            </h1>
            <p className="text-slate-300 leading-relaxed text-[0.95rem] max-w-2xl font-light">
              복잡한 법정 공고들 중에서 사용자가 원하는 부동산, 차량, 비상장 주식 등의 우량 자산을
              가장 빠르고 정확하게 찾아드립니다. 대한민국법원 공식 데이터를 기반으로 제공합니다.
            </p>
          </div>
        </div>

        {/* Search Form */}
        <SearchForm />

        {/* 📊 주간 매각 공고 트렌드 */}
        <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">📊</span>
            <h2 className="text-lg font-bold">주간 매각 공고 트렌드</h2>
            <span className="text-xs text-slate-400 ml-auto">
              {weekAgoStr} ~ {todayStr}
            </span>
          </div>

          {/* 상단 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {/* 총 공고 건수 */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-xs text-slate-300 mb-1">이번 주 총 공고</p>
              <p className="text-2xl font-bold text-white">{weeklyTotal}<span className="text-sm font-normal">건</span></p>
              {changeRate !== 0 && (
                <p className={`text-xs mt-1 font-medium ${changeRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {changeRate > 0 ? '▲' : '▼'} 전주 대비 {Math.abs(changeRate)}%
                </p>
              )}
              {changeRate === 0 && lastTotal > 0 && (
                <p className="text-xs mt-1 text-slate-400">전주와 동일</p>
              )}
            </div>

            {/* 부동산 */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-xs text-slate-300 mb-1">🏠 부동산</p>
              <p className="text-2xl font-bold text-emerald-400">{categoryCounts['real_estate'] || 0}<span className="text-sm font-normal text-slate-300">건</span></p>
            </div>

            {/* 차량/동산 */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-xs text-slate-300 mb-1">🚗 차량/동산</p>
              <p className="text-2xl font-bold text-blue-400">{categoryCounts['vehicle'] || 0}<span className="text-sm font-normal text-slate-300">건</span></p>
            </div>

            {/* 기타 (채권, 주식, 특허 등) */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-xs text-slate-300 mb-1">📄 기타 자산</p>
              <p className="text-2xl font-bold text-amber-400">
                {weeklyTotal - (categoryCounts['real_estate'] || 0) - (categoryCounts['vehicle'] || 0)}
                <span className="text-sm font-normal text-slate-300">건</span>
              </p>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            {topDepartment && (
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2">
                <span className="text-yellow-400">🏛️</span>
                <span className="text-slate-300">최다 공고 법원:</span>
                <span className="font-semibold text-white">{topDepartment[0]}</span>
                <span className="text-slate-400">({topDepartment[1]}건)</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2">
              <span className="text-blue-400">ℹ️</span>
              <span className="text-slate-300">전주 공고 수:</span>
              <span className="font-semibold text-white">{lastTotal}건</span>
            </div>
          </div>
        </div>

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

        {/* 블로그 & 가이드 섹션 */}
        <div className="mt-16 border-t border-gray-100 pt-10">
          <div className="flex flex-col items-center justify-center mb-10 text-center">
            <span className="text-3xl mb-3">✍️</span>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              입찰 가이드 & 투자 전략
            </h2>
            <p className="text-gray-500 mt-2 text-sm max-w-lg mx-auto leading-relaxed">
              성공적인 투자를 위한 전문가의 인사이트와 실전 팁을 확인하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getRecentPosts(3).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-gray-200 to-gray-200 group-hover:from-indigo-500 group-hover:to-blue-500 transition-all duration-500" />
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-100/50">
                      {blogCategories.find(c => c.name === post.category)?.icon} {post.category}
                    </span>
                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                      ⏱️ {post.readingTime}분
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4">
                    {post.description}
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-50 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                    자세히 보기 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/blog" className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-50 text-gray-700 font-semibold text-sm rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200">
              블로그 전체 보기
            </Link>
          </div>
        </div>

        {/* 용어사전 미리보기 섹션 */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📖</span>
              <h2 className="text-xl font-bold text-gray-900">
                회생·파산 용어사전
              </h2>
            </div>
            <Link href="/glossary" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
              전체 보기 →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6">
            <p className="text-gray-700 mb-4">
              경매와 자산매각에서 자주 사용되는 법률 용어를 쉽게 설명합니다.
              입찰 전에 꼭 알아야 할 핵심 개념들을 확인하세요.
            </p>
            <div className="flex flex-wrap gap-2">
              {glossaryTerms.slice(0, 10).map((term) => (
                <Link
                  key={term.slug}
                  href={`/glossary/${term.slug}`}
                  className="bg-white text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {term.term}
                </Link>
              ))}
              <Link
                href="/glossary"
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                +{glossaryTerms.length - 10}개 더보기
              </Link>
            </div>
          </div>
        </div>

        {/* 카테고리 바로가기 */}
        <div className="mt-16 mb-8 pt-8 border-t border-gray-100">
          <div className="flex flex-col items-center justify-center mb-10 text-center">
            <span className="text-3xl mb-3">🗂️</span>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              무엇을 찾고 계신가요?
            </h2>
            <p className="text-gray-500 mt-2 text-sm max-w-lg mx-auto leading-relaxed">
              관심 있는 자산 카테고리를 선택하면 관련 최신 공고와 맞춤형 투자 가이드를 한 번에 볼 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Link
              href="/category/real-estate"
              className="relative overflow-hidden bg-white border border-green-100/60 rounded-2xl p-6 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 group z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              <div className="w-16 h-16 mx-auto bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-green-100">
                🏠
              </div>
              <span className="block font-bold text-gray-900 text-lg mb-1 group-hover:text-green-700 transition-colors">부동산</span>
              <p className="text-xs text-gray-500 font-medium tracking-wide">아파트, 상가, 토지</p>
            </Link>

            <Link
              href="/category/vehicle"
              className="relative overflow-hidden bg-white border border-blue-100/60 rounded-2xl p-6 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 group z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm border border-blue-100">
                🚗
              </div>
              <span className="block font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-700 transition-colors">차량/동산</span>
              <p className="text-xs text-gray-500 font-medium tracking-wide">승용차, 특수차, 장비</p>
            </Link>

            <Link
              href="/category/bonds"
              className="relative overflow-hidden bg-white border border-amber-100/60 rounded-2xl p-6 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 group z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-amber-100">
                📄
              </div>
              <span className="block font-bold text-gray-900 text-lg mb-1 group-hover:text-amber-700 transition-colors">채권/주식</span>
              <p className="text-xs text-gray-500 font-medium tracking-wide">매출채권, 비상장주식</p>
            </Link>

            <Link
              href="/category/ip"
              className="relative overflow-hidden bg-white border border-purple-100/60 rounded-2xl p-6 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 group z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              <div className="w-16 h-16 mx-auto bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm border border-purple-100">
                💡
              </div>
              <span className="block font-bold text-gray-900 text-lg mb-1 group-hover:text-purple-700 transition-colors">특허/상표</span>
              <p className="text-xs text-gray-500 font-medium tracking-wide">특허권, 실용신안</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <Sidebar />
    </div>
  );
}
