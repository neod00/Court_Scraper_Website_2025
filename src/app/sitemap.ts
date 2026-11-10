import { MetadataRoute } from 'next';
import { getPublicBlogPosts } from '@/data/blog-posts';
import { supabase } from '@/lib/supabase';
import { type WeeklyReport, filterPublishedColumns, columnDate } from '@/lib/weeklyColumn';
import { getPublishedReports } from '@/lib/monthlyReport';
import { INDEX_AUTO_EDITORIAL } from '@/lib/contentPolicy';
import { getNoticeIndex } from '@/lib/noticeIndex';
import { COURT_INDEX_MIN_NOTICES, courts } from '@/data/courts';
import { categories } from '@/data/categories';

export const revalidate = 3600;

const baseUrl = 'https://www.courtauction.site';

// 최근 N일 공고만 sitemap 에 싣는다. 오래된 공고 페이지도 열리고 색인될 수 있지만, 크롤 예산은 최신 공고에 쓴다.
const NOTICE_SITEMAP_DAYS = 180;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 정적 페이지에는 lastModified 를 붙이지 않는다 — 실제 수정일을 추적하지 않는 페이지에 날짜를 꾸며 넣지 않는다.
    const reviewedPages: MetadataRoute.Sitemap = [
        { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
        { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/authors/lawauction-editorial-team`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/editorial-policy`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.4 },
        { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.4 },
        { url: `${baseUrl}/contact`, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${baseUrl}/faq`, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/court`, changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/tools`, changeFrequency: 'monthly', priority: 0.9 },
        { url: `${baseUrl}/tools/acquisition-tax`, changeFrequency: 'monthly', priority: 0.9 },
        { url: `${baseUrl}/tools/bid-calculator`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/vehicle-transfer`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/roi-calculator`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/datalab`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${baseUrl}/blog`, changeFrequency: 'monthly', priority: 0.9 },
        { url: `${baseUrl}/glossary`, changeFrequency: 'monthly', priority: 0.7 },
    ];

    // 월간 리포트 — 편집자 노트가 붙고 발행 처리된 달만 (monthlyReport 게이트와 동일 기준).
    // 발행된 리포트가 없으면 허브(/reports)도 notFound 이므로 함께 뺀다.
    const publishedReports = getPublishedReports();
    const monthlyReportPages: MetadataRoute.Sitemap = publishedReports.length === 0
        ? []
        : [
            {
                url: `${baseUrl}/reports`,
                lastModified: new Date(publishedReports[0].published_at),
                changeFrequency: 'monthly' as const,
                priority: 0.9,
            },
            ...publishedReports.map((report) => ({
                url: `${baseUrl}/reports/${report.month}`,
                lastModified: new Date(report.published_at),
                changeFrequency: 'monthly' as const,
                priority: 0.8,
            })),
        ];

    const reviewedBlogPages: MetadataRoute.Sitemap = getPublicBlogPosts().map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.reviewedAt ?? post.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    // 주간 칼럼 — 편집자 해석이 달린 주차만 색인 대상 (weeklyColumn 게이트와 동일 기준)
    let weeklyColumnPages: MetadataRoute.Sitemap = [];
    try {
        const { data } = await supabase
            .from('weekly_reports')
            .select('week_start, week_end, editor_note, editor_note_at')
            .not('editor_note', 'is', null)
            .order('week_start', { ascending: false })
            .limit(100);

        weeklyColumnPages = filterPublishedColumns((data as WeeklyReport[]) || []).map((report) => ({
            url: `${baseUrl}/trend/${report.week_start}`,
            lastModified: new Date(columnDate(report)),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        }));
    } catch (error) {
        console.error('Error fetching weekly columns for sitemap:', error);
    }

    // 공고 상세 — 첨부 원문(content_text)이 저장된 공고만. content_text 는 attachment_text_extractor 가
    // '읽을 만한 원문'일 때만 채우므로 NULL 여부만으로 거르고, 본문은 내려받지 않는다(egress 절약).
    // 페이지 자체도 noticeQuality 게이트로 한 번 더 확인해 robots 를 정한다.
    let noticePages: MetadataRoute.Sitemap = [];
    try {
        const since = new Date(Date.now() - NOTICE_SITEMAP_DAYS * 86400000).toISOString().slice(0, 10);
        // Supabase 는 요청 1번에 최대 1,000행만 돌려주므로(.limit 이 커도 동일) 1,000건씩 나눠 받는다.
        const PAGE = 1000;
        const MAX_NOTICE_URLS = 5000;
        const data: { id: string; date_posted: string | null }[] = [];
        for (let from = 0; from < MAX_NOTICE_URLS; from += PAGE) {
            const { data: batch, error } = await supabase
                .from('court_notices')
                .select('id, date_posted')
                .eq('source_type', 'notice')
                .not('content_text', 'is', null)
                .gte('date_posted', since)
                .order('date_posted', { ascending: false })
                .order('id', { ascending: true })
                .range(from, from + PAGE - 1);
            if (error) throw error;
            data.push(...(batch || []));
            if (!batch || batch.length < PAGE) break;
        }
        noticePages = data.map((n: { id: string; date_posted: string | null }) => ({
            url: `${baseUrl}/notice/${n.id}`,
            ...(n.date_posted ? { lastModified: new Date(n.date_posted) } : {}),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }));
    } catch (error) {
        console.error('Error fetching notices for sitemap:', error);
    }

    // 법원별·자산 유형별 랜딩 — 공고가 충분한 법원만(페이지 robots 와 같은 기준)
    const noticeIndex = await getNoticeIndex();
    const courtPages: MetadataRoute.Sitemap = courts
        .filter((c) => noticeIndex.filter((n) => n.court === c.name).length >= COURT_INDEX_MIN_NOTICES)
        .map((c) => ({ url: `${baseUrl}/court/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.8 }));
    const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
        url: `${baseUrl}/category/${c.slug}`,
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    // 자동 작성 칼럼·리포트는 INDEX_AUTO_EDITORIAL 이 꺼져 있으면 싣지 않는다(페이지도 noindex).
    const editorialPages = INDEX_AUTO_EDITORIAL ? [...weeklyColumnPages, ...monthlyReportPages] : [];

    return [...reviewedPages, ...courtPages, ...categoryPages, ...reviewedBlogPages, ...editorialPages, ...noticePages];
}
