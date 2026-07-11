import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://www.courtauction.site';
const siteName = '로옥션(LawAuction)';
const siteDescription = '대한민국 법원에 공개된 회생·파산 자산매각 공고를 기간, 자산 유형과 키워드로 찾아 원문을 확인할 수 있는 민간 검색 서비스입니다.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteName,
  description: siteDescription,
  keywords: '회생, 파산, 자산매각, 공고, 법원경매, 부동산, 차량, 채권, 주식, 특허',
  authors: [{ name: siteName, url: '/authors/lawauction-editorial-team' }],
  creator: siteName,
  publisher: siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: 'uWs5v8AWst5Ar4eYtkM-3S6DEZprpeiOnJRAGxofTwg',
    other: {
      'naver-site-verification': ['090c45f693222f66c91d6f416d0b5db00608e9b8'],
    },
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    siteName,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: siteName,
    description: siteDescription,
  },
};

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
    url: siteUrl,
  },
  datePublished: '2025-01-01',
  inLanguage: 'ko-KR',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <Header />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
