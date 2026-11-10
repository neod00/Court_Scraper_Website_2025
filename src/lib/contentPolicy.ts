// Public-content gates used while the site is being prepared for AdSense review.
//
// Automated court records remain available as a search utility, but they are
// not treated as editorial pages until a separate human-review workflow exists.

// 2026-11: 공고 상세는 첨부 원문(content_text)·회차표·같은 매각기관 공고 묶음을 갖춘 경우에만
// 색인한다(noticeQuality.isQualityNotice). 원문·요약 둘 다 없는 공고는 계속 noindex.
export const INDEX_AUTOMATED_NOTICE_PAGES = true;
export const ALLOW_DATABASE_BLOG_POSTS = false;

// 2026-11: 주간 칼럼(/trend)과 월간 리포트(/reports)는 자동 작성 글이라 색인하지 않는다.
// 로옥션은 도구형 사이트이고, 표 수치를 다시 적은 자동 글은 애드센스 '가치가 낮은 콘텐츠' 판정 위험만 키운다.
// 페이지는 계속 열리고 내부 링크도 따라갈 수 있다(follow). 사람이 해석을 쓰는 체계가 생기면 true 로 되돌린다.
export const INDEX_AUTO_EDITORIAL = false;

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

export function isPublicBlogSlug(slug: string): boolean {
    return PUBLIC_BLOG_SLUGS.has(slug);
}
