import Script from 'next/script';

export default function AdSenseLoader() {
    return (
        <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5907754718994620"
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}
