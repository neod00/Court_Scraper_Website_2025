export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">🏛️ 서비스 소개</h1>

            <div className="bg-white shadow rounded-lg p-6 space-y-6">
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">법원경매 알리미 2025란?</h2>
                    <p className="text-gray-600 leading-relaxed">
                        대법원 회생·파산 자산매각 공고를 자동으로 수집하여 한눈에 볼 수 있도록 제공하는 서비스입니다.
                        부동산, 차량, 채권, 주식, 특허 등 다양한 자산 정보를 카테고리별로 쉽게 검색할 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">주요 기능</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                        <li>📅 날짜별 공고 검색</li>
                        <li>🏷️ 카테고리별 필터링 (부동산, 차량, 채권, 주식, 특허 등)</li>
                        <li>🔍 키워드 검색</li>
                        <li>📄 원본 파일 다운로드 링크 제공</li>
                        <li>🔄 매일 자동 업데이트 (최신 공고 반영)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">데이터 출처</h2>
                    <p className="text-gray-600">
                        모든 데이터는{' '}
                        <a
                            href="https://www.scourt.go.kr"
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline"
                        >
                            대법원 홈페이지
                        </a>
                        에서 수집됩니다. 본 서비스는 공개된 정보를 정리하여 제공하는 용도로만 사용됩니다.
                    </p>
                </section>

                <section className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
                    <p className="text-sm text-yellow-700">
                        ⚠️ <strong>주의:</strong> 공고일로부터 90일이 지난 데이터는 자동으로 삭제됩니다.
                        필요한 정보는 미리 저장해 두시기 바랍니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
