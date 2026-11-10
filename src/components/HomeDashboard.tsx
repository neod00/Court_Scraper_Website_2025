// 홈 기본 화면 — 검색, 이번 주 입찰 일정, 최근 공고, 법원·자산 유형 바로가기, 계산기.
import Link from 'next/link';
import { Suspense } from 'react';
import SearchForm from '@/components/SearchForm';
import { RecentNoticeList, UpcomingTable } from '@/components/NoticeIndexViews';
import { getRecentPosts } from '@/data/blog-posts';
import { categories } from '@/data/categories';
import { type CourtInfo, getCourtByName } from '@/data/courts';
import { INDEX_DAYS, getNoticeIndex, groupStats, upcomingRounds } from '@/lib/noticeIndex';

const TOOLS = [
    { href: '/tools/acquisition-tax', label: '취득세 계산기', text: '낙찰가로 취득세·지방교육세·농어촌특별세를 계산합니다. 다주택 중과와 경차 감면을 반영합니다.' },
    { href: '/tools/bid-calculator', label: '입찰가 계산기', text: '예상 매도가와 목표 이익률로 세금·비용을 뺀 입찰가 상한을 역산합니다.' },
    { href: '/tools/vehicle-transfer', label: '차량 이전비 계산기', text: '법원 매각 차량의 취득세, 공채, 등록 비용을 합산합니다.' },
    { href: '/tools/roi-calculator', label: '매도·임대 손익 계산기', text: '총비용과 매도가·임대료를 비교해 차익과 수익률을 계산합니다.' },
];

export default async function HomeDashboard() {
    const index = await getNoticeIndex();
    const weekUpcoming = upcomingRounds(index, 7);
    const upcoming = weekUpcoming.slice(0, 12);
    const recent = index.slice(0, 12);
    const stats = groupStats(index);
    const courtCounts = stats.byCourt
        .map(([name, count]) => ({ court: getCourtByName(name), count }))
        .filter((c): c is { court: CourtInfo; count: number } => Boolean(c.court))
        .slice(0, 12);
    const categoryCounts = categories.map((cat) => ({
        cat,
        count: index.filter((n) => cat.dbCategories.includes(n.category)).length,
    }));
    const guides = getRecentPosts(3);

    return (
        <div className="max-w-6xl mx-auto space-y-14">
            <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-10 sm:px-10 sm:py-12 text-white">
                <div className="max-w-3xl">
                    <p className="text-cyan-300 font-semibold text-sm mb-3">전국 법원 회생·파산 자산매각 공고</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                        관재인 매각 공고를 한곳에서 찾고, 회차별 최저가와 입찰일을 바로 확인하세요
                    </h1>
                    <p className="mt-5 text-slate-300 leading-7">
                        로옥션(LawAuction)은 법원마다 따로 올라오는 파산관재인·회생 관리인의 자산매각 공고를 모아 검색할 수 있게 합니다.
                        첨부 공고문을 읽어 회차별 최저입찰가 표와 원문을 공고마다 보여주고, 취득세와 입찰가 계산기를 함께 제공합니다.
                    </p>
                    <dl className="mt-6 grid grid-cols-3 gap-3 max-w-lg text-center">
                        <div className="rounded-xl bg-white/10 px-2 py-3">
                            <dt className="text-[11px] text-slate-300">최근 {INDEX_DAYS}일 원문 공고</dt>
                            <dd className="mt-1 text-xl font-bold">{stats.total.toLocaleString('ko-KR')}건</dd>
                        </div>
                        <div className="rounded-xl bg-white/10 px-2 py-3">
                            <dt className="text-[11px] text-slate-300">회차표 정리</dt>
                            <dd className="mt-1 text-xl font-bold">{stats.withRounds.toLocaleString('ko-KR')}건</dd>
                        </div>
                        <div className="rounded-xl bg-white/10 px-2 py-3">
                            <dt className="text-[11px] text-slate-300">7일 내 입찰</dt>
                            <dd className="mt-1 text-xl font-bold">{weekUpcoming.length.toLocaleString('ko-KR')}건</dd>
                        </div>
                    </dl>
                </div>
            </header>

            <section aria-labelledby="search-heading">
                <div className="mb-5">
                    <h2 id="search-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">공고 검색</h2>
                    <p className="mt-2 text-gray-600">기간, 자산 유형, 키워드로 찾습니다. 키워드는 제목과 첨부 공고문 원문을 함께 검색합니다.</p>
                </div>
                <Suspense fallback={<div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />}>
                    <SearchForm />
                </Suspense>
            </section>

            <section aria-labelledby="upcoming-heading">
                <div className="flex items-end justify-between gap-4 mb-2">
                    <h2 id="upcoming-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">이번 주 입찰 일정</h2>
                    <Link href="/court" className="text-sm text-indigo-700 font-semibold hover:underline whitespace-nowrap">법원별로 보기</Link>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    첨부 공고문의 회차표에서 7일 안에 입찰일이 돌아오는 회차를 골랐습니다. 앞 회차에서 낙찰되면 뒤 회차는 열리지 않으니 진행 여부는 관재인 사무실에 확인하세요.
                </p>
                <UpcomingTable rows={upcoming} />
            </section>

            <section aria-labelledby="recent-heading">
                <div className="flex items-end justify-between gap-4 mb-4">
                    <h2 id="recent-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">최근 등록 공고</h2>
                    <Link href="#search-heading" className="text-sm text-indigo-700 font-semibold hover:underline whitespace-nowrap">검색으로 더 찾기</Link>
                </div>
                <RecentNoticeList notices={recent} />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8" aria-label="법원별·자산 유형별 공고">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">법원별 공고</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {courtCounts.map(({ court, count }) => (
                            <li key={court.slug}>
                                <Link href={`/court/${court.slug}`} className="flex justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-indigo-300 hover:text-indigo-700">
                                    <span className="font-medium">{court.name}</span>
                                    <span className="text-gray-500">{count.toLocaleString('ko-KR')}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link href="/court" className="mt-3 inline-block text-sm text-indigo-700 font-semibold hover:underline">전체 법원 보기</Link>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">자산 유형별 공고</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {categoryCounts.map(({ cat, count }) => (
                            <li key={cat.slug}>
                                <Link href={`/category/${cat.slug}`} className="flex justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-indigo-300 hover:text-indigo-700">
                                    <span className="font-medium">{cat.icon} {cat.name}</span>
                                    <span className="text-gray-500">{count.toLocaleString('ko-KR')}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section aria-labelledby="tools-heading">
                <div className="flex items-end justify-between gap-4 mb-4">
                    <h2 id="tools-heading" className="text-2xl sm:text-3xl font-bold text-gray-900">계산기</h2>
                    <Link href="/tools" className="text-sm text-indigo-700 font-semibold hover:underline whitespace-nowrap">전체 계산기</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {TOOLS.map((tool) => (
                        <Link key={tool.href} href={tool.href} className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                            <h3 className="font-bold text-gray-900">{tool.label}</h3>
                            <p className="mt-2 text-sm text-gray-600 leading-6">{tool.text}</p>
                        </Link>
                    ))}
                </div>
            </section>

            <section aria-labelledby="guide-heading">
                <div className="flex items-end justify-between gap-4 mb-4">
                    <h2 id="guide-heading" className="text-xl font-bold text-gray-900">처음이라면 읽어 볼 글</h2>
                    <Link href="/blog" className="text-sm text-indigo-700 font-semibold hover:underline whitespace-nowrap">가이드 전체</Link>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {guides.map((post) => (
                        <li key={post.slug}>
                            <Link href={`/blog/${post.slug}`} className="block h-full rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300">
                                <h3 className="font-semibold text-gray-900 leading-snug">{post.title}</h3>
                                <p className="mt-2 text-xs text-gray-500">최종 사실 확인 {post.reviewedAt ?? post.updatedAt}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-sm text-gray-600">
                    공고에 자주 나오는 말은 <Link href="/glossary" className="text-indigo-700 font-semibold hover:underline">용어사전</Link>,
                    입찰일·가격대 통계는 <Link href="/datalab" className="text-indigo-700 font-semibold hover:underline">데이터랩</Link>에 있습니다.
                </p>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700 leading-6" aria-label="이용 안내">
                <p>
                    로옥션은 법원과 제휴하지 않은 민간 서비스입니다. 공고의 효력과 현재 조건은 대한민국 법원 게시물과 첨부 원문을 기준으로 하며,
                    수집·정리 방식은 <Link href="/editorial-policy" className="font-semibold text-indigo-700 hover:underline">데이터·편집 원칙</Link>에서 확인할 수 있습니다.
                </p>
            </section>
        </div>
    );
}
