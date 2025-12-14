import Link from 'next/link';

// 메타데이터
export const metadata = {
    title: '지역별 공고 지도 | 대법원 회생·파산 자산매각 공고',
    description:
        '전국 법원별 회생·파산 자산매각 공고를 지도에서 한눈에 확인하는 서비스를 준비 중입니다.',
    keywords: '법원경매, 자산매각, 지도, 지역별 공고, 부동산 경매, 회생 파산',
};

export default function MapPage() {
    return (
        <>
            {/* 페이지 헤더 */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 mb-8">
                <div className="flex items-center gap-2 text-sm text-indigo-200 mb-2">
                    <Link href="/" className="hover:text-white">
                        홈
                    </Link>
                    <span>/</span>
                    <span>지역별 공고 지도</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">🗺️ 지역별 공고 지도</h1>
                <p className="mt-2 text-indigo-100">
                    전국 법원별 회생·파산 자산매각 공고를 지도에서 한눈에 확인하세요.
                </p>
            </div>

            {/* 서비스 준비 중 안내 */}
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div className="text-8xl mb-6">🚧</div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">서비스 준비 중입니다</h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        지역별 공고 지도 서비스를 더 나은 경험으로 제공하기 위해 준비하고 있습니다.
                        <br />
                        곧 만나뵐 수 있도록 노력하겠습니다.
                    </p>
                    
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-indigo-900 mb-3">📋 제공 예정 기능</h3>
                        <ul className="text-left text-gray-700 space-y-2 max-w-md mx-auto">
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-600 mt-1">✓</span>
                                <span>전국 법원별 공고 위치를 지도에서 확인</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-600 mt-1">✓</span>
                                <span>지역별 필터링으로 원하는 지역의 공고만 보기</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-600 mt-1">✓</span>
                                <span>마커 클릭으로 해당 법원의 공고 목록 확인</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-600 mt-1">✓</span>
                                <span>클러스터링으로 가까운 법원들을 그룹화</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            홈으로 돌아가기
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-block px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            문의하기
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
