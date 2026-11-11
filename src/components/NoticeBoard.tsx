'use client';

// 정렬·탭·더보기가 되는 공고 목록 — 홈·법원별·자산 유형별 페이지 공용.
// 서버가 넘긴 BoardItem 배열을 브라우저에서 정렬한다(추가 요청 없음).
import { useMemo, useState } from 'react';
import NoticeBoardRows, { type BoardItem } from '@/components/NoticeBoardRows';

export type SortKey = 'posted' | 'expiry' | 'expiryLate' | 'price' | 'drop';

const SORTS: { key: SortKey; label: string }[] = [
    { key: 'posted', label: '최신 게시순' },
    { key: 'expiryLate', label: '만료 여유순' },
    { key: 'expiry', label: '만료 임박순' },
    { key: 'price', label: '최저가 낮은순' },
    { key: 'drop', label: '1회차 대비 많이 내린순' },
];

export interface BoardView {
    key: string;
    label: string;
    heading: string;
    sub: string;
    items: BoardItem[];
    empty: string;
}

function sortItems(items: BoardItem[], key: SortKey): BoardItem[] {
    const byPosted = (a: BoardItem, b: BoardItem) => b.posted.localeCompare(a.posted) || a.expiry.localeCompare(b.expiry);
    const s = [...items];
    switch (key) {
        case 'expiry':
            return s.sort((a, b) => a.expiry.localeCompare(b.expiry) || byPosted(a, b));
        case 'expiryLate':
            return s.sort((a, b) => b.expiry.localeCompare(a.expiry) || byPosted(a, b));
        case 'price': // 회차표가 없는 공고는 뒤로
            return s.sort((a, b) => (a.round?.priceValue ?? Infinity) - (b.round?.priceValue ?? Infinity) || byPosted(a, b));
        case 'drop':
            return s.sort((a, b) => (a.round?.ratio ?? Infinity) - (b.round?.ratio ?? Infinity) || byPosted(a, b));
        default:
            return s.sort(byPosted);
    }
}

export default function NoticeBoard({
    views,
    defaultSort = 'posted',
    pageSize = 20,
    showCourt = true,
    headingNo,
    headingId,
}: {
    views: BoardView[];
    defaultSort?: SortKey;
    pageSize?: number;
    showCourt?: boolean;
    headingNo?: string;
    headingId: string;
}) {
    const [viewKey, setViewKey] = useState(views[0]?.key);
    const [sort, setSort] = useState<SortKey>(defaultSort);
    const [limit, setLimit] = useState(pageSize);
    const view = views.find((v) => v.key === viewKey) ?? views[0];
    const sorted = useMemo(() => sortItems(view?.items ?? [], sort), [view, sort]);
    const shown = sorted.slice(0, limit);

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4 pb-3.5 border-b-2 border-[#161616]">
                <div className="flex items-baseline gap-4">
                    {headingNo && <span className="num text-[44px] font-bold tracking-[-0.05em] leading-none">{headingNo}</span>}
                    <span className="flex flex-col gap-1">
                        <h2 id={headingId} className="text-[26px] font-extrabold tracking-[-0.05em]">
                            {view?.heading} <span className="num">{(view?.items.length ?? 0).toLocaleString('ko-KR')}</span>건
                        </h2>
                        <span className="text-sm text-[#3A3A3A]">{view?.sub}</span>
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {views.length > 1 && (
                        <div role="group" aria-label="목록 기준" className="flex flex-wrap">
                            {views.map((v, i) => {
                                const on = v.key === view?.key;
                                return (
                                    <button
                                        key={v.key}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => { setViewKey(v.key); setLimit(pageSize); }}
                                        className={`min-h-10 px-3.5 border border-[#161616] ${i > 0 ? 'border-l-0' : ''} text-sm font-bold transition-colors ${on ? 'bg-[#161616] text-[#FAF7EC]' : 'hover:bg-[#FAF7EC]'}`}
                                    >
                                        {v.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <label className="flex items-center gap-2 text-sm font-bold">
                        <span className="sr-only sm:not-sr-only">정렬</span>
                        <select
                            value={sort}
                            onChange={(e) => { setSort(e.target.value as SortKey); setLimit(pageSize); }}
                            className="min-h-10 border border-[#161616] bg-[#FAF7EC] px-2.5 text-sm font-bold"
                        >
                            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                    </label>
                </div>
            </div>

            <NoticeBoardRows
                items={shown}
                mode={sort === 'expiry' || sort === 'expiryLate' ? 'expiry' : 'new'}
                showCourt={showCourt}
                empty={view?.empty}
            />

            {sorted.length > limit && (
                <button
                    type="button"
                    onClick={() => setLimit((n) => n + pageSize)}
                    className="mt-4 w-full min-h-12 border border-[#161616] bg-[#FAF7EC] text-sm font-bold hover:bg-[#161616] hover:text-[#FAF7EC]"
                >
                    {Math.min(pageSize, sorted.length - limit)}건 더 보기 <span className="num font-normal">({limit.toLocaleString('ko-KR')} / {sorted.length.toLocaleString('ko-KR')})</span>
                </button>
            )}
        </div>
    );
}
