interface NoticeFAQProps {
    notice: {
        title: string;
        category: string;
        court_name: string;
        date_posted: string;
    };
}

export default function NoticeFAQ({ notice }: NoticeFAQProps) {
    const isRealEstate = notice.category === 'real_estate';
    
    const faqs = [
        {
            q: `본 공고(${notice.title})의 매각 방식은 무엇인가요?`,
            a: `${notice.court_name}에서 진행하는 이번 매각은 통상적으로 공개경쟁입찰 또는 수의계약 방식으로 진행됩니다. 상세한 입찰 방법은 법원 매각물건명세서 및 공고 원문을 통해 확인하실 수 있습니다.`
        },
        {
            q: isRealEstate ? "부동산 매각 시 현장 방문이 가능한가요?" : "차량/유동자산 매각 시 실물 확인이 가능한가요?",
            a: "대부분의 법원 자산매각 공고는 정해진 일시에 현장 설명회 또는 실물 확인 기회를 제공합니다. 무단 침입은 법적 문제가 될 수 있으므로, 공고에 명시된 연락처(관재인 사무실 등)를 통해 사전 협의 후 방문하시기 바랍니다."
        },
        {
            q: "낙찰 후 잔금 납부 기한은 어떻게 되나요?",
            a: "보통 낙찰 결정일로부터 1개월 이내에 잔금을 완납해야 합니다. 기간 내 미납 시 입찰보증금이 몰수될 수 있으므로 사전에 자금 계획을 철저히 세우는 것이 중요합니다."
        },
        {
            q: "회생/파산 자산 매입 시 장점은 무엇인가요?",
            a: "법원의 감독 하에 매각이 진행되므로 거래의 안정성이 높고, 일반 매물보다 시세 대비 저렴하게 취득할 수 있는 기회가 많습니다. 또한 권리관계가 법원에 의해 공시되어 투명한 분석이 가능합니다."
        }
    ];

    return (
        <section className="mt-12 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    ❓ 자주 묻는 질문 (FAQ)
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="p-6">
                        <h4 className="font-bold text-gray-900 mb-2">Q. {faq.q}</h4>
                        <p className="text-gray-600 leading-relaxed text-sm">A. {faq.a}</p>
                    </div>
                ))}
            </div>

            {/* JSON-LD for FAQPage */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        'mainEntity': faqs.map(faq => ({
                            '@type': 'Question',
                            'name': faq.q,
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': faq.a
                            }
                        }))
                    })
                }}
            />
        </section>
    );
}
