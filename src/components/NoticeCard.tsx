import Link from 'next/link';
import Badge from './Badge';
import { CATEGORY_LABELS } from '@/lib/categoryLabels';

interface NoticeProps {
    id: string; // our db uuid
    title: string;
    department: string | null;
    date_posted: string;
    category: string | null;
    site_id: string; // court seq_id
    ai_summary?: string | null;
    view_count?: number | null;
}

type BadgeColor = 'blue' | 'green' | 'purple' | 'yellow' | 'gray';

const CATEGORY_COLORS: Record<string, BadgeColor> = {
    real_estate: 'blue',
    vehicle: 'green',
    bond: 'purple',
    stock: 'purple',
    patent: 'yellow',
    intangible: 'yellow',
};

function getCategoryColor(cat: string | null): BadgeColor {
    return (cat && CATEGORY_COLORS[cat]) || 'gray';
}

function getCategoryName(cat: string | null): string {
    return (cat && CATEGORY_LABELS[cat]) || '기타';
}

/**
 * AI 요약의 첫 줄. "첨부파일 참고" 류의 대체 문구이거나 비어 있으면 null.
 * 요약이 "1. **매각 대상**: ... 2. **매각 가격**: ..." 형식이면 매각 대상 구절만 뽑는다.
 */
function summaryLine(summary: string | null | undefined): string | null {
    if (!summary) return null;
    if (summary.includes('첨부파일')) return null;
    const plain = summary.replace(/[*#]/g, '').replace(/\s+/g, ' ').trim();
    if (!plain) return null;
    const target = plain.match(/매각\s*대상\s*[:：]\s*(.+?)(?=\s+\d+\.\s|$)/);
    const line = target ? `매각 대상: ${target[1].trim()}` : plain;
    return line.length > 120 ? `${line.slice(0, 120)}…` : line;
}

export default function NoticeCard({ notice }: { notice: NoticeProps }) {
    const line = summaryLine(notice.ai_summary);

    return (
        <Link href={`/notice/${notice.id}`} className="block">
            <div className="bg-[#FAF7EC] overflow-hidden rounded-none hover:-translate-y-1.5 transition-all duration-300 border border-gray-100/80 group flex flex-col h-full relative">
                <div className="absolute top-0 left-0 w-full h-1 group-hover:bg-[#161616] transition-all duration-300" />
                <div className="p-5 sm:px-6 sm:py-6 flex-grow flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <Badge color={getCategoryColor(notice.category)}>
                            {getCategoryName(notice.category)}
                        </Badge>
                        <time
                            dateTime={notice.date_posted}
                            className="text-xs font-semibold text-[#6B655C] tracking-wide bg-[#F4F0E6] px-2 py-1 rounded-none"
                        >
                            {notice.date_posted}
                        </time>
                    </div>
                    <h3 className="text-[1.05rem] leading-snug font-bold text-[#161616] line-clamp-2 mb-2 group-hover:text-[#1F3D7A] transition-colors">
                        {notice.title}
                    </h3>
                    {line && (
                        <p className="text-xs text-[#57534E] line-clamp-2 mb-1 leading-relaxed">
                            {line}
                        </p>
                    )}
                    <div className="mt-auto pt-4 border-t border-[#C9C2B4] flex items-center justify-between">
                        <span className="text-xs text-[#57534E] font-medium">
                            {notice.department || '관할법원 정보 없음'}
                        </span>
                        <div className="flex items-center gap-3">
                            {notice.view_count !== undefined && notice.view_count !== null && (
                                <span className="text-xs text-[#6B655C] flex items-center gap-0.5">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {(notice.view_count || 0).toLocaleString()}
                                </span>
                            )}
                            <span className="text-xs font-bold text-[#1F3D7A] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pt-0.5">
                                상세보기 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
