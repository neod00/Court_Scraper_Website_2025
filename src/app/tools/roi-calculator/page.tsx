'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

type InvestmentType = 'resale' | 'rental';

const formatNumber = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    return num ? parseInt(num).toLocaleString() : '';
};

const parseNumber = (value: string) => {
    return parseInt(value.replace(/,/g, '')) || 0;
};

// InputField를 외부 컴포넌트로 분리하여 리렌더 시 재생성 방지
function InputField({ label, value, onChange, placeholder = '0', unit = '원', hint }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; unit?: string; hint?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const cursorPos = input.selectionStart || 0;

        // 커서 위치 전까지의 숫자 개수를 세어 둠
        const digitsBeforeCursor = input.value.slice(0, cursorPos).replace(/[^0-9]/g, '').length;

        const formatted = formatNumber(input.value);
        onChange(formatted);

        // 포맷팅 후 커서 위치를 숫자 기준으로 복원
        requestAnimationFrame(() => {
            if (inputRef.current) {
                let digitCount = 0;
                let newPos = 0;
                for (let i = 0; i < formatted.length; i++) {
                    if (/[0-9]/.test(formatted[i])) {
                        digitCount++;
                    }
                    if (digitCount >= digitsBeforeCursor) {
                        newPos = i + 1;
                        break;
                    }
                }
                if (digitCount < digitsBeforeCursor) newPos = formatted.length;
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        });
    }, [onChange]);

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{unit}</span>
            </div>
            {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

export default function ROICalculatorPage() {
    const [investmentType, setInvestmentType] = useState<InvestmentType>('resale');

    // 공통 입력
    const [purchasePrice, setPurchasePrice] = useState<string>('');
    const [acquisitionTax, setAcquisitionTax] = useState<string>('');
    const [registrationFee, setRegistrationFee] = useState<string>('');
    const [repairCost, setRepairCost] = useState<string>('');
    const [movingCost, setMovingCost] = useState<string>('');

    // 매도형 입력
    const [expectedSalePrice, setExpectedSalePrice] = useState<string>('');
    const [holdingPeriod, setHoldingPeriod] = useState<string>('12');
    const [sellingCost, setSellingCost] = useState<string>('');

    // 임대형 입력
    const [deposit, setDeposit] = useState<string>('');
    const [monthlyRent, setMonthlyRent] = useState<string>('');
    const [managementFee, setManagementFee] = useState<string>('');
    const [vacancyRate, setVacancyRate] = useState<string>('5');
    const [annualMaintenance, setAnnualMaintenance] = useState<string>('');

    // 매도 손익 계산
    const calculateResale = () => {
        const purchase = parseNumber(purchasePrice);
        if (!purchase) return null;

        const tax = parseNumber(acquisitionTax);
        const regFee = parseNumber(registrationFee);
        const repair = parseNumber(repairCost);
        const moving = parseNumber(movingCost);
        const salePrice = parseNumber(expectedSalePrice);
        const months = parseInt(holdingPeriod) || 12;
        const sellCost = parseNumber(sellingCost);

        const totalInvestment = purchase + tax + regFee + repair + moving;
        const totalSellExpense = sellCost;
        const netProfit = salePrice - totalInvestment - totalSellExpense;
        const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
        const annualizedROI = months > 0 ? (roi / months) * 12 : 0;
        const monthlyProfit = months > 0 ? netProfit / months : 0;

        return {
            totalInvestment,
            salePrice,
            totalSellExpense,
            netProfit,
            roi,
            annualizedROI,
            monthlyProfit,
            months,
            isProfitable: netProfit > 0,
        };
    };

    // 임대 손익 계산
    const calculateRental = () => {
        const purchase = parseNumber(purchasePrice);
        if (!purchase) return null;

        const tax = parseNumber(acquisitionTax);
        const regFee = parseNumber(registrationFee);
        const repair = parseNumber(repairCost);
        const moving = parseNumber(movingCost);
        const dep = parseNumber(deposit);
        const rent = parseNumber(monthlyRent);
        const mgmt = parseNumber(managementFee);
        const vacancy = parseFloat(vacancyRate) || 5;
        const maintenance = parseNumber(annualMaintenance);

        const totalInvestment = purchase + tax + regFee + repair + moving;
        const actualInvestment = totalInvestment - dep; // 보증금 차감

        const annualGrossRent = rent * 12;
        const effectiveRent = annualGrossRent * (1 - vacancy / 100);
        const annualExpenses = (mgmt * 12) + maintenance;
        const annualNetIncome = effectiveRent - annualExpenses;

        const grossYield = totalInvestment > 0 ? (annualGrossRent / totalInvestment) * 100 : 0;
        const netYield = totalInvestment > 0 ? (annualNetIncome / totalInvestment) * 100 : 0;
        const netYieldOnEquity = actualInvestment > 0 ? (annualNetIncome / actualInvestment) * 100 : 0;
        const monthlyNetIncome = annualNetIncome / 12;
        const paybackYears = annualNetIncome > 0 ? actualInvestment / annualNetIncome : 0;

        return {
            totalInvestment,
            actualInvestment,
            annualGrossRent,
            effectiveRent,
            annualExpenses,
            annualNetIncome,
            monthlyNetIncome,
            grossYield,
            netYield,
            netYieldOnEquity,
            paybackYears,
            isProfitable: annualNetIncome > 0,
        };
    };

    const resaleResult = investmentType === 'resale' ? calculateResale() : null;
    const rentalResult = investmentType === 'rental' ? calculateRental() : null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-indigo-600">도구</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">매도·임대 손익 계산기</span>
            </nav>

            {/* 헤더 */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    매도·임대 손익 계산기
                </h1>
                <p className="text-gray-600 mt-2">
                    매도가 또는 임대 조건과 총비용을 비교해 손익을 단순 계산합니다.
                </p>
            </header>

            {/* 계산 유형 탭 */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setInvestmentType('resale')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${investmentType === 'resale'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    매도 차익형
                </button>
                <button
                    onClick={() => setInvestmentType('rental')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${investmentType === 'rental'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    임대형
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* 입력 폼 */}
                <div className="lg:col-span-3 space-y-6">
                    {/* 매입 비용 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                            매입 비용
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <InputField label="매입가 (낙찰가)" value={purchasePrice} onChange={setPurchasePrice} hint="법원 매각 낙찰가" />
                            </div>
                            <InputField label="취득세" value={acquisitionTax} onChange={setAcquisitionTax} hint="취득세 계산기 활용" />
                            <InputField label="등기/이전 비용" value={registrationFee} onChange={setRegistrationFee} hint="법무사 수수료 포함" />
                            <InputField label="수리/리모델링비" value={repairCost} onChange={setRepairCost} />
                            <InputField label="명도비/이사비" value={movingCost} onChange={setMovingCost} />
                        </div>
                    </div>

                    {/* 매도형 입력 */}
                    {investmentType === 'resale' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <span className="bg-green-100 text-green-600 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                                매도 계획
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <InputField label="예상 매도가" value={expectedSalePrice} onChange={setExpectedSalePrice} hint="네이버 부동산, KB시세 참고" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">보유 기간</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={holdingPeriod}
                                            onChange={(e) => setHoldingPeriod(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">개월</span>
                                    </div>
                                </div>
                                <InputField label="매도 비용" value={sellingCost} onChange={setSellingCost} hint="중개수수료 등(양도소득세는 별도)" />
                            </div>
                        </div>
                    )}

                    {/* 임대형 입력 */}
                    {investmentType === 'rental' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                                임대 조건
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="보증금" value={deposit} onChange={setDeposit} />
                                <InputField label="월 임대료" value={monthlyRent} onChange={setMonthlyRent} />
                                <InputField label="월 관리비 (임대인 부담)" value={managementFee} onChange={setManagementFee} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">공실률</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={vacancyRate}
                                            onChange={(e) => setVacancyRate(e.target.value.replace(/[^0-9.]/g, ''))}
                                            className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">예시값</p>
                                </div>
                                <InputField label="연간 유지보수비" value={annualMaintenance} onChange={setAnnualMaintenance} hint="재산세, 보험료 등" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 결과 */}
                <div className="lg:col-span-2">
                    <div className={`rounded-2xl shadow-lg p-6 text-white sticky top-4 ${investmentType === 'resale'
                        ? 'bg-gradient-to-br from-violet-600 to-purple-700'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                        }`}>
                        <h2 className="text-lg font-bold mb-6">
                            {investmentType === 'resale' ? '매도 손익 계산 결과' : '임대 손익 계산 결과'}
                        </h2>

                        {investmentType === 'resale' && resaleResult ? (
                            <div className="space-y-4">
                                <div className={`rounded-xl p-4 ${resaleResult.isProfitable ? 'bg-white/10' : 'bg-red-500/20'}`}>
                                    <div className="text-purple-200 text-sm">매도 손익(비용 차감 후)</div>
                                    <div className={`text-3xl font-bold ${resaleResult.isProfitable ? '' : 'text-red-200'}`}>
                                        {resaleResult.netProfit >= 0 ? '+' : ''}{resaleResult.netProfit.toLocaleString()}원
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <div className="text-purple-200 text-xs">총비용 대비 손익 비율</div>
                                        <div className="text-xl font-bold">{resaleResult.roi.toFixed(1)}%</div>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <div className="text-purple-200 text-xs">연 환산 손익 비율</div>
                                        <div className="text-xl font-bold">{resaleResult.annualizedROI.toFixed(1)}%</div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-purple-200">총비용</span>
                                        <span>{resaleResult.totalInvestment.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-purple-200">예상 매도가</span>
                                        <span>{resaleResult.salePrice.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-purple-200">매도 비용</span>
                                        <span>-{resaleResult.totalSellExpense.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/20 pt-2">
                                        <span className="text-purple-200">월평균 손익</span>
                                        <span className="font-bold">{Math.round(resaleResult.monthlyProfit).toLocaleString()}원</span>
                                    </div>
                                </div>

                                {/* 계산 조건 */}
                                <div className="rounded-lg p-3 text-xs bg-white/10 text-purple-100">
                                    {resaleResult.isProfitable
                                        ? '입력한 매도가가 총비용과 매도 비용의 합계를 넘는 경우의 계산값입니다.'
                                        : '입력한 매도가가 총비용과 매도 비용의 합계에 미치지 못합니다.'}
                                    {' '}양도소득세와 보유 기간 중 비용은 포함되지 않았습니다.
                                </div>
                            </div>
                        ) : investmentType === 'rental' && rentalResult ? (
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-xl p-4">
                                    <div className="text-blue-200 text-sm">임대 순수입 비율(총비용 대비)</div>
                                    <div className="text-3xl font-bold">{rentalResult.netYield.toFixed(2)}%</div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <div className="text-blue-200 text-xs">임대료 합계 비율(총비용 대비)</div>
                                        <div className="text-xl font-bold">{rentalResult.grossYield.toFixed(2)}%</div>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <div className="text-blue-200 text-xs">보증금 차감 후 비용 대비 순수입 비율</div>
                                        <div className="text-xl font-bold">{rentalResult.netYieldOnEquity.toFixed(2)}%</div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-blue-200">총비용</span>
                                        <span>{rentalResult.totalInvestment.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-200">보증금 차감 후 비용</span>
                                        <span>{rentalResult.actualInvestment.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/20 pt-2">
                                        <span className="text-blue-200">연간 순수입</span>
                                        <span className="font-bold">{Math.round(rentalResult.annualNetIncome).toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-200">월 순수입</span>
                                        <span className="font-bold">{Math.round(rentalResult.monthlyNetIncome).toLocaleString()}원</span>
                                    </div>
                                    {rentalResult.paybackYears > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-blue-200">비용 회수 기간(단순 계산)</span>
                                            <span className="font-bold">{rentalResult.paybackYears.toFixed(1)}년</span>
                                        </div>
                                    )}
                                </div>

                                {/* 계산 조건 */}
                                <div className="rounded-lg p-3 text-xs bg-white/10 text-blue-100">
                                    {rentalResult.isProfitable
                                        ? '입력한 임대료에서 공실률과 비용을 뺀 연간 순수입이 양수인 경우의 계산값입니다.'
                                        : '입력한 임대료에서 공실률과 비용을 빼면 연간 순수입이 0 이하입니다.'}
                                    {' '}재산세, 종합부동산세, 임대소득세는 포함되지 않았습니다.
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 opacity-70">
                                <p>매입가와 조건을 입력하면</p>
                                <p>손익이 계산됩니다</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 계산 근거와 한계 */}
            <div className="mt-8 bg-amber-50 rounded-xl p-6 border border-amber-100">
                <h2 className="text-base font-bold text-amber-900 mb-3">계산 근거와 한계</h2>
                <p className="text-sm text-amber-800 leading-relaxed mb-3">
                    이 계산기는 세율을 내장하지 않고, 입력한 취득세·등기 비용·수리비 등을 그대로 더해 총비용을 구한 뒤 매도가 또는 임대료와 비교하는 산술 계산만 수행합니다.
                    취득세는 지방세법 제11조·제12조와 지방세법 시행령을 바탕으로 한 취득세 계산기(2026년 1월 기준)의 결과를 입력할 수 있으며,
                    세율 검토 필요 시 위택스(wetax.go.kr)와 국가법령정보센터(law.go.kr)에서 확인해야 합니다.
                </p>
                <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 결과는 입력값이 그대로 실현된다는 가정의 계산값이며, 로옥션은 특정 결과를 예측하거나 권하지 않습니다.</li>
                    <li>• 양도소득세, 종합부동산세, 임대소득세 등 추가 세금은 포함되지 않았습니다.</li>
                    <li>• 시세, 임대료, 공실률, 금리는 시점과 지역에 따라 달라지므로 직접 확인한 값을 입력해야 합니다.</li>
                    <li>• 세무 판단이 필요하면 세무사 등 자격 있는 전문가에게 확인해야 합니다.</li>
                </ul>
            </div>

            {/* 관련 도구 */}
            <div className="mt-8 flex flex-wrap gap-4">
                <Link
                    href="/tools/acquisition-tax"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    취득세 계산기
                </Link>
                <Link
                    href="/tools/vehicle-transfer"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    차량 이전비 계산기
                </Link>
            </div>
        </div>
    );
}
