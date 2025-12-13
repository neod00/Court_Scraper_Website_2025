import { NextRequest, NextResponse } from 'next/server';
import iconv from 'iconv-lite';

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

    // Encode server filename using standard URL encoding
    const encodedServerFilename = encodeURIComponent(serverFilename);

    // Encode original filename to EUC-KR, then URL encode
    const eucKrBuffer = iconv.encode(originalFilename, 'euc-kr');
    let encodedOriginalFilename = '';
    for (const byte of eucKrBuffer) {
        encodedOriginalFilename += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
    }

    // Construct the court server URL with EUC-KR encoded filename
    const courtUrl = `https://file.scourt.go.kr/AttachDownload?path=${path}&file=${encodedServerFilename}&downFile=${encodedOriginalFilename}`;

    // Redirect to the court server
    return NextResponse.redirect(courtUrl);
}
