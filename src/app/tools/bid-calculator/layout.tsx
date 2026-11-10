import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '입찰가 계산기 (목표 이익률로 입찰가 상한 역산)',
    description: '예상 매도가와 목표 이익률, 수리·명도 비용을 넣으면 취득세까지 뺀 입찰가 상한을 계산합니다. 회생·파산 매각 공고의 회차별 최저입찰가와 비교해 볼 수 있습니다.',
    alternates: { canonical: '/tools/bid-calculator' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
