'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { courtLocations, findCourtLocation, regions } from '@/data/courtLocations';
import Link from 'next/link';

// Naver Maps 타입 선언
declare global {
    interface Window {
        naver: any;
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
    const clustererRef = useRef<any>(null);
    const infoWindowRef = useRef<any>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedCourt, setSelectedCourt] = useState<MarkerData | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string>('전체');
    const [mapCenter, setMapCenter] = useState({ lat: 36.5, lng: 127.5 }); // 한국 중심
    const [mapZoom, setMapZoom] = useState(13); // 전국 보기

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

    // 네이버 지도 초기화
    useEffect(() => {
        if (!mapRef.current) return;

        const initMap = () => {
            if (!window.naver || !window.naver.maps) {
                setLoadError('네이버 지도 API를 불러오는데 실패했습니다.');
                return;
            }

            try {
                const mapOptions = {
                    center: new window.naver.maps.LatLng(mapCenter.lat, mapCenter.lng),
                    zoom: mapZoom,
                    zoomControl: true,
                    zoomControlOptions: {
                        position: window.naver.maps.Position.TOP_RIGHT,
                    },
                };

                const map = new window.naver.maps.Map(mapRef.current!, mapOptions);
                mapInstanceRef.current = map;

                // 지도 이벤트 리스너
                window.naver.maps.Event.addListener(map, 'center_changed', () => {
                    const center = map.getCenter();
                    setMapCenter({ lat: center.lat(), lng: center.lng() });
                });

                window.naver.maps.Event.addListener(map, 'zoom_changed', () => {
                    setMapZoom(map.getZoom());
                });

                setIsLoaded(true);
                setLoadError(null);
            } catch (error) {
                console.error('네이버 지도 초기화 실패:', error);
                setLoadError('지도를 초기화하는데 실패했습니다.');
            }
        };

        // 네이버 지도 API 로드 확인
        if (window.naver && window.naver.maps) {
            initMap();
        } else {
            // 로드될 때까지 폴링 (최대 10초)
            let attempts = 0;
            const maxAttempts = 50; // 200ms * 50 = 10초

            const intervalId = setInterval(() => {
                attempts++;
                if (window.naver && window.naver.maps) {
                    clearInterval(intervalId);
                    initMap();
                } else if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    setLoadError('네이버 지도 SDK 로드 시간이 초과되었습니다. 페이지를 새로고침해주세요.');
                }
            }, 200);

            return () => clearInterval(intervalId);
        }
    }, []);

    // 마커 업데이트
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || !window.naver) return;

        // 기존 마커 제거
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        if (clustererRef.current) {
            clustererRef.current.clear();
        }

        // 클러스터링 라이브러리 로드 확인 및 마커 생성
        const createMarkers = () => {
            const map = mapInstanceRef.current;
            const markers: any[] = [];

            filteredMarkers.forEach((markerData) => {
                const position = new window.naver.maps.LatLng(markerData.lat, markerData.lng);

                const marker = new window.naver.maps.Marker({
                    position,
                    map,
                    title: markerData.courtName,
                    icon: {
                        content: `
                            <div style="
                                background: rgba(79, 70, 229, 0.9);
                                color: white;
                                padding: 4px 8px;
                                border-radius: 12px;
                                font-size: 12px;
                                font-weight: bold;
                                white-space: nowrap;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            ">
                                ${markerData.count}
                            </div>
                        `,
                        anchor: new window.naver.maps.Point(12, 12),
                    },
                });

                // 마커 클릭 이벤트
                window.naver.maps.Event.addListener(marker, 'click', () => {
                    setSelectedCourt(markerData);
                    map.setCenter(position);
                    map.setZoom(15);
                });

                markers.push(marker);
            });

            markersRef.current = markers;

            // 클러스터링 적용 (간단한 버전)
            if (markers.length > 0 && window.naver.maps.MarkerClustering) {
                if (clustererRef.current) {
                    clustererRef.current.clear();
                }
                clustererRef.current = new window.naver.maps.MarkerClustering({
                    minClusterSize: 2,
                    maxZoom: 13,
                    map,
                    markers,
                });
            }
        };

        createMarkers();
    }, [filteredMarkers, isLoaded]);

    // 선택된 법원으로 지도 이동
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || !selectedCourt) return;

        const position = new window.naver.maps.LatLng(selectedCourt.lat, selectedCourt.lng);
        mapInstanceRef.current.setCenter(position);
        mapInstanceRef.current.setZoom(15);
    }, [selectedCourt, isLoaded]);

    // 지역 선택 시 지도 이동
    const handleRegionChange = (region: string) => {
        setSelectedRegion(region);
        setSelectedCourt(null);

        if (!mapInstanceRef.current) return;

        if (region === '전체') {
            const center = new window.naver.maps.LatLng(36.5, 127.5);
            mapInstanceRef.current.setCenter(center);
            mapInstanceRef.current.setZoom(13);
        } else {
            const regionCourts = Object.entries(courtLocations).filter(
                ([_, loc]) => loc.region === region
            );
            if (regionCourts.length > 0) {
                const [_, firstCourt] = regionCourts[0];
                const center = new window.naver.maps.LatLng(firstCourt.lat, firstCourt.lng);
                mapInstanceRef.current.setCenter(center);
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
            real_estate: 'bg-blue-100 text-blue-700',
            vehicle: 'bg-green-100 text-green-700',
            electronics: 'bg-purple-100 text-purple-700',
            bond: 'bg-yellow-100 text-yellow-700',
            stock: 'bg-pink-100 text-pink-700',
            patent: 'bg-orange-100 text-orange-700',
            intangible: 'bg-teal-100 text-teal-700',
            asset: 'bg-indigo-100 text-indigo-700',
            etc: 'bg-gray-100 text-gray-700',
        };
        return colors[category] || 'bg-gray-100 text-gray-700';
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
            <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
                <div className="text-center p-8">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">지도 로딩 실패</h3>
                    <p className="text-gray-600 mb-4">{loadError}</p>
                    <button
                        onClick={handleRetry}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
            <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">지도를 불러오는 중...</p>
                    <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 지역 필터 */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleRegionChange('전체')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            selectedRegion === '전체'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    selectedRegion === region
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <div className="flex-1 bg-white rounded-lg shadow overflow-hidden relative">
                    <div ref={mapRef} style={{ width: '100%', height: '600px' }} />
                    {/* 선택된 법원 정보 오버레이 */}
                    {selectedCourt && (
                        <div className="absolute top-2 left-2 bg-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px] z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-indigo-700">{selectedCourt.courtName}</h3>
                                <button
                                    onClick={() => setSelectedCourt(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{selectedCourt.address}</p>
                            <p className="text-sm font-medium text-gray-700">
                                총 <span className="text-indigo-600 font-bold">{selectedCourt.count}건</span>의 공고
                            </p>
                        </div>
                    )}
                </div>

                {/* 사이드바 - 선택된 법원의 공고 목록 */}
                <div className="lg:w-96 bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-bold text-gray-800">
                            {selectedCourt ? (
                                <>
                                    📍 {selectedCourt.courtName}
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        ({selectedCourt.count}건)
                                    </span>
                                </>
                            ) : (
                                <>
                                    🗺️ 지역별 공고 현황
                                    <span className="text-sm font-normal text-gray-500 ml-2">({totalNotices}건)</span>
                                </>
                            )}
                        </h2>
                    </div>

                    <div className="max-h-[520px] overflow-y-auto">
                        {selectedCourt ? (
                            // 선택된 법원의 공고 목록
                            <div className="divide-y divide-gray-100">
                                {selectedCourt.notices.slice(0, 20).map((notice) => (
                                    <Link
                                        key={notice.site_id}
                                        href={`/notice/${notice.site_id}`}
                                        className="block p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                                                    notice.category
                                                )}`}
                                            >
                                                {getCategoryLabel(notice.category)}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">
                                            {notice.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                            <span>📅 {notice.date_posted}</span>
                                            {notice.expiry_date && <span>⏰ ~{notice.expiry_date}</span>}
                                        </div>
                                    </Link>
                                ))}
                                {selectedCourt.notices.length > 20 && (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        외 {selectedCourt.notices.length - 20}건 더 있음
                                    </div>
                                )}
                            </div>
                        ) : (
                            // 지역/법원별 요약
                            <div className="divide-y divide-gray-100">
                                {filteredMarkers
                                    .sort((a, b) => b.count - a.count)
                                    .map((marker) => (
                                        <button
                                            key={marker.courtName}
                                            onClick={() => handleMarkerClick(marker)}
                                            className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{marker.courtName}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">{marker.address}</p>
                                                </div>
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                                                    {marker.count}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                {filteredMarkers.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">
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
