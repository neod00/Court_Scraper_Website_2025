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

// 편집 심사(2026-08-22)에서 폐기가 결정된 글.
//
// 사실 오류·날조 데이터·법적 위험이 확인되어 공개하지 않습니다.
// PUBLIC_BLOG_SLUGS에 실수로 추가되더라도 getPublicBlogPosts()가 이 목록을 다시 걸러내므로
// 공개되지 않습니다. 되살리려면 원고를 전면 재작성한 뒤 이 목록에서 먼저 제거해야 합니다.
export const RETIRED_BLOG_SLUGS = new Map<string, string>([
    ['vehicle-auction-market-price-comparison',
        '낙찰 사례 표가 가상 데이터인데 본문이 이를 근거로 "평균 20~30% 저렴"이라는 시장 결론을 서술'],
    ['small-money-auction-investment-tips',
        '"3천만 원으로 건물주"가 본문(빌라 1채)과 불일치. 공유자우선매수권·농지취득자격증명 누락'],
    ['buying-cars-cheap-via-onbid',
        '제목("반값")이 본문("15~20%")과 모순. 폐지된 공인인증서 안내, 권리관계 "100% 깨끗" 단정'],
    ['npl-investment-basics',
        'npl-investment-basics-for-real-estate와 중복. 배당 상한을 채권최고액으로 오인하고 "세금은 거의 내지 않는다"고 서술'],
    ['shared-ownership-auction-profit-strategy',
        '공유자 압박용 내용증명 대본 제공, "수익 200%" 보장 표현, 공유물분할 현물분할 원칙(민법 제269조) 오류'],
]);

export function isRetiredBlogSlug(slug: string): boolean {
    return RETIRED_BLOG_SLUGS.has(slug);
}

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
