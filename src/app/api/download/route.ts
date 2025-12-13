import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const serverFilename = searchParams.get('file');
    const originalFilename = searchParams.get('name');
    const path = searchParams.get('path') || '011';

    if (!serverFilename || !originalFilename) {
        return NextResponse.json(
            { error: 'Missing required parameters: file and name' },
            { status: 400 }
        );
    }

    try {
        // Construct the court server URL
        const courtUrl = new URL('https://file.scourt.go.kr/AttachDownload');
        courtUrl.searchParams.set('path', path);
        courtUrl.searchParams.set('file', serverFilename);
        courtUrl.searchParams.set('downFile', originalFilename);

        // Fetch the file from the court server
        const response = await fetch(courtUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.scourt.go.kr/',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch file: ${response.status}` },
                { status: response.status }
            );
        }

        // Get the file content as array buffer
        const fileBuffer = await response.arrayBuffer();

        // RFC 5987 encoding for Content-Disposition header with Korean filename
        const encodedFilename = encodeURIComponent(originalFilename).replace(/'/g, '%27');

        // Return the file with properly encoded Content-Disposition header
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${originalFilename}"; filename*=UTF-8''${encodedFilename}`,
                'Content-Length': fileBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error('Download proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to download file' },
            { status: 500 }
        );
    }
}
