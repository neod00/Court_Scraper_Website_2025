import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '취득세 계산기',
    description: '입력값을 기준으로 취득 관련 세액을 단순 계산하는 참고용 도구입니다.',
    alternates: { canonical: '/tools/acquisition-tax' },
    robots: { index: false, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
