'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params
    const [startDate, setStartDate] = useState(searchParams.get('start') || '');
    const [endDate, setEndDate] = useState(searchParams.get('end') || '');
    const [keyword, setKeyword] = useState(searchParams.get('q') || '');
    const [category, setCategory] = useState(searchParams.get('cat') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [dateError, setDateError] = useState('');

    // Presets mapping
    const presets = [
        { label: '전체', value: '' },
        { label: '부동산', value: 'real_estate' },
        { label: '차량/중기', value: 'vehicle' },
        { label: '비품/전자', value: 'electronics' },
        { label: '채권', value: 'bond' },
        { label: '주식', value: 'stock' },
        { label: '특허', value: 'patent' },
        { label: '무체재산권', value: 'intangible' },
        { label: '기타', value: 'etc' },
    ];

    // Validate dates whenever they change
    useEffect(() => {
        if (startDate && endDate && startDate > endDate) {
            setDateError('⚠️ 시작일이 종료일보다 미래입니다. 날짜를 확인해주세요.');
        } else {
            setDateError('');
        }
    }, [startDate, endDate]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Prevent submission if date error exists
        if (dateError) {
            return;
        }

        setIsLoading(true);

        const params = new URLSearchParams();
        if (startDate) params.set('start', startDate);
        if (endDate) params.set('end', endDate);
        if (keyword) params.set('q', keyword);
        if (category) params.set('cat', category);

        // Simulate brief loading for UX, then navigate
        setTimeout(() => {
            router.push(`/?${params.toString()}`);
            setIsLoading(false);
        }, 800);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-0 mb-8">
            {/* Date Inputs */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-blue-400 text-xs">■</span>
                    <label className="text-sm font-semibold text-gray-700">시작일 / 종료일</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label htmlFor="startDate" className="block text-sm text-gray-600 mb-2">
                            📅 시작일
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`w-full px-4 py-2 bg-gray-50 border rounded-md text-gray-900 focus:ring-0 focus:border-blue-500 transition-colors ${dateError ? 'border-red-400' : 'border-gray-200'}`}
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm text-gray-600 mb-2">
                            📅 종료일
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`w-full px-4 py-2 bg-gray-50 border rounded-md text-gray-900 focus:ring-0 focus:border-blue-500 transition-colors ${dateError ? 'border-red-400' : 'border-gray-200'}`}
                        />
                    </div>
                </div>
                {/* Date Error Message */}
                {dateError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600 font-medium">{dateError}</p>
                    </div>
                )}
            </div>

            {/* Internal Separator */}
            <div className="border-t border-gray-100 my-8"></div>

            {/* Search Settings */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                    🔍 검색어 설정
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Preset Select */}
                    <div>
                        <label htmlFor="category" className="block text-sm text-gray-600 mb-2">
                            프리셋 검색어
                        </label>
                        <div className="relative">
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full appearance-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:ring-0 focus:border-blue-500 transition-colors"
                            >
                                {presets.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Keyword Input */}
                    <div>
                        <label htmlFor="keyword" className="block text-sm text-gray-600 mb-2">
                            직접 검색어 입력 (추가로 필요한 경우)
                        </label>
                        <input
                            type="text"
                            id="keyword"
                            placeholder="직접입력"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:ring-0 focus:border-blue-500 transition-colors placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Submit Button with Progress */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isLoading || !!dateError}
                    className={`w-full flex flex-col items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-bold text-white transition-all duration-300 ${dateError
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isLoading
                                ? 'bg-[#ff6b6b] cursor-wait'
                                : 'bg-[#ff4b4b] hover:bg-[#ff3333] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff4b4b]'
                        }`}
                >
                    {isLoading ? (
                        <>
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                데이터 조회 중...
                            </span>
                            {/* Animated Progress Bar */}
                            <div className="w-full mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full animate-pulse" style={{
                                    animation: 'progressBar 0.8s ease-in-out',
                                    width: '100%'
                                }}></div>
                            </div>
                        </>
                    ) : (
                        <span>🚀 수집 시작 (조회)</span>
                    )}
                </button>
            </div>

            {/* Progress Bar Animation Style */}
            <style jsx>{`
                @keyframes progressBar {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
            `}</style>
        </form>
    );
}
