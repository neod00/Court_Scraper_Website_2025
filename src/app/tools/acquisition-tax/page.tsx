'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    RULES_CHECKED_AT,
    houseTax,
    nonHouseTax,
    vehicleTax,
    type TaxBreakdown,
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

function Choice<T extends string | number | boolean>({
    options,
    value,
    onChange,
    cols = 3,
}: {
    options: { value: T; label: string; hint?: string }[];
    value: T;
    onChange: (v: T) => void;
    cols?: number;
}) {
    return (
        <div className={`grid gap-2 ${cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {options.map((option) => (
                <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => onChange(option.value)}
                    aria-pressed={value === option.value}
                    className={`py-2 px-2 rounded-none text-sm font-medium border transition-colors ${value === option.value
                        ? 'bg-[#161616] text-white border-[#161616]'
                        : 'bg-[#FAF7EC] text-[#2E2B27] border-[#161616] hover:border-[#161616]'
                        }`}
                >
                    {option.label}
                    {option.hint && <span className={`block text-[11px] mt-0.5 ${value === option.value ? 'text-[#CFC8B8]' : 'text-[#6B655C]'}`}>{option.hint}</span>}
                </button>
            ))}
        </div>
    );
}

function PriceInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative">
            <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => onChange(formatNumber(e.target.value))}
                placeholder="0"
                aria-label="취득가액"
                className="w-full px-4 py-3 pr-12 border border-[#161616] rounded-none focus:ring-2 focus:ring-[#161616] focus:border-[#161616] text-right text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#57534E]">원</span>
        </div>
    );
}

function PropertyResult({ r }: { r: TaxBreakdown }) {
    return (
        <div className="space-y-4">
            <div className="bg-white/10 rounded-none p-4">
                <div className="text-[#CFC8B8] text-sm">적용 세율</div>
                <div className="text-3xl font-bold">{r.rate}%</div>
                <div className="text-[#CFC8B8] text-xs mt-1">{r.basis}</div>
            </div>
            <dl className="space-y-3">
                <div className="flex justify-between"><dt className="text-[#CFC8B8]">취득세</dt><dd className="font-medium">{won(r.acquisitionTax)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#CFC8B8]">지방교육세</dt><dd className="font-medium">{won(r.educationTax)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#CFC8B8]">농어촌특별세</dt><dd className="font-medium">{r.ruralTax > 0 ? won(r.ruralTax) : '비과세'}</dd></div>
            </dl>
            <div className="border-t border-white/20 pt-4">
                <div className="flex justify-between items-center">
                    <span className="text-lg">합계</span>
                    <span className="text-2xl font-bold">{won(r.total)}</span>
                </div>
                <div className="text-[#CFC8B8] text-sm text-right mt-1">취득가액 대비 {r.totalRate}%</div>
            </div>
        </div>
    );
}

const RATE_TABLE = [
    { label: '1주택 · 6억 원 이하', small: '1.1%', large: '1.3%' },
    { label: '1주택 · 6억 초과 9억 이하', small: '1.1~3.3%', large: '1.3~3.5%' },
    { label: '1주택 · 9억 원 초과', small: '3.3%', large: '3.5%' },
    { label: '2주택 · 조정대상지역', small: '8.4%', large: '9.0%' },
    { label: '3주택 · 비조정대상지역', small: '8.4%', large: '9.0%' },
    { label: '3주택 · 조정대상지역', small: '12.4%', large: '13.4%' },
    { label: '4주택 이상', small: '12.4%', large: '13.4%' },
];

const FAQ = [
    {
        q: '관재인 매각으로 산 부동산도 취득세율이 같은가요?',
        a: '파산관재인이나 회생 관리인과 매매계약을 맺어 취득하는 것은 유상취득이므로 일반 매매와 같은 세율을 씁니다. 과세표준은 실제로 지급한 매수대금(낙찰가)입니다.',
    },
    {
        q: '주택 수는 어떻게 세나요?',
        a: '이번에 취득하는 주택을 포함해 같은 세대(배우자와 미혼 30세 미만 자녀 등)가 가진 주택 수를 셉니다. 분양권·입주권, 주거용 오피스텔도 주택 수에 들어갈 수 있고, 시가표준액 1억 원 이하 주택 등은 제외될 수 있습니다.',
    },
    {
        q: '이사 때문에 잠시 2주택이 되면 8%를 내나요?',
        a: '종전 주택을 정해진 기간 안에 처분하는 일시적 2주택이면 일반세율(1~3%)을 적용받을 수 있습니다. 이 계산기는 그 예외를 판단하지 않으므로 해당하면 2주택 대신 1주택으로 놓고 계산하세요.',
    },
    {
        q: '경차는 왜 취득세가 0원으로 나오나요?',
        a: '비영업용 경자동차는 지방세특례제한법 제67조에 따라 취득세가 75만 원까지 면제됩니다. 산출세액이 75만 원을 넘으면 넘는 부분만 냅니다. 감면에는 적용기한이 있으니 등록 전에 위택스에서 확인하세요.',
    },
];

export default function AcquisitionTaxPage() {
    const [activeTab, setActiveTab] = useState<'property' | 'vehicle'>('property');

    const [propertyType, setPropertyType] = useState<PropertyType>('house');
    const [propertyPrice, setPropertyPrice] = useState('');
    const [housesAfter, setHousesAfter] = useState(1);
    const [regulated, setRegulated] = useState(false);
    const [over85, setOver85] = useState(false);

    const [vehicleKind, setVehicleKind] = useState<VehicleKind>('passenger');
    const [vehicleUse, setVehicleUse] = useState<VehicleUse>('personal');
    const [vehiclePrice, setVehiclePrice] = useState('');

    const price = parseNumber(propertyPrice);
    const propertyResult: TaxBreakdown | null = price
        ? propertyType === 'house'
            ? houseTax({ price, housesAfter, regulated, over85 })
            : nonHouseTax(price, propertyType)
        : null;

    const vPrice = parseNumber(vehiclePrice);
    const vehicleResult = vPrice ? vehicleTax(vPrice, vehicleKind, vehicleUse) : null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-[#57534E] mb-8" aria-label="breadcrumb">
                <Link href="/" className="hover:text-[#1F3D7A]">홈</Link>
                <span>/</span>
                <Link href="/tools" className="hover:text-[#1F3D7A]">계산기</Link>
                <span>/</span>
                <span className="text-[#161616] font-medium">취득세 계산기</span>
            </nav>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-[#161616]">취득세 계산기</h1>
                <p className="text-[#3A3A3A] mt-2 leading-relaxed">
                    회생·파산 매각이나 경매로 부동산·차량을 살 때 내는 취득세와 지방교육세, 농어촌특별세를 계산합니다.
                    다주택 중과와 조정대상지역 여부, 경차 감면을 반영합니다. 세율 확인일 {RULES_CHECKED_AT}.
                </p>
            </header>

            <div className="flex border-b border-[#161616] mb-8" role="tablist">
                {(['property', 'vehicle'] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab
                            ? 'border-[#161616] text-[#1F3D7A]'
                            : 'border-transparent text-[#57534E] hover:text-[#2E2B27]'
                            }`}
                    >
                        {tab === 'property' ? '부동산' : '차량'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#FAF7EC] rounded-none border border-[#C9C2B4] p-6">
                    <h2 className="text-lg font-bold text-[#161616] mb-6">
                        {activeTab === 'property' ? '부동산 정보 입력' : '차량 정보 입력'}
                    </h2>

                    {activeTab === 'property' ? (
                        <div className="space-y-5">
                            <div>
                                <p className="block text-sm font-medium text-[#2E2B27] mb-2">물건 종류</p>
                                <Choice
                                    value={propertyType}
                                    onChange={setPropertyType}
                                    options={[
                                        { value: 'house', label: '주택' },
                                        { value: 'building', label: '상가·토지', hint: '오피스텔·건물 포함' },
                                        { value: 'farmland', label: '농지', hint: '전·답·과수원' },
                                    ]}
                                />
                            </div>
                            <div>
                                <p className="block text-sm font-medium text-[#2E2B27] mb-2">취득가액 (낙찰가)</p>
                                <PriceInput value={propertyPrice} onChange={setPropertyPrice} />
                            </div>
                            {propertyType === 'house' && (
                                <>
                                    <div>
                                        <p className="block text-sm font-medium text-[#2E2B27] mb-1">취득 후 세대 주택 수</p>
                                        <p className="text-xs text-[#57534E] mb-2">이번에 사는 주택을 포함해 셉니다.</p>
                                        <Choice
                                            cols={4}
                                            value={housesAfter}
                                            onChange={setHousesAfter}
                                            options={[
                                                { value: 1, label: '1주택' },
                                                { value: 2, label: '2주택' },
                                                { value: 3, label: '3주택' },
                                                { value: 4, label: '4주택+' },
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <p className="block text-sm font-medium text-[#2E2B27] mb-2">주택 소재지</p>
                                        <Choice
                                            cols={2}
                                            value={regulated}
                                            onChange={setRegulated}
                                            options={[
                                                { value: false, label: '비조정대상지역' },
                                                { value: true, label: '조정대상지역' },
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <p className="block text-sm font-medium text-[#2E2B27] mb-2">전용면적</p>
                                        <Choice
                                            cols={2}
                                            value={over85}
                                            onChange={setOver85}
                                            options={[
                                                { value: false, label: '85㎡ 이하' },
                                                { value: true, label: '85㎡ 초과' },
                                            ]}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div>
                                <p className="block text-sm font-medium text-[#2E2B27] mb-2">차종</p>
                                <Choice
                                    value={vehicleKind}
                                    onChange={setVehicleKind}
                                    options={[
                                        { value: 'light', label: '경차', hint: '1,000cc 미만' },
                                        { value: 'passenger', label: '승용차' },
                                        { value: 'van_truck', label: '승합·화물' },
                                    ]}
                                />
                            </div>
                            <div>
                                <p className="block text-sm font-medium text-[#2E2B27] mb-2">용도</p>
                                <Choice
                                    cols={2}
                                    value={vehicleUse}
                                    onChange={setVehicleUse}
                                    options={[
                                        { value: 'personal', label: '비영업용', hint: '자가용' },
                                        { value: 'business', label: '영업용', hint: '택시·렌터카·화물운송' },
                                    ]}
                                />
                            </div>
                            <div>
                                <p className="block text-sm font-medium text-[#2E2B27] mb-2">취득가액 (낙찰가)</p>
                                <PriceInput value={vehiclePrice} onChange={setVehiclePrice} />
                            </div>
                            <p className="text-xs text-[#57534E] leading-relaxed">
                                공채, 번호판, 등록 수수료까지 합친 이전 비용은{' '}
                                <Link href="/tools/vehicle-transfer" className="text-[#1F3D7A] underline">차량 이전비 계산기</Link>에서 볼 수 있습니다.
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-[#161616] rounded-none p-6 text-white" aria-live="polite">
                    <h2 className="text-lg font-bold mb-6">계산 결과</h2>
                    {activeTab === 'property' ? (
                        propertyResult ? <PropertyResult r={propertyResult} /> : (
                            <p className="text-center text-[#CFC8B8] py-12">취득가액을 입력하면 바로 계산합니다.</p>
                        )
                    ) : vehicleResult ? (
                        <div className="space-y-4">
                            <div className="bg-white/10 rounded-none p-4">
                                <div className="text-[#CFC8B8] text-sm">적용 세율</div>
                                <div className="text-3xl font-bold">{vehicleResult.rate}%</div>
                                <div className="text-[#CFC8B8] text-xs mt-1">{vehicleResult.basis}</div>
                            </div>
                            <dl className="space-y-3">
                                <div className="flex justify-between"><dt className="text-[#CFC8B8]">산출 취득세</dt><dd className="font-medium">{won(vehicleResult.grossTax)}</dd></div>
                                {vehicleResult.relief > 0 && (
                                    <div className="flex justify-between"><dt className="text-[#CFC8B8]">경차 감면</dt><dd className="font-medium">−{won(vehicleResult.relief)}</dd></div>
                                )}
                            </dl>
                            <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                                <span className="text-lg">납부 취득세</span>
                                <span className="text-2xl font-bold">{won(vehicleResult.tax)}</span>
                            </div>
                            <p className="text-xs text-[#CFC8B8]">차량 취득에는 지방교육세와 농어촌특별세가 붙지 않습니다.</p>
                        </div>
                    ) : (
                        <p className="text-center text-[#CFC8B8] py-12">취득가액을 입력하면 바로 계산합니다.</p>
                    )}
                </div>
            </div>

            <section className="mt-12" aria-labelledby="how-heading">
                <h2 id="how-heading" className="text-xl font-bold text-[#161616] mb-4">계산 방법</h2>
                <ol className="list-decimal list-inside space-y-2 text-[#2E2B27] leading-relaxed">
                    <li><strong>과세표준</strong>은 실제 매수대금(낙찰가)입니다. 관재인 매각과 경매 모두 실제 지급액을 씁니다.</li>
                    <li><strong>취득세</strong>는 과세표준에 세율을 곱합니다. 1주택 6억~9억 원 구간은 (취득가액 × 2/3억 − 3)% 산식으로 세율이 1%에서 3%까지 올라갑니다.</li>
                    <li><strong>지방교육세</strong>는 일반세율 주택이면 취득세의 10%, 중과 주택이면 취득가액의 0.4%, 상가·토지는 0.4%, 농지는 0.2%입니다.</li>
                    <li><strong>농어촌특별세</strong>는 전용 85㎡ 이하 주택이면 비과세입니다. 85㎡ 초과 주택은 일반 0.2%, 8% 중과 0.6%, 12% 중과 1.0%이고 상가·토지·농지는 0.2%입니다.</li>
                </ol>
            </section>

            <section className="mt-10" aria-labelledby="table-heading">
                <h2 id="table-heading" className="text-xl font-bold text-[#161616] mb-4">주택 취득세 총 부담률표 (개인·유상취득)</h2>
                <div className="overflow-x-auto rounded-none border border-[#161616] bg-[#FAF7EC]">
                    <table className="w-full text-sm">
                        <thead className="bg-[#F4F0E6] text-[#3A3A3A]">
                            <tr>
                                <th scope="col" className="text-left px-4 py-3 font-medium">구분</th>
                                <th scope="col" className="text-right px-4 py-3 font-medium">85㎡ 이하</th>
                                <th scope="col" className="text-right px-4 py-3 font-medium">85㎡ 초과</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RATE_TABLE.map((row) => (
                                <tr key={row.label} className="border-t border-[#C9C2B4]">
                                    <th scope="row" className="text-left px-4 py-3 font-normal text-[#161616]">{row.label}</th>
                                    <td className="text-right px-4 py-3 text-[#161616]">{row.small}</td>
                                    <td className="text-right px-4 py-3 text-[#161616]">{row.large}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-[#57534E] mt-2">
                    취득세·지방교육세·농어촌특별세를 합친 값입니다. 비조정대상지역 2주택은 1주택과 같은 일반세율을 씁니다.
                    상가·오피스텔·토지는 4.6%, 농지는 3.4%입니다.
                </p>
            </section>

            <section className="mt-10" aria-labelledby="example-heading">
                <h2 id="example-heading" className="text-xl font-bold text-[#161616] mb-4">계산 예시</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#2E2B27] leading-relaxed">
                    <div className="rounded-none border border-[#161616] bg-[#FAF7EC] p-5">
                        <p className="font-semibold text-[#161616] mb-2">무주택자가 7억 5천만 원 아파트(84㎡)를 낙찰</p>
                        <p>세율은 (7.5 × 2/3 − 3) = 2%입니다. 취득세 1,500만 원, 지방교육세 150만 원, 농어촌특별세 비과세로 합계 1,650만 원입니다.</p>
                    </div>
                    <div className="rounded-none border border-[#161616] bg-[#FAF7EC] p-5">
                        <p className="font-semibold text-[#161616] mb-2">관재인 매각으로 3억 원 상가를 매수</p>
                        <p>취득세 4% 1,200만 원, 지방교육세 120만 원, 농어촌특별세 60만 원으로 합계 1,380만 원입니다.</p>
                    </div>
                </div>
            </section>

            <section className="mt-10" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-xl font-bold text-[#161616] mb-4">자주 묻는 질문</h2>
                <div className="space-y-3">
                    {FAQ.map((item) => (
                        <details key={item.q} className="rounded-none border border-[#161616] bg-[#FAF7EC] p-5">
                            <summary className="font-semibold text-[#161616] cursor-pointer">{item.q}</summary>
                            <p className="mt-3 text-sm text-[#2E2B27] leading-relaxed">{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            <section className="mt-10 bg-[#F6F1C4] rounded-none p-6 border border-[#161616]" aria-labelledby="limit-heading">
                <h2 id="limit-heading" className="text-base font-bold text-[#161616] mb-3">근거 법령과 계산하지 않는 것</h2>
                <p className="text-sm text-[#161616] leading-relaxed mb-3">
                    지방세법 제11조·제12조·제13조의2·제151조, 농어촌특별세법 제5조, 지방세특례제한법 제67조를 기준으로 {RULES_CHECKED_AT}에 확인했습니다.
                    실제 신고세액은 관할 시·군·구 세무부서가 정합니다.
                </p>
                <ul className="text-sm text-[#161616] space-y-1">
                    <li>• 법인 취득, 상속·증여, 생애최초 주택 감면, 일시적 2주택 등 예외는 계산하지 않습니다.</li>
                    <li>• 조정대상지역은 국토교통부 고시로 바뀌므로 취득일 기준 지정 여부를 확인해야 합니다.</li>
                    <li>• 법령이 바뀌면 결과가 달라집니다. 위택스(wetax.go.kr)와 국가법령정보센터(law.go.kr)에서 확인하세요.</li>
                </ul>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/tools/bid-calculator" className="inline-flex items-center gap-2 bg-[#E9E4D8] text-[#2E2B27] px-5 py-3 rounded-none font-medium hover:bg-[#DCD6C8]">
                    입찰가 계산기 →
                </Link>
                <Link href="/category/real-estate" className="inline-flex items-center gap-2 bg-[#E9E4D8] text-[#2E2B27] px-5 py-3 rounded-none font-medium hover:bg-[#DCD6C8]">
                    부동산 매각 공고 보기 →
                </Link>
            </div>
        </div>
    );
}
