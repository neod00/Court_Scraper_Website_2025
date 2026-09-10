import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '로옥션 소개',
    description:
        '로옥션(LawAuction)은 법원 회생·파산 자산매각 공고를 수집·보관하고, 그 데이터를 바탕으로 주간 칼럼과 월간 리포트, 검수 편집 글을 발행하는 1인 운영 정보 서비스입니다.',
    alternates: { canonical: '/about' },
};

const MONTHLY_COUNTS: { month: string; count: number }[] = [
    { month: '2026-03', count: 443 },
    { month: '2026-04', count: 425 },
    { month: '2026-05', count: 358 },
    { month: '2026-06', count: 515 },
    { month: '2026-07', count: 422 },
    { month: '2026-08', count: 399 },
];

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">로옥션 소개</h1>
            <p className="text-gray-600 leading-relaxed mb-8">
                로옥션(LawAuction)은 대한민국 법원이 공개하는 회생·파산 자산매각 공고를 수집·보관하고,
                그 데이터를 사람이 읽을 수 있는 형태로 정리하는 민간 정보 서비스입니다. 법원이나
                법원행정처와 제휴·보증 관계에 있지 않습니다.
            </p>

            <div className="bg-white shadow rounded-lg p-6 space-y-10">
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">무엇을 제공하나요</h2>
                    <ul className="space-y-3 text-gray-600 leading-relaxed">
                        <li>
                            <strong className="text-gray-800">공고 검색</strong> — 게시일, 자산 분류, 키워드로
                            공고를 찾고 법원 원문·첨부파일 링크로 이동할 수 있습니다.{' '}
                            <Link href="/" className="text-indigo-600 hover:underline">검색하기</Link>
                        </li>
                        <li>
                            <strong className="text-gray-800">데이터랩</strong> — 법원별·분류별 건수와 입찰
                            일정 분포를 표와 그래프로 보여 줍니다.{' '}
                            <Link href="/datalab" className="text-indigo-600 hover:underline">데이터랩 보기</Link>
                        </li>
                        <li>
                            <strong className="text-gray-800">주간 데이터 칼럼</strong> — 한 주 동안 수집한
                            공고 집계에 운영자의 해석을 붙여 발행합니다. 해석이 붙지 않은 주차는 발행하지 않습니다.{' '}
                            <Link href="/trend" className="text-indigo-600 hover:underline">주간 칼럼 보기</Link>
                        </li>
                        <li>
                            <strong className="text-gray-800">월간 리포트</strong> — 한 달치 공고를 법원·자산
                            유형·최저매각가 분포·입찰 일정으로 나누어 정리한 보고서입니다. 운영자 검토를
                            마친 달부터 순차적으로 공개합니다.
                        </li>
                        <li>
                            <strong className="text-gray-800">검수 편집 글</strong> — 공고를 읽는 방법과 관련
                            절차를 설명하는 글입니다. 각 글에 최종 확인일과 참고 자료를 표시합니다.{' '}
                            <Link href="/blog" className="text-indigo-600 hover:underline">편집 글 보기</Link>
                        </li>
                        <li>
                            <strong className="text-gray-800">용어사전</strong> — 공고에 자주 등장하는 용어를
                            공고 문구 빈도와 함께 설명합니다.{' '}
                            <Link href="/glossary" className="text-indigo-600 hover:underline">용어사전 보기</Link>
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">누가 운영하나요</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        로옥션은 1인이 운영합니다. 운영자는 수집 프로그램의 유지, 데이터 검수, 주간 칼럼과
                        월간 리포트의 작성·검토, 편집 글의 사실 확인, 오류 신고 처리를 맡습니다. 변호사·세무사
                        등 자격 있는 전문가를 표방하지 않으며, 개별 사건에 대한 법률·세무 판단을 제공하지
                        않습니다. 작성·검수 절차는{' '}
                        <Link href="/authors/lawauction-editorial-team" className="text-indigo-600 hover:underline">
                            콘텐츠 작성과 검수 방식
                        </Link>
                        에서 확인할 수 있습니다.
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 text-sm space-y-1">
                        <p><strong>서비스명:</strong> 로옥션(LawAuction)</p>
                        <p><strong>운영 형태:</strong> 개인사업자(1인 운영)</p>
                        <p><strong>사업자등록번호:</strong> 199-06-02412</p>
                        <p>
                            <strong>문의 이메일:</strong>{' '}
                            <a href="mailto:openbrain.main@gmail.com" className="text-indigo-600 hover:underline">
                                openbrain.main@gmail.com
                            </a>
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">어떻게 만드나요</h2>
                    <dl className="space-y-4 text-gray-600 leading-relaxed">
                        <div>
                            <dt className="font-semibold text-gray-800">수집</dt>
                            <dd>
                                대한민국 법원 대국민서비스(scourt.go.kr)의 회생·파산 자산매각 공고 목록을
                                하루 3회 확인해 새 공고의 제목, 게시일, 담당 법원과 담당 부서 연락처, 원문·첨부파일 링크 등 목록 정보를 저장합니다.
                                공고 본문은 저장하지 않고 원문 링크로 안내합니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-gray-800">AI 요약의 범위</dt>
                            <dd>
                                첨부 PDF에서 매각 대상, 최저매각가, 회차별 가격, 입찰 방법, 보증금 문구를 찾아
                                항목별로 정리하는 데에만 AI를 사용합니다. 첨부파일을 읽지 못한 공고는 요약
                                없이 원문 링크만 표시합니다. AI 요약은 원문에 없는 내용을 덧붙이지 않으며,
                                감정평가나 권리분석을 대신하지 않습니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-gray-800">사람 검수 주기</dt>
                            <dd>
                                주간 칼럼은 매주 운영자가 집계를 읽고 해석을 쓴 뒤 발행합니다. 월간 리포트는
                                매월 초안을 만들어 운영자가 검토한 뒤 공개합니다. 편집 글은 발행 시 원문·법령과
                                대조하고, 이후 분기마다 다시 확인해 최종 확인일을 갱신합니다.
                            </dd>
                        </div>
                    </dl>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">데이터 범위와 한계</h2>
                    <ul className="list-disc pl-6 space-y-2 text-gray-600 leading-relaxed">
                        <li>수집 시작일은 2025년 12월 30일입니다. 그 이전 공고는 보유하지 않습니다.</li>
                        <li>
                            2026년 3~8월에는 매월 358~515건의 공고를 수집했습니다(집계일 2026-09-08).
                        </li>
                        <li>
                            같은 기간 수집한 2,562건 중 첨부파일에서 요약을 추출한 공고는 1,120건(약 44%)입니다.
                            나머지는 첨부파일이 없거나 읽을 수 없어 요약 없이 보관합니다.
                        </li>
                        <li>
                            낙찰 여부나 낙찰 금액 같은 매각 결과는 수집하지 않습니다. 공고 시점의 조건만 다룹니다.
                        </li>
                        <li>
                            자산 분류는 제목 키워드로 자동 부여하므로 실제 매각 대상과 다를 수 있습니다.
                            분류가 어긋난 공고는 통계에서 제외하지 않고 원문 확인을 안내합니다.
                        </li>
                        <li>
                            종료된 공고도 통계와 변경 이력 확인을 위해 보관합니다. 현재 유효한 조건은 법원
                            원문을 기준으로 확인해야 합니다.
                        </li>
                    </ul>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-[320px] text-sm text-gray-700 border border-gray-200">
                            <caption className="text-left text-xs text-gray-500 mb-1">
                                월별 수집 공고 건수 (2026-03~08, 집계일 2026-09-08)
                            </caption>
                            <thead className="bg-gray-50">
                                <tr>
                                    {MONTHLY_COUNTS.map((m) => (
                                        <th key={m.month} className="px-3 py-2 font-medium border-b border-gray-200">
                                            {m.month.slice(5)}월
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {MONTHLY_COUNTS.map((m) => (
                                        <td key={m.month} className="px-3 py-2 text-center tabular-nums">
                                            {m.count.toLocaleString('ko-KR')}건
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">데이터 출처</h2>
                    <p className="text-gray-600 leading-relaxed">
                        모든 공고 데이터는{' '}
                        <a
                            href="https://www.scourt.go.kr"
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline"
                        >
                            대한민국 법원 대국민서비스
                        </a>
                        에 공개된 자료를 바탕으로 합니다. 법원이 제공하는 원문이 최종적·공식적인 효력을
                        가지며, 로옥션의 정리와 해석은 참고 정보입니다. 자세한 기준은{' '}
                        <Link href="/editorial-policy" className="text-indigo-600 hover:underline">
                            편집·데이터 운영 원칙
                        </Link>
                        을 참고하세요.
                    </p>
                </section>
            </div>
        </div>
    );
}
