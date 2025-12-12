'use client';

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
        return <span className="text-gray-400 text-sm">첨부파일 없음</span>;
    }

    // Construct download URL
    // Note: If filenames break due to encoding, we might need a server proxy.
    // For now, try direct link with standard encoding.
    const getDownloadUrl = (file: FileInfo) => {
        const baseUrl = 'https://file.scourt.go.kr/AttachDownload';
        const params = new URLSearchParams({
            path: '011', // Default path used in scraper
            file: file.server_filename,
            downFile: file.original_filename // Browser handles encoding usually
        });
        return `${baseUrl}?${params.toString()}`;
    };

    return (
        <div className="flex flex-col gap-2">
            {files.map((file, idx) => (
                <a
                    key={idx}
                    href={getDownloadUrl(file)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 max-w-xs truncate"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    📎 {file.original_filename}
                </a>
            ))}
        </div>
    );
}
