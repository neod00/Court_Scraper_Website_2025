import Link from 'next/link';
import Badge from './Badge';

interface NoticeProps {
    id: string; // our db uuid
    title: string;
    department: string | null;
    date_posted: string;
    category: string | null;
    site_id: string; // court seq_id
}

export default function NoticeCard({ notice }: { notice: NoticeProps }) {
    // Simple category mapping for display color
    const getCategoryColor = (cat: string | null) => {
        if (cat === 'real_estate') return 'blue';
        if (cat === 'vehicle') return 'green';
        return 'gray';
    };

    const getCategoryName = (cat: string | null) => {
        if (cat === 'real_estate') return '부동산';
        if (cat === 'vehicle') return '차량/동산';
        return '기타';
    };

    return (
        <Link href={`/notice/${notice.id}`} className="block">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 border border-gray-100">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Badge color={getCategoryColor(notice.category)}>
                            {getCategoryName(notice.category)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                            {notice.date_posted}
                        </span>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 truncate mb-1">
                        {notice.title}
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>{notice.department || '관할법원 정보 없음'}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
