import { supabase } from '@/lib/supabase';
import NoticeCard from '@/components/NoticeCard';
import SearchForm from '@/components/SearchForm';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { getRecentPosts, blogCategories } from '@/data/blog-posts';
import { glossaryTerms } from '@/data/glossary';
import ViewTracker from '@/components/ViewTracker';

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

  // ===== 주간 AI 트렌드 리포트 조회 =====
  const { data: weeklyReport } = await supabase
    .from('weekly_reports')
    .select('briefing_text, trending_tags, full_report, week_start, week_end, view_count')
    .order('week_end', { ascending: false })
    .limit(1)
    .single();

  // Parse trending tags
  let trendingTags: { tag: string; count: number }[] = [];
  if (weeklyReport?.trending_tags) {
    try {
      trendingTags = typeof weeklyReport.trending_tags === 'string'
        ? JSON.parse(weeklyReport.trending_tags)
        : weeklyReport.trending_tags;
    } catch { trendingTags = []; }
  }

  // ===== 기존 주간 공고 쿼리 =====
  // Query for weekly real estate notices
  const { data: realEstateNotices } = await supabase
    .from('court_notices')
    .select('*')
    .gte('date_posted', weekAgoStr)
    .lte('date_posted', todayStr)
    .eq('category', 'real_estate')
    .eq('source_type', 'notice')
    .order('date_posted', { ascending: false })
    .limit(10);

  // Query for weekly vehicle notices
  const { data: vehicleNotices } = await supabase
    .from('court_notices')
    .select('*')
    .gte('date_posted', weekAgoStr)
    .lte('date_posted', todayStr)
    .eq('category', 'vehicle')
    .eq('source_type', 'notice')
    .order('date_posted', { ascending: false })
    .limit(10);

  // Query for past notices (1-2 months ago) for compact list
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setDate(today.getDate() - 60);
  const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];

  const { data: pastNotices } = await supabase
    .from('court_notices')
    .select('id, title, category, department, date_posted')
    .gte('date_posted', twoMonthsAgoStr)
    .lt('date_posted', weekAgoStr)
    .order('date_posted', { ascending: false })
    .limit(30);

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
              대법원 회생 · 파산 자산매각 공고<br className="max-sm:hidden" />
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

        {/* 🔥 AI 트렌드 워드 플로우 (해시태그) */}
        {trendingTags.length > 0 && (!hasSearchParams) && (
          <div className="mt-6 mb-8 px-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🔥</span>
              <h3 className="text-xs font-bold text-gray-500 tracking-wider flex-1">지금 뜨고 있는 AI 키워드</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.slice(0, 10).map((item) => (
                <Link
                  key={item.tag}
                  href={`/?q=${encodeURIComponent(item.tag)}`}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-600 hover:text-indigo-700 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm"
                >
                  <span className="text-indigo-400">#</span>
                  <span>{item.tag}</span>
                  <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{item.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Result Message / Data List - right below search button */}
        <div className="mt-4">
          {(!notices || notices?.length === 0) ? (
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
                {notices?.map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} />
                ))}
              </div>
            </div>
          )}
        </div>

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

          {/* ✨ AI 시장 동향 브리핑 (방법 1) */}
          {weeklyReport?.briefing_text && (
            <div className="mt-5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✨</span>
                <h3 className="text-sm font-bold text-cyan-300 tracking-wide">AI 시장 동향 분석</h3>
                <div className="ml-auto flex items-center gap-2">
                  <ViewTracker 
                    tableName="weekly_reports" 
                    idColumn="week_end" 
                    idValue={weeklyReport?.week_end} 
                    initialCount={weeklyReport?.view_count || 0}
                    className="text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full text-[10px]"
                  />
                  <span className="text-xs text-slate-500">{weeklyReport?.week_start} ~ {weeklyReport?.week_end}</span>
                </div>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">
                {weeklyReport?.briefing_text}
              </p>
              <div className="mt-3 text-right">
                <Link href="/trend" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  전체 리포트 보기 →
                </Link>
              </div>
            </div>
          )}


        </div>

        {/* 📊 주간 매각물건 분석 리포트 CTA Banner */}
        <div className="mt-6">
          <Link href="/trend" className="group block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                      </span>
                      NEW
                    </span>
                    <span className="text-emerald-100 text-xs font-medium">매주 자동 업데이트 • 조회 {(weeklyReport?.view_count || 0).toLocaleString()}회</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1 group-hover:translate-x-1 transition-transform duration-200">
                    📊 주간 매각물건 분석 리포트
                  </h3>
                  <p className="text-emerald-100 text-sm leading-relaxed max-w-lg">
                    AI가 이번 주 부동산·차량·기타 자산 매각 공고를 분석했습니다. 매물 종류, 가격대, 지역 분포를 한눈에 확인하세요.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl shadow-md group-hover:shadow-lg group-hover:bg-emerald-50 transition-all duration-200 text-sm">
                    리포트 보기
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>



        {/* TEMPORARY HIDDEN FOR ADSENSE */}
        {false && (<>
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
            {realEstateNotices && (realEstateNotices?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {realEstateNotices?.map((notice) => (
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
            {vehicleNotices && (vehicleNotices?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {vehicleNotices?.map((notice) => (
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

        {/* Past 1-2 Months Compact List Section */}
        {pastNotices && (pastNotices?.length ?? 0) > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                <h2 className="text-xl font-bold text-gray-900">
                  최근 1~2개월 주요 공고 (마감 임박)
                </h2>
                <span className="text-sm text-gray-500 ml-2 hidden sm:inline">
                  ({twoMonthsAgoStr} ~ {weekAgoStr})
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {pastNotices?.map((notice) => (
                  <li key={notice.id} className="hover:bg-indigo-50/40 transition-colors group">
                    <Link href={`/notice/${notice.id}`} className="block px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className={`flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${
                          notice.category === 'real_estate' 
                            ? 'bg-green-100 text-green-700' 
                            : notice.category === 'vehicle' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {notice.category === 'real_estate' ? '부동산' : notice.category === 'vehicle' ? '차량/동산' : '기타'}
                        </span>
                        <p className="flex-1 text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
                          {notice.title}
                        </p>
                        <div className="hidden sm:flex flex-shrink-0 items-center gap-6 text-[13px] text-gray-500 font-medium">
                          <span className="w-24 truncate text-right">{notice.department || '-'}</span>
                          <span className="w-20 text-right">{notice.date_posted}</span>
                        </div>
                      </div>
                      <div className="sm:hidden flex items-center gap-3 mt-2 text-[12px] text-gray-500 font-medium pl-14">
                        <span className="truncate">{notice.department || '-'}</span>
                        <span className="text-gray-300">|</span>
                        <span>{notice.date_posted}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        
        </>)}

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
            {getRecentPosts(9).map((post) => (
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

        
        {/* SEO Text Block for AdSense Approval */}
        <div className="mt-16 mb-8 bg-white rounded-2xl p-8 border border-gray-200 text-[14px] leading-[1.8] text-gray-600 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                대법원 회생·파산 자산매각 공고, 나만의 숨은 수익처 찾기 가이드
            </h2>
            <p className="mb-4">
                로옥션(LawAuction)은 대한민국 법원 대국민서비스를 통해 공개되는 회생 및 파산 관련 부동산, 차량, 특허 및 비상장 주식 등 다양한 자산 매각 공고를 실시간으로 분석하고 가공하여 제공하는 프리미엄 정보 플랫폼입니다. 일반적인 법원 경매와 달리, 파산관재인이나 회생 관리인이 법원의 허가를 받아 진행하는 매각 절차는 아직 대중화되지 않은 진정한 블루오션입니다. 상대적으로 낮은 경쟁률과 유연한 매각 조건(수의계약 가능성 등), 그리고 시세 대비 현저하게 저렴한 입찰 가능성을 제공합니다.
            </p>
            <p className="mb-4">
                특히, 경매 입찰 초보부터 전문 투자자까지 누구나 손쉽게 복잡한 공고를 이해할 수 있도록 자체적인 AI 분석 엔진을 도입했습니다. 각각의 공고에 포함된 방대한 양의 매각물건명세서, 감정평가서, 그리고 유치권 신고 내역 등을 자동으로 텍스트화하여 핵심만을 짚어드리는 AI 요약 서비스는 오직 로옥션에서만 만나보실 수 있습니다. 또한 낙찰 시뮬레이션을 위한 예상 부대비용 및 취득세 계산기, 권리분석 단계별 필수 체크리스트를 전면 무료로 제공함으로써 사용자 여러분의 투자 실패율을 제로(0%)에 수렴하게 만드는 것을 목표로 합니다.
            </p>
            <p>
                현장 임장을 떠나기 전, 반드시 본 사이트가 제공하는 카테고리별 투자 유의사항과 <strong>입찰 시나리오 플래너</strong>를 확인하시기 바랍니다. 로옥션은 단순한 1차 데이터(Raw Data)의 전달을 넘어, 매물별 예상 수익률, 인근 지역의 최신 낙찰가율 동향, 그리고 전문 에디터의 투자 전략 코멘트까지 하나의 통합된 인사이트(Insight)로 묶어 제공함으로써 대한민국 최상의 부동산·회생경매 리서치 센터로 발돋움하겠습니다. 
                <br /><br />
                *본 서비스에서 제공하는 모든 공고데이터 요약본과 예상 부대비용 수치는 AI와 자체 알고리즘이 산출한 참고 정보입니다. 입찰 전에는 반드시 대법원 사이트의 원본 서류와 현장 실사를 필수적으로 거치시길 강력히 권장합니다.
            </p>
        </div>

      </div>

      {/* Right Sidebar */}
      <Sidebar />
    </div>
  );
}
