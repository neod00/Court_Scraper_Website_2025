// 차량 공고 원문에서 목록에 보여 줄 차명·최초등록일(없으면 연식)·차고지를 뽑는다.
//
// 공고문 형식이 제각각이라(키-값 줄, 표를 줄로 푼 것, 스캔 판독) 확신이 서는 값만 돌려준다.
// - 차명: '차명/차종명/모델 : 값' 줄, 또는 '차명·차종'이 든 표 머리 아래 번호판이 있는 줄에서 번호판·차대번호·날짜·주행거리·색상을 걷어낸 나머지.
// - 등록: '최초등록(일)' 날짜 → 없으면 표의 '등록일' 칸 날짜 → 없으면 연식(연도만).
// - 차고지: '차고지·보관장소·보관위치·주차장소' 라벨이 붙은 주소만. 관재인 사무실·입찰 장소는 쓰지 않는다.
// 목록에는 시·군·구까지만 보여 준다(정확한 위치는 원문 확인).

export interface VehicleInfo {
    model: string | null;
    count: number; // 원문 매각대상 항목에서 찾은 번호판 수(0이면 모름)
    reg: string | null; // 'YYYY-MM-DD'(최초등록) 또는 'YYYY'(연식)
    regKind: 'first' | 'year' | null;
    garage: string | null; // 시·군·구까지 줄인 차고지
}

const PLATE_RE = /(?<![\d가-힣])((?:[가-힣]{2})?\d{2,3}\s?[가-힣]\s?\d{4})(?!\d)/g;
const VIN_RE = /\b[A-HJ-NPR-Z0-9]{17}\b/g;
const DATE_RE = /((?:19|20)\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*\.?\s*일?/;
const HEADER_WORDS = /(등록번호|차량번호|연\s*식|주행거리|색\s*상|최초\s*등록|등록일|차대번호|제\s*원|비\s*고|순\s*번)/;
const COLOR = '(?:미색|파랑|파란|빨강|노랑|초록|흰|흰색|백색|화이트|흑색|검정색?|검은색|블랙|회색|쥐색|진회색|은색|은회색|실버|청색|파란색|남색|감청색|빨간색|적색|녹색|초록색|노란색|황색|갈색|베이지|금색|진주색|하늘색|주황색|자주색|청회색|기타)';
// String.raw: 템플릿 문자열에서 \d·\s 가 'd'·'s' 로 바뀌지 않게 한다.
const JUNK_WORDS = new RegExp(
    String.raw`\d[\d,]*\s*만\s*원?|\d[\d,]*\s*원\S*|\(?${COLOR}\)?|있음|없음|배터리|방전|매수자|매수인|부담|화물차|승용차|승합차|특수차|승용|화물|승합|미상|불명|확인불가|세금계산서|발급불가|발급|부가세|VAT|불포함|포함|첨부|참조|차량등록원부|등록원부|일괄|매각|자가용|영업용|수입차|국산|휘발유|경유|LPG|전기|하이브리드(?=\s|$)|경형|소형|중형|대형|차\s*종|차\s*명|및|자동차|차량|\d+\s*대|\d[\d,]*\s*만\s*원?|\d[\d,]*\s*원|설정|가능성|원을|의정부|형식|현재|종합운동장|주차장|노상|서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|과태료|저당권\S*|압류\S*|상태|손상|우측|좌측|휀다|제세|공과금\S*|체납\S*|km|㎞|KM|약`,
    'g',
);

const iso = (y: string, m: string, d: string) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

/** 매각 대상 부분만 — 원문의 '2.' 항목(입찰방법 등) 앞까지, 최대 2,500자. */
function targetPart(text: string): string {
    const head = text.slice(0, 4000);
    const m = head.slice(30).search(/\n\s*(?:2\s*[.)]|Ⅱ\.|나\.\s*입찰|\[?\s*입찰\s*방법)/);
    return m > 0 ? head.slice(0, m + 30) : head.slice(0, 2500);
}

function cleanModel(raw: string): string | null {
    let s = raw
        .replace(PLATE_RE, ' ')
        .replace(VIN_RE, ' ')
        .replace(new RegExp(DATE_RE.source, 'g'), ' ')
        .replace(/약?\s*\d{1,3}(?:,\d{3})+\s*(?:km|㎞|KM|Km|키로)?/g, ' ')
        .replace(/\d+\s*(?:km|㎞|KM|Km)/g, ' ')
        .replace(/(?:19|20)\d{2}\s*(?:년식|연식|년|식)?(?:\s*\([^)]*\))?/g, ' ')
        .replace(JUNK_WORDS, ' ')
        .replace(/^[\s\d.)·-]+/, ' ')
        .replace(/[()[\]※*:：,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    // 표 줄 끝의 남은 숫자(주행거리 일부, 보증금 등) 제거
    s = s.replace(/(\s\d[\d,]*)+$/, '').trim();
    // 엔진 형식(G4FT·D4CB), 회사명, 한 글자 조각, 같은 낱말 반복을 뺀다
    const seen = new Set<string>();
    const tokens = s
        .split(' ')
        .filter((t) => t && !/^[A-Z]\d[A-Z]{2}$/.test(t) && !/^EM\d+$/.test(t) && !/(㈜|\(주\)|주식회사)/.test(t))
        .filter((t) => t.length > 1 || /^[ⅠⅡⅢⅣⅤA-Z]$/.test(t))
        .filter((t) => !/^\d+\.?$/.test(t))
        .filter((t) => (seen.has(t) ? false : (seen.add(t), true)))
        .slice(0, 3);
    s = tokens.join(' ');
    if (s.length < 2 || s.length > 30) return null;
    if (!/[A-Za-z가-힣]{2}/.test(s)) return null;
    if (HEADER_WORDS.test(s)) return null;
    return s;
}

/** '경기도 양주시 칠봉산로 …' → '경기 양주시', '수원시 영통구 …' → '수원시 영통구' */
export function shortRegion(addr: string): string | null {
    const SIDO: Record<string, string> = {
        서울특별시: '서울', 서울시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천', 광주광역시: '광주',
        대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종', 경기도: '경기', 강원도: '강원', 강원특별자치도: '강원',
        충청북도: '충북', 충청남도: '충남', 전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북',
        경상남도: '경남', 제주특별자치도: '제주', 제주도: '제주',
    };
    const SHORT = /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)$/;
    const t = addr.replace(/[(),]/g, ' ').split(/\s+/).filter(Boolean);
    if (t.length === 0) return null;
    const out: string[] = [];
    let i = 0;
    const sido = SIDO[t[0]] || (SHORT.test(t[0]) ? t[0] : null);
    if (sido) {
        out.push(sido);
        i = 1;
    }
    const sgg = t[i];
    if (!sgg || !/[시군구]$/.test(sgg)) return out.length && sido !== '세종' ? null : out.join(' ') || null;
    out.push(sgg);
    if (/시$/.test(sgg) && t[i + 1] && /구$/.test(t[i + 1])) out.push(t[i + 1]);
    return out.join(' ');
}

const GARAGE_RE = /(?:차\s*고\s*지|보\s*관\s*(?:장\s*소|위\s*치|주\s*소|장)|주\s*차\s*(?:장\s*소|위\s*치)|차량\s*소재지)\s*(?:주소)?\s*\)?\s*[:：]?\s*(.*)$/;
const OFFICE_RE = /(사무실|사무소|관재인|법무|변호사|법률|회의실|법원로)/;

function findGarage(text: string): string | null {
    const lines = text.slice(0, 5000).split('\n');
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(GARAGE_RE);
        if (!m) continue;
        // 라벨만 있고 주소가 다음 줄에 있는 경우
        let addr = m[1].trim();
        // 값이 짧으면 다음 줄로 이어진 것(OCR 줄바꿈 '남양⏎주시' 포함)으로 보고 붙인다
        if (addr.length < 4 && lines[i + 1]) addr = `${addr}${lines[i + 1].trim()}`;
        if (OFFICE_RE.test(addr)) continue;
        const r = shortRegion(addr);
        if (r) return r;
    }
    return null;
}

/**
 * 칸마다 한 줄씩 풀린 표(머리 칸 N줄 → 값 N줄)에서 header 칸의 첫 행 값을 읽는다.
 * 예: '차량번호⏎차명⏎차종⏎연식⏎…⏎83서3984⏎봉고Ⅲ 1톤⏎화물 소형⏎2014년식'
 */
function cellTable(lines: string[], header: RegExp, read: (v: string) => string | null): string | null {
    const CELL = /^(순\s*번|차\s*량\s*번\s*호|등\s*록\s*번\s*호|차\s*명|차\s*종\s*명?|차량\s*명|모\s*델\s*명?|연\s*식|주\s*행\s*거\s*리.*|색\s*상|비\s*고|최\s*초\s*등\s*록\s*일?|등\s*록\s*일|최저\s*가격.*|최저\s*입찰가.*|차\s*대\s*번\s*호|제\s*원|용\s*도|\(?모델\s*연도\)?)$/;
    const at = lines.findIndex((l) => header.test(l));
    if (at < 0) return null;
    let start = at;
    while (start > 0 && CELL.test(lines[start - 1])) start--;
    let end = at;
    while (end + 1 < lines.length && CELL.test(lines[end + 1])) end++;
    const n = end - start + 1;
    if (n < 3) return null; // 한 줄짜리 머리줄이 아니면 칸 표로 보지 않는다
    const first = lines.slice(end + 1, end + 1 + n);
    // 마지막 칸(비고 등)이 비어 다음 항목 제목이 끼어들 수 있어 개수는 느슨하게 본다
    if (first.length <= at - start || !first.some((l) => l.match(PLATE_RE))) return null;
    return read(first[at - start]);
}

export function extractVehicleInfo(text: string | null | undefined): VehicleInfo | null {
    if (!text) return null;
    const part = targetPart(text);
    const lines = part.split('\n').map((l) => l.trim()).filter(Boolean);

    // 번호판 수
    const plates = new Set<string>();
    for (const m of part.matchAll(PLATE_RE)) plates.add(m[1].replace(/\s/g, ''));

    // ── 차명 ──
    let model: string | null = null;
    const KV = /^(?:[가-하①-⑳\d]\s*[.)]\s*|[-·•※]\s*)?(차\s*명|차\s*종\s*명|차\s*량\s*명|모\s*델\s*명?|품\s*명|차\s*종)\s*(?:\(\s*연\s*식\s*\))?\s*[:：]?\s*(.+)$/;
    let classOnly: string | null = null;
    for (const l of lines) {
        const m = l.match(KV);
        if (!m) continue;
        const label = m[1].replace(/\s/g, '');
        const value = m[2];
        if (HEADER_WORDS.test(value)) continue; // 표 머리
        const c = cleanModel(value);
        if (!c) continue;
        if (label === '차종') {
            classOnly ??= c; // '승용 중형' 같은 분류일 수 있어 차명이 없을 때만 쓴다
            continue;
        }
        model = c;
        break;
    }
    if (!model) {
        // 표: 머리줄에 차명·차종이 있고, 아래 번호판 줄
        const hi = lines.findIndex((l) => /(차\s*명|차\s*종|차량\s*명|모\s*델)/.test(l) && HEADER_WORDS.test(l));
        if (hi >= 0) {
            const pending: string[] = [];
            for (const l of lines.slice(hi + 1, hi + 12)) {
                if (!l.match(PLATE_RE)) {
                    pending.push(l); // 차명 칸이 여러 줄로 쪼개진 경우(티구안⏎(Tiguan 2.0⏎번호판 …)
                    continue;
                }
                model = cleanModel(l);
                for (const p of pending) model ??= cleanModel(p);
                if (model) break;
                pending.length = 0;
            }
        }
    }
    if (!model) model = cellTable(lines, /^(차\s*명|차\s*종\s*명|차량\s*명|모\s*델\s*명?)$/, cleanModel);
    if (!model && classOnly && !/^(승용|화물|승합|특수)/.test(classOnly)) model = classOnly;

    // ── 최초등록일 / 연식 ──
    let reg: string | null = null;
    let regKind: VehicleInfo['regKind'] = null;
    const first = part.match(new RegExp(`최\\s*초\\s*등\\s*록\\s*일?\\s*(?:일자)?\\s*[:：]?\\s*${DATE_RE.source}`));
    if (first) {
        reg = iso(first[1], first[2], first[3]);
        regKind = 'first';
    }
    if (!reg) {
        // 표 머리에 '최초등록/등록일'이 있고 번호판 줄에 날짜가 있으면 그 날짜
        const hi = lines.findIndex((l) => /(최\s*초\s*등\s*록|등\s*록\s*일)/.test(l) && !DATE_RE.test(l));
        if (hi >= 0) {
            for (const l of lines.slice(hi + 1, hi + 8)) {
                if (!l.match(PLATE_RE)) continue;
                const d = l.match(DATE_RE);
                if (d) {
                    reg = iso(d[1], d[2], d[3]);
                    regKind = 'first';
                    break;
                }
            }
        }
    }
    if (!reg) {
        const d = cellTable(lines, /^(최\s*초\s*등\s*록\s*일?|등\s*록\s*일)$/, (v) => v.match(DATE_RE)?.slice(1, 4).join('|') ?? null);
        if (d) {
            const [y, mo, da] = d.split('|');
            reg = iso(y, mo, da);
            regKind = 'first';
        }
    }
    if (!reg) {
        const y = part.match(/연\s*식\s*(?:\(?모델\s*연도\)?)?\s*\)?\s*[:：]?\s*((?:19|20)\d{2})/) ??
            (() => { const c = cellTable(lines, /^연\s*식$/, (v) => v.match(/((?:19|20)\d{2})/)?.[1] ?? null); return c ? [c, c] : null; })();
        if (y) {
            reg = y[1];
            regKind = 'year';
        } else {
            for (const l of lines) {
                if (!l.match(PLATE_RE)) continue;
                const y2 = l.replace(new RegExp(DATE_RE.source, 'g'), ' ').replace(VIN_RE, ' ').match(/(?<![\d,])((?:19|20)\d{2})(?:\s*년식|\s*년)?(?![\d,])/);
                if (y2) {
                    reg = y2[1];
                    regKind = 'year';
                    break;
                }
            }
        }
    }
    // 등록 연도가 터무니없으면 버린다
    if (reg && (Number(reg.slice(0, 4)) < 1985 || Number(reg.slice(0, 4)) > new Date().getFullYear() + 1)) {
        reg = null;
        regKind = null;
    }

    const garage = findGarage(text);
    if (!model && !reg && !garage) return null;
    return { model, count: plates.size, reg, regKind, garage };
}
