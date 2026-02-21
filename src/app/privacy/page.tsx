import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '개인정보처리방침 | LawAuction',
    description: 'LawAuction의 개인정보처리방침입니다. Google 광고, 쿠키 사용 및 데이터 수집에 대한 상세한 안내를 제공합니다.',
};

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">개인정보처리방침</h1>

            <div className="bg-white shadow rounded-lg p-6 space-y-8">
                <p className="text-gray-600 text-sm">
                    최종 수정일: 2026년 2월 21일
                </p>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">1. 개인정보의 수집 및 이용 목적</h2>
                    <p className="text-gray-600 leading-relaxed">
                        LawAuction(이하 &quot;서비스&quot;)은 다음의 목적을 위하여 개인정보를 처리합니다.
                        처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는
                        개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                        <li>서비스 제공 및 운영</li>
                        <li>서비스 개선 및 신규 서비스 개발</li>
                        <li>이용자 문의 응대</li>
                        <li>웹사이트 이용 통계 분석 및 서비스 품질 향상</li>
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
                        <li>접속 로그, 이용 기록, 불량 이용 기록</li>
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">5. 광고 서비스 및 쿠키(Cookie) 정책</h2>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md mb-4">
                        <p className="text-blue-800 leading-relaxed font-semibold mb-2">
                            Google AdSense 광고 및 쿠키 사용 안내
                        </p>
                        <p className="text-blue-700 leading-relaxed text-sm">
                            본 서비스는 Google AdSense를 통해 광고를 게재하고 있습니다. Google 및 제3자 광고 업체는
                            사용자의 이전 방문 기록을 기반으로 관심 기반 광고(개인 맞춤 광고)를 제공하기 위해
                            쿠키(Cookie)를 사용할 수 있습니다.
                        </p>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">5-1. 쿠키(Cookie)란?</h3>
                    <p className="text-gray-600 leading-relaxed">
                        쿠키는 웹사이트가 사용자의 브라우저로 전송하는 소량의 텍스트 파일입니다.
                        쿠키를 통해 웹사이트는 사용자의 장치를 인식하고 이전 방문 정보를 기억할 수 있습니다.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">5-2. Google의 쿠키 사용</h3>
                    <ul className="list-disc list-inside text-gray-600 mt-2 space-y-2 text-sm">
                        <li>
                            Google은 DART 쿠키를 사용하여 본 사이트 및 다른 웹사이트 방문 기록을 기반으로
                            사용자에게 관련성 높은 광고를 제공합니다.
                        </li>
                        <li>
                            사용자는{' '}
                            <a
                                href="https://adssettings.google.com"
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline font-medium"
                            >
                                Google 광고 설정 페이지
                            </a>
                            를 방문하여 DART 쿠키를 비활성화하거나 개인 맞춤 광고를 선택 해제할 수 있습니다.
                        </li>
                        <li>
                            Google 및 제3자 광고 업체는 쿠키, 웹 비콘(web beacon), IP 주소 등의 기술을 사용하여
                            본 사이트와 인터넷상의 다른 사이트에 광고를 게재할 수 있습니다.
                        </li>
                        <li>
                            제3자 광고 서버 또는 광고 네트워크에서 사용하는 기술은
                            해당 광고 또는 링크를 통해 사용자의 브라우저로 직접 전송되며,
                            이 과정에서 IP 주소가 자동으로 수집될 수 있습니다.
                        </li>
                    </ul>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            <strong>Google 파트너의 데이터 사용:</strong>{' '}
                            Google이 파트너의 사이트 또는 앱을 사용할 때 데이터를 사용하는 방식에 대한 자세한 내용은{' '}
                            <a
                                href="https://www.google.com/policies/privacy/partners/"
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline font-medium"
                            >
                                Google 파트너 데이터 사용 방식
                            </a>
                            을 참조하세요.
                        </p>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">5-3. 쿠키 거부 방법</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                        사용자는 웹 브라우저의 설정을 통해 모든 쿠키를 허용, 차단하거나
                        쿠키가 저장될 때마다 확인을 받을 수 있습니다.
                        쿠키를 거부하더라도 서비스 이용은 가능하나, 일부 기능의 이용에 제한이 있을 수 있습니다.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1 text-sm">
                        <li><strong>Chrome:</strong> 설정 - 개인정보 및 보안 - 쿠키 및 기타 사이트 데이터</li>
                        <li><strong>Edge:</strong> 설정 - 쿠키 및 사이트 권한</li>
                        <li><strong>Safari:</strong> 환경설정 - 개인 정보 보호</li>
                        <li><strong>Firefox:</strong> 설정 - 개인 정보 및 보안</li>
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
                            <a href="mailto:openbrain.main@gmail.com" className="text-indigo-600 hover:underline">
                                openbrain.main@gmail.com
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
                        본 개인정보처리방침은 2026년 2월 21일부터 시행됩니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
