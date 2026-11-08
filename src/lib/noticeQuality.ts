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

export function filterQualityNotices<T extends QualityCheckable>(
    notices: T[] | null | undefined,
): T[] {
    if (!notices) return [];
    return notices.filter(isQualityNotice);
}
