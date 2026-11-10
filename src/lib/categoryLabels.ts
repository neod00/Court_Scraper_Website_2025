// court_notices.category 값의 한국어 이름.
export const CATEGORY_LABELS: Record<string, string> = {
    real_estate: '부동산',
    vehicle: '차량/동산',
    asset: '자산',
    bond: '채권',
    stock: '주식',
    patent: '특허',
    intangible: '무체재산',
    electronics: '전자장비',
    etc: '기타',
};

export function categoryLabel(key: string): string {
    return CATEGORY_LABELS[key] || key;
}
