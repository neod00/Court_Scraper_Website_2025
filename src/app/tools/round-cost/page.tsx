'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { houseTax, nonHouseTax } from '@/lib/acquisitionTax';
import { CALC_RULES_CHECKED_AT, parsePriceList, roundPrices } from '@/lib/calcRules';
import { Choice, Explain, Faq, Field, Limits, MoneyInput, NumberInput, Panels, Related, EmptyResult, ToolHeader, digits, shortWonText, withComma } from '@/components/calc/CalcUI';

type Kind = 'house' | 'building' | 'farmland';

function RoundCost() {
    const params = useSearchParams();
    // 공고 상세의 회차표에서 넘어오면 ?prices=3949580,2764700,... 로 채운다.
    const initialList = params.get('prices') || '';
    const [mode, setMode] = useState<'list' | 'rate'>(initialList ? 'list' : 'rate');
    const [list, setList] = useState(initialList.split(',').filter(Boolean).map((n) => withComma(n)).join(' / '));
    const [first, setFirst] = useState('');
    const [rounds, setRounds] = useState('5');
    const [drop, setDrop] = useState('20');
    const [kind, setKind] = useState<Kind>(params.get('kind') === 'building' ? 'building' : 'house');
    const [extra, setExtra] = useState('');

    const prices = useMemo(() => {
        if (mode === 'list') return parsePriceList(list);
        const f = digits(first);
        const n = Math.min(20, Math.max(2, Number(rounds) || 0));
        return f > 0 ? roundPrices(f, n, Number(drop) || 0, 'rate') : null;
    }, [mode, list, first, rounds, drop]);

    const extraCost = digits(extra);
    const rows = prices?.map((p, i) => {
        const tax = kind === 'house' ? houseTax({ price: p, housesAfter: 1, regulated: false, over85: false }).total : nonHouseTax(p, kind).total;
        return { round: i + 1, price: p, tax, total: p + tax + extraCost, ratio: Math.round((p / prices[0]) * 100) };
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ToolHeader
                title="회차별 총비용 비교"
                intro="회생·파산 매각 공고는 유찰될 때마다 최저입찰가가 내려갑니다. 회차마다 최저가에 취득세와 기타 비용을 더한 총비용을 나란히 놓고, 몇 회차에서 예산에 들어오는지 봅니다."
                checked={CALC_RULES_CHECKED_AT}
            />
            <Panels
                input={
                    <>
                        <Field id="rc-mode" label="최저가 입력 방식">
                            <Choice label="최저가 입력 방식" value={mode} onChange={setMode} options={[{ value: 'list', label: '공고 금액 그대로' }, { value: 'rate', label: '인하율로 계산' }]} />
                        </Field>
                        {mode === 'list' ? (
                            <Field id="rc-list" label="회차별 최저입찰가" hint="공고 회차표의 금액을 순서대로 붙여 넣으세요. 쉼표·슬래시·줄바꿈 모두 됩니다.">
                                <textarea id="rc-list" value={list} onChange={(e) => setList(e.target.value)} rows={3} placeholder="3,949,580 / 2,764,700 / 1,935,290" className="w-full border border-[#161616] bg-[#FAF7EC] p-3 text-base num" />
                            </Field>
                        ) : (
                            <>
                                <Field id="rc-first" label="1회차 최저입찰가"><MoneyInput id="rc-first" value={first} onChange={setFirst} /></Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field id="rc-rounds" label="회차 수"><NumberInput id="rc-rounds" value={rounds} onChange={setRounds} unit="회" /></Field>
                                    <Field id="rc-drop" label="회차당 인하율" hint="직전 회차 대비"><NumberInput id="rc-drop" value={drop} onChange={setDrop} unit="%" /></Field>
                                </div>
                            </>
                        )}
                        <Field id="rc-kind" label="물건 종류(취득세)" hint="주택은 1주택·비조정대상지역·85㎡ 이하 기준">
                            <Choice label="물건 종류" value={kind} onChange={setKind} options={[{ value: 'house', label: '주택' }, { value: 'building', label: '상가·토지' }, { value: 'farmland', label: '농지' }]} />
                        </Field>
                        <Field id="rc-extra" label="기타 비용 (명도·수리·등기 등)"><MoneyInput id="rc-extra" value={extra} onChange={setExtra} /></Field>
                    </>
                }
                result={
                    rows && rows.length >= 2 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm num">
                                <thead>
                                    <tr className="text-left text-[#CFC8B8] border-b border-[#FAF7EC]/30">
                                        <th scope="col" className="py-2 pr-2 font-semibold">회차</th>
                                        <th scope="col" className="py-2 px-2 font-semibold text-right">최저가</th>
                                        <th scope="col" className="py-2 px-2 font-semibold text-right">취득세 등</th>
                                        <th scope="col" className="py-2 pl-2 font-semibold text-right">총비용</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.round} className="border-b border-[#FAF7EC]/15">
                                            <td className="py-2 pr-2 font-bold">{r.round}회 <span className="font-normal text-[#CFC8B8]">{r.ratio}%</span></td>
                                            <td className="py-2 px-2 text-right">{shortWonText(r.price)}</td>
                                            <td className="py-2 px-2 text-right">{shortWonText(r.tax)}</td>
                                            <td className="py-2 pl-2 text-right font-extrabold">{shortWonText(r.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="mt-3 text-xs text-[#CFC8B8]">퍼센트는 1회차 최저가 대비입니다. 2회차 이후는 앞 회차가 유찰돼야 열립니다.</p>
                        </div>
                    ) : (
                        <EmptyResult text="회차별 금액을 넣거나 1회차 최저가와 인하율을 입력하세요." />
                    )
                }
            />
            <Explain id="how" title="계산 방법">
                <p>회차마다 최저입찰가로 낙찰된다고 가정하고, 그 가격에 대한 취득세·지방교육세·농어촌특별세를 <a href="/tools/acquisition-tax" className="underline">취득세 계산기</a>와 같은 규칙으로 더한 뒤 기타 비용을 합칩니다.</p>
                <p>인하율로 계산할 때는 직전 회차 최저가에서 같은 비율을 계속 뺍니다(정률 인하). 공고마다 인하 방식이 다르므로 가능하면 공고 금액을 그대로 붙여 넣으세요.</p>
            </Explain>
            <Explain id="faq" title="자주 묻는 질문">
                <Faq items={[
                    { q: '마지막 회차까지 기다리면 가장 싸게 살 수 있나요?', a: '앞 회차에서 누군가 낙찰받으면 뒤 회차는 열리지 않습니다. 법원은 낙찰 여부를 공개하지 않으므로 회차마다 관재인 사무실에 진행 여부를 확인해야 합니다.' },
                    { q: '최저가보다 높게 써야 하나요?', a: '최저입찰가 이상이면 응찰할 수 있고, 같은 회차에 여러 명이 응찰하면 가장 높은 금액이 낙찰됩니다. 경쟁이 예상되면 최저가보다 높게 쓰는 것이 일반적입니다.' },
                ]} />
            </Explain>
            <Limits items={['다주택 중과·조정대상지역은 반영하지 않습니다(취득세 계산기에서 따로 확인).', '부가가치세가 별도인 공고는 그 금액을 기타 비용에 넣어야 합니다.']} />
            <Related links={[{ href: '/tools/acquisition-tax', label: '취득세 계산기' }, { href: '/tools/bid-deposit', label: '입찰보증금·잔금 계산기' }, { href: '/tools/bid-calculator', label: '입찰가 계산기' }]} />
        </div>
    );
}

export default function RoundCostPage() {
    return (
        <Suspense fallback={null}>
            <RoundCost />
        </Suspense>
    );
}
