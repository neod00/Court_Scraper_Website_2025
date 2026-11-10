import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { COURT_INDEX_MIN_NOTICES, courts, getCourtBySlug } from '@/data/courts';
import { getCategoryByDbCategory } from '@/data/categories';
import { INDEX_DAYS, getNoticeIndex, groupStats, upcomingRounds } from '@/lib/noticeIndex';
import { categoryLabel } from '@/lib/categoryLabels';
import { CountChips, RecentNoticeList, StatsCards, UpcomingTable, shortWon } from '@/components/NoticeIndexViews';

export const revalidate = 3600;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return courts.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const court = getCourtBySlug(slug);
    if (!court) return { title: '법원을 찾을 수 없습니다' };
    const list = (await getNoticeIndex()).filter((n) => n.court === court.name);
    return {
        title: `${court.name} 회생·파산 자산매각 공고`,
        description: `${court.name}에 게시된 파산관재인·회생 관리인의 자산매각 공고 ${list.length}건(최근 ${INDEX_DAYS}일)을 모았습니다. 2주 안에 입찰일이 있는 회차, 자산 유형별 건수, 회차별 최저가 변화를 원문 기준으로 보여줍니다.`,
        alternates: { canonical: `/court/${court.slug}` },
        robots: { index: list.length >= COURT_INDEX_MIN_NOTICES, follow: true },
    };
}

export default async function CourtPage({ params }: PageProps) {
    const { slug } = await params;
    const court = getCourtBySlug(slug);
    if (!court) notFound();

    const index = await getNoticeIndex();
    const list = index.filter((n) => n.court === court.name);
    const stats = groupStats(list);
    const upcoming = upcomingRounds(list, 14).slice(0, 20);
    const recent = list.slice(0, 30);
    const topCategory = stats.byCategory[0];

    // 같은 법원 공고 중 1회차 최저가가 가장 높은/낮은 공고(회차표가 있는 것만)
    const withRounds = list.filter((n) => n.rounds && n.rounds.length >= 2);
    const priciest = [...withRounds].sort((a, b) => b.rounds![0].price - a.rounds![0].price)[0];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-[#57534E] mb-8" aria-label="breadcrumb">
                <Link href="/" className="hover:text-[#1F3D7A]">홈</Link>
                <span>/</span>
                <Link href="/court" className="hover:text-[#1F3D7A]">법원별 공고</Link>
                <span>/</span>
                <span className="text-[#161616] font-medium">{court.name}</span>
            </nav>

            <header className="mb-8">
                <p className="text-sm font-semibold text-[#1F3D7A] mb-2">{court.kind === 'rehabilitation' ? '회생·파산 전문법원' : '지방법원 파산·회생 사건'}</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161616]">{court.name} 자산매각 공고</h1>
                <p className="mt-4 text-[#2E2B27] leading-relaxed max-w-3xl">
                    {court.kind === 'rehabilitation'
                        ? `${court.name}은 회생·파산 사건을 전담하는 법원입니다. 이 법원의 파산관재인과 회생 관리인이 부동산, 차량, 채권, 설비 같은 재산을 팔 때 법원 홈페이지에 매각 공고를 올립니다.`
                        : `${court.name}의 파산·회생 사건에서 파산관재인과 회생 관리인이 재산을 팔 때 올린 매각 공고입니다. 회생법원이 없는 지역의 회생·파산 사건은 지방법원이 맡습니다.`}
                    {' '}로옥션은 이 공고의 첨부 공고문을 읽어 회차별 최저입찰가와 입찰일을 정리합니다.
                </p>
            </header>

            <section className="mb-10" aria-labelledby="stats-heading">
                <h2 id="stats-heading" className="text-2xl font-bold text-[#161616] mb-4">최근 {INDEX_DAYS}일 현황</h2>
                <StatsCards stats={stats} days={INDEX_DAYS} />
                {stats.total > 0 && (
                    <p className="mt-3 text-sm text-[#3A3A3A] leading-relaxed">
                        {topCategory && `가장 많은 자산 유형은 ${categoryLabel(topCategory[0])}(${topCategory[1]}건)입니다. `}
                        {stats.medianLastRatio && `회차표가 있는 공고는 마지막 회차 최저가가 1회차의 ${Math.round(stats.medianLastRatio * 100)}% 수준(중앙값)까지 내려갑니다. `}
                        {priciest && `1회차 최저가가 가장 높은 공고는 ${shortWon(priciest.rounds![0].price)}입니다.`}
                    </p>
                )}
                {stats.byCategory.length > 0 && (
                    <div className="mt-5">
                        <h3 className="text-sm font-semibold text-[#2E2B27] mb-2">자산 유형별 공고 수</h3>
                        <CountChips
                            items={stats.byCategory}
                            labelOf={categoryLabel}
                            hrefOf={(cat) => {
                                const info = getCategoryByDbCategory(cat);
                                return info ? `/category/${info.slug}` : null;
                            }}
                        />
                    </div>
                )}
            </section>

            <section className="mb-10" aria-labelledby="upcoming-heading">
                <h2 id="upcoming-heading" className="text-2xl font-bold text-[#161616] mb-2">2주 안에 입찰일이 있는 공고</h2>
                <p className="text-sm text-[#3A3A3A] mb-4">원문 회차표에서 오늘 이후 가장 가까운 회차를 골랐습니다. 앞 회차에서 낙찰되면 뒤 회차는 열리지 않으니 관재인 사무실에 진행 여부를 확인하세요.</p>
                <UpcomingTable rows={upcoming} showCourt={false} />
            </section>

            <section className="mb-10" aria-labelledby="recent-heading">
                <h2 id="recent-heading" className="text-2xl font-bold text-[#161616] mb-4">최근 공고</h2>
                <RecentNoticeList notices={recent} showCourt={false} />
                <p className="mt-3 text-sm text-[#57534E]">
                    최근 공고 30건만 보여줍니다. 기간과 키워드로 찾으려면 <Link href="/" className="text-[#1F3D7A] underline">공고 검색</Link>을 쓰세요.
                </p>
            </section>

            <section className="mb-10 rounded-none border border-[#161616] bg-[#F4F0E6] p-6 text-sm text-[#2E2B27] leading-relaxed" aria-labelledby="howto-heading">
                <h2 id="howto-heading" className="text-base font-bold text-[#161616] mb-3">이 법원 공고를 볼 때 확인할 것</h2>
                <ul className="space-y-1.5">
                    <li>• 관재인 매각은 민사집행법 경매와 달리 인도명령이 없으므로 점유자가 있으면 인도 방법을 따로 확인해야 합니다.</li>
                    <li>• 입찰서 제출 방법(방문·우편·이메일)과 입찰보증금 비율은 공고마다 다릅니다.</li>
                    <li>• 매매계약은 법원 허가를 받아야 효력이 생기는 경우가 많습니다.</li>
                    <li>• 세금과 이전 비용은 <Link href="/tools/acquisition-tax" className="text-[#1F3D7A] underline">취득세 계산기</Link>와 <Link href="/tools/bid-calculator" className="text-[#1F3D7A] underline">입찰가 계산기</Link>로 미리 계산해 볼 수 있습니다.</li>
                </ul>
            </section>

            <section aria-labelledby="other-heading">
                <h2 id="other-heading" className="text-xl font-bold text-[#161616] mb-4">다른 법원</h2>
                <ul className="flex flex-wrap gap-2">
                    {courts.filter((c) => c.slug !== court.slug).map((c) => (
                        <li key={c.slug}>
                            <Link href={`/court/${c.slug}`} className="inline-block rounded-none border border-[#161616] bg-[#FAF7EC] px-3 py-1.5 text-sm text-[#2E2B27] hover:border-[#161616] hover:text-[#1F3D7A]">{c.name}</Link>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
