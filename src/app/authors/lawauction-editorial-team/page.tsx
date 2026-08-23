import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '콘텐츠 작성과 검수 방식 | 로옥션',
    description: '로옥션 편집 콘텐츠를 누가 어떤 절차로 작성하고 검수하는지, AI를 어디까지 사용하는지 안내합니다.',
    alternates: { canonical: '/authors/lawauction-editorial-team' },
};

export default function EditorialTeamPage() {
    return (
        <article className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">콘텐츠 작성과 검수 방식</h1>
            <p className="text-gray-600 leading-relaxed mb-8">
                로옥션은 1인이 운영하는 민간 정보 서비스입니다. 편집 콘텐츠는 운영자가 직접 작성하고
                공개 전에 원문과 대조합니다. 법원 공개자료를 사용자가 확인하기 쉬운 순서로 정리하되,
                원문과 서비스의 설명이 섞이지 않도록 관리합니다. 변호사·세무사 자격을 보유한 전문
                자문기관을 표방하지 않으며 개별 사건의 법률·세무 판단을 제공하지 않습니다.
            </p>

            <div className="space-y-8 text-gray-700 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">작성 및 검수 방식</h2>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li>대한민국 법원, 국가법령정보센터 등 1차 자료를 우선 확인합니다.</li>
                        <li>공고별로 달라지는 조건을 일반적인 수치로 단정하지 않습니다.</li>
                        <li>AI는 초안 정리와 누락 점검에만 사용하고 공개 전 사람이 원문과 대조합니다.</li>
                        <li>각 글에 최종 사실 확인일, 확인 방법과 참고자료를 표시합니다.</li>
                        <li>확인할 수 없는 내용은 삭제하거나 개별 원문 확인이 필요하다고 표시합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">오류 정정</h2>
                    <p>
                        오류나 오래된 정보를 발견하셨다면 글 제목, URL과 확인이 필요한 문장을 적어{' '}
                        <Link href="/contact" className="font-semibold text-indigo-600 underline">문의 페이지</Link>로 알려주세요.
                        공식 자료와 대조한 뒤 수정일과 내용을 반영하겠습니다.
                    </p>
                </section>

                <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                    <h2 className="font-bold mb-2">중요 안내</h2>
                    <p>
                        편집 콘텐츠는 공고를 읽는 방법을 설명하는 일반 정보입니다. 입찰, 계약, 권리관계와
                        세금에 관한 최종 판단은 해당 공고 원문과 관할 기관을 확인하고 필요한 경우 자격 있는
                        전문가의 검토를 받으세요.
                    </p>
                </section>
            </div>
        </article>
    );
}
