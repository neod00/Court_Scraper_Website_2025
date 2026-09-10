import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    type MonthlyReport,
    type CourtStat,
    getPublishedReports,
    getReport,
    isPublishable,
    reportTitle,
    reportAuthor,
    reportExcerpt,
    reportParagraphs,
    publishedDate,
    formatWon,
    formatCount,
    formatSigned,
    MIN_EDITOR_NOTE_LENGTH,
} from '@/lib/monthlyReport';

// 데이터는 빌드에 포함된 JSON뿐이라 요청 시 재집계가 없다. 발행되지 않은 달은 notFound 로 떨어진다.
export const dynamicParams = true;

const siteUrl = 'https://www.courtauction.site';

interface PageProps {
    params: Promise<{ month: string }>;
}

export function generateStaticParams() {
    return getPublishedReports().map((report) => ({ month: report.month }));
}

/** 발행된 리포트 중 이 달의 직전·직후 달. */
function adjacentReports(month: string): { prev: MonthlyReport | null; next: MonthlyReport | null } {
    const ascending = [...getPublishedReports()].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
    const idx = ascending.findIndex((r) => r.month === month);
    if (idx === -1) return { prev: null, next: null };
    return {
        prev: idx > 0 ? ascending[idx - 1] : null,
        next: idx < ascending.length - 1 ? ascending[idx + 1] : null,
    };
}

function rankChange(court: CourtStat): string {
    if (court.prev_rank === null || court.prev_rank === undefined) return '전월 집계 없음';
    const delta = court.prev_rank - court.rank;
    if (delta === 0) return '변동 없음';
    return delta > 0 ? `${delta}계단 상승` : `${Math.abs(delta)}계단 하락`;
}

function signedPct(pct: number | null): string {
    if (pct === null || !Number.isFinite(pct)) return '';
    return `${pct > 0 ? '+' : ''}${pct}%`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { month } = await params;
    const report = getReport(month);

    // 편집자 노트가 없거나 발행 처리되지 않은 달은 색인하지 않는다 — 자동 집계만 있는 페이지는 색인 대상이 아니다.
    if (!report || !isPublishable(report)) {
        return {
            title: '월간 리포트를 찾을 수 없습니다',
            robots: { index: false, follow: true },
        };
    }

    const title = reportTitle(report);
    const description =
        reportExcerpt(report, 155) ||
        `${report.period.start} ~ ${report.period.end} 법원 회생·파산 자산매각 공고 ${formatCount(report.totals.n)}건의 법원별·자산 유형별·최저매각가 집계와 편집자 노트.`;
    const url = `${siteUrl}/reports/${report.month}`;

    // 브랜드 접미사는 layout.tsx 의 title 템플릿(%s | 로옥션)이 붙인다.
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'article',
            publishedTime: report.published_at ?? undefined,
        },
        twitter: { card: 'summary', title, description },
    };
}

export default async function MonthlyReportPage({ params }: PageProps) {
    const { month } = await params;
    const report = getReport(month);

    if (!report || !isPublishable(report)) {
        notFound();
    }

    const { prev, next } = adjacentReports(report.month);

    const title = reportTitle(report);
    const author = reportAuthor(report);
    const published = publishedDate(report);
    const paragraphs = reportParagraphs(report);
    const { totals, courts, categories, price, schedule, cases, notable, data_quality: quality } = report;
    const url = `${siteUrl}/reports/${report.month}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': ['Article', 'Report'],
        headline: title,
        description: reportExcerpt(report, 155),
        datePublished: report.published_at,
        dateModified: report.published_at,
        temporalCoverage: `${report.period.start}/${report.period.end}`,
        inLanguage: 'ko-KR',
        author:
            author === '로옥션'
                ? { '@type': 'Organization', name: '로옥션(LawAuction)', url: siteUrl }
                : { '@type': 'Person', name: author.split('·')[0].trim() },
        publisher: { '@type': 'Organization', name: '로옥션(LawAuction)', url: siteUrl },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        isPartOf: { '@type': 'CollectionPage', name: '월간 리포트', url: `${siteUrl}/reports` },
    };

    const sectionHeading = 'text-xl font-bold text-gray-900 mb-3';
    const tableWrap = 'overflow-x-auto rounded-xl border border-gray-200';
    const table = 'w-full text-sm text-left';
    const th = 'bg-gray-50 text-gray-500 font-semibold px-4 py-2.5 whitespace-nowrap';
    const td = 'px-4 py-2.5 border-t border-gray-100 whitespace-nowrap';
    const tdNum = `${td} text-right tabular-nums`;

    return (
        <article className="max-w-3xl mx-auto px-4 py-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-indigo-600">홈</Link>
                <span>/</span>
                <Link href="/reports" className="hover:text-indigo-600">월간 리포트</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">{report.month_label}</span>
            </nav>

            <header className="mb-10 pb-8 border-b border-gray-200">
                <span className="inline-flex items-center bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                    월간 리포트
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-4 mb-5 leading-tight tracking-tight">
                    {title}
                </h1>
                {/* 세 날짜는 성격이 다르므로 항상 따로 적는다: 대상 기간 / 집계 기준일 / 발행일 */}
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <div>
                        <dt className="text-xs text-gray-500">대상 기간</dt>
                        <dd className="font-medium text-gray-800">{report.period.start} ~ {report.period.end}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">집계 기준일</dt>
                        <dd className="font-medium text-gray-800">{report.snapshot_date}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-gray-500">발행일</dt>
                        <dd className="font-medium text-gray-800">{published} · {author}</dd>
                    </div>
                </dl>
            </header>

            {/* 1. 한눈에 */}
            <section className="mb-12" aria-labelledby="sec-overview">
                <h2 id="sec-overview" className={sectionHeading}>1. 한눈에</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                        <p className="text-xs text-gray-500 mb-1">수집 공고</p>
                        <p className="text-2xl font-extrabold text-gray-900">
                            {formatCount(totals.n)}<span className="text-sm font-normal text-gray-500 ml-0.5">건</span>
                        </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                        <p className="text-xs text-gray-500 mb-1">전월 대비</p>
                        {totals.prev_comparable ? (
                            <>
                                <p className="text-2xl font-extrabold text-gray-900">
                                    {formatSigned(totals.diff)}<span className="text-sm font-normal text-gray-500 ml-0.5">건</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {signedPct(totals.diff_pct)} · 전월 {formatCount(totals.prev_month_n)}건
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-lg font-bold text-gray-700 mt-1">비교하지 않음</p>
                                <p className="text-xs text-gray-500 mt-1">수집이 안정된 첫 달이라 전월 수치가 불완전합니다</p>
                            </>
                        )}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                        <p className="text-xs text-gray-500 mb-1">주당 평균</p>
                        <p className="text-2xl font-extrabold text-gray-900">
                            {totals.weekly_avg}<span className="text-sm font-normal text-gray-500 ml-0.5">건</span>
                        </p>
                    </div>
                </div>
                {totals.weekly_counts.length > 0 && (
                    <div className={tableWrap}>
                        <table className={table}>
                            <caption className="sr-only">주별 수집 공고 건수</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={th}>주(월요일 시작)</th>
                                    <th scope="col" className={th}>기간</th>
                                    <th scope="col" className={`${th} text-right`}>건수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {totals.weekly_counts.map((w) => (
                                    <tr key={w.week_start}>
                                        <td className={`${td} font-medium text-gray-800`}>
                                            {w.week_start}
                                            {w.partial && (
                                                <span className="ml-2 text-[11px] text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">달 경계에 걸친 주</span>
                                            )}
                                        </td>
                                        <td className={`${td} text-gray-600`}>{w.week_start} ~ {w.week_end}</td>
                                        <td className={tdNum}>{formatCount(w.n)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-2 leading-5">
                    달 경계에 걸친 주는 이 달에 게시된 공고만 센 값이라 실제 주간 건수보다 적습니다.
                    주당 평균은 월 건수를 (일수 ÷ 7)로 나눈 값이라 위 표의 주별 건수를 단순 평균한 값과 다릅니다.
                </p>
            </section>

            {/* 2. 법원별 */}
            <section className="mb-12" aria-labelledby="sec-courts">
                <h2 id="sec-courts" className={sectionHeading}>2. 법원별 분포</h2>
                <p className="text-sm text-gray-600 leading-7 mb-4">
                    공고를 게시한 법원 {formatCount(courts.distinct_n)}곳 가운데 건수 상위 {courts.top.length}곳입니다. 순위 변화는 전월 집계 순위와 비교한 값입니다.
                </p>
                <div className={tableWrap}>
                    <table className={table}>
                        <caption className="sr-only">법원별 공고 건수와 전월 비교</caption>
                        <thead>
                            <tr>
                                <th scope="col" className={`${th} text-right`}>순위</th>
                                <th scope="col" className={th}>법원</th>
                                <th scope="col" className={`${th} text-right`}>건수</th>
                                <th scope="col" className={`${th} text-right`}>비중</th>
                                <th scope="col" className={`${th} text-right`}>전월 건수</th>
                                <th scope="col" className={th}>순위 변화</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courts.top.map((c) => (
                                <tr key={c.name}>
                                    <td className={tdNum}>{c.rank}</td>
                                    <td className={`${td} font-medium text-gray-800`}>{c.name}</td>
                                    <td className={tdNum}>{formatCount(c.n)}</td>
                                    <td className={tdNum}>{c.pct}%</td>
                                    <td className={tdNum}>{totals.prev_comparable ? formatCount(c.prev_n) : '-'}</td>
                                    <td className={`${td} text-gray-600`}>{totals.prev_comparable ? rankChange(c) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-5">
                    그 외 법원 {formatCount(courts.other_n)}건. 법원 표기는 공고 원문의 게시 부서를 그대로 따르고, 건수가 같은 법원은 같은 순위로 적습니다.
                    {!totals.prev_comparable && ' 전월은 수집이 부분적이어서 전월 건수와 순위 변화는 싣지 않습니다.'}
                </p>
            </section>

            {/* 3. 자산 유형 */}
            <section className="mb-12" aria-labelledby="sec-categories">
                <h2 id="sec-categories" className={sectionHeading}>3. 자산 유형 분포</h2>
                <p className="text-sm text-gray-600 leading-7 mb-4">
                    제목과 요약의 키워드로 자동 분류한 8종입니다. 한 공고에 여러 자산이 섞인 경우 대표 유형 하나로만 셉니다.
                </p>
                <div className={tableWrap}>
                    <table className={table}>
                        <caption className="sr-only">자산 유형별 공고 건수</caption>
                        <thead>
                            <tr>
                                <th scope="col" className={th}>유형(자동 분류)</th>
                                <th scope="col" className={`${th} text-right`}>건수</th>
                                <th scope="col" className={`${th} text-right`}>비중</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((c) => (
                                <tr key={c.key}>
                                    <td className={`${td} font-medium text-gray-800`}>{c.label}</td>
                                    <td className={tdNum}>{formatCount(c.n)}</td>
                                    <td className={tdNum}>{c.pct}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {quality.unclassified_n > 0 && (
                    <p className="text-xs text-gray-500 mt-2">8종에 속하지 않는 분류 {formatCount(quality.unclassified_n)}건은 표에서 제외했습니다.</p>
                )}
            </section>

            {/* 4. 최저매각가 분포 */}
            <section className="mb-12" aria-labelledby="sec-price">
                <h2 id="sec-price" className={sectionHeading}>4. 최저매각가 분포</h2>
                <p className="text-sm text-gray-600 leading-7 mb-4">
                    최저매각가가 기재된 {formatCount(price.priced_n)}건({price.pct}%) 기준입니다.
                    합계와 평균은 소수의 고액 공고에 크게 흔들리므로 싣지 않고, 중앙값과 사분위 경계, 구간별 건수만 적습니다.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">중앙값</p>
                        <p className="text-lg font-extrabold text-gray-900">{formatWon(price.median)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">1사분위(p25)</p>
                        <p className="text-lg font-extrabold text-gray-900">{formatWon(price.p25)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">3사분위(p75)</p>
                        <p className="text-lg font-extrabold text-gray-900">{formatWon(price.p75)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">1억 원 이상</p>
                        <p className="text-lg font-extrabold text-gray-900">
                            {formatCount(price.ge_100m_n)}<span className="text-sm font-normal text-gray-500 ml-0.5">건</span>
                        </p>
                    </div>
                </div>
                <div className={tableWrap}>
                    <table className={table}>
                        <caption className="sr-only">최저매각가 구간별 공고 건수</caption>
                        <thead>
                            <tr>
                                <th scope="col" className={th}>최저매각가 구간</th>
                                <th scope="col" className={`${th} text-right`}>건수</th>
                                <th scope="col" className={`${th} text-right`}>기재 건 중 비중</th>
                            </tr>
                        </thead>
                        <tbody>
                            {price.bands.map((b) => (
                                <tr key={b.label}>
                                    <td className={`${td} font-medium text-gray-800`}>{b.label}</td>
                                    <td className={tdNum}>{formatCount(b.n)}</td>
                                    <td className={tdNum}>{b.pct}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-5">
                    중앙값과 p25·p75는 금액을 낮은 쪽부터 늘어놓았을 때 50%·25%·75% 지점의 값입니다(짝수 건이면 위쪽 값). 최저매각가는 공고에 기재된 금액 가운데 수집 시점의 회차 가격이며, 회차가 여러 개인 공고는 1회차 가격과 다를 수 있습니다.
                </p>

                {notable.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-base font-bold text-gray-900 mb-2">최저매각가 상위 공고</h3>
                        <p className="text-xs text-gray-500 leading-5 mb-4">
                            요약 추출이 정상이고 제목과 매각 대상이 일치하며 개인 정보가 섞이지 않은 공고 가운데, 공고에 기재된 최저매각가가 높은 순으로 최대 5건입니다.
                        </p>
                        <ol className="space-y-3">
                            {notable.map((item, i) => (
                                <li key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-1">
                                        <span className="font-bold text-gray-700">{i + 1}</span>
                                        <span>{item.court}</span>
                                        {item.rounds_noted && (
                                            <span className="border border-gray-200 rounded px-1.5 py-0.5">회차별 가격 표기</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 leading-snug">{item.title}</p>
                                    <p className="text-sm text-gray-700 mt-1">
                                        공고에 기재된 최저매각가 <span className="font-semibold">{formatWon(item.min_price)}</span>
                                    </p>
                                    {item.target && (
                                        <p className="text-sm text-gray-600 mt-1 leading-6">매각 대상: {item.target}</p>
                                    )}
                                    <Link href={`/notice/${item.id}`} className="inline-block mt-2 text-xs font-semibold text-indigo-700 hover:underline">
                                        공고 상세와 원문 링크
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </section>

            {/* 5. 입찰 일정 */}
            <section className="mb-12" aria-labelledby="sec-schedule">
                <h2 id="sec-schedule" className={sectionHeading}>5. 입찰 일정</h2>
                <p className="text-sm text-gray-600 leading-7 mb-4">
                    입찰 기일이 기재된 {formatCount(schedule.with_auction_date_n)}건(전체의 {schedule.pct}%) 기준입니다. 회차가 여러 개인 공고는 첫 기일만 셉니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">{report.month_label} 안의 기일</p>
                        <p className="text-lg font-extrabold text-gray-900">
                            {formatCount(schedule.in_month_n)}<span className="text-sm font-normal text-gray-500 ml-0.5">건</span>
                        </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">다음 달로 넘어가는 기일</p>
                        <p className="text-lg font-extrabold text-gray-900">
                            {formatCount(schedule.next_month_n)}<span className="text-sm font-normal text-gray-500 ml-0.5">건</span>
                        </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 mb-1">그 외 달의 기일</p>
                        <p className="text-lg font-extrabold text-gray-900">
                            {formatCount(schedule.other_n)}<span className="text-sm font-normal text-gray-500 ml-0.5">건</span>
                        </p>
                    </div>
                </div>
                {schedule.top_dates.length > 0 && (
                    <div className={tableWrap}>
                        <table className={table}>
                            <caption className="sr-only">입찰 기일이 몰린 날</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={th}>기일이 몰린 날</th>
                                    <th scope="col" className={`${th} text-right`}>건수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule.top_dates.map((d) => (
                                    <tr key={d.date}>
                                        <td className={`${td} font-medium text-gray-800`}>{d.date}</td>
                                        <td className={tdNum}>{formatCount(d.n)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-2 leading-5">
                    기일은 공고 시점 기준이며 정정 공고로 바뀔 수 있습니다.
                    {schedule.excluded_n
                        ? ` 게시일보다 앞서거나 게시일로부터 1년 넘게 뒤인 기일 ${formatCount(schedule.excluded_n)}건은 원문 표기 오류로 보고 집계에서 뺐습니다.`
                        : ' 게시일보다 앞서거나 게시일로부터 1년 넘게 뒤인 기일은 원문 표기 오류로 보고 집계에서 뺍니다.'}
                </p>
            </section>

            {/* 6. 사건 묶음 */}
            <section className="mb-12" aria-labelledby="sec-cases">
                <h2 id="sec-cases" className={sectionHeading}>6. 사건 묶음</h2>
                <p className="text-sm text-gray-600 leading-7 mb-4">
                    제목에 사건번호가 적힌 공고는 {formatCount(cases.titled_with_case_n)}건이고, 사건 수로는 {formatCount(cases.distinct_cases_n)}개입니다.
                    {cases.multi_case_n > 0
                        ? ` 이 중 ${formatCount(cases.multi_case_n)}개 사건은 한 사건의 자산이 여러 공고로 나뉘어 게시됐습니다.`
                        : ' 한 사건이 여러 공고로 나뉜 사례는 없었습니다.'}
                </p>
                {cases.multi_case_examples.length > 0 && (
                    <div className={tableWrap}>
                        <table className={table}>
                            <caption className="sr-only">한 사건이 여러 공고로 나뉜 사례</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={th}>법원</th>
                                    <th scope="col" className={th}>사건번호</th>
                                    <th scope="col" className={`${th} text-right`}>공고 건수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.multi_case_examples.map((ex) => (
                                    <tr key={`${ex.court}-${ex.case_no}`}>
                                        <td className={`${td} font-medium text-gray-800`}>{ex.court}</td>
                                        <td className={`${td} text-gray-700`}>{ex.case_no}</td>
                                        <td className={tdNum}>{formatCount(ex.n)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-2 leading-5">
                    사건번호는 제목에 적힌 것만 사용하고 채무자 이름으로는 묶지 않습니다. 법원마다 제목 관행이 달라 사건번호가 없는 공고는 묶지 못합니다.
                </p>
            </section>

            {/* 7. 편집자 노트 — 300자 이상일 때만 이 페이지가 열린다 */}
            <section className="mb-12" aria-labelledby="sec-note">
                <h2 id="sec-note" className={sectionHeading}>7. 편집자 노트</h2>
                <p className="text-xs text-gray-500 mb-4">
                    {author} · {published} 발행 · 위 집계를 읽고 쓴 해석입니다. {MIN_EDITOR_NOTE_LENGTH}자 미만의 노트는 발행하지 않습니다.
                </p>
                <div className="space-y-5 text-[15px] leading-8 text-gray-700">
                    {paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
            </section>

            {/* 8. 방법론·한계 + 커버리지 */}
            <section className="mb-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-sm leading-7 text-gray-700" aria-labelledby="sec-method">
                <h2 id="sec-method" className={sectionHeading}>8. 방법론과 한계</h2>
                <h3 className="text-xs font-bold text-gray-500 mb-2">이 달의 커버리지</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <p className="text-[11px] text-gray-500">요약 추출 성공</p>
                        <p className="font-bold text-gray-900">{formatCount(quality.summary_quality_n)}건 <span className="font-normal text-gray-500">({quality.summary_quality_pct}%)</span></p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <p className="text-[11px] text-gray-500">요약 추출 실패</p>
                        <p className="font-bold text-gray-900">{formatCount(quality.summary_fallback_n)}건 <span className="font-normal text-gray-500">({quality.summary_fallback_pct}%)</span></p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <p className="text-[11px] text-gray-500">최저매각가 기재</p>
                        <p className="font-bold text-gray-900">{formatCount(quality.min_price_n)}건 <span className="font-normal text-gray-500">({price.pct}%)</span></p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <p className="text-[11px] text-gray-500">입찰 기일 기재</p>
                        <p className="font-bold text-gray-900">{formatCount(quality.auction_date_n)}건 <span className="font-normal text-gray-500">({schedule.pct}%)</span></p>
                    </div>
                </div>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>대상은 대한민국 법원 대국민서비스에 게시된 회생·파산 자산매각 공고 가운데 로옥션이 수집한 건이며, 게시일이 {report.period.start} ~ {report.period.end}에 속하는 공고를 셉니다. 정정·재공고는 별건으로 세어 실제 물건 수보다 많을 수 있습니다.</li>
                    <li>수치는 집계 기준일({report.snapshot_date})에 고정했습니다. 기준일 이후 수집된 공고나 정정은 반영하지 않습니다.</li>
                    <li>자산 유형은 제목과 요약의 키워드로 자동 분류한 값이고, 금액은 공고에 기재된 최저매각가만 사용합니다. 입찰 결과(매수인·매수 금액)와 감정평가액은 수집하지 않습니다.</li>
                    <li>공고 요약은 첨부문서에서 AI가 추출한 것이며, 추출에 실패한 공고는 최저매각가·기일·매각 대상 집계에서 빠집니다. 요약 추출 실패 비율이 높은 달일수록 기재 비율이 낮게 나옵니다.</li>
                    <li>편집자 노트는 운영자가 집계를 읽고 쓴 해석입니다. 초안 작성에 AI를 보조로 쓰더라도 발행 전에 운영자가 사실을 확인합니다.</li>
                </ul>
                <p className="mt-4 text-xs text-gray-500 leading-6">
                    이 리포트는 공고 집계와 편집자의 해석이며, 개별 공고의 내용과 조건은 원문에서 확인해야 합니다.{' '}
                    <Link href="/editorial-policy" className="underline hover:text-indigo-700">데이터·편집 원칙</Link>
                </p>
            </section>

            {/* 지난 달 / 다음 달 리포트 */}
            {(prev || next) && (
                <nav aria-label="인접 월 리포트" className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prev ? (
                        <Link
                            href={`/reports/${prev.month}`}
                            className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                        >
                            <span className="block text-xs text-gray-400 mb-1">&larr; 지난 달 리포트 · {prev.month_label}</span>
                            <span className="block text-sm font-bold text-gray-900 line-clamp-2">{reportTitle(prev)}</span>
                        </Link>
                    ) : <span />}
                    {next && (
                        <Link
                            href={`/reports/${next.month}`}
                            className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all sm:text-right"
                        >
                            <span className="block text-xs text-gray-400 mb-1">다음 달 리포트 · {next.month_label} &rarr;</span>
                            <span className="block text-sm font-bold text-gray-900 line-clamp-2">{reportTitle(next)}</span>
                        </Link>
                    )}
                </nav>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/reports" className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm">
                    월간 리포트 목록
                </Link>
                <Link href="/trend" className="bg-white text-gray-700 font-bold px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                    주간 데이터 칼럼
                </Link>
                <Link href="/datalab" className="bg-white text-gray-700 font-bold px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                    데이터랩 통계
                </Link>
            </div>
        </article>
    );
}
