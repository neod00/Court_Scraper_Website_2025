// 공고 색인(noticeIndex) 기반 목록 표 — 홈·법원별·자산 유형별 페이지 공용.
import Link from 'next/link';
import { categoryLabel } from '@/lib/categoryLabels';
import { getCourtByName } from '@/data/courts';
import type { GroupStats, IndexedNotice, UpcomingRound } from '@/lib/noticeIndex';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export function shortWon(n: number): string {
    if (n >= 100_000_000) {
        const eok = n / 100_000_000;
        return `${eok >= 10 ? Math.round(eok).toLocaleString('ko-KR') : eok.toFixed(1).replace(/\.0$/, '')}억 원`;
    }
    if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만 원`;
    return won(n);
}

function CourtLink({ name }: { name: string }) {
    const court = getCourtByName(name);
    if (!court) return <span>{name || '-'}</span>;
    return <Link href={`/court/${court.slug}`} className="hover:text-indigo-700 hover:underline">{name}</Link>;
}

export function UpcomingTable({ rows, showCourt = true, showCategory = true }: { rows: UpcomingRound[]; showCourt?: boolean; showCategory?: boolean }) {
    if (rows.length === 0) {
        return <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">앞으로 2주 안에 입찰 회차가 원문 표에서 확인된 공고가 없습니다.</p>;
    }
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                    <tr>
                        <th scope="col" className="text-left px-3 py-3 font-medium whitespace-nowrap">입찰일</th>
                        <th scope="col" className="text-left px-3 py-3 font-medium">공고</th>
                        {showCourt && <th scope="col" className="text-left px-3 py-3 font-medium hidden md:table-cell">법원</th>}
                        <th scope="col" className="text-right px-3 py-3 font-medium whitespace-nowrap">회차 최저가</th>
                        <th scope="col" className="text-right px-3 py-3 font-medium whitespace-nowrap hidden sm:table-cell">1회차 대비</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={`${r.notice.id}-${r.round}`} className="border-t border-gray-100 align-top">
                            <td className="px-3 py-3 whitespace-nowrap">
                                <span className="font-semibold text-gray-900">{r.date.slice(5).replace('-', '.')}</span>
                                <span className={`ml-1.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-bold ${r.dDay <= 3 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {r.dDay === 0 ? '오늘' : `D-${r.dDay}`}
                                </span>
                            </td>
                            <td className="px-3 py-3">
                                <Link href={`/notice/${r.notice.id}`} className="font-medium text-gray-900 hover:text-indigo-700 hover:underline">{r.notice.title}</Link>
                                <span className="block text-xs text-gray-500 mt-0.5">
                                    {showCategory && `${categoryLabel(r.notice.category)} · `}{r.round}/{r.totalRounds}회차
                                    {showCourt && <span className="md:hidden"> · {r.notice.court}</span>}
                                </span>
                            </td>
                            {showCourt && <td className="px-3 py-3 text-gray-700 whitespace-nowrap hidden md:table-cell"><CourtLink name={r.notice.court} /></td>}
                            <td className="px-3 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{shortWon(r.price)}</td>
                            <td className="px-3 py-3 text-right text-gray-600 whitespace-nowrap hidden sm:table-cell">
                                {r.firstPrice > 0 ? `${Math.round((r.price / r.firstPrice) * 100)}%` : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function RecentNoticeList({ notices, showCourt = true, showCategory = true }: { notices: IndexedNotice[]; showCourt?: boolean; showCategory?: boolean }) {
    if (notices.length === 0) {
        return <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">원문이 확인된 공고가 아직 없습니다.</p>;
    }
    return (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {notices.map((n) => (
                <li key={n.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-xs text-gray-500 whitespace-nowrap sm:w-20">{n.date}</span>
                    <Link href={`/notice/${n.id}`} className="flex-1 font-medium text-gray-900 hover:text-indigo-700 hover:underline">{n.title}</Link>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                        {showCategory && categoryLabel(n.category)}
                        {showCategory && showCourt && ' · '}
                        {showCourt && n.court}
                        {n.rounds && n.rounds.length >= 2 && ` · 1회차 ${shortWon(n.rounds[0].price)}`}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/** 집계 요약 카드 4개. 회차 통계는 원문에서 회차표를 찾은 공고만으로 계산한다. */
export function StatsCards({ stats, days }: { stats: GroupStats; days: number }) {
    const items = [
        { label: `최근 ${days}일 원문 공고`, value: `${stats.total.toLocaleString('ko-KR')}건` },
        { label: '회차표가 있는 공고', value: `${stats.withRounds.toLocaleString('ko-KR')}건` },
        { label: '1회차 최저가 중앙값', value: stats.medianFirstPrice ? shortWon(stats.medianFirstPrice) : '-' },
        {
            label: '회차당 최저가 변화(중앙값)',
            value: stats.medianStepRatio ? `${Math.round((1 - stats.medianStepRatio) * 100)}% 인하` : '-',
        },
    ];
    return (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {items.map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
                    <dt className="text-xs text-gray-500">{item.label}</dt>
                    <dd className="mt-1 text-xl font-bold text-gray-900">{item.value}</dd>
                </div>
            ))}
        </dl>
    );
}

export function CountChips({ items, hrefOf, labelOf }: { items: [string, number][]; hrefOf?: (key: string) => string | null; labelOf?: (key: string) => string }) {
    return (
        <ul className="flex flex-wrap gap-2">
            {items.map(([key, count]) => {
                const href = hrefOf?.(key) ?? null;
                const label = `${labelOf ? labelOf(key) : key} ${count.toLocaleString('ko-KR')}`;
                return (
                    <li key={key}>
                        {href ? (
                            <Link href={href} className="inline-block rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-700">{label}</Link>
                        ) : (
                            <span className="inline-block rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600">{label}</span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
