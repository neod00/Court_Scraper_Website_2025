import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* 서비스 */}
                    <div>
                        <h3 className="text-white font-bold mb-4">서비스</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="hover:text-white transition-colors">
                                    🔍 공고 검색
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-white transition-colors">
                                    ℹ️ 서비스 소개
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="hover:text-white transition-colors">
                                    ❓ 자주 묻는 질문
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-white transition-colors">
                                    📧 문의하기
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 가이드 */}
                    <div>
                        <h3 className="text-white font-bold mb-4">가이드</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/guide" className="hover:text-white transition-colors">
                                    📚 자산매각 가이드
                                </Link>
                            </li>
                            <li>
                                <Link href="/glossary" className="hover:text-white transition-colors">
                                    📖 용어사전
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="hover:text-white transition-colors">
                                    ✍️ 블로그
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 카테고리 */}
                    <div>
                        <h3 className="text-white font-bold mb-4">카테고리별 검색</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/category/real-estate" className="hover:text-white transition-colors">
                                    🏠 부동산
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/vehicle" className="hover:text-white transition-colors">
                                    🚗 차량/동산
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/bonds" className="hover:text-white transition-colors">
                                    📄 채권/주식
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/ip" className="hover:text-white transition-colors">
                                    💡 특허/상표
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 법적 안내 */}
                    <div>
                        <h3 className="text-white font-bold mb-4">법적 안내</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/terms" className="hover:text-white transition-colors">
                                    📋 이용약관
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-white transition-colors">
                                    🔒 개인정보처리방침
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Data Source Notice */}
                <div className="border-t border-gray-700 pt-8 text-center text-xs text-gray-500 leading-relaxed">
                    <p>
                        본 서비스는 대한민국 법원 대국민서비스(
                        <a
                            href="https://www.scourt.go.kr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline"
                        >
                            scourt.go.kr
                        </a>
                        )에 공개된 회생·파산 자산매각 공고 정보를 수집하여 제공하는 민간 정보 서비스입니다.
                    </p>
                    <p className="mt-2">
                        정보의 정확성을 위해 매일 자동 업데이트를 실시하고 있으나, 입찰 전에는 반드시 법원 공식 페이지에서 최종 정보를 확인하시기 바랍니다.
                        본 사이트는 법원 또는 법원행정처와 제휴·보증 관계가 없으며, 제공되는 정보는 법적 효력이 없습니다.
                    </p>
                </div>

                {/* Copyright */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    &copy; {new Date().getFullYear()} 대법원 회생·파산 자산매각 공고 자동조회 시스템
                </p>
            </div>
        </footer>
    );
}
