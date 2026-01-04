import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Footer Links */}
                <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
                    <Link href="/about" className="text-gray-500 hover:text-gray-700">
                        서비스 소개
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/terms" className="text-gray-500 hover:text-gray-700">
                        이용약관
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
                        개인정보처리방침
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/faq" className="text-gray-500 hover:text-gray-700">
                        FAQ
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/contact" className="text-gray-500 hover:text-gray-700">
                        문의하기
                    </Link>
                </div>

                {/* Data Source Notice */}
                <div className="text-center text-xs text-gray-400 mb-4 leading-relaxed">
                    <p>
                        본 서비스는 대한민국 법원 대국민서비스(
                        <a
                            href="https://www.scourt.go.kr"
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-500 hover:underline"
                        >
                            scourt.go.kr
                        </a>
                        )에 공개된 회생·파산 자산매각 공고 정보를 수집하여 가공 없이 제공하는 민간 정보 서비스입니다.
                    </p>
                    <p className="mt-2">
                        시스템의 목적은 공개된 법원 공고의 접근성을 높이고, 효율적인 자산 매각을 지원하는 데 있습니다.
                        정보의 정확성을 위해 매일 자동 업데이트를 실시하고 있으나, 시스템의 일시적인 오류나 데이터 지연이 발생할 수 있으므로
                        입찰 전에는 반드시 법원 공식 페이지에서 최종 정보를 확인하시기 바랍니다.
                    </p>
                    <p className="mt-1">
                        본 사이트는 법원 또는 법원행정처와 직접적인 제휴·보증 관계가 없으며, 제공되는 정보는 법적 효력이 없습니다.
                    </p>
                </div>

                {/* Copyright */}
                <p className="text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} 대법원 회생·파산 자산매각 공고 자동조회 시스템
                </p>
            </div>
        </footer>
    );
}

