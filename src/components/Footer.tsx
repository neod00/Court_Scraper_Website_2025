// 편집형 하단 — 먹선으로 나눈 색인 칸.
import Image from 'next/image';
import Link from 'next/link';

const serviceLinks = [
    { href: '/', label: '공고 검색' },
    { href: '/court', label: '법원별 공고' },
    { href: '/tools', label: '계산기' },
    { href: '/datalab', label: '데이터랩' },
    { href: '/glossary', label: '용어사전' },
];

const editorialLinks = [
    { href: '/blog', label: '가이드 전체' },
    { href: '/blog/beginner-guide-first-bid', label: '첫 입찰 확인 순서' },
    { href: '/blog/understanding-registry-for-rights-analysis', label: '등기부 확인 기초' },
    { href: '/blog/auction-vs-public-sale-differences', label: '경매와 공매 비교' },
];

const operationLinks = [
    { href: '/about', label: '소개' },
    { href: '/authors/lawauction-editorial-team', label: '작성·검수' },
    { href: '/editorial-policy', label: '데이터·편집 원칙' },
    { href: '/privacy', label: '개인정보처리방침' },
    { href: '/terms', label: '이용약관' },
    { href: '/contact', label: '문의' },
];

function LinkColumn({ no, title, links }: { no: string; title: string; links: { href: string; label: string }[] }) {
    return (
        <div className="p-5 border-[#161616] border-b md:border-b-0 md:border-l">
            <h3 className="flex items-baseline gap-2 text-sm font-extrabold mb-3">
                <span className="num text-xs font-bold">{no}</span>
                {title}
            </h3>
            <ul className="space-y-2 text-sm">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className="hover:underline underline-offset-[3px]">
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
        <footer className="mt-auto border-t border-[#161616]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 border border-[#161616] bg-[#FAF7EC]">
                    <div className="p-5 border-b md:border-b-0 border-[#161616] flex flex-col gap-3">
                        <Link href="/" className="flex items-center gap-2.5" aria-label="로옥션 홈">
                            <span className="relative w-10 h-10">
                                <Image src="/logo.png" alt="" fill sizes="40px" className="object-contain" />
                            </span>
                            <span className="text-xl font-extrabold tracking-[-0.05em]">로옥션</span>
                        </Link>
                        <p className="text-sm leading-relaxed text-[#3A3A3A]">
                            전국 회생법원·지방법원의 자산매각 공고를 모으고, 첨부 공고문에서 회차별 최저입찰가를 읽어 정리합니다.
                        </p>
                    </div>
                    <LinkColumn no="01" title="서비스" links={serviceLinks} />
                    <LinkColumn no="02" title="가이드" links={editorialLinks} />
                    <LinkColumn no="03" title="운영 정보" links={operationLinks} />
                </div>

                <div className="pt-6 text-xs text-[#3A3A3A] leading-relaxed space-y-2">
                    <p>
                        로옥션(LawAuction)은 대한민국 법원 대국민서비스(
                        <a href="https://www.scourt.go.kr" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                            scourt.go.kr
                        </a>
                        )에 공개된 회생·파산 자산매각 공고를 정리해 제공하는 민간 정보 서비스입니다.
                        법원 또는 법원행정처와 제휴·보증 관계가 없으며, 일정·가격·입찰 조건은 법원 원문과 첨부 문서를 기준으로 확인해야 합니다.
                    </p>
                    <p>
                        일부 페이지에는 Google AdSense 광고가 표시될 수 있습니다.{' '}
                        <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                            Google의 파트너 사이트 데이터 사용 안내
                        </a>
                    </p>
                    <p>&copy; {new Date().getFullYear()} 로옥션(LawAuction)</p>
                </div>
            </div>
        </footer>
    );
}
