'use client';

// 홈 '01 이번 주 입찰 일정' — 편집형 표. 자산 유형 칸으로 걸러 본다.
// 넓은 화면은 6칸 격자, 휴대폰은 한 공고가 두 줄로 접힌다.
import Link from 'next/link';
import { useState } from 'react';
import { ASSET_GROUPS, type AssetGroup } from '@/lib/assetGroups';

export interface UpcomingItem {
    id: string;
    title: string;
    court: string;
    group: AssetGroup;
    md: string; // 11.13
    dow: string; // 오늘 / 수
    dDay: number;
    round: number;
    total: number;
    price: string;
    ratio: number; // 1회차 대비 %
}

const GRID = 'md:grid md:grid-cols-[88px_96px_minmax(0,1fr)_150px_110px_84px] md:items-start md:gap-x-3';

export default function UpcomingList({ items, total }: { items: UpcomingItem[]; total: number }) {
    const [tab, setTab] = useState<'all' | AssetGroup>('all');
    const present = (Object.keys(ASSET_GROUPS) as AssetGroup[]).filter((g) => items.some((i) => i.group === g));
    const tabs: { key: 'all' | AssetGroup; label: string }[] = [{ key: 'all', label: '전체' }, ...present.map((g) => ({ key: g, label: ASSET_GROUPS[g].label }))];
    const rows = items.filter((i) => tab === 'all' || i.group === tab);

    return (
        <section id="upcoming" aria-labelledby="upcoming-title">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-3.5 border-b-2 border-[#161616]">
                <div className="flex items-baseline gap-4">
                    <span className="num text-[44px] font-bold tracking-[-0.05em] leading-none">01</span>
                    <span className="flex flex-col gap-1">
                        <h2 id="upcoming-title" className="text-[26px] font-extrabold tracking-[-0.05em]">이번 주 입찰 일정</h2>
                        <span className="text-sm text-[#3A3A3A]">첨부 공고문 회차표에서 7일 안에 입찰일이 있는 회차 <span className="num font-bold text-[#161616]">{total.toLocaleString('ko-KR')}</span>건 · 입찰일 순</span>
                    </span>
                </div>
                <div role="group" aria-label="자산 유형으로 거르기" className="flex flex-wrap">
                    {tabs.map((t, i) => {
                        const on = t.key === tab;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                aria-pressed={on}
                                onClick={() => setTab(t.key)}
                                className={`min-h-10 px-3.5 border border-[#161616] ${i > 0 ? 'border-l-0' : ''} text-sm font-bold transition-colors ${on ? 'bg-[#161616] text-[#FAF7EC]' : 'hover:bg-[#FAF7EC]'}`}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={`hidden ${GRID} py-2.5 border-b border-[#161616] text-xs font-bold tracking-[0.04em]`} aria-hidden="true">
                <span>입찰일</span><span>유형</span><span>공고 · 법원</span><span>회차</span><span className="text-right">최저입찰가</span><span className="text-right">1회차 대비</span>
            </div>

            {rows.length === 0 ? (
                <p className="py-6 text-[15px] border-b border-[#C9C2B4]">
                    {items.length === 0 ? '원문 회차표에서 7일 안의 입찰 회차를 찾지 못했습니다.' : '이 유형은 이번 주 입찰 회차가 없습니다.'}
                </p>
            ) : (
                <ul>
                    {rows.map((r) => {
                        const g = ASSET_GROUPS[r.group];
                        const urgent = r.dDay <= 1;
                        return (
                            <li key={`${r.id}-${r.round}`} className="border-b border-[#C9C2B4]">
                                <Link href={`/notice/${r.id}`} className={`${GRID} flex flex-wrap items-baseline gap-x-3 gap-y-1.5 py-3.5 hover:bg-[#161616]/[0.04] transition-colors`}>
                                    <span className="whitespace-nowrap">
                                        <span className="num text-lg font-bold tracking-[-0.03em]">{r.md}</span>
                                        <span className="ml-1.5 md:ml-0 md:mt-0.5 md:block">
                                            <span className={`text-xs font-bold ${urgent ? 'soft-blink inline-block bg-[#161616] text-[#FAF7EC] px-1.5 py-px' : ''}`}>{r.dow}</span>
                                        </span>
                                    </span>
                                    <span className="md:pt-1">
                                        <span className="inline-block text-xs font-bold px-1.5 py-0.5 border border-[#161616] whitespace-nowrap" style={{ background: g.bg }}>{g.label}</span>
                                    </span>
                                    <span className="basis-full md:basis-auto min-w-0">
                                        <span className="block font-bold leading-snug">{r.title}</span>
                                        <span className="block mt-0.5 text-[13px] text-[#3A3A3A]">{r.court}</span>
                                    </span>
                                    <span className="md:pt-1" aria-label={`${r.total}회차 중 ${r.round}회차`}>
                                        <span className="flex gap-0.5" aria-hidden="true">
                                            {Array.from({ length: r.total }, (_, i) => (
                                                <span
                                                    key={i}
                                                    className={`w-2.5 h-2.5 border border-[#161616] ${i === r.round - 1 ? 'bg-[#161616]' : i < r.round - 1 ? 'bg-[#A39E93]' : ''}`}
                                                />
                                            ))}
                                        </span>
                                        <span className="num block mt-1 text-xs font-semibold">{r.round}/{r.total}회차</span>
                                    </span>
                                    <span className="num ml-auto md:ml-0 text-right text-base font-extrabold whitespace-nowrap">{r.price}</span>
                                    <span className="num text-right text-[15px] font-semibold whitespace-nowrap">{r.ratio}%</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}

            <p className="pt-3 flex flex-wrap justify-between gap-2 text-[13px]">
                <span>앞 회차에서 낙찰되면 다음 회차는 열리지 않습니다. 진행 여부는 관재인 사무실에 확인하세요.</span>
                <Link href="/court" className="font-bold underline underline-offset-[3px]">법원별로 모두 보기 →</Link>
            </p>
        </section>
    );
}
