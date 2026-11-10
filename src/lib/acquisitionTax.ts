// 취득세 계산 규칙 — 취득세·입찰가·차량 이전비 계산기가 함께 쓰는 단일 출처.
//
// 기준: 지방세법 제11조(부동산 취득세율)·제12조(차량)·제13조의2(주택 중과)·제151조(지방교육세),
// 농어촌특별세법 제5조, 지방세특례제한법 제67조(경차). 개인의 유상취득(매매·관재인 매각)만 다룬다.
// 세율을 바꾸면 RULES_CHECKED_AT 과 계산기 페이지의 세율표를 함께 고친다.
// 검증: node <scratch>/run.cjs 처럼 TypeScript 로 변환해 알려진 총 부담률 표(1.1%·8.4%·13.4% 등)와 비교했다.

export const RULES_CHECKED_AT = '2026-11-10';

export interface HouseInput {
    price: number; // 취득가액(낙찰가, 원)
    housesAfter: number; // 이번 취득을 포함한 세대 주택 수(1, 2, 3, 4 이상은 4)
    regulated: boolean; // 조정대상지역 안의 주택인가
    over85: boolean; // 전용면적 85㎡ 초과인가
}

export interface TaxBreakdown {
    price: number;
    rate: number; // 취득세율(%)
    acquisitionTax: number;
    educationTax: number;
    ruralTax: number;
    total: number;
    totalRate: number; // 총 부담률(%)
    heavy: boolean; // 다주택 중과가 적용됐는가
    basis: string; // 어떤 규칙을 적용했는지 한 줄 설명
}

const won = (n: number) => Math.floor(n);
const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** 1주택(일반) 유상취득 세율(%). 6억 이하 1%, 9억 초과 3%, 그 사이는 지방세법 제11조 제1항 제8호 나목 산식. */
export function generalHouseRate(price: number): number {
    if (price <= 600_000_000) return 1;
    if (price > 900_000_000) return 3;
    return round4((price * 2) / 3 / 100_000_000 - 3);
}

/** 다주택 중과 세율(%) — 중과가 아니면 null. 일시적 2주택·시가표준액 1억 이하 주택 등 예외는 반영하지 않는다. */
export function heavyHouseRate(housesAfter: number, regulated: boolean): number | null {
    if (housesAfter <= 1) return null;
    if (housesAfter === 2) return regulated ? 8 : null;
    if (housesAfter === 3) return regulated ? 12 : 8;
    return 12;
}

function finish(price: number, rate: number, acq: number, edu: number, rural: number, heavy: boolean, basis: string): TaxBreakdown {
    const total = acq + edu + rural;
    return {
        price,
        rate,
        acquisitionTax: acq,
        educationTax: edu,
        ruralTax: rural,
        total,
        totalRate: price > 0 ? round4((total / price) * 100) : 0,
        heavy,
        basis,
    };
}

export function houseTax({ price, housesAfter, regulated, over85 }: HouseInput): TaxBreakdown {
    const heavyRate = heavyHouseRate(housesAfter, regulated);
    if (heavyRate !== null) {
        // 중과 주택: 지방교육세 0.4%(표준세율 4% 기준), 농특세는 85㎡ 초과일 때 8%→0.6%, 12%→1.0%
        const acq = won((price * heavyRate) / 100);
        const edu = won(price * 0.004);
        const rural = over85 ? won((price * (heavyRate === 8 ? 0.6 : 1.0)) / 100) : 0;
        const count = housesAfter >= 4 ? '4주택 이상' : `${housesAfter}주택`;
        const basis = `${count}${regulated ? ' · 조정대상지역' : ' · 비조정대상지역'} 중과 ${heavyRate}%`;
        return finish(price, heavyRate, acq, edu, rural, true, basis);
    }
    const rate = generalHouseRate(price);
    const acq = won((price * rate) / 100);
    const edu = won(acq * 0.1); // 세율의 50% × 20%
    const rural = over85 ? won(price * 0.002) : 0;
    const basis = housesAfter === 1
        ? `1주택 일반세율 ${rate}%`
        : `${housesAfter}주택이지만 비조정대상지역이라 일반세율 ${rate}%`;
    return finish(price, rate, acq, edu, rural, false, basis);
}

/** 주택 외 부동산. building: 상가·오피스텔·건물·농지 외 토지(4%), farmland: 농지 매매(3%). */
export function nonHouseTax(price: number, kind: 'building' | 'farmland'): TaxBreakdown {
    if (kind === 'farmland') {
        return finish(price, 3, won(price * 0.03), won(price * 0.002), won(price * 0.002), false, '농지 유상취득 3%');
    }
    return finish(price, 4, won(price * 0.04), won(price * 0.004), won(price * 0.002), false, '주택 외 부동산 유상취득 4%');
}

// ── 차량 ────────────────────────────────────────────────────────────

export type VehicleKind = 'light' | 'passenger' | 'van_truck';
export type VehicleUse = 'personal' | 'business';

export const LIGHT_CAR_RELIEF_CAP = 750_000; // 지방세특례제한법 제67조: 비영업용 경차 취득세 75만 원까지 면제

export interface VehicleTax {
    price: number;
    rate: number;
    grossTax: number; // 감면 전 취득세
    relief: number; // 경차 감면액
    tax: number; // 납부 취득세
    basis: string;
}

export function vehicleTaxRate(kind: VehicleKind, use: VehicleUse): number {
    if (kind === 'light') return 4;
    if (use === 'business') return 4;
    return kind === 'passenger' ? 7 : 5;
}

export function vehicleTax(price: number, kind: VehicleKind, use: VehicleUse, applyLightRelief = true): VehicleTax {
    const rate = vehicleTaxRate(kind, use);
    const grossTax = won((price * rate) / 100);
    const relief = kind === 'light' && use === 'personal' && applyLightRelief ? Math.min(grossTax, LIGHT_CAR_RELIEF_CAP) : 0;
    const label = kind === 'light' ? '경자동차' : kind === 'passenger' ? '승용차' : '승합·화물차';
    return {
        price,
        rate,
        grossTax,
        relief,
        tax: grossTax - relief,
        basis: `${use === 'business' ? '영업용' : '비영업용'} ${label} ${rate}%${relief > 0 ? ' · 경차 감면 적용' : ''}`,
    };
}

/** 공채 즉시 매도 시 실제 부담액. faceRatePct: 매입률(취득가액 대비 %), discountPct: 할인율(액면 대비 %). */
export function bondCost(price: number, faceRatePct: number, discountPct: number): { face: number; cost: number } {
    const face = won((price * Math.max(0, faceRatePct)) / 100);
    return { face, cost: won((face * Math.max(0, discountPct)) / 100) };
}

/**
 * 총비용(낙찰가 + 세금)이 budget 을 넘지 않는 최대 낙찰가를 구한다.
 * 세율이 가격에 따라 달라지므로(6~9억 구간) 이분 탐색한다. 만 원 단위로 내림.
 */
export function maxBidWithinBudget(budget: number, taxOf: (price: number) => number): number {
    if (budget <= 0) return 0;
    let lo = 0;
    let hi = budget;
    for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (mid + taxOf(mid) <= budget) lo = mid;
        else hi = mid;
    }
    return Math.floor(lo / 10000) * 10000;
}
