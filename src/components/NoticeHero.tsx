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
        <header className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge color={badgeColor}>{categoryLabel}</Badge>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                    {notice.court_name}
                </span>
                {notice.date_posted && (
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                        공고일 {notice.date_posted}
                    </span>
                )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight break-keep">
                {notice.title}
            </h1>

            {notice.department && notice.department !== notice.court_name && (
                <p className="mt-3 text-sm text-gray-600">관할 {notice.department}</p>
            )}
        </header>
    );
}
