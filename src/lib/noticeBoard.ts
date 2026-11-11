// BoardRow(noticeIndex) → BoardItem(화면용, 직렬화 가능) 변환. 서버 컴포넌트에서만 호출한다.
import { shortWon } from '@/components/NoticeIndexViews';
import type { BoardItem } from '@/components/NoticeBoardRows';
import type { BoardRow } from '@/lib/noticeIndex';

export function toBoardItems(rows: BoardRow[], today: string): BoardItem[] {
    return rows.map((r) => {
        const n = r.notice;
        const lastDate = n.rounds?.length ? n.rounds[n.rounds.length - 1].date : null;
        return {
            id: n.id,
            title: n.title,
            court: n.court,
            category: n.category,
            posted: n.date,
            expiry: n.expiry || n.date,
            phone: n.phone,
            daysLeft: r.daysLeft,
            daysSincePosted: Math.max(0, Math.round((Date.parse(today) - Date.parse(n.date)) / 86400000)),
            life: r.life,
            gone: r.gone,
            hasText: n.hasText,
            round: r.next && r.next.date
                ? {
                    round: r.next.round,
                    total: r.totalRounds,
                    date: r.next.date,
                    price: shortWon(r.next.price),
                    priceValue: r.next.price,
                    ratio: r.firstPrice > 0 ? Math.round((r.next.price / r.firstPrice) * 100) : 100,
                }
                : null,
            roundsPassed: Boolean(!r.next && lastDate && lastDate < today),
        };
    });
}
