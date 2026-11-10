// 공고 색인 캐시 — 법원별·자산 유형별 페이지와 홈이 함께 쓰는 공고 목록.
//
// 원문(content_text)이 저장된 최근 공고를 한 번 읽어 회차표를 풀고, 작은 레코드만 캐시한다.
// 원문 본문은 크므로(건당 수 KB) 요청마다 읽지 않는다 — Supabase egress 절약.
// 캐시 결과는 Vercel Data Cache 항목 한도(2MB) 안에 들어가도록 제목을 줄이고 회차만 남긴다.

import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { maskPersonNames, parseRoundTable } from '@/lib/noticeText';

export const INDEX_DAYS = 180;
const PAGE = 200;
const MAX_ROWS = 5000;

export interface IndexedRound {
    round: number;
    date: string | null; // YYYY-MM-DD (원문 줄의 첫 날짜)
    price: number;
}

export interface IndexedNotice {
    id: string;
    date: string; // 공고일 YYYY-MM-DD
    category: string;
    court: string;
    title: string; // 이름 가림 처리한 제목
    rounds: IndexedRound[] | null;
}

function toIsoDate(schedule: string | undefined): string | null {
    if (!schedule) return null;
    const m = schedule.match(/(20\d{2})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    if (!m) return null;
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

async function loadIndex(): Promise<IndexedNotice[]> {
    const since = new Date(Date.now() - INDEX_DAYS * 86400000).toISOString().slice(0, 10);
    const out: IndexedNotice[] = [];
    for (let from = 0; from < MAX_ROWS; from += PAGE) {
        const { data, error } = await supabase
            .from('court_notices')
            .select('id, date_posted, category, department, title, content_text')
            .eq('source_type', 'notice')
            .not('content_text', 'is', null)
            .gte('date_posted', since)
            .order('date_posted', { ascending: false })
            .order('id', { ascending: true })
            .range(from, from + PAGE - 1);
        if (error) throw error;
        for (const row of data || []) {
            const parsed = parseRoundTable(row.content_text);
            const title = maskPersonNames(row.title || '').replace(/\s+/g, ' ').trim();
            out.push({
                id: row.id,
                date: row.date_posted,
                category: row.category || 'etc',
                court: (row.department || '').trim(),
                title: title.length > 90 ? `${title.slice(0, 90)}…` : title,
                rounds: parsed
                    ? parsed.slice(0, 12).map((r) => ({ round: r.round, date: toIsoDate(r.schedule[0]), price: r.price }))
                    : null,
            });
        }
        if (!data || data.length < PAGE) break;
    }
    return out;
}

/** 6시간마다 갱신되는 공고 색인. 실패하면 빈 배열(페이지는 목록 없이 렌더링). */
export const getNoticeIndex = unstable_cache(
    async () => {
        try {
            return await loadIndex();
        } catch (error) {
            console.error('notice index load failed:', error);
            return [] as IndexedNotice[];
        }
    },
    ['notice-index-v1'],
    { revalidate: 21600 },
);

/** 한국 시각 기준 오늘(YYYY-MM-DD). */
export function todayKst(): string {
    return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
    return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export interface UpcomingRound {
    notice: IndexedNotice;
    round: number;
    totalRounds: number;
    date: string;
    dDay: number;
    price: number;
    firstPrice: number;
}

/** 오늘부터 withinDays 안에 입찰 마감(회차 날짜)이 있는 공고. 가까운 날짜 순. */
export function upcomingRounds(list: IndexedNotice[], withinDays = 14, today = todayKst()): UpcomingRound[] {
    const result: UpcomingRound[] = [];
    for (const n of list) {
        if (!n.rounds) continue;
        const next = n.rounds.find((r) => r.date && r.date >= today);
        if (!next || !next.date) continue;
        const dDay = daysBetween(today, next.date);
        if (dDay > withinDays) continue;
        result.push({
            notice: n,
            round: next.round,
            totalRounds: n.rounds.length,
            date: next.date,
            dDay,
            price: next.price,
            firstPrice: n.rounds[0].price,
        });
    }
    return result.sort((a, b) => a.date.localeCompare(b.date) || a.price - b.price);
}

export interface GroupStats {
    total: number;
    withRounds: number;
    byCategory: [string, number][];
    byCourt: [string, number][];
    medianFirstPrice: number | null;
    medianStepRatio: number | null; // 다음 회차 최저가 / 이전 회차 최저가 (중앙값)
    medianLastRatio: number | null; // 마지막 회차 최저가 / 1회차 (중앙값)
    latestDate: string | null;
}

function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function countBy(list: IndexedNotice[], key: (n: IndexedNotice) => string): [string, number][] {
    const m = new Map<string, number>();
    for (const n of list) {
        const k = key(n);
        if (k) m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function groupStats(list: IndexedNotice[]): GroupStats {
    const withRounds = list.filter((n) => n.rounds && n.rounds.length >= 2);
    const steps: number[] = [];
    const lasts: number[] = [];
    for (const n of withRounds) {
        const r = n.rounds!;
        for (let i = 1; i < r.length; i++) if (r[i - 1].price > 0) steps.push(r[i].price / r[i - 1].price);
        if (r[0].price > 0) lasts.push(r[r.length - 1].price / r[0].price);
    }
    return {
        total: list.length,
        withRounds: withRounds.length,
        byCategory: countBy(list, (n) => n.category),
        byCourt: countBy(list, (n) => n.court),
        medianFirstPrice: median(withRounds.map((n) => n.rounds![0].price)),
        medianStepRatio: median(steps),
        medianLastRatio: median(lasts),
        latestDate: list[0]?.date ?? null,
    };
}
