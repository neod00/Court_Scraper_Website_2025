'use client';

// 홈 '01' 목록 — 법원 게시판 공고만료일·작성일 기준. 탭으로 '이번 주 만료'와 '새로 올라온 공고'를 바꿔 본다.
import Link from 'next/link';
import { useState } from 'react';
import NoticeBoardRows, { type BoardItem } from '@/components/NoticeBoardRows';

export default function UpcomingList({
    expiring,
    expiringTotal,
    recent,
    recentTotal,
}: {
    expiring: BoardItem[];
    expiringTotal: number;
    recent: BoardItem[];
    recentTotal: number;
}) {
    const [tab, setTab] = useState<'expiry' | 'new'>('expiry');
    const tabs = [
        { key: 'expiry' as const, label: '이번 주 만료' },
        { key: 'new' as const, label: '새로 올라온 공고' },
    ];
    const isExpiry = tab === 'expiry';

    return (
        <section id="upcoming" aria-labelledby="upcoming-title">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-3.5 border-b-2 border-[#161616]">
                <div className="flex items-baseline gap-4">
                    <span className="num text-[44px] font-bold tracking-[-0.05em] leading-none">01</span>
                    <span className="flex flex-col gap-1">
                        <h2 id="upcoming-title" className="text-[26px] font-extrabold tracking-[-0.05em]">
                            {isExpiry ? '이번 주 게시가 끝나는 공고' : '새로 올라온 공고'}
                        </h2>
                        <span className="text-sm text-[#3A3A3A]">
                            {isExpiry
                                ? <>법원 게시판의 공고만료일이 7일 안인 공고 <span className="num font-bold text-[#161616]">{expiringTotal.toLocaleString('ko-KR')}</span>건 · 만료일 순</>
                                : <>법원 게시판 작성일이 최근 7일인 공고 <span className="num font-bold text-[#161616]">{recentTotal.toLocaleString('ko-KR')}</span>건 · 최신 순</>}
                        </span>
                    </span>
                </div>
                <div role="group" aria-label="목록 기준" className="flex flex-wrap">
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

            <NoticeBoardRows
                items={isExpiry ? expiring : recent}
                mode={tab}
                empty={isExpiry ? '7일 안에 게시가 끝나는 공고가 없습니다.' : '최근 7일 동안 새로 올라온 공고가 없습니다.'}
            />

            <p className="pt-3 flex flex-wrap justify-between gap-2 text-[13px] leading-relaxed">
                <span>
                    작성일·공고만료일은 법원 게시판 값입니다. 회차표는 첨부 공고문에서 읽은 참고 정보이며, 2회차 이후는 앞 회차가 유찰됐을 때만 열립니다.
                    법원은 낙찰 결과를 공개하지 않으니 진행 여부는 관재인 사무실에 확인하세요.
                </span>
                <Link href="/court" className="font-bold underline underline-offset-[3px] whitespace-nowrap">법원별로 모두 보기 →</Link>
            </p>
        </section>
    );
}
