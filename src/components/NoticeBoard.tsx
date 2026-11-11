'use client';

// 정렬·탭·페이지 넘김이 되는 공고 목록 — 홈·법원별·자산 유형별 페이지 공용.
// 서버가 넘긴 BoardItem 배열을 브라우저에서 정렬한다(추가 요청 없음).
import { useMemo, useRef, useState } from 'react';
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
    const [page, setPage] = useState(1);
    const topRef = useRef<HTMLDivElement>(null);
    const view = views.find((v) => v.key === viewKey) ?? views[0];
    const sorted = useMemo(() => sortItems(view?.items ?? [], sort), [view, sort]);
    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const current = Math.min(page, pageCount);
    const shown = sorted.slice((current - 1) * pageSize, current * pageSize);

    const goTo = (n: number) => {
        setPage(Math.min(pageCount, Math.max(1, n)));
        // 페이지를 넘기면 목록 맨 위로 올려 준다(고정 헤더 높이만큼 여유).
        const el = topRef.current;
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
    };

    // 현재 페이지 앞뒤 2쪽 + 처음·끝. 건너뛴 구간은 … 로 표시한다.
    const pages: (number | 'gap')[] = [];
    for (let n = 1; n <= pageCount; n++) {
        const near = n === 1 || n === pageCount || Math.abs(n - current) <= 2;
        // 한 쪽만 건너뛰게 되는 자리(예: 1 2 3 … 5)는 … 대신 그 쪽 번호를 보여 준다.
        const lonely = (n === 2 && current - 2 === 3) || (n === pageCount - 1 && current + 2 === pageCount - 2);
        if (near || lonely) pages.push(n);
        else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
    }

    return (
        <div ref={topRef}>
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
                                        onClick={() => { setViewKey(v.key); setPage(1); }}
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
                            onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
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

            {pageCount > 1 && (
                <nav aria-label="공고 목록 페이지" className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="num text-sm text-[#3A3A3A]">
                        {((current - 1) * pageSize + 1).toLocaleString('ko-KR')}–{Math.min(current * pageSize, sorted.length).toLocaleString('ko-KR')} / 전체 {sorted.length.toLocaleString('ko-KR')}건
                    </span>
                    <ul className="flex flex-wrap">
                        <li>
                            <button
                                type="button"
                                onClick={() => goTo(current - 1)}
                                disabled={current === 1}
                                className="min-w-11 min-h-11 px-3 border border-[#161616] text-sm font-bold bg-[#FAF7EC] hover:bg-[#161616] hover:text-[#FAF7EC] disabled:opacity-40 disabled:hover:bg-[#FAF7EC] disabled:hover:text-[#161616]"
                            >
                                이전
                            </button>
                        </li>
                        {pages.map((n, i) => (
                            <li key={n === 'gap' ? `gap-${i}` : n}>
                                {n === 'gap' ? (
                                    <span className="num inline-flex items-center justify-center min-w-9 min-h-11 border-y border-r border-[#161616] text-sm" aria-hidden="true">…</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => goTo(n)}
                                        aria-current={n === current ? 'page' : undefined}
                                        aria-label={`${n}쪽`}
                                        className={`num min-w-11 min-h-11 px-2 border-y border-r border-[#161616] text-sm font-bold ${n === current ? 'bg-[#161616] text-[#FAF7EC]' : 'bg-[#FAF7EC] hover:bg-[#E9E4D8]'}`}
                                    >
                                        {n}
                                    </button>
                                )}
                            </li>
                        ))}
                        <li>
                            <button
                                type="button"
                                onClick={() => goTo(current + 1)}
                                disabled={current === pageCount}
                                className="min-w-11 min-h-11 px-3 border-y border-r border-[#161616] text-sm font-bold bg-[#FAF7EC] hover:bg-[#161616] hover:text-[#FAF7EC] disabled:opacity-40 disabled:hover:bg-[#FAF7EC] disabled:hover:text-[#161616]"
                            >
                                다음
                            </button>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    );
}
