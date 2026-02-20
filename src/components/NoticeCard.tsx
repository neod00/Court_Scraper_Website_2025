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
            <div className="bg-white overflow-hidden shadow-sm rounded-2xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-100/80 group flex flex-col h-full relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-300" />
                <div className="p-5 sm:px-6 sm:py-6 flex-grow flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <Badge color={getCategoryColor(notice.category)}>
                            {getCategoryName(notice.category)}
                        </Badge>
                        <span className="text-xs font-semibold text-gray-400 tracking-wide bg-gray-50 px-2 py-1 rounded-md">
                            {notice.date_posted}
                        </span>
                    </div>
                    <h3 className="text-[1.05rem] leading-snug font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                        {notice.title}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <span className="text-gray-400">🏛️</span> {notice.department || '관할법원 정보 없음'}
                        </span>
                        <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pt-0.5">
                            상세보기 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
