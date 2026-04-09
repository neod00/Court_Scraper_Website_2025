import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/Badge';
import DownloadFiles from '@/components/DownloadFiles';
import ViewTracker from '@/components/ViewTracker';

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

    const categoryName = notice?.category === 'real_estate' ? '부동산' : (notice?.category === 'vehicle' ? '차량/동산' : '기타');
    const title = notice ? `${notice.title} | [${categoryName}] ${notice.department || ''}` : '공고 상세 정보';

    // Use AI summary for better SEO description if available
    const aiDesc = notice?.ai_summary ? notice.ai_summary.replace(/[*#\n]/g, ' ').substring(0, 200) + '...' : '';
    const description = aiDesc || (notice ? `${notice.title} - ${notice.department || ''} 관할 회생·파산 자산매각 공고 상세 정보입니다.` : '대법원 회생·파산 자산매각 공고 상세 정보입니다.');

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
        ...(!notice?.ai_summary ? { robots: { index: false, follow: true } } : {}),
    };
}

export default async function NoticeDetail({ params }: PageProps) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

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
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            공고 상세 정보
                        </h3>
                        <ViewTracker 
                            tableName="court_notices" 
                            idColumn="id" 
                            idValue={id} 
                            initialCount={notice.view_count || 0} 
                        />
                    </div>
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
                        <dt className="text-sm font-medium text-gray-500">관할법원</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {notice.department || '-'}
                        </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">매각기관</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {notice.sale_org || '-'}
                        </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">공고만료일</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {notice.expiry_date || '-'}
                        </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">전화번호</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {notice.phone || '-'}
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

            {/* AI Analysis Report Section */}
            {notice.ai_summary && (
                <article className="mt-8 relative overflow-hidden rounded-2xl border border-indigo-200/80 shadow-lg">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50 -z-10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/30 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl -z-10" />

                    {/* Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center gap-3">
                        <span className="text-2xl">📋</span>
                        <div>
                            <h2 className="text-lg font-bold text-white">공고 내용 요약</h2>
                            <p className="text-indigo-200 text-xs">첨부파일 기반 자동 정리</p>
                        </div>
                        <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                            AI 요약
                        </span>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8">
                        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed
                            prose-strong:text-gray-900 prose-strong:font-bold
                            prose-li:my-0.5
                            prose-p:my-2
                            prose-ul:my-2">
                            {notice.ai_summary.split('\n').map((line: string, idx: number) => {
                                const trimmed = line.trim();
                                if (!trimmed) return <br key={idx} />;

                                // Bold text handling (**text**)
                                const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
                                const rendered = parts.map((part: string, pIdx: number) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                                    }
                                    return part;
                                });

                                // List items
                                if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                                    return (
                                        <div key={idx} className="flex gap-2 my-1 pl-2">
                                            <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                                            <span>{rendered.slice(0).map((r: any, i: number) => typeof r === 'string' ? r.replace(/^[-•]\s*/, '') : r)}</span>
                                        </div>
                                    );
                                }

                                // Numbered items
                                if (/^\d+\./.test(trimmed)) {
                                    return (
                                        <div key={idx} className="flex gap-2 my-1.5">
                                            <span className="text-indigo-500 font-bold flex-shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
                                            <span>{rendered.map((r: any, i: number) => typeof r === 'string' ? r.replace(/^\d+\.\s*/, '') : r)}</span>
                                        </div>
                                    );
                                }

                                return <p key={idx} className="my-2">{rendered}</p>;
                            })}
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-6 pt-4 border-t border-indigo-100">
                            <p className="text-xs text-gray-400 flex items-start gap-1.5">
                                <span className="mt-0.5">ℹ️</span>
                                <span>
                                    본 요약은 AI가 첨부파일 원문을 기반으로 자동 정리한 참고 자료입니다.
                                    정확한 매각 조건은 반드시 원본 공고 및 첨부파일을 직접 확인하시기 바랍니다.
                                </span>
                            </p>
                        </div>
                    </div>
                </article>
            )}

            {/* Value-Add Checklist Section (오리지널 콘텐츠 강화용) */}
            <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">💡</span>
                    <h3 className="text-lg font-bold text-gray-900">입찰 전 필수 체크리스트</h3>
                </div>
                {notice.category === 'real_estate' ? (
                    <ul className="space-y-3 text-sm text-gray-700">
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 등기부등본 확인 (말소기준권리 및 인수되는 권리 파악)</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 현장 임장 (건축물 대장 불일치, 불법건축물 여부 등 확인)</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 점유자 확인 (대항력 있는 임차인, 유치권 등 명도 분쟁 요소)</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 시세 파악 (최근 실거래가 및 주변 부동산 호가 대조)</li>
                    </ul>
                ) : notice.category === 'vehicle' ? (
                    <ul className="space-y-3 text-sm text-gray-700">
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 자동차 등록원부 확인 (압류, 저당권 등 낙찰자 인수 조건)</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 보관소 방문 (현장 상태 점검, 방전 여부 및 부품 누락 확인)</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 사고 이력 확인 (카히스토리 조회로 뼈대 손상 등 체크)</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 체납 과태료 및 환경개선부담금 (지자체별 낙찰자 인수 여부 확인)</li>
                    </ul>
                ) : (
                    <ul className="space-y-3 text-sm text-gray-700">
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 매각물건명세서의 매각 조건 및 특이사항 꼼꼼히 확인</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 기각/취하/변경 절차가 진행 중인지 대법원 사이트 재확인</li>
                        <li className="flex items-start gap-2"><span className="text-green-500 font-bold">✓</span> 정확한 입찰 보증금 준비 (일반적으로 최저 매각가격의 10% 또는 지정 금액)</li>
                    </ul>
                )}
            </div>

            {/* Guide Link Banner - 내부 그물망 연동 (이탈률 방어) */}
            <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h3 className="text-sm font-bold text-indigo-900">잠깐, 아직 입찰 가이드를 안 읽어보셨나요?</h3>
                        <p className="text-xs text-gray-600 mt-0.5">실패 없는 투자를 위해 초보자용 가이드를 반드시 확인하세요.</p>
                    </div>
                </div>
                <Link
                    href={'/blog/beginner-guide-first-bid'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap w-full sm:w-auto justify-center"
                >
                    필독 가이드 바로가기 →
                </Link>
            </div>

            {/* Legal Disclaimer */}
            <div className="mb-8 px-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                    본 사이트에서 제공하는 정보는 대한민국 법원 대국민서비스에 공개된 공고문을 수집하여 제공하는 참고용 자료입니다. 이용자는 반드시 법원 사이트의 원본 공고문을 최종적으로 확인해야 하며, 제공 정보에 의존하여 발생한 어떠한 손실이나 법적 책임에 대해서도 서비스 제공자는 책임을 지지 않습니다.
                </p>
            </div>

            {/* JSON-LD Article Schema for SEO */}
            {notice.ai_summary && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Article',
                            headline: notice.title,
                            description: notice.ai_summary.replace(/[*#\n]/g, ' ').substring(0, 200),
                            datePublished: notice.date_posted,
                            author: {
                                '@type': 'Organization',
                                name: '로옥션(LawAuction)',
                                url: 'https://www.courtauction.site',
                            },
                            publisher: {
                                '@type': 'Organization',
                                name: '로옥션(LawAuction)',
                            },
                            mainEntityOfPage: {
                                '@type': 'WebPage',
                                '@id': `https://www.courtauction.site/notice/${notice.id}`,
                            },
                            articleSection: notice.category === 'real_estate' ? '부동산' : '차량/동산',
                            inLanguage: 'ko-KR',
                        })
                    }}
                />
            )}

            {/* Latest Notices for Internal Linking - AdSense Enhancement */}
            <div className="mt-12 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    🔗 최근 등록된 다른 공고
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* This list will be fetched in the component body above */}
                    {/* Adding simplified fetch logic for the other notices */}
                    {await (async () => {
                        const { data: others } = await supabase
                            .from('court_notices')
                            .select('id, title, date_posted, category')
                            .neq('id', notice.id)
                            .order('date_posted', { ascending: false })
                            .limit(6);

                        return others?.map((item) => (
                            <Link
                                key={item.id}
                                href={`/notice/${item.id}`}
                                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                            >
                                <div className="text-xs text-indigo-600 font-bold mb-1">
                                    {item.category === 'real_estate' ? '[부동산]' : '[차량/동산]'}
                                </div>
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                    {item.title}
                                </h4>
                                <div className="text-xs text-gray-500 mt-2">
                                    {item.date_posted}
                                </div>
                            </Link>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
}
