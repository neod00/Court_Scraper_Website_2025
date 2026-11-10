'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { courtLocations, findCourtLocation, regions } from '@/data/courtLocations';
import Link from 'next/link';

// Google Maps 타입 선언
declare global {
    interface Window {
        google: any;
        initGoogleMap?: () => void;
        googleMapReady?: boolean;
        onGoogleMapReady?: () => void;
    }
}

interface CourtNotice {
    site_id: string;
    title: string;
    department: string;
    date_posted: string;
    category: string;
    expiry_date?: string;
}

interface CourtMapProps {
    notices: CourtNotice[];
}

interface MarkerData {
    courtName: string;
    lat: number;
    lng: number;
    count: number;
    notices: CourtNotice[];
    region: string;
    address: string;
}

export default function CourtMap({ notices }: CourtMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const infoWindowRef = useRef<any>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedCourt, setSelectedCourt] = useState<MarkerData | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string>('전체');
    const [mapCenter, setMapCenter] = useState({ lat: 36.5, lng: 127.5 }); // 한국 중심
    const [mapZoom, setMapZoom] = useState(7); // 전국 보기

    // 공고를 법원별로 그룹화
    const markerData = useMemo(() => {
        const courtGroups: Record<string, MarkerData> = {};

        notices.forEach((notice) => {
            const courtName = notice.department || '기타';
            const location = findCourtLocation(courtName);

            if (location) {
                if (!courtGroups[courtName]) {
                    courtGroups[courtName] = {
                        courtName,
                        lat: location.lat,
                        lng: location.lng,
                        count: 0,
                        notices: [],
                        region: location.region,
                        address: location.address,
                    };
                }
                courtGroups[courtName].count++;
                courtGroups[courtName].notices.push(notice);
            }
        });

        return Object.values(courtGroups);
    }, [notices]);

    // 지역 필터링
    const filteredMarkers = useMemo(() => {
        if (selectedRegion === '전체') {
            return markerData;
        }
        return markerData.filter((m) => m.region === selectedRegion);
    }, [markerData, selectedRegion]);

    // 구글 지도 초기화
    useEffect(() => {
        if (!mapRef.current) return;

        const initMap = () => {
            if (!window.google || !window.google.maps) {
                setLoadError('구글 지도 API를 불러오는데 실패했습니다.');
                return;
            }

            try {
                console.log('구글 지도 초기화 시작...');
                const mapOptions: any = {
                    center: { lat: mapCenter.lat, lng: mapCenter.lng },
                    zoom: mapZoom,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                };

                const map = new window.google.maps.Map(mapRef.current!, mapOptions);
                mapInstanceRef.current = map;

                // 지도 이벤트 리스너
                map.addListener('center_changed', () => {
                    const center = map.getCenter();
                    if (center) {
                        setMapCenter({ lat: center.lat(), lng: center.lng() });
                    }
                });

                map.addListener('zoom_changed', () => {
                    setMapZoom(map.getZoom() || 7);
                });

                setIsLoaded(true);
                setLoadError(null);
                console.log('구글 지도 초기화 완료!');
            } catch (error) {
                console.error('구글 지도 초기화 실패:', error);
                setLoadError('지도를 초기화하는데 실패했습니다.');
            }
        };

        // callback 방식: window.googleMapReady가 true이면 바로 초기화
        if (window.googleMapReady && window.google && window.google.maps) {
            console.log('구글 지도 API 이미 로드됨 (googleMapReady)');
            initMap();
        } else {
            // 콜백이 호출될 때 초기화
            console.log('구글 지도 API 로드 대기 중...');
            window.onGoogleMapReady = () => {
                console.log('onGoogleMapReady 콜백 호출됨');
                initMap();
            };

            // 이미 로드되었는지 확인 (폴링 백업)
            let attempts = 0;
            const maxAttempts = 100; // 100ms * 100 = 10초

            const intervalId = setInterval(() => {
                attempts++;
                if (window.googleMapReady || (window.google && window.google.maps && window.google.maps.Map)) {
                    clearInterval(intervalId);
                    console.log('구글 지도 API 로드 확인 (폴링)');
                    initMap();
                } else if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    setLoadError('구글 지도 SDK 로드 시간이 초과되었습니다. API 키를 확인해주세요.');
                }
            }, 100);

            return () => {
                clearInterval(intervalId);
                window.onGoogleMapReady = undefined;
            };
        }
    }, []);

    // 마커 업데이트
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || !window.google) return;

        // 기존 마커 제거
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // 기존 InfoWindow 닫기
        if (infoWindowRef.current) {
            infoWindowRef.current.close();
        }

        const map = mapInstanceRef.current;
        const markers: any[] = [];

        filteredMarkers.forEach((markerData) => {
            const position = { lat: markerData.lat, lng: markerData.lng };

            // 커스텀 마커 아이콘 생성
            const markerIcon = {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4F46E5',
                fillOpacity: 0.9,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
            };

            const marker = new window.google.maps.Marker({
                position,
                map,
                title: `${markerData.courtName} (${markerData.count}건)`,
                icon: markerIcon,
                label: {
                    text: markerData.count.toString(),
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                },
            });

            // 마커 클릭 이벤트
            marker.addListener('click', () => {
                setSelectedCourt(markerData);
                map.setCenter(position);
                map.setZoom(15);

                // InfoWindow 표시
                if (infoWindowRef.current) {
                    infoWindowRef.current.close();
                }

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px; min-width: 200px;">
                            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #4F46E5;">
                                ${markerData.courtName}
                            </h3>
                            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                                ${markerData.address}
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #333;">
                                총 <strong style="color: #4F46E5;">${markerData.count}건</strong>의 공고
                            </p>
                        </div>
                    `,
                });

                infoWindow.open(map, marker);
                infoWindowRef.current = infoWindow;
            });

            markers.push(marker);
        });

        markersRef.current = markers;

        // 마커가 있으면 지도 범위 조정
        if (markers.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            markers.forEach((marker) => {
                const pos = marker.getPosition();
                if (pos) {
                    bounds.extend(pos);
                }
            });
            map.fitBounds(bounds);
        }
    }, [filteredMarkers, isLoaded]);

    // 선택된 법원으로 지도 이동
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || !selectedCourt) return;

        const position = { lat: selectedCourt.lat, lng: selectedCourt.lng };
        mapInstanceRef.current.setCenter(position);
        mapInstanceRef.current.setZoom(15);
    }, [selectedCourt, isLoaded]);

    // 지역 선택 시 지도 이동
    const handleRegionChange = (region: string) => {
        setSelectedRegion(region);
        setSelectedCourt(null);

        if (!mapInstanceRef.current) return;

        if (region === '전체') {
            mapInstanceRef.current.setCenter({ lat: 36.5, lng: 127.5 });
            mapInstanceRef.current.setZoom(7);
        } else {
            const regionCourts = Object.entries(courtLocations).filter(
                ([_, loc]) => loc.region === region
            );
            if (regionCourts.length > 0) {
                const [_, firstCourt] = regionCourts[0];
                mapInstanceRef.current.setCenter({ lat: firstCourt.lat, lng: firstCourt.lng });
                mapInstanceRef.current.setZoom(10);
            }
        }
    };

    // 마커 클릭 핸들러
    const handleMarkerClick = (marker: MarkerData) => {
        setSelectedCourt(marker);
    };

    // 카테고리 라벨
    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            real_estate: '부동산',
            vehicle: '차량',
            electronics: '비품/전자',
            bond: '채권',
            stock: '주식',
            patent: '특허',
            intangible: '무체재산',
            asset: '자산',
            etc: '기타',
        };
        return labels[category] || category;
    };

    // 카테고리 색상
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            real_estate: 'bg-[#D7E7DF] text-[#1F3D7A]',
            vehicle: 'bg-[#D7E7DF] text-[#1F4D3F]',
            electronics: 'bg-[#D7E7DF] text-[#1F3D7A]',
            bond: 'bg-[#F6F1C4] text-[#161616]',
            stock: 'bg-pink-100 text-pink-700',
            patent: 'bg-[#F6F1C4] text-[#161616]',
            intangible: 'bg-[#D7E7DF] text-[#1F4D3F]',
            asset: 'bg-[#D7E7DF] text-[#1F3D7A]',
            etc: 'bg-[#E9E4D8] text-[#2E2B27]',
        };
        return colors[category] || 'bg-[#E9E4D8] text-[#2E2B27]';
    };

    // 총 공고 수 계산
    const totalNotices = filteredMarkers.reduce((sum, m) => sum + m.count, 0);

    // 재시도 핸들러
    const handleRetry = () => {
        window.location.reload();
    };

    // 에러 상태
    if (loadError) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-[#E9E4D8] rounded-none">
                <div className="text-center p-8">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-[#161616] mb-2">지도 로딩 실패</h3>
                    <p className="text-[#3A3A3A] mb-4">{loadError}</p>
                    <button
                        onClick={handleRetry}
                        className="px-6 py-2 bg-[#161616] text-white rounded-none hover:bg-[#161616] transition-colors"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    // 로딩 상태
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-[#E9E4D8] rounded-none">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#161616] mx-auto mb-4"></div>
                    <p className="text-[#3A3A3A]">지도를 불러오는 중...</p>
                    <p className="text-[#6B655C] text-sm mt-2">잠시만 기다려주세요...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 지역 필터 */}
            <div className="bg-[#FAF7EC] rounded-none p-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleRegionChange('전체')}
                        className={`px-4 py-2 rounded-none border border-[#161616] text-sm font-medium transition-colors ${
                            selectedRegion === '전체'
                                ? 'bg-[#161616] text-white'
                                : 'bg-[#E9E4D8] text-[#2E2B27] hover:bg-[#DCD6C8]'
                        }`}
                    >
                        전체 ({markerData.reduce((sum, m) => sum + m.count, 0)}건)
                    </button>
                    {regions.map((region) => {
                        const regionCount = markerData
                            .filter((m) => m.region === region)
                            .reduce((sum, m) => sum + m.count, 0);
                        if (regionCount === 0) return null;
                        return (
                            <button
                                key={region}
                                onClick={() => handleRegionChange(region)}
                                className={`px-4 py-2 rounded-none border border-[#161616] text-sm font-medium transition-colors ${
                                    selectedRegion === region
                                        ? 'bg-[#161616] text-white'
                                        : 'bg-[#E9E4D8] text-[#2E2B27] hover:bg-[#DCD6C8]'
                                }`}
                            >
                                {region} ({regionCount}건)
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 지도 및 사이드바 */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* 지도 */}
                <div className="flex-1 bg-[#FAF7EC] rounded-none overflow-hidden relative">
                    <div ref={mapRef} style={{ width: '100%', height: '600px' }} />
                    {/* 선택된 법원 정보 오버레이 */}
                    {selectedCourt && (
                        <div className="absolute top-2 left-2 bg-[#FAF7EC] rounded-none p-3 min-w-[200px] max-w-[280px] z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-[#1F3D7A]">{selectedCourt.courtName}</h3>
                                <button
                                    onClick={() => setSelectedCourt(null)}
                                    className="text-[#6B655C] hover:text-[#3A3A3A]"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-xs text-[#57534E] mb-2">{selectedCourt.address}</p>
                            <p className="text-sm font-medium text-[#2E2B27]">
                                총 <span className="text-[#1F3D7A] font-bold">{selectedCourt.count}건</span>의 공고
                            </p>
                        </div>
                    )}
                </div>

                {/* 사이드바 - 선택된 법원의 공고 목록 */}
                <div className="lg:w-96 bg-[#FAF7EC] rounded-none">
                    <div className="p-4 border-b border-[#161616]">
                        <h2 className="font-bold text-[#161616]">
                            {selectedCourt ? (
                                <>
                                    📍 {selectedCourt.courtName}
                                    <span className="text-sm font-normal text-[#57534E] ml-2">
                                        ({selectedCourt.count}건)
                                    </span>
                                </>
                            ) : (
                                <>
                                    🗺️ 지역별 공고 현황
                                    <span className="text-sm font-normal text-[#57534E] ml-2">({totalNotices}건)</span>
                                </>
                            )}
                        </h2>
                    </div>

                    <div className="max-h-[520px] overflow-y-auto">
                        {selectedCourt ? (
                            // 선택된 법원의 공고 목록
                            <div className="divide-y divide-[#C9C2B4]">
                                {selectedCourt.notices.slice(0, 20).map((notice) => (
                                    <Link
                                        key={notice.site_id}
                                        href={`/notice/${notice.site_id}`}
                                        className="block p-4 hover:bg-[#F4F0E6] transition-colors"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium ${getCategoryColor(
                                                    notice.category
                                                )}`}
                                            >
                                                {getCategoryLabel(notice.category)}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-medium text-[#161616] mt-1 line-clamp-2">
                                            {notice.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-[#57534E]">
                                            <span>📅 {notice.date_posted}</span>
                                            {notice.expiry_date && <span>⏰ ~{notice.expiry_date}</span>}
                                        </div>
                                    </Link>
                                ))}
                                {selectedCourt.notices.length > 20 && (
                                    <div className="p-4 text-center text-sm text-[#57534E]">
                                        외 {selectedCourt.notices.length - 20}건 더 있음
                                    </div>
                                )}
                            </div>
                        ) : (
                            // 지역/법원별 요약
                            <div className="divide-y divide-[#C9C2B4]">
                                {filteredMarkers
                                    .sort((a, b) => b.count - a.count)
                                    .map((marker) => (
                                        <button
                                            key={marker.courtName}
                                            onClick={() => handleMarkerClick(marker)}
                                            className="w-full text-left p-4 hover:bg-[#F4F0E6] transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-medium text-[#161616]">{marker.courtName}</h3>
                                                    <p className="text-xs text-[#57534E] mt-1">{marker.address}</p>
                                                </div>
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#D7E7DF] text-[#1F3D7A] font-bold text-sm">
                                                    {marker.count}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                {filteredMarkers.length === 0 && (
                                    <div className="p-8 text-center text-[#57534E]">
                                        <p>해당 지역에 공고가 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
