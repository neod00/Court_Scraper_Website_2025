import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '서울특별시';
    const category = searchParams.get('category') || '아파트';
    const days = parseInt(searchParams.get('days') || '7');

    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(process.cwd(), 'scripts_auction', 'auction_search_scraper.py');
    const outputFilename = `auction_results_${crypto.randomUUID()}.json`;
    const outputPath = path.join(process.cwd(), 'tmp', outputFilename);

    // Ensure tmp directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
        fs.mkdirSync(path.join(process.cwd(), 'tmp'));
    }

    const args = [
        scriptPath,
        '--region', region,
        '--category', category,
        '--output', outputPath
    ];

    // Calculate dates
    const today = new Date();
    const startDate = today.toISOString().split('T')[0].replace(/-/g, '');
    const endDateObj = new Date();
    endDateObj.setDate(today.getDate() + days);
    const endDate = endDateObj.toISOString().split('T')[0].replace(/-/g, '');

    args.push('--start', startDate);
    args.push('--end', endDate);

    console.log(`Executing: ${pythonPath} ${args.join(' ')}`);

    return new Promise<NextResponse>((resolve) => {
        const pyProcess = spawn(pythonPath, args);
        let errorOutput = '';

        pyProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pyProcess.on('close', (code) => {
            if (code === 0 && fs.existsSync(outputPath)) {
                try {
                    const fileContent = fs.readFileSync(outputPath, 'utf-8');
                    const data = JSON.parse(fileContent);

                    // Clean up
                    fs.unlinkSync(outputPath);

                    resolve(NextResponse.json({
                        success: true,
                        items: data
                    }));
                } catch (err) {
                    resolve(NextResponse.json({
                        success: false,
                        message: 'Failed to parse scraper output',
                        error: err instanceof Error ? err.message : String(err)
                    }, { status: 500 }));
                }
            } else {
                console.error('Scraper error:', errorOutput);
                resolve(NextResponse.json({
                    success: false,
                    message: 'Scraping failed or no output produced',
                    error: errorOutput,
                    code: code
                }, { status: 500 }));
            }
        });
    });
}
