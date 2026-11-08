import { toTextBlocks, formatWon, type RoundRow } from '@/lib/noticeText';

/** 원문 한 줄이 '1. 매각대상', '가. 입찰방법' 같은 항목 제목인지 */
function isHeadingLine(line: string): boolean {
    return /^\s*(\d{1,2}\.|[가-하]\.|[①-⑳]|\[|【)\s*\S/.test(line) && line.length <= 60;
}

/** 첨부 공고문 원문 — PDF·HWP 를 열지 않고 읽을 수 있게 텍스트로 옮긴 것 */
export function OriginalTextSection({ text }: { text: string }) {
    const blocks = toTextBlocks(text);
    return (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-soft">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">첨부 공고문 원문</h2>
                <p className="text-xs text-gray-500 mt-1">
                    법원에 게시된 첨부파일(PDF·HWP)의 글자를 그대로 옮겼습니다. 표는 줄 단위로 풀어 적혀 있고, 개인 채무자·보증인 이름은 성만 남겼습니다.
                </p>
            </div>
            <div className="p-4 sm:p-6 md:p-8 max-h-[44rem] overflow-y-auto">
                <div className="text-[15px] leading-[1.85] text-gray-800 space-y-4 break-keep">
                    {blocks.map((block, bi) => (
                        <div key={bi}>
                            {block.split('\n').map((line, li) =>
                                isHeadingLine(line) ? (
                                    <p key={li} className="font-bold text-gray-900 mt-3 first:mt-0">{line}</p>
                                ) : (
                                    <p key={li}>{line}</p>
                                ),
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <p className="px-6 py-3 text-[11px] text-gray-500 border-t border-gray-100 bg-gray-50/50">
                글자 추출 과정에서 표 배치·별지·사진은 빠질 수 있습니다. 효력은 법원 원문 첨부파일이 기준입니다.
            </p>
        </section>
    );
}

/** 원문에서 복원한 회차별 최저입찰가 표 */
export function RoundTableSection({ rows }: { rows: RoundRow[] }) {
    const first = rows[0].price;
    const last = rows[rows.length - 1].price;
    const hasSchedule = rows.some((r) => r.schedule.length > 0);
    const drop = first > 0 ? Math.round((1 - last / first) * 100) : 0;
    return (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-soft">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">회차별 최저입찰가</h2>
                <p className="text-xs text-gray-500 mt-1">
                    {rows.length}회차, 1회차 {formatWon(first)}에서 {rows.length}회차 {formatWon(last)}까지
                    {drop > 0 ? ` ${drop}% 낮아지는 구조` : ''}입니다. 첨부 원문의 표를 그대로 옮겼습니다.
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/60 text-xs text-gray-500">
                        <tr>
                            <th scope="col" className="pl-4 pr-2 sm:px-6 py-2 text-left font-medium whitespace-nowrap">회차</th>
                            {hasSchedule && <th scope="col" className="px-2 sm:px-3 py-2 text-left font-medium">원문 일정</th>}
                            <th scope="col" className="pl-2 pr-4 sm:px-3 py-2 text-right font-medium whitespace-nowrap">최저입찰가</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-2 text-right font-medium whitespace-nowrap">1회차 대비</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((r) => (
                            <tr key={r.round}>
                                <td className="pl-4 pr-2 sm:px-6 py-2 font-medium text-gray-900 whitespace-nowrap">{r.round}회</td>
                                {hasSchedule && (
                                    <td className="px-2 sm:px-3 py-2 text-gray-600 text-xs">{r.schedule.join(' / ') || '-'}</td>
                                )}
                                <td className="pl-2 pr-4 sm:px-3 py-2 text-right font-mono text-gray-900 whitespace-nowrap">{formatWon(r.price)}</td>
                                <td className="hidden sm:table-cell px-6 py-2 text-right text-gray-500 text-xs whitespace-nowrap">
                                    {r.round === 1 ? '기준' : `${Math.round((r.price / first) * 100)}%`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="px-6 py-3 text-[11px] text-gray-500 border-t border-gray-100">
                {hasSchedule ? '일정 칸은 원문 표의 같은 줄에 적힌 날짜·시각(입찰 마감, 개찰 등)을 순서대로 적은 것입니다. ' : ''}
                정정 공고나 별지로 조건이 바뀔 수 있으니 입찰 전 원문을 확인하세요.
            </p>
        </section>
    );
}
