'use client';

// 편집형 마스트헤드 — 로고·제호 + 먹선으로 이어 붙인 메뉴 칸.
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: '공고 검색' },
  { href: '/court', label: '법원별' },
  { href: '/tools', label: '계산기' },
  { href: '/datalab', label: '데이터랩' },
  { href: '/glossary', label: '용어사전' },
  { href: '/blog', label: '가이드' },
  { href: '/about', label: '소개' },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/' || pathname.startsWith('/notice') || pathname.startsWith('/category');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#EFEBE2]/95 backdrop-blur border-b border-[#161616]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-[68px] gap-6 py-2">
          <Link href="/" className="flex items-center gap-3 min-w-0" aria-label="로옥션(LawAuction) 홈">
            <span className="relative w-11 h-11">
              <Image src="/logo.png" alt="" fill sizes="44px" className="object-contain" priority />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[24px] font-extrabold tracking-[-0.05em]">로옥션</span>
              <span className="mt-1 hidden min-[360px]:block text-[10.5px] font-semibold tracking-[0.06em] whitespace-nowrap">LAWAUCTION · 법원 매각 공고</span>
            </span>
          </Link>

          <nav className="hidden lg:flex" aria-label="주요 메뉴">
            {navLinks.map((link, i) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3.5 py-2.5 text-[15px] border border-[#161616] ${i > 0 ? 'border-l-0' : ''} transition-colors ${active
                    ? 'bg-[#161616] text-[#FAF7EC] font-bold'
                    : 'font-semibold hover:bg-[#FAF7EC]'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            className="lg:hidden shrink-0 inline-flex items-center gap-2 h-11 px-3 border border-[#161616] text-sm font-bold hover:bg-[#FAF7EC]"
          >
            <span>{isMenuOpen ? '닫기' : '메뉴'}</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {isMenuOpen
                ? <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="square" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav id="mobile-nav" className="lg:hidden border-t border-[#161616]" aria-label="모바일 메뉴">
          <ul className="max-w-7xl mx-auto grid grid-cols-2">
            {navLinks.map((link, i) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href} className={`border-b border-[#161616] ${i % 2 === 0 ? 'border-r' : ''}`}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`block px-4 py-3.5 text-[15px] ${active ? 'bg-[#161616] text-[#FAF7EC] font-bold' : 'font-semibold'}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
