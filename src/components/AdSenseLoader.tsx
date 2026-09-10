'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { ADSENSE_CLIENT_ID, isAdFreeLocation } from '@/lib/adsense';

function AdSenseScript() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (isAdFreeLocation(pathname, searchParams)) {
        return null;
    }

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}

/**
 * Loads the Google AdSense library once per page for every route except
 * /notice/* and search-result URLs. Rendered from the root layout.
 */
export default function AdSenseLoader() {
    return (
        <Suspense fallback={null}>
            <AdSenseScript />
        </Suspense>
    );
}
