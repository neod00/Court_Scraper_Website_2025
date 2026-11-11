import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '채권 회수율 계산기 (손익분기 회수율)',
    description: '파산재단 매출채권·대여금채권 매수 시 손익분기 회수율과 예상 회수율별 손익, 연 환산 수익률을 계산합니다.',
    alternates: { canonical: '/tools/bond-recovery' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
