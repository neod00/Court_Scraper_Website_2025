'use client';

import { useState } from 'react';
import { CALC_RULES_CHECKED_AT, brokerageFee, leaseAmount, type BrokerKind } from '@/lib/calcRules';
import { Choice, Explain, Faq, Field, Limits, MoneyInput, Panels, Related, ResultRows, EmptyResult, ToolHeader, digits, wonText } from '@/components/calc/CalcUI';

type Deal = 'sale' | 'jeonse' | 'monthly';
type Target = 'house' | 'officetel' | 'other';

const SALE_TABLE = [
    ['5천만 원 미만', '0.6%', '25만 원'],
    ['5천만 ~ 2억 원 미만', '0.5%', '80만 원'],
    ['2억 ~ 9억 원 미만', '0.4%', '-'],
    ['9억 ~ 12억 원 미만', '0.5%', '-'],
    ['12억 ~ 15억 원 미만', '0.6%', '-'],
    ['15억 원 이상', '0.7%', '-'],
];
const LEASE_TABLE = [
    ['5천만 원 미만', '0.5%', '20만 원'],
    ['5천만 ~ 1억 원 미만', '0.4%', '30만 원'],
    ['1억 ~ 6억 원 미만', '0.3%', '-'],
    ['6억 ~ 12억 원 미만', '0.4%', '-'],
    ['12억 ~ 15억 원 미만', '0.5%', '-'],
    ['15억 원 이상', '0.6%', '-'],
];

export default function BrokerageFeePage() {
    const [target, setTarget] = useState<Target>('house');
    const [deal, setDeal] = useState<Deal>('sale');
    const [price, setPrice] = useState('');
    const [deposit, setDeposit] = useState('');
    const [monthly, setMonthly] = useState('');

    const amount = deal === 'monthly' ? leaseAmount(digits(deposit), digits(monthly)) : digits(price);
    const kind: BrokerKind = target === 'other' ? 'other'
        : target === 'officetel' ? (deal === 'sale' ? 'officetel_sale' : 'officetel_lease')
            : (deal === 'sale' ? 'house_sale' : 'house_lease');
    const r = amount > 0 ? brokerageFee(kind, amount) : null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ToolHeader
                title="중개보수 계산기"
                intro="부동산을 사고팔거나 전세·월세로 내놓을 때 공인중개사에게 내는 중개보수의 법정 상한을 계산합니다. 관재인 매각으로 산 집을 되팔거나 임대할 때 미리 비용을 잡아 보세요."
                checked={CALC_RULES_CHECKED_AT}
            />
            <Panels
                input={
                    <>
                        <Field id="bf-target" label="중개대상물">
                            <Choice label="중개대상물" value={target} onChange={setTarget} options={[{ value: 'house', label: '주택' }, { value: 'officetel', label: '오피스텔' }, { value: 'other', label: '토지·상가 등' }]} />
                        </Field>
                        <Field id="bf-deal" label="거래 종류">
                            <Choice label="거래 종류" value={deal} onChange={setDeal} options={[{ value: 'sale', label: '매매' }, { value: 'jeonse', label: '전세' }, { value: 'monthly', label: '월세' }]} />
                        </Field>
                        {deal === 'monthly' ? (
                            <>
                                <Field id="bf-dep" label="보증금"><MoneyInput id="bf-dep" value={deposit} onChange={setDeposit} /></Field>
                                <Field id="bf-mon" label="월세"><MoneyInput id="bf-mon" value={monthly} onChange={setMonthly} /></Field>
                            </>
                        ) : (
                            <Field id="bf-price" label={deal === 'sale' ? '매매가' : '전세 보증금'}><MoneyInput id="bf-price" value={price} onChange={setPrice} /></Field>
                        )}
                    </>
                }
                result={
                    r ? (
                        <>
                            <p className="text-sm text-[#CFC8B8] mb-1">중개보수 상한 (부가세 별도)</p>
                            <p className="num text-3xl font-extrabold mb-5">{wonText(r.fee)}</p>
                            <ResultRows rows={[
                                { label: '거래금액', value: wonText(r.amount) },
                                { label: '상한 요율', value: `${r.rate}%` },
                                { label: '한도액', value: r.cap ? wonText(r.cap) : '없음' },
                                { label: '부가세 포함(일반과세 중개사)', value: wonText(r.fee + r.vat), strong: true },
                            ]} />
                            <p className="mt-4 text-xs text-[#CFC8B8] leading-relaxed">{r.note}</p>
                        </>
                    ) : (
                        <EmptyResult text="거래 금액을 입력하면 바로 계산합니다." />
                    )
                }
            />
            <Explain id="table" title="주택 중개보수 상한 요율표">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[{ title: '매매·교환', rows: SALE_TABLE }, { title: '임대차(전세·월세)', rows: LEASE_TABLE }].map((t) => (
                        <div key={t.title} className="border border-[#161616] bg-[#FAF7EC] overflow-x-auto">
                            <table className="w-full text-sm">
                                <caption className="text-left px-3 py-2 font-bold border-b border-[#161616]">{t.title}</caption>
                                <thead><tr className="text-left text-xs"><th scope="col" className="px-3 py-2">거래금액</th><th scope="col" className="px-3 py-2">상한 요율</th><th scope="col" className="px-3 py-2">한도액</th></tr></thead>
                                <tbody>{t.rows.map((r) => <tr key={r[0]} className="border-t border-[#C9C2B4]"><td className="px-3 py-2">{r[0]}</td><td className="px-3 py-2 num">{r[1]}</td><td className="px-3 py-2 num">{r[2]}</td></tr>)}</tbody>
                            </table>
                        </div>
                    ))}
                </div>
                <p>공인중개사법 시행규칙 별표 1(2021년 10월 19일 시행)의 상한이며, 시·도 조례로 정합니다. 주택 외 중개대상물은 거래금액의 0.9% 이내에서 협의합니다.</p>
            </Explain>
            <Explain id="how" title="월세 거래금액 계산">
                <p>월세는 보증금 + 월세 × 100을 거래금액으로 봅니다. 그 금액이 5천만 원 미만이면 보증금 + 월세 × 70으로 다시 계산합니다.</p>
            </Explain>
            <Explain id="faq" title="자주 묻는 질문">
                <Faq items={[
                    { q: '법원 경매나 관재인 매각으로 살 때도 중개보수를 내나요?', a: '낙찰받아 사는 과정에는 중개사가 끼지 않으므로 중개보수가 없습니다. 다만 입찰 대리나 컨설팅을 맡기면 별도 수수료가 생기고, 산 뒤 되팔거나 임대할 때는 이 계산기의 중개보수가 듭니다.' },
                    { q: '상한보다 적게 낼 수 있나요?', a: '표의 요율은 상한입니다. 실제 요율은 그 범위 안에서 중개사와 협의해 정하고, 중개대상물 확인·설명서에 적습니다.' },
                ]} />
            </Explain>
            <Limits items={['시·도 조례가 시행규칙과 다르게 정한 경우는 반영하지 않습니다.', '간이과세자 중개사의 부가세율 차이는 반영하지 않습니다.']} />
            <Related links={[{ href: '/tools/roi-calculator', label: '매도·임대 손익 계산기' }, { href: '/tools/acquisition-tax', label: '취득세 계산기' }, { href: '/tools/loan', label: '대출 이자·상환 계산기' }]} />
        </div>
    );
}
