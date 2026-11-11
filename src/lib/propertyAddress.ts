// 부동산 공고 원문에서 '매각 대상 물건'의 주소를 찾는다(지도 표시용).
//
// 원문 첫머리에는 관재인 사무실·입찰 장소·법원 주소가 자주 나오므로 '첫 주소'를 쓰면 틀린다.
// 그래서 ① '매각대상', '부동산의 표시' 같은 제목 줄을 먼저 찾고 ② 그 아래 몇 줄 안의 주소만 보며
// ③ 사무실·장소·제출·전화 같은 낱말이 있는 줄과 법원 주소는 버린다. 확신이 없으면 null(지도 안 띄움).

const SIDO =
    '(?:서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|' +
    '경기도|강원특별자치도|강원도|충청북도|충청남도|전북특별자치도|전라북도|전라남도|경상북도|경상남도|제주특별자치도|' +
    '[가-힣]{2,6}통합특별시|' +
    '서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)';

// 시도 + 시·군·구(1~2개) + (읍·면) + 동·리·가 또는 도로명 + (산) 번지
const ADDRESS_RE = new RegExp(
    `${SIDO}\\s*(?:[가-힣]{1,6}(?:시|군|구)\\s*){1,2}` +
    `(?:[가-힣0-9]{1,6}(?:읍|면)\\s*)?` +
    `(?:[가-힣0-9]{1,8}(?:동|리|가)\\s*\\d*\\s*(?:가\\s*)?|[가-힣0-9]{1,12}(?:로|길)\\s*(?:\\d+\\s*(?:번)?길\\s*)?)` +
    `(?:산\\s*)?\\d{1,5}(?:\\s*-\\s*\\d{1,5})?`,
);

// 매각 대상을 가리키는 제목 줄
const ANCHOR_RE = /(매각\s*대상|매각\s*목적물|매각\s*물건|대상\s*(?:부동산|물건|자산)|부동산의?\s*표시|물건의?\s*표시|목적물의?\s*표시|소\s*재\s*지|파산재단\s*내역|매각할\s*(?:부동산|재산))/;

// 이런 낱말이 있는 줄의 주소는 매각 대상이 아니다
const BAD_LINE_RE = /(사무실|사무소|법률|법무|관재인|변호사|입찰\s*장소|개찰\s*장소|장소\s*[:：]|제출|접수|우편|등기|발송|전화|팩스|TEL|FAX|☎|우\s*[:：]?\s*\d{5}|\(우|수\s*신|수신처|법원\s*청사|본원|지원)/i;

// 법원 청사가 있는 길 이름(관재인 사무실이 몰려 있어 자주 잡힌다)
const COURT_STREET_RE = /(법원로|서초중앙로|서초대로\s*2\d\d)/;

export interface PropertyAddress {
    address: string; // 지도 검색에 쓸 주소(시도~번지)
    line: string; // 원문에서 찾은 줄(사람이 확인용)
    more: number; // 같은 구역에서 더 찾은 주소 수(일괄 매각 등)
}

function clean(addr: string): string {
    return addr.replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').trim();
}

export function extractPropertyAddress(text: string | null | undefined): PropertyAddress | null {
    if (!text) return null;
    const lines = text.split('\n').map((l) => l.trim());
    for (let i = 0; i < lines.length; i++) {
        if (!ANCHOR_RE.test(lines[i]) || BAD_LINE_RE.test(lines[i])) continue;
        const found: { address: string; line: string }[] = [];
        // 제목 줄 자체와 그 아래 10줄. 다음 큰 항목(2. 입찰…)이 나오면 멈춘다.
        for (let j = i; j < Math.min(lines.length, i + 11); j++) {
            const line = lines[j];
            if (j > i && /^\s*(?:[2-9]|1\d)\s*[.)]\s*\S/.test(line) && !ADDRESS_RE.test(line)) break;
            if (BAD_LINE_RE.test(line) || COURT_STREET_RE.test(line)) continue;
            const m = line.match(ADDRESS_RE);
            if (!m) continue;
            const address = clean(m[0]);
            if (!found.some((f) => f.address === address)) found.push({ address, line });
        }
        if (found.length > 0) return { address: found[0].address, line: found[0].line, more: found.length - 1 };
    }
    return null;
}
