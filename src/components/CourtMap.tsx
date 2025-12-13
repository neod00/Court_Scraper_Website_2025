'use client';

import { useEffect, useState, useMemo } from 'react';
import { Map, MapMarker, MarkerClusterer, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { courtLocations, findCourtLocation, regions } from '@/data/courtLocations';
import Link from 'next/link';

// Kakao Maps SDK 스크립트 로드 체크를 위한 전역 변수
declare global {
    interface Window {
        kakao: any;
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
    const [isLoaded, setIsLoaded] = useState(false);
    const [selectedCourt, setSelectedCourt] = useState<MarkerData | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string>('전체');
    const [mapCenter, setMapCenter] = useState({ lat: 36.5, lng: 127.5 }); // 한국 중심
    const [mapLevel, setMapLevel] = useState(13); // 전국 보기

    // Kakao Maps SDK 스크립트 로드
    useEffect(() => {
        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false&libraries=clusterer`;
        script.async = true;
        script.onload = () => {
            window.kakao.maps.load(() => {
                setIsLoaded(true);
            });
        };
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

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

    // 지역 선택 시 지도 이동
    const handleRegionChange = (region: string) => {
        setSelectedRegion(region);
        setSelectedCourt(null);

        if (region === '전체') {
            setMapCenter({ lat: 36.5, lng: 127.5 });
            setMapLevel(13);
        } else {
            // 선택한 지역의 첫 번째 법원 위치로 이동
            const regionCourts = Object.entries(courtLocations).filter(
                ([_, loc]) => loc.region === region
            );
            if (regionCourts.length > 0) {
                const [_, firstCourt] = regionCourts[0];
                setMapCenter({ lat: firstCourt.lat, lng: firstCourt.lng });
                setMapLevel(10);
            }
        }
    };

    // 마커 클릭 핸들러
    const handleMarkerClick = (marker: MarkerData) => {
        setSelectedCourt(marker);
        setMapCenter({ lat: marker.lat, lng: marker.lng });
        setMapLevel(8);
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

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">지도를 불러오는 중...</p>
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
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedRegion === '전체'
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
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedRegion === region
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
                <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
                    <Map
                        center={mapCenter}
                        level={mapLevel}
                        style={{ width: '100%', height: '600px' }}
                        onCenterChanged={(map) =>
                            setMapCenter({
                                lat: map.getCenter().getLat(),
                                lng: map.getCenter().getLng(),
                            })
                        }
                        onZoomChanged={(map) => setMapLevel(map.getLevel())}
                    >
                        <MarkerClusterer
                            averageCenter={true}
                            minLevel={10}
                            styles={[
                                {
                                    width: '50px',
                                    height: '50px',
                                    background: 'rgba(79, 70, 229, 0.8)',
                                    borderRadius: '50%',
                                    color: '#fff',
                                    textAlign: 'center',
                                    lineHeight: '50px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                },
                                {
                                    width: '60px',
                                    height: '60px',
                                    background: 'rgba(79, 70, 229, 0.85)',
                                    borderRadius: '50%',
                                    color: '#fff',
                                    textAlign: 'center',
                                    lineHeight: '60px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                },
                                {
                                    width: '70px',
                                    height: '70px',
                                    background: 'rgba(79, 70, 229, 0.9)',
                                    borderRadius: '50%',
                                    color: '#fff',
                                    textAlign: 'center',
                                    lineHeight: '70px',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                },
                            ]}
                        >
                            {filteredMarkers.map((marker) => (
                                <MapMarker
                                    key={marker.courtName}
                                    position={{ lat: marker.lat, lng: marker.lng }}
                                    onClick={() => handleMarkerClick(marker)}
                                    image={{
                                        src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                                        size: { width: 24, height: 35 },
                                    }}
                                />
                            ))}
                        </MarkerClusterer>

                        {/* 선택된 법원 오버레이 */}
                        {selectedCourt && (
                            <CustomOverlayMap
                                position={{ lat: selectedCourt.lat, lng: selectedCourt.lng }}
                                yAnchor={1.4}
                            >
                                <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
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
                                        총 <span className="text-indigo-600 font-bold">{selectedCourt.count}건</span>의
                                        공고
                                    </p>
                                </div>
                            </CustomOverlayMap>
                        )}
                    </Map>
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
