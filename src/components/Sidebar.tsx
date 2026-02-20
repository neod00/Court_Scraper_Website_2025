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

            {/* 📬 뉴스레터/알림 구독 CTA */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden">
                <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white rounded-full opacity-10 blur-xl pointer-events-none" />
                <div className="absolute top-4 right-4">
                    <span className="bg-white/20 backdrop-blur-sm text-[0.65rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Coming Soon
                    </span>
                </div>
                <div className="text-3xl mb-3">🔔</div>
                <h3 className="text-base font-bold mb-2">관심 공고 알림 서비스</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-4">
                    원하는 카테고리의 새 매각 공고가 등록되면 이메일로 즉시 알려드립니다.
                </p>
                <div className="flex gap-2">
                    <input
                        type="email"
                        placeholder="이메일 주소 입력"
                        disabled
                        className="flex-1 px-3 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-sm placeholder-blue-200 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                        disabled
                        className="px-4 py-2.5 rounded-xl bg-white/25 text-sm font-bold hover:bg-white/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        구독
                    </button>
                </div>
                <p className="text-[0.65rem] text-blue-200 mt-2 opacity-70">
                    * 서비스 준비 중입니다. 곧 오픈 예정!
                </p>
            </div>
        </div>
    );
}
