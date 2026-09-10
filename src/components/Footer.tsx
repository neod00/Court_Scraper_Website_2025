import Link from 'next/link';

const serviceLinks = [
    { href: '/', label: '공고 검색' },
    { href: '/datalab', label: '데이터랩' },
    { href: '/trend', label: '주간 칼럼' },
    { href: '/glossary', label: '용어사전' },
];

const editorialLinks = [
    { href: '/blog', label: '블로그 전체' },
    { href: '/blog/beginner-guide-first-bid', label: '첫 입찰 확인 순서' },
    { href: '/blog/understanding-registry-for-rights-analysis', label: '등기부 확인 기초' },
    { href: '/blog/auction-vs-public-sale-differences', label: '경매와 공매 비교' },
];

const operationLinks = [
    { href: '/authors/lawauction-editorial-team', label: '작성·검수' },
    { href: '/editorial-policy', label: '편집 원칙' },
    { href: '/privacy', label: '개인정보처리방침' },
    { href: '/terms', label: '이용약관' },
    { href: '/contact', label: '문의' },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
    return (
        <div>
            <h3 className="text-white font-bold mb-4">{title}</h3>
            <ul className="space-y-2 text-sm">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className="hover:text-white transition-colors">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <LinkColumn title="서비스" links={serviceLinks} />
                    <LinkColumn title="편집 콘텐츠" links={editorialLinks} />
                    <LinkColumn title="운영 정보" links={operationLinks} />

                    <div>
                        <h3 className="text-white font-bold mb-4">확인 원칙</h3>
                        <p className="text-sm leading-relaxed text-gray-400">
                            일정·가격·입찰 조건은 법원 원문과 첨부 문서를 기준으로 확인해야 합니다.{' '}
                            <Link href="/editorial-policy" className="text-indigo-400 hover:underline">
                                편집·데이터 운영 원칙
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-8 text-center text-xs text-gray-500 leading-relaxed">
                    <p>
                        로옥션(LawAuction)은 대한민국 법원 대국민서비스(
                        <a href="https://www.scourt.go.kr" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                            scourt.go.kr
                        </a>
                        )에 공개된 회생·파산 자산매각 공고를 정리해 제공하는 민간 정보 서비스입니다.
                        법원 또는 법원행정처와 제휴·보증 관계가 없습니다.
                    </p>
                    <p className="mt-2">
                        일부 페이지에는 Google AdSense 광고가 표시될 수 있습니다.{' '}
                        <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                            Google의 파트너 사이트 데이터 사용 안내
                        </a>
                    </p>
                </div>

                <p className="text-center text-sm text-gray-600 mt-6">
                    &copy; {new Date().getFullYear()} 로옥션(LawAuction)
                </p>
            </div>
        </footer>
    );
}
