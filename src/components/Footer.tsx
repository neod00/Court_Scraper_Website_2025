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
                        )에 공개된 정보를 활용한 민간 정보 서비스입니다.
                    </p>
                    <p className="mt-1">
                        법원 또는 법원행정처와 직접적인 제휴·보증 관계가 없으며, 법적 효력이 없습니다.
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

