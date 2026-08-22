import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import {
    type WeeklyReport,
    hasEditorNote,
    isValidWeekSlug,
    weekLabel,
    columnTitle,
    columnAuthor,
    columnDate,
    columnExcerpt,
    columnParagraphs,
    parseJsonColumn,
    categoryLabel,
} from '@/lib/weeklyColumn';

export const revalidate = 3600;

const siteUrl = 'https://www.courtauction.site';

interface PageProps {
    params: Promise<{ week: string }>;
}

async function fetchReport(week: string): Promise<WeeklyReport | null> {
    if (!isValidWeekSlug(week)) return null;
    const { data } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('week_start', week)
        .maybeSingle();
    return (data as WeeklyReport) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { week } = await params;
    const report = await fetchReport(week);

    // 해석이 없는 주차는 색인하지 않는다 — 자동 집계만 있는 페이지는 색인 대상이 아니다.
    if (!report || !hasEditorNote(report)) {
        return {
            title: '주간 칼럼을 찾을 수 없습니다 | 로옥션',
            robots: { index: false, follow: true },
        };
    }

    const title = columnTitle(report);
    const description = columnExcerpt(report, 155) ||
        `${report.week_start} ~ ${report.week_end} 법원 회생·파산 자산매각 공고 집계와 편집자 해석.`;

    return {
        title: `${title} | 로옥션 주간 칼럼`,
        description,
        alternates: { canonical: `${siteUrl}/trend/${report.week_start}` },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/trend/${report.week_start}`,
            type: 'article',
            publishedTime: columnDate(report),
        },
    };
}

export default async function WeeklyColumnPage({ params }: PageProps) {
    const { week } = await params;
    const report = await fetchReport(week);

    if (!report || !hasEditorNote(report)) {
        notFound();
    }

    const title = columnTitle(report);
    const author = columnAuthor(report);
    const published = columnDate(report);
    const paragraphs = columnParagraphs(report);
    const categories = parseJsonColumn<Record<string, number>>(report.category_breakdown, {});
    const tags = parseJsonColumn<{ tag: string; count: number }[]>(report.trending_tags, []);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: columnExcerpt(report, 155),
        datePublished: published,
        dateModified: published,
        author: { '@type': 'Person', name: author.split('·')[0].trim() },
        publisher: { '@type': 'Organization', name: '로옥션(LawAuction)' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/trend/${report.week_start}` },
    };

    return (
        <article className="max-w-3xl mx-auto px-4 py-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/trend" className="hover:text-indigo-600">주간 통계</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">{weekLabel(report)}</span>
            </nav>

            <header className="mb-10 pb-8 border-b border-gray-200">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                    주간 데이터 칼럼
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-4 mb-4 leading-tight tracking-tight">
                    {title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{author}</span>
                    <span>{published}</span>
                    <span>집계 기간 {report.week_start} ~ {report.week_end}</span>
                </div>
            </header>

            {/* 이번 주 집계 수치 */}
            <section className="mb-10 bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-gray-500 mb-4">이번 주 집계</h2>
                <div className="flex flex-wrap gap-x-10 gap-y-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">수집 공고</p>
                        <p className="text-2xl font-extrabold text-gray-900">
                            {report.total_notices ?? 0}<span className="text-sm font-normal text-gray-500 ml-0.5">건</span>
                        </p>
                    </div>
                    {report.top_department && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1">최다 공고 법원</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">{report.top_department}</p>
                        </div>
                    )}
                </div>
                {Object.keys(categories).length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-200 flex flex-wrap gap-2">
                        {Object.entries(categories).map(([cat, count]) => (
                            <span key={cat} className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
                                {categoryLabel(cat)} <span className="font-bold text-gray-900">{count}</span>건
                            </span>
                        ))}
                    </div>
                )}
            </section>

            {/* 편집자 해석 */}
            <section className="prose-none">
                <h2 className="text-xl font-bold text-gray-900 mb-4">편집자 노트</h2>
                <div className="space-y-5 text-[15px] leading-8 text-gray-700">
                    {paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
            </section>

            {tags.length > 0 && (
                <section className="mt-10 pt-8 border-t border-gray-100">
                    <h2 className="text-sm font-bold text-gray-500 mb-3">이번 주 자주 등장한 키워드</h2>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((item) => (
                            <Link
                                key={item.tag}
                                href={`/?q=${encodeURIComponent(item.tag)}`}
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                            >
                                <span className="text-indigo-400">#</span>
                                {item.tag}
                                <span className="text-[10px] text-gray-400 font-bold">{item.count}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 집계 기준 */}
            <section className="mt-10 bg-white border border-gray-200 rounded-xl p-6 text-sm leading-7 text-gray-600">
                <h2 className="font-bold text-gray-900 mb-3">이 수치를 읽는 방법</h2>
                <p>수집 건수는 해당 주간에 로옥션이 수집한 공고를 기준으로 집계했습니다. 분류와 법원 표기는 원문에 따라 달라질 수 있고, 정정·재공고로 실제 건수와 차이가 날 수 있습니다.</p>
                <p className="mt-2">가격 적정성이나 권리관계를 판단한 결과가 아니며, 입찰 결과(낙찰 여부·낙찰가)는 수집 대상이 아닙니다. 참여 전 원문 공고와 첨부문서를 반드시 확인하세요.</p>
                <p className="mt-3">
                    <Link href="/editorial-policy" className="font-semibold text-indigo-700 underline">데이터·편집 원칙 자세히 보기</Link>
                </p>
            </section>

            <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/trend" className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm">
                    지난 주간 칼럼 보기
                </Link>
                <Link href="/datalab" className="bg-white text-gray-700 font-bold px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                    데이터랩 통계
                </Link>
            </div>
        </article>
    );
}
