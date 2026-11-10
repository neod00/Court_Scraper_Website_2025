'use client';

import Link from 'next/link';

interface AuctionItem {
    id: string;
    site_id: string;
    title: string;
    department: string | null;
    manager: string | null;
    address: string | null;
    minimum_price: string | null;
    appraised_price: string | null;
    auction_date: string | null;
    status: string | null;
    category: string | null;
    thumbnail_url: string | null;
}

const getCategoryStyles = (cat: string | null) => {
    switch (cat) {
        case 'apartment': return { text: '아파트', color: 'text-[#1F3D7A] bg-[#D7E7DF] border-[#161616]' };
        case 'villa': return { text: '빌라/다세대', color: 'text-[#1F4D3F] bg-[#D7E7DF] border-[#161616]' };
        case 'officetel': return { text: '오피스텔', color: 'text-[#1F3D7A] bg-[#D7E7DF] border-[#161616]' };
        case 'commercial': return { text: '상가', color: 'text-[#161616] bg-[#F6F1C4] border-[#161616]' };
        default: return { text: '기타', color: 'text-[#3A3A3A] bg-[#F4F0E6] border-[#C9C2B4]' };
    }
};

const formatPrice = (price: string | null) => {
    if (!price) return '-';
    const num = parseInt(price.replace(/,/g, ''), 10);
    if (isNaN(num)) return price;
    return num.toLocaleString('ko-KR');
};

const getDDay = (dateStr: string | null) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { text: 'D-Day', color: 'bg-red-500' };
    if (diff < 0) return { text: '종료', color: 'bg-slate-400' };
    return { text: `D-${diff}`, color: 'bg-[#161616]' };
};

export default function AuctionTable({ auctions }: { auctions: AuctionItem[] }) {
    return (
        <div className="bg-[#FAF7EC] rounded-none border border-[#161616] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#F4F0E6] text-[#57534E] text-[11px] uppercase font-bold border-b border-[#161616]">
                            <th className="px-6 py-4 w-32">상태 / 일자</th>
                            <th className="px-6 py-4 w-28">구분</th>
                            <th className="px-6 py-4 w-32">사건번호</th>
                            <th className="px-6 py-4">소재지 / 물건정보</th>
                            <th className="px-6 py-4 text-right w-48">가격 정보 (원)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C9C2B4]">
                        {auctions.map((item) => {
                            const cat = getCategoryStyles(item.category);
                            const dDay = getDDay(item.auction_date);
                            const appraised = parseInt(item.appraised_price?.replace(/,/g, '') || '0', 10);
                            const minimum = parseInt(item.minimum_price?.replace(/,/g, '') || '0', 10);
                            const discount = appraised > 0 ? Math.round((1 - minimum / appraised) * 100) : 0;

                            return (
                                <tr key={item.id} className="hover:bg-[#F4F0E6] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {dDay && (
                                                <span className={`${dDay.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-none w-fit`}>
                                                    {dDay.text}
                                                </span>
                                            )}
                                            <span className="text-xs text-[#57534E] font-medium">
                                                {item.auction_date?.split('T')[0].replace(/-/g, '.')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[11px] font-bold px-2 py-1 rounded-none border whitespace-nowrap ${cat.color}`}>
                                            {cat.text}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono font-bold text-[#2E2B27] bg-[#F4F0E6] px-2 py-1 rounded-none border border-[#C9C2B4] group-hover:bg-[#FAF7EC] group-hover:border-[#161616] transition-all">
                                            {item.manager}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/auction/${item.id}`} className="block">
                                            <div className="text-sm font-bold text-[#161616] group-hover:text-[#1F3D7A] transition-colors mb-1 line-clamp-1">
                                                {item.address}
                                            </div>
                                            <p className="text-[11px] text-[#6B655C] line-clamp-1">{item.title.split(']')[1]?.trim() || '정보 없음'}</p>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] text-[#6B655C]">감정</span>
                                                <span className="text-xs text-[#6B655C] line-through">{formatPrice(item.appraised_price)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {discount > 0 && (
                                                    <span className="text-[10px] font-bold text-red-500">↓{discount}%</span>
                                                )}
                                                <span className="text-base font-extrabold text-[#161616]">{formatPrice(item.minimum_price)}</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
