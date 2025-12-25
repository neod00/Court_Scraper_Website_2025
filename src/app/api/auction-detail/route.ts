import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const saNo = searchParams.get('saNo');
    const boCd = searchParams.get('boCd');
    const maemulSer = searchParams.get('maemulSer') || '1';

    if (!saNo || !boCd) {
        return NextResponse.json({
            success: false,
            message: 'Missing required parameters: saNo, boCd'
        }, { status: 400 });
    }

    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(process.cwd(), 'scripts_auction', 'detail_xhr_scraper.py');

    const args = [scriptPath, '--saNo', saNo, '--boCd', boCd, '--maemulSer', maemulSer];
    console.log(`Executing: ${pythonPath} ${args.join(' ')}`);

    return new Promise<NextResponse>((resolve) => {
        const pyProcess = spawn(pythonPath, args);
        let output = '';
        let errorOutput = '';

        pyProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pyProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pyProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const data = JSON.parse(output);
                    resolve(NextResponse.json(data));
                } catch {
                    resolve(NextResponse.json({
                        success: false,
                        message: 'Failed to parse output',
                        raw: output
                    }, { status: 500 }));
                }
            } else {
                console.error('Detail scraper error:', errorOutput);
                resolve(NextResponse.json({
                    success: false,
                    message: 'Scraping failed',
                    error: errorOutput
                }, { status: 500 }));
            }
        });
    });
}
