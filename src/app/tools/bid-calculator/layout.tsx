import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '입찰가 계산기',
    description: '입력값을 기준으로 입찰 관련 수치를 단순 계산하는 참고용 도구입니다.',
    alternates: { canonical: '/tools/bid-calculator' },
    robots: { index: false, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
