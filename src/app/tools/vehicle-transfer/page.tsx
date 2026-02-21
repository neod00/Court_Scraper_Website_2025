'use client';

import { useState } from 'react';
import Link from 'next/link';

type VehicleCategory = 'light' | 'small' | 'medium' | 'large' | 'truck' | 'van';
type UsageType = 'personal' | 'business';
type RegionType = 'seoul' | 'metro' | 'other';

const vehicleCategories: { value: VehicleCategory; label: string; desc: string }[] = [
    { value: 'light', label: '경차', desc: '1000cc 미만' },
    { value: 'small', label: '소형', desc: '1000~1600cc' },
    { value: 'medium', label: '중형', desc: '1600~2000cc' },
    { value: 'large', label: '대형', desc: '2000cc 초과' },
    { value: 'truck', label: '화물차', desc: '1톤 이상' },
    { value: 'van', label: '승합차', desc: '15인승 이상' },
];

const regions: { value: RegionType; label: string }[] = [
    { value: 'seoul', label: '서울' },
    { value: 'metro', label: '광역시' },
    { value: 'other', label: '기타 지역' },
];

export default function VehicleTransferPage() {
    const [vehiclePrice, setVehiclePrice] = useState<string>('');
    const [category, setCategory] = useState<VehicleCategory>('medium');
    const [usage, setUsage] = useState<UsageType>('personal');
    const [region, setRegion] = useState<RegionType>('seoul');
    const [isNewPlate, setIsNewPlate] = useState<boolean>(false);

    const formatNumber = (value: string) => {
        const num = value.replace(/[^0-9]/g, '');
        return num ? parseInt(num).toLocaleString() : '';
    };

    const parseNumber = (value: string) => {
        return parseInt(value.replace(/,/g, '')) || 0;
    };

    const calculate = () => {
        const price = parseNumber(vehiclePrice);
        if (!price) return null;

        // 취득세율 결정
        let taxRate = 0.07; // 기본 승용차 7%
        if (category === 'light') {
            taxRate = 0.04; // 경차 4%
        } else if (category === 'truck' || category === 'van') {
            taxRate = 0.05; // 화물/승합 5%
        } else if (usage === 'business') {
            taxRate = 0.05; // 영업용 5%
        }

        const acquisitionTax = Math.round(price * taxRate);

        // 공채 매입 비율 (지역별 차이)
        let bondRate = 0;
        if (category !== 'light') { // 경차는 공채 면제
            if (region === 'seoul') {
                if (category === 'large') bondRate = 0.12;
                else if (category === 'medium') bondRate = 0.09;
                else if (category === 'small') bondRate = 0.05;
                else bondRate = 0.05; // 화물/승합
            } else if (region === 'metro') {
                if (category === 'large') bondRate = 0.08;
                else if (category === 'medium') bondRate = 0.06;
                else if (category === 'small') bondRate = 0.03;
                else bondRate = 0.03;
            } else {
                if (category === 'large') bondRate = 0.05;
                else if (category === 'medium') bondRate = 0.04;
                else bondRate = 0.02;
            }
        }

        const bondFaceValue = Math.round(price * bondRate);
        // 공채 할인 매입 (약 65~70% 할인율 적용 → 실질 부담 30~35%)
        const bondDiscountRate = 0.35;
        const bondActualCost = Math.round(bondFaceValue * bondDiscountRate);

        // 번호판 비용
        const plateCost = isNewPlate ? 12000 : 2000; // 신규 vs 이전

        // 인지세/증지대
        const stampTax = 3000;

        // 검사비 (신규 등록 시에만)
        const inspectionFee = 0;

        // 등록대행 수수료 (직접 시 0, 대행 시 약 3~5만원)
        const agencyFee = 0; // 직접 등록 기준

        // 보험료 (의무보험, 별도 안내)
        // 이전 등록 수수료
        const registrationFee = 1000;

        const totalCost = acquisitionTax + bondActualCost + plateCost + stampTax + inspectionFee + registrationFee;
        const totalWithPrice = price + totalCost;

        return {
            price,
            taxRate: (taxRate * 100).toFixed(0),
            acquisitionTax,
            bondRate: (bondRate * 100).toFixed(1),
            bondFaceValue,
            bondActualCost,
            plateCost,
            stampTax,
            registrationFee,
            totalCost,
            totalWithPrice,
        };
    };

    const result = calculate();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-indigo-600">도구</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">차량 이전비 계산기</span>
            </nav>

            {/* 헤더 */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    🚗 차량 이전비 계산기
                </h1>
                <p className="text-gray-600 mt-2">
                    법원 매각 차량 이전 시 필요한 취득세, 공채, 번호판 비용 등 총 이전비용을 계산합니다.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 입력 폼 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">차량 정보 입력</h2>

                    <div className="space-y-5">
                        {/* 차량 분류 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                차량 분류
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {vehicleCategories.map((cat) => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors text-left ${category === cat.value
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        <div>{cat.label}</div>
                                        <div className={`text-[0.65rem] mt-0.5 ${category === cat.value ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {cat.desc}
                                        </div>
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
                            <p className="text-xs text-gray-400 mt-1">빠른 입력:
                                {[500, 1000, 2000, 3000, 5000].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setVehiclePrice(formatNumber(String(v * 10000)))}
                                        className="ml-2 text-indigo-500 hover:underline"
                                    >
                                        {v}만
                                    </button>
                                ))}
                            </p>
                        </div>

                        {/* 용도 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                사용 용도
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setUsage('personal')}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${usage === 'personal'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    🏠 자가용 (비영업)
                                </button>
                                <button
                                    onClick={() => setUsage('business')}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${usage === 'business'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    🏢 영업용
                                </button>
                            </div>
                        </div>

                        {/* 등록 지역 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                등록 지역
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {regions.map((r) => (
                                    <button
                                        key={r.value}
                                        onClick={() => setRegion(r.value)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${region === r.value
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">공채 매입 비율이 지역에 따라 다릅니다.</p>
                        </div>

                        {/* 번호판 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                번호판
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIsNewPlate(false)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${!isNewPlate
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    기존 번호 이전
                                </button>
                                <button
                                    onClick={() => setIsNewPlate(true)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${isNewPlate
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    새 번호판 발급
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 결과 */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-lg p-6 text-white">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        📊 이전비용 계산 결과
                    </h2>

                    {result ? (
                        <div className="space-y-4">
                            {/* 취득세율 */}
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="text-green-200 text-sm">취득세율</div>
                                <div className="text-3xl font-bold">{result.taxRate}%</div>
                                <div className="text-green-200 text-xs mt-1">
                                    {category === 'light' ? '경차 감면 적용' :
                                        category === 'truck' || category === 'van' ? '화물/승합 세율' :
                                            usage === 'business' ? '영업용 세율' : '비영업용 승용차 세율'}
                                </div>
                            </div>

                            {/* 항목별 비용 */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-green-200">취득세</span>
                                    <span className="font-medium">{result.acquisitionTax.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        <span className="text-green-200">공채 할인 매입</span>
                                        <span className="text-green-300 text-xs ml-1">(액면 {result.bondRate}%)</span>
                                    </div>
                                    <span className="font-medium">{result.bondActualCost.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-200">번호판 비용</span>
                                    <span className="font-medium">{result.plateCost.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-200">인지세/증지대</span>
                                    <span className="font-medium">{result.stampTax.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-200">등록 수수료</span>
                                    <span className="font-medium">{result.registrationFee.toLocaleString()}원</span>
                                </div>
                            </div>

                            {/* 합계 */}
                            <div className="border-t border-white/20 pt-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">이전비용 합계</span>
                                    <span className="text-2xl font-bold">{result.totalCost.toLocaleString()}원</span>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-green-200">차량가 + 이전비 총합</span>
                                        <span className="text-xl font-bold">{result.totalWithPrice.toLocaleString()}원</span>
                                    </div>
                                    <div className="text-green-200 text-xs text-right mt-1">
                                        (수리비, 보험료 별도)
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-green-200 py-12">
                            <div className="text-5xl mb-4">🚗</div>
                            <p>차량 가격을 입력하면</p>
                            <p>이전비용이 자동으로 계산됩니다</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 추가 비용 안내 */}
            <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-3">💡 법원 매각 차량 이전 시 추가 고려사항</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                        <h4 className="font-bold mb-1">📋 필요 서류</h4>
                        <ul className="space-y-0.5 text-blue-700">
                            <li>• 매각허가결정문 (법원 발급)</li>
                            <li>• 대금완납증명서</li>
                            <li>• 자동차등록원부 (등록사업소 발급)</li>
                            <li>• 신분증, 도장</li>
                            <li>• 자동차보험 가입증명서</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-1">⚠️ 주의사항</h4>
                        <ul className="space-y-0.5 text-blue-700">
                            <li>• 체납 과태료/자동차세 승계 여부 확인</li>
                            <li>• 압류/저당 말소 여부 확인</li>
                            <li>• 의무보험 가입 후 이전 등록 가능</li>
                            <li>• 낙찰 후 30일 이내 이전 등록 필수</li>
                            <li>• 대행 시 수수료 3~5만원 추가</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 안내사항 */}
            <div className="mt-6 bg-amber-50 rounded-xl p-6 border border-amber-100">
                <h3 className="font-bold text-amber-900 mb-3">⚠️ 안내사항</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 본 계산기는 참고용이며, 실제 비용은 등록사업소에서 확인하세요.</li>
                    <li>• 공채 할인율은 시장 상황에 따라 변동됩니다 (약 60~70% 할인 적용).</li>
                    <li>• 경차/하이브리드/전기차는 취득세 감면 혜택이 있을 수 있습니다.</li>
                    <li>• 2026년 2월 기준이며, 지방세법 개정 시 세율이 달라질 수 있습니다.</li>
                </ul>
            </div>

            {/* 관련 도구 */}
            <div className="mt-8 flex flex-wrap gap-4">
                <Link
                    href="/tools/acquisition-tax"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    🧮 취득세 계산기
                </Link>
                <Link
                    href="/tools/roi-calculator"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    📈 투자 수익률 계산기
                </Link>
            </div>
        </div>
    );
}
