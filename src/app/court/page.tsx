import Link from 'next/link';
import type { Metadata } from 'next';
import { courts } from '@/data/courts';
import { INDEX_DAYS, getNoticeIndex, groupStats, upcomingRounds } from '@/lib/noticeIndex';
import { UpcomingTable } from '@/components/NoticeIndexViews';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: '법원별 회생·파산 자산매각 공고',
    description: '서울회생법원, 수원회생법원 등 전국 회생법원과 지방법원의 파산관재인 자산매각 공고를 법원별로 모았습니다. 법원마다 공고 수와 2주 안에 입찰일이 있는 회차를 보여줍니다.',
    alternates: { canonical: '/court' },
    robots: { index: true, follow: true },
};

export default async function CourtHubPage() {
    const index = await getNoticeIndex();
    const rows = courts
        .map((court) => {
            const list = index.filter((n) => n.court === court.name);
            const stats = groupStats(list);
            return { court, total: stats.total, upcoming: upcomingRounds(list, 14).length, latest: stats.latestDate };
        })
        .sort((a, b) => b.total - a.total);
    const allUpcoming = upcomingRounds(index, 7).slice(0, 10);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-[#57534E] mb-8" aria-label="breadcrumb">
                <Link href="/" className="hover:text-[#1F3D7A]">홈</Link>
                <span>/</span>
                <span className="text-[#161616] font-medium">법원별 공고</span>
            </nav>

            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161616]">법원별 자산매각 공고</h1>
                <p className="mt-4 text-[#2E2B27] leading-relaxed max-w-3xl">
                    회생·파산 사건의 자산매각 공고는 사건을 맡은 법원 홈페이지에 따로 올라옵니다.
                    로옥션은 전국 회생법원과 지방법원의 공고를 모아 법원별로 나눠 보여줍니다.
                    공고 수는 최근 {INDEX_DAYS}일 동안 첨부 공고문 원문을 확인한 공고만 셉니다.
                </p>
            </header>

            <section className="mb-12" aria-labelledby="list-heading">
                <h2 id="list-heading" className="sr-only">법원 목록</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rows.map(({ court, total, upcoming, latest }) => (
                        <li key={court.slug}>
                            <Link href={`/court/${court.slug}`} className="block rounded-none border border-[#161616] bg-[#FAF7EC] p-5 hover:border-[#161616] transition-all h-full">
                                <p className="text-xs font-semibold text-[#1F3D7A]">{court.kind === 'rehabilitation' ? '회생법원' : '지방법원'}</p>
                                <h3 className="mt-1 text-lg font-bold text-[#161616]">{court.name}</h3>
                                <p className="mt-2 text-sm text-[#3A3A3A]">
                                    공고 {total.toLocaleString('ko-KR')}건 · 2주 내 입찰 {upcoming}건
                                </p>
                                {latest && <p className="mt-1 text-xs text-[#6B655C]">최근 공고일 {latest}</p>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="upcoming-heading">
                <h2 id="upcoming-heading" className="text-2xl font-bold text-[#161616] mb-2">이번 주 입찰 일정</h2>
                <p className="text-sm text-[#3A3A3A] mb-4">전국 공고 중 7일 안에 입찰 회차가 있는 공고입니다.</p>
                <UpcomingTable rows={allUpcoming} />
            </section>
        </div>
    );
}
