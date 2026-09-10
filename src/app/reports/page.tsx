import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    getPublishedReports,
    reportTitle,
    reportAuthor,
    reportExcerpt,
    publishedDate,
    formatCount,
} from '@/lib/monthlyReport';

const siteUrl = 'https://www.courtauction.site';

const hubDescription =
    '로옥션이 매달 수집한 법원 회생·파산 자산매각 공고를 법원·자산 유형·최저매각가·입찰 일정 기준으로 집계하고, 편집자 노트를 더한 월간 리포트입니다.';

export function generateMetadata(): Metadata {
    const reports = getPublishedReports();

    // 발행된 리포트가 하나도 없으면 빈 허브를 내보내지 않는다 (페이지도 notFound 처리).
    if (reports.length === 0) {
        return {
            title: '월간 리포트',
            robots: { index: false, follow: true },
        };
    }

    // 브랜드 접미사는 layout.tsx 의 title 템플릿(%s | 로옥션)이 붙인다 — 여기서 중복 지정하지 않는다.
    return {
        title: '월간 리포트 | 법원 회생·파산 자산매각 공고 월별 집계',
        description: hubDescription,
        alternates: { canonical: `${siteUrl}/reports` },
        openGraph: {
            title: '월간 리포트',
            description: hubDescription,
            url: `${siteUrl}/reports`,
            type: 'website',
        },
    };
}

export default function ReportsHubPage() {
    const reports = getPublishedReports();
    if (reports.length === 0) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '월간 리포트',
        description: hubDescription,
        url: `${siteUrl}/reports`,
        inLanguage: 'ko-KR',
        publisher: { '@type': 'Organization', name: '로옥션(LawAuction)' },
        hasPart: reports.map((report) => ({
            '@type': 'Article',
            headline: reportTitle(report),
            url: `${siteUrl}/reports/${report.month}`,
            datePublished: report.published_at,
        })),
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">월간 리포트</span>
            </nav>

            <header className="mb-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
                    월간 리포트
                </h1>
                <p className="text-gray-600 leading-relaxed text-[15px] max-w-2xl">
                    로옥션이 한 달 동안 수집한 법원 회생·파산 자산매각 공고를 법원, 자산 유형, 최저매각가, 입찰 일정 기준으로
                    집계합니다. 집계 수치는 집계 기준일에 고정하고, 그 달의 편집자 노트를 붙여 발행합니다.
                </p>
            </header>

            <section className="mb-12" aria-labelledby="reports-list-heading">
                <h2 id="reports-list-heading" className="text-sm font-bold text-gray-500 mb-4">
                    발행된 리포트 {reports.length}편
                </h2>
                <div className="space-y-4">
                    {reports.map((report) => {
                        const topCourt = report.courts.top[0];
                        return (
                            <article
                                key={report.month}
                                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-300 transition-colors"
                            >
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                                    <span className="inline-flex items-center bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                                        {report.month_label}
                                    </span>
                                    <span>대상 기간 {report.period.start} ~ {report.period.end}</span>
                                    <span>발행일 {publishedDate(report)}</span>
                                    <span>{reportAuthor(report)}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-2">
                                    <Link href={`/reports/${report.month}`} className="hover:text-indigo-700">
                                        {reportTitle(report)}
                                    </Link>
                                </h3>
                                <p className="text-sm text-gray-600 leading-7 mb-3">{reportExcerpt(report, 160)}</p>
                                <p className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                                    <span>수집 공고 {formatCount(report.totals.n)}건</span>
                                    <span>최저매각가 기재 {formatCount(report.price.priced_n)}건({report.price.pct}%)</span>
                                    {topCourt && <span>최다 공고 법원 {topCourt.name} {formatCount(topCourt.n)}건</span>}
                                </p>
                                <Link
                                    href={`/reports/${report.month}`}
                                    className="inline-block mt-4 text-sm font-semibold text-indigo-700 hover:underline"
                                >
                                    리포트 읽기
                                </Link>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className="mb-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-sm leading-7 text-gray-700" aria-labelledby="method-heading">
                <h2 id="method-heading" className="font-bold text-gray-900 text-base mb-3">집계 방법과 한계</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>대상은 대한민국 법원 대국민서비스에 게시된 회생·파산 자산매각 공고 가운데 로옥션이 수집한 건이며, 게시일이 그 달에 속하는 공고를 셉니다. 정정·재공고는 별건으로 세어 실제 물건 수보다 많을 수 있습니다.</li>
                    <li>수치는 집계 기준일에 고정합니다. 기준일 이후 수집된 공고나 정정은 반영하지 않습니다.</li>
                    <li>자산 유형은 제목과 요약의 키워드로 자동 분류한 8종입니다. 원문의 성격과 다를 수 있습니다.</li>
                    <li>금액은 공고에 기재된 최저매각가만 사용하고, 기재된 건수와 비율을 함께 적습니다. 극단값에 흔들리는 합계·평균은 싣지 않습니다.</li>
                    <li>사건 묶음은 제목에 적힌 사건번호로만 셉니다. 법원마다 제목 관행이 달라 사건번호가 없는 공고는 묶지 못합니다.</li>
                    <li>공고 요약은 첨부문서에서 AI가 추출한 것이며, 추출에 실패한 비율을 리포트마다 표기합니다. 입찰 결과(매수인·매수 금액)와 감정평가액은 수집하지 않습니다.</li>
                    <li>편집자 노트는 운영자가 집계를 읽고 쓴 해석입니다. 초안 작성에 AI를 보조로 쓰더라도 발행 전에 운영자가 사실을 확인합니다.</li>
                </ul>
            </section>

            <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/trend" className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm">
                    주간 데이터 칼럼
                </Link>
                <Link href="/datalab" className="bg-white text-gray-700 font-bold px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                    데이터랩 통계
                </Link>
            </div>

            <p className="text-xs text-gray-500 leading-6">
                이 리포트는 공고 집계와 편집자의 해석이며, 개별 공고의 내용과 조건은 원문에서 확인해야 합니다.{' '}
                <Link href="/editorial-policy" className="underline hover:text-indigo-700">데이터·편집 원칙</Link>
            </p>
        </div>
    );
}
