// AdSense 설정 — 서버·클라이언트 양쪽에서 import 할 수 있도록 'use client' 모듈과 분리한다.
export const ADSENSE_CLIENT_ID = 'ca-pub-5907754718994620';

const SEARCH_PARAM_KEYS = ['q', 'start', 'end', 'cat'];

/**
 * 광고 스크립트를 싣지 않는 URL인지 판정한다.
 * - /notice/* 전부 (noindex, 정책상 광고 미배치)
 * - 검색 결과 URL (q/start/end/cat 쿼리 중 하나라도 있는 경우)
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
