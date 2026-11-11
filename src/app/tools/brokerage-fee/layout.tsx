import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '중개보수 계산기 (2021 개정 상한 요율)',
    description: '부동산 매매·전세·월세 중개보수 상한을 공인중개사법 시행규칙 요율표로 계산합니다. 월세 거래금액 환산과 부가세 포함 금액도 보여 줍니다.',
    alternates: { canonical: '/tools/brokerage-fee' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
