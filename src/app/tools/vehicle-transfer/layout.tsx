import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '차량 이전비 계산기 (취득세·공채·등록 비용 합산)',
    description: '법원 매각·경매로 산 차량의 이전 등록 비용을 계산합니다. 차종·용도별 취득세율과 경차 감면을 적용하고, 지역마다 다른 공채 매입률과 할인율은 직접 넣어 합산합니다.',
    alternates: { canonical: '/tools/vehicle-transfer' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
