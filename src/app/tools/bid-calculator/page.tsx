'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type PropertyType = 'apartment' | 'commercial';
type VehicleClass = 'small' | 'compact' | 'midsize' | 'fullsize' | 'import';

export default function BidCalculatorPage() {
    const [activeTab, setActiveTab] = useState<'property' | 'vehicle'>('property');

    // 부동산 상태
    const [appraisedValue, setAppraisedValue] = useState<string>('');
    const [minimumBid, setMinimumBid] = useState<string>('');
    const [marketPrice, setMarketPrice] = useState<string>('');
    const [repairCost, setRepairCost] = useState<string>('0');
    const [evictionCost, setEvictionCost] = useState<string>('0');
    const [houseCount, setHouseCount] = useState<number>(0);
    const [targetProfit, setTargetProfit] = useState<number>(20);

    // 차량 상태
    const [vehicleClass, setVehicleClass] = useState<VehicleClass>('midsize');
    const [vehicleYear, setVehicleYear] = useState<string>('2022');
    const [mileage, setMileage] = useState<string>('5');
    const [vehicleMarketPrice, setVehicleMarketPrice] = useState<string>('');
    const [vehicleRepairCost, setVehicleRepairCost] = useState<string>('0');
    const [targetDiscount, setTargetDiscount] = useState<number>(20);

    // 숫자 포맷
    const formatNumber = (value: string) => {
        const num = value.replace(/[^0-9]/g, '');
        return num ? parseInt(num).toLocaleString() : '';
    };

    const parseNumber = (value: string) => {
        return parseInt(value.replace(/,/g, '')) || 0;
    };

    // 부동산 입찰가 계산
    const propertyResult = useMemo(() => {
        const appraised = parseNumber(appraisedValue);
        const minimum = parseNumber(minimumBid);
        const market = parseNumber(marketPrice) || appraised;
        const repair = parseNumber(repairCost);
        const eviction = parseNumber(evictionCost);

        if (!appraised && !minimum) return null;

        // 취득세율 계산
        let taxRate = 0.011; // 기본 1.1%
        if (houseCount >= 3) taxRate = 0.124;
        else if (houseCount >= 1) taxRate = 0.084;

        // 목표 수익에서 역산한 적정 입찰가
        const targetMultiplier = 1 + targetProfit / 100;
        const totalCost = repair + eviction;

        // 적정 입찰가 = (시세 / 목표수익률) - 취득세 - 기타비용
        const idealBidBase = (market / targetMultiplier) - totalCost;
        let idealBid = idealBidBase / (1 + taxRate);

        // 최저매각가격보다 낮으면 안 됨
        let belowMinimum = false;
        if (minimum > 0 && idealBid < minimum) {
            belowMinimum = true;
            idealBid = minimum;
        }

        const acquisitionTax = idealBid * taxRate;
        const totalInvestment = idealBid + acquisitionTax + totalCost;
        const expectedProfit = market - totalInvestment;

        return {
            appraised,
            minimum,
            market,
            idealBid: Math.round(idealBid),
            acquisitionTax: Math.round(acquisitionTax),
            totalCost,
            totalInvestment: Math.round(totalInvestment),
            expectedProfit: Math.round(expectedProfit),
            profitRate: market > 0 ? ((expectedProfit / totalInvestment) * 100).toFixed(1) : '0',
            bidToAppraisedRate: appraised > 0 ? ((idealBid / appraised) * 100).toFixed(1) : '0',
            belowMinimum,
        };
    }, [appraisedValue, minimumBid, marketPrice, repairCost, evictionCost, houseCount, targetProfit]);

    // 차량 감가 계산
    const calculateDepreciation = (year: number, miles: number, classType: VehicleClass) => {
        const currentYear = 2026;
        const age = currentYear - year;

        // 연식별 감가율
        let depreciationRate = 1;
        if (age === 0) depreciationRate = 0.95;
        else if (age === 1) depreciationRate = 0.78;
        else if (age === 2) depreciationRate = 0.68;
        else if (age === 3) depreciationRate = 0.60;
        else if (age === 4) depreciationRate = 0.53;
        else if (age === 5) depreciationRate = 0.47;
        else if (age >= 6) depreciationRate = Math.max(0.25, 0.47 - (age - 5) * 0.05);

        // 주행거리 보정 (연 15,000km 기준)
        const expectedMileage = age * 1.5; // 만km
        const milesDiff = miles - expectedMileage;
        const mileageAdjust = milesDiff > 0 ? 1 - (milesDiff * 0.01) : 1 + Math.abs(milesDiff) * 0.005;

        // 차종별 보정
        let classAdjust = 1;
        if (classType === 'import') classAdjust = 0.85; // 수입차 감가 큼
        else if (classType === 'small') classAdjust = 1.05; // 경차 감가 적음

        return Math.max(0.2, depreciationRate * mileageAdjust * classAdjust);
    };

    // 차량 입찰가 계산
    const vehicleResult = useMemo(() => {
        const market = parseNumber(vehicleMarketPrice);
        const repair = parseNumber(vehicleRepairCost);
        const year = parseInt(vehicleYear) || 2022;
        const miles = parseFloat(mileage) || 5;

        if (!market) return null;

        const taxRate = vehicleClass === 'small' ? 0.04 : 0.07;
        const registrationFee = 150000;

        // 목표 할인율로 적정 입찰가 계산
        const idealBid = market * (1 - targetDiscount / 100);
        const acquisitionTax = idealBid * taxRate;
        const totalCost = idealBid + acquisitionTax + registrationFee + repair;
        const savings = market - totalCost;

        // 감가율 참고용 계산
        const depRate = calculateDepreciation(year, miles, vehicleClass);

        return {
            market,
            idealBid: Math.round(idealBid),
            acquisitionTax: Math.round(acquisitionTax),
            registrationFee,
            repair,
            totalCost: Math.round(totalCost),
            savings: Math.round(savings),
            savingsRate: market > 0 ? ((savings / market) * 100).toFixed(1) : '0',
            depreciationRate: (depRate * 100).toFixed(0),
        };
    }, [vehicleMarketPrice, vehicleRepairCost, vehicleYear, mileage, vehicleClass, targetDiscount]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-indigo-600">도구</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">입찰가 계산기</span>
            </nav>

            {/* 헤더 */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    📊 입찰가 계산기
                </h1>
                <p className="text-gray-600 mt-2">
                    목표 수익률을 기준으로 적정 입찰가를 계산합니다.
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
                    🏠 부동산
                </button>
                <button
                    onClick={() => setActiveTab('vehicle')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'vehicle'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    🚗 차량
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
                            {/* 감정가 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    감정가
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={appraisedValue}
                                        onChange={(e) => setAppraisedValue(formatNumber(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                                </div>
                            </div>

                            {/* 최저매각가격 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    최저매각가격
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={minimumBid}
                                        onChange={(e) => setMinimumBid(formatNumber(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                                </div>
                            </div>

                            {/* 예상 시세 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    예상 시세 (매도가)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={marketPrice}
                                        onChange={(e) => setMarketPrice(formatNumber(e.target.value))}
                                        placeholder="감정가와 동일"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                                </div>
                            </div>

                            {/* 시세 확인 링크 */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-800 mb-2">
                                    💡 부동산 시세를 모르시나요?
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <a
                                        href="https://land.naver.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 font-medium text-sm hover:underline"
                                    >
                                        네이버 부동산 →
                                    </a>
                                    <span className="text-blue-300">|</span>
                                    <a
                                        href="https://hogangnono.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 font-medium text-sm hover:underline"
                                    >
                                        호갱노노 →
                                    </a>
                                </div>
                            </div>

                            {/* 예상 수리비 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    예상 수리비
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={repairCost}
                                        onChange={(e) => setRepairCost(formatNumber(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                                </div>
                            </div>

                            {/* 예상 명도비용 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    예상 명도비용
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['0', '1000000', '3000000', '5000000'].map((cost) => (
                                        <button
                                            key={cost}
                                            onClick={() => setEvictionCost(cost)}
                                            className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${evictionCost === cost
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                                }`}
                                        >
                                            {cost === '0' ? '없음' : `${parseInt(cost) / 10000}만원`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 보유 주택 수 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    현재 보유 주택 수
                                </label>
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
                                            {count === 3 ? '3+' : count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 목표 수익률 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    목표 수익률: <span className="text-indigo-600 font-bold">{targetProfit}%</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    시세로 되팔았을 때 원하는 수익률
                                </p>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    step="1"
                                    value={targetProfit}
                                    onChange={(e) => setTargetProfit(parseInt(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>0% (손익분기)</span>
                                    <span>50% (공격적)</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* 차종 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    차종
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'small', label: '경차' },
                                        { value: 'compact', label: '소형' },
                                        { value: 'midsize', label: '중형' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setVehicleClass(option.value as VehicleClass)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${vehicleClass === option.value
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {[
                                        { value: 'fullsize', label: '대형' },
                                        { value: 'import', label: '수입차' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setVehicleClass(option.value as VehicleClass)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${vehicleClass === option.value
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 연식 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    연식
                                </label>
                                <select
                                    value={vehicleYear}
                                    onChange={(e) => setVehicleYear(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {Array.from({ length: 27 }, (_, i) => 2026 - i).map((year) => (
                                        <option key={year} value={year}>{year}년</option>
                                    ))}
                                </select>
                            </div>

                            {/* 주행거리 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    주행거리: <span className="text-indigo-600 font-bold">{mileage}만km</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    step="0.5"
                                    value={mileage}
                                    onChange={(e) => setMileage(e.target.value)}
                                    className="w-full accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>신차</span>
                                    <span>30만km</span>
                                </div>
                            </div>

                            {/* 예상 시세 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    예상 시세 (중고차 매매가)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={vehicleMarketPrice}
                                        onChange={(e) => setVehicleMarketPrice(formatNumber(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                                </div>
                            </div>

                            {/* KB차차차 링크 */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-blue-800 mb-2">
                                    💡 차량 시세를 모르시나요?
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

                            {/* 예상 수리비 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    예상 수리비
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={vehicleRepairCost}
                                        onChange={(e) => setVehicleRepairCost(formatNumber(e.target.value))}
                                        placeholder="0"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                                </div>
                            </div>

                            {/* 목표 수익률 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    목표 수익률: <span className="text-indigo-600 font-bold">{targetDiscount}%</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    시세로 되팔았을 때 원하는 수익률
                                </p>
                                <input
                                    type="range"
                                    min="0"
                                    max="40"
                                    step="1"
                                    value={targetDiscount}
                                    onChange={(e) => setTargetDiscount(parseInt(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>0% (손익분기)</span>
                                    <span>40% (공격적)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 결과 */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-lg p-6 text-white">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        📊 계산 결과
                    </h2>

                    {activeTab === 'property' ? (
                        propertyResult ? (
                            <div className="space-y-4">
                                {/* 최저매각가격 경고 */}
                                {propertyResult.belowMinimum && (
                                    <div className="bg-amber-500/20 border border-amber-400/50 rounded-lg p-3 text-amber-100 text-sm">
                                        ⚠️ 목표 수익률 달성을 위한 입찰가가 최저매각가격보다 낮습니다. 최저매각가격({propertyResult.minimum.toLocaleString()}원)으로 조정되었습니다.
                                    </div>
                                )}

                                {/* 이 가격으로 입찰하세요 */}
                                <div className="bg-white/10 rounded-xl p-4">
                                    <div className="text-green-200 text-sm">이 가격으로 입찰하세요</div>
                                    <div className="text-3xl font-bold">{propertyResult.idealBid.toLocaleString()}원</div>
                                    {propertyResult.belowMinimum && (
                                        <div className="text-amber-300 text-xs mt-1">= 최저매각가격</div>
                                    )}
                                </div>

                                {/* 비용 상세 */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-green-200">입찰가</span>
                                        <span className="font-medium">{propertyResult.idealBid.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-200">+ 취득세</span>
                                        <span className="font-medium">{propertyResult.acquisitionTax.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-200">+ 수리/명도비</span>
                                        <span className="font-medium">{propertyResult.totalCost.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                                        <span className="text-green-100 font-medium">내 총 투자금</span>
                                        <span className="font-bold">{propertyResult.totalInvestment.toLocaleString()}원</span>
                                    </div>
                                </div>

                                {/* 시세로 팔면 */}
                                <div className="border-t border-white/20 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-green-200">시세로 팔면</span>
                                        <span className="font-medium">{propertyResult.market.toLocaleString()}원</span>
                                    </div>
                                </div>

                                {/* 예상 수익 (핵심) */}
                                <div className="bg-white/20 rounded-xl p-4 text-center">
                                    <div className="text-green-100 text-sm">💰 예상 수익</div>
                                    <div className="text-2xl font-bold">
                                        {propertyResult.expectedProfit >= 0 ? '+' : ''}{propertyResult.expectedProfit.toLocaleString()}원
                                    </div>
                                    <div className="text-sm text-green-100 mt-1">
                                        (수익률 약 {propertyResult.profitRate}%)
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-lg p-3 text-xs text-green-200">
                                    💡 낙찰 후 시세({propertyResult.market.toLocaleString()}원)로 되팔면 약 {propertyResult.expectedProfit.toLocaleString()}원 수익
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-green-200 py-12">
                                <p>감정가와 시세를 입력하면</p>
                                <p>적정 입찰가가 계산됩니다</p>
                            </div>
                        )
                    ) : (
                        vehicleResult ? (
                            <div className="space-y-4">
                                {/* 이 가격으로 입찰하세요 */}
                                <div className="bg-white/10 rounded-xl p-4">
                                    <div className="text-green-200 text-sm">이 가격으로 입찰하세요</div>
                                    <div className="text-3xl font-bold">{vehicleResult.idealBid.toLocaleString()}원</div>
                                </div>

                                {/* 비용 상세 */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-green-200">입찰가</span>
                                        <span className="font-medium">{vehicleResult.idealBid.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-200">+ 취득세</span>
                                        <span className="font-medium">{vehicleResult.acquisitionTax.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-200">+ 등록비</span>
                                        <span className="font-medium">{vehicleResult.registrationFee.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-green-200">+ 수리비</span>
                                        <span className="font-medium">{vehicleResult.repair.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between border-t border-white/20 pt-2 mt-2">
                                        <span className="text-green-100 font-medium">내 총 투자금</span>
                                        <span className="font-bold">{vehicleResult.totalCost.toLocaleString()}원</span>
                                    </div>
                                </div>

                                {/* 시세로 팔면 */}
                                <div className="border-t border-white/20 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-green-200">시세로 팔면</span>
                                        <span className="font-medium">{vehicleResult.market.toLocaleString()}원</span>
                                    </div>
                                </div>

                                {/* 예상 수익 (핵심) */}
                                <div className="bg-white/20 rounded-xl p-4 text-center">
                                    <div className="text-green-100 text-sm">💰 예상 수익</div>
                                    <div className="text-2xl font-bold">
                                        {vehicleResult.savings >= 0 ? '+' : ''}{vehicleResult.savings.toLocaleString()}원
                                    </div>
                                    <div className="text-sm text-green-100 mt-1">
                                        (수익률 약 {vehicleResult.savingsRate}%)
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-lg p-3 text-xs text-green-200">
                                    💡 낙찰 후 시세({vehicleResult.market.toLocaleString()}원)로 되팔면 약 {vehicleResult.savings.toLocaleString()}원 수익
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-green-200 py-12">
                                <p>예상 시세를 입력하면</p>
                                <p>적정 입찰가가 계산됩니다</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* 안내사항 */}
            <div className="mt-8 bg-amber-50 rounded-xl p-6 border border-amber-100">
                <h3 className="font-bold text-amber-900 mb-3">⚠️ 안내사항</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 본 계산기는 참고용이며, 실제 투자 결정은 전문가와 상담하세요.</li>
                    <li>• 예상치 못한 추가 비용이 발생할 수 있습니다.</li>
                    <li>• 부동산의 경우 유치권, 법정지상권 등 권리 분석이 필수입니다.</li>
                </ul>
            </div>

            {/* 관련 도구 */}
            <div className="mt-8">
                <Link
                    href="/tools/acquisition-tax"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    🧮 취득세 계산기로 이동 →
                </Link>
            </div>
        </div>
    );
}
