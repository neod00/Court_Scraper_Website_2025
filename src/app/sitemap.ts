import { MetadataRoute } from 'next';
import { glossaryTerms } from '@/data/glossary';
import { getPublicBlogPosts } from '@/data/blog-posts';
import { categories } from '@/data/categories';
import { PUBLIC_GUIDE_SLUGS } from '@/lib/contentPolicy';

const baseUrl = 'https://www.courtauction.site';

export default function sitemap(): MetadataRoute.Sitemap {
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/editorial-policy`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.4 },
        { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.4 },
        { url: `${baseUrl}/contact`, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${baseUrl}/faq`, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/guide`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/trend`, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/datalab`, changeFrequency: 'daily', priority: 0.8 },
        { url: `${baseUrl}/tools`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/glossary`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/blog`, changeFrequency: 'monthly', priority: 0.8 },
    ];

    const guidePages: MetadataRoute.Sitemap = [...PUBLIC_GUIDE_SLUGS].map((slug) => ({
        url: `${baseUrl}/guide/${slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    const glossaryPages: MetadataRoute.Sitemap = glossaryTerms.map((term) => ({
        url: `${baseUrl}/glossary/${term.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    const blogPages: MetadataRoute.Sitemap = getPublicBlogPosts().map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        changeFrequency: 'daily' as const,
        priority: 0.7,
    }));

    // Automated notice pages and unreviewed calculators are intentionally not
    // advertised to search engines. They remain available as user tools.
    const pages = [
        ...staticPages,
        ...guidePages,
        ...glossaryPages,
        ...blogPages,
        ...categoryPages,
    ];

    return [...new Map(pages.map((page) => [page.url, page])).values()];
}
