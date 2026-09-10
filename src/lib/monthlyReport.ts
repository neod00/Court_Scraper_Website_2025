// 월간 리포트 공용 로직 (단일 출처). 서버 컴포넌트에서만 사용한다.
//
// 데이터 출처: scripts/monthly_report_builder.py 가 court_notices 를 달력 월 단위로 집계해
// src/content/reports/YYYY-MM.json 에 고정 저장한 결과. 페이지는 요청 시 재집계하지 않는다.
//
// 원칙: 자동 집계 수치만 있는 달은 색인 대상이 아니다.
// 편집자 노트(300자 이상)가 붙고 status 가 'published' 인 달만 개별 URL로 공개·색인하고
// 사이트맵에 넣는다. 주간 칼럼(weeklyColumn.ts)·공고 품질 게이트(noticeQuality.ts)와 같은 원리다.

import { REPORT_FILES } from '@/content/reports';

export interface WeeklyCount {
    week_start: string;
    week_end: string;
    n: number;
    partial: boolean;
}

export interface CourtStat {
    name: string;
    n: number;
    pct: number;
    rank: number;
    prev_n: number;
    prev_rank: number | null;
}

export interface CategoryStat {
    key: string;
    label: string;
    n: number;
    pct: number;
}

export interface PriceBand {
    label: string;
    n: number;
    pct: number;
}

export interface NotableItem {
    id: string;
    court: string;
    title: string;
    min_price: number;
    target: string;
    rounds_noted: boolean;
}

export interface MultiCaseExample {
    court: string;
    case_no: string;
    n: number;
}

export interface MonthlyReport {
    schema_version: number;
    month: string; // YYYY-MM
    month_label: string; // '2026년 8월'
    period: { start: string; end: string };
    snapshot_date: string; // 집계 기준일
    totals: {
        n: number;
        prev_month: string;
        prev_month_n: number;
        diff: number;
        diff_pct: number | null;
        prev_comparable: boolean;
        weekly_avg: number;
        weekly_counts: WeeklyCount[];
    };
    courts: { top: CourtStat[]; other_n: number; distinct_n: number };
    categories: CategoryStat[];
    price: {
        priced_n: number;
        pct: number;
        median: number;
        p25: number;
        p75: number;
        ge_100m_n: number;
        max: number;
        bands: PriceBand[];
    };
    schedule: {
        with_auction_date_n: number;
        pct: number;
        /** 게시일보다 앞서거나 1년 넘게 뒤라서 집계에서 뺀 기일 건수 (구 JSON 에는 없음). */
        excluded_n?: number;
        in_month_n: number;
        next_month_n: number;
        other_n: number;
        by_month: { month: string; n: number }[];
        top_dates: { date: string; n: number }[];
    };
    cases: {
        titled_with_case_n: number;
        distinct_cases_n: number;
        multi_case_n: number;
        multi_case_examples: MultiCaseExample[];
    };
    notable: NotableItem[];
    data_quality: {
        summary_fallback_n: number;
        summary_fallback_pct: number;
        summary_quality_n: number;
        summary_quality_pct: number;
        min_price_n: number;
        auction_date_n: number;
        unclassified_n: number;
    };
    editor_note: string;
    editor_note_title: string;
    editor_note_by: string;
    editor_note_status: string; // '' | 'ai-draft' | 'reviewed'
    status: 'draft' | 'published';
    published_at: string | null; // --publish 실행 시각(ISO). 소급하지 않는다.
}

/** 발행 게이트 최소 노트 길이. scripts/monthly_report_builder.py MIN_NOTE_LENGTH 와 반드시 일치. */
export const MIN_EDITOR_NOTE_LENGTH = 300;

/** 수집이 안정된 첫 달. 빌더 FIRST_MONTH 와 동일 — 이 달은 전월(부분 수집)과 비교하지 않는다. */
export const FIRST_REPORT_MONTH = '2026-03';

/** 발행 게이트를 통과한 리포트 — published_at 이 반드시 있다. */
export type PublishedReport = MonthlyReport & { status: 'published'; published_at: string };

export const REPORT_CATEGORY_LABELS: Record<string, string> = {
    real_estate: '부동산',
    asset: '자산',
    bond: '채권',
    etc: '기타',
    vehicle: '차량/동산',
    patent: '특허',
    electronics: '전자장비',
    stock: '주식',
};

export function isValidMonthSlug(slug: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(slug);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** JSON 파일을 타입에 맞게 정리한다. 필수 구조가 없으면 버린다. */
function normalize(raw: unknown): MonthlyReport | null {
    if (!isRecord(raw)) return null;
    const month = typeof raw.month === 'string' ? raw.month : '';
    if (!isValidMonthSlug(month)) return null;
    if (!isRecord(raw.totals) || !isRecord(raw.period) || !isRecord(raw.price)) return null;

    const r = raw as unknown as MonthlyReport;
    const prevMonthN = Number(r.totals.prev_month_n) || 0;
    return {
        ...r,
        month,
        month_label: typeof r.month_label === 'string' && r.month_label.trim() ? r.month_label : monthLabel(month),
        editor_note: typeof r.editor_note === 'string' ? r.editor_note : '',
        editor_note_title: typeof r.editor_note_title === 'string' ? r.editor_note_title : '',
        editor_note_by: typeof r.editor_note_by === 'string' && r.editor_note_by.trim() ? r.editor_note_by : '로옥션',
        editor_note_status: typeof r.editor_note_status === 'string' ? r.editor_note_status : '',
        status: r.status === 'published' ? 'published' : 'draft',
        published_at: typeof r.published_at === 'string' && r.published_at ? r.published_at : null,
        categories: Array.isArray(r.categories) ? r.categories : [],
        notable: Array.isArray(r.notable) ? r.notable : [],
        courts: r.courts ?? { top: [], other_n: 0, distinct_n: 0 },
        cases: r.cases ?? { titled_with_case_n: 0, distinct_cases_n: 0, multi_case_n: 0, multi_case_examples: [] },
        schedule: r.schedule ?? { with_auction_date_n: 0, pct: 0, in_month_n: 0, next_month_n: 0, other_n: 0, by_month: [], top_dates: [] },
        totals: {
            ...r.totals,
            // 빌더가 prev_comparable 을 쓰기 전에 저장된 JSON 이어도 전월 비교 블록이 잘못 접히지 않게 한다.
            // 규칙은 빌더와 동일: 수집이 안정된 첫 달(FIRST_MONTH) 이후이고 전월 건수가 있을 때만 비교.
            prev_comparable:
                typeof r.totals.prev_comparable === 'boolean'
                    ? r.totals.prev_comparable
                    : month > FIRST_REPORT_MONTH && prevMonthN > 0,
            weekly_counts: Array.isArray(r.totals.weekly_counts) ? r.totals.weekly_counts : [],
        },
        price: { ...r.price, bands: Array.isArray(r.price.bands) ? r.price.bands : [] },
    };
}

let cache: MonthlyReport[] | null = null;

/** 모든 리포트(초안 포함), 최신 달부터. 공개 목록에는 getPublishedReports()를 쓴다. */
export function getAllReports(): MonthlyReport[] {
    if (cache) return cache;
    const reports = REPORT_FILES.map(normalize).filter((r): r is MonthlyReport => r !== null);
    reports.sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0));
    cache = reports;
    return reports;
}

export function getReport(month: string): MonthlyReport | null {
    if (!isValidMonthSlug(month)) return null;
    return getAllReports().find((r) => r.month === month) ?? null;
}

/** 편집자 노트가 실질적으로 담기고 발행 처리된 달만 — 색인/링크 가능 여부의 단일 판정 기준. */
export function isPublishable(report: MonthlyReport | null | undefined): report is PublishedReport {
    if (!report) return false;
    if (report.status !== 'published') return false;
    // published_at 은 --publish 가 찍는 실제 발행 시각이다. 이 값이 없으면 발행 절차를 거치지 않은 것이므로
    // (JSON 을 손으로 published 로 바꾼 경우) 사이트맵·JSON-LD 에 날짜 없는 페이지를 내보내지 않는다.
    if (!report.published_at) return false;
    // 검토 전 AI 초안은 status 와 무관하게 발행으로 보지 않는다 (builder --publish 도 --reviewed 없이는 막는다).
    if (report.editor_note_status === 'ai-draft') return false;
    return (report.editor_note ?? '').trim().length >= MIN_EDITOR_NOTE_LENGTH;
}

export function getPublishedReports(): PublishedReport[] {
    return getAllReports().filter(isPublishable);
}

export function reportTitle(report: MonthlyReport): string {
    const custom = report.editor_note_title?.trim();
    if (custom) return custom;
    return `${report.month_label} 법원 회생·파산 자산매각 공고 리포트`;
}

export function reportAuthor(report: MonthlyReport): string {
    return report.editor_note_by?.trim() || '로옥션';
}

/** 발행일(YYYY-MM-DD). 발행 전에는 null. */
export function publishedDate(report: MonthlyReport): string | null {
    return report.published_at ? report.published_at.slice(0, 10) : null;
}

/** 목록 카드용 요약 — 노트 첫 문단에서 뽑는다. */
export function reportExcerpt(report: MonthlyReport, max = 140): string {
    const note = report.editor_note?.trim();
    if (!note) return '';
    const firstBlock = note.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
    return firstBlock.length > max ? `${firstBlock.slice(0, max)}…` : firstBlock;
}

export function reportParagraphs(report: MonthlyReport): string[] {
    const note = report.editor_note?.trim();
    if (!note) return [];
    return note
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
}

function withCommas(n: number): string {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 4228161 → '422만 8,161원', 1700000000 → '17억 원', 787500 → '78만 7,500원'. */
export function formatWon(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return '-';
    const eok = Math.floor(n / 100_000_000);
    const rest = n % 100_000_000;
    const man = Math.floor(rest / 10_000);
    const won = rest % 10_000;
    const parts: string[] = [];
    if (eok) parts.push(`${withCommas(eok)}억`);
    if (man) parts.push(`${withCommas(man)}만`);
    if (won) parts.push(withCommas(won));
    if (parts.length === 0) return `${withCommas(n)}원`;
    return won ? `${parts.join(' ')}원` : `${parts.join(' ')} 원`;
}

export function formatCount(n: number): string {
    return withCommas(n);
}

export function formatSigned(n: number): string {
    if (n > 0) return `+${withCommas(n)}`;
    if (n < 0) return `-${withCommas(Math.abs(n))}`;
    return '0';
}

/** '2026-08' → '2026년 8월' (JSON 의 month_label 이 없을 때 대비). */
export function monthLabel(month: string): string {
    const [y, m] = month.split('-').map((v) => parseInt(v, 10));
    if (!y || !m) return month;
    return `${y}년 ${m}월`;
}
