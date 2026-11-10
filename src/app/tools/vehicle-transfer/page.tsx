'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RULES_CHECKED_AT, bondCost, vehicleTax, type VehicleKind, type VehicleUse } from '@/lib/acquisitionTax';

const formatNumber = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    return num ? parseInt(num, 10).toLocaleString('ko-KR') : '';
};
const parseNumber = (value: string) => parseInt(value.replace(/,/g, ''), 10) || 0;
const parsePct = (value: string) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
};
const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

const KINDS: { value: VehicleKind; label: string; hint: string }[] = [
    { value: 'light', label: '경차', hint: '1,000cc 미만' },
    { value: 'passenger', label: '승용차', hint: '경차 외' },
    { value: 'van_truck', label: '승합·화물', hint: '승합차·트럭' },
];

const FAQ = [
    {
        q: '공채 매입률은 어디서 확인하나요?',
        a: '자동차를 등록할 때 사는 지역개발채권·도시철도채권의 매입 비율은 시·도 조례로 정하며 차종과 배기량, 신규·이전 등록 여부에 따라 다릅니다. 등록할 시·도의 차량등록사업소나 위택스 안내에서 비율을 확인해 입력하세요. 면제 대상이면 0을 넣습니다.',
    },
    {
        q: '공채 할인율은 무엇인가요?',
        a: '대부분 공채를 사자마자 은행에 되팔고 그 차액만 부담합니다. 할인율은 액면 대비 손실 비율이며 채권 금리에 따라 매일 바뀝니다. 등록 당일 은행 창구나 등록사업소에서 알려 줍니다.',
    },
    {
        q: '법원 매각 차량에 붙은 압류와 저당은 누가 지우나요?',
        a: '경매로 산 차량은 매각허가 후 법원 촉탁으로 말소되는 것이 원칙입니다. 관재인 매각은 공고와 계약서에 정한 조건을 따르므로, 말소 책임과 비용 부담 주체를 입찰 전에 공고 원문에서 확인하세요.',
    },
];

export default function VehicleTransferPage() {
    const [vehiclePrice, setVehiclePrice] = useState('');
    const [kind, setKind] = useState<VehicleKind>('passenger');
    const [use, setUse] = useState<VehicleUse>('personal');
    const [bondRate, setBondRate] = useState('');
    const [bondDiscount, setBondDiscount] = useState('');
    const [otherCost, setOtherCost] = useState('');

    const price = parseNumber(vehiclePrice);
    const tax = price ? vehicleTax(price, kind, use) : null;
    const bond = price ? bondCost(price, parsePct(bondRate), parsePct(bondDiscount)) : null;
    const other = parseNumber(otherCost);
    const totalCost = tax && bond ? tax.tax + bond.cost + other : 0;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8" aria-label="breadcrumb">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-indigo-600">계산기</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">차량 이전비 계산기</span>
            </nav>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">차량 이전비 계산기</h1>
                <p className="text-gray-600 mt-2 leading-relaxed">
                    회생·파산 매각이나 경매로 산 차량을 내 이름으로 이전 등록할 때 드는 취득세, 공채 부담액, 기타 비용을 합산합니다.
                    취득세는 법령 세율로 계산하고, 지역마다 다른 공채 비율은 직접 입력합니다. 세율 확인일 {RULES_CHECKED_AT}.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="text-lg font-bold text-gray-900">차량 정보 입력</h2>

                    <div>
                        <p className="block text-sm font-medium text-gray-700 mb-2">차종</p>
                        <div className="grid grid-cols-3 gap-2">
                            {KINDS.map((k) => (
                                <button
                                    key={k.value}
                                    type="button"
                                    aria-pressed={kind === k.value}
                                    onClick={() => setKind(k.value)}
                                    className={`py-2 px-2 rounded-lg text-sm font-medium border transition-colors ${kind === k.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
                                >
                                    {k.label}
                                    <span className={`block text-[11px] mt-0.5 ${kind === k.value ? 'text-indigo-100' : 'text-gray-400'}`}>{k.hint}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="block text-sm font-medium text-gray-700 mb-2">용도</p>
                        <div className="grid grid-cols-2 gap-2">
                            {([['personal', '비영업용'], ['business', '영업용']] as const).map(([v, label]) => (
                                <button
                                    key={v}
                                    type="button"
                                    aria-pressed={use === v}
                                    onClick={() => setUse(v)}
                                    className={`py-2 px-2 rounded-lg text-sm font-medium border transition-colors ${use === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="vt-price" className="block text-sm font-medium text-gray-700 mb-2">취득가액 (낙찰가)</label>
                        <div className="relative">
                            <input
                                id="vt-price"
                                type="text"
                                inputMode="numeric"
                                value={vehiclePrice}
                                onChange={(e) => setVehiclePrice(formatNumber(e.target.value))}
                                placeholder="0"
                                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-right text-lg"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="vt-bond" className="block text-sm font-medium text-gray-700 mb-2">공채 매입률 (%)</label>
                            <input
                                id="vt-bond"
                                type="text"
                                inputMode="decimal"
                                value={bondRate}
                                onChange={(e) => setBondRate(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="예: 0"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-right"
                            />
                        </div>
                        <div>
                            <label htmlFor="vt-disc" className="block text-sm font-medium text-gray-700 mb-2">공채 할인율 (%)</label>
                            <input
                                id="vt-disc"
                                type="text"
                                inputMode="decimal"
                                value={bondDiscount}
                                onChange={(e) => setBondDiscount(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="예: 0"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-right"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 -mt-2">등록할 시·도 차량등록사업소에서 확인한 값을 넣으세요. 비워 두면 0으로 계산합니다.</p>

                    <div>
                        <label htmlFor="vt-other" className="block text-sm font-medium text-gray-700 mb-2">기타 비용 (번호판·인지·대행 수수료 등)</label>
                        <div className="relative">
                            <input
                                id="vt-other"
                                type="text"
                                inputMode="numeric"
                                value={otherCost}
                                onChange={(e) => setOtherCost(formatNumber(e.target.value))}
                                placeholder="0"
                                className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg text-right"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-lg p-6 text-white" aria-live="polite">
                    <h2 className="text-lg font-bold mb-6">예상 이전 비용</h2>
                    {tax && bond ? (
                        <div className="space-y-4">
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="text-emerald-100 text-sm">취득세율</div>
                                <div className="text-3xl font-bold">{tax.rate}%</div>
                                <div className="text-emerald-50 text-xs mt-1">{tax.basis}</div>
                            </div>
                            <dl className="space-y-3">
                                <div className="flex justify-between"><dt className="text-emerald-100">취득세</dt><dd className="font-medium">{won(tax.tax)}</dd></div>
                                {tax.relief > 0 && (
                                    <div className="flex justify-between text-sm"><dt className="text-emerald-100">경차 감면 반영</dt><dd>−{won(tax.relief)}</dd></div>
                                )}
                                <div className="flex justify-between"><dt className="text-emerald-100">공채 부담액</dt><dd className="font-medium">{won(bond.cost)}</dd></div>
                                {bond.face > 0 && (
                                    <div className="flex justify-between text-sm"><dt className="text-emerald-100">공채 액면</dt><dd>{won(bond.face)}</dd></div>
                                )}
                                <div className="flex justify-between"><dt className="text-emerald-100">기타 비용</dt><dd className="font-medium">{won(other)}</dd></div>
                            </dl>
                            <div className="border-t border-white/20 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">이전 비용 합계</span>
                                    <span className="text-2xl font-bold">{won(totalCost)}</span>
                                </div>
                                <div className="text-emerald-100 text-sm text-right mt-1">낙찰가 포함 {won(price + totalCost)}</div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-emerald-100 py-12">취득가액을 입력하면 바로 계산합니다.</p>
                    )}
                </div>
            </div>

            <section className="mt-12" aria-labelledby="rate-heading">
                <h2 id="rate-heading" className="text-xl font-bold text-gray-900 mb-4">차량 취득세율 (지방세법 제12조)</h2>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th scope="col" className="text-left px-4 py-3 font-medium">차종</th>
                                <th scope="col" className="text-right px-4 py-3 font-medium">비영업용</th>
                                <th scope="col" className="text-right px-4 py-3 font-medium">영업용</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-gray-100"><th scope="row" className="text-left px-4 py-3 font-normal">승용차</th><td className="text-right px-4 py-3">7%</td><td className="text-right px-4 py-3">4%</td></tr>
                            <tr className="border-t border-gray-100"><th scope="row" className="text-left px-4 py-3 font-normal">승합·화물차</th><td className="text-right px-4 py-3">5%</td><td className="text-right px-4 py-3">4%</td></tr>
                            <tr className="border-t border-gray-100"><th scope="row" className="text-left px-4 py-3 font-normal">경자동차</th><td className="text-right px-4 py-3">4% (75만 원까지 감면)</td><td className="text-right px-4 py-3">4%</td></tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">경차 감면은 지방세특례제한법 제67조에 따르며 적용기한이 있습니다. 하이브리드·전기차 감면은 이 계산기에 넣지 않았습니다.</p>
            </section>

            <section className="mt-10 bg-blue-50 rounded-xl p-6 border border-blue-100" aria-labelledby="doc-heading">
                <h2 id="doc-heading" className="text-base font-bold text-blue-900 mb-3">법원 매각 차량 이전 등록 준비물</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                        <h3 className="font-bold mb-1">서류</h3>
                        <ul className="space-y-0.5">
                            <li>• 경매로 샀다면 매각허가결정 정본과 대금완납 증명</li>
                            <li>• 관재인·관리인 매각이면 매매계약서와 법원 허가서 사본 등 관재인이 안내하는 서류</li>
                            <li>• 공통으로 신분증, 자동차보험 가입증명서</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">입찰 전 확인</h3>
                        <ul className="space-y-0.5">
                            <li>• 압류·저당 말소 책임과 비용을 누가 지는지</li>
                            <li>• 체납 과태료와 자동차세가 따라오는지</li>
                            <li>• 차량 인도 장소와 열쇠·서류 인계 방법</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mt-10" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
                <div className="space-y-3">
                    {FAQ.map((item) => (
                        <details key={item.q} className="rounded-xl border border-gray-200 bg-white p-5">
                            <summary className="font-semibold text-gray-900 cursor-pointer">{item.q}</summary>
                            <p className="mt-3 text-sm text-gray-700 leading-relaxed">{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            <section className="mt-10 bg-amber-50 rounded-xl p-6 border border-amber-100">
                <h2 className="text-base font-bold text-amber-900 mb-3">계산하지 않는 것</h2>
                <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 공채 매입률·할인율과 기타 비용은 입력값을 그대로 더합니다.</li>
                    <li>• 실제 금액은 등록할 시·도 차량등록사업소에서 확정됩니다.</li>
                    <li>• 법령이 바뀌면 결과가 달라집니다. 위택스(wetax.go.kr)와 국가법령정보센터(law.go.kr)에서 확인하세요.</li>
                </ul>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/tools/acquisition-tax" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-200">취득세 계산기 →</Link>
                <Link href="/category/vehicle" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-200">차량 매각 공고 보기 →</Link>
            </div>
        </div>
    );
}
