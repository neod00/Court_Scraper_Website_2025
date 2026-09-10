'use client';

import { useState } from 'react';
import Link from 'next/link';

type PropertyType = 'apartment' | 'commercial' | 'land';
type VehicleType = 'small' | 'passenger' | 'truck';

export default function AcquisitionTaxPage() {
    const [activeTab, setActiveTab] = useState<'property' | 'vehicle'>('property');

    // 부동산 상태
    const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
    const [propertyPrice, setPropertyPrice] = useState<string>('');
    const [houseCount, setHouseCount] = useState<number>(0);
    const [isSmallHouse, setIsSmallHouse] = useState<boolean>(true);

    // 차량 상태
    const [vehicleType, setVehicleType] = useState<VehicleType>('passenger');
    const [vehiclePrice, setVehiclePrice] = useState<string>('');

    // 숫자 포맷
    const formatNumber = (value: string) => {
        const num = value.replace(/[^0-9]/g, '');
        return num ? parseInt(num).toLocaleString() : '';
    };

    const parseNumber = (value: string) => {
        return parseInt(value.replace(/,/g, '')) || 0;
    };

    // 부동산 취득세 계산
    const calculatePropertyTax = () => {
        const price = parseNumber(propertyPrice);
        if (!price) return null;

        let taxRate = 0;
        let localEducationRate = 0.1; // 지방교육세 10%
        let ruralRate = 0; // 농어촌특별세

        if (propertyType === 'apartment') {
            // 주택
            if (houseCount >= 3) {
                // 3주택 이상
                taxRate = 0.12;
            } else if (houseCount === 2) {
                // 2주택
                taxRate = 0.08;
            } else if (houseCount === 1) {
                // 1주택 보유 중 추가 취득 (취득 후 2주택)
                taxRate = 0.08;
            } else {
                // 무주택자가 1주택 취득
                if (price <= 600000000) {
                    taxRate = 0.01;
                } else if (price <= 900000000) {
                    // 6억~9억 구간: 점감세율 적용
                    // 세율 = ((취득가 / 1억) × 2/3 - 3) / 100
                    taxRate = ((price / 100000000) * (2 / 3) - 3) / 100;
                } else {
                    taxRate = 0.03;
                }
            }

            // 85㎡ 초과 시 농어촌특별세
            if (!isSmallHouse && price > 600000000) {
                ruralRate = 0.002;
            }
        } else {
            // 상가/토지
            taxRate = 0.04;
            ruralRate = 0.002;
        }

        const acquisitionTax = price * taxRate;
        const localEducationTax = acquisitionTax * localEducationRate;
        const ruralTax = price * ruralRate;
        const totalTax = acquisitionTax + localEducationTax + ruralTax;

        return {
            price,
            taxRate: (taxRate * 100).toFixed(1),
            acquisitionTax,
            localEducationTax,
            ruralTax,
            totalTax,
            effectiveRate: ((totalTax / price) * 100).toFixed(2),
        };
    };

    // 차량 취득세 계산
    const calculateVehicleTax = () => {
        const price = parseNumber(vehiclePrice);
        if (!price) return null;

        let taxRate = 0;
        let bondRate = 0.05; // 공채 매입비 (약 5%)
        const registrationFee = 150000; // 등록비 약 15만원

        switch (vehicleType) {
            case 'small':
                taxRate = 0.04; // 경차 4%
                bondRate = 0;
                break;
            case 'passenger':
                taxRate = 0.07; // 승용차 7%
                break;
            case 'truck':
                taxRate = 0.05; // 화물차 5%
                bondRate = 0.03;
                break;
        }

        const acquisitionTax = price * taxRate;
        const bondCost = price * bondRate;
        const totalCost = acquisitionTax + bondCost + registrationFee;

        return {
            price,
            taxRate: (taxRate * 100).toFixed(0),
            acquisitionTax,
            bondCost,
            registrationFee,
            totalCost,
        };
    };

    const propertyResult = calculatePropertyTax();
    const vehicleResult = calculateVehicleTax();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-indigo-600">도구</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">취득세 계산기</span>
            </nav>

            {/* 헤더 */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    취득세 계산기
                </h1>
                <p className="text-gray-600 mt-2">
                    부동산 또는 차량 취득 시 납부할 취득세를 입력값 기준으로 계산합니다. (2026년 1월 기준)
                </p>
            </header>

            {/* 탭 */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('property')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'property'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    부동산
                </button>
                <button
                    onClick={() => setActiveTab('vehicle')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'vehicle'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    차량
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 입력 폼 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">
                        {activeTab === 'property' ? '부동산 정보 입력' : '차량 정보 입력'}
                    </h2>

                    {activeTab === 'property' ? (
                        <div className="space-y-5">
                            {/* 물건 종류 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    물건 종류
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'apartment', label: '주택' },
                                        { value: 'commercial', label: '상가/오피스텔' },
                                        { value: 'land', label: '토지' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setPropertyType(option.value as PropertyType)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${propertyType === option.value
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 취득가액 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    취득가액 (낙찰가)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={propertyPrice}
                                        onChange={(e) => setPropertyPrice(formatNumber(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right text-lg"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                                </div>
                            </div>

                            {/* 주택인 경우만 추가 옵션 */}
                            {propertyType === 'apartment' && (
                                <>
                                    {/* 보유 주택 수 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            현재 보유 주택 수
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            이번 취득 전 보유 주택 수 (세대원 포함)
                                        </p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[0, 1, 2, 3].map((count) => (
                                                <button
                                                    key={count}
                                                    onClick={() => setHouseCount(count)}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${houseCount === count
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    {count === 0 ? '무주택' : count === 3 ? '3+' : `${count}주택`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 면적 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            전용면적
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setIsSmallHouse(true)}
                                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${isSmallHouse
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                85㎡ 이하
                                            </button>
                                            <button
                                                onClick={() => setIsSmallHouse(false)}
                                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${!isSmallHouse
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                85㎡ 초과
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* 차량 종류 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    차량 종류
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'small', label: '경차' },
                                        { value: 'passenger', label: '승용차' },
                                        { value: 'truck', label: '화물차' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setVehicleType(option.value as VehicleType)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${vehicleType === option.value
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 취득가액 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    취득가액 (낙찰가)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={vehiclePrice}
                                        onChange={(e) => setVehiclePrice(formatNumber(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right text-lg"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                                </div>
                            </div>

                            {/* KB차차차 링크 */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-800 mb-2">
                                    차량 시세 참고
                                </p>
                                <a
                                    href="https://www.kbchachacha.com/public/market/price/v3/main.kbc"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm hover:underline"
                                >
                                    KB차차차에서 시세 확인하기 →
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* 결과 */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
                    <h2 className="text-lg font-bold mb-6">
                        계산 결과
                    </h2>

                    {activeTab === 'property' ? (
                        propertyResult ? (
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-xl p-4">
                                    <div className="text-indigo-200 text-sm">취득세율</div>
                                    <div className="text-3xl font-bold">{propertyResult.taxRate}%</div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-indigo-200">취득세</span>
                                        <span className="font-medium">{propertyResult.acquisitionTax.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-indigo-200">지방교육세</span>
                                        <span className="font-medium">{propertyResult.localEducationTax.toLocaleString()}원</span>
                                    </div>
                                    {propertyResult.ruralTax > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-indigo-200">농어촌특별세</span>
                                            <span className="font-medium">{propertyResult.ruralTax.toLocaleString()}원</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-white/20 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg">총 납부액</span>
                                        <span className="text-2xl font-bold">{propertyResult.totalTax.toLocaleString()}원</span>
                                    </div>
                                    <div className="text-indigo-200 text-sm text-right mt-1">
                                        실효세율 {propertyResult.effectiveRate}%
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-indigo-200 py-12">
                                <p>취득가액을 입력하면</p>
                                <p>취득세가 자동으로 계산됩니다</p>
                            </div>
                        )
                    ) : (
                        vehicleResult ? (
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-xl p-4">
                                    <div className="text-indigo-200 text-sm">취득세율</div>
                                    <div className="text-3xl font-bold">{vehicleResult.taxRate}%</div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-indigo-200">취득세</span>
                                        <span className="font-medium">{vehicleResult.acquisitionTax.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-indigo-200">공채 매입비 (예상)</span>
                                        <span className="font-medium">{vehicleResult.bondCost.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-indigo-200">등록비</span>
                                        <span className="font-medium">{vehicleResult.registrationFee.toLocaleString()}원</span>
                                    </div>
                                </div>

                                <div className="border-t border-white/20 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg">총 예상 비용</span>
                                        <span className="text-2xl font-bold">{vehicleResult.totalCost.toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-indigo-200 py-12">
                                <p>취득가액을 입력하면</p>
                                <p>취득세가 자동으로 계산됩니다</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* 계산 근거와 한계 */}
            <div className="mt-8 bg-amber-50 rounded-xl p-6 border border-amber-100">
                <h2 className="text-base font-bold text-amber-900 mb-3">계산 근거와 한계</h2>
                <p className="text-sm text-amber-800 leading-relaxed mb-3">
                    부동산 취득세율은 지방세법 제11조(부동산 취득의 세율), 다주택 중과는 지방세법 제13조의2, 차량 취득세율은 지방세법 제12조를 바탕으로 정리했으며,
                    세부 적용 요건은 지방세법 시행령을 따릅니다. 지방교육세와 농어촌특별세는 각 법률의 부가세율을 단순 적용했습니다.
                    이 계산기는 입력값을 그대로 계산할 뿐 실제 신고세액을 확정하지 않습니다.
                </p>
                <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 실제 세금은 관할 지방자치단체 세무부서에서 확인해야 합니다.</li>
                    <li>• 다주택 중과 세율은 조정대상지역 취득을 가정한 값이며, 비조정대상지역 2주택은 실제로 더 낮을 수 있습니다. 농어촌특별세는 85㎡ 초과·6억 원 초과 조건으로 단순화했습니다.</li>
                    <li>• 생애최초 감면, 법인 취득 등 특수한 경우는 반영되지 않았습니다.</li>
                    <li>• 2026년 1월 기준 세율이며, 세율 검토 필요 시 위택스(wetax.go.kr)와 국가법령정보센터(law.go.kr)에서 확인해야 합니다.</li>
                    <li>• 차량의 공채 매입비와 등록비는 지역에 따라 달라지는 예시값입니다.</li>
                </ul>
            </div>

            {/* 관련 도구 */}
            <div className="mt-8">
                <Link
                    href="/tools/bid-calculator"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    입찰가 계산기로 이동 →
                </Link>
            </div>
        </div>
    );
}
