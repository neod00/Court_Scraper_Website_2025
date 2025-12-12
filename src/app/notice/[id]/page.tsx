import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/Badge';
import DownloadFiles from '@/components/DownloadFiles';

// Revalidate every hour
export const revalidate = 3600;

interface PageProps {
    params: {
        id: string;
    };
}

export default async function NoticeDetail({ params }: PageProps) {
    const { id } = params;

    const { data: notice, error } = await supabase
        .from('court_notices')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !notice) {
        console.error('Error fetching notice:', error);
        notFound();
    }

    // Helper for category
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
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        공고 상세 정보
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {notice.site_id}
                    </p>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    목록으로 돌아가기
                </Link>
            </div>
            <div className="border-t border-gray-200">
                <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">공고 제목</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
                            {notice.title}
                        </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">카테고리</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <Badge color={getCategoryColor(notice.category)}>
                                {getCategoryName(notice.category)}
                            </Badge>
                        </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">공고일자</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {notice.date_posted}
                        </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">관할법원 / 부서</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {notice.department || '-'} / {notice.manager || '-'}
                        </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">첨부파일</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <DownloadFiles fileInfo={notice.file_info} />
                        </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">원본 링크</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <a
                                href={notice.detail_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:text-indigo-900 underline"
                            >
                                법원 사이트에서 열기 ↗
                            </a>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
