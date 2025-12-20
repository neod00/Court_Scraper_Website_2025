import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lawdCd = searchParams.get('lawdCd');
    const dealYmd = searchParams.get('dealYmd');

    if (!lawdCd || !dealYmd) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const serviceKey = '3d5ffc75a14cccb5038feb87bbf1b03f36591801bd4469fbfaf1d39f90a62ff8';
    const url = `http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&serviceKey=${encodeURIComponent(serviceKey)}`;

    try {
        const response = await fetch(url);
        const xmlData = await response.text();

        // Simple regex-based XML parsing to avoid extra dependencies like xml2js
        const itemMatches = xmlData.match(/<item>([\s\S]*?)<\/item>/g);

        if (!itemMatches) {
            return NextResponse.json({ items: [] });
        }

        const extractTag = (xml: string, tag: string) => {
            const match = xml.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`));
            return match ? match[1].trim() : '';
        };

        const cleanedItems = itemMatches.map((itemXml: string) => ({
            aptNm: extractTag(itemXml, 'aptNm') || '알 수 없음',
            dealAmount: extractTag(itemXml, 'dealAmount') || '0',
            excluArea: extractTag(itemXml, 'excluArea') || '0',
            dealDay: extractTag(itemXml, 'dealDay') || '0',
            buildYear: extractTag(itemXml, 'buildYear') || '',
            umdNm: extractTag(itemXml, 'umdNm') || ''
        }));

        return NextResponse.json({ items: cleanedItems });
    } catch (error) {
        console.error('Market price API proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch market prices' }, { status: 500 });
    }
}
