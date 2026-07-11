interface NoticeFAQProps {
    notice: {
        title: string;
        category: string;
        court_name: string;
        date_posted: string;
    };
}

export default function NoticeFAQ({ notice }: NoticeFAQProps) {
    const checks = [
        {
            q: '정확한 입찰 방식과 일정은 어디에서 확인하나요?',
            a: `${notice.date_posted}에 게시된 “${notice.title}” 공고 원문과 첨부파일을 기준으로 확인하세요. 공개경쟁입찰, 수의계약, 방문 또는 우편 제출 등 방식은 공고마다 다르므로 일반적인 방식으로 추정하면 안 됩니다.`,
        },
        {
            q: '현장 방문이나 실물 확인이 가능한가요?',
            a: `실물 확인 가능 여부와 방문 조건은 공고마다 다릅니다. ${notice.court_name} 공고에 기재된 담당자 연락처로 사전 확인하고, 허가받지 않은 장소에는 출입하지 마세요.`,
        },
        {
            q: '보증금과 잔금 납부 기한은 어떻게 확인하나요?',
            a: '보증금 비율과 잔금 기한은 매각 조건에 따라 달라집니다. 이 페이지의 요약이나 일반적인 경매 관행보다 공고 원문에 적힌 금액과 날짜를 우선해야 합니다.',
        },
        {
            q: 'AI 요약은 어느 범위까지 참고할 수 있나요?',
            a: 'AI 요약은 첨부 문서에서 주요 항목을 찾기 위한 1차 보조 자료입니다. 독립적인 법률 검토, 권리분석 또는 감정평가가 아니며 누락과 해석 오류가 있을 수 있습니다.',
        },
    ];

    return (
        <section className="mt-12 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">공고 확인 체크포인트</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {checks.map((check) => (
                    <div key={check.q} className="p-6">
                        <h4 className="font-bold text-gray-900 mb-2">Q. {check.q}</h4>
                        <p className="text-gray-600 leading-relaxed text-sm">A. {check.a}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
