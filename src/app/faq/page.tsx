import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '자주 묻는 질문 (FAQ) | 대법원 회생·파산 자산매각 공고 자동조회 시스템',
    description: '대법원 회생·파산 자산매각 공고 자동조회 시스템 이용에 관한 자주 묻는 질문과 답변입니다.',
};

const faqs = [
    {
        category: '서비스 소개',
        questions: [
            {
                q: '이 서비스는 무엇인가요?',
                a: '대법원에서 공고하는 회생·파산 자산매각 공고(부동산, 차량, 채권 등)를 실시간으로 자동으로 수집하여 사용자들이 복잡한 검색 과정 없이 한눈에 쉽게 조회하고 분석할 수 있도록 돕는 전문 정보 제공 서비스입니다. 사용자는 별도의 비용 없이 매일 업데이트되는 최신 매각 정보를 확인할 수 있습니다.',
            },
            {
                q: '서비스 이용료가 있나요?',
                a: '아니요, 본 서비스는 누구나 언제 어디서든 완전히 무료로 이용하실 수 있습니다. 가입이나 결제 없이 모든 상세 공고 정보를 열람할 수 있도록 개방되어 있습니다. 다만, 고품질 서버 유지 및 서비스 고도화를 위해 사이트 내에 Google AdSense 등 일부 광고가 게재될 수 있으니 양해 부탁드립니다.',
            },
            {
                q: '회원가입이 필요한가요?',
                a: '아니요, 별도의 회원가입 없이 바로 이용하실 수 있습니다.',
            },
        ],
    },
    {
        category: '데이터 관련',
        questions: [
            {
                q: '데이터는 어디서 가져오나요?',
                a: '모든 데이터는 대한민국 법원 대국민서비스(scourt.go.kr)에서 공개된 정보를 수집하여 제공합니다.',
            },
            {
                q: '데이터는 얼마나 자주 업데이트되나요?',
                a: '데이터는 매일 자동으로 업데이트됩니다. 다만, 대법원의 공고 시점과 반영 시점 사이에 약간의 시차가 있을 수 있습니다.',
            },
            {
                q: '공고일로부터 90일이 지난 데이터는 왜 삭제되나요?',
                a: '저장 공간 효율화와 최신 정보 제공을 위해 오래된 데이터는 자동으로 삭제됩니다. 필요한 정보는 미리 저장해 두시기 바랍니다.',
            },
        ],
    },
    {
        category: '검색 및 이용',
        questions: [
            {
                q: '어떤 카테고리의 자산을 검색할 수 있나요?',
                a: '부동산, 차량/중기, 채권, 주식/지분, 특허/상표, 동산, 기타 등 다양한 카테고리의 자산을 검색할 수 있습니다.',
            },
            {
                q: '특정 기간의 공고만 검색할 수 있나요?',
                a: '네, 시작일과 종료일을 설정하여 원하는 기간의 공고만 검색할 수 있습니다.',
            },
            {
                q: '검색 결과를 다운로드할 수 있나요?',
                a: '각 공고의 상세 페이지에서 원본 파일 다운로드 링크가 제공되는 경우 다운로드하실 수 있습니다.',
            },
        ],
    },
    {
        category: '법적 안내',
        questions: [
            {
                q: '이 정보로 바로 입찰에 참여할 수 있나요?',
                a: '본 서비스는 참고용 정보만 제공합니다. 실제 입찰 참여 시에는 반드시 대법원 홈페이지에서 공식 정보를 확인하시기 바랍니다.',
            },
            {
                q: '정보가 실제와 다른 경우 어떻게 하나요?',
                a: '본 서비스의 정보는 법적 효력이 없으며, 오류가 있을 수 있습니다. 정확한 정보는 대법원 홈페이지에서 확인해 주세요. 오류 발견 시 문의 페이지를 통해 신고해 주시면 감사하겠습니다.',
            },
            {
                q: '법원과 공식 제휴 관계인가요?',
                a: '아니요, 본 서비스는 법원 또는 법원행정처와 직접적인 제휴·보증 관계에 있지 않은 민간 서비스입니다.',
            },
        ],
    },
    {
        category: '광고 관련',
        questions: [
            {
                q: '왜 광고가 표시되나요?',
                a: '본 서비스는 무료로 제공되며, 서비스 운영 및 유지를 위해 Google AdSense 광고가 게재됩니다.',
            },
            {
                q: '광고를 제거할 수 있나요?',
                a: '현재 광고 제거 옵션은 제공되지 않습니다. 광고 수익은 서비스 운영에 사용됩니다.',
            },
        ],
    },
];

export default function FAQPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">❓ 자주 묻는 질문 (FAQ)</h1>

            <div className="space-y-8">
                {faqs.map((section, sectionIdx) => (
                    <div key={sectionIdx} className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm">
                                {section.category}
                            </span>
                        </h2>
                        <div className="space-y-4">
                            {section.questions.map((faq, faqIdx) => (
                                <div key={faqIdx} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                                    <h3 className="font-medium text-gray-900 mb-2 flex items-start gap-2">
                                        <span className="text-indigo-500 font-bold">Q.</span>
                                        {faq.q}
                                    </h3>
                                    <p className="text-gray-600 pl-6 leading-relaxed">
                                        <span className="text-green-600 font-bold mr-1">A.</span>
                                        {faq.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-600 mb-3">
                        원하시는 답변을 찾지 못하셨나요?
                    </p>
                    <a
                        href="/contact"
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        📧 문의하기
                    </a>
                </div>
            </div>
        </div>
    );
}
