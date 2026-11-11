import Link from 'next/link';
import { toTextBlocks, formatWon, type RoundRow } from '@/lib/noticeText';

/** 원문 한 줄이 '1. 매각대상', '가. 입찰방법' 같은 항목 제목인지 */
function isHeadingLine(line: string): boolean {
    return /^\s*(\d{1,2}\.|[가-하]\.|[①-⑳]|\[|【)\s*\S/.test(line) && line.length <= 60;
}

/** 첨부 공고문 원문 — PDF·HWP 를 열지 않고 읽을 수 있게 텍스트로 옮긴 것 */
export function OriginalTextSection({ text, ocr = false }: { text: string; ocr?: boolean }) {
    const blocks = toTextBlocks(text);
    return (
        <section className="bg-[#FAF7EC] rounded-none border border-[#161616] overflow-hidden">
            <div className="px-6 py-4 bg-[#F4F0E6] border-b border-[#C9C2B4]">
                <h2 className="text-lg font-bold text-[#161616]">첨부 공고문 원문</h2>
                <p className="text-xs text-[#57534E] mt-1">
                    {ocr
                        ? '스캔 이미지로 올라온 첨부파일을 AI가 읽어 글자로 옮겼습니다. 개인 채무자·보증인 이름은 성만 남겼습니다.'
                        : '법원에 게시된 첨부파일(PDF·HWP)의 글자를 그대로 옮겼습니다. 표는 줄 단위로 풀어 적혀 있고, 개인 채무자·보증인 이름은 성만 남겼습니다.'}
                </p>
            </div>
            {ocr && (
                <div role="note" className="px-6 py-3 bg-[#F6F1C4] border-b border-[#161616] text-sm text-[#161616] leading-relaxed">
                    <strong className="font-bold">이미지에서 읽은 글자입니다.</strong>{' '}
                    사람 이름, 차량번호, 차대번호, 주소, 금액이 실제와 다를 수 있습니다. 입찰 전에는 반드시 아래 첨부파일 원본을 열어 확인하세요.
                </div>
            )}
            <div className="p-4 sm:p-6 md:p-8 max-h-[44rem] overflow-y-auto">
                <div className="text-[15px] leading-[1.85] text-[#161616] space-y-4 break-keep">
                    {blocks.map((block, bi) => (
                        <div key={bi}>
                            {block.split('\n').map((line, li) =>
                                isHeadingLine(line) ? (
                                    <p key={li} className="font-bold text-[#161616] mt-3 first:mt-0">{line}</p>
                                ) : (
                                    <p key={li}>{line}</p>
                                ),
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <p className="px-6 py-3 text-[11px] text-[#57534E] border-t border-[#C9C2B4] bg-[#F4F0E6]">
                글자 추출 과정에서 표 배치·별지·사진은 빠질 수 있습니다. 효력은 법원 원문 첨부파일이 기준입니다.
            </p>
        </section>
    );
}

/** 원문에서 복원한 회차별 최저입찰가 표 */
export function RoundTableSection({ rows, ocr = false, kind }: { rows: RoundRow[]; ocr?: boolean; kind?: 'house' | 'building' }) {
    const first = rows[0].price;
    const last = rows[rows.length - 1].price;
    const hasSchedule = rows.some((r) => r.schedule.length > 0);
    const drop = first > 0 ? Math.round((1 - last / first) * 100) : 0;
    return (
        <section className="bg-[#FAF7EC] rounded-none border border-[#161616] overflow-hidden">
            <div className="px-6 py-4 bg-[#F4F0E6] border-b border-[#C9C2B4]">
                <h2 className="text-lg font-bold text-[#161616]">회차별 최저입찰가</h2>
                <p className="text-xs text-[#57534E] mt-1">
                    {rows.length}회차, 1회차 {formatWon(first)}에서 {rows.length}회차 {formatWon(last)}까지
                    {drop > 0 ? ` ${drop}% 낮아지는 구조` : ''}입니다. {ocr ? '스캔 이미지를 AI가 읽은 표입니다.' : '첨부 원문의 표를 그대로 옮겼습니다.'}
                </p>
            </div>
            {ocr && (
                <p role="note" className="px-6 py-3 bg-[#F6F1C4] border-b border-[#161616] text-sm text-[#161616] leading-relaxed">
                    <strong className="font-bold">이미지에서 읽은 금액입니다.</strong>{' '}
                    회차·일정·금액이 원본과 다를 수 있으니 입찰 전에 첨부파일 원본의 표와 대조하세요.
                </p>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-[#F4F0E6] text-xs text-[#57534E]">
                        <tr>
                            <th scope="col" className="pl-4 pr-2 sm:px-6 py-2 text-left font-medium whitespace-nowrap">회차</th>
                            {hasSchedule && <th scope="col" className="px-2 sm:px-3 py-2 text-left font-medium">원문 일정</th>}
                            <th scope="col" className="pl-2 pr-4 sm:px-3 py-2 text-right font-medium whitespace-nowrap">최저입찰가</th>
                            <th scope="col" className="hidden sm:table-cell px-6 py-2 text-right font-medium whitespace-nowrap">1회차 대비</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C9C2B4]">
                        {rows.map((r) => (
                            <tr key={r.round}>
                                <td className="pl-4 pr-2 sm:px-6 py-2 font-medium text-[#161616] whitespace-nowrap">{r.round}회</td>
                                {hasSchedule && (
                                    <td className="px-2 sm:px-3 py-2 text-[#3A3A3A] text-xs">{r.schedule.join(' / ') || '-'}</td>
                                )}
                                <td className="pl-2 pr-4 sm:px-3 py-2 text-right font-mono text-[#161616] whitespace-nowrap">{formatWon(r.price)}</td>
                                <td className="hidden sm:table-cell px-6 py-2 text-right text-[#57534E] text-xs whitespace-nowrap">
                                    {r.round === 1 ? '기준' : `${Math.round((r.price / first) * 100)}%`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="px-6 py-3 text-[11px] text-[#57534E] border-t border-[#C9C2B4]">
                {hasSchedule ? '일정 칸은 원문 표의 같은 줄에 적힌 날짜·시각(입찰 마감, 개찰 등)을 순서대로 적은 것입니다. ' : ''}
                정정 공고나 별지로 조건이 바뀔 수 있으니 입찰 전 원문을 확인하세요.
            </p>
            <div className="px-6 py-3 border-t border-[#C9C2B4] flex flex-wrap gap-2">
                {kind && (
                    // 회차별 총비용 계산기는 부동산 취득세 규칙만 있어 부동산 공고에서만 연결한다.
                    <Link
                        href={`/tools/round-cost?prices=${rows.map((r) => r.price).join(',')}&kind=${kind}`}
                        className="inline-flex items-center min-h-11 px-3 border border-[#161616] text-sm font-bold hover:bg-[#161616] hover:text-[#FAF7EC]"
                    >
                        이 회차표로 총비용 계산하기 →
                    </Link>
                )}
                <Link href="/tools/bid-deposit" className="inline-flex items-center min-h-11 px-3 border border-[#161616] text-sm font-bold hover:bg-[#161616] hover:text-[#FAF7EC]">
                    보증금·잔금 계산 →
                </Link>
            </div>
        </section>
    );
}
