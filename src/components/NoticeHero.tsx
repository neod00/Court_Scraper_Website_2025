import Badge from './Badge';

interface NoticeHeroProps {
    notice: {
        title: string;
        category: string;
        court_name: string;
        date_posted: string;
        department?: string;
    };
}

// 공고 상세 상단 헤더. 외부 이미지 요청 없이 텍스트만 렌더링합니다.
export default function NoticeHero({ notice }: NoticeHeroProps) {
    const isRealEstate = notice.category === 'real_estate';
    const isVehicle = notice.category === 'vehicle';
    const categoryLabel = isRealEstate ? '부동산' : (isVehicle ? '차량/동산' : '기타자산');
    const badgeColor = isRealEstate ? 'blue' : (isVehicle ? 'green' : 'gray');

    return (
        <header className="bg-[#FAF7EC] border border-[#161616] rounded-none p-6 md:p-8 mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge color={badgeColor}>{categoryLabel}</Badge>
                <span className="px-3 py-1 rounded-none bg-[#E9E4D8] text-[#2E2B27] text-xs font-medium border border-[#161616]">
                    {notice.court_name}
                </span>
                {notice.date_posted && (
                    <span className="px-3 py-1 rounded-none bg-[#D7E7DF] text-[#1F3D7A] text-xs font-medium border border-[#161616]">
                        공고일 {notice.date_posted}
                    </span>
                )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#161616] leading-tight break-keep">
                {notice.title}
            </h1>

            {notice.department && notice.department !== notice.court_name && (
                <p className="mt-3 text-sm text-[#3A3A3A]">관할 {notice.department}</p>
            )}
        </header>
    );
}
