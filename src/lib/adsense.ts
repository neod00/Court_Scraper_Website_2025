// AdSense 설정 — 서버·클라이언트 양쪽에서 import 할 수 있도록 'use client' 모듈과 분리한다.
export const ADSENSE_CLIENT_ID = 'ca-pub-5907754718994620';

const SEARCH_PARAM_KEYS = ['q', 'start', 'end', 'cat'];

/**
 * 루트 레이아웃이 광고 스크립트를 싣지 않는 URL인지 판정한다.
 * - /notice/* — 레이아웃에서는 싣지 않고, 공고 상세 페이지가 색인 기준(원문·요약이 있는 공고)과 같은
 *   기준으로 직접 <AdSenseTag /> 를 렌더링한다. 원문이 없는 얇은 공고 페이지에는 광고를 싣지 않는다.
 * - 검색 결과 URL (q/start/end/cat 쿼리 중 하나라도 있는 경우) — 목록만 있는 화면이라 광고 미배치
 */
export function isAdFreeLocation(pathname: string | null, searchParams: URLSearchParams | null): boolean {
    if (pathname && (pathname === '/notice' || pathname.startsWith('/notice/'))) {
        return true;
    }
    if (searchParams && SEARCH_PARAM_KEYS.some((key) => searchParams.has(key))) {
        return true;
    }
    return false;
}
