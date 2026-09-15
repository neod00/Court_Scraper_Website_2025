import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '편집·데이터 운영 원칙',
    description: '로옥션(LawAuction)의 법원 공고 수집, AI 활용 범위, 발행 주기, 편집 검토, 오류 정정 및 광고 운영 원칙을 안내합니다.',
    alternates: { canonical: '/editorial-policy' },
};

export default function EditorialPolicyPage() {
    return (
        <article className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">편집·데이터 운영 원칙</h1>
            <p className="text-gray-600 leading-relaxed mb-10">
                로옥션(LawAuction)은 대한민국 법원에 공개된 회생·파산 자산매각 공고를 더 쉽게 찾고
                원문을 확인할 수 있도록 정리하는 민간 정보 서비스입니다. 원문 데이터와
                로옥션의 설명을 구분하고, 확인되지 않은 내용을 사실처럼 표시하지 않는 것을 원칙으로 합니다.
            </p>

            <div className="space-y-10 text-gray-700 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">1. 데이터 출처와 갱신</h2>
                    <p>
                        공고 제목, 게시일, 담당 법원, 연락처, 첨부파일 등은 대한민국 법원 대국민서비스에
                        공개된 자료를 바탕으로 수집합니다. 공고 목록은 하루 3회 확인하지만 법원 원문과
                        반영 시점에 차이가 있을 수 있으므로, 입찰 전에는 반드시 원문을 최종 확인해야 합니다.
                        수집 시작일은 2025년 12월 30일이며, 낙찰 결과 등 매각 이후의 정보는 수집하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">2. AI 활용 범위</h2>
                    <p className="mb-3">
                        AI는 세 곳에서만 사용합니다. 어느 경우에도 AI가 원문에 없는 사실을 보완하거나 결과를 보장하지
                        않으며, AI 산출물은 법률·세무 자문이나 독립적인 감정평가가 아닙니다.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>공고 요약</strong> — 첨부 문서에서 일정·가격·대상 자산 같은 항목을 찾아 정리합니다.
                            자동 생성 공고 페이지는 별도의 편집 검토가 완료되기 전까지 검색엔진용 편집 콘텐츠로 취급하지 않습니다.
                        </li>
                        <li>
                            <strong>주간 칼럼·월간 리포트의 노트</strong> — 로옥션이 수집한 공고의 주간·월간 집계만을 입력으로
                            받아 본문을 작성합니다. 작성된 본문은 발행 전에 프로그램이 검증합니다. 본문의 모든 수치·법원명·사건번호가
                            집계에 있는 값인지 대조하고, 원인 단정·조언·전망 표현과 낙찰가율 같은 금지 표현, 개인 이름이 없는지
                            확인하며, 두 번째 AI가 본문을 집계와 다시 대조합니다. 검증을 통과하지 못한 글은 발행을 보류하고
                            운영자에게 넘깁니다.
                        </li>
                        <li>
                            <strong>편집 글·용어사전·FAQ</strong> — 초안 정리와 누락 점검에만 사용하고, 공개 전에 운영자가 원문·법령과
                            대조합니다.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">3. 발행 주기</h2>
                    <p className="mb-3">
                        집계에 기반한 칼럼과 리포트는 자동으로 발행하고, 사람이 쓰는 편집 글은 지킬 수 있는 범위에서만 주기를
                        약속합니다. 검증을 통과하지 못한 회차는 건너뛰며, 집계가 없는 주차나 달은 발행하지 않습니다.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>주간 데이터 칼럼</strong> — 매주 토요일 오전, 직전 주(월~금) 집계로 자동 작성·검증·발행합니다.
                            2026년 8월 이후의 과거 주차는 주 1편씩 순차 발행합니다. 노트가 없거나 200자 미만인 주차는 목록과
                            사이트맵에 넣지 않습니다.
                        </li>
                        <li>
                            <strong>월간 리포트</strong> — 매월 2일, 직전 달 집계로 자동 발행합니다. 과거 달은 주 1편씩 순차
                            발행합니다. 노트가 300자 미만이거나 검증을 통과하지 못한 달은 공개하지 않습니다.
                        </li>
                        <li>
                            <strong>편집 글·용어사전</strong> — 수시 발행, 분기마다 재확인. 인용한 법령과 공고 문구
                            빈도를 다시 확인해 최종 확인일을 갱신하고, 유지할 수 없는 문장은 삭제합니다.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">4. AI 사용 고지</h2>
                    <p className="mb-3">
                        자동 작성한 주간 칼럼과 월간 리포트 노트는 페이지 상단에 &lsquo;자동 작성 고지&rsquo;를 붙이고, 목록과
                        작성자 옆에 &lsquo;자동 작성 · 수치 검증&rsquo;으로 표시합니다. 작성자는 &lsquo;로옥션 데이터 데스크&rsquo;로
                        적으며, 사람이 직접 쓴 글과 구분됩니다.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>자동 작성 글은 집계에 있는 수치만 쓰고, 원인 해석과 조언, 전망은 담지 않습니다.</li>
                        <li>
                            운영자는 발행된 글을 사후에 검토합니다. 오류가 확인되면 글을 고치거나 내리고, 정정 내용은{' '}
                            <Link href="/authors/lawauction-editorial-team" className="text-indigo-600 font-semibold hover:underline">
                                정정 이력
                            </Link>
                            에 기록합니다.
                        </li>
                        <li>블로그·FAQ·용어집 같은 편집 글은 사람이 작성·검수하며, 각 글의 작성·검수 안내에 AI 사용 여부를 표시합니다.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">5. 편집 콘텐츠 기준</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>법원 원문과 서비스의 설명을 명확히 구분합니다.</li>
                        <li>금액·기한·세율처럼 의사결정에 영향을 주는 정보는 출처와 기준일을 확인합니다.</li>
                        <li>통계를 인용할 때는 모집단(몇 건 중 몇 건)과 집계일을 함께 적습니다.</li>
                        <li>확인할 수 없는 정보는 추정하지 않고 &lsquo;원문 확인 필요&rsquo;로 표시합니다.</li>
                        <li>수익을 보장하거나 위험이 없다고 오인할 수 있는 표현을 사용하지 않습니다.</li>
                        <li>채무자 등 개인의 실명은 공개 콘텐츠에 쓰지 않습니다.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">6. 오류 정정</h2>
                    <p>
                        오류 신고가 접수되면 법원 원문과 대조해 수정하거나 해당 콘텐츠의 공개를 중단합니다.
                        정정이 필요한 내용을 발견하셨다면 제목과 URL, 확인이 필요한 부분을 적어
                        <Link href="/contact" className="text-indigo-600 font-semibold hover:underline"> 문의 페이지</Link>로 알려주세요.
                        정정·폐기 기록은{' '}
                        <Link href="/authors/lawauction-editorial-team" className="text-indigo-600 font-semibold hover:underline">
                            콘텐츠 작성과 검수 방식
                        </Link>
                        의 정정 이력에 남깁니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">7. 광고 운영</h2>
                    <p>
                        서비스 운영을 위해 검수된 편집 콘텐츠에 광고가 표시될 수 있습니다. 검색 결과, 오류 화면,
                        개별 공고 페이지에는 광고를 배치하지 않습니다. 광고의 내용은 로옥션의 편집 판단과 무관합니다.
                    </p>
                </section>

                <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <h2 className="text-lg font-bold text-amber-900 mb-2">중요 안내</h2>
                    <p className="text-amber-900">
                        본 서비스의 계산 결과와 설명은 일반 정보입니다. 실제 입찰, 권리관계, 세금 및 계약 조건은
                        공고별로 다르므로 법원 원문과 관련 기관을 확인하고 필요하면 자격 있는 전문가에게 상담하세요.
                    </p>
                </section>
            </div>
        </article>
    );
}
