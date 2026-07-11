import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// import DonationButton from '@/components/DonationButton'; // 후원 버튼 홀딩 중

const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://www.courtauction.site';
const siteName = '로옥션(LawAuction) - 프리미엄 법원 자산매각 플랫폼';
const siteDescription = '대법원 회생·파산 자산매각 공고 자동 수집 및 조회. 부동산, 차량, 채권 등 다양한 법원 자산 정보를 쉽고 빠르게 검색하세요.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.courtauction.site'),
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
    siteName: siteName,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
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
        <Header />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        {/* <DonationButton /> */}{/* 후원 버튼 홀딩 중 */}
        <Footer />
      </body>
    </html>
  );
}
