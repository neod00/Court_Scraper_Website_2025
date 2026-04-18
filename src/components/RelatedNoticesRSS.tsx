import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface RelatedNoticesRSSProps {
    currentId: string;
    category: string;
    courtName: string;
}

export default async function RelatedNoticesRSS({ currentId, category, courtName }: RelatedNoticesRSSProps) {
    // Fetch related notices via direct DB query (mimicking RSS logic)
    const { data: notices } = await supabase
        .from('court_notices')
        .select('id, title, date_posted, category, department')
        .eq('source_type', 'notice')
        .eq('category', category)
        .neq('id', currentId)
        .order('date_posted', { ascending: false })
        .limit(5);

    if (!notices || notices.length === 0) return null;

    return (
        <aside className="mt-12 bg-gray-900 text-white rounded-2xl overflow-hidden shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <h3 className="font-bold text-sm tracking-wider uppercase">Live Asset Feed</h3>
                </div>
                <div className="text-[10px] font-mono opacity-80">
                    RSS XML Ver. 2.0
                </div>
            </div>

            <div className="p-6">
                <p className="text-gray-400 text-xs mb-4 flex items-center gap-2">
                    <span>📡</span>
                    지금 보고 계시는 <span className="text-white font-bold">{category === 'real_estate' ? '부동산' : '차량/동산'}</span> 분야의 실시간 신규 매각 매물입니다.
                </p>
                
                <div className="space-y-6">
                    {notices.map((notice) => (
                        <Link 
                            key={notice.id} 
                            href={`/notice/${notice.id}`}
                            className="block group border-l-2 border-gray-700 pl-4 hover:border-orange-500 transition-colors"
                        >
                            <div className="text-[10px] text-gray-500 font-mono mb-1 flex items-center justify-between">
                                <span>{notice.date_posted}</span>
                                <span className="group-hover:text-orange-500 transition-colors">READ MORE &rarr;</span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-white line-clamp-2 leading-snug">
                                {notice.title}
                            </h4>
                            <div className="mt-2 text-[10px] text-gray-400 bg-white/5 inline-block px-2 py-0.5 rounded border border-white/10 uppercase tracking-tighter">
                                {notice.department || '법원'}
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-800 flex justify-center">
                    <Link 
                        href="/rss.xml" 
                        target="_blank"
                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5"
                    >
                        <span>XML Feed 구독하기</span>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6.18,15.64A2.18,2.18,0,0,1,8.36,17.82,2.18,2.18,0,0,1,6.18,20,2.18,2.18,0,0,1,4,17.82,2.18,2.18,0,0,1,6.18,15.64ZM4,4.44A15.56,15.56,0,0,1,19.56,20h-2.83A12.73,12.73,0,0,0,4,7.27Zm0,5.66a9.9,9.9,0,0,1,9.9,9.9H11.07A7.07,7.07,0,0,0,4,12.93Z"></path>
                        </svg>
                    </Link>
                </div>
            </div>
        </aside>
    );
}
