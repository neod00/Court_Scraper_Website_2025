import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '차량 이전비 계산기',
    description: '입력값을 기준으로 차량 이전 관련 비용을 단순 계산하는 참고용 도구입니다.',
    alternates: { canonical: '/tools/vehicle-transfer' },
    robots: { index: false, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
