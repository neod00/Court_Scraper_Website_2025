// Shared "quality notice" gate.
//
// A court notice is only treated as indexable / link-worthy when it carries a
// substantive AI analysis — NOT a "see the attachment" (첨부파일) fallback and
// NOT a too-short stub. This single source of truth is used by:
//   - the sitemap (which notices to advertise to Google)
//   - the detail page (whether to index the page)
//   - every crawlable internal-link surface (category lists, related-notice
//     sidebar, homepage featured grid)
//
// Keeping these in sync is what prevents Googlebot / AdSense reviewers from
// reaching the large set of thin, near-duplicate scraped notice pages.

//
// 2026-11: a notice also qualifies when it carries the attachment's original
// text (content_text, extracted and name-masked by
// scripts/attachment_text_extractor.py). List queries that do not select
// content_text simply fall back to the summary rule.

import { hasSubstantialText } from '@/lib/noticeText';

export interface QualityCheckable {
    ai_summary?: string | null;
    content_text?: string | null;
    title?: string | null;
}

/** AI 요약이 '첨부파일을 확인하라'는 대체 문구가 아닌 실제 요약인가. */
export function hasUsefulSummary(summary: string | null | undefined): boolean {
    if (!summary) return false;
    if (summary.includes('첨부파일')) return false; // fallback "see attachment" summary
    if (summary.length <= 300) return false; // too short to add real value
    return true;
}

export function isQualityNotice(notice: QualityCheckable | null | undefined): boolean {
    if (!notice) return false;
    if (hasSubstantialText(notice.content_text, notice.title)) return true;
    return hasUsefulSummary(notice.ai_summary);
}

/** 한국 시각 기준 오늘(YYYY-MM-DD). */
function kstToday(): string {
    return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
}

/** 법원 게시판에 아직 게시 중인가(공고만료일이 오늘 이후). 만료일이 없으면 게시 중으로 보지 않는다. */
export function isPostedNotice(expiry: string | null | undefined, today = kstToday()): boolean {
    return Boolean(expiry && expiry >= today);
}

/**
 * 검색 색인·사이트맵·광고 대상 공고: 원문(또는 실제 요약)이 있고 아직 게시 중인 공고.
 * 2026-11-14: 게시가 끝난 공고는 입찰할 수 없어 검색 이용자에게 가치가 낮다 — 구글이 '크롤링됨 - 색인 미생성'으로
 * 분류한 공고가 모두 만료 공고였다. 만료 공고 페이지는 기록으로 계속 열리지만 noindex 이고 사이트맵에서 빠진다.
 */
export function isIndexableNotice(notice: (QualityCheckable & { expiry_date?: string | null }) | null | undefined): boolean {
    return Boolean(notice && isQualityNotice(notice) && isPostedNotice(notice.expiry_date));
}

export function filterQualityNotices<T extends QualityCheckable>(
    notices: T[] | null | undefined,
): T[] {
    if (!notices) return [];
    return notices.filter(isQualityNotice);
}
