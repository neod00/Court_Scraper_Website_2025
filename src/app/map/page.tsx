import { createClient } from '@supabase/supabase-js';
import CourtMap from '@/components/CourtMap';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

// Supabase 클라이언트 생성
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 메타데이터
export const metadata = {
    title: '지역별 공고 지도 | 대법원 회생·파산 자산매각 공고',
    description:
        '전국 법원별 회생·파산 자산매각 공고를 지도에서 한눈에 확인하세요. 지역별 필터링과 클러스터링으로 원하는 지역의 공고를 쉽게 찾을 수 있습니다.',
    keywords: '법원경매, 자산매각, 지도, 지역별 공고, 부동산 경매, 회생 파산',
};

// 공고 데이터 가져오기 (서버 컴포넌트)
async function getNotices() {
    const { data, error } = await supabase
        .from('court_notices')
        .select('site_id, title, department, date_posted, category, expiry_date')
        .order('date_posted', { ascending: false });

    if (error) {
        console.error('Error fetching notices:', error);
        return [];
    }

    return data || [];
}

export default async function MapPage() {
    const notices = await getNotices();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow">
                {/* 페이지 헤더 */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center gap-2 text-sm text-indigo-200 mb-2">
                            <Link href="/" className="hover:text-white">
                                홈
                            </Link>
                            <span>/</span>
                            <span>지역별 공고 지도</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold">🗺️ 지역별 공고 지도</h1>
                        <p className="mt-2 text-indigo-100">
                            전국 법원별 회생·파산 자산매각 공고를 지도에서 한눈에 확인하세요.
                        </p>
                    </div>
                </div>

                {/* 안내 메시지 */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <span className="text-blue-500 text-xl">ℹ️</span>
                        <div className="text-sm text-blue-700">
                            <p className="font-medium">지도 사용 안내</p>
                            <ul className="mt-1 list-disc list-inside text-blue-600 space-y-1">
                                <li>
                                    <strong>지역 필터</strong>: 상단 버튼으로 원하는 지역만 필터링할 수 있습니다.
                                </li>
                                <li>
                                    <strong>마커 클릭</strong>: 법원 마커를 클릭하면 해당 법원의 공고 목록이 표시됩니다.
                                </li>
                                <li>
                                    <strong>클러스터</strong>: 가까운 법원들은 자동으로 그룹화되며, 확대하면 개별 마커가 나타납니다.
                                </li>
                                <li>
                                    <strong>공고 상세</strong>: 오른쪽 목록에서 공고를 클릭하면 상세 페이지로 이동합니다.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 지도 컴포넌트 */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    {notices.length > 0 ? (
                        <CourtMap notices={notices} />
                    ) : (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <div className="text-6xl mb-4">📭</div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">공고 데이터가 없습니다</h2>
                            <p className="text-gray-600">
                                아직 수집된 공고가 없거나 데이터를 불러오는 중 오류가 발생했습니다.
                            </p>
                            <Link
                                href="/"
                                className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                홈으로 돌아가기
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
