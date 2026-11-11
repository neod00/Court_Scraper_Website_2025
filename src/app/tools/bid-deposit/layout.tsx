import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '입찰보증금·잔금 계산기',
    description: '관재인 매각 공고의 보증금 비율로 입찰보증금, 낙찰 뒤 낼 잔금, 잔금 납부 기한을 계산합니다.',
    alternates: { canonical: '/tools/bid-deposit' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
