'use client';

import { useState } from 'react';
import { CALC_RULES_CHECKED_AT, depositPlan } from '@/lib/calcRules';
import { Choice, Explain, Faq, Field, Limits, MoneyInput, NumberInput, Panels, Related, ResultRows, EmptyResult, ToolHeader, digits, wonText } from '@/components/calc/CalcUI';

export default function BidDepositPage() {
    const [minPrice, setMinPrice] = useState('');
    const [bid, setBid] = useState('');
    const [rate, setRate] = useState('10');
    const [base, setBase] = useState<'min' | 'bid'>('min');
    const [award, setAward] = useState('');
    const [days, setDays] = useState('30');

    const minV = digits(minPrice);
    const bidV = digits(bid) || minV;
    const r = minV > 0 ? depositPlan(minV, bidV, Number(rate) || 0, base, award || null, Number(days) || 0) : null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ToolHeader
                title="입찰보증금·잔금 계산기"
                intro="관재인 매각 공고에 적힌 보증금 비율로 입찰할 때 미리 넣을 보증금과, 낙찰 뒤 계약 때 낼 잔금, 잔금 납부 기한을 계산합니다."
                checked={CALC_RULES_CHECKED_AT}
            />
            <Panels
                input={
                    <>
                        <Field id="bd-min" label="최저입찰가"><MoneyInput id="bd-min" value={minPrice} onChange={setMinPrice} /></Field>
                        <Field id="bd-bid" label="써낼 입찰가" hint="비워 두면 최저입찰가로 계산합니다."><MoneyInput id="bd-bid" value={bid} onChange={setBid} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field id="bd-rate" label="보증금 비율"><NumberInput id="bd-rate" value={rate} onChange={setRate} unit="%" /></Field>
                            <Field id="bd-days" label="잔금 기한" hint="낙찰·계약일부터"><NumberInput id="bd-days" value={days} onChange={setDays} unit="일" /></Field>
                        </div>
                        <Field id="bd-base" label="보증금 기준" hint="공고 문구를 확인하세요. '최저입찰가의 10%'가 가장 흔합니다.">
                            <Choice label="보증금 기준" value={base} onChange={setBase} options={[{ value: 'min', label: '최저입찰가 기준' }, { value: 'bid', label: '입찰가 기준' }]} />
                        </Field>
                        <Field id="bd-award" label="낙찰(계약) 예정일 (선택)">
                            <input id="bd-award" type="date" value={award} onChange={(e) => setAward(e.target.value)} className="w-full min-h-12 border border-[#161616] bg-[#FAF7EC] px-3 text-base num" />
                        </Field>
                    </>
                }
                result={
                    r ? (
                        <>
                            <p className="text-sm text-[#CFC8B8] mb-1">입찰 때 넣을 보증금</p>
                            <p className="num text-3xl font-extrabold mb-5">{wonText(r.deposit)}</p>
                            <ResultRows rows={[
                                { label: '입찰가', value: wonText(bidV) },
                                { label: '보증금 (계약금으로 전환)', value: wonText(r.deposit) },
                                { label: '잔금 납부 기한', value: r.dueDate ?? '낙찰 예정일을 넣으면 표시' },
                                { label: '낙찰 뒤 낼 잔금', value: wonText(r.balance), strong: true },
                            ]} />
                        </>
                    ) : (
                        <EmptyResult text="최저입찰가를 입력하면 바로 계산합니다." />
                    )
                }
            />
            <Explain id="how" title="계산 방법">
                <p>보증금은 기준 금액 × 보증금 비율입니다. 관재인 매각은 보통 낙찰자의 보증금을 계약금으로 돌리고, 잔금은 입찰가에서 보증금을 뺀 금액을 정해진 기한 안에 냅니다.</p>
                <p>잔금 기한은 낙찰(계약) 예정일에 입력한 일수를 더해 계산합니다. 공고에 따라 &apos;계약일로부터 7일&apos;, &apos;30일 이내&apos; 등 다릅니다.</p>
            </Explain>
            <Explain id="faq" title="자주 묻는 질문">
                <Faq items={[
                    { q: '떨어지면 보증금은 돌려받나요?', a: '낙찰되지 않은 응찰자의 보증금은 공고에 적힌 방법으로 돌려줍니다. 반대로 낙찰 뒤 계약을 하지 않거나 잔금을 내지 않으면 보증금이 몰수되는 경우가 많습니다.' },
                    { q: '보증금은 어떻게 내나요?', a: '현금·자기앞수표를 입찰서와 함께 내거나 관재인이 지정한 계좌로 입금합니다. 입금 마감 시각이 따로 정해진 공고가 많으니 원문을 확인하세요.' },
                ]} />
            </Explain>
            <Limits items={['법원 허가가 늦어져 잔금 기한이 바뀌는 경우는 반영하지 않습니다.', '취득세·등기비용은 포함하지 않습니다(취득세 계산기 참고).']} />
            <Related links={[{ href: '/tools/round-cost', label: '회차별 총비용 비교' }, { href: '/tools/loan', label: '대출 이자·상환 계산기' }, { href: '/tools/acquisition-tax', label: '취득세 계산기' }]} />
        </div>
    );
}
