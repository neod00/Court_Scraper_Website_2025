import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '수익률 계산기',
    description: '입력값을 기준으로 예상 수익률을 단순 계산하는 참고용 도구입니다.',
    alternates: { canonical: '/tools/roi-calculator' },
    robots: { index: false, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
