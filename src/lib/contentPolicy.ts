// Public-content gates used while the site is being prepared for AdSense review.
//
// Automated court records remain available as a search utility, but they are
// not treated as editorial pages until a separate human-review workflow exists.

export const INDEX_AUTOMATED_NOTICE_PAGES = false;
export const ALLOW_DATABASE_BLOG_POSTS = false;

export const PUBLIC_BLOG_SLUGS = new Set([
    'court-auction-vs-rehabilitation-sale',
    'beginner-guide-first-bid',
    'understanding-registry-for-rights-analysis',
    'what-is-lien-and-why-important',
    'auction-vs-public-sale-differences',
]);

export const PUBLIC_GUIDE_SLUGS = new Set([
    'rehabilitation-asset-guide',
    'bankruptcy-vs-auction',
]);

export function isPublicBlogSlug(slug: string): boolean {
    return PUBLIC_BLOG_SLUGS.has(slug);
}

export function isPublicGuideSlug(slug: string): boolean {
    return PUBLIC_GUIDE_SLUGS.has(slug);
}
