import Link from 'next/link';
import type { Metadata } from 'next';
import { glossaryTerms, glossaryByCategory } from '@/data/glossary';

export const metadata: Metadata = {
    title: '회생·파산 용어사전 | LawAuction',
    description: '회생절차, 파산, 유치권, 법정지상권, 권리분석 등 법원 경매와 자산매각에 필요한 핵심 용어를 알기 쉽게 설명합니다.',
    keywords: '회생절차, 파산, 유치권, 법정지상권, 권리분석, 경매용어, 법률용어, 부동산경매, 감정가, 최저매각가격',
};

export default function GlossaryPage() {
    const categorizedTerms = glossaryByCategory();

    const categoryIcons: Record<string, string> = {
        '절차': '⚙️',
        '권리': '🔒',
        '비용': '💰',
        '문서': '📄',
        '기타': '📌',
    };

    const categoryDescriptions: Record<string, string> = {
        '절차': '회생, 파산, 경매 등 자산 매각 관련 법적 절차를 설명합니다.',
        '권리': '유치권, 법정지상권, 근저당권 등 부동산에 설정되는 권리를 다룹니다.',
        '비용': '취득세, 감정가, 입찰보증금 등 금전 관련 용어를 정리합니다.',
        '문서': '등기부등본, 매각물건명세서 등 필수 서류를 안내합니다.',
        '기타': '권리분석 등 기타 중요 개념을 설명합니다.',
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* 헤더 섹션 */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    📚 회생·파산 용어사전
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    법원 경매와 회생·파산 자산매각에 참여하기 위해 반드시 알아야 할 핵심 용어들을
                    쉽고 정확하게 설명합니다. 처음 입찰에 도전하시는 분들께 유용한 가이드가 될 것입니다.
                </p>
                <div className="mt-6 flex justify-center gap-4 flex-wrap">
                    <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-4 py-2 rounded-full">
                        📖 총 {glossaryTerms.length}개 용어
                    </span>
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-4 py-2 rounded-full">
                        ✅ 실무 중심 설명
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-sm font-medium px-4 py-2 rounded-full">
                        🔄 정기 업데이트
                    </span>
                </div>
            </div>

            {/* 빠른 이동 네비게이션 */}
            <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-12">
                <h2 className="text-lg font-bold text-gray-800 mb-4">📍 카테고리별 바로가기</h2>
                <div className="flex flex-wrap gap-3">
                    {categorizedTerms.map(({ category }) => (
                        <a
                            key={category}
                            href={`#category-${category}`}
                            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <span>{categoryIcons[category]}</span>
                            <span className="font-medium">{category}</span>
                            <span className="text-sm text-gray-500">
                                ({categorizedTerms.find(c => c.category === category)?.terms.length || 0})
                            </span>
                        </a>
                    ))}
                </div>
            </nav>

            {/* 카테고리별 용어 목록 */}
            <div className="space-y-16">
                {categorizedTerms.map(({ category, terms }) => (
                    <section key={category} id={`category-${category}`} className="scroll-mt-24">
                        {/* 카테고리 헤더 */}
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-indigo-100">
                            <span className="text-3xl">{categoryIcons[category]}</span>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                                <p className="text-sm text-gray-500">{categoryDescriptions[category]}</p>
                            </div>
                        </div>

                        {/* 용어 카드 그리드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {terms.map((item) => (
                                <Link
                                    key={item.slug}
                                    href={`/glossary/${item.slug}`}
                                    className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {item.term}
                                        </h3>
                                        <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            →
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        {item.shortDescription}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.relatedTerms.slice(0, 3).map((related) => (
                                            <span
                                                key={related}
                                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                            >
                                                #{related}
                                            </span>
                                        ))}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* 하단 CTA */}
            <div className="mt-16 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-3">📌 지금 바로 매각 공고를 확인해보세요</h3>
                <p className="text-indigo-100 mb-6">
                    용어를 숙지했다면, 실제 매각 공고를 검색하고 분석해보세요.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                    <Link
                        href="/"
                        className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                        🔍 공고 검색하기
                    </Link>
                    <Link
                        href="/guide"
                        className="bg-indigo-500 text-white font-bold px-8 py-3 rounded-lg hover:bg-indigo-400 transition-colors"
                    >
                        📚 입찰 가이드 보기
                    </Link>
                </div>
            </div>
        </div>
    );
}
