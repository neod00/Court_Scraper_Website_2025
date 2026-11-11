'use client';

import { useState } from 'react';
import { CALC_RULES_CHECKED_AT, loanSchedule, type LoanMethod } from '@/lib/calcRules';
import { Choice, Explain, Faq, Field, Limits, MoneyInput, NumberInput, Panels, Related, ResultRows, EmptyResult, ToolHeader, digits, wonText } from '@/components/calc/CalcUI';

export default function LoanPage() {
    const [principal, setPrincipal] = useState('');
    const [rate, setRate] = useState('4.5');
    const [years, setYears] = useState('30');
    const [grace, setGrace] = useState('0');
    const [method, setMethod] = useState<LoanMethod>('annuity');
    const [showAll, setShowAll] = useState(false);

    const months = Math.min(600, Math.round((Number(years) || 0) * 12));
    const r = loanSchedule(digits(principal), Number(rate) || 0, months, method, Math.round((Number(grace) || 0) * 12));
    const rows = r ? (showAll ? r.rows : r.rows.slice(0, 12)) : [];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ToolHeader
                title="대출 이자·상환 계산기"
                intro="잔금을 대출로 낼 때 상환 방식(원리금균등·원금균등·만기일시)에 따라 매달 내는 돈과 전체 이자를 계산합니다. 거치기간도 넣을 수 있습니다."
                checked={CALC_RULES_CHECKED_AT}
            />
            <Panels
                input={
                    <>
                        <Field id="ln-p" label="대출 원금"><MoneyInput id="ln-p" value={principal} onChange={setPrincipal} /></Field>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <Field id="ln-r" label="연 금리"><NumberInput id="ln-r" value={rate} onChange={setRate} unit="%" /></Field>
                            <Field id="ln-y" label="기간"><NumberInput id="ln-y" value={years} onChange={setYears} unit="년" /></Field>
                            <Field id="ln-g" label="거치"><NumberInput id="ln-g" value={grace} onChange={setGrace} unit="년" /></Field>
                        </div>
                        <Field id="ln-m" label="상환 방식">
                            <Choice label="상환 방식" value={method} onChange={setMethod} options={[{ value: 'annuity', label: '원리금균등' }, { value: 'equal_principal', label: '원금균등' }, { value: 'bullet', label: '만기일시' }]} />
                        </Field>
                    </>
                }
                result={
                    r ? (
                        <>
                            <p className="text-sm text-[#CFC8B8] mb-1">첫 달 납입액</p>
                            <p className="num text-3xl font-extrabold mb-5">{wonText(r.firstPayment)}</p>
                            <ResultRows rows={[
                                { label: '가장 많이 내는 달', value: wonText(r.maxPayment) },
                                { label: '총이자', value: wonText(r.totalInterest) },
                                { label: '총상환액', value: wonText(r.totalPayment), strong: true },
                            ]} />
                        </>
                    ) : (
                        <EmptyResult text="대출 원금과 기간을 입력하면 바로 계산합니다." />
                    )
                }
            />
            {r && (
                <section aria-labelledby="schedule" className="mt-8">
                    <h2 id="schedule" className="text-xl font-extrabold tracking-[-0.04em] pb-2 mb-3 border-b-2 border-[#161616]">월별 상환표</h2>
                    <div className="overflow-x-auto border border-[#161616] bg-[#FAF7EC]">
                        <table className="w-full text-sm num">
                            <thead><tr className="text-left text-xs"><th scope="col" className="px-3 py-2">회차</th><th scope="col" className="px-3 py-2 text-right">납입액</th><th scope="col" className="px-3 py-2 text-right">원금</th><th scope="col" className="px-3 py-2 text-right">이자</th><th scope="col" className="px-3 py-2 text-right">남은 원금</th></tr></thead>
                            <tbody>
                                {rows.map((x) => (
                                    <tr key={x.month} className="border-t border-[#C9C2B4]">
                                        <td className="px-3 py-1.5">{x.month}</td>
                                        <td className="px-3 py-1.5 text-right font-bold">{x.payment.toLocaleString('ko-KR')}</td>
                                        <td className="px-3 py-1.5 text-right">{x.principal.toLocaleString('ko-KR')}</td>
                                        <td className="px-3 py-1.5 text-right">{x.interest.toLocaleString('ko-KR')}</td>
                                        <td className="px-3 py-1.5 text-right">{x.balance.toLocaleString('ko-KR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {r.rows.length > 12 && (
                        <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 min-h-11 px-4 border border-[#161616] bg-[#FAF7EC] text-sm font-bold hover:bg-[#161616] hover:text-[#FAF7EC]">
                            {showAll ? '처음 12개월만 보기' : `전체 ${r.rows.length}개월 보기`}
                        </button>
                    )}
                </section>
            )}
            <Explain id="how" title="상환 방식의 차이">
                <p><strong>원리금균등</strong>은 매달 같은 금액을 냅니다. 처음에는 이자 비중이 크고 갈수록 원금 비중이 커집니다.</p>
                <p><strong>원금균등</strong>은 매달 같은 원금에 남은 원금의 이자를 더해 냅니다. 첫 달 부담이 가장 크고 점점 줄며, 총이자는 원리금균등보다 적습니다.</p>
                <p><strong>만기일시</strong>는 기간 동안 이자만 내고 마지막 달에 원금을 한 번에 갚습니다. 총이자가 가장 큽니다.</p>
                <p>거치기간에는 이자만 내고, 거치가 끝난 뒤 남은 기간 동안 선택한 방식으로 원금을 갚습니다.</p>
            </Explain>
            <Explain id="faq" title="자주 묻는 질문">
                <Faq items={[
                    { q: '관재인 매각 물건도 담보대출이 되나요?', a: '소유권 이전 전후 시점, 물건 상태, 권리관계에 따라 금융기관 판단이 다릅니다. 잔금 기한이 짧은 공고가 많으므로 입찰 전에 대출 가능 여부와 실행 일정을 먼저 확인하세요.' },
                    { q: '금리가 바뀌는 변동금리도 계산되나요?', a: '이 계산기는 입력한 금리가 끝까지 유지된다고 가정합니다. 변동금리는 금리를 바꿔 가며 여러 번 계산해 범위를 보세요.' },
                ]} />
            </Explain>
            <Limits items={['중도상환수수료, 인지세, 보증료 등 부대비용은 넣지 않았습니다.', '실제 상환액은 금융기관의 일할 계산 방식에 따라 몇 원 달라질 수 있습니다.']} />
            <Related links={[{ href: '/tools/bid-deposit', label: '입찰보증금·잔금 계산기' }, { href: '/tools/roi-calculator', label: '매도·임대 손익 계산기' }, { href: '/tools/acquisition-tax', label: '취득세 계산기' }]} />
        </div>
    );
}
