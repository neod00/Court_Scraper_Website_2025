export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} 대법원 회생·파산 자산매각 공고 자동조회 시스템
                </p>
                <p className="text-center text-xs text-gray-400 mt-1">
                    본 서비스는 대법원 공고를 참고용으로 제공하며, 법적 효력이 없습니다. 정확한 정보는 대법원 홈페이지에서 확인하세요.
                </p>
            </div>
        </footer>
    );
}
