import { MetadataRoute } from 'next';
import { glossaryTerms } from '@/data/glossary';
import { blogPosts } from '@/data/blog-posts';
import { categories } from '@/data/categories';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://courtauction.site';
    const lastModified = new Date();

    // 정적 페이지
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/guide`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/guide/rehabilitation-asset-guide`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/guide/bankruptcy-vs-auction`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/guide/law-changes-2025`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ];

    // 용어사전 페이지
    const glossaryPages: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/glossary`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        ...glossaryTerms.map((term) => ({
            url: `${baseUrl}/glossary/${term.slug}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
    ];

    // 블로그 페이지
    const blogPages: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/blog`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        ...blogPosts.map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: new Date(post.updatedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        })),
    ];

    // 카테고리 페이지
    const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
    }));

    // 도구 페이지
    const toolPages: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/tools`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/tools/acquisition-tax`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/tools/bid-calculator`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
    ];

    // 공고 상세 페이지 (AI 분석 리포트가 있는 페이지 우선)
    let noticePages: MetadataRoute.Sitemap = [];
    try {
        const { data: notices } = await supabase
            .from('court_notices')
            .select('id, date_posted')
            .not('ai_summary', 'is', null)
            .order('date_posted', { ascending: false })
            .limit(200);

        if (notices) {
            noticePages = notices.map((notice) => ({
                url: `${baseUrl}/notice/${notice.id}`,
                lastModified: new Date(notice.date_posted),
                changeFrequency: 'weekly' as const,
                priority: 0.9,
            }));
        }
    } catch (error) {
        console.error('Error fetching notices for sitemap:', error);
    }

    return [...staticPages, ...glossaryPages, ...blogPages, ...categoryPages, ...toolPages, ...noticePages];
}
