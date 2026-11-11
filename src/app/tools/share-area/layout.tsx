import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '지분·면적 환산 계산기 (지분 면적·평수·평당가)',
    description: '공고의 “A분의 B 지분”을 실제 면적(㎡)과 평수로 바꾸고, 매각가를 ㎡당·평당 가격과 전체 면적 환산가로 계산합니다. 지분 매각 공고를 볼 때 씁니다.',
    alternates: { canonical: '/tools/share-area' },
    robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return children;
}
