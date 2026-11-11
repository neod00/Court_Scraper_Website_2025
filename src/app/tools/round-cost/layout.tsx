import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '회차별 총비용 비교 계산기 (최저가 + 취득세)',
    description: '회생·파산 매각 공고의 회차별 최저입찰가에 취득세와 기타 비용을 더해 회차마다 총비용을 비교합니다. 공고 금액을 그대로 붙여 넣거나 인하율로 계산할 수 있습니다.',
    alternates: { canonical: '/tools/round-cost' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
