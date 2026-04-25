'use client';

import { useState, useCallback } from 'react';
import type { CarValuationResult } from '@/app/api/car-valuation/route';

interface CarValuationProps {
    noticeId: string;
    category: string | null;
    aiSummary: string | null;
    title: string;
}

type Stage = 'idle' | 'loading' | 'result' | 'error';

const MANUFACTURERS = [
    '현대', '기아', '제네시스', 'BMW', '벤츠(Mercedes-Benz)', '아우디',
    '폭스바겐', '볼보', '렉서스', '토요타', '혼다', '포르쉐',
    '랜드로버', '미니', '쉐보레(GM)', '르노코리아(삼성)', '쌍용(KG모빌리티)',
    '테슬라', '기타',
];

const FUEL_TYPES = ['가솔린', '디젤', '하이브리드', 'LPG', '전기', '기타'];

const LITTLY_URL = 'https://litt.ly/open.brain'; // 후원하기 공개 링크
const MAX_FREE_USES = 3;

// ── Helpers ──
function hasDetailedVehicleInfo(aiSummary: string | null): boolean {
    if (!aiSummary) return false;
    const keywords = ['차종', '모델', '연식', '주행거리', '차량번호'];
    return keywords.filter(k => aiSummary.includes(k)).length >= 2;
}

function extractAuctionPrice(aiSummary: string | null): number | null {
    if (!aiSummary) return null;
    const patterns = [
        /최저매각가격[:\s]*([0-9,]+)\s*원/,
        /매각가격[:\s]*([0-9,]+)\s*원/,
        /감정가[:\s]*([0-9,]+)\s*원/,
    ];
    for (const p of patterns) {
        const m = aiSummary.match(p);
        if (m) return Math.round(parseInt(m[1].replace(/,/g, '')) / 10000);
    }
    return null;
}

function getDailyUsage(): number {
    if (typeof window === 'undefined') return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('car_valuation_usage');
    if (!stored) return 0;
    const { date, count } = JSON.parse(stored);
    return date === today ? count : 0;
}

function incrementUsage() {
    if (typeof window === 'undefined') return;

    const today = new Date().toISOString().split('T')[0];
    const current = getDailyUsage();
    localStorage.setItem('car_valuation_usage', JSON.stringify({ date: today, count: current + 1 }));
}

function resetUsage() {
    if (typeof window === 'undefined') return;
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('car_valuation_usage', JSON.stringify({ date: today, count: 0 }));
    // 새로고침하여 즉시 반영 (선택 사항이지만 명확한 피드백을 위해)
    window.location.reload();
}

function formatPrice(val: number): string {
    if (val >= 10000) return `${(val / 10000).toFixed(1)}억원`;
    return `${val.toLocaleString()}만원`;
}

function getGradeColor(grade: string) {
    if (grade.includes('매우 높음')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', border: 'border-emerald-200' };
    if (grade.includes('높음')) return { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500', border: 'border-green-200' };
    if (grade.includes('보통')) return { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500', border: 'border-yellow-200' };
    return { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500', border: 'border-red-200' };
}

// ── Components ──
function PriceBar({ label, min, max, maxValue, color }: { label: string; min: number; max: number; maxValue: number; color: string }) {
    const widthMin = Math.max(5, (min / maxValue) * 100);
    const widthMax = Math.max(5, (max / maxValue) * 100);
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-600">{label}</span>
                <span className="font-bold text-gray-800">{formatPrice(min)} ~ {formatPrice(max)}</span>
            </div>
            <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`absolute h-full rounded-full ${color} opacity-30`} style={{ width: `${widthMax}%`, transition: 'width 1.2s ease-out' }} />
                <div className={`absolute h-full rounded-full ${color}`} style={{ width: `${widthMin}%`, transition: 'width 1s ease-out' }} />
            </div>
        </div>
    );
}

function AuctionPriceBar({ price, maxValue }: { price: number; maxValue: number }) {
    const width = Math.max(5, (price / maxValue) * 100);
    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-indigo-700">⚡ 공매 매각가</span>
                <span className="font-black text-indigo-700">{formatPrice(price)}</span>
            </div>
            <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className="absolute h-full rounded-full bg-indigo-500" style={{ width: `${width}%`, transition: 'width 1s ease-out' }} />
            </div>
        </div>
    );
}

function ManualInputForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
    const [form, setForm] = useState({ manufacturer: '', model: '', year: '', mileage: '', fuelType: '', auctionPrice: '' });
    const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <div className="space-y-3">
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3 border border-amber-200">
                ⚠️ 이 공고는 차량 상세 정보가 제한적입니다. 원본 첨부파일에서 차량 정보를 확인한 뒤 아래에 입력해주세요.
            </p>
            <div className="grid grid-cols-2 gap-3">
                {/* Inputs ... */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">제조사</label>
                    <select value={form.manufacturer} onChange={e => update('manufacturer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none">
                        <option value="">선택</option>
                        {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">모델명</label>
                    <input value={form.model} onChange={e => update('model', e.target.value)} placeholder="예: X3 xDrive 20d"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">연식</label>
                    <input type="number" value={form.year} onChange={e => update('year', e.target.value)} placeholder="예: 2020"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">주행거리 (km)</label>
                    <input type="number" value={form.mileage} onChange={e => update('mileage', e.target.value)} placeholder="예: 50000"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">연료</label>
                    <select value={form.fuelType} onChange={e => update('fuelType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none">
                        <option value="">선택</option>
                        {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">매각가 (만원)</label>
                    <input type="number" value={form.auctionPrice} onChange={e => update('auctionPrice', e.target.value)} placeholder="예: 700"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                </div>
            </div>
            <button onClick={() => onSubmit(form)} disabled={loading || (!form.manufacturer && !form.model)}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm">
                🚀 시세 분석 시작하기
            </button>
        </div>
    );
}

const LOADING_STEPS = [
    { icon: '🔍', text: '차량 정보 확인 중...' },
    { icon: '📊', text: '중고차 시장 데이터 분석 중...' },
    { icon: '💰', text: '투자 수익률 계산 중...' },
    { icon: '📝', text: '전문가 의견 작성 중...' },
];

function LoadingView({ step }: { step: number }) {
    return (
        <div className="py-8 space-y-4">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${((step + 1) / LOADING_STEPS.length) * 100}%` }} />
            </div>
            <div className="space-y-2">
                {LOADING_STEPS.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-500 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                        <span className="text-lg">{s.icon}</span>
                        <span className={i === step ? 'font-bold text-indigo-700' : 'text-gray-600'}>{s.text}</span>
                        {i < step && <span className="text-emerald-500 text-xs font-bold">✓</span>}
                        {i === step && <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ResultView({ data, auctionPrice }: { data: CarValuationResult; auctionPrice: number | null }) {
    const gc = getGradeColor(data.investment_analysis.grade);
    const allPrices = [
        data.market_price.dealer_buy_min, data.market_price.dealer_buy_max,
        data.market_price.market_sell_min, data.market_price.market_sell_max,
        data.market_price.private_sale_min, data.market_price.private_sale_max,
        ...(auctionPrice ? [auctionPrice] : []),
    ];
    const maxValue = Math.max(...allPrices) * 1.1;

    return (
        <div className="space-y-6">
            <div className={`rounded-xl p-4 ${gc.bg} border ${gc.border}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-black ${gc.text}`}>🏆 투자 매력도: {data.investment_analysis.grade}</span>
                    <span className={`text-2xl font-black ${gc.text}`}>{data.investment_analysis.score}점</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
                    <div className={`h-full rounded-full ${gc.bar} transition-all duration-1500 ease-out`}
                        style={{ width: `${data.investment_analysis.score}%` }} />
                </div>
                {auctionPrice && (
                    <p className={`text-sm ${gc.text} mt-2 font-medium`}>
                        예상 수익: {formatPrice(data.investment_analysis.expected_profit_min)} ~ {formatPrice(data.investment_analysis.expected_profit_max)}
                        {' '}(ROI +{data.investment_analysis.roi_min}% ~ +{data.investment_analysis.roi_max}%)
                    </p>
                )}
            </div>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 mb-4">💰 시세 비교</h4>
                {auctionPrice && <AuctionPriceBar price={auctionPrice} maxValue={maxValue} />}
                <PriceBar label="딜러 매입가" min={data.market_price.dealer_buy_min} max={data.market_price.dealer_buy_max} maxValue={maxValue} color="bg-blue-500" />
                <PriceBar label="중고차 시장가" min={data.market_price.market_sell_min} max={data.market_price.market_sell_max} maxValue={maxValue} color="bg-emerald-500" />
                <PriceBar label="개인 직거래가" min={data.market_price.private_sale_min} max={data.market_price.private_sale_max} maxValue={maxValue} color="bg-amber-500" />
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 mb-3">📝 AI 분석 의견</h4>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-4">
                    {data.analysis_text}
                </div>
                {data.checkpoints.length > 0 && (
                    <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <h5 className="text-xs font-bold text-amber-800 mb-2">⚠️ 낙찰 전 체크포인트</h5>
                        <ul className="space-y-1">
                            {data.checkpoints.map((cp, i) => (
                                <li key={i} className="text-xs text-amber-700 flex gap-2">
                                    <span>•</span><span>{cp}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <h4 className="text-sm font-bold text-indigo-800 mb-2">📌 최종 판단</h4>
                <p className="text-sm text-indigo-700 font-medium">{data.conclusion}</p>
            </div>

            {data.sources && data.sources.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">📎 시세 근거 자료</h4>
                    <div className="space-y-2">
                        {data.sources.map((src, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg p-2.5 border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-indigo-600">🔗 {src.name}</span>
                                    <span className="text-gray-500">{src.detail}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-800">{src.price}</span>
                                    {src.url && src.url.startsWith('http') && (
                                        <a href={src.url} target="_blank" rel="noopener noreferrer"
                                            className="text-indigo-500 hover:text-indigo-700 underline">바로가기↗</a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[10px] text-gray-400 leading-relaxed">
                ⚠️ 본 시세 분석은 최신 AI 모델이 공개된 중고차 시장 데이터를 기반으로 추정한 참고 자료이며,
                실제 거래가와 차이가 있을 수 있습니다. 투자 결정은 반드시 실차 확인 후 진행하세요.
                분석일: {new Date(data.analyzed_at).toLocaleDateString('ko-KR')}
            </p>
        </div>
    );
}

export default function CarValuation({ noticeId, category, aiSummary, title }: CarValuationProps) {
    const [stage, setStage] = useState<Stage>('idle');
    const [loadingStep, setLoadingStep] = useState(0);
    const [result, setResult] = useState<CarValuationResult | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [showVerify, setShowVerify] = useState(false); // 후원 확인 대기 상태

    if (category !== 'vehicle') return null;

    const isAutoMode = hasDetailedVehicleInfo(aiSummary);
    const auctionPrice = extractAuctionPrice(aiSummary);

    const runAnalysis = useCallback(async (manualInput?: any) => {
        setStage('loading');
        setLoadingStep(0);
        setErrorMsg('');

        const stepTimer = setInterval(() => {
            setLoadingStep(prev => {
                if (prev >= LOADING_STEPS.length - 1) { clearInterval(stepTimer); return prev; }
                return prev + 1;
            });
        }, 2500);

        try {
            const body: any = { noticeId };
            if (manualInput) {
                body.manualInput = manualInput;
                body.auctionPrice = manualInput.auctionPrice ? parseInt(manualInput.auctionPrice) : null;
            } else {
                body.vehicleInfo = aiSummary || title;
                body.auctionPrice = auctionPrice;
            }

            const res = await fetch('/api/car-valuation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const json = await res.json();
            clearInterval(stepTimer);

            if (json.success) {
                incrementUsage();
                setResult(json.data);
                setStage('result');
            } else {
                setErrorMsg(json.error || '분석에 실패했습니다.');
                setStage('error');
            }
        } catch (err: any) {
            clearInterval(stepTimer);
            setErrorMsg(err.message || '네트워크 오류가 발생했습니다.');
            setStage('error');
        }
    }, [aiSummary, auctionPrice, noticeId, title]);

    return (
        <article className="relative overflow-hidden rounded-2xl border border-amber-200/80 shadow-lg bg-white mt-6">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🚗</span>
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">AI 중고차 시세 분석</h2>
                </div>
                <div className="flex items-center gap-2">
                    <a href={LITTLY_URL} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black bg-white text-orange-600 hover:scale-105 transition-all shadow-md animate-bounce-subtle">
                        ☕ 커피 후원
                    </a>
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 backdrop-blur-sm uppercase">
                        Premium
                    </span>
                </div>
            </div>

            <div className="p-6">
                {stage === 'idle' && (
                    isAutoMode ? (
                        <div className="text-center py-4">
                            <div className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                오늘 무료 분석: {Math.max(0, MAX_FREE_USES - getDailyUsage())} / {MAX_FREE_USES}회 남음
                            </div>
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                이 차량의 <strong className="text-indigo-700">실제 중고차 시세</strong>가 궁금하세요?<br />
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">전문가급 프리미엄 AI</span> 기반의 초정밀 알고리즘이<br />
                                KB차차차, 엔카 등 시장 데이터를 심층 분석합니다.
                            </p>
                            
                            {getDailyUsage() < MAX_FREE_USES ? (
                                <button onClick={() => runAnalysis()}
                                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md text-sm active:scale-95">
                                    🚀 시세 분석 시작하기
                                </button>
                            ) : (
                                <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-200 shadow-inner">
                                    {!showVerify ? (
                                        <>
                                            <div className="mb-4">
                                                <span className="text-3xl">☕</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-amber-900 mb-2">오늘의 무료 분석이 완료되었습니다</h3>
                                            <p className="text-xs text-amber-800 mb-5 leading-relaxed">
                                                추가 시세 분석이 필요하신가요?<br />
                                                커피 한 잔 후원 시 분석 기회를 충전해 드립니다.
                                            </p>
                                            <a href={LITTLY_URL} target="_blank" rel="noopener noreferrer" 
                                                onClick={() => setShowVerify(true)}
                                                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg text-sm animate-bounce-subtle">
                                                ☕ 후원하고 3회권 충전하기
                                            </a>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-4">
                                                <span className="text-3xl">✅</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-amber-900 mb-2">후원을 완료하셨나요?</h3>
                                            <p className="text-xs text-amber-800 mb-5 leading-relaxed">
                                                따뜻한 응원에 진심으로 감사드립니다.<br />
                                                보내주신 후원금은 더 좋은 정보를 위해 소중히 사용하겠습니다.
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                <button onClick={resetUsage}
                                                    className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg text-sm">
                                                    네, 후원을 완료했습니다
                                                </button>
                                                <button onClick={() => setShowVerify(false)}
                                                    className="text-[10px] text-amber-700/60 underline">
                                                    아직 하지 않았습니다 (뒤로가기)
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                                    오늘 무료 분석: {Math.max(0, MAX_FREE_USES - getDailyUsage())} / {MAX_FREE_USES}회 남음
                                </div>
                            </div>
                            {getDailyUsage() < MAX_FREE_USES ? (
                                <ManualInputForm onSubmit={(data) => runAnalysis(data)} loading={false} />
                            ) : (
                                <div className="text-center bg-amber-50 rounded-2xl p-6 border-2 border-amber-200 shadow-inner">
                                    {!showVerify ? (
                                        <>
                                            <div className="mb-4">
                                                <span className="text-3xl">☕</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-amber-900 mb-2">오늘의 무료 분석이 완료되었습니다</h3>
                                            <p className="text-xs text-amber-800 mb-5 leading-relaxed">
                                                상세 정보를 입력하여 더 정밀한 분석을 원하시나요?<br />
                                                커피 한 잔 후원 시 분석 기회를 충전해 드립니다.
                                            </p>
                                            <a href={LITTLY_URL} target="_blank" rel="noopener noreferrer" 
                                                onClick={() => setShowVerify(true)}
                                                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg text-sm animate-bounce-subtle">
                                                ☕ 후원하고 3회권 충전하기
                                            </a>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-4">
                                                <span className="text-3xl">✅</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-amber-900 mb-2">후원을 완료하셨나요?</h3>
                                            <p className="text-xs text-amber-800 mb-5 leading-relaxed">
                                                따뜻한 응원에 진심으로 감사드립니다.<br />
                                                보내주신 소중한 마음, 더 좋은 서비스로 보답하겠습니다.
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                <button onClick={resetUsage}
                                                    className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg text-sm">
                                                    네, 후원을 완료했습니다
                                                </button>
                                                <button onClick={() => setShowVerify(false)}
                                                    className="text-[10px] text-amber-700/60 underline">
                                                    아직 하지 않았습니다 (뒤로가기)
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                )}

                {stage === 'loading' && <LoadingView step={loadingStep} />}
                {stage === 'result' && result && <ResultView data={result} auctionPrice={auctionPrice} />}
                {stage === 'error' && (
                    <div className="text-center py-6">
                        <p className="text-red-500 text-sm mb-4">❌ {errorMsg}</p>
                        <button onClick={() => setStage('idle')}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                            다시 시도하기
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}
