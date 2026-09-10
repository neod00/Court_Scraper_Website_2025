import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchForm from '@/components/SearchForm';
import NoticeCard from '@/components/NoticeCard';
import { supabase } from '@/lib/supabase';
import { getRecentPosts, blogCategories } from '@/data/blog-posts';
import { filterQualityNotices } from '@/lib/noticeQuality';
import {
  type WeeklyReport,
  filterPublishedColumns,
  columnTitle,
  columnExcerpt,
  columnDate,
  columnAuthor,
  weekLabel,
} from '@/lib/weeklyColumn';

interface PageProps {
  searchParams: Promise<{
    start?: string;
    end?: string;
    q?: string;
    cat?: string;
  }>;
}

interface NoticeRow {
  id: string;
  title: string;
  department: string | null;
  date_posted: string;
  category: string | null;
  site_id: string;
  ai_summary?: string | null;
  view_count?: number | null;
}

// 홈에서 인용하는 수집 데이터 기준 (corpus_stats: 2026-03-01~2026-08-31, 집계일 2026-09-08)
const CORPUS = {
  window: '2026년 3~8월',
  notices: '2,562',
  summaries: '1,120',
  snapshot: '2026-09-08',
};

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
    title: { absolute: '로옥션(LawAuction) | 법원 회생·파산 자산매각 공고 검색과 데이터 칼럼' },
    description:
      '대한민국 법원에 공개된 회생·파산 자산매각 공고를 기간, 자산 유형, 키워드로 검색하고, 주간 집계 데이터 칼럼과 통계로 공고 흐름을 확인할 수 있는 민간 정보 서비스입니다.',
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

  const recentPosts = getRecentPosts(5);

  // 주간 집계 12주 + 최근 수집 공고 30건을 함께 조회한다.
  const [{ data: weeklyRaw }, { data: recentRaw }] = await Promise.all([
    supabase
      .from('weekly_reports')
      .select('*')
      .order('week_end', { ascending: false })
      .limit(12),
    supabase
      .from('court_notices')
      .select('id, title, department, date_posted, category, site_id, ai_summary')
      .eq('source_type', 'notice')
      .order('date_posted', { ascending: false })
      .limit(30),
  ]);

  const weeklyReports = (weeklyRaw as WeeklyReport[]) || [];
  const latestColumn = filterPublishedColumns(weeklyReports)[0];
  const recentWeeks = weeklyReports.slice(0, 4);
  // 아직 끝나지 않은 주차는 "집계 중"으로 표시한다 (서버 시각, KST 기준).
  const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // 홈에 노출하는 공고는 요약 추출에 성공한 것만 (noticeQuality 게이트)
  const recentNotices = filterQualityNotices((recentRaw as NoticeRow[]) || []).slice(0, 6);

  const dataCards = [
    {
      href: '/trend',
      label: '주간 칼럼',
      text: '주 단위 공고 건수와 법원별·자산 유형별 집계에 편집자가 검토한 해석을 붙여 정리합니다.',
    },
    {
      href: '/datalab',
      label: '데이터랩',
      text: '입찰일 분포와 최저매각가 구간 등 수집 공고의 통계를 집계 기준과 함께 보여줍니다.',
    },
    {
      href: '/glossary',
      label: '용어사전',
      text: '입찰보증금, 현상 인도, 수의계약처럼 공고에 자주 나오는 용어를 회생·파산 매각 공고 기준으로 설명합니다.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-14">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-10 sm:px-10 sm:py-12 text-white">
        <div className="max-w-3xl">
          <p className="text-cyan-300 font-semibold text-sm mb-3">법원 공개자료를 정리하는 민간 정보 서비스</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
            회생·파산 자산매각 공고 검색과 데이터 칼럼
          </h1>
          <p className="mt-5 text-slate-300 leading-7">
            로옥션(LawAuction)은 대한민국 법원에 공개된 회생·파산 자산매각 공고를 기간, 자산 유형, 키워드로 찾을 수 있게 정리합니다.
            수집한 공고는 주 단위로 집계해 데이터 칼럼과 통계로 함께 제공합니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/editorial-policy" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">데이터·편집 원칙</Link>
            <Link href="/about" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">소개</Link>
          </div>
        </div>
      </header>

      {/* 첫 화면: 왼쪽 검색, 오른쪽 이번 주 데이터 */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-start" aria-label="공고 검색과 이번 주 데이터">
        <div className="lg:col-span-3">
          <div className="mb-5">
            <h2 id="search-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">공고 검색</h2>
            <p className="mt-2 text-gray-600">검색 버튼을 누를 때만 현재 저장된 공고를 조회합니다.</p>
          </div>
          <Suspense fallback={<div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />}>
            <SearchForm />
          </Suspense>
        </div>

        <aside className="lg:col-span-2" aria-labelledby="weekly-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="weekly-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">이번 주 데이터</h2>
            <Link href="/trend" className="text-sm font-semibold text-indigo-700 hover:underline whitespace-nowrap">주간 칼럼 전체</Link>
          </div>

          {latestColumn ? (
            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-semibold text-indigo-600">{weekLabel(latestColumn)} 칼럼</p>
              <h3 className="mt-2 text-xl font-bold text-gray-900 leading-snug">
                <Link href={`/trend/${latestColumn.week_start}`} className="hover:text-indigo-700">{columnTitle(latestColumn)}</Link>
              </h3>
              <p className="mt-3 text-sm text-gray-600 leading-6">{columnExcerpt(latestColumn, 220)}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">{latestColumn.week_start} ~ {latestColumn.week_end} 수집</dt>
                  <dd className="mt-1 text-lg font-bold text-gray-900">{latestColumn.total_notices ?? 0}건</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">최다 공고 법원</dt>
                  <dd className="mt-1 text-sm font-bold text-gray-900">{latestColumn.top_department || '집계 없음'}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-gray-500">{columnAuthor(latestColumn)} · {columnDate(latestColumn)}</p>
              <Link href={`/trend/${latestColumn.week_start}`} className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline">
                칼럼 읽기
              </Link>
            </article>
          ) : recentWeeks.length > 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-semibold text-indigo-600">최근 4주 수집 집계</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <th scope="col" className="py-2 pr-3 font-medium">주차</th>
                      <th scope="col" className="py-2 pr-3 font-medium text-right">공고</th>
                      <th scope="col" className="py-2 font-medium">최다 법원</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentWeeks.map((week) => (
                      <tr key={week.week_start} className="border-b border-gray-100 last:border-0">
                        <td className="py-2.5 pr-3">
                          <span className="font-semibold text-gray-900">{weekLabel(week)}</span>
                          <span className="block text-xs text-gray-500">
                            {week.week_start} ~ {week.week_end}
                            {week.week_end > todayStr ? ' · 집계 중' : ''}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-bold text-gray-900 whitespace-nowrap">
                          {typeof week.total_notices === 'number' ? `${week.total_notices}건` : '-'}
                        </td>
                        <td className="py-2.5 text-gray-700">{week.top_department || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-500">로옥션이 수집한 법원 공고를 주 단위로 센 값이며, 낙찰 결과는 수집하지 않습니다.</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href="/datalab" className="rounded-full bg-gray-900 text-white px-4 py-2 font-semibold hover:bg-gray-800">입찰일·가격대 통계</Link>
                <Link href="/trend" className="rounded-full border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">주간 집계 보기</Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-gray-600 leading-7">
                주간 집계 데이터는 주간 칼럼 페이지와 데이터랩에 정리되어 있습니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href="/datalab" className="rounded-full bg-gray-900 text-white px-4 py-2 font-semibold hover:bg-gray-800">입찰일·가격대 통계</Link>
                <Link href="/trend" className="rounded-full border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">주간 집계 보기</Link>
              </div>
            </div>
          )}
        </aside>
      </section>

      {/* 최근 수집 공고 — 요약 추출에 성공한 공고만 */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-indigo-600 mb-2">요약 추출에 성공한 최근 공고</p>
            <h2 id="recent-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">최근 수집 공고</h2>
          </div>
          <Link href="#search-heading" className="text-indigo-700 font-semibold hover:underline whitespace-nowrap">검색으로 더 찾기</Link>
        </div>
        {recentNotices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentNotices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <p className="text-gray-600 leading-7">
              최근 공고 목록을 불러오지 못했습니다. 위 검색에서 기간을 비우고 조회하면 최근 30일 공고를 볼 수 있습니다.
            </p>
          </div>
        )}
        <p className="mt-4 text-sm text-gray-500">
          일정과 조건은 공고 상세 페이지의 법원 원문 링크에서 확인해야 합니다.
        </p>
      </section>

      {/* 데이터로 보는 공고 */}
      <section aria-labelledby="data-heading">
        <div className="mb-6">
          <p className="text-sm font-semibold text-indigo-600 mb-2">수집 데이터의 다른 활용</p>
          <h2 id="data-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">데이터로 보는 공고</h2>
          <p className="mt-2 text-gray-600 leading-7">
            로옥션이 {CORPUS.window}에 수집한 공고는 {CORPUS.notices}건이며, 이 중 {CORPUS.summaries}건에서 요약을 추출했습니다(집계일 {CORPUS.snapshot}).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {dataCards.map((card) => (
            <Link key={card.href} href={card.href} className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-gray-900">{card.label}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-6">{card.text}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-indigo-700">바로가기</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 편집 콘텐츠 */}
      <section aria-labelledby="editorial-heading">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-indigo-600 mb-2">사람이 확인한 글</p>
            <h2 id="editorial-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">편집 콘텐츠</h2>
          </div>
          <Link href="/blog" className="text-indigo-700 font-semibold hover:underline whitespace-nowrap">전체 글 보기</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recentPosts.map((post) => {
            const categoryInfo = blogCategories.find((item) => item.name === post.category);
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition-all">
                <p className="text-sm font-semibold text-indigo-600">{categoryInfo?.label ?? post.category}</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900 leading-snug">{post.title}</h3>
                <p className="mt-3 text-sm text-gray-600 leading-6">{post.description}</p>
                <p className="mt-4 text-xs text-gray-500">최종 사실 확인 {post.reviewedAt ?? post.updatedAt} · {post.author}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700 leading-6" aria-label="이용 안내">
        <p>
          로옥션은 법원과 제휴하지 않은 민간 서비스이며, 공고의 효력과 현재 조건은 대한민국 법원 원문을 기준으로 합니다.
          수집·요약·검수 방식은 <Link href="/editorial-policy" className="font-semibold text-indigo-700 hover:underline">데이터·편집 원칙</Link>에서 확인할 수 있습니다.
        </p>
      </section>
    </div>
  );
}
