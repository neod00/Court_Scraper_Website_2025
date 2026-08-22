import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { filterQualityNotices } from '@/lib/noticeQuality';

interface RelatedNoticesRSSProps {
    currentId: string;
    category: string;
    courtName: string;
}

export default async function RelatedNoticesRSS({ currentId, category }: RelatedNoticesRSSProps) {
    // Fetch related notices via direct DB query (mimicking RSS logic)
    const { data: rawNotices } = await supabase
        .from('court_notices')
        .select('id, title, date_posted, category, department, ai_summary')
        .eq('source_type', 'notice')
        .eq('category', category)
        .neq('id', currentId)
        .not('ai_summary', 'is', null)
        .order('date_posted', { ascending: false })
        .limit(30);

    // 분석이 담긴(색인 가능한) 공고만 노출 — thin/fallback 페이지로 크롤러가 새지 않게.
    const notices = filterQualityNotices(rawNotices).slice(0, 5);

    if (notices.length === 0) return null;

    return (
        <aside className="mt-12 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="font-bold text-base text-gray-900">같은 분야의 최근 공고</h3>
            </div>

            <div className="p-6">
                <p className="text-gray-500 text-xs mb-5">
                    지금 보고 계시는 <span className="text-gray-900 font-bold">{category === 'real_estate' ? '부동산' : '차량/동산'}</span> 분야에서 최근 수집된 공고입니다.
                </p>

                <div className="space-y-5">
                    {notices.map((notice) => (
                        <Link
                            key={notice.id}
                            href={`/notice/${notice.id}`}
                            className="block group border-l-2 border-gray-200 pl-4 hover:border-indigo-500 transition-colors"
                        >
                            <div className="text-[11px] text-gray-400 mb-1">
                                {notice.date_posted}
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 line-clamp-2 leading-snug">
                                {notice.title}
                            </h4>
                            <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-200">
                                {notice.department || '법원'}
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-center">
                    <Link
                        href="/rss.xml"
                        target="_blank"
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5"
                    >
                        <span>검수된 편집 글 RSS 보기</span>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6.18,15.64A2.18,2.18,0,0,1,8.36,17.82,2.18,2.18,0,0,1,6.18,20,2.18,2.18,0,0,1,4,17.82,2.18,2.18,0,0,1,6.18,15.64ZM4,4.44A15.56,15.56,0,0,1,19.56,20h-2.83A12.73,12.73,0,0,0,4,7.27Zm0,5.66a9.9,9.9,0,0,1,9.9,9.9H11.07A7.07,7.07,0,0,0,4,12.93Z"></path>
                        </svg>
                    </Link>
                </div>
            </div>
        </aside>
    );
}
