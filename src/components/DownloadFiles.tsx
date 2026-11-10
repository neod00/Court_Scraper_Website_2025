'use client';

import { maskPersonNames } from '@/lib/noticeText';

interface FileInfo {
    server_filename: string;
    original_filename: string;
    download_method?: string;
}

export default function DownloadFiles({ fileInfo }: { fileInfo: any }) {
    if (!fileInfo) return null;

    // Ensure it's an array
    const files: FileInfo[] = Array.isArray(fileInfo) ? fileInfo : [];

    if (files.length === 0) {
        return <span className="text-[#6B655C] text-sm">첨부파일 없음</span>;
    }

    // Use proxy API to properly encode Korean filename to EUC-KR
    const getDownloadUrl = (file: FileInfo) => {
        const params = new URLSearchParams({
            file: file.server_filename,
            // 법원 서버는 이 값을 저장 파일명으로만 쓴다(2026-11 확인) — 개인 이름이 HTML 에 남지 않도록 가린 이름을 보낸다.
            name: maskPersonNames(file.original_filename),
            path: '011'
        });
        return `/api/download?${params.toString()}`;
    };

    return (
        <div className="flex flex-col gap-2">
            {files.map((file, idx) => (
                <a
                    key={idx}
                    href={getDownloadUrl(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-[#161616] text-sm font-medium rounded-none text-[#2E2B27] bg-[#FAF7EC] hover:bg-[#F4F0E6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#161616] max-w-xs truncate"
                >
                    📎 {maskPersonNames(file.original_filename)}
                </a>
            ))}
        </div>
    );
}
