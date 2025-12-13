import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '개인정보처리방침 | 대법원 회생·파산 자산매각 공고 자동조회 시스템',
    description: '대법원 회생·파산 자산매각 공고 자동조회 시스템의 개인정보처리방침입니다.',
};

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">🔒 개인정보처리방침</h1>

            <div className="bg-white shadow rounded-lg p-6 space-y-8">
                <p className="text-gray-600 text-sm">
                    최종 수정일: 2025년 1월 1일
                </p>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">1. 개인정보의 수집 및 이용 목적</h2>
                    <p className="text-gray-600 leading-relaxed">
                        대법원 회생·파산 자산매각 공고 자동조회 시스템(이하 &quot;서비스&quot;)은 다음의 목적을 위하여 개인정보를 처리합니다.
                        처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는
                        개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                        <li>서비스 제공 및 운영</li>
                        <li>서비스 개선 및 신규 서비스 개발</li>
                        <li>이용자 문의 응대</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">2. 수집하는 개인정보 항목</h2>
                    <p className="text-gray-600 leading-relaxed">
                        본 서비스는 회원가입 없이 이용 가능하며, 별도의 개인정보를 직접 수집하지 않습니다.
                        다만, 서비스 이용 과정에서 아래와 같은 정보가 자동으로 생성되어 수집될 수 있습니다.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                        <li>IP 주소, 쿠키, 방문 일시, 서비스 이용 기록</li>
                        <li>브라우저 종류 및 OS 정보</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">3. 개인정보의 보유 및 이용 기간</h2>
                    <p className="text-gray-600 leading-relaxed">
                        수집된 정보는 서비스 이용 목적이 달성된 후에는 지체 없이 파기합니다.
                        다만, 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">4. 개인정보의 제3자 제공</h2>
                    <p className="text-gray-600 leading-relaxed">
                        본 서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
                        다만, 아래의 경우에는 예외로 합니다.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                        <li>이용자가 사전에 동의한 경우</li>
                        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">5. 광고 및 쿠키 정책</h2>
                    <p className="text-gray-600 leading-relaxed">
                        본 서비스는 Google AdSense를 통해 광고를 게재합니다.
                        Google은 사용자의 관심사에 기반한 광고를 제공하기 위해 쿠키를 사용할 수 있습니다.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                        <li>Google의 광고 쿠키 사용에 대한 자세한 내용은{' '}
                            <a
                                href="https://policies.google.com/technologies/ads"
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline"
                            >
                                Google 광고 정책
                            </a>
                            을 참조하세요.
                        </li>
                        <li>사용자는 브라우저 설정을 통해 쿠키 사용을 거부할 수 있습니다.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">6. 개인정보 보호책임자</h2>
                    <p className="text-gray-600 leading-relaxed">
                        개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및
                        피해구제 등을 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-md mt-3">
                        <p className="text-gray-600">
                            <strong>이메일:</strong>{' '}
                            <a href="mailto:openbrain.carbonmate@gmail.com" className="text-indigo-600 hover:underline">
                                openbrain.carbonmate@gmail.com
                            </a>
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">7. 개인정보처리방침의 변경</h2>
                    <p className="text-gray-600 leading-relaxed">
                        이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및
                        정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                    </p>
                </section>

                <section className="border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-500">
                        본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
