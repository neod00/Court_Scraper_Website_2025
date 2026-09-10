import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '문의하기',
    description: '로옥션(LawAuction) 서비스 이용, 데이터 오류 신고, 정정 요청, 개인정보 관련 문의를 받는 연락처를 안내합니다.',
    alternates: { canonical: '/contact' },
};

const CONTACT_TOPICS: { title: string; desc: string }[] = [
    { title: '서비스 이용 문의', desc: '검색 방법, 기능 사용법 등' },
    { title: '데이터 오류 신고·정정 요청', desc: '공고 정보나 편집 글의 오류, 오래된 내용' },
    { title: '기술적 문제', desc: '사이트 오류, 접속 문제 등' },
    { title: '개인정보 관련', desc: '개인정보 삭제 요청, 쿠키 정책 문의' },
    { title: '제휴 및 협력 문의', desc: '비즈니스 제안, 협력 요청' },
];

export default function ContactPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">문의하기</h1>

            <div className="bg-white shadow rounded-lg p-6 space-y-8">
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">이메일 문의</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        로옥션(LawAuction) 이용 중 궁금한 점이나 건의사항, 오류 신고는 아래 이메일로 보내 주세요.
                        오류 신고는 글 제목이나 URL, 확인이 필요한 문장을 함께 적어 주시면 원문과 대조해 답변합니다.
                    </p>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                        <p className="text-sm text-gray-500 mb-1">이메일</p>
                        <a
                            href="mailto:openbrain.main@gmail.com"
                            className="text-xl font-semibold text-indigo-600 hover:underline break-all"
                        >
                            openbrain.main@gmail.com
                        </a>
                        <p className="text-sm text-gray-500 mt-3">
                            1인 운영 서비스이므로 답변까지 영업일 기준 1~3일이 걸릴 수 있습니다.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">운영자 정보</h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 text-sm space-y-1">
                        <p><strong>서비스명:</strong> 로옥션(LawAuction)</p>
                        <p><strong>운영 형태:</strong> 개인사업자(1인 운영)</p>
                        <p><strong>사업자등록번호:</strong> 199-06-02412</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">문의 가능 사항</h2>
                    <ul className="space-y-3">
                        {CONTACT_TOPICS.map((topic) => (
                            <li key={topic.title} className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" />
                                <div>
                                    <p className="font-medium text-gray-800">{topic.title}</p>
                                    <p className="text-sm text-gray-500">{topic.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="border-t border-gray-200 pt-5 text-sm text-gray-600 leading-relaxed">
                    <p>
                        로옥션은 법원과 제휴·보증 관계가 없는 민간 서비스입니다. 법원 업무나 경매·공매 절차에 관한
                        공식 문의는{' '}
                        <a
                            href="https://www.scourt.go.kr"
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 underline"
                        >
                            대한민국 법원 대국민서비스
                        </a>
                        를 이용해 주세요. 오류 정정 절차는{' '}
                        <Link href="/editorial-policy" className="text-indigo-600 underline">편집·데이터 운영 원칙</Link>
                        에 안내되어 있습니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
