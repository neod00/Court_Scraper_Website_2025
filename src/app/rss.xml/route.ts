import { blogPosts } from '@/data/blog-posts';

export async function GET() {
    const baseUrl = 'https://courtauction.site';
    const siteName = 'LawAuction';
    const siteDescription = '대법원 회생·파산 자산매각 공고를 자동으로 수집하여 제공합니다. 부동산, 차량, 채권, 주식, 특허 등 다양한 매각 자산 정보를 쉽고 빠르게 검색하세요.';

    const blogItems = blogPosts
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .map((post) => `
        <item>
            <title><![CDATA[${post.title}]]></title>
            <link>${baseUrl}/blog/${post.slug}</link>
            <description><![CDATA[${post.description}]]></description>
            <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
            <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
            <category><![CDATA[${post.category}]]></category>
            <author><![CDATA[${post.author}]]></author>
        </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${siteName}</title>
    <link>${baseUrl}</link>
    <description>${siteDescription}</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${blogItems}
</channel>
</rss>`;

    return new Response(rss, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
        },
    });
}
