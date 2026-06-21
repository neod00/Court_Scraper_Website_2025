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

export interface QualityCheckable {
    ai_summary?: string | null;
}

export function isQualityNotice(notice: QualityCheckable | null | undefined): boolean {
    const summary = notice?.ai_summary;
    if (!summary) return false;
    if (summary.includes('첨부파일')) return false; // fallback "see attachment" summary
    if (summary.length <= 300) return false; // too short to add real value
    return true;
}

export function filterQualityNotices<T extends QualityCheckable>(
    notices: T[] | null | undefined,
): T[] {
    if (!notices) return [];
    return notices.filter(isQualityNotice);
}
