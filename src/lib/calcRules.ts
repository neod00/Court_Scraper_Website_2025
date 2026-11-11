// 계산기 6종의 계산 규칙(지분·면적, 회차별 총비용, 보증금·잔금, 중개보수, 대출 상환, 채권 회수율).
// 화면과 분리해 순수 함수로 둔다. 바꾸면 scratchpad 의 calc_test.cjs 같은 사례 비교로 다시 확인할 것.
// 중개보수 요율은 공인중개사법 시행규칙 별표 1(2021-10-19 시행) 기준. 확인일 CALC_RULES_CHECKED_AT.

export const CALC_RULES_CHECKED_AT = '2026-11-11';
export const PYEONG_M2 = 3.305785; // 1평 = 400/121 ㎡

const floorWon = (n: number) => Math.floor(n);

// ── 1. 지분·면적 ───────────────────────────────────────────────

/** '50951분의 329', '329/50951', '1/3' 같은 표기를 [분자, 분모]로. 못 읽으면 null. */
export function parseShare(input: string): [number, number] | null {
    const t = input.replace(/[,\s]/g, '');
    let m = t.match(/^([\d.]+)분의([\d.]+)$/);
    if (m) return [Number(m[2]), Number(m[1])];
    m = t.match(/^([\d.]+)\/([\d.]+)$/);
    if (m) return [Number(m[1]), Number(m[2])];
    return null;
}

export interface ShareResult {
    ratio: number; // 지분 비율(0~1)
    shareM2: number;
    sharePyeong: number;
    totalPyeong: number;
    pricePerM2: number | null;
    pricePerPyeong: number | null;
    wholeEquivalent: number | null; // 지분 가격을 전체로 환산
}

export function shareArea(totalM2: number, num: number, den: number, price = 0): ShareResult | null {
    if (!(totalM2 > 0) || !(num > 0) || !(den > 0) || num > den) return null;
    const ratio = num / den;
    const shareM2 = totalM2 * ratio;
    return {
        ratio,
        shareM2,
        sharePyeong: shareM2 / PYEONG_M2,
        totalPyeong: totalM2 / PYEONG_M2,
        pricePerM2: price > 0 ? price / shareM2 : null,
        pricePerPyeong: price > 0 ? price / (shareM2 / PYEONG_M2) : null,
        wholeEquivalent: price > 0 ? price / ratio : null,
    };
}

// ── 2. 회차별 최저가 ──────────────────────────────────────────

/** 1회차 최저가에서 회차마다 dropPct% 씩 낮춘 최저가(원 단위 내림). mode: 'rate' 직전 회차 기준, 'flat' 1회차 기준 정액. */
export function roundPrices(first: number, rounds: number, dropPct: number, mode: 'rate' | 'flat' = 'rate'): number[] {
    const out: number[] = [];
    for (let i = 0; i < rounds; i++) {
        if (i === 0) out.push(floorWon(first));
        else if (mode === 'rate') out.push(floorWon(out[i - 1] * (1 - dropPct / 100)));
        else out.push(Math.max(0, floorWon(first * (1 - (dropPct / 100) * i))));
    }
    return out;
}

/** '3,949,580 / 2,764,700' 처럼 직접 적은 금액 목록. 숫자가 2개 미만이면 null. */
export function parsePriceList(input: string): number[] | null {
    const nums = (input.match(/\d[\d,]*/g) || []).map((s) => Number(s.replace(/,/g, ''))).filter((n) => n > 0);
    return nums.length >= 2 ? nums : null;
}

// ── 3. 입찰보증금·잔금 ─────────────────────────────────────────

export interface DepositResult {
    deposit: number;
    balance: number;
    dueDate: string | null; // YYYY-MM-DD
}

/** 보증금 = 기준금액 × 비율(원 미만 올림이 흔하지만 공고마다 다르므로 내림 없이 원 단위 반올림). 잔금 = 입찰가 − 보증금. */
export function depositPlan(minPrice: number, bidPrice: number, ratePct: number, base: 'min' | 'bid', awardDate: string | null, dueDays: number): DepositResult {
    const deposit = Math.round((base === 'min' ? minPrice : bidPrice) * (ratePct / 100));
    let dueDate: string | null = null;
    if (awardDate && /^\d{4}-\d{2}-\d{2}$/.test(awardDate) && dueDays >= 0) {
        dueDate = new Date(Date.parse(`${awardDate}T00:00:00Z`) + dueDays * 86400000).toISOString().slice(0, 10);
    }
    return { deposit, balance: Math.max(0, bidPrice - deposit), dueDate };
}

// ── 4. 중개보수 ───────────────────────────────────────────────

export type BrokerKind = 'house_sale' | 'house_lease' | 'officetel_sale' | 'officetel_lease' | 'other';

interface Bracket { upTo: number; rate: number; cap: number | null }

// 거래금액 '미만' 구간. 공인중개사법 시행규칙 별표 1(2021-10-19).
const HOUSE_SALE: Bracket[] = [
    { upTo: 50_000_000, rate: 0.6, cap: 250_000 },
    { upTo: 200_000_000, rate: 0.5, cap: 800_000 },
    { upTo: 900_000_000, rate: 0.4, cap: null },
    { upTo: 1_200_000_000, rate: 0.5, cap: null },
    { upTo: 1_500_000_000, rate: 0.6, cap: null },
    { upTo: Infinity, rate: 0.7, cap: null },
];
const HOUSE_LEASE: Bracket[] = [
    { upTo: 50_000_000, rate: 0.5, cap: 200_000 },
    { upTo: 100_000_000, rate: 0.4, cap: 300_000 },
    { upTo: 600_000_000, rate: 0.3, cap: null },
    { upTo: 1_200_000_000, rate: 0.4, cap: null },
    { upTo: 1_500_000_000, rate: 0.5, cap: null },
    { upTo: Infinity, rate: 0.6, cap: null },
];

/** 월세 거래금액 = 보증금 + 월세×100. 그 값이 5천만 원 미만이면 보증금 + 월세×70. */
export function leaseAmount(deposit: number, monthly: number): number {
    const a = deposit + monthly * 100;
    return a < 50_000_000 ? deposit + monthly * 70 : a;
}

export interface BrokerResult {
    amount: number; // 거래금액
    rate: number; // 상한 요율(%)
    cap: number | null; // 한도액
    fee: number; // 상한 보수(부가세 별도)
    vat: number; // 일반과세자 10%
    note: string;
}

export function brokerageFee(kind: BrokerKind, amount: number): BrokerResult | null {
    if (!(amount > 0)) return null;
    let rate: number;
    let cap: number | null = null;
    let note: string;
    if (kind === 'house_sale' || kind === 'house_lease') {
        const b = (kind === 'house_sale' ? HOUSE_SALE : HOUSE_LEASE).find((x) => amount < x.upTo)!;
        rate = b.rate;
        cap = b.cap;
        note = '주택 상한 요율·한도액(시행규칙 별표 1). 실제 요율은 상한 안에서 협의합니다.';
    } else if (kind === 'officetel_sale') {
        rate = 0.5;
        note = '전용 85㎡ 이하·주거용 설비를 갖춘 오피스텔 매매 상한. 요건을 못 갖추면 0.9% 이내 협의.';
    } else if (kind === 'officetel_lease') {
        rate = 0.4;
        note = '전용 85㎡ 이하·주거용 설비를 갖춘 오피스텔 임대차 상한. 요건을 못 갖추면 0.9% 이내 협의.';
    } else {
        rate = 0.9;
        note = '토지·상가 등 주택 외 중개대상물은 0.9% 이내에서 협의합니다.';
    }
    let fee = floorWon((amount * rate) / 100);
    if (cap !== null) fee = Math.min(fee, cap);
    return { amount, rate, cap, fee, vat: floorWon(fee * 0.1), note };
}

// ── 5. 대출 상환 ──────────────────────────────────────────────

export type LoanMethod = 'annuity' | 'equal_principal' | 'bullet';

export interface LoanRow { month: number; payment: number; principal: number; interest: number; balance: number }
export interface LoanResult { rows: LoanRow[]; totalInterest: number; totalPayment: number; firstPayment: number; maxPayment: number }

/** 원리금균등·원금균등·만기일시. graceMonths 동안은 이자만 낸다(만기일시는 전 기간 이자만). 원 단위 반올림. */
export function loanSchedule(principal: number, annualRatePct: number, months: number, method: LoanMethod, graceMonths = 0): LoanResult | null {
    if (!(principal > 0) || !(months > 0) || annualRatePct < 0) return null;
    const r = annualRatePct / 100 / 12;
    const grace = method === 'bullet' ? months - 1 : Math.min(Math.max(0, graceMonths), months - 1);
    const n = months - grace;
    const rows: LoanRow[] = [];
    let bal = principal;
    const annuity = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    for (let m = 1; m <= months; m++) {
        const interest = bal * r;
        let principalPart = 0;
        if (m > grace) {
            if (method === 'annuity') principalPart = annuity - interest;
            else if (method === 'equal_principal') principalPart = principal / n;
            else principalPart = bal; // bullet: 마지막 달 전액
        }
        if (m === months) principalPart = bal; // 반올림 잔차 정리
        bal = Math.max(0, bal - principalPart);
        rows.push({ month: m, payment: Math.round(principalPart + interest), principal: Math.round(principalPart), interest: Math.round(interest), balance: Math.round(bal) });
    }
    const totalInterest = rows.reduce((s, x) => s + x.interest, 0);
    const totalPayment = rows.reduce((s, x) => s + x.payment, 0);
    return { rows, totalInterest, totalPayment, firstPayment: rows[0].payment, maxPayment: Math.max(...rows.map((x) => x.payment)) };
}

// ── 6. 채권 회수율 ────────────────────────────────────────────

export interface BondResult {
    recovery: number; // 예상 회수액
    profit: number; // 순손익
    roi: number; // 총투입 대비 %
    annualized: number | null; // 연 환산 %(단리)
    breakEvenPct: number; // 손익분기 회수율(액면 대비 %)
    pricePct: number; // 입찰가/액면 %
}

export function bondRecovery(face: number, price: number, recoveryPct: number, costs: number, months: number): BondResult | null {
    if (!(face > 0) || !(price > 0)) return null;
    const recovery = floorWon((face * recoveryPct) / 100);
    const invest = price + Math.max(0, costs);
    const profit = recovery - invest;
    const roi = (profit / invest) * 100;
    return {
        recovery,
        profit,
        roi,
        annualized: months > 0 ? (roi * 12) / months : null,
        breakEvenPct: (invest / face) * 100,
        pricePct: (price / face) * 100,
    };
}
