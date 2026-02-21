import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '이용약관 | LawAuction',
    description: 'LawAuction의 이용약관입니다. 서비스 이용 조건, 광고 게재, 면책조항 등을 안내합니다.',
};

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">이용약관</h1>

            <div className="bg-white shadow rounded-lg p-6 space-y-8">
                <p className="text-gray-600 text-sm">
                    최종 수정일: 2026년 2월 21일
                </p>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">제1조 (목적)</h2>
                    <p className="text-gray-600 leading-relaxed">
                        이 약관은 LawAuction(이하 &quot;서비스&quot;)이 제공하는
                        모든 서비스의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">제2조 (서비스의 내용)</h2>
                    <p className="text-gray-600 leading-relaxed">
                        본 서비스는 대법원 회생/파산 자산매각 공고를 자동으로 수집하여 사용자에게
                        검색 및 조회 기능을 제공하며, 각 공고에 대해 투자 가이드, 권리분석 체크리스트,
                        세금 안내 등 자체 분석 콘텐츠를 추가로 제공합니다.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                        <li>회생/파산 자산매각 공고 검색</li>
                        <li>날짜별, 카테고리별 필터링</li>
                        <li>공고 상세 정보 조회 및 전문 분석 콘텐츠</li>
                        <li>원본 파일 다운로드 링크 제공</li>
                        <li>입찰가 계산기, 취득세 계산기 등 투자 도구</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">제3조 (면책조항)</h2>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
                        <p className="text-yellow-800 leading-relaxed">
                            <strong>중요:</strong> 본 서비스에서 제공하는 정보는 참고용으로만 제공되며,
                            법적 효력이 없습니다. 정확한 정보는 반드시 대법원 홈페이지에서 직접 확인하시기 바랍니다.
                        </p>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 mt-4 space-y-2">
                        <li>본 서비스는 정보의 정확성, 완전성, 적시성을 보장하지 않습니다.</li>
                        <li>본 서비스 이용으로 인해 발생하는 직/간접적인 손해에 대해 책임지지 않습니다.</li>
                        <li>데이터는 주기적으로 업데이트되나, 실시간 반영이 아닐 수 있습니다.</li>
                        <li>공고일로부터 90일이 지난 데이터는 자동으로 삭제될 수 있습니다.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">제4조 (데이터 출처 및 저작권)</h2>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                        <p className="text-blue-800 leading-relaxed mb-3">
                            본 서비스는 대한민국 법원 대국민서비스(scourt.go.kr)에 공개된 부동산 공고 및 사건 정보를
                            기초 데이터로 활용하여, 사용자의 편의를 위해 분석/정리/시각화한 민간 정보 서비스입니다.
                        </p>
                        <p className="text-blue-800 leading-relaxed mb-3">
                            본 서비스는 법원 또는 법원행정처와 직접적인 제휴/보증 관계에 있지 않으며,
                            법원이 제공하는 원문 정보가 최종적/공식적인 효력을 가집니다.
                        </p>
                        <p className="text-blue-700 text-sm">
                            <strong>출처:</strong> 대한민국 법원 대국민서비스 (
                            <a
                                href="https://www.scourt.go.kr"
                                target="_blank"
                                rel="noreferrer"
                                className="underline hover:text-blue-900"
                            >
                                https://www.scourt.go.kr
                            </a>
                            )<br />
                            공공저작물(저작권법 제24조의2)에 따라 출처를 표시하여 이용하였습니다.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">제5조 (서비스 이용 및 광고 게재)</h2>
                    <p className="text-gray-600 leading-relaxed">
                        본 서비스는 별도의 회원가입 없이 무료로 이용할 수 있습니다.
                        서비스 운영을 위해 Google AdSense를 통한 광고가 게재되며,
                        광고 수익은 오로지 서비스 운영 및 개선을 위해 사용됩니다.
                        광고의 내용은 서비스 제공자와 무관하며, 광고에 대한 책임은 해당 광고주에게 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">제6조 (서비스의 변경 및 중단)</h2>
                    <p className="text-gray-600 leading-relaxed">
                        서비스 제공자는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경하거나
                        중단할 수 있습니다. 서비스의 변경 또는 중단 시 가능한 한 사전에 공지하도록 합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">제7조 (준거법)</h2>
                    <p className="text-gray-600 leading-relaxed">
                        본 약관의 해석 및 서비스 이용에 관하여는 대한민국 법률을 적용합니다.
                    </p>
                </section>

                <section className="border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-500">
                        본 이용약관은 2026년 2월 21일부터 시행됩니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
