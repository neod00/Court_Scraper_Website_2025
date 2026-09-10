import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '콘텐츠 작성과 검수 방식',
    description: '로옥션(LawAuction) 편집 콘텐츠를 누가 어떤 절차와 주기로 작성·검수하는지, AI를 어디까지 사용하는지, 정정 이력을 안내합니다.',
    alternates: { canonical: '/authors/lawauction-editorial-team' },
};

const CORRECTION_LOG: { date: string; summary: string; detail: string }[] = [
    {
        date: '2026-09-08',
        summary: '편집 글 5편 증보, 용어사전 검수, 가이드 2편 폐기',
        detail:
            '공개 중인 편집 글 5편에 공고 문구 빈도(2026년 3~8월 수집분 기준)와 법령 조문을 대조해 내용을 보강하고 최종 확인일을 갱신했습니다. 용어사전 20개 항목에서 확인되지 않는 수치와 권유 표현을 삭제했습니다. 재검수 중이던 가이드 2편은 되살리지 않고 폐기해 관련 편집 글로 연결합니다.',
    },
    {
        date: '2026-08-22',
        summary: '사실 오류·법적 위험이 확인된 글 5편 영구 폐기, 나머지는 재작성 전 비공개 유지',
        detail:
            '비공개 상태의 글 16편을 전수 검토해 가상 사례를 근거로 시장 결론을 서술하거나, 제목과 본문이 모순되거나, 법률 원칙을 잘못 설명한 5편을 영구 폐기했습니다. 나머지 글은 재작성 전에는 공개하지 않습니다.',
    },
];

export default function EditorialTeamPage() {
    return (
        <article className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">콘텐츠 작성과 검수 방식</h1>
            <p className="text-gray-600 leading-relaxed mb-8">
                로옥션(LawAuction)은 1인이 운영하는 민간 정보 서비스입니다. 편집 콘텐츠는 운영자가 직접 작성하고
                공개 전에 원문과 대조합니다. 법원 공개자료를 사용자가 확인하기 쉬운 순서로 정리하되,
                원문과 서비스의 설명이 섞이지 않도록 관리합니다. 변호사·세무사 자격을 보유한 전문
                자문기관을 표방하지 않으며 개별 사건의 법률·세무 판단을 제공하지 않습니다.
            </p>

            <div className="space-y-8 text-gray-700 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">작성 및 검수 방식</h2>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li>대한민국 법원, 국가법령정보센터 등 1차 자료를 우선 확인합니다.</li>
                        <li>공고별로 달라지는 조건을 일반적인 수치로 단정하지 않습니다. 수치를 쓸 때는 로옥션이 수집한 공고 가운데 몇 건 중 몇 건인지 기준과 집계일을 함께 적습니다.</li>
                        <li>AI는 초안 정리와 누락 점검에만 사용하고 공개 전 사람이 원문과 대조합니다.</li>
                        <li>각 글에 최종 사실 확인일, 확인 방법과 참고자료를 표시합니다.</li>
                        <li>확인할 수 없는 내용은 삭제하거나 개별 원문 확인이 필요하다고 표시합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">검수 주기</h2>
                    <dl className="space-y-3">
                        <div>
                            <dt className="font-semibold text-gray-900">주간 데이터 칼럼 — 매주</dt>
                            <dd>
                                한 주의 공고 집계를 운영자가 읽고 해석을 쓴 뒤 발행합니다. 해석이 200자 미만이거나
                                운영자가 검토하지 않은 주차는 발행하지 않으며 검색엔진에도 노출하지 않습니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-gray-900">월간 리포트 — 매월</dt>
                            <dd>
                                한 달치 집계로 초안을 만들고 운영자가 편집자 노트를 붙여 검토를 마친 달만 공개합니다.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-gray-900">편집 글·용어사전 — 분기마다 재확인</dt>
                            <dd>
                                발행 시 원문·법령과 대조하고, 이후 분기마다 인용한 법령의 개정 여부와 공고 문구
                                빈도를 다시 확인해 최종 확인일을 갱신합니다. 확인 결과 유지할 수 없는 문장은
                                삭제합니다.
                            </dd>
                        </div>
                    </dl>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">정정 이력</h2>
                    <p className="mb-3 text-sm text-gray-600">
                        공개 콘텐츠에 대한 정정·폐기·증보 기록입니다. 개별 글의 수정 내용은 각 글의 최종
                        확인일과 함께 표시합니다.
                    </p>
                    <ul className="space-y-4">
                        {CORRECTION_LOG.map((entry) => (
                            <li key={entry.date} className="border-l-2 border-indigo-200 pl-4">
                                <p className="font-semibold text-gray-900">
                                    <time dateTime={entry.date}>{entry.date}</time> — {entry.summary}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{entry.detail}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">오류 정정</h2>
                    <p>
                        오류나 오래된 정보를 발견하셨다면 글 제목, URL과 확인이 필요한 문장을 적어{' '}
                        <Link href="/contact" className="font-semibold text-indigo-600 underline">문의 페이지</Link>로 알려주세요.
                        공식 자료와 대조한 뒤 수정일과 내용을 이 페이지의 정정 이력과 해당 글에 반영합니다.
                    </p>
                </section>

                <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                    <h2 className="font-bold mb-2">중요 안내</h2>
                    <p>
                        편집 콘텐츠는 공고를 읽는 방법을 설명하는 일반 정보입니다. 입찰, 계약, 권리관계와
                        세금에 관한 최종 판단은 해당 공고 원문과 관할 기관을 확인하고 필요한 경우 자격 있는
                        전문가의 검토를 받으세요. 자세한 기준은{' '}
                        <Link href="/editorial-policy" className="font-semibold underline">편집·데이터 운영 원칙</Link>
                        을 참고하세요.
                    </p>
                </section>
            </div>
        </article>
    );
}
