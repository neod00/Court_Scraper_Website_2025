import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const page = searchParams.get('page') || '1';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const max = searchParams.get('max') || '9';

    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(process.cwd(), 'scripts_auction', 'auction_scraper.py');

    const args = [scriptPath, '--max', max, '--page', page];
    if (region) args.push('--region', region);
    if (start) args.push('--start', start);
    if (end) args.push('--end', end);

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
                resolve(NextResponse.json({
                    success: true,
                    message: 'Scraping complete',
                    output: output
                }));
            } else {
                console.error('Scraper error:', errorOutput);
                resolve(NextResponse.json({
                    success: false,
                    message: 'Scraping failed',
                    error: errorOutput
                }, { status: 500 }));
            }
        });
    });
}
