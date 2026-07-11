import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h3 className="text-white font-bold mb-4">서비스</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="hover:text-white transition-colors">🔍 공고 검색</Link></li>
                            <li><Link href="/about" className="hover:text-white transition-colors">ℹ️ 서비스 소개</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">❓ 자주 묻는 질문</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">📧 문의하기</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">검수된 콘텐츠</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/blog" className="hover:text-white transition-colors">✍️ 블로그 전체</Link></li>
                            <li><Link href="/blog/beginner-guide-first-bid" className="hover:text-white transition-colors">📚 첫 입찰 확인 순서</Link></li>
                            <li><Link href="/blog/understanding-registry-for-rights-analysis" className="hover:text-white transition-colors">📄 등기부 확인 기초</Link></li>
                            <li><Link href="/blog/auction-vs-public-sale-differences" className="hover:text-white transition-colors">⚖️ 경매와 공매 비교</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">운영 정보</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/authors/lawauction-editorial-team" className="hover:text-white transition-colors">👤 작성·검수 주체</Link></li>
                            <li><Link href="/editorial-policy" className="hover:text-white transition-colors">📝 편집·데이터 운영 원칙</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">🔒 개인정보처리방침</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">📋 이용약관</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">확인 원칙</h3>
                        <p className="text-sm leading-relaxed text-gray-400">
                            일정·가격·입찰 조건은 법원 원문과 첨부 문서를 기준으로 확인하세요.
                            로옥션의 요약과 설명은 일반 정보이며 법률·세무·투자 자문이 아닙니다.
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-8 text-center text-xs text-gray-500 leading-relaxed">
                    <p>
                        본 서비스는 대한민국 법원 대국민서비스(
                        <a href="https://www.scourt.go.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                            scourt.go.kr
                        </a>
                        )에 공개된 회생·파산 자산매각 공고를 정리해 제공하는 민간 정보 서비스입니다.
                    </p>
                    <p className="mt-2">
                        데이터는 원문과 반영 시점에 차이가 있을 수 있습니다. 본 사이트는 법원 또는 법원행정처와 제휴·보증 관계가 없으며,
                        입찰 전에는 반드시 법원 공식 페이지에서 최종 정보를 확인해야 합니다.
                    </p>
                    <p className="mt-2">
                        검수된 편집 콘텐츠에는 Google AdSense 광고가 표시될 수 있습니다. Google의 파트너 사이트 데이터 사용 방식은{' '}
                        <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                            Google 안내
                        </a>
                        에서 확인할 수 있습니다.
                    </p>
                </div>

                <p className="text-center text-sm text-gray-600 mt-6">
                    &copy; {new Date().getFullYear()} LawAuction - 법원 자산매각 공고 검색
                </p>
            </div>
        </footer>
    );
}
