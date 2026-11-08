import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isQualityNotice } from '@/lib/noticeQuality';
import { maskPersonNames, formatWon } from '@/lib/noticeText';

interface Props {
    currentId: string;
    saleOrg: string | null;
}

interface Row {
    id: string;
    title: string;
    date_posted: string | null;
    minimum_price: string | null;
    category: string | null;
    ai_summary: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
    real_estate: '부동산',
    vehicle: '차량/동산',
    bond: '채권',
    stock: '주식',
    patent: '특허',
    electronics: '전자장비',
    asset: '자산',
    etc: '기타',
};

/**
 * 같은 매각기관(파산재단·관재인)이 낸 다른 공고를 날짜순으로 보여준다.
 * 법원 공고 목록에서는 공고가 따로 흩어져 있어 한 파산재단의 매각 진행(재공고·가격 조정·포기)을
 * 한눈에 볼 수 없다 — 로옥션이 수집 이력으로 묶어 보여주는 정보.
 *
 * 링크는 품질 게이트를 통과한 공고에만 건다(얇은 페이지로의 크롤 누수 방지).
 * 본문 egress 를 줄이려고 content_text 는 내려받지 않고 'NULL 아님' 여부만 따로 조회한다.
 */
export default async function SameEstateNotices({ currentId, saleOrg }: Props) {
    if (!saleOrg || saleOrg.trim().length < 4) return null;

    const [{ data }, { data: withText }] = await Promise.all([
        supabase
            .from('court_notices')
            .select('id, title, date_posted, minimum_price, category, ai_summary')
            .eq('sale_org', saleOrg)
            .neq('id', currentId)
            .order('date_posted', { ascending: false })
            .limit(30),
        supabase
            .from('court_notices')
            .select('id')
            .eq('sale_org', saleOrg)
            .not('content_text', 'is', null)
            .limit(30),
    ]);

    const rows = (data as Row[] | null) ?? [];
    if (rows.length === 0) return null;
    const textIds = new Set((withText ?? []).map((r: { id: string }) => r.id));
    const linkable = (r: Row) => textIds.has(r.id) || isQualityNotice(r);

    const firstDate = rows[rows.length - 1]?.date_posted;

    return (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-soft">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">같은 매각기관의 다른 공고</h2>
                <p className="text-xs text-gray-500 mt-1">
                    {maskPersonNames(saleOrg)} 명의로 로옥션이 수집한 공고 {rows.length}건
                    {firstDate ? ` · ${firstDate}부터` : ''}
                </p>
            </div>
            <ol className="divide-y divide-gray-100">
                {rows.map((r) => {
                    const price = r.minimum_price ? Number(r.minimum_price) : null;
                    const body = (
                        <>
                            <span className="text-xs text-gray-500 font-mono w-24 flex-shrink-0">{r.date_posted}</span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-medium text-gray-900 truncate">{maskPersonNames(r.title)}</span>
                                <span className="block text-xs text-gray-500 mt-0.5">
                                    {CATEGORY_LABEL[r.category ?? 'etc'] ?? '기타'}
                                    {price && price > 0 ? ` · 공고상 최저가 ${formatWon(price)}` : ''}
                                </span>
                            </span>
                        </>
                    );
                    return (
                        <li key={r.id}>
                            {linkable(r) ? (
                                <Link href={`/notice/${r.id}`} className="flex gap-3 items-start px-6 py-3 hover:bg-indigo-50/40 transition-colors">
                                    {body}
                                </Link>
                            ) : (
                                <div className="flex gap-3 items-start px-6 py-3">{body}</div>
                            )}
                        </li>
                    );
                })}
            </ol>
            <p className="px-6 py-3 text-[11px] text-gray-500 border-t border-gray-100 bg-gray-50/50">
                매각기관 표기가 원문과 똑같은 공고만 묶었습니다. 표기가 조금이라도 다르면 같은 파산재단이어도 빠질 수 있습니다.
            </p>
        </section>
    );
}
