import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '찾을 수 없는 페이지',
  robots: {
    index: false,
    follow: true,
  },
};

const links = [
  { href: '/', label: '공고 검색' },
  { href: '/trend', label: '주간 칼럼' },
  { href: '/datalab', label: '데이터랩' },
  { href: '/blog', label: '블로그' },
  { href: '/glossary', label: '용어사전' },
  { href: '/faq', label: '자주 묻는 질문' },
];

export default function NotFound() {
  return (
    <section className="max-w-2xl mx-auto py-16 text-center">
      <p className="text-sm font-semibold text-gray-500 mb-2">404</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">찾을 수 없는 페이지입니다</h1>
      <p className="text-gray-600 mb-10">
        주소가 바뀌었거나 공고가 더 이상 제공되지 않는 경우이며, 아래 메뉴에서 원하는 내용을 다시 찾을 수 있습니다.
      </p>
      <nav aria-label="주요 페이지">
        <ul className="flex flex-wrap justify-center gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-block px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
