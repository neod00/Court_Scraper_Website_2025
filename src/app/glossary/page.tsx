import Link from 'next/link';
import type { Metadata } from 'next';
import {
    glossaryTerms,
    glossaryByCategory,
    getTermDisplayName,
    GLOSSARY_CORPUS_NOTE,
    GLOSSARY_REVIEWED_AT,
} from '@/data/glossary';

export const metadata: Metadata = {
    title: '회생·파산 자산매각 용어사전',
    description:
        '회생절차, 파산관재인, 수의계약, 입찰보증금, 최저매각가격 등 법원 회생·파산 자산매각 공고를 읽는 데 필요한 20개 용어를 설명하고, 로옥션이 수집한 공고에서 각 개념이 얼마나 자주 등장하는지 함께 정리했습니다.',
    keywords: '회생절차, 파산관재인, 수의계약, 입찰보증금, 최저매각가격, 유치권, 법정지상권, 권리분석, 경매용어, 법률용어',
    alternates: { canonical: '/glossary' },
    openGraph: {
        title: '회생·파산 자산매각 용어사전',
        description: '법원 회생·파산 자산매각 공고를 읽는 데 필요한 20개 용어와 공고 내 언급 빈도',
        url: '/glossary',
        type: 'website',
    },
};

const categoryDescriptions: Record<string, string> = {
    '절차': '회생, 파산, 관재인 매각 등 자산 매각과 관련된 법적 절차입니다.',
    '권리': '유치권, 법정지상권, 근저당권 등 자산에 설정되는 권리입니다.',
    '비용': '취득세, 감정가, 입찰보증금 등 금전과 관련된 용어입니다.',
    '문서': '등기사항증명서, 매각물건명세서 등 확인이 필요한 서류입니다.',
    '기타': '권리분석 등 그 밖의 개념입니다.',
};

export default function GlossaryPage() {
    const categorizedTerms = glossaryByCategory();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: '회생·파산 자산매각 용어사전',
        url: 'https://www.courtauction.site/glossary',
        inLanguage: 'ko-KR',
        publisher: { '@type': 'Organization', name: '로옥션(LawAuction)', url: 'https://www.courtauction.site' },
        hasDefinedTerm: glossaryTerms.map((t) => ({
            '@type': 'DefinedTerm',
            name: getTermDisplayName(t),
            description: t.shortDescription,
            url: `https://www.courtauction.site/glossary/${t.slug}`,
        })),
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* 헤더 */}
            <header className="mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    회생·파산 자산매각 용어사전
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
                    법원 회생·파산 자산매각 공고를 읽을 때 마주치는 {glossaryTerms.length}개 용어를 설명합니다.
                    각 용어 끝에는 로옥션(LawAuction)이 수집한 공고에서 그 개념이 실제로 얼마나 언급되는지를 덧붙여,
                    법원 경매 용어와 관재인·관리인 매각 공고의 차이를 확인할 수 있게 했습니다.
                </p>
                <p className="mt-4 text-sm text-gray-500">
                    기준: {GLOSSARY_REVIEWED_AT} 검수 · 용어 {glossaryTerms.length}개 · 작성 <Link href="/authors/lawauction-editorial-team" className="underline hover:text-indigo-600">로옥션 편집팀</Link>
                </p>
            </header>

            {/* 카테고리 바로가기 */}
            <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-12" aria-label="카테고리 바로가기">
                <h2 className="text-lg font-bold text-gray-800 mb-4">카테고리별 바로가기</h2>
                <div className="flex flex-wrap gap-3">
                    {categorizedTerms.map(({ category, terms }) => (
                        <a
                            key={category}
                            href={`#category-${category}`}
                            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <span className="font-medium">{category}</span>
                            <span className="text-sm text-gray-500">({terms.length})</span>
                        </a>
                    ))}
                </div>
            </nav>

            {/* 카테고리별 용어 목록 */}
            <div className="space-y-16">
                {categorizedTerms.map(({ category, terms }) => (
                    <section key={category} id={`category-${category}`} className="scroll-mt-24">
                        <div className="mb-6 pb-4 border-b-2 border-indigo-100">
                            <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                            <p className="text-sm text-gray-500">{categoryDescriptions[category]}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {terms.map((item) => (
                                <Link
                                    key={item.slug}
                                    href={`/glossary/${item.slug}`}
                                    className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {getTermDisplayName(item)}
                                        </h3>
                                        <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                                            →
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        {item.shortDescription}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.relatedTerms
                                            .map((related) => glossaryTerms.find((t) => t.term === related))
                                            .filter((t): t is NonNullable<typeof t> => Boolean(t))
                                            .slice(0, 3)
                                            .map((related) => (
                                                <span
                                                    key={related.slug}
                                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                                >
                                                    {getTermDisplayName(related)}
                                                </span>
                                            ))}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* 통계 기준 */}
            <p className="mt-12 text-sm text-gray-500 leading-relaxed border-t border-gray-200 pt-6">
                {GLOSSARY_CORPUS_NOTE}{' '}
                집계 방법은 <Link href="/editorial-policy" className="underline hover:text-indigo-600">데이터·편집 원칙</Link>에서 확인할 수 있습니다.
            </p>

            {/* 다음 단계 */}
            <div className="mt-8 bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-3">함께 보기</h2>
                <p className="text-gray-600 mb-6">
                    용어를 확인한 뒤에는 실제 공고를 검색하거나, 공고 읽는 순서를 정리한 편집 글을 볼 수 있습니다.
                </p>
                <div className="flex gap-4 flex-wrap">
                    <Link
                        href="/"
                        className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        공고 검색
                    </Link>
                    <Link
                        href="/blog"
                        className="bg-white border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        편집 콘텐츠
                    </Link>
                    <Link
                        href="/faq"
                        className="bg-white border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        자주 묻는 질문
                    </Link>
                </div>
            </div>
        </div>
    );
}
