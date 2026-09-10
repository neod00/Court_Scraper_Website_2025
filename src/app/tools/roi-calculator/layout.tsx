import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '매도·임대 손익 계산기',
    description: '매도가 또는 임대 조건과 총비용을 비교해 손익을 단순 계산하는 참고용 도구입니다.',
    alternates: { canonical: '/tools/roi-calculator' },
    robots: { index: false, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
