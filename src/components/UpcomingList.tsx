// 홈 '01' 목록 — 법원 게시판 작성일·공고만료일 기준.
// 기본은 '새로 올라온 공고'. 두 번째 탭은 입찰을 검토할 시간이 남은(만료까지 7일 이상) 공고다.
// 오늘·내일 만료되는 공고는 검토할 시간이 없어 기본 목록에서 앞세우지 않는다(2026-11-11 사용자 요청).
import Link from 'next/link';
import NoticeBoard from '@/components/NoticeBoard';
import type { BoardItem } from '@/components/NoticeBoardRows';
import { LEAD_DAYS } from '@/lib/noticeIndex';

export default function UpcomingList({ recent, prep }: { recent: BoardItem[]; prep: BoardItem[] }) {
    return (
        <section id="upcoming" aria-labelledby="upcoming-title">
            <NoticeBoard
                headingNo="01"
                headingId="upcoming-title"
                views={[
                    {
                        key: 'new',
                        label: '새로 올라온 공고',
                        heading: '새로 올라온 공고',
                        sub: '법원 게시판 작성일이 최근 7일인 공고',
                        items: recent,
                        empty: '최근 7일 동안 새로 올라온 공고가 없습니다.',
                    },
                    {
                        key: 'prep',
                        label: `만료까지 ${LEAD_DAYS}일 이상`,
                        heading: '입찰을 검토할 시간이 남은 공고',
                        sub: `법원 게시 중이고 공고만료일까지 ${LEAD_DAYS}일 이상 남은 공고`,
                        items: prep,
                        empty: `만료까지 ${LEAD_DAYS}일 이상 남은 공고가 없습니다.`,
                    },
                ]}
            />
            <p className="pt-3 flex flex-wrap justify-between gap-2 text-[13px] leading-relaxed">
                <span>
                    작성일·공고만료일은 법원 게시판 값입니다. 회차표는 첨부 공고문에서 읽은 참고 정보이며, 2회차 이후는 앞 회차가 유찰됐을 때만 열립니다.
                    법원은 낙찰 결과를 공개하지 않으니 진행 여부는 관재인 사무실에 확인하세요.
                </span>
                <Link href="/court" className="font-bold underline underline-offset-[3px] whitespace-nowrap">법원별로 모두 보기 →</Link>
            </p>
        </section>
    );
}
