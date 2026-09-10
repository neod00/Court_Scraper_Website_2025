import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '계산기 도구',
    description: '회생·파산 자산매각 공고를 검토할 때 비용을 가늠하기 위한 참고용 계산기입니다. 취득세, 입찰가, 차량 이전비, 매도·임대 손익 계산기를 제공합니다.',
    keywords: '취득세 계산기, 입찰가 계산기, 차량 이전비 계산기, 매도·임대 손익 계산기',
    alternates: { canonical: '/tools' },
    robots: { index: false, follow: true },
};

const tools = [
    {
        slug: 'acquisition-tax',
        title: '취득세 계산기',
        description: '부동산 또는 차량 취득 시 납부할 취득세를 입력값 기준으로 계산합니다.',
        features: ['부동산 취득세 (주택/상가/토지)', '다주택 중과 반영', '차량 취득세 계산', '지방교육세, 농어촌특별세 포함'],
        color: 'from-indigo-500 to-blue-600',
    },
    {
        slug: 'bid-calculator',
        title: '입찰가 계산기',
        description: '목표 이익률을 입력하면 그에 대응하는 입찰가를 역산합니다.',
        features: ['부동산 입찰가 역산', '차량 입찰가 역산', '취득세/수리비/명도비 반영', '비용 합계 확인'],
        color: 'from-green-500 to-emerald-600',
    },
    {
        slug: 'vehicle-transfer',
        title: '차량 이전비 계산기',
        description: '법원 매각 차량의 이전 등록에 드는 비용 항목을 합산합니다.',
        features: ['차종별 취득세 계산', '지역별 공채 매입비', '번호판/인지세 포함', '법원 매각 필요 서류 안내'],
        color: 'from-orange-500 to-red-600',
    },
    {
        slug: 'roi-calculator',
        title: '매도·임대 손익 계산기',
        description: '매도가 또는 임대 조건과 총비용을 비교해 손익을 단순 계산합니다.',
        features: ['매도 손익 계산', '임대 순수입 비율 계산', '비용 회수 기간 산출', '연 환산 손익 비율 표시'],
        color: 'from-violet-500 to-purple-600',
    },
];


export default function ToolsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">도구</span>
            </nav>

            {/* 헤더 */}
            <header className="mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    계산기 도구
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                    회생·파산 자산매각 공고를 검토할 때 비용 규모를 가늠하기 위한 참고용 계산기입니다.
                    <br />
                    결과는 입력값에 따른 단순 계산이며, 실제 세액과 비용은 관할 기관에서 확인해야 합니다.
                </p>
            </header>

            {/* 도구 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                        {/* 그라데이션 바 */}
                        <div className={`h-2 bg-gradient-to-r ${tool.color}`} />

                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-4">
                                {tool.title}
                            </h2>

                            {/* 설명 */}
                            <p className="text-gray-600 mb-4">
                                {tool.description}
                            </p>

                            {/* 기능 태그 */}
                            <div className="flex flex-wrap gap-2">
                                {tool.features.map((feature, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            {/* 화살표 */}
                            <div className="mt-4 text-indigo-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                사용하기 <span className="text-lg">→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* 계산 근거와 한계 */}
            <div className="mt-12 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                    계산 근거와 한계
                </h2>
                <ul className="text-gray-700 space-y-2 text-sm">
                    <li>• 취득세 관련 세율은 지방세법 제11조·제12조와 지방세법 시행령을 바탕으로 2026년 1월 기준으로 정리한 값입니다. 세율 검토가 필요하면 위택스와 국가법령정보센터에서 현재 기준을 확인해야 합니다.</li>
                    <li>• 공채 매입비, 등록 수수료, 수리비 등은 지역과 시점에 따라 달라지는 예시값입니다.</li>
                    <li>• 조정대상지역, 생애최초 감면, 법인 취득 등 특수한 경우는 반영되지 않았습니다.</li>
                    <li>• 계산기는 입력값을 그대로 계산할 뿐, 물건의 상태나 권리관계를 판단하지 않습니다. 공고 원문과 첨부파일 확인이 우선입니다.</li>
                </ul>
            </div>

            {/* 관련 링크 */}
            <div className="mt-8 flex flex-wrap gap-4">
                <Link
                    href="/glossary"
                    className="bg-white border border-gray-200 px-5 py-3 rounded-lg font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                    용어사전 보기
                </Link>
                <Link
                    href="/blog"
                    className="bg-white border border-gray-200 px-5 py-3 rounded-lg font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                    편집 콘텐츠 보기
                </Link>
            </div>
        </div>
    );
}
