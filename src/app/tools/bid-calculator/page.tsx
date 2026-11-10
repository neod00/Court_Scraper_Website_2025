'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    RULES_CHECKED_AT,
    houseTax,
    maxBidWithinBudget,
    nonHouseTax,
    vehicleTax,
    type VehicleKind,
    type VehicleUse,
} from '@/lib/acquisitionTax';

type PropertyType = 'house' | 'building' | 'farmland';

const formatNumber = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    return num ? parseInt(num, 10).toLocaleString('ko-KR') : '';
};
const parseNumber = (value: string) => parseInt(value.replace(/,/g, ''), 10) || 0;
const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;
const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '-');

function MoneyField({ id, label, hint, value, onChange }: { id: string; label: string; hint?: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
            <div className="relative">
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => onChange(formatNumber(e.target.value))}
                    placeholder="0"
                    className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
            </div>
        </div>
    );
}

function Toggle<T extends string | number | boolean>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
    return (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
            {options.map((o) => (
                <button
                    key={String(o.value)}
                    type="button"
                    aria-pressed={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={`py-2 px-2 rounded-lg text-sm font-medium border transition-colors ${value === o.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-green-100">{label}</dt>
            <dd className={strong ? 'font-bold' : 'font-medium'}>{value}</dd>
        </div>
    );
}

export default function BidCalculatorPage() {
    const [activeTab, setActiveTab] = useState<'property' | 'vehicle'>('property');

    // 부동산
    const [propertyType, setPropertyType] = useState<PropertyType>('house');
    const [appraisedValue, setAppraisedValue] = useState('');
    const [minimumBid, setMinimumBid] = useState('');
    const [marketPrice, setMarketPrice] = useState('');
    const [repairCost, setRepairCost] = useState('');
    const [otherCost, setOtherCost] = useState('');
    const [housesAfter, setHousesAfter] = useState(1);
    const [regulated, setRegulated] = useState(false);
    const [over85, setOver85] = useState(false);
    const [targetProfit, setTargetProfit] = useState(15);

    // 차량
    const [vehicleKind, setVehicleKind] = useState<VehicleKind>('passenger');
    const [vehicleUse, setVehicleUse] = useState<VehicleUse>('personal');
    const [vehicleMarket, setVehicleMarket] = useState('');
    const [vehicleMinimum, setVehicleMinimum] = useState('');
    const [vehicleRepair, setVehicleRepair] = useState('');
    const [vehicleOther, setVehicleOther] = useState('');
    const [targetDiscount, setTargetDiscount] = useState(15);

    const propertyResult = useMemo(() => {
        const appraised = parseNumber(appraisedValue);
        const minimum = parseNumber(minimumBid);
        const market = parseNumber(marketPrice) || appraised;
        const extra = parseNumber(repairCost) + parseNumber(otherCost);
        if (!market) return null;

        const taxOf = (price: number) =>
            propertyType === 'house'
                ? houseTax({ price, housesAfter, regulated, over85 }).total
                : nonHouseTax(price, propertyType).total;

        // 총 투입(낙찰가 + 세금 + 비용) × (1 + 목표 이익률) = 예상 매도가 가 되는 낙찰가
        const budget = market / (1 + targetProfit / 100) - extra;
        const maxBid = maxBidWithinBudget(budget, taxOf);
        const belowMinimum = minimum > 0 && maxBid < minimum;
        const bid = belowMinimum ? minimum : maxBid;
        const tax = taxOf(bid);
        const invest = bid + tax + extra;
        const profit = market - invest;
        return { appraised, minimum, market, extra, maxBid, bid, tax, invest, profit, belowMinimum };
    }, [appraisedValue, minimumBid, marketPrice, repairCost, otherCost, propertyType, housesAfter, regulated, over85, targetProfit]);

    const vehicleResult = useMemo(() => {
        const market = parseNumber(vehicleMarket);
        const minimum = parseNumber(vehicleMinimum);
        const extra = parseNumber(vehicleRepair) + parseNumber(vehicleOther);
        if (!market) return null;
        const taxOf = (price: number) => vehicleTax(price, vehicleKind, vehicleUse).tax;
        // 총 투입이 시세보다 목표 할인율만큼 낮아지는 낙찰가
        const budget = market * (1 - targetDiscount / 100) - extra;
        const maxBid = maxBidWithinBudget(budget, taxOf);
        const belowMinimum = minimum > 0 && maxBid < minimum;
        const bid = belowMinimum ? minimum : maxBid;
        const tax = taxOf(bid);
        const invest = bid + tax + extra;
        return { market, minimum, extra, maxBid, bid, tax, invest, saving: market - invest, belowMinimum };
    }, [vehicleMarket, vehicleMinimum, vehicleRepair, vehicleOther, vehicleKind, vehicleUse, targetDiscount]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8" aria-label="breadcrumb">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-indigo-600">계산기</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">입찰가 계산기</span>
            </nav>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">입찰가 계산기</h1>
                <p className="text-gray-600 mt-2 leading-relaxed">
                    예상 매도가와 목표 이익률을 넣으면 취득세와 수리·명도 비용을 빼고 써낼 수 있는 입찰가 상한을 거꾸로 계산합니다.
                    회차마다 최저입찰가가 내려가는 회생·파산 매각 공고에서 몇 회차부터 조건이 맞는지 가늠할 때 씁니다.
                </p>
            </header>

            <div className="flex border-b border-gray-200 mb-8" role="tablist">
                {(['property', 'vehicle'] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab === 'property' ? '부동산' : '차량'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    {activeTab === 'property' ? (
                        <>
                            <div>
                                <p className="block text-sm font-medium text-gray-700 mb-2">물건 종류</p>
                                <Toggle value={propertyType} onChange={setPropertyType} options={[{ value: 'house', label: '주택' }, { value: 'building', label: '상가·토지' }, { value: 'farmland', label: '농지' }]} />
                            </div>
                            <MoneyField id="bc-market" label="예상 매도가 (시세)" hint="비워 두면 감정가를 시세로 씁니다." value={marketPrice} onChange={setMarketPrice} />
                            <div className="grid grid-cols-2 gap-3">
                                <MoneyField id="bc-appraised" label="감정가" value={appraisedValue} onChange={setAppraisedValue} />
                                <MoneyField id="bc-min" label="현재 최저입찰가" value={minimumBid} onChange={setMinimumBid} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <MoneyField id="bc-repair" label="수리비" value={repairCost} onChange={setRepairCost} />
                                <MoneyField id="bc-other" label="명도·기타 비용" value={otherCost} onChange={setOtherCost} />
                            </div>
                            {propertyType === 'house' && (
                                <>
                                    <div>
                                        <p className="block text-sm font-medium text-gray-700 mb-2">취득 후 세대 주택 수</p>
                                        <Toggle value={housesAfter} onChange={setHousesAfter} options={[{ value: 1, label: '1주택' }, { value: 2, label: '2주택' }, { value: 3, label: '3주택' }, { value: 4, label: '4+' }]} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Toggle value={regulated} onChange={setRegulated} options={[{ value: false, label: '비조정' }, { value: true, label: '조정지역' }]} />
                                        <Toggle value={over85} onChange={setOver85} options={[{ value: false, label: '85㎡ 이하' }, { value: true, label: '85㎡ 초과' }]} />
                                    </div>
                                </>
                            )}
                            <div>
                                <label htmlFor="bc-profit" className="block text-sm font-medium text-gray-700 mb-2">
                                    목표 이익률: <span className="text-indigo-600 font-bold">{targetProfit}%</span>
                                </label>
                                <input id="bc-profit" type="range" min={0} max={50} step={1} value={targetProfit} onChange={(e) => setTargetProfit(Number(e.target.value))} className="w-full accent-indigo-600" />
                                <div className="flex justify-between text-xs text-gray-400"><span>0% (손익분기)</span><span>50%</span></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="block text-sm font-medium text-gray-700 mb-2">차종</p>
                                <Toggle value={vehicleKind} onChange={setVehicleKind} options={[{ value: 'light', label: '경차' }, { value: 'passenger', label: '승용차' }, { value: 'van_truck', label: '승합·화물' }]} />
                            </div>
                            <div>
                                <p className="block text-sm font-medium text-gray-700 mb-2">용도</p>
                                <Toggle value={vehicleUse} onChange={setVehicleUse} options={[{ value: 'personal', label: '비영업용' }, { value: 'business', label: '영업용' }]} />
                            </div>
                            <MoneyField id="bc-vmarket" label="중고차 시세" hint="같은 연식·주행거리 매물의 시세를 직접 조사해 넣으세요." value={vehicleMarket} onChange={setVehicleMarket} />
                            <MoneyField id="bc-vmin" label="현재 최저입찰가" value={vehicleMinimum} onChange={setVehicleMinimum} />
                            <div className="grid grid-cols-2 gap-3">
                                <MoneyField id="bc-vrepair" label="수리비" value={vehicleRepair} onChange={setVehicleRepair} />
                                <MoneyField id="bc-vother" label="이전·탁송 등" value={vehicleOther} onChange={setVehicleOther} />
                            </div>
                            <div>
                                <label htmlFor="bc-disc" className="block text-sm font-medium text-gray-700 mb-2">
                                    시세 대비 목표 절감률: <span className="text-indigo-600 font-bold">{targetDiscount}%</span>
                                </label>
                                <input id="bc-disc" type="range" min={0} max={40} step={1} value={targetDiscount} onChange={(e) => setTargetDiscount(Number(e.target.value))} className="w-full accent-indigo-600" />
                                <div className="flex justify-between text-xs text-gray-400"><span>0%</span><span>40%</span></div>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-lg p-6 text-white" aria-live="polite">
                    <h2 className="text-lg font-bold mb-6">계산 결과</h2>
                    {activeTab === 'property' && propertyResult ? (
                        <div className="space-y-4">
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="text-green-100 text-sm">입찰가 상한</div>
                                <div className="text-3xl font-bold">{propertyResult.maxBid > 0 ? won(propertyResult.maxBid) : '조건 불충족'}</div>
                                <div className="text-green-50 text-xs mt-1">
                                    감정가 대비 {pct(propertyResult.maxBid, propertyResult.appraised)} · 최저입찰가 대비 {pct(propertyResult.maxBid, propertyResult.minimum)}
                                </div>
                            </div>
                            {propertyResult.belowMinimum && (
                                <p className="rounded-lg bg-amber-400/20 border border-amber-200/40 px-3 py-2 text-sm">
                                    목표 이익률로는 현재 최저입찰가보다 낮게 써야 합니다. 아래는 최저입찰가로 낙찰받을 때의 결과입니다.
                                </p>
                            )}
                            <dl className="space-y-3">
                                <Row label="계산한 낙찰가" value={won(propertyResult.bid)} />
                                <Row label="취득세 합계" value={won(propertyResult.tax)} />
                                <Row label="수리·명도·기타" value={won(propertyResult.extra)} />
                                <Row label="총 투입" value={won(propertyResult.invest)} strong />
                            </dl>
                            <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                                <span>예상 차익</span>
                                <span className="text-2xl font-bold">{won(propertyResult.profit)}</span>
                            </div>
                            <p className="text-xs text-green-100 text-right">총 투입 대비 {pct(propertyResult.profit, propertyResult.invest)}</p>
                        </div>
                    ) : activeTab === 'vehicle' && vehicleResult ? (
                        <div className="space-y-4">
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="text-green-100 text-sm">입찰가 상한</div>
                                <div className="text-3xl font-bold">{vehicleResult.maxBid > 0 ? won(vehicleResult.maxBid) : '조건 불충족'}</div>
                                <div className="text-green-50 text-xs mt-1">시세 대비 {pct(vehicleResult.maxBid, vehicleResult.market)}</div>
                            </div>
                            {vehicleResult.belowMinimum && (
                                <p className="rounded-lg bg-amber-400/20 border border-amber-200/40 px-3 py-2 text-sm">
                                    목표 절감률로는 현재 최저입찰가보다 낮게 써야 합니다. 아래는 최저입찰가로 낙찰받을 때의 결과입니다.
                                </p>
                            )}
                            <dl className="space-y-3">
                                <Row label="계산한 낙찰가" value={won(vehicleResult.bid)} />
                                <Row label="취득세" value={won(vehicleResult.tax)} />
                                <Row label="수리·이전 등" value={won(vehicleResult.extra)} />
                                <Row label="총 투입" value={won(vehicleResult.invest)} strong />
                            </dl>
                            <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                                <span>시세 대비 절감</span>
                                <span className="text-2xl font-bold">{won(vehicleResult.saving)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-green-100 py-12">
                            {activeTab === 'property' ? '예상 매도가나 감정가를 입력하면 바로 계산합니다.' : '중고차 시세를 입력하면 바로 계산합니다.'}
                        </p>
                    )}
                </div>
            </div>

            <section className="mt-12" aria-labelledby="how-heading">
                <h2 id="how-heading" className="text-xl font-bold text-gray-900 mb-4">계산 방법</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 leading-relaxed">
                    <li>예상 매도가를 (1 + 목표 이익률)로 나눠 쓸 수 있는 총 투입 한도를 구합니다.</li>
                    <li>한도에서 수리비와 명도·기타 비용을 뺍니다.</li>
                    <li>남은 금액 안에서 낙찰가와 그 낙찰가에 붙는 취득세의 합이 넘지 않는 가장 높은 낙찰가를 찾습니다. 주택은 가격 구간마다 세율이 달라서 한 번에 나누지 않고 반복 계산합니다.</li>
                    <li>결과는 만 원 단위로 내립니다. 취득세는 <Link href="/tools/acquisition-tax" className="text-indigo-600 underline">취득세 계산기</Link>와 같은 규칙(세율 확인일 {RULES_CHECKED_AT})을 씁니다.</li>
                </ol>
            </section>

            <section className="mt-10" aria-labelledby="round-heading">
                <h2 id="round-heading" className="text-xl font-bold text-gray-900 mb-4">회차표와 함께 쓰는 법</h2>
                <p className="text-gray-700 leading-relaxed">
                    회생·파산 매각 공고는 유찰될 때마다 최저입찰가를 일정 비율로 낮추는 경우가 많습니다.
                    공고 상세 페이지의 회차별 최저입찰가 표에서 각 회차 금액을 현재 최저입찰가 칸에 넣어 보면, 입찰가 상한이 최저입찰가보다 높아지는 첫 회차를 찾을 수 있습니다.
                    다만 앞 회차에서 다른 사람이 낙찰받으면 다음 회차는 열리지 않습니다.
                </p>
            </section>

            <section className="mt-10 bg-amber-50 rounded-xl p-6 border border-amber-100">
                <h2 className="text-base font-bold text-amber-900 mb-3">계산하지 않는 것</h2>
                <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 시세, 수리비, 명도 비용은 직접 조사한 값을 넣어야 하며 결과는 그 값이 그대로 실현된다는 가정입니다.</li>
                    <li>• 양도소득세, 보유세, 대출 이자, 중개보수는 넣지 않았습니다.</li>
                    <li>• 로옥션은 특정 입찰가나 결과를 권하지 않습니다. 권리관계와 매각 조건은 공고 원문으로 확인하세요.</li>
                </ul>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/tools/acquisition-tax" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-200">취득세 계산기 →</Link>
                <Link href="/tools/roi-calculator" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-200">매도·임대 손익 계산기 →</Link>
            </div>
        </div>
    );
}
