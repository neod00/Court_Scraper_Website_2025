import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '대출 이자·상환 계산기 (원리금균등·원금균등·만기일시)',
    description: '대출 원금, 금리, 기간, 거치기간으로 상환 방식별 월 납입액과 총이자, 월별 상환표를 계산합니다.',
    alternates: { canonical: '/tools/loan' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
