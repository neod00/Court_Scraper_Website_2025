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
                    <p>
                        AI는 첨부 문서에서 일정·가격·대상 자산 같은 항목을 찾고 초안을 만드는 보조 수단으로
                        사용됩니다. AI 요약은 법률·세무 자문이나 독립적인 감정평가가 아니며, 원문에 없는 사실을
                        보완하거나 결과를 보장하지 않습니다. 자동 생성 공고 페이지는 별도의 편집 검토가 완료되기
                        전까지 검색엔진용 편집 콘텐츠로 취급하지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">3. 발행 주기</h2>
                    <p className="mb-3">
                        1인 운영 서비스로서 지킬 수 있는 범위에서만 주기를 약속합니다. 주기를 지키지 못한 회차는
                        건너뛰며, 자동 생성물로 채우지 않습니다.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>주간 데이터 칼럼</strong> — 주 1회. 한 주의 집계에 운영자 해석이 붙은 주차만
                            발행하며, 해석이 없는 주차는 목록과 사이트맵에 넣지 않습니다.
                        </li>
                        <li>
                            <strong>월간 리포트</strong> — 월 1회. 전월 집계로 초안을 만들고 운영자가 편집자 노트를
                            작성·검토한 뒤 공개합니다. 검토를 마치지 못한 달은 공개하지 않습니다.
                        </li>
                        <li>
                            <strong>편집 글·용어사전</strong> — 수시 발행, 분기마다 재확인. 인용한 법령과 공고 문구
                            빈도를 다시 확인해 최종 확인일을 갱신하고, 유지할 수 없는 문장은 삭제합니다.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">4. AI 사용 고지</h2>
                    <p>
                        주간 칼럼과 월간 리포트의 초안은 로옥션이 직접 수집한 공고 데이터를 바탕으로 AI의 도움을
                        받아 작성할 수 있습니다. 초안은 발행 전에 운영자가 수치를 원본 집계와 대조하고 해석을 직접
                        쓰거나 고친 뒤 공개하며, 운영자 검토를 거치지 않은 초안은 공개하지 않습니다. 편집 글에서
                        AI는 초안 정리와 누락 점검에만 사용합니다. 편집 글에는 작성·검수 안내에 AI 사용 여부를 표시합니다.
                    </p>
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
