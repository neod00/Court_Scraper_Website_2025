// 법원별 공고 페이지(/court/[slug])에서 쓰는 법원 목록.
// name 은 court_notices.department 값과 정확히 같아야 한다.

export interface CourtInfo {
    slug: string;
    name: string;
    kind: 'rehabilitation' | 'district';
    region: string;
}

export const courts: CourtInfo[] = [
    { slug: 'seoul-rehabilitation', name: '서울회생법원', kind: 'rehabilitation', region: '서울' },
    { slug: 'suwon-rehabilitation', name: '수원회생법원', kind: 'rehabilitation', region: '경기 남부' },
    { slug: 'daejeon-rehabilitation', name: '대전회생법원', kind: 'rehabilitation', region: '대전·충남' },
    { slug: 'busan-rehabilitation', name: '부산회생법원', kind: 'rehabilitation', region: '부산' },
    { slug: 'daegu-rehabilitation', name: '대구회생법원', kind: 'rehabilitation', region: '대구·경북' },
    { slug: 'gwangju-rehabilitation', name: '광주회생법원', kind: 'rehabilitation', region: '광주·전남' },
    { slug: 'incheon', name: '인천지방법원', kind: 'district', region: '인천' },
    { slug: 'uijeongbu', name: '의정부지방법원', kind: 'district', region: '경기 북부' },
    { slug: 'changwon', name: '창원지방법원', kind: 'district', region: '경남' },
    { slug: 'daejeon', name: '대전지방법원', kind: 'district', region: '대전·충남' },
    { slug: 'chuncheon', name: '춘천지방법원', kind: 'district', region: '강원' },
    { slug: 'ulsan', name: '울산지방법원', kind: 'district', region: '울산' },
    { slug: 'jeonju', name: '전주지방법원', kind: 'district', region: '전북' },
    { slug: 'jeju', name: '제주지방법원', kind: 'district', region: '제주' },
    { slug: 'cheongju', name: '청주지방법원', kind: 'district', region: '충북' },
    { slug: 'gwangju', name: '광주지방법원', kind: 'district', region: '광주·전남' },
    { slug: 'daegu', name: '대구지방법원', kind: 'district', region: '대구·경북' },
];

export function getCourtBySlug(slug: string): CourtInfo | undefined {
    return courts.find((c) => c.slug === slug);
}

export function getCourtByName(name: string | null | undefined): CourtInfo | undefined {
    if (!name) return undefined;
    return courts.find((c) => c.name === name.trim());
}

/** 색인할 만큼 공고가 쌓였는가. 공고가 몇 건 안 되는 법원 페이지는 얇은 페이지라 noindex 로 둔다. */
export const COURT_INDEX_MIN_NOTICES = 10;
