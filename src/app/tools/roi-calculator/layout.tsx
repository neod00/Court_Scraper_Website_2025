import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '매도·임대 손익 계산기',
    description: '낙찰가와 취득세, 수리비 등 총비용을 예상 매도가 또는 월세·보증금과 비교해 매도 차익, 임대 순수익률, 비용 회수 기간을 계산합니다.',
    alternates: { canonical: '/tools/roi-calculator' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
