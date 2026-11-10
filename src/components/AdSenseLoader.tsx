'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { ADSENSE_CLIENT_ID, isAdFreeLocation } from '@/lib/adsense';

/** 광고 스크립트 태그. 같은 src 는 next/script 가 한 번만 싣는다. 공고 상세 페이지가 직접 쓴다. */
export function AdSenseTag() {
    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}

function AdSenseScript() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (isAdFreeLocation(pathname, searchParams)) {
        return null;
    }

    return <AdSenseTag />;
}

/**
 * Loads the Google AdSense library once per page for every route except
 * /notice/* and search-result URLs. Rendered from the root layout.
 * Notice detail pages render <AdSenseTag /> themselves when they are indexable.
 */
export default function AdSenseLoader() {
    return (
        <Suspense fallback={null}>
            <AdSenseScript />
        </Suspense>
    );
}
