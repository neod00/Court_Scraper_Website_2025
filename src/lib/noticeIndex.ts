// 공고 색인 캐시 — 법원별·자산 유형별 페이지와 홈이 함께 쓰는 공고 목록.
//
// 최근 180일 공고를 모두 읽어(원문 유무와 상관없이) 법원 게시판의 작성일·공고만료일·전화번호와
// 원문 회차표를 작은 레코드로 캐시한다(2026-11-11부터 목록 기준은 공고만료일).
// 낙찰 결과는 법원이 공개하지 않으므로, 회차표는 '앞 회차 유찰 시' 조건이 붙은 참고 정보로만 쓴다.
// 원문 본문은 크므로(건당 수 KB) 요청마다 읽지 않는다 — Supabase egress 절약.
// 캐시 결과는 Vercel Data Cache 항목 한도(2MB) 안에 들어가도록 제목을 줄이고 회차만 남긴다.

import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { hasSubstantialText, maskPersonNames, parseRoundTable, splitOcrText } from '@/lib/noticeText';

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
    expiry: string | null; // 법원 게시판 공고만료일 YYYY-MM-DD
    phone: string | null; // 법원 게시판 전화번호(관재인 사무실)
    hasText: boolean; // 읽을 만한 첨부 원문이 저장돼 있는가
    ocr: boolean; // 원문을 스캔 이미지에서 읽었는가
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
            .select('id, date_posted, expiry_date, phone, category, department, title, content_text')
            .eq('source_type', 'notice')
            .gte('date_posted', since)
            .order('date_posted', { ascending: false })
            .order('id', { ascending: true })
            .range(from, from + PAGE - 1);
        if (error) throw error;
        for (const row of data || []) {
            const stored = splitOcrText(row.content_text);
            const hasText = hasSubstantialText(stored.text, row.title);
            const parsed = hasText ? parseRoundTable(stored.text) : null;
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
                expiry: row.expiry_date || null,
                phone: (row.phone || '').trim() || null,
                hasText,
                ocr: hasText && stored.ocr,
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
    ['notice-index-v2'],
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

/** 오늘부터 withinDays 안에 원문 회차표상 입찰일이 있는, 아직 게시 중인 공고. 가까운 날짜 순. */
export function upcomingRounds(list: IndexedNotice[], withinDays = 14, today = todayKst()): UpcomingRound[] {
    const result: UpcomingRound[] = [];
    for (const n of list) {
        if (!n.rounds || !isActive(n, today)) continue;
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

/** 원문이 저장된 공고만(통계·색인 대상). */
export function withText(list: IndexedNotice[]): IndexedNotice[] {
    return list.filter((n) => n.hasText);
}

/** 법원 게시판에 아직 게시 중인가(공고만료일이 오늘 이후). 만료일이 없으면 게시 중으로 보지 않는다. */
export function isActive(n: IndexedNotice, today = todayKst()): boolean {
    return Boolean(n.expiry && n.expiry >= today);
}

/** 원문 회차표에서 오늘 이후 가장 가까운 회차. */
export function nextRound(n: IndexedNotice, today = todayKst()): IndexedRound | null {
    return n.rounds?.find((r) => r.date && r.date >= today) ?? null;
}

export interface BoardRow {
    notice: IndexedNotice;
    daysLeft: number; // 공고만료일까지 남은 날
    life: number; // 게시 기간(작성일→만료일)
    gone: number; // 게시 후 지난 날
    next: IndexedRound | null; // 원문 회차표상 다음 회차(참고)
    totalRounds: number;
    firstPrice: number;
}

function toBoardRow(n: IndexedNotice, today: string): BoardRow {
    const life = Math.max(1, daysBetween(n.date, n.expiry || n.date));
    return {
        notice: n,
        daysLeft: daysBetween(today, n.expiry || today),
        life,
        gone: Math.min(life, Math.max(0, daysBetween(n.date, today))),
        next: nextRound(n, today),
        totalRounds: n.rounds?.length ?? 0,
        firstPrice: n.rounds?.[0]?.price ?? 0,
    };
}

/** 게시 중인 공고를 공고만료일 순으로. withinDays 를 주면 그 안에 만료되는 것만. */
export function expiringBoard(list: IndexedNotice[], withinDays: number | null = null, today = todayKst()): BoardRow[] {
    return list
        .filter((n) => isActive(n, today) && (withinDays === null || daysBetween(today, n.expiry!) <= withinDays))
        .sort((a, b) => a.expiry!.localeCompare(b.expiry!) || b.date.localeCompare(a.date))
        .map((n) => toBoardRow(n, today));
}

/** 최근 days 일 안에 올라온 게시 중 공고, 최신 순. */
export function recentBoard(list: IndexedNotice[], days = 7, today = todayKst()): BoardRow[] {
    return list
        .filter((n) => isActive(n, today) && daysBetween(n.date, today) <= days)
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((n) => toBoardRow(n, today));
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
