import { supabase } from '@/lib/supabase';
import { permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import DownloadFiles from '@/components/DownloadFiles';
import Breadcrumbs from '@/components/Breadcrumbs';
import NoticeFAQ from '@/components/NoticeFAQ';
import NoticeHero from '@/components/NoticeHero';
import RelatedNoticesRSS from '@/components/RelatedNoticesRSS';
import SameEstateNotices from '@/components/SameEstateNotices';
import CourtCostCalculator from '@/components/CourtCostCalculator';
import { AdSenseTag } from '@/components/AdSenseLoader';
import { getRecentPosts } from '@/data/blog-posts';
import { glossaryTerms } from '@/data/glossary';
import { isQualityNotice, hasUsefulSummary } from '@/lib/noticeQuality';
import { INDEX_AUTOMATED_NOTICE_PAGES } from '@/lib/contentPolicy';
import { getCategoryByDbCategory } from '@/data/categories';
import { getCourtByName } from '@/data/courts';
import { formatPhone } from '@/components/NoticeBoardRows';
import {
    hasSubstantialText,
    maskPersonNames,
    parseRoundTable,
    splitOcrText,
    toTextBlocks,
    textExcerpt,
} from '@/lib/noticeText';
import { OriginalTextSection, RoundTableSection } from '@/components/NoticeOriginalText';

// Revalidate every hour
export const revalidate = 3600;

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

const siteUrl = 'https://www.courtauction.site';

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const { data: notice } = await supabase
        .from('court_notices')
        .select('title, category, department, ai_summary, content_text')
        .eq('id', id)
        .single();

    if (!notice) {
        return {
            title: '종료되거나 삭제된 공고',
            description: '요청하신 법원 경매/공매 공고는 종료되었거나 삭제되었습니다. 홈에서 최신 공고를 확인해보세요.',
            robots: { index: false, follow: true },
        };
    }

    const categoryName = notice.category === 'real_estate' ? '부동산' : (notice.category === 'vehicle' ? '차량/동산' : '기타');
    const safeTitle = maskPersonNames(notice.title);
    const title = `${safeTitle} | [${categoryName}] ${notice.department || ''}`;

    // 설명문: 실제 요약 → 원문 앞부분 → 기본 문구 순
    let description = `${safeTitle} - ${notice.department || ''} 관할 회생·파산 자산매각 공고 상세 정보입니다.`;
    if (hasUsefulSummary(notice.ai_summary)) {
        description = textExcerpt(notice.ai_summary.replace(/[*#]/g, ''), 155);
    } else if (hasSubstantialText(notice.content_text, notice.title)) {
        description = textExcerpt(`${notice.department || ''} ${splitOcrText(notice.content_text).text}`, 155);
    }

    const shouldIndex = INDEX_AUTOMATED_NOTICE_PAGES && isQualityNotice(notice);

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
        ...(!shouldIndex ? { robots: { index: false, follow: true } } : {}),
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
    const getCategoryName = (cat: string | null) => {
        if (cat === 'real_estate') return '부동산';
        if (cat === 'vehicle') return '차량/동산';
        return '기타';
    };

    const safeTitle = maskPersonNames(notice.title);
    const stored = splitOcrText(notice.content_text);
    const originalText: string | null = hasSubstantialText(stored.text, notice.title) ? stored.text : null;
    const rounds = originalText ? parseRoundTable(originalText) : null;
    const showSummary = hasUsefulSummary(notice.ai_summary);

    const categorySlug = getCategoryByDbCategory(notice.category)?.slug;
    const courtInfo = getCourtByName(notice.department);
    // 법원 게시판 기준 게시 상태(작성일·공고만료일). 낙찰 여부는 법원이 공개하지 않는다.
    const todayIso = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    const expiry: string | null = notice.expiry_date || null;
    const daysLeft = expiry ? Math.round((Date.parse(expiry) - Date.parse(todayIso)) / 86400000) : null;
    const isPosted = daysLeft !== null && daysLeft >= 0;
    const nextRoundRow = rounds?.find((r) => {
        const m = r.schedule[0]?.match(/(20\d{2})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
        return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` >= todayIso : false;
    }) ?? null;
    const phoneText = formatPhone(notice.phone || null);
    // 광고는 검색에 노출하는 공고(색인 기준과 동일)에만 싣는다. 원문·요약이 없는 얇은 페이지는 광고 없음.
    const showAds = INDEX_AUTOMATED_NOTICE_PAGES && isQualityNotice(notice);
    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
            {showAds && <AdSenseTag />}
            <Breadcrumbs
                items={[
                    { label: '공고 검색', href: '/' },
                    { label: getCategoryName(notice.category), href: categorySlug ? `/category/${categorySlug}` : '/' },
                    { label: safeTitle, href: `/notice/${notice.id}` }
                ]}
            />

            <NoticeHero notice={{
                title: safeTitle,
                category: notice.category,
                court_name: notice.court_name || notice.department || '대한민국 법원',
                date_posted: notice.date_posted,
                department: notice.department
            }} />

            {expiry && (
                <section aria-label="법원 게시 상태" className={`mb-8 border border-[#161616] ${isPosted ? 'bg-[#D7E7DF]' : 'bg-[#E9E4D8]'}`}>
                    <div className="px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className={`text-sm font-bold px-2 py-1 ${isPosted ? 'bg-[#161616] text-[#FAF7EC]' : 'border border-[#161616] bg-[#FAF7EC]'}`}>
                            {isPosted ? (daysLeft === 0 ? '법원 게시 중 · 오늘 만료' : `법원 게시 중 · ${daysLeft}일 남음`) : `게시 종료 · ${expiry} 만료`}
                        </span>
                        <span className="num text-sm">작성일 {notice.date_posted} · 공고만료일 {expiry}</span>
                        {phoneText && (
                            <a href={`tel:${phoneText.replace(/-/g, '')}`} className="num text-sm font-bold border border-[#161616] bg-[#FAF7EC] px-2 py-1 hover:bg-[#161616] hover:text-[#FAF7EC]">
                                ☎ {phoneText} 관재인 사무실
                            </a>
                        )}
                    </div>
                    <p className="px-5 pb-4 text-sm leading-relaxed">
                        {isPosted
                            ? (nextRoundRow
                                ? `원문 회차표상 다음 입찰은 ${nextRoundRow.round}회차(${nextRoundRow.schedule[0] ?? ''})입니다. ${nextRoundRow.round > 1 ? '앞 회차에서 낙찰됐을 수 있으니 ' : ''}진행 여부는 관재인 사무실에 확인하세요.`
                                : '법원은 낙찰 결과를 공개하지 않습니다. 진행 여부는 관재인 사무실에 확인하세요.')
                            : '법원 게시 기간이 끝난 공고입니다. 기록으로 남겨 두며, 목록의 \'게시 중\' 공고에서는 빠집니다.'}
                    </p>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8 min-w-0">
                    <div className="bg-[#FAF7EC] rounded-none overflow-hidden border border-[#161616]">
                        <div className="px-6 py-5 border-b border-[#C9C2B4] flex justify-between items-center bg-[#F4F0E6]">
                            <h2 className="text-lg font-bold text-[#161616]">공고 정보</h2>
                            <Link href="/" className="text-sm font-bold text-[#1F3D7A] hover:underline">목록보기</Link>
                        </div>
                        <div className="p-6">
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="border-b border-[#C9C2B4] pb-2">
                                    <dt className="text-[#57534E] font-medium mb-1">관리번호</dt>
                                    <dd className="text-[#161616] font-mono">{notice.site_id}</dd>
                                </div>
                                <div className="border-b border-[#C9C2B4] pb-2">
                                    <dt className="text-[#57534E] font-medium mb-1">공고일자</dt>
                                    <dd className="text-[#161616]">{notice.date_posted}</dd>
                                </div>
                                <div className="border-b border-[#C9C2B4] pb-2">
                                    <dt className="text-[#57534E] font-medium mb-1">관할부서</dt>
                                    <dd className="text-[#161616]">
                                        {courtInfo ? (
                                            <Link href={`/court/${courtInfo.slug}`} className="text-[#1F3D7A] hover:underline">{notice.department}</Link>
                                        ) : (notice.department || '-')}
                                    </dd>
                                </div>
                                <div className="border-b border-[#C9C2B4] pb-2">
                                    <dt className="text-[#57534E] font-medium mb-1">매각기관</dt>
                                    <dd className="text-[#161616]">{maskPersonNames(notice.sale_org) || '-'}</dd>
                                </div>
                                <div className="border-b border-[#C9C2B4] pb-2">
                                    <dt className="text-[#57534E] font-medium mb-1">연락처</dt>
                                    <dd className="text-[#161616]">{notice.phone || '-'}</dd>
                                </div>
                                <div className="border-b border-[#C9C2B4] pb-2">
                                    <dt className="text-[#57534E] font-medium mb-1">원본 출처</dt>
                                    <dd><a href={notice.detail_link} target="_blank" rel="noreferrer" className="text-[#1F3D7A] hover:text-[#1F3D7A] underline font-bold">법원 바로가기 ↗</a></dd>
                                </div>
                            </dl>
                            <dl className="mt-6 pt-6 border-t border-[#C9C2B4] text-sm">
                                <dt className="text-[#57534E] font-medium mb-2">첨부파일</dt>
                                <dd><DownloadFiles fileInfo={notice.file_info} /></dd>
                            </dl>
                        </div>
                    </div>

                    {rounds && <RoundTableSection rows={rounds} ocr={stored.ocr} />}

                    {/* AI Analysis Report Section — '첨부파일을 확인하라'는 대체 요약은 보여주지 않는다 */}
                    {showSummary && (
                        <article className="relative overflow-hidden rounded-none border border-[#161616] bg-[#FAF7EC]">
                            <div className="px-6 py-4 bg-[#F4F0E6] border-b border-[#161616] flex items-center justify-between gap-3 flex-wrap">
                                <h2 className="text-base font-bold text-[#161616]">공고 첨부문서 요약</h2>
                                <span className="text-[11px] font-medium text-[#57534E]">AI 추출 · 원문 확인 필수</span>
                            </div>
                            {stored.ocr && (
                                <p role="note" className="px-6 py-3 bg-[#F6F1C4] border-b border-[#161616] text-sm text-[#161616] leading-relaxed">
                                    <strong className="font-bold">스캔 이미지를 AI가 읽어 만든 요약입니다.</strong>{' '}
                                    이름·차량번호·주소·금액이 틀릴 수 있으니 첨부파일 원본과 대조하세요.
                                </p>
                            )}

                            <div className="p-6 md:p-8">
                                <div className="prose prose-indigo max-w-none text-[#2E2B27] leading-[1.8] prose-strong:text-[#1F3D7A] prose-strong:font-bold prose-p:my-4 prose-li:my-1">
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
                                                                    <Link key={`${pIdx}-${item.slug}-${i}`} href={`/glossary/${item.slug}`} className="text-[#1F3D7A] font-medium border-b border-dotted border-[#161616] hover:bg-[#D7E7DF] transition-colors" title={item.shortDescription}>{p}</Link>
                                                                );
                                                            } else if (p) { newSegments.push(p); }
                                                        });
                                                    }
                                                    segments = newSegments;
                                                }
                                                return segments;
                                            });
                                        };

                                        return maskPersonNames(notice.ai_summary).split('\n').map((line: string, idx: number) => {
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
                                                        <span className="text-[#1F3D7A] mt-0.5 flex-shrink-0">•</span>
                                                        <span>{linkedRendered.map((r: any) => typeof r === 'string' ? r.replace(/^[-•]\s*/, '') : r)}</span>
                                                    </div>
                                                );
                                            }
                                            if (/^\d+\./.test(trimmed)) {
                                                return (
                                                    <div key={idx} className="flex gap-2 my-1.5 font-medium">
                                                        <span className="text-[#1F3D7A] flex-shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
                                                        <span>{linkedRendered.map((r: any) => typeof r === 'string' ? r.replace(/^\d+\.\s*/, '') : r)}</span>
                                                    </div>
                                                );
                                            }
                                            return <p key={idx} className="my-2">{linkedRendered}</p>;
                                        });
                                    })()}
                                </div>
                                <div className="mt-8 pt-4 border-t border-[#C9C2B4]">
                                    <details className="cursor-pointer group">
                                        <summary className="text-xs font-bold text-[#57534E] tracking-widest flex items-center gap-2 hover:text-[#1F3D7A] transition-colors">분석 범위와 확인 방법</summary>
                                        <ul className="list-disc pl-5 mt-3 space-y-1 text-xs text-[#57534E] font-medium">
                                            <li>요약 입력 자료: 이 페이지에 연결된 대한민국 법원 공고와 첨부 문서</li>
                                            <li>분석 방식: 문서에서 일정·가격·대상 자산을 찾기 위한 AI 보조 추출</li>
                                            <li>별도 실거래가 조회, 감정평가 또는 권리관계 검증은 포함하지 않습니다.</li>
                                            <li>입찰 전 원문과 담당자 확인이 필요합니다.</li>
                                        </ul>
                                    </details>
                                </div>
                            </div>
                        </article>
                    )}

                    {/* 첨부문서 원문 — PDF·HWP 를 열지 않고 읽을 수 있게 텍스트로 옮긴 것 */}
                    {originalText && <OriginalTextSection text={originalText} ocr={stored.ocr} />}

                    <SameEstateNotices currentId={notice.id} saleOrg={notice.sale_org} />

                    <div id="calculator"><CourtCostCalculator category={notice.category} /></div>

                    {/* FAQ & Social Proof */}
                    <NoticeFAQ notice={{
                        title: safeTitle,
                        category: notice.category || '기타',
                        court_name: notice.court_name || notice.department || '대한민국 법원',
                        date_posted: notice.date_posted || ''
                    }} />

                    {/* Related reading */}
                    <div className="mt-12 bg-[#FAF7EC] rounded-none border border-[#161616] overflow-hidden">
                        <div className="px-6 py-4 bg-[#F4F0E6] border-b border-[#C9C2B4]">
                            <h3 className="text-lg font-bold text-[#161616]">관련 확인 가이드</h3>
                        </div>
                        <div className="p-6">
                            <ul className="space-y-2">
                                {getRecentPosts(3).map((post) => (
                                    <li key={post.slug}>
                                        <Link href={`/blog/${post.slug}`} className="text-sm text-[#2E2B27] hover:text-[#1F3D7A] font-medium transition-colors underline-offset-2 hover:underline">
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

                    <div className="bg-[#FAF7EC] rounded-none p-6 border border-[#161616]">
                        <h4 className="text-sm font-bold text-[#161616] mb-4">공고 원본 확인</h4>
                        <p className="text-xs text-[#57534E] leading-relaxed mb-4">
                            입찰 전 법원 사이트의 원본 공고를 확인해야 합니다. <Link href="/editorial-policy" className="text-[#1F3D7A] underline underline-offset-2">데이터·편집 원칙</Link>
                        </p>
                        <a href={notice.detail_link} target="_blank" rel="noreferrer" className="block w-full text-center py-2.5 bg-[#E9E4D8] rounded-none text-[11px] font-bold text-[#2E2B27] hover:bg-[#DCD6C8] transition-colors border border-[#161616]">
                             원본 법원 공고 열기 &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
