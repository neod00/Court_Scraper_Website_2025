'use client';

import { useState } from 'react';
import { CALC_RULES_CHECKED_AT, bondRecovery } from '@/lib/calcRules';
import { Explain, Faq, Field, Limits, MoneyInput, NumberInput, Panels, Related, ResultRows, EmptyResult, ToolHeader, digits, wonText } from '@/components/calc/CalcUI';

const pct = (n: number) => `${n.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%`;

export default function BondRecoveryPage() {
    const [face, setFace] = useState('');
    const [price, setPrice] = useState('');
    const [recovery, setRecovery] = useState('30');
    const [costs, setCosts] = useState('');
    const [months, setMonths] = useState('12');

    const r = bondRecovery(digits(face), digits(price), Number(recovery) || 0, digits(costs), Number(months) || 0);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ToolHeader
                title="채권 회수율 계산기"
                intro="파산재단이 파는 매출채권·대여금채권을 살 때, 채권 액면 대비 얼마를 회수해야 손해를 보지 않는지(손익분기 회수율)와 예상 회수율별 손익을 계산합니다."
                checked={CALC_RULES_CHECKED_AT}
            />
            <Panels
                input={
                    <>
                        <Field id="br-face" label="채권 액면(원금)" hint="공고·채권 목록의 채권 금액 합계"><MoneyInput id="br-face" value={face} onChange={setFace} /></Field>
                        <Field id="br-price" label="매수(입찰) 가격"><MoneyInput id="br-price" value={price} onChange={setPrice} /></Field>
                        <Field id="br-rec" label="예상 회수율" hint="액면 대비 실제로 받아낼 것으로 보는 비율"><NumberInput id="br-rec" value={recovery} onChange={setRecovery} unit="%" /></Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field id="br-cost" label="회수 비용" hint="소송·집행·추심 비용"><MoneyInput id="br-cost" value={costs} onChange={setCosts} /></Field>
                            <Field id="br-mon" label="회수까지 기간"><NumberInput id="br-mon" value={months} onChange={setMonths} unit="개월" /></Field>
                        </div>
                    </>
                }
                result={
                    r ? (
                        <>
                            <p className="text-sm text-[#CFC8B8] mb-1">손익분기 회수율</p>
                            <p className="num text-3xl font-extrabold mb-1">액면의 {pct(r.breakEvenPct)}</p>
                            <p className="text-sm text-[#CFC8B8] mb-5">이 비율보다 많이 받아내야 이익입니다. 매수가는 액면의 {pct(r.pricePct)}입니다.</p>
                            <ResultRows rows={[
                                { label: '예상 회수액', value: wonText(r.recovery) },
                                { label: '총투입(매수가+비용)', value: wonText(digits(price) + digits(costs)) },
                                { label: '투입 대비 수익률', value: pct(r.roi) },
                                { label: '연 환산(단리)', value: r.annualized !== null ? pct(r.annualized) : '-' },
                                { label: '예상 손익', value: `${r.profit < 0 ? '−' : ''}${wonText(Math.abs(r.profit))}`, strong: true },
                            ]} />
                        </>
                    ) : (
                        <EmptyResult text="채권 액면과 매수 가격을 입력하면 바로 계산합니다." />
                    )
                }
            />
            <Explain id="how" title="계산 방법">
                <p>예상 회수액 = 액면 × 예상 회수율, 손익 = 예상 회수액 − (매수가 + 회수 비용)입니다. 손익분기 회수율은 (매수가 + 회수 비용) ÷ 액면으로, 이만큼은 받아내야 본전입니다.</p>
                <p>연 환산 수익률은 투입 대비 수익률을 회수 기간으로 나눠 1년 기준으로 바꾼 단순 비율입니다.</p>
            </Explain>
            <Explain id="faq" title="자주 묻는 질문">
                <Faq items={[
                    { q: '회수율은 어떻게 짐작하나요?', a: '채무자의 현재 재산·소득, 담보·보증 여부, 소멸시효, 이미 받은 판결이 있는지에 따라 크게 다릅니다. 채권 목록과 관련 서류를 관재인에게 열람 요청해 확인한 뒤, 보수적인 회수율로 계산해 보세요.' },
                    { q: '채권을 사면 바로 받을 수 있나요?', a: '채권양도 사실을 채무자에게 통지해야 채무자에게 맞설 수 있습니다. 통지는 보통 양도인(파산관재인)이 하며, 계약서에 통지 방법이 적혀 있습니다.' },
                ]} />
            </Explain>
            <Limits items={['회수가 여러 번에 나눠 들어오는 경우의 시간가치(할인율)는 반영하지 않습니다.', '채권 양수에 따른 세금·인지세는 넣지 않았습니다.']} />
            <Related links={[{ href: '/category/bonds', label: '채권·주식 공고 보기' }, { href: '/tools/round-cost', label: '회차별 총비용 비교' }, { href: '/tools/bid-deposit', label: '입찰보증금·잔금 계산기' }]} />
        </div>
    );
}
