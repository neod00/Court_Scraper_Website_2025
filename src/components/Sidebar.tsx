export default function Sidebar() {
    return (
        <div className="w-full lg:w-[22rem] flex-shrink-0 space-y-6">
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
        </div>
    );
}
