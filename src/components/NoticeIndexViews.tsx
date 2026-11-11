// 공고 색인(noticeIndex) 기반 목록 표 — 홈·법원별·자산 유형별 페이지 공용.
import Link from 'next/link';
import { categoryLabel } from '@/lib/categoryLabels';
import type { GroupStats, IndexedNotice } from '@/lib/noticeIndex';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export function shortWon(n: number): string {
    if (n >= 100_000_000) {
        const eok = n / 100_000_000;
        return `${eok >= 10 ? Math.round(eok).toLocaleString('ko-KR') : eok.toFixed(1).replace(/\.0$/, '')}억 원`;
    }
    if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만 원`;
    return won(n);
}

export function RecentNoticeList({ notices, showCourt = true, showCategory = true }: { notices: IndexedNotice[]; showCourt?: boolean; showCategory?: boolean }) {
    if (notices.length === 0) {
        return <p className="rounded-none border border-[#161616] bg-[#FAF7EC] p-6 text-sm text-[#3A3A3A]">공고가 아직 없습니다.</p>;
    }
    return (
        <ul className="divide-y divide-[#C9C2B4] rounded-none border border-[#161616] bg-[#FAF7EC]">
            {notices.map((n) => (
                <li key={n.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="text-xs text-[#57534E] whitespace-nowrap sm:w-20">{n.date}</span>
                    <Link href={`/notice/${n.id}`} className="flex-1 font-medium text-[#161616] hover:text-[#1F3D7A] hover:underline">{n.title}</Link>
                    <span className="text-xs text-[#57534E] whitespace-nowrap">
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
                <div key={item.label} className="rounded-none border border-[#161616] bg-[#FAF7EC] p-4">
                    <dt className="text-xs text-[#57534E]">{item.label}</dt>
                    <dd className="mt-1 text-xl font-bold text-[#161616]">{item.value}</dd>
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
                            <Link href={href} className="inline-block rounded-none border border-[#161616] bg-[#FAF7EC] px-3 py-1.5 text-sm text-[#2E2B27] hover:border-[#161616] hover:text-[#1F3D7A]">{label}</Link>
                        ) : (
                            <span className="inline-block rounded-none border border-[#161616] bg-[#F4F0E6] px-3 py-1.5 text-sm text-[#3A3A3A]">{label}</span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
