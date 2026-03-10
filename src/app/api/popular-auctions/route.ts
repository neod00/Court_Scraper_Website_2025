import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET() {
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(process.cwd(), 'scripts_auction', 'popular_items_scraper.py');

    console.log(`Executing: ${pythonPath} ${scriptPath}`);

    return new Promise<NextResponse>((resolve) => {
        const pyProcess = spawn(pythonPath, [scriptPath]);
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
                    resolve(NextResponse.json({
                        success: true,
                        items: data
                    }));
                } catch (err) {
                    console.error('Popular auctions parser error:', err);
                    resolve(NextResponse.json({
                        success: false,
                        message: 'Failed to parse output. Please check server logs.'
                    }, { status: 500 }));
                }
            } else {
                console.error('Scraper error:', errorOutput);
                resolve(NextResponse.json({
                    success: false,
                    message: 'Scraping failed. Please check server logs.'
                }, { status: 500 }));
            }
        });
    });
}
