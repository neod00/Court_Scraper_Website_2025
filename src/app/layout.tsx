import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://court-auction-scraper.vercel.app';
const siteName = '대법원 회생·파산 자산매각 공고 자동조회 시스템';
const siteDescription = '대법원 회생·파산 자산매각 공고를 자동으로 수집하여 제공합니다. 부동산, 차량, 채권, 주식, 특허 등 다양한 매각 자산 정보를 쉽고 빠르게 검색하세요.';

export const metadata: Metadata = {
  title: siteName,
  description: siteDescription,
  keywords: '대법원, 회생, 파산, 자산매각, 공고, 경매, 공매, 부동산, 차량, 채권, 주식, 특허, 법원경매',
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    siteName: siteName,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
  },
  verification: {
    google: '', // Google Search Console 인증 코드 (추후 추가)
  },
  alternates: {
    canonical: siteUrl,
  },
};

// JSON-LD 구조화 데이터
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: siteName,
  description: siteDescription,
  url: siteUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
  },
  author: {
    '@type': 'Organization',
    name: siteName,
  },
  datePublished: '2025-01-01',
  inLanguage: 'ko-KR',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        {/* Naver Maps API - afterInteractive for proper client-side loading */}
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
          strategy="afterInteractive"
        />
        {/* Naver Maps Marker Clustering */}
        <Script
          src="https://navermaps.github.io/maps.js.ncp/lib/marker-clustering.js"
          strategy="afterInteractive"
        />
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5907754718994620"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Header />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
