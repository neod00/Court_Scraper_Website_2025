// 공고 첨부문서 원문(content_text) 표시용 공용 헬퍼.
//
// content_text 는 scripts/attachment_text_extractor.py 가 첨부 PDF·HWP 에서 추출해
// 개인 이름을 가린 뒤 저장한 '원문'이다. 저장 규칙(scripts/notice_text.py)과 아래 상수·마스킹
// 규칙은 함께 고쳐야 한다.

/** 공백 제외 글자 수 기준. scripts/notice_text.py MIN_STORE_CHARS 와 같은 값. */
export const MIN_TEXT_CHARS = 400;

export function visibleLength(text: string | null | undefined): number {
    return (text || '').replace(/\s/g, '').length;
}

/** 예전 스크래퍼가 넣은 '제목 복제' 값을 걸러내고, 읽을 만한 원문인지 본다. */
export function hasSubstantialText(contentText: string | null | undefined, title?: string | null): boolean {
    if (!contentText) return false;
    if (title && contentText.trim() === title.trim()) return false;
    return visibleLength(contentText) >= MIN_TEXT_CHARS;
}

// ── 개인 이름 마스킹 ─────────────────────────────────────────────────
// 개인 채무자·파산자·소유자·상속인·임차인·보증인 이름은 성만 남긴다(김○○).
// 파산관재인·변호사 이름은 입찰 문의처로 공고에 공개된 직무 정보라 가리지 않는다.

const PERSON_ROLE =
    '(주채무자|채무자|파산자|피상속인|상속인|소유자|매도인|임차인|세입자|점유자|신청인|연대보증인|보증인|차주|(?<![가-힣])망)';
const CORP_LOOKAHEAD =
    '(?!주식회사|유한회사|유한책임|합자회사|합명회사|사단법인|재단법인|농업회사|영농조합|협동조합|㈜|\\(주\\))';
const NAME_RE = new RegExp(
    `${PERSON_ROLE}([\\s:：]+)(망\\s*)?${CORP_LOOKAHEAD}([가-힣]{2,4}?)(?=(?:의|은|는|이|가|과|와|에게|에|소유|명의)?(?![가-힣]))`,
    'g',
);
const NAME_STOPWORDS = new Set([
    '소유', '재산', '상속', '지분', '명의', '법인', '회사', '주식', '주식회사', '유한회사', '부동산', '채무자',
    '채권자', '파산', '회생', '사건', '기타', '일체', '토지', '건물', '차량', '물건', '재고', '비품', '합계',
    '전부', '각각', '해당', '소재', '공장', '점유', '임차인', '세입자', '미상', '없음', '확인', '문의', '연락',
    '연락처', '전화', '담당', '담당자', '관재인', '관리인', '변호사', '법무', '법률', '사무소', '법원', '공고',
    '일반', '개인', '본인', '대표', '대표자', '대표이사', '이사', '현황', '존재', '있음', '여부', '관련', '전원',
    '일동', '모두', '으로', '에게', '로부터', '부담', '제출', '목록', '기재', '표시', '생략', '참조', '매각',
    '매수', '매도', '입찰', '보증금', '권리', '관계', '성명', '주소', '등의',
]);

function isName(token: string): boolean {
    if (!/^[가-힣]{2,4}$/.test(token)) return false;
    if (NAME_STOPWORDS.has(token)) return false;
    if (/회사|법인|조합|산업|건설|상사|은행|공사|재단|센터|그룹|홀딩스|코리아|법원/.test(token)) return false;
    return true;
}

const maskName = (name: string) => name[0] + '○'.repeat(name.length - 1);

export function maskPersonNames(text: string | null | undefined): string {
    if (!text) return '';
    const found = new Set<string>();
    let out = text.replace(NAME_RE, (whole, role: string, sep: string, mang: string | undefined, name: string) => {
        if (!isName(name)) return whole;
        found.add(name);
        return `${role}${sep}${mang || ''}${maskName(name)}`;
    });
    for (const name of [...found].sort((a, b) => b.length - a.length)) {
        if (name.length >= 3) out = out.replace(new RegExp(`(?<![가-힣])${name}`, 'g'), maskName(name));
    }
    return out.replace(/(?<!\d)(\d{6})\s*-\s*([1-8])\d{6}(?!\d)/g, '$1-$2******');
}

// ── 회차별 최저입찰가 표 복원 ────────────────────────────────────────
// PDF 표는 텍스트로 뽑으면 "1 2026. 11. 3. 10:00 10,000,000" 처럼 한 줄에 펼쳐진다.
// 줄 첫 숫자가 1부터 연속으로 늘어나고, 첫 금액이 회차가 오를수록 줄어드는 경우에만 표로 인정한다.

export interface RoundRow {
    round: number;
    schedule: string[]; // 그 줄에 적힌 날짜·시각(원문 순서 그대로)
    price: number; // 그 줄의 첫 금액(원)
}

const DATE_RE = /(20\d{2})\s*[.\-]\s*(\d{1,2})\s*[.\-]\s*(\d{1,2})\.?(?:\s*\([월화수목금토일]\))?(?:\s*(\d{1,2}:\d{2}))?/g;
const AMOUNT_RE = /(?<![\d.])(\d{1,3}(?:,\d{3})+)(?:\s*원)?/g;

export function parseRoundTable(text: string | null | undefined): RoundRow[] | null {
    if (!text) return null;
    const lines = text.split('\n');
    let best: RoundRow[] = [];
    let current: RoundRow[] = [];

    const flush = () => {
        if (current.length > best.length) best = current;
        current = [];
    };

    for (const line of lines) {
        const m = line.match(/^\s*(\d{1,2})\s*(?:회차|회|차)?\s+(.*)$/);
        if (!m) continue;
        const round = Number(m[1]);
        const rest = m[2];
        const schedule = [...rest.matchAll(DATE_RE)].map((d) =>
            `${d[1]}. ${Number(d[2])}. ${Number(d[3])}.${d[4] ? ` ${d[4]}` : ''}`,
        );
        const withoutDates = rest.replace(DATE_RE, ' ');
        const amounts = [...withoutDates.matchAll(AMOUNT_RE)]
            .map((a) => Number(a[1].replace(/,/g, '')))
            .filter((n) => n >= 10000);
        if (amounts.length === 0) continue;
        const row: RoundRow = { round, schedule, price: amounts[0] };

        const prev = current[current.length - 1];
        if (prev && round === prev.round + 1 && row.price <= prev.price) {
            current.push(row);
        } else {
            flush();
            if (round === 1) current = [row];
        }
    }
    flush();
    return best.length >= 2 ? best : null;
}

// ── 원문 블록 나누기 ────────────────────────────────────────────────
/** 빈 줄 기준으로 블록을 나눈다. 블록 안의 줄바꿈은 원문 그대로 보여준다(whitespace-pre-line). */
export function toTextBlocks(text: string): string[] {
    return text
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter(Boolean);
}

export function formatWon(n: number): string {
    return `${n.toLocaleString('ko-KR')}원`;
}

/** 검색 결과·메타 설명용 앞부분 요약(마크업 없는 한 줄). */
export function textExcerpt(text: string, max = 150): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}
