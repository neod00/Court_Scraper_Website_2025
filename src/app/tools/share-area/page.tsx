'use client';

import { useState } from 'react';
import { CALC_RULES_CHECKED_AT, PYEONG_M2, parseShare, shareArea } from '@/lib/calcRules';
import { Explain, Faq, Field, Limits, MoneyInput, NumberInput, Panels, Related, ResultRows, EmptyResult, ToolHeader, digits, wonText, shortWonText } from '@/components/calc/CalcUI';

const fmt = (n: number, d = 2) => n.toLocaleString('ko-KR', { maximumFractionDigits: d });

export default function ShareAreaPage() {
    const [total, setTotal] = useState('');
    const [share, setShare] = useState('');
    const [price, setPrice] = useState('');

    const parsed = parseShare(share);
    const r = parsed ? shareArea(Number(total), parsed[0], parsed[1], digits(price)) : null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ToolHeader
                title="지분·면적 환산 계산기"
                intro="공고에 '임야 14,380㎡ 중 50951분의 329 지분'처럼 적힌 지분 매각을 실제 면적과 평수로 바꾸고, 매각가를 ㎡당·평당 가격과 전체 환산가로 계산합니다."
                checked={CALC_RULES_CHECKED_AT}
            />
            <Panels
                input={
                    <>
                        <Field id="sa-total" label="전체 면적" hint="등기부·공고에 적힌 토지(또는 건물) 전체 면적">
                            <NumberInput id="sa-total" value={total} onChange={setTotal} unit="㎡" />
                        </Field>
                        <Field id="sa-share" label="지분" hint="'50951분의 329' 또는 '329/50951'처럼 공고 표기 그대로 입력">
                            <input id="sa-share" type="text" value={share} onChange={(e) => setShare(e.target.value)} placeholder="예: 3309분의 16.5" className="w-full min-h-12 border border-[#161616] bg-[#FAF7EC] px-3 text-right text-base num focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#161616]" />
                        </Field>
                        <Field id="sa-price" label="최저입찰가 또는 매수 예정가 (선택)">
                            <MoneyInput id="sa-price" value={price} onChange={setPrice} />
                        </Field>
                        {share && !parsed && <p className="text-sm font-bold">지분 표기를 읽지 못했습니다. &apos;분모분의 분자&apos; 또는 &apos;분자/분모&apos;로 적어 주세요.</p>}
                    </>
                }
                result={
                    r ? (
                        <>
                            <p className="text-sm text-[#CFC8B8] mb-1">내 지분 면적</p>
                            <p className="num text-3xl font-extrabold mb-1">{fmt(r.shareM2)}㎡</p>
                            <p className="num text-lg font-bold mb-5">약 {fmt(r.sharePyeong)}평 <span className="text-sm font-normal text-[#CFC8B8]">(전체 {fmt(r.totalPyeong)}평)</span></p>
                            <ResultRows
                                rows={[
                                    { label: '지분 비율', value: `${fmt(r.ratio * 100, 4)}%` },
                                    ...(r.pricePerM2 !== null ? [
                                        { label: '㎡당 가격', value: wonText(r.pricePerM2) },
                                        { label: '평당 가격', value: wonText(r.pricePerPyeong!) },
                                        { label: '전체 면적으로 환산한 가격', value: shortWonText(r.wholeEquivalent!), strong: true },
                                    ] : []),
                                ]}
                            />
                        </>
                    ) : (
                        <EmptyResult text="전체 면적과 지분을 입력하면 바로 계산합니다." />
                    )
                }
            />

            <Explain id="how" title="계산 방법">
                <p>지분 면적은 전체 면적 × (분자 ÷ 분모)입니다. &apos;A분의 B&apos;는 A가 분모, B가 분자입니다. 평은 1평 = {PYEONG_M2}㎡(400/121㎡)로 나눠 구합니다.</p>
                <p>전체 환산가는 지분 가격 ÷ 지분 비율입니다. 같은 땅을 통째로 산다면 얼마에 해당하는지 보여 주므로, 주변 시세나 공시지가와 견줘 볼 때 씁니다.</p>
            </Explain>
            <Explain id="example" title="계산 예시">
                <p>임야 3,309㎡ 중 3309분의 16.5 지분을 165만 원에 산다면 지분 면적은 16.5㎡(약 4.99평), ㎡당 10만 원이고, 전체 면적으로 환산하면 약 3억 3,090만 원입니다.</p>
            </Explain>
            <Explain id="faq" title="자주 묻는 질문">
                <Faq items={[
                    { q: '지분만 사면 그 면적을 따로 쓸 수 있나요?', a: '아닙니다. 지분은 땅 전체에 대한 비율이라 특정 위치를 정해 쓰려면 다른 공유자와 합의하거나 공유물분할 절차를 거쳐야 합니다. 그래서 지분 매각은 전체 환산가보다 훨씬 낮은 값에 거래되는 경우가 많습니다.' },
                    { q: '공고의 면적이 등기부와 다르면 어떻게 하나요?', a: '등기부등본(토지는 토지대장)의 면적이 기준입니다. 공고 표기와 다르면 관재인 사무실에 확인하세요.' },
                ]} />
            </Explain>
            <Limits items={['공유물분할 비용·소송 기간, 다른 공유자의 우선매수 가능성은 계산하지 않습니다.', '평 환산은 참고용이며 법적 면적 단위는 ㎡입니다.']} />
            <Related links={[{ href: '/tools/acquisition-tax', label: '취득세 계산기' }, { href: '/tools/round-cost', label: '회차별 총비용 비교' }, { href: '/category/real-estate', label: '부동산 공고 보기' }]} />
        </div>
    );
}
