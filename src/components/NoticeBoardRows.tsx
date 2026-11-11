// 공고만료일 기준 공고 목록 행 — 홈(탭 목록)·법원별·자산 유형별 페이지 공용.
// 'use client' 없이도 쓰이도록 순수 표시 컴포넌트로 둔다(서버·클라이언트 양쪽에서 import).
// 날짜 기준은 법원 게시판의 작성일·공고만료일이고, 원문 회차표는 '앞 회차 유찰 시' 조건이 붙은 참고 정보다.
import Link from 'next/link';
import { ASSET_GROUPS, assetGroupOf } from '@/lib/assetGroups';

export interface BoardItem {
    id: string;
    title: string;
    court: string;
    category: string;
    posted: string; // YYYY-MM-DD
    expiry: string; // YYYY-MM-DD
    phone: string | null;
    daysLeft: number;
    daysSincePosted: number;
    life: number;
    gone: number;
    hasText: boolean;
    round: null | { round: number; total: number; date: string; price: string; ratio: number };
    roundsPassed: boolean; // 회차표는 있지만 날짜가 모두 지났다
}

export const mdOf = (iso: string) => `${Number(iso.slice(5, 7))}.${Number(iso.slice(8, 10))}`;

/** 0318755702 → 031-875-5702 */
export function formatPhone(raw: string | null): string | null {
    if (!raw) return null;
    const d = raw.replace(/\D/g, '');
    if (d.length < 9) return raw;
    if (d.startsWith('02')) return d.length === 9 ? `02-${d.slice(2, 5)}-${d.slice(5)}` : `02-${d.slice(2, 6)}-${d.slice(6)}`;
    return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

const GRID = 'md:grid md:grid-cols-[96px_minmax(0,1fr)_150px_210px_128px] md:gap-x-3 md:items-start';

export default function NoticeBoardRows({
    items,
    mode = 'expiry',
    showCourt = true,
    empty = '해당하는 공고가 없습니다.',
}: {
    items: BoardItem[];
    mode?: 'expiry' | 'new';
    showCourt?: boolean;
    empty?: string;
}) {
    return (
        <div>
            <div className={`hidden ${GRID} py-2.5 border-b border-[#161616] text-xs font-bold tracking-[0.04em]`} aria-hidden="true">
                <span>{mode === 'expiry' ? '공고만료일' : '작성일'}</span>
                <span>공고{showCourt ? ' · 법원' : ''}</span>
                <span>게시 기간</span>
                <span>원문 회차표 (참고)</span>
                <span className="text-right">진행 문의</span>
            </div>
            {items.length === 0 ? (
                <p className="py-6 text-[15px] border-b border-[#C9C2B4]">{empty}</p>
            ) : (
                <ul>
                    {items.map((r) => {
                        const g = ASSET_GROUPS[assetGroupOf(r.category)];
                        const phone = formatPhone(r.phone);
                        const urgent = mode === 'expiry' && r.daysLeft <= 1;
                        const confirmed = r.round?.round === 1;
                        return (
                            <li key={r.id} className={`${GRID} flex flex-wrap gap-x-4 gap-y-2 py-3.5 border-b border-[#C9C2B4]`}>
                                <span className="whitespace-nowrap">
                                    <span className="num text-lg font-bold tracking-[-0.03em]">{mdOf(mode === 'expiry' ? r.expiry : r.posted)}</span>
                                    <span className="ml-1.5 md:ml-0 md:mt-0.5 md:block">
                                        <span className={`inline-block text-xs font-bold px-1.5 py-px ${urgent ? 'soft-blink bg-[#161616] text-[#FAF7EC]' : 'border border-[#161616]'}`}>
                                            {mode === 'expiry'
                                                ? (r.daysLeft === 0 ? '오늘 만료' : `${r.daysLeft}일 남음`)
                                                : (r.daysSincePosted === 0 ? '오늘 게시' : `${r.daysSincePosted}일 전 게시`)}
                                        </span>
                                    </span>
                                </span>

                                <span className="basis-full md:basis-auto min-w-0">
                                    <span className="inline-block text-xs font-bold px-1.5 py-0.5 border border-[#161616]" style={{ background: g.bg }}>{g.label}</span>
                                    <Link href={`/notice/${r.id}`} className="block mt-1.5 font-bold leading-snug hover:underline underline-offset-[3px]">{r.title}</Link>
                                    {showCourt && <span className="block mt-0.5 text-[13px] text-[#3A3A3A]">{r.court}</span>}
                                </span>

                                <span className="hidden md:block">
                                    <span className="num block text-[13px]">{mdOf(r.posted)} ~ {mdOf(r.expiry)}</span>
                                    <span className="block mt-2 h-2 border border-[#161616] bg-[#FAF7EC]" aria-hidden="true">
                                        <span className="block h-full bg-[#161616]" style={{ width: `${Math.round((r.gone / r.life) * 100)}%` }} />
                                    </span>
                                    <span className="num block mt-1 text-xs text-[#3A3A3A]">게시 {r.life}일 중 {r.gone}일 지남</span>
                                </span>

                                <span className="min-w-0">
                                    {r.round ? (
                                        <>
                                            <span className="num block text-[13px] font-bold">{r.round.round}/{r.round.total}회차 · {mdOf(r.round.date)}</span>
                                            <span className="num block mt-0.5 text-base font-extrabold">
                                                {r.round.price} <span className="text-[13px] font-semibold">(1회차의 {r.round.ratio}%)</span>
                                            </span>
                                            <span className={`inline-block mt-1 text-xs font-bold px-1.5 py-px border border-[#161616] ${confirmed ? 'bg-[#D7E7DF]' : 'bg-[#F6F1C4]'}`}>
                                                {confirmed ? '확정 회차' : '앞 회차 유찰 시 진행'}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="block text-[13px] text-[#3A3A3A]">
                                            {!r.hasText ? '첨부 원문 없음 · 법원 원문 확인' : r.roundsPassed ? '원문에서 다음 회차를 찾지 못했습니다' : '원문에서 회차표를 찾지 못했습니다'}
                                        </span>
                                    )}
                                </span>

                                <span className="md:text-right">
                                    {phone ? (
                                        <a href={`tel:${phone.replace(/-/g, '')}`} className="num inline-block text-sm font-bold border border-[#161616] px-2 py-1.5 bg-[#FAF7EC] whitespace-nowrap hover:bg-[#161616] hover:text-[#FAF7EC]">
                                            ☎ {phone}
                                        </a>
                                    ) : (
                                        <span className="text-xs text-[#3A3A3A]">번호 없음</span>
                                    )}
                                    <span className="hidden md:block mt-1 text-[11px] text-[#3A3A3A]">관재인 사무실</span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
