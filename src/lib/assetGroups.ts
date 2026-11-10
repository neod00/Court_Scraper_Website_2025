// 자산 유형 묶음과 면 색 — 홈의 입찰 일정·최근 공고·유형 칸이 같은 색을 쓴다.
// 편집형 디자인: 종이에 인쇄한 듯한 낮은 채도의 면 색에 먹색 글자(fg)와 1px 먹선을 쓴다.
// court_notices.category 값을 화면용 5개 묶음으로 모은다(카테고리 페이지 categories.ts 의 dbCategories 와 같은 구분).

export type AssetGroup = 'real' | 'asset' | 'bond' | 'car' | 'patent';

export const ASSET_GROUPS: Record<AssetGroup, { label: string; bg: string; fg: string; slug: string }> = {
    real: { label: '부동산', bg: '#D7E7DF', fg: '#161616', slug: 'real-estate' },
    asset: { label: '자산·설비', bg: '#E8C9B5', fg: '#161616', slug: 'equipment' },
    bond: { label: '채권', bg: '#F0EA9C', fg: '#161616', slug: 'bonds' },
    car: { label: '차량', bg: '#D9D2EF', fg: '#161616', slug: 'vehicle' },
    patent: { label: '특허·상표', bg: '#F7F3E6', fg: '#161616', slug: 'ip' },
};

export function assetGroupOf(category: string | null | undefined): AssetGroup {
    switch (category) {
        case 'real_estate':
            return 'real';
        case 'bond':
        case 'stock':
            return 'bond';
        case 'vehicle':
            return 'car';
        case 'patent':
        case 'intangible':
            return 'patent';
        default:
            return 'asset';
    }
}
