import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '취득세 계산기 (다주택 중과·조정대상지역·경차 감면 반영)',
    description: '낙찰가로 부동산·차량 취득세와 지방교육세, 농어촌특별세를 계산합니다. 1주택 6억~9억 구간 산식, 다주택 중과, 85㎡ 기준, 경차 감면을 반영한 2026년 기준 계산기입니다.',
    alternates: { canonical: '/tools/acquisition-tax' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
