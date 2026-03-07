'use client';

import { useState, useEffect } from 'react';

// 후원 버튼 노출 조건 관리를 위한 유틸리티
const STORAGE_KEYS = {
    VISIT_COUNT: 'lawauction-visit-count',
    SEARCH_COUNT: 'lawauction-search-count',
    FIRST_VISIT_TIME: 'lawauction-first-visit-time',
};

export default function DonationButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [shouldShow, setShouldShow] = useState(false);

    // 카카오페이 송금 링크
    const KAKAOPAY_LINK = 'https://qr.kakaopay.com/FcVUpCzQr';
    const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(KAKAOPAY_LINK)}&bgcolor=ffffff&color=000000&margin=10`;

    // ========================================
    // 노출 조건 체크
    // ========================================

    // 1) 방문 횟수 체크 & 증가
    useEffect(() => {
        const visitCount = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);
        const newCount = visitCount + 1;
        localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, String(newCount));

        // 조건 1: 3번째 방문 이상
        if (newCount >= 3) {
            setShouldShow(true);
        }
    }, []);

    // 2) 경매 공고 조회 횟수 감지 (SearchForm에서 발생하는 커스텀 이벤트 수신)
    useEffect(() => {
        // 페이지 로드 시 기존 검색 횟수 체크
        const searchCount = parseInt(localStorage.getItem(STORAGE_KEYS.SEARCH_COUNT) || '0', 10);
        if (searchCount >= 3) {
            setShouldShow(true);
        }

        // 새로운 검색 이벤트 수신
        const handleSearch = () => {
            const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.SEARCH_COUNT) || '0', 10);
            const newCount = currentCount + 1;
            localStorage.setItem(STORAGE_KEYS.SEARCH_COUNT, String(newCount));

            // 조건 2: 3회 이상 조회
            if (newCount >= 3) {
                setShouldShow(true);
            }
        };

        window.addEventListener('lawauction-search', handleSearch);
        return () => window.removeEventListener('lawauction-search', handleSearch);
    }, []);

    // 3) 체류 시간 10분 이상
    useEffect(() => {
        const timer = setTimeout(() => {
            // 조건 3: 10분(600,000ms) 이상 체류
            setShouldShow(true);
        }, 10 * 60 * 1000);

        return () => clearTimeout(timer);
    }, []);

    // ========================================
    // 기존 UI 로직
    // ========================================

    // 모바일 감지
    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor;
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        setIsMobile(mobile);
    }, []);

    // 조건 충족 후 부드러운 진입 애니메이션 (2초 딜레이)
    useEffect(() => {
        if (!shouldShow) return;
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
    }, [shouldShow]);

    // 최초 표시 시 툴팁 자동 표시 (세션당 1회만)
    useEffect(() => {
        if (!isVisible) return;
        const hasSeenTooltip = sessionStorage.getItem('donation-tooltip-seen');
        if (!hasSeenTooltip) {
            const tooltipTimer = setTimeout(() => {
                setShowTooltip(true);
                sessionStorage.setItem('donation-tooltip-seen', 'true');
                setTimeout(() => setShowTooltip(false), 4000);
            }, 3000);
            return () => clearTimeout(tooltipTimer);
        }
    }, [isVisible]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // 조건 미충족 시 아무것도 렌더링하지 않음
    if (!shouldShow) return null;

    return (
        <>
            {/* 플로팅 후원 버튼 */}
            <div
                className={`fixed bottom-6 right-6 z-50 transition-all duration-700 ${isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-16 opacity-0'
                    }`}
            >
                {/* 툴팁 */}
                {showTooltip && !isOpen && (
                    <div className="absolute bottom-full right-0 mb-3 animate-fade-in">
                        <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl whitespace-nowrap relative">
                            서비스가 도움이 되셨나요? ☕
                            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-gray-900 transform rotate-45"></div>
                        </div>
                    </div>
                )}

                {/* 메인 버튼 */}
                <button
                    id="donation-floating-btn"
                    onClick={() => {
                        setIsOpen(true);
                        setShowTooltip(false);
                    }}
                    className="group relative flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white pl-4 pr-5 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                    aria-label="개발자에게 커피 한 잔 사주기"
                >
                    <span className="relative text-xl">
                        ☕
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-70">
                            <span className="w-0.5 h-2 bg-white/40 rounded-full animate-steam-1"></span>
                            <span className="w-0.5 h-2.5 bg-white/30 rounded-full animate-steam-2"></span>
                            <span className="w-0.5 h-2 bg-white/40 rounded-full animate-steam-3"></span>
                        </span>
                    </span>
                    <span className="font-bold text-sm hidden sm:inline">커피 한 잔 사주기</span>
                    <span className="font-bold text-sm sm:hidden">후원</span>
                </button>
            </div>

            {/* 후원 모달 */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* 백드롭 */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* 모달 컨텐츠 */}
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full animate-modal-in overflow-hidden">
                        {/* 상단 그라데이션 장식 */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500"></div>

                        {/* 닫기 버튼 */}
                        <button
                            id="donation-modal-close"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
                            aria-label="닫기"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* 모달 헤더 */}
                        <div className="pt-8 pb-4 px-6 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl flex items-center justify-center shadow-inner">
                                <span className="text-4xl">☕</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                개발자에게 커피 한 잔 사주기
                            </h2>
                            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                                로옥션(LawAuction) 서비스가 도움이 되셨다면,<br />
                                따뜻한 커피 한 잔으로 응원해주세요! 💛
                            </p>
                        </div>

                        {/* PC: QR코드 / 모바일: 카카오페이 버튼 */}
                        <div className="px-6 pb-6">
                            {isMobile ? (
                                <a
                                    id="donation-kakao-btn"
                                    href={KAKAOPAY_LINK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-center gap-3 w-full p-4 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-yellow-900 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-400/30 active:scale-[0.98]"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 3C6.48 3 2 6.58 2 10.95c0 2.82 1.86 5.3 4.66 6.7l-1.19 4.35 5.07-3.35c.48.05.96.08 1.46.08 5.52 0 10-3.58 10-7.98S17.52 3 12 3z" />
                                    </svg>
                                    <span className="font-bold text-base">카카오페이로 후원하기</span>
                                </a>
                            ) : (
                                <div className="text-center">
                                    <div className="inline-block bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={QR_CODE_URL}
                                            alt="카카오페이 송금 QR코드"
                                            width={200}
                                            height={200}
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="mt-4 space-y-1.5">
                                        <p className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 3C6.48 3 2 6.58 2 10.95c0 2.82 1.86 5.3 4.66 6.7l-1.19 4.35 5.07-3.35c.48.05.96.08 1.46.08 5.52 0 10-3.58 10-7.98S17.52 3 12 3z" />
                                            </svg>
                                            스마트폰으로 QR코드를 스캔해주세요
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            카메라 앱 또는 카카오페이 앱에서 스캔 가능합니다
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 하단 안내 메시지 */}
                        <div className="px-6 pb-6">
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    💡 후원금은 서버 유지비, 데이터 수집·분석, 서비스 개선에 사용됩니다.<br />
                                    금액에 상관없이 모든 후원에 감사드립니다!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
