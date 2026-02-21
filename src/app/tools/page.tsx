import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '투자 계산기 도구 | LawAuction',
    description: '회생·파산 자산매각 입찰에 필요한 취득세 계산기, 입찰가 계산기, 차량 이전비 계산기, 투자 수익률 계산기 등 무료 도구를 제공합니다.',
    keywords: '취득세 계산기, 입찰가 계산기, 차량 이전비 계산기, 투자 수익률 계산기, 경매 계산기',
};

const tools = [
    {
        slug: 'acquisition-tax',
        title: '취득세 계산기',
        icon: '🧮',
        description: '부동산 또는 차량 취득 시 납부해야 할 취득세를 계산합니다.',
        features: ['부동산 취득세 (주택/상가/토지)', '다주택자 중과세 반영', '차량 취득세 계산', '지방교육세, 농어촌특별세 포함'],
        color: 'from-indigo-500 to-blue-600',
    },
    {
        slug: 'bid-calculator',
        title: '입찰가 계산기',
        icon: '📊',
        description: '목표 수익률을 기준으로 적정 입찰가를 역산합니다.',
        features: ['부동산 적정 입찰가', '차량 적정 입찰가', '취득세/수리비/명도비 반영', '수익률 시뮬레이션'],
        color: 'from-green-500 to-emerald-600',
    },
    {
        slug: 'vehicle-transfer',
        title: '차량 이전비 계산기',
        icon: '🚗',
        description: '법원 매각 차량의 이전 등록 시 필요한 총 비용을 계산합니다.',
        features: ['차종별 취득세 자동 계산', '지역별 공채 매입비', '번호판/인지세 포함', '법원 매각 필요 서류 안내'],
        color: 'from-orange-500 to-red-600',
    },
    {
        slug: 'roi-calculator',
        title: '투자 수익률 계산기',
        icon: '📈',
        description: '매도 차익형과 임대 수익형, 두 가지 방식의 투자 수익률을 분석합니다.',
        features: ['매도 차익 ROI 분석', '임대 순수익률 계산', '투자 회수 기간 산출', '연 환산 수익률 제공'],
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
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                    🛠️ 투자 계산기 도구
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                    회생·파산 자산매각 입찰에 필요한 무료 계산기 도구입니다.
                    <br />
                    취득세, 입찰가를 미리 계산하고 현명한 투자 결정을 내리세요.
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
                            {/* 아이콘 & 타이틀 */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-4xl">{tool.icon}</span>
                                <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {tool.title}
                                </h2>
                            </div>

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

            {/* 추가 안내 */}
            <div className="mt-12 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    💡 계산기 활용 팁
                </h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                    <li>• <strong>취득세 계산기</strong>를 먼저 사용하여 세금 규모를 파악하세요.</li>
                    <li>• <strong>입찰가 계산기</strong>로 목표 수익률에 맞는 적정 입찰가를 확인하세요.</li>
                    <li>• 차량 매각 공고라면 <strong>차량 이전비 계산기</strong>로 총 이전 비용을 미리 확인하세요.</li>
                    <li>• <strong>투자 수익률 계산기</strong>로 매도 차익 또는 임대 수익률을 시뮬레이션하세요.</li>
                    <li>• 여러 계산기를 함께 활용하면 더 정확한 투자 판단이 가능합니다.</li>
                </ul>
            </div>

            {/* 관련 링크 */}
            <div className="mt-8 flex flex-wrap gap-4">
                <Link
                    href="/glossary"
                    className="bg-white border border-gray-200 px-5 py-3 rounded-lg font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                    📖 용어사전 보기
                </Link>
                <Link
                    href="/blog"
                    className="bg-white border border-gray-200 px-5 py-3 rounded-lg font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                    ✍️ 블로그 보기
                </Link>
            </div>
        </div>
    );
}
