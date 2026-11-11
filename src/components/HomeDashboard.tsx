// 홈 기본 화면 — 편집형 시안(2026-11-10, Editorial.dc.html)을 실제 데이터로 옮긴 것.
// 수치는 모두 noticeIndex(최근 180일 공고, 6시간 캐시)에서 계산한다. 목록·숫자의 날짜 기준은 법원 게시판의
// 작성일·공고만료일이다(2026-11-11). 원문 회차표는 '앞 회차 유찰 시' 조건이 붙은 참고 정보로만 쓴다.
// 모션: 상단 만료 티커, 숫자 올라가기, 회차 막대 자라기, 구역 떠오르기 — '동작 줄이기' 설정이면 모두 꺼진다(globals.css).
import Link from 'next/link';
import UpcomingList from '@/components/UpcomingList';
import { formatPhone } from '@/components/NoticeBoardRows';
import { toBoardItems } from '@/lib/noticeBoard';
import { CountUp, Reveal } from '@/components/Motion';
import { shortWon } from '@/components/NoticeIndexViews';
import { categories } from '@/data/categories';
import { courts as COURT_LIST, getCourtByName, type CourtInfo } from '@/data/courts';
import { ASSET_GROUPS, assetGroupOf, type AssetGroup } from '@/lib/assetGroups';
import { INDEX_DAYS, expiringBoard, getNoticeIndex, groupStats, isActive, recentBoard, todayKst, upcomingRounds, withText, type UpcomingRound } from '@/lib/noticeIndex';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const dowOf = (iso: string) => DOW[new Date(`${iso}T12:00:00+09:00`).getUTCDay()];
const md = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;

// 화면용 묶음 → 카테고리 페이지(categories.ts) 대응
const TYPE_ORDER: { group: AssetGroup; slug: string; name: string }[] = [
    { group: 'real', slug: 'real-estate', name: '부동산' },
    { group: 'asset', slug: 'equipment', name: '기계설비·유체동산' },
    { group: 'bond', slug: 'bonds', name: '채권·주식' },
    { group: 'car', slug: 'vehicle', name: '차량·동산' },
    { group: 'patent', slug: 'ip', name: '특허·상표' },
];

// 계산기 예시값 — 취득세 1,650만 원·입찰가 상한 2억 5,803만 원은 각 계산기로 확인한 결과(2026-11-10),
// 손익 계산기 예시는 입력값을 단순 산술한 값이다.
const TOOLS = [
    { href: '/tools/acquisition-tax', no: 'p.01', kicker: '세금', name: '취득세 계산기', desc: '다주택 중과, 조정대상지역, 경차 감면까지 반영합니다.', exIn: '무주택 · 7억 5천만 원 아파트(84㎡)', exOut: '1,650만 원', bg: '#D7E7DF' },
    { href: '/tools/bid-calculator', no: 'p.02', kicker: '입찰가', name: '입찰가 계산기', desc: '목표 이익률로 써낼 수 있는 입찰가 상한을 거꾸로 계산합니다.', exIn: '매도가 3억 원 · 목표 이익률 15%', exOut: '2억 5,803만 원', bg: '#F0EA9C' },
    { href: '/tools/vehicle-transfer', no: 'p.03', kicker: '차량', name: '차량 이전비 계산기', desc: '취득세, 공채, 등록 비용을 한 번에 합산합니다.', exIn: '비영업용 승용차 · 낙찰가 2천만 원', exOut: '취득세 140만 원', bg: '#D9D2EF' },
    { href: '/tools/roi-calculator', no: 'p.04', kicker: '손익', name: '매도·임대 손익 계산기', desc: '총비용 대비 차익과 임대 수익률을 계산합니다.', exIn: '총비용 3억 1,380만 원 · 매도가 3억 6천만 원', exOut: '차익 4,620만 원', bg: '#F7F3E6' },
];

/**
 * 주목할 공고: 2주 안에 입찰 회차가 있고 회차가 3개 이상인 공고 중
 * 부동산 → 1회차의 70% 이하로 내려간 공고 → 1회차 최저가가 큰 공고 순으로 고른다.
 */
function pickFeatured(rows: UpcomingRound[]): UpcomingRound | null {
    const withRounds = rows.filter((r) => r.totalRounds >= 3 && r.round >= 2 && r.firstPrice > 0);
    const real = withRounds.filter((r) => r.notice.category === 'real_estate');
    const pool = real.length > 0 ? real : withRounds;
    const dropped = (r: UpcomingRound) => (r.price / r.firstPrice <= 0.7 ? 0 : 1);
    return [...pool].sort((a, b) => dropped(a) - dropped(b) || b.firstPrice - a.firstPrice)[0] ?? rows[0] ?? null;
}

const QUICK = [
    { href: '#upcoming', label: '이번 주 만료' },
    { href: `/?court=${encodeURIComponent('서울회생법원')}&cat=real_estate`, label: '서울회생법원 부동산' },
    { href: '/category/vehicle', label: '차량' },
    { href: '/category/bonds', label: '채권·주식' },
    { href: '/category/ip', label: '특허·상표' },
];

function SectionHead({ no, id, title, note }: { no: string; id: string; title: string; note?: string }) {
    return (
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3.5 border-b-2 border-[#161616]">
            <div className="flex items-baseline gap-4">
                <span className="num text-[44px] font-bold tracking-[-0.05em] leading-none">{no}</span>
                <h2 id={id} className="text-[26px] font-extrabold tracking-[-0.05em]">{title}</h2>
            </div>
            {note && <span className="text-[13px]">{note}</span>}
        </div>
    );
}

export default async function HomeDashboard() {
    const all = await getNoticeIndex();
    const index = withText(all); // 통계·유형 카드는 원문이 있는 공고 기준
    const today = todayKst();
    const active = all.filter((n) => isActive(n, today));
    const expiringRows = expiringBoard(all, 7, today);
    const recentRows = recentBoard(all, 7, today);
    const stats = groupStats(index);
    const featured = pickFeatured(upcomingRounds(index, 14, today));
    const since30 = new Date(Date.parse(`${today}T00:00:00Z`) - 30 * 86400000).toISOString().slice(0, 10);

    const expiringItems = toBoardItems(expiringRows.slice(0, 15), today);
    const recentItems = toBoardItems(recentRows.slice(0, 15), today);
    const tickerItems = expiringItems.slice(0, 12);

    const types = TYPE_ORDER.map((t, i) => {
        const cat = categories.find((c) => c.slug === t.slug);
        const s = groupStats(index.filter((n) => cat?.dbCategories.includes(n.category)));
        return {
            ...t,
            no: String(i + 1).padStart(2, '0'),
            count: s.total,
            first: s.medianFirstPrice ? shortWon(s.medianFirstPrice) : '-',
            step: s.medianStepRatio ? Math.round((1 - s.medianStepRatio) * 100) : null,
            last: s.medianLastRatio ? Math.round(s.medianLastRatio * 100) : null,
            bg: ASSET_GROUPS[t.group].bg,
        };
    });

    const activeByCourt = new Map<string, number>();
    for (const n of active) activeByCourt.set(n.court, (activeByCourt.get(n.court) || 0) + 1);
    const courtRows = stats.byCourt
        .map(([name, count]) => ({ court: getCourtByName(name), count, soon: activeByCourt.get(name) || 0 }))
        .filter((c): c is { court: CourtInfo; count: number; soon: number } => Boolean(c.court))
        .slice(0, 10);

    const recent = all.slice(0, 8);
    const searchCourts = COURT_LIST.filter((c) => stats.byCourt.some(([name]) => name === c.name));

    return (
        <div className="max-w-6xl mx-auto -mt-8">
            {/* 상단 정보 띠 + 입찰 티커 */}
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-2 text-xs font-medium border-b border-[#161616]">
                <span className="num">{Number(today.slice(0, 4))}년 {Number(today.slice(5, 7))}월 {Number(today.slice(8, 10))}일 {dowOf(today)}요일</span>
                <span className="num">법원 게시 중 {active.length.toLocaleString('ko-KR')}건 · 이번 주 만료 {expiringRows.length.toLocaleString('ko-KR')}건 · 이번 주 신규 {recentRows.length.toLocaleString('ko-KR')}건</span>
            </div>
            {tickerItems.length > 0 && (
                <div className="ticker flex items-stretch border-b border-[#161616] overflow-hidden" role="region" aria-label="곧 게시가 끝나는 공고 흐름">
                    <span className="shrink-0 bg-[#161616] text-[#FAF7EC] text-xs font-bold px-3 flex items-center">곧 만료</span>
                    <div className="relative flex-1 overflow-hidden">
                        <div className="ticker-track flex w-max">
                            {[0, 1].map((copy) => (
                                <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1 ? true : undefined}>
                                    {tickerItems.map((t) => (
                                        <li key={`${copy}-${t.id}`} className="shrink-0 border-r border-[#C9C2B4]">
                                            <Link href={`/notice/${t.id}`} tabIndex={copy === 1 ? -1 : undefined} className="flex items-baseline gap-2 px-4 py-2 text-[13px] whitespace-nowrap hover:bg-[#FAF7EC]">
                                                <span className="num font-bold">{md(t.expiry)} {t.daysLeft === 0 ? '오늘 만료' : `${t.daysLeft}일 남음`}</span>
                                                <span>{t.court}</span>
                                                <span className="font-semibold">{t.title}</span>
                                                {formatPhone(t.phone) && <span className="num text-[#3A3A3A]">☎ {formatPhone(t.phone)}</span>}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 첫 화면 */}
            <section aria-labelledby="hero-title" className="flex flex-wrap border-b border-[#161616]">
                <div className="flex-[999_1_520px] min-w-0 py-10 lg:pr-10 flex flex-col gap-5">
                    <span className="text-xs font-bold tracking-[0.08em]">전국 {COURT_LIST.length}개 법원 · 하루 3번 갱신{stats.latestDate ? ` · 최근 공고 ${stats.latestDate}` : ''}</span>
                    <h1 id="hero-title" className="text-[34px] sm:text-[48px] leading-[1.16] font-extrabold tracking-[-0.06em]">
                        흩어진 관재인 매각 공고,<br />회차별 최저가까지<br />한 장에 정리합니다.
                    </h1>
                    <p className="text-base leading-relaxed max-w-[520px] text-[#3A3A3A]">
                        법원마다 따로 올라오는 파산·회생 자산매각 공고를 모으고, 첨부 공고문을 읽어 회차마다 최저입찰가가 얼마까지 내려가는지 표로 옮깁니다.
                    </p>

                    <form action="/" method="get" className="flex flex-wrap border border-[#161616] bg-[#FAF7EC] mt-1">
                        <label htmlFor="home-q" className="sr-only">검색어</label>
                        <input id="home-q" name="q" type="search" placeholder="지역, 물건, 사건번호" className="flex-[999_1_220px] min-w-0 min-h-14 px-4 bg-transparent outline-none text-base placeholder:text-[#6B655C] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#161616]" />
                        <label htmlFor="home-court" className="sr-only">법원</label>
                        <select id="home-court" name="court" defaultValue="" className="flex-[1_1_140px] min-h-14 px-3 bg-transparent border-t sm:border-t-0 sm:border-l border-[#161616] text-[15px] font-semibold">
                            <option value="">전체 법원</option>
                            {searchCourts.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
                        </select>
                        <label htmlFor="home-cat" className="sr-only">자산 유형</label>
                        <select id="home-cat" name="cat" defaultValue="" className="flex-[1_1_120px] min-h-14 px-3 bg-transparent border-t sm:border-t-0 border-l border-[#161616] text-[15px] font-semibold">
                            <option value="">모든 자산</option>
                            <option value="real_estate">부동산</option>
                            <option value="asset">자산·설비</option>
                            <option value="bond">채권</option>
                            <option value="vehicle">차량</option>
                            <option value="patent">특허·상표</option>
                        </select>
                        <button type="submit" className="basis-full sm:basis-auto min-h-14 px-7 bg-[#161616] text-[#FAF7EC] text-base font-bold hover:bg-black">검색 →</button>
                    </form>
                    <p className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                        <span className="font-bold">바로 찾기</span>
                        {QUICK.map((q) => (
                            <Link key={q.label} href={q.href} className="underline underline-offset-[3px] hover:bg-[#FAF7EC]">{q.label}</Link>
                        ))}
                    </p>

                    <dl className="mt-2 grid grid-cols-2 sm:grid-cols-4 border border-[#161616] bg-[#FAF7EC]">
                        {[
                            { label: '법원 게시 중', value: active.length },
                            { label: '이번 주 만료', value: expiringRows.length },
                            { label: '이번 주 신규', value: recentRows.length },
                            { label: `원문 정리 · ${INDEX_DAYS}일`, value: stats.total },
                        ].map((s, i) => (
                            <div key={s.label} className={`px-4 py-3.5 border-[#161616] ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l' : ''}`}>
                                <dt className="text-xs font-semibold">{s.label}</dt>
                                <dd className="mt-1 text-[26px] font-bold tracking-[-0.04em]"><CountUp value={s.value} /></dd>
                            </div>
                        ))}
                    </dl>
                    <p className="text-xs leading-relaxed text-[#3A3A3A]">
                        게시 중·만료는 법원 게시판의 공고만료일 기준입니다. 낙찰 여부는 법원이 공개하지 않아 표시할 수 없습니다.
                    </p>
                </div>

                {featured && <FeaturedPanel r={featured} />}
            </section>

            <div className="flex flex-col gap-16 pt-12 pb-4">
                <Reveal><UpcomingList expiring={expiringItems} expiringTotal={expiringRows.length} recent={recentItems} recentTotal={recentRows.length} /></Reveal>

                {/* 02 자산 유형별 */}
                <Reveal as="section">
                    <SectionHead no="02" id="types-title" title="자산 유형별로 얼마나 내려가나" note={`최근 ${INDEX_DAYS}일 · 회차표가 있는 공고의 중앙값`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-l border-[#161616]" aria-labelledby="types-title">
                        {types.map((t) => (
                            <Link key={t.slug} href={`/category/${t.slug}`} className="p-4 border-r border-b border-[#161616] flex flex-col gap-3.5 hover:brightness-[0.97]" style={{ background: t.bg }}>
                                <span className="flex justify-between items-baseline">
                                    <span className="num text-xs font-bold">{t.no}</span>
                                    <span className="num text-[13px] font-semibold">{t.count.toLocaleString('ko-KR')}건</span>
                                </span>
                                <span className="text-[19px] font-extrabold tracking-[-0.04em]">{t.name}</span>
                                <span className="flex flex-col gap-0.5">
                                    <span className="text-xs font-semibold">마지막 회차는 1회차의</span>
                                    <span className="num text-[40px] font-bold tracking-[-0.05em] leading-none">{t.last !== null ? `${t.last}%` : '-'}</span>
                                </span>
                                <span className="h-2.5 border border-[#161616] bg-[#FAF7EC] block overflow-hidden" aria-hidden="true">
                                    <span className="fill-bar block h-full bg-[#161616]" style={{ width: `${t.last ?? 0}%` }} />
                                </span>
                                <dl className="flex flex-col gap-1 text-[13px] border-t border-[#161616] pt-2.5">
                                    <div className="flex justify-between"><dt>1회차 최저가</dt><dd className="num font-bold">{t.first}</dd></div>
                                    <div className="flex justify-between"><dt>회차당 인하</dt><dd className="num font-bold">{t.step !== null ? `${t.step}%` : '-'}</dd></div>
                                </dl>
                            </Link>
                        ))}
                    </div>
                </Reveal>

                {/* 03 법원별 + 최근 공고 */}
                <Reveal as="section">
                    <div className="flex flex-wrap gap-8">
                        <div className="flex-[1_1_360px] bg-[#161616] text-[#EFEBE2] px-6 pt-6 pb-5">
                            <div className="flex items-baseline gap-4 pb-3.5 border-b border-[#EFEBE2]">
                                <span className="num text-[44px] font-bold tracking-[-0.05em] leading-none">03</span>
                                <h2 className="text-2xl font-extrabold tracking-[-0.05em]">법원별 공고</h2>
                            </div>
                            <ol>
                                {courtRows.map(({ court, count, soon }, i) => (
                                    <li key={court.slug} className="border-b border-[#4A4A4A]">
                                        <Link href={`/court/${court.slug}`} className="grid grid-cols-[32px_minmax(0,1fr)_auto_auto] items-baseline gap-3 py-3 hover:bg-white/5">
                                            <span className="num text-[13px] text-[#B8B2A6]">{String(i + 1).padStart(2, '0')}</span>
                                            <span className="font-bold">{court.name}</span>
                                            <span className="num text-[13px] text-[#B8B2A6]">게시 중 {soon}</span>
                                            <span className="num font-bold min-w-10 text-right">{count.toLocaleString('ko-KR')}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                            <Link href="/court" className="inline-block mt-3.5 text-sm font-bold underline underline-offset-[3px]">전국 {COURT_LIST.length}개 법원 →</Link>
                        </div>

                        <div className="flex-[999_1_480px] min-w-0">
                            <div className="flex items-baseline justify-between gap-3 pb-3.5 border-b-2 border-[#161616]">
                                <h2 className="text-2xl font-extrabold tracking-[-0.05em]">최근 올라온 공고</h2>
                                <Link href={`/?start=${since30}`} className="text-sm font-bold underline underline-offset-[3px]">최근 30일 전체 →</Link>
                            </div>
                            <ul>
                                {recent.map((n) => {
                                    const g = ASSET_GROUPS[assetGroupOf(n.category)];
                                    const first = n.rounds && n.rounds.length >= 1 ? n.rounds[0].price : null;
                                    return (
                                        <li key={n.id} className="border-b border-[#C9C2B4]">
                                            <Link href={`/notice/${n.id}`} className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-baseline gap-3.5 py-3 hover:bg-[#161616]/[0.04]">
                                                <span><span className="inline-block text-xs font-bold px-1.5 py-0.5 border border-[#161616] whitespace-nowrap" style={{ background: g.bg }}>{g.label}</span></span>
                                                <span className="min-w-0">
                                                    <span className="block text-[15px] font-bold truncate">{n.title}</span>
                                                    <span className="block text-[13px] text-[#3A3A3A]">{n.court} · {n.date === today ? '오늘' : n.date}</span>
                                                </span>
                                                <span className="num text-[15px] font-extrabold whitespace-nowrap">{first ? shortWon(first) : ''}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </Reveal>

                {/* 04 계산기 */}
                <Reveal as="section">
                    <SectionHead no="04" id="tools-title" title="입찰 전에 계산해 볼 것" note="지방세법 세율 · 확인일 2026-11-10" />
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-labelledby="tools-title">
                        {TOOLS.map((t) => (
                            <Link key={t.href} href={t.href} className="group border border-[#161616] flex flex-col min-h-[300px] transition-transform hover:-translate-y-1" style={{ background: t.bg }}>
                                <span className="px-3.5 py-2.5 border-b border-[#161616] flex justify-between text-xs font-bold tracking-[0.04em]">
                                    <span>{t.kicker}</span><span className="num">{t.no}</span>
                                </span>
                                <span className="px-4 pt-4 flex flex-col gap-2">
                                    <span className="text-[21px] font-extrabold tracking-[-0.05em] leading-tight">{t.name}</span>
                                    <span className="text-sm leading-relaxed">{t.desc}</span>
                                </span>
                                <span className="m-4 border border-[#161616] bg-[#FAF7EC] px-3.5 py-3 flex flex-col gap-1">
                                    <span className="text-xs font-semibold">예시 · {t.exIn}</span>
                                    <span className="num text-lg font-extrabold">{t.exOut}</span>
                                </span>
                                <span className="mt-auto px-3.5 py-3 border-t border-[#161616] text-sm font-bold group-hover:bg-[#161616] group-hover:text-[#FAF7EC] transition-colors">계산하기 →</span>
                            </Link>
                        ))}
                    </div>
                </Reveal>

                <p className="text-[13px] leading-relaxed text-[#3A3A3A] border-t border-[#161616] pt-4">
                    로옥션은 법원과 제휴하지 않은 민간 서비스입니다. 공고의 효력과 현재 조건은 법원 게시물과 첨부 원문을 기준으로 하며,
                    통계는 로옥션이 수집한 공고 기준이고 낙찰 결과는 포함하지 않습니다.{' '}
                    <Link href="/editorial-policy" className="font-bold underline underline-offset-[3px]">데이터·편집 원칙</Link>
                </p>
            </div>
        </div>
    );
}

function FeaturedPanel({ r }: { r: UpcomingRound }) {
    const rounds = (r.notice.rounds || []).slice(0, 6);
    const top = rounds[0]?.price || r.firstPrice || 1;
    const g = ASSET_GROUPS[assetGroupOf(r.notice.category)];
    const pct = r.firstPrice > 0 ? Math.round((r.price / r.firstPrice) * 100) : 100;
    const headline = pct < 50 ? `${r.round}회차에 1회차의 절반 아래로` : `${r.round}회차 최저가는 1회차의 ${pct}%`;
    const label = rounds.map((x) => `${x.round}회 ${shortWon(x.price)}`).join(', ');
    return (
        <article aria-labelledby="feat-title" className="flex-[1_1_380px] min-w-0 my-8 border border-[#161616] flex flex-col" style={{ background: g.bg }}>
            <div className="px-4 py-2.5 border-b border-[#161616] flex justify-between gap-3 text-xs font-bold tracking-[0.04em]">
                <span>게시 중 · 회차표 참고</span>
                <span className="num">{r.notice.expiry ? `공고만료 ${md(r.notice.expiry)}` : ''}</span>
            </div>
            <div className="px-5 pt-5 pb-4 flex flex-col gap-2">
                <span className="text-[13px] font-semibold">{r.notice.court} · {g.label} · 공고일 {r.notice.date}</span>
                <h2 id="feat-title" className="text-[26px] leading-tight font-extrabold tracking-[-0.05em]">{headline}</h2>
                <span className="text-[15px] font-semibold">{r.notice.title}</span>
            </div>
            <div role="img" aria-label={`회차별 최저입찰가: ${label}`} className="mx-5 border-y border-[#161616] pt-4 pb-2.5 h-[150px] grid gap-3 items-end" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
                {rounds.map((x, i) => {
                    const cur = x.round === r.round;
                    const past = x.round < r.round;
                    return (
                        <div key={x.round} className="flex flex-col justify-end gap-1.5 h-full">
                            <span className={`num text-[13px] ${cur ? 'font-extrabold' : 'font-semibold'}`}>{shortWon(x.price).replace(' 원', '')}</span>
                            <span
                                className="bar-grow block border border-[#161616]"
                                style={{
                                    height: `${Math.max(6, Math.round((x.price / top) * 76))}px`,
                                    animationDelay: `${0.15 + i * 0.12}s`,
                                    background: cur ? '#161616' : past ? 'repeating-linear-gradient(135deg, transparent 0 4px, rgba(22,22,22,0.35) 4px 5px)' : '#FAF7EC',
                                }}
                            />
                            <span className="num text-xs font-semibold">{x.round}회{x.date ? ` · ${md(x.date)}` : ''}</span>
                        </div>
                    );
                })}
            </div>
            <dl className="px-5 py-3.5 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                <dt className="font-semibold">{r.round}회차 최저가</dt>
                <dd className="num font-extrabold">{r.price.toLocaleString('ko-KR')}원 (1회차의 {pct}%)</dd>
                <dt className="font-semibold">회차</dt>
                <dd className="num">전체 {r.totalRounds}회 중 {r.round}회차 · {md(r.date)} {dowOf(r.date)}{r.round > 1 ? ' (앞 회차 유찰 시)' : ''}</dd>
                {formatPhone(r.notice.phone) && (
                    <>
                        <dt className="font-semibold">진행 문의</dt>
                        <dd className="num"><a href={`tel:${(r.notice.phone || '').replace(/\D/g, '')}`} className="underline underline-offset-[3px]">{formatPhone(r.notice.phone)}</a> (관재인 사무실)</dd>
                    </>
                )}
                <dt className="font-semibold">확인할 것</dt>
                <dd>입찰보증금·제출 방법·비용 부담은 공고 원문 기준</dd>
            </dl>
            <div className="mt-auto flex border-t border-[#161616]">
                <Link href={`/notice/${r.notice.id}`} className="flex-1 px-4 py-3.5 text-[15px] font-bold bg-[#161616] text-[#FAF7EC] hover:bg-black">공고 원문 보기 →</Link>
                <Link href="/tools/acquisition-tax" className="flex-1 px-4 py-3.5 text-[15px] font-bold border-l border-[#161616] hover:bg-[#FAF7EC]">취득세 계산 →</Link>
            </div>
        </article>
    );
}

