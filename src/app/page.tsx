import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchForm from '@/components/SearchForm';
import NoticeCard from '@/components/NoticeCard';
import { supabase } from '@/lib/supabase';
import HomeDashboard from '@/components/HomeDashboard';

interface PageProps {
  searchParams: Promise<{
    start?: string;
    end?: string;
    q?: string;
    cat?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasSearchParams = Boolean(params.start || params.end || params.q || params.cat);

  if (hasSearchParams) {
    return {
      title: { absolute: '법원 자산매각 공고 검색 결과 | 로옥션' },
      description: '입력한 기간, 자산 유형과 키워드에 맞는 법원 회생·파산 자산매각 공고를 조회합니다.',
      alternates: { canonical: '/' },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: { absolute: '로옥션(LawAuction) | 법원 회생·파산 자산매각 공고 검색·입찰 일정·취득세 계산기' },
    description:
      '전국 회생법원과 지방법원의 파산관재인 자산매각 공고를 검색하고, 첨부 공고문에서 읽은 회차별 최저입찰가와 입찰 마감일, 취득세·입찰가 계산기를 함께 쓰는 도구 사이트입니다.',
    alternates: { canonical: '/' },
    robots: { index: true, follow: true },
  };
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const start = params.start?.trim();
  const end = params.end?.trim();
  const keyword = params.q?.trim();
  const category = params.cat?.trim();
  const hasSearchParams = Boolean(start || end || keyword || category);

  if (hasSearchParams) {
    let query = supabase
      .from('court_notices')
      .select('id, title, department, date_posted, category, site_id, ai_summary, view_count', { count: 'exact' })
      .eq('source_type', 'notice');

    if (start) query = query.gte('date_posted', start);
    if (end) query = query.lte('date_posted', end);
    if (category) query = query.eq('category', category);
    if (keyword) {
      const safeKeyword = keyword.replace(/[,%()]/g, ' ').trim();
      if (safeKeyword) query = query.or(`title.ilike.%${safeKeyword}%,content_text.ilike.%${safeKeyword}%`);
    }

    const { data: notices, count, error } = await query
      .order('date_posted', { ascending: false })
      .limit(50);

    return (
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <p className="text-sm font-semibold text-indigo-600 mb-2">공개 공고 검색</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">법원 자산매각 공고 검색 결과</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            검색 결과는 대한민국 법원 공개자료를 수집해 정리한 참고 정보이며, 일정과 조건은 공고 상세의 원문 링크에서 다시 확인해야 합니다.
          </p>
        </header>

        <Suspense fallback={<div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />}>
          <SearchForm />
        </Suspense>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
            공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        ) : (
          <section>
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">조회 결과</h2>
              <span className="text-sm text-gray-500">최대 50건 표시 · 전체 {count ?? 0}건</span>
            </div>

            {notices && notices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {notices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <h3 className="font-bold text-gray-900 mb-2">조건에 맞는 공고가 없습니다</h3>
                <p className="text-gray-600">기간을 넓히거나 키워드·자산 유형을 변경해 다시 조회해 보세요.</p>
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  return <HomeDashboard />;
}
