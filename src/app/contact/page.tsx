import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '문의하기 | 대법원 회생·파산 자산매각 공고 자동조회 시스템',
    description: '대법원 회생·파산 자산매각 공고 자동조회 시스템에 대한 문의사항을 보내주세요.',
};

export default function ContactPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">📧 문의하기</h1>

            <div className="bg-white shadow rounded-lg p-6 space-y-8">
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">서비스 관련 문의</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        대법원 회생·파산 자산매각 공고 자동조회 시스템 이용 중 궁금한 점이나
                        건의사항이 있으시면 아래 이메일로 문의해 주세요.
                    </p>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">✉️</span>
                            <div>
                                <p className="text-sm text-gray-500">이메일</p>
                                <a
                                    href="mailto:openbrain.main@gmail.com"
                                    className="text-xl font-semibold text-indigo-600 hover:underline"
                                >
                                    openbrain.main@gmail.com
                                </a>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            영업일 기준 24시간 이내에 답변드리도록 노력하겠습니다.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">문의 가능 사항</h2>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <div>
                                <p className="font-medium text-gray-800">서비스 이용 문의</p>
                                <p className="text-sm text-gray-500">검색 방법, 기능 사용법 등</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <div>
                                <p className="font-medium text-gray-800">데이터 관련 문의</p>
                                <p className="text-sm text-gray-500">데이터 오류 신고, 정보 정정 요청</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <div>
                                <p className="font-medium text-gray-800">기술적 문제</p>
                                <p className="text-sm text-gray-500">사이트 오류, 접속 문제 등</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <div>
                                <p className="font-medium text-gray-800">개인정보 관련</p>
                                <p className="text-sm text-gray-500">개인정보 삭제 요청, 쿠키 정책 문의</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <div>
                                <p className="font-medium text-gray-800">제휴 및 협력 문의</p>
                                <p className="text-sm text-gray-500">비즈니스 제안, 협력 요청</p>
                            </div>
                        </li>
                    </ul>
                </section>

                <section className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
                    <p className="text-sm text-yellow-700">
                        <strong>⚠️ 참고:</strong> 본 서비스는 법원과 직접적인 관계가 없는 민간 서비스입니다.
                        법원 업무나 경매/공매 절차에 관한 공식적인 문의는{' '}
                        <a
                            href="https://www.scourt.go.kr"
                            target="_blank"
                            rel="noreferrer"
                            className="text-yellow-800 underline hover:text-yellow-900"
                        >
                            대법원 홈페이지
                        </a>
                        를 이용해 주시기 바랍니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
