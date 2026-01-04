import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/Badge';
import DownloadFiles from '@/components/DownloadFiles';

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
        .select('title, category, department')
        .eq('id', id)
        .single();

    const categoryName = notice?.category === 'real_estate' ? '부동산' : (notice?.category === 'vehicle' ? '차량/동산' : '기타');
    const title = notice ? `${notice.title} | [${categoryName}] ${notice.department || ''}` : '공고 상세 정보';
    const description = notice ? `${notice.title} - ${notice.department || ''} 관할 회생·파산 자산매각 공고 상세 정보입니다.` : '대법원 회생·파산 자산매각 공고 상세 정보입니다.';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
        }
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

            {/* Bidding Guide Section - Enhanced Content for AdSense */}
            <div className="mt-8 bg-indigo-50 rounded-lg p-6 border border-indigo-100 mb-8">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    📊 회생·파산 자산 입찰 가이드 및 주의사항
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 leading-relaxed">
                    <div>
                        <h4 className="font-bold text-indigo-800 mb-2">1. 입찰 전 필수 체크리스트</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>현장 답사 권장</strong>: 공고문의 사진과 실제 현장 상태가 다를 수 있습니다. 반드시 현장을 방문하여 보존 상태를 확인하세요.</li>
                            <li><strong>등기사항증명서 확인</strong>: 매각 물건의 권리 관계(근저당, 가압류 등)를 대법원 인터넷등기소를 통해 직접 열람하여 최종 확인하시기 바랍니다.</li>
                            <li><strong>체납 관리비/공과금</strong>: 부동산의 경우 체납된 관리비나 공과금의 승계 여부를 관리사무소 등을 통해 미리 파악해야 합니다.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-800 mb-2">2. 입찰 당일 준비사항</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>준비물</strong>: 본인 신분증, 도장(사인 가능 여부 확인 필요), 입찰보증금(통상 최저매각가격의 10%)을 준비하세요.</li>
                            <li><strong>대리 입찰 시</strong>: 인감증명서가 첨부된 위임장과 대리인의 신분증이 추가로 필요합니다.</li>
                            <li><strong>시간 엄수</strong>: 입찰 마감 시간 이후에는 서류 제출이 절대 불가하므로 최소 30분 전 도착을 권장합니다.</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-indigo-200">
                    <h4 className="font-bold text-indigo-800 mb-2">3. 법적 고지 및 면책 조항</h4>
                    <p className="text-xs text-gray-600">
                        본 사이트에서 제공하는 정보는 대한민국 법원 대국민서비스에 공개된 공고문을 수집하여 제공하는 참고용 자료입니다. 정보의 입력 시점과 열람 시점 간의 차이로 인해 최신 정보와 다를 수 있으며, 오기입 또는 누락이 있을 수 있습니다. 이용자는 반드시 법원 사이트의 원본 공고문과 비치된 관련 서류(매각물건명세서 등)를 최종적으로 확인해야 하며, 본 서비스 제공 정보에 의존하여 발생한 어떠한 투자 손실이나 법적 책임에 대해서도 서비스 제공자는 책임을 지지 않습니다.
                    </p>
                </div>
            </div>

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
