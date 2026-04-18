'use client';

import { useState } from 'react';

interface Props {
    category: string | null;
}

export default function CourtCostCalculator({ category }: Props) {
    const [price, setPrice] = useState<number | string>('');
    const [isMultiHouse, setIsMultiHouse] = useState<boolean>(false);

    const numericPrice = typeof price === 'string' ? parseInt(price.replace(/,/g, ''), 10) : price;
    const isValid = !isNaN(numericPrice) && numericPrice > 0;

    // Calculate Taxes
    let taxRate = 0;
    let taxName = '';
    
    if (category === 'real_estate') {
        if (isMultiHouse) {
            taxRate = 8.4; // 다주택자 중과 가정
            taxName = '취득세 (다주택 중과 예상 8.4%)';
        } else {
            taxRate = numericPrice > 600000000 ? 2.2 : 1.1;
            taxName = '취득세 (1주택자 기본세율)';
        }
    } else if (category === 'vehicle') {
        taxRate = 7.0;
        taxName = '차량 취등록세 (7%)';
    } else {
        taxRate = 4.6;
        taxName = '기타 자산 취득세 (4.6%)';
    }

    const estimatedTax = isValid ? Math.floor(numericPrice * (taxRate / 100)) : 0;
    const estimatedExtra = isValid ? Math.floor(numericPrice * 0.015) : 0; // 등기/보관소 비용 등 1.5% 임의 산정
    const totalCost = isValid ? numericPrice + estimatedTax + estimatedExtra : 0;

    const formatWon = (num: number) => {
        if (num >= 100000000) {
            const eok = Math.floor(num / 100000000);
            const man = Math.floor((num % 100000000) / 10000);
            return man > 0 ? `${eok}억 ${man}만 원` : `${eok}억 원`;
        }
        if (num >= 10000) {
            const man = Math.floor(num / 10000);
            return `${man.toLocaleString()}만 원`;
        }
        return `${num.toLocaleString()}원`;
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-6 border border-gray-200 shadow-sm mt-8">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🧮</span>
                <h3 className="text-lg font-bold text-gray-900">예상 부대비용 및 수익률 계산기</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                보수적인 입찰가 산정을 위해 예상되는 취득세, 인지대, 명도/보관소 비용 등의 
                부대비용을 미리 계산해 보세요. 정확한 부대비용 파악이 성공적인 투자의 핵심입니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        예상 낙찰가 (또는 호가) 입력
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <input
                            type="text"
                            value={price ? price.toLocaleString() : ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setPrice(val ? parseInt(val, 10) : '');
                            }}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 py-3 sm:text-sm border-gray-300 rounded-lg"
                            placeholder="예: 300000000"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">원</span>
                        </div>
                    </div>

                    {category === 'real_estate' && (
                        <div className="mt-4 flex items-center">
                            <input
                                id="multi-house"
                                type="checkbox"
                                checked={isMultiHouse}
                                onChange={(e) => setIsMultiHouse(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="multi-house" className="ml-2 block text-sm text-gray-700">
                                다주택자 (취득세 중과 적용)
                            </label>
                        </div>
                    )}
                </div>

                <div className="bg-white p-5 rounded-lg border border-indigo-100 shadow-inner">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">산출 결과</h4>
                    
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">순수 낙찰가:</span>
                            <span className="font-semibold text-gray-900">{isValid ? formatWon(numericPrice) : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">{taxName}:</span>
                            <span className="font-semibold text-red-600">+{isValid ? formatWon(estimatedTax) : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">법무사/명도 등 여유 자금:</span>
                            <span className="font-semibold text-amber-600">+{isValid ? formatWon(estimatedExtra) : '-'}</span>
                        </div>
                        <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-bold">
                            <span className="text-indigo-900">최종 필요 예산:</span>
                            <span className="text-indigo-700 text-lg">{isValid ? formatWon(totalCost) : '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 text-right">
                <span className="text-[11px] text-gray-400">
                    * 위 계산은 참고용 시뮬레이션이며 지역 및 과세표준에 따라 실제 세금과 차이가 있을 수 있습니다.
                </span>
            </div>
        </div>
    );
}
