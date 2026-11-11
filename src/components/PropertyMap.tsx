// 부동산 공고의 매각 대상 위치 지도. 원문 '매각대상' 항목에서 찾은 주소(propertyAddress)만 쓴다.
// 관재인 사무실·입찰 장소·법원 주소는 추출 단계에서 걸러진다. 확신이 없으면 이 컴포넌트를 그리지 않는다.
import type { PropertyAddress } from '@/lib/propertyAddress';

// 기존 NEXT_PUBLIC_GOOGLE_MAP_API_KEY 는 Maps Embed API 가 꺼져 있어 'API not activated' 오류가 난다(2026-11-11 확인).
// 구글 클라우드에서 Maps Embed API(무료)를 켠 키를 NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY 로 넣으면 공식 임베드로 바뀐다.
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export default function PropertyMap({ place }: { place: PropertyAddress }) {
    const q = encodeURIComponent(place.address);
    // 키가 없으면 키 없는 공개 임베드 주소를 쓴다.
    const src = KEY
        ? `https://www.google.com/maps/embed/v1/place?key=${KEY}&q=${q}&language=ko&region=KR&zoom=16`
        : `https://maps.google.com/maps?q=${q}&hl=ko&z=16&output=embed`;
    return (
        <section aria-labelledby="map-heading" className="bg-[#FAF7EC] border border-[#161616] overflow-hidden">
            <div className="px-6 py-4 bg-[#F4F0E6] border-b border-[#C9C2B4]">
                <h2 id="map-heading" className="text-lg font-bold">매각 대상 위치</h2>
                <p className="text-xs text-[#57534E] mt-1">
                    첨부 공고문의 매각 대상 항목에서 찾은 주소입니다. 지번 위치는 실제 필지 경계와 다를 수 있으니 등기부·토지이용계획과 함께 확인하세요.
                </p>
            </div>
            <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#C9C2B4]">
                <span className="font-bold">
                    {place.address}
                    {place.more > 0 && <span className="ml-1.5 text-sm font-semibold text-[#57534E]">외 {place.more}곳</span>}
                </span>
                <span className="flex flex-wrap gap-2 text-sm font-bold">
                    <a href={`https://map.kakao.com/?q=${q}`} target="_blank" rel="noopener noreferrer" className="border border-[#161616] px-2.5 py-1.5 hover:bg-[#161616] hover:text-[#FAF7EC]">카카오맵 ↗</a>
                    <a href={`https://map.naver.com/p/search/${q}`} target="_blank" rel="noopener noreferrer" className="border border-[#161616] px-2.5 py-1.5 hover:bg-[#161616] hover:text-[#FAF7EC]">네이버 지도 ↗</a>
                </span>
            </div>
            <iframe
                title={`${place.address} 위치 지도`}
                src={src}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full h-[320px] border-0"
            />
        </section>
    );
}
