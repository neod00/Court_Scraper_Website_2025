import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchForm from '@/components/SearchForm';
import NoticeCard from '@/components/NoticeCard';
import { supabase } from '@/lib/supabase';
import { getRecentPosts, blogCategories } from '@/data/blog-posts';

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
      title: '법원 자산매각 공고 검색 결과 | LawAuction',
      description: '입력한 기간, 자산 유형과 키워드에 맞는 법원 회생·파산 자산매각 공고를 조회합니다.',
      alternates: { canonical: '/' },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: '로옥션 | 법원 회생·파산 자산매각 공고 검색',
    description: '대한민국 법원에 공개된 회생·파산 자산매각 공고를 기간, 자산 유형과 키워드로 찾아 원문을 확인할 수 있는 민간 검색 서비스입니다.',
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
          <p className="text-sm font-semibold text-indigo-600 mb-2">공개 공고 검색 도구</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">법원 자산매각 공고 검색 결과</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            검색 결과는 대한민국 법원 공개자료를 수집해 정리한 참고 정보입니다. 일정과 조건은 변경될 수 있으므로
            참여 전 공고 상세의 원문 링크와 첨부파일을 다시 확인하세요.
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

  const recentPosts = getRecentPosts(5);

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-12 sm:px-10 sm:py-16 text-white overflow-hidden relative">
        <div className="relative z-10 max-w-3xl">
          <p className="text-cyan-300 font-semibold text-sm mb-4">법원 공개자료를 정리하는 민간 정보 서비스</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            회생·파산 자산매각 공고를<br className="hidden sm:block" /> 한곳에서 찾아보세요
          </h1>
          <p className="mt-6 text-slate-300 leading-7 max-w-2xl">
            로옥션은 대한민국 법원에 공개된 공고를 기간, 자산 유형과 키워드로 찾을 수 있게 정리합니다.
            법원 또는 법원행정처와 제휴·보증 관계가 없으며, 검색 결과와 AI 요약은 원문 확인을 돕는 보조 자료입니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <Link href="/about" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">서비스와 운영자 정보</Link>
            <Link href="/editorial-policy" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">데이터·편집 원칙</Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="search-heading">
        <div className="mb-6">
          <h2 id="search-heading" className="text-3xl font-bold text-gray-900">공고 검색</h2>
          <p className="mt-2 text-gray-600">검색 버튼을 누를 때만 현재 저장된 공고를 조회합니다.</p>
        </div>
        <Suspense fallback={<div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />}>
          <SearchForm />
        </Suspense>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-label="서비스 이용 원칙">
        <article className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="text-2xl mb-3">🔎</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">원문으로 이어지는 검색</h2>
          <p className="text-sm text-gray-600 leading-6">공고 제목·게시일·담당 법원과 첨부자료를 찾기 쉽게 정리하고 상세 페이지에서 법원 원문으로 연결합니다.</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="text-2xl mb-3">🧭</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">절차를 구분하는 안내</h2>
          <p className="text-sm text-gray-600 leading-6">법원 경매와 회생·파산 자산매각을 같은 절차로 단정하지 않고, 공고별 제출·계약 조건을 확인하도록 안내합니다.</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="text-2xl mb-3">📄</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">AI 범위의 명확한 표시</h2>
          <p className="text-sm text-gray-600 leading-6">AI 요약은 일정과 가격 같은 항목을 찾기 위한 초안이며 법률 판단, 감정평가 또는 수익 보장이 아님을 표시합니다.</p>
        </article>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-indigo-600 mb-2">확인 절차</p>
          <h2 className="text-3xl font-bold text-gray-900">공고를 검토할 때 지키는 순서</h2>
          <ol className="mt-6 grid gap-4 text-gray-700 leading-7">
            <li><strong>1. 절차 확인:</strong> 법원 경매인지, 회생·파산 공고의 별도 입찰인지 구분합니다.</li>
            <li><strong>2. 원문 대조:</strong> 제목뿐 아니라 첨부파일, 정정·재공고와 담당자 안내를 확인합니다.</li>
            <li><strong>3. 조건 기록:</strong> 보증금, 제출 방법, 법원 허가, 대금 납부와 인도 조건을 원문 그대로 기록합니다.</li>
            <li><strong>4. 개별 조사:</strong> 등기·등록 상태, 점유, 현장 상태와 부대비용을 자산 유형에 맞게 조사합니다.</li>
            <li><strong>5. 최종 재확인:</strong> 참여 직전에 일정 변경·취소 여부를 공식 페이지에서 다시 확인합니다.</li>
          </ol>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-indigo-600 mb-2">사람이 확인한 편집 콘텐츠</p>
            <h2 className="text-3xl font-bold text-gray-900">공고 확인 가이드</h2>
          </div>
          <Link href="/blog" className="text-indigo-700 font-semibold hover:underline">전체 글 보기 →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recentPosts.map((post) => {
            const categoryInfo = blogCategories.find((item) => item.name === post.category);
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition-all">
                <p className="text-sm font-semibold text-indigo-600">{categoryInfo?.icon} {categoryInfo?.label}</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900 leading-snug">{post.title}</h3>
                <p className="mt-3 text-sm text-gray-600 leading-6">{post.description}</p>
                <p className="mt-4 text-xs text-gray-500">최종 사실 확인 {post.reviewedAt ?? post.updatedAt} · {post.author}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8 text-amber-950">
        <h2 className="text-xl font-bold mb-3">이용 전 확인하세요</h2>
        <p className="leading-7">
          로옥션은 법원과 제휴한 입찰 대행 서비스가 아닙니다. 공고의 효력과 현재 조건은 대한민국 법원 원문을 기준으로 하며,
          권리관계·세금·계약 판단이 필요한 경우 관련 기관 또는 자격 있는 전문가에게 확인해야 합니다.
        </p>
      </section>
    </div>
  );
}
