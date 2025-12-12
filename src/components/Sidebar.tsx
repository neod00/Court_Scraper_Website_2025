export default function Sidebar() {
    return (
        <div className="w-full lg:w-64 flex-shrink-0 lg:border-r lg:border-gray-200 lg:pr-8 space-y-8">
            {/* Usage Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    📋 사용법
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>
                        <span className="font-semibold text-gray-800">날짜 범위 선택</span>: 검색할 시작일과 종료일을 설정하세요
                    </li>
                    <li>
                        <span className="font-semibold text-gray-800">검색어 설정</span>: 프리셋에서 선택하거나 직접 입력하세요
                    </li>
                    <li>
                        <span className="font-semibold text-gray-800">조회/수집</span>: 버튼을 클릭하여 데이터를 확인하세요
                    </li>
                    <li>
                        <span className="font-semibold text-gray-800">결과 확인</span>: 수집된 데이터를 확인하고 다운로드하세요
                    </li>
                </ol>
            </div>

            {/* Warning Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 text-orange-600">
                    ⚠️ 주의사항
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>대량의 데이터 수집 시 시간이 오래 걸릴 수 있습니다</li>
                    <li>네트워크 상태에 따라 성능이 달라질 수 있습니다</li>
                    <li>수집된 데이터는 브라우저 세션 동안만 유지됩니다 (본 웹사이트는 DB에 저장됩니다)</li>
                    <li className="font-semibold text-red-600">공고일로부터 90일이 지난 데이터는 자동으로 삭제됩니다</li>
                </ul>
            </div>
        </div>
    );
}
