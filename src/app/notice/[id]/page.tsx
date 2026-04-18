import { supabase } from '@/lib/supabase';
import { permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/Badge';
import DownloadFiles from '@/components/DownloadFiles';
import ViewTracker from '@/components/ViewTracker';
import Breadcrumbs from '@/components/Breadcrumbs';
import NoticeFAQ from '@/components/NoticeFAQ';
import NoticeHero from '@/components/NoticeHero';
import RelatedNoticesRSS from '@/components/RelatedNoticesRSS';
import CourtCostCalculator from '@/components/CourtCostCalculator';
import { getRecentPosts } from '@/data/blog-posts';
import { glossaryTerms } from '@/data/glossary';

// Revalidate every hour
export const revalidate = 3600;

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const { data: notice } = await supabase
        .from('court_notices')
        .select('title, category, department, ai_summary')
        .eq('id', id)
        .single();

    if (!notice) {
        return {
            title: '종료되거나 삭제된 공고 | 로옥션(LawAuction)',
            description: '요청하신 법원 경매/공매 공고는 종료되었거나 삭제되었습니다. 홈에서 최신 공고를 확인해보세요.',
            robots: { index: false, follow: true },
        };
    }

    const categoryName = notice.category === 'real_estate' ? '부동산' : (notice.category === 'vehicle' ? '차량/동산' : '기타');
    const title = `${notice.title} | [${categoryName}] ${notice.department || ''}`;

    // Use AI summary for better SEO description if available
    const aiDesc = notice.ai_summary ? notice.ai_summary.replace(/[*#\n]/g, ' ').substring(0, 200) + '...' : '';
    const description = aiDesc || `${notice.title} - ${notice.department || ''} 관할 회생·파산 자산매각 공고 상세 정보입니다.`;

    const siteUrl = 'https://www.courtauction.site';

    return {
        title,
        description,
        alternates: {
            canonical: `${siteUrl}/notice/${id}`,
        },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/notice/${id}`,
        },
        // noindex pages without AI summary to prevent thin content indexing
        ...(!notice.ai_summary ? { robots: { index: false, follow: true } } : {}),
    };
}

export default async function NoticeDetail({ params }: PageProps) {
    const { id } = await params;

    if (!id) {
        permanentRedirect('/');
    }

    const { data: notice, error } = await supabase
        .from('court_notices')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !notice) {
        console.error('Error fetching notice:', error);
        permanentRedirect('/');
    }

    // Helpers
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
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
            <Breadcrumbs 
                items={[
                    { label: '공고 검색', href: '/' },
                    { label: getCategoryName(notice.category), href: `/category/${notice.category}` },
                    { label: notice.title, href: `/notice/${notice.id}` }
                ]} 
            />
            
            <NoticeHero notice={{
                title: notice.title,
                category: notice.category,
                court_name: notice.court_name || notice.department || '대한민국 법원',
                date_posted: notice.date_posted,
                department: notice.department
            }} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white shadow-soft rounded-2xl overflow-hidden border border-gray-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                📌 상세 제원 및 정보
                                <ViewTracker
                                    tableName="court_notices"
                                    idColumn="id"
                                    idValue={id}
                                    initialCount={notice.view_count || 0}
                                />
                            </h3>
                            <Link href="/" className="text-sm font-bold text-indigo-600 hover:underline">목록보기</Link>
                        </div>
                        <div className="p-6">
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="border-b border-gray-100 pb-2">
                                    <dt className="text-gray-500 font-medium mb-1">관리번호</dt>
                                    <dd className="text-gray-900 font-mono">{notice.site_id}</dd>
                                </div>
                                <div className="border-b border-gray-100 pb-2">
                                    <dt className="text-gray-500 font-medium mb-1">공고일자</dt>
                                    <dd className="text-gray-900">{notice.date_posted}</dd>
                                </div>
                                <div className="border-b border-gray-100 pb-2">
                                    <dt className="text-gray-500 font-medium mb-1">관할부서</dt>
                                    <dd className="text-gray-900">{notice.department || '-'}</dd>
                                </div>
                                <div className="border-b border-gray-100 pb-2">
                                    <dt className="text-gray-500 font-medium mb-1">매각기관</dt>
                                    <dd className="text-gray-900">{notice.sale_org || '-'}</dd>
                                </div>
                                <div className="border-b border-gray-100 pb-2">
                                    <dt className="text-gray-500 font-medium mb-1">연락처</dt>
                                    <dd className="text-gray-900">{notice.phone || '-'}</dd>
                                </div>
                                <div className="border-b border-gray-100 pb-2">
                                    <dt className="text-gray-500 font-medium mb-1">원본 출처</dt>
                                    <dd><a href={notice.detail_link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-900 underline font-bold">법원 바로가기 ↗</a></dd>
                                </div>
                            </dl>
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <dt className="text-gray-500 font-medium mb-2">첨부파일</dt>
                                <DownloadFiles fileInfo={notice.file_info} />
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis Report Section */}
                    {notice.ai_summary && (
                        <article className="relative overflow-hidden rounded-2xl border border-indigo-200/80 shadow-lg bg-white">
                            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📋</span>
                                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">AI Assessment Report</h2>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 backdrop-blur-sm">PRO VERSION v2</span>
                            </div>

                            <div className="p-6 md:p-8">
                                <div className="prose prose-indigo max-w-none text-gray-700 leading-[1.8]
                                    prose-strong:text-indigo-900 prose-strong:font-bold
                                    prose-p:my-4 prose-li:my-1">
                                    {(() => {
                                        const linkify = (content: any[]) => {
                                            return content.map((part, pIdx) => {
                                                if (typeof part !== 'string') return part;
                                                let segments: (string | React.ReactNode)[] = [part];
                                                const sortedTerms = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length);
                                                for (const item of sortedTerms) {
                                                    const newSegments: (string | React.ReactNode)[] = [];
                                                    for (const seg of segments) {
                                                        if (typeof seg !== 'string') { newSegments.push(seg); continue; }
                                                        const parts = seg.split(new RegExp(`(${item.term})`, 'g'));
                                                        parts.forEach((p, i) => {
                                                            if (p === item.term) {
                                                                newSegments.push(
                                                                    <Link key={`${pIdx}-${item.slug}-${i}`} href={`/glossary/${item.slug}`} className="text-indigo-600 font-medium border-b border-dotted border-indigo-300 hover:bg-indigo-50 transition-colors" title={item.shortDescription}>{p}</Link>
                                                                );
                                                            } else if (p) { newSegments.push(p); }
                                                        });
                                                    }
                                                    segments = newSegments;
                                                }
                                                return segments;
                                            });
                                        };

                                        return notice.ai_summary.split('\n').map((line: string, idx: number) => {
                                            const trimmed = line.trim();
                                            if (!trimmed) return <br key={idx} />;
                                            const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
                                            const rendered = parts.map((part: string, pIdx: number) => {
                                                if (part.startsWith('**') && part.endsWith('**')) return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                                                return part;
                                            });
                                            const linkedRendered = linkify(rendered);
                                            if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                                                return (
                                                    <div key={idx} className="flex gap-2 my-1 pl-2">
                                                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                                                        <span>{linkedRendered.map((r: any) => typeof r === 'string' ? r.replace(/^[-•]\s*/, '') : r)}</span>
                                                    </div>
                                                );
                                            }
                                            if (/^\d+\./.test(trimmed)) {
                                                return (
                                                    <div key={idx} className="flex gap-2 my-1.5 font-medium">
                                                        <span className="text-indigo-600 flex-shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
                                                        <span>{linkedRendered.map((r: any) => typeof r === 'string' ? r.replace(/^\d+\.\s*/, '') : r)}</span>
                                                    </div>
                                                );
                                            }
                                            return <p key={idx} className="my-2">{linkedRendered}</p>;
                                        });
                                    })()}
                                </div>
                                <div className="mt-8 pt-4 border-t border-gray-100">
                                    <details className="cursor-pointer group">
                                        <summary className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-600 transition-colors">Data Verification Sources</summary>
                                        <ul className="list-disc pl-5 mt-3 space-y-1 text-xs text-gray-500 font-medium">
                                            <li>대한민국 법원 법원경매정보 (Official Public Data)</li>
                                            <li>국토교통부 실거래가 공개시스템 API</li>
                                            <li>본 보고서는 법원 공고문을 법률 특화 AI 모델로 분석한 요약본이며, 최종 결정 전 전문가의 자문을 권장합니다.</li>
                                        </ul>
                                    </details>
                                </div>
                            </div>
                        </article>
                    )}

                    <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <img src="https://ui-avatars.com/api/?name=Ed&background=0D8ABC&color=fff" alt="Editor" className="w-10 h-10 rounded-full shadow-sm" />
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 text-indigo-900">로옥션 수석 에디터 코멘트</h3>
                                <p className="text-xs text-gray-500">{getCategoryName(notice.category)} 분야 전문 리포트</p>
                            </div>
                        </div>
                        <p className="text-indigo-950 text-sm leading-relaxed mt-2 italic font-medium">
                            {notice.category === 'real_estate' 
                                ? `"대법원 부동산 매각공고는 일반 경매보다 경쟁이 덜해 시세 차익을 남기기 좋은 기회입니다. 다만 권리 분석 시 비등기 권리 파약이 핵심이므로 반드시 입찰 전 현장 임장과 서류 대조를 병행하십시오."`
                                : `"동산 및 차량 매각은 물리적 상태 파악이 수익률의 핵심입니다. 공고문의 상태 표기만 믿지 말고 보관소 방문을 적극 권장합니다."`}
                        </p>
                    </div>

                    <div id="calculator"><CourtCostCalculator category={notice.category} /></div>

                    {/* FAQ & Social Proof */}
                    <NoticeFAQ notice={{
                        title: notice.title,
                        category: notice.category || '기타',
                        court_name: notice.court_name || notice.department || '대한민국 법원',
                        date_posted: notice.date_posted || ''
                    }} />

                    {/* Internal Engagement */}
                    <div className="mt-12 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-soft">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">🌟 로옥션 핵심 투자 인사이트</h3>
                        </div>
                        <div className="p-6">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {getRecentPosts(4).map((post) => (
                                    <li key={post.slug}>
                                        <Link href={`/blog/${post.slug}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 font-medium transition-colors p-2 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100">
                                            <span className="text-indigo-400">#</span>
                                            {post.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sidebar area */}
                <div className="space-y-8 sticky top-6">
                    <RelatedNoticesRSS 
                        currentId={notice.id} 
                        category={notice.category} 
                        courtName={notice.court_name || notice.department} 
                    />
                    
                    <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="font-bold text-lg mb-2 tracking-tight">💰 수익률 시뮬레이션</h4>
                        <p className="text-xs text-indigo-100 mb-6 leading-relaxed">
                            매입 자금 조달부터 명도 비용까지, 투자 계획을 미리 세워보세요. 1분이면 충분합니다.
                        </p>
                        <a href="#calculator" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all shadow-md group">
                            계산기로 이동
                            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </a>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
                        <h4 className="text-sm font-bold text-gray-900 mb-4">📢 공고 원본 필수 확인</h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                            본 프로그램으로 제공되는 정보는 참고용이며, 최종적인 법적 책임은 이용자에게 있습니다. 입찰 전 법원 사이트의 <span className="font-bold text-red-500">원본 매각공고</span>를 반드시 재확인하시기 바랍니다.
                        </p>
                        <a href={notice.detail_link} target="_blank" className="block w-full text-center py-2.5 bg-gray-100 rounded-xl text-[11px] font-bold text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200">
                             원본 법원 공고 열기 &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
