// 주간 데이터 칼럼 공용 로직 (단일 출처).
//
// 원칙: 자동 집계 수치만 있는 주차는 색인 대상이 아니다.
// 편집자가 쓴 해석(editor_note)이 붙은 주차만 개별 URL로 색인하고 사이트맵에 넣는다.
// 공고 페이지의 품질 게이트(noticeQuality.ts)와 같은 원리다.

export interface WeeklyReport {
    id?: string;
    week_start: string;
    week_end: string;
    total_notices?: number | null;
    top_department?: string | null;
    category_breakdown?: Record<string, number> | string | null;
    trending_tags?: { tag: string; count: number }[] | string | null;
    editor_note?: string | null;
    editor_note_title?: string | null;
    editor_note_by?: string | null;
    editor_note_at?: string | null;
}

/** 편집자 해석이 실질적으로 담겼는지 — 색인/링크 가능 여부의 단일 판정 기준. */
export function hasEditorNote(report: Pick<WeeklyReport, 'editor_note'> | null | undefined): boolean {
    const note = report?.editor_note;
    if (!note) return false;
    return note.trim().length >= 200; // 한두 문장짜리 껍데기 방지
}

export function filterPublishedColumns<T extends Pick<WeeklyReport, 'editor_note'>>(
    reports: T[] | null | undefined,
): T[] {
    if (!reports) return [];
    return reports.filter(hasEditorNote);
}

/** 주차 URL 슬러그는 week_start(YYYY-MM-DD). 안정적이고 정렬 가능하다. */
export function weekSlug(report: Pick<WeeklyReport, 'week_start'>): string {
    return report.week_start;
}

export function isValidWeekSlug(slug: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(slug);
}

/** "8월 3주차" 형태의 사람이 읽는 라벨. week_start(월요일) 기준. */
export function weekLabel(report: Pick<WeeklyReport, 'week_start'>): string {
    const d = new Date(report.week_start);
    if (Number.isNaN(d.getTime())) return report.week_start;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const nth = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : day <= 28 ? 4 : 5;
    return `${month}월 ${nth}주차`;
}

export function columnTitle(report: WeeklyReport): string {
    const custom = report.editor_note_title?.trim();
    if (custom) return custom;
    return `${weekLabel(report)} 매각 공고 리뷰`;
}

export function columnAuthor(report: WeeklyReport): string {
    return report.editor_note_by?.trim() || '로옥션';
}

/** 발행일: 해석 작성 시각이 있으면 그것, 없으면 주차 종료일. */
export function columnDate(report: WeeklyReport): string {
    return (report.editor_note_at || report.week_end || '').slice(0, 10);
}

/** 목록 카드용 요약 — 해석 첫 문단에서 뽑는다. */
export function columnExcerpt(report: WeeklyReport, max = 140): string {
    const note = report.editor_note?.trim();
    if (!note) return '';
    const firstBlock = note.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
    return firstBlock.length > max ? `${firstBlock.slice(0, max)}…` : firstBlock;
}

/** 해석 본문을 문단 배열로. */
export function columnParagraphs(report: WeeklyReport): string[] {
    const note = report.editor_note?.trim();
    if (!note) return [];
    return note
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
}

/** JSONB 컬럼이 문자열로 올 수도 있어 안전하게 파싱. */
export function parseJsonColumn<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }
    return value as T;
}

export const CATEGORY_LABELS: Record<string, string> = {
    real_estate: '부동산',
    vehicle: '차량/동산',
    asset: '자산',
    bond: '채권',
    stock: '주식',
    patent: '특허',
    intangible: '무체재산',
    electronics: '전자장비',
};

export function categoryLabel(key: string): string {
    return CATEGORY_LABELS[key] || key;
}
