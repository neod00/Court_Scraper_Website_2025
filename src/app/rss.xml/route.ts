import { getPublicBlogPosts } from '@/data/blog-posts';
import { supabase } from '@/lib/supabase';
import {
    columnAuthor,
    columnDate,
    columnExcerpt,
    columnTitle,
    filterPublishedColumns,
    weekSlug,
    type WeeklyReport,
} from '@/lib/weeklyColumn';

const BASE_URL = 'https://www.courtauction.site';

function toPubDate(value: string | null | undefined): string {
    const d = value ? new Date(value) : new Date(NaN);
    return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

function cdata(value: string): string {
    // CDATA 내부에 ']]>'가 있으면 섹션이 끊기므로 분리한다.
    return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

interface RssItem {
    title: string;
    link: string;
    description: string;
    pubDate: Date;
    category: string;
    author: string;
}

async function fetchPublishedColumns(): Promise<WeeklyReport[]> {
    try {
        const { data, error } = await supabase
            .from('weekly_reports')
            .select('week_start, week_end, editor_note, editor_note_title, editor_note_by, editor_note_at')
            .not('editor_note', 'is', null)
            .order('week_end', { ascending: false })
            .limit(52);
        if (error || !data) return [];
        return filterPublishedColumns(data as WeeklyReport[]);
    } catch {
        return [];
    }
}

export async function GET() {
    const siteName = '로옥션(LawAuction)';
    const siteDescription =
        '법원 회생·파산 자산매각 공고 데이터를 바탕으로 로옥션 운영자가 검수해 발행하는 주간 데이터 칼럼과 편집 글입니다.';

    const columns = await fetchPublishedColumns();

    const columnItems: RssItem[] = columns.map((report) => ({
        title: columnTitle(report),
        link: `${BASE_URL}/trend/${weekSlug(report)}`,
        description: columnExcerpt(report, 200),
        pubDate: new Date(report.editor_note_at || columnDate(report)),
        category: '주간 데이터 칼럼',
        author: columnAuthor(report),
    }));

    const blogItems: RssItem[] = getPublicBlogPosts().map((post) => ({
        title: post.title,
        link: `${BASE_URL}/blog/${post.slug}`,
        description: post.description,
        pubDate: new Date(post.publishedAt),
        category: post.category,
        author: post.author,
    }));

    const items = [...columnItems, ...blogItems]
        .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
        .map((item) => `
        <item>
            <title>${cdata(item.title)}</title>
            <link>${item.link}</link>
            <description>${cdata(item.description)}</description>
            <pubDate>${toPubDate(item.pubDate.toISOString())}</pubDate>
            <guid isPermaLink="true">${item.link}</guid>
            <category>${cdata(item.category)}</category>
            <author>${cdata(item.author)}</author>
        </item>`)
        .join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${siteName}</title>
    <link>${BASE_URL}</link>
    <description>${siteDescription}</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
</channel>
</rss>`;

    return new Response(rss, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
            'X-Robots-Tag': 'noindex, follow',
        },
    });
}
