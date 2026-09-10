import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSenseLoader from '@/components/AdSenseLoader';
import { ADSENSE_CLIENT_ID } from '@/lib/adsense';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://www.courtauction.site';
const siteName = '로옥션(LawAuction)';
const defaultTitle = '로옥션(LawAuction) | 법원 회생·파산 자산매각 공고 검색과 데이터 칼럼';
const siteDescription =
  '대한민국 법원에 공개된 회생·파산 자산매각 공고를 기간, 자산 유형과 키워드로 검색하고, 수집한 공고를 집계한 주간 칼럼과 데이터랩을 함께 제공하는 민간 정보 서비스입니다.';
const contactEmail = 'openbrain.main@gmail.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | 로옥션',
    default: defaultTitle,
  },
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
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
  other: {
    'google-adsense-account': ADSENSE_CLIENT_ID,
  },
  openGraph: {
    title: defaultTitle,
    description: siteDescription,
    url: siteUrl,
    siteName,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: defaultTitle,
    description: siteDescription,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: siteName,
  alternateName: ['로옥션', 'LawAuction'],
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    email: contactEmail,
    contactType: 'customer support',
    availableLanguage: ['ko'],
  },
};

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  name: siteName,
  alternateName: '로옥션',
  url: siteUrl,
  description: siteDescription,
  inLanguage: 'ko-KR',
  publisher: { '@id': `${siteUrl}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <AdSenseLoader />
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
