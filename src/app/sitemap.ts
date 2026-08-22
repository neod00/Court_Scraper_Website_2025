import { MetadataRoute } from 'next';
import { getPublicBlogPosts } from '@/data/blog-posts';
import { supabase } from '@/lib/supabase';
import { type WeeklyReport, filterPublishedColumns, columnDate } from '@/lib/weeklyColumn';

const baseUrl = 'https://www.courtauction.site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const reviewedPages: MetadataRoute.Sitemap = [
        { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
        { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/authors/lawauction-editorial-team`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/editorial-policy`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.4 },
        { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.4 },
        { url: `${baseUrl}/contact`, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${baseUrl}/faq`, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/trend`, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/datalab`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${baseUrl}/blog`, changeFrequency: 'monthly', priority: 0.9 },
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

    return [...reviewedPages, ...reviewedBlogPages, ...weeklyColumnPages];
}
