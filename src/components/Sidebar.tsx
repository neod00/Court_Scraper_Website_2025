import Link from 'next/link';

export default function Sidebar() {

    return (
        <div className="w-full xl:w-[22rem] flex-shrink-0 space-y-6">
            {/* Usage Section */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 p-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                    <span className="bg-indigo-50 text-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">💡</span>
                    스마트한 사용 가이드
                </h3>
                <ol className="space-y-4 text-[0.95rem] text-gray-600">
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">1</span>
                        <span><strong className="text-gray-800">날짜 범위 선택</strong>: 조회하고 싶은 공고의 시작일과 종료일을 설정합니다.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">2</span>
                        <span><strong className="text-gray-800">검색어 설정</strong>: 관심 있는 부동산, 차량 등의 프리셋이나 키워드를 입력합니다.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">3</span>
                        <span><strong className="text-gray-800">조회/수집</strong>: 하단의 수집 버튼을 눌러 법원 데이터를 즉시 가져옵니다.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs opacity-80">✓</span>
                        <span>수집된 공고의 <strong>상세보기</strong>를 클릭하여 핵심 정보를 확인하세요!</span>
                    </li>
                </ol>
            </div>

            {/* Warning Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100/50 p-6 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">⚠️</div>
                <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-4">
                    시스템 주의사항
                </h3>
                <ul className="space-y-3 text-sm text-amber-800">
                    <li className="flex items-start gap-2">
                        <span className="mt-1 text-amber-500">•</span>
                        <span>전체 기간 등 <strong>대량의 데이터 수집 시</strong> 로딩이 다소 길어질 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1 text-amber-500">•</span>
                        <span>조회 결과는 세션 한정으로 출력되나, 데이터 자체는 내부 DB에 안전하게 적재됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1 text-red-500">•</span>
                        <span className="font-semibold text-red-700">공고일 기준 90일이 지난 데이터는 정책상 자동 파기됩니다.</span>
                    </li>
                </ul>
            </div>




            {/* 🔗 빠른 바로가기 */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span>🔗</span> 빠른 바로가기
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/tools/bid-calculator"
                        className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">🧮</span>
                        <span className="text-xs font-bold text-gray-700 group-hover:text-blue-700">입찰가 계산기</span>
                    </Link>
                    <Link
                        href="/tools/acquisition-tax"
                        className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">🏠</span>
                        <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-700">취득세 계산기</span>
                    </Link>
                    <Link
                        href="/glossary"
                        className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">📖</span>
                        <span className="text-xs font-bold text-gray-700 group-hover:text-purple-700">용어사전</span>
                    </Link>
                    <Link
                        href="/guide"
                        className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-amber-50 border border-gray-100 hover:border-amber-200 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">📝</span>
                        <span className="text-xs font-bold text-gray-700 group-hover:text-amber-700">투자 가이드</span>
                    </Link>
                </div>
            </div>

            {/* 인기 콘텐츠 추천 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden relative">
                <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white rounded-full opacity-10 blur-xl pointer-events-none" />
                <div className="text-3xl mb-3">📚</div>
                <h3 className="text-base font-bold mb-3">인기 투자 가이드</h3>
                <ul className="space-y-2.5">
                    <li>
                        <Link
                            href="/blog/beginner-guide-first-bid"
                            className="flex items-start gap-2 text-blue-100 hover:text-white transition-colors text-sm leading-snug"
                        >
                            <span className="text-blue-300 mt-0.5 flex-shrink-0">▸</span>
                            첫 입찰자를 위한 완벽 가이드
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/understanding-registry-for-rights-analysis"
                            className="flex items-start gap-2 text-blue-100 hover:text-white transition-colors text-sm leading-snug"
                        >
                            <span className="text-blue-300 mt-0.5 flex-shrink-0">▸</span>
                            등기부등본 읽는 법: 권리분석 핵심
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/acquisition-tax-guide-2026"
                            className="flex items-start gap-2 text-blue-100 hover:text-white transition-colors text-sm leading-snug"
                        >
                            <span className="text-blue-300 mt-0.5 flex-shrink-0">▸</span>
                            2026년 취득세 완벽 정리
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/what-is-lien-and-why-important"
                            className="flex items-start gap-2 text-blue-100 hover:text-white transition-colors text-sm leading-snug"
                        >
                            <span className="text-blue-300 mt-0.5 flex-shrink-0">▸</span>
                            유치권이란? 반드시 확인해야 하는 이유
                        </Link>
                    </li>
                </ul>
                <Link
                    href="/blog"
                    className="inline-block mt-4 text-xs font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                    전체 블로그 보기 →
                </Link>
            </div>
        </div>
    );
}
