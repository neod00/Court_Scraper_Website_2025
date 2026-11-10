'use client';

// 홈 모션 부품 — 스크롤 등장(Reveal)과 숫자 올라가기(CountUp).
// 서버가 그린 HTML 은 처음부터 다 보이고 최종 숫자를 담는다(검색엔진·JS 꺼짐 대비).
// 브라우저에서 화면 아래에 있는 구역만 숨겼다가 보일 때 띄운다. '동작 줄이기' 설정이면 아무것도 하지 않는다.
// React 상태를 쓰지 않고 DOM 클래스·글자만 바꾼다(다시 그리기 없음).
import { useEffect, useRef, type ReactNode } from 'react';

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Reveal({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' }) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
        const show = () => el.classList.add('reveal-pending', 'is-revealed');
        // 이미 화면 안에 있으면 숨기지 않고 막대 채우기만 돌린다.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
            const t = window.setTimeout(show, 60);
            return () => window.clearTimeout(t);
        }
        el.classList.add('reveal-pending');
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    show();
                    io.disconnect();
                }
            },
            { rootMargin: '0px 0px -10% 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <Tag ref={ref as never} className={className || undefined}>
            {children}
        </Tag>
    );
}

export function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const final = value.toLocaleString('ko-KR');

    useEffect(() => {
        const el = ref.current;
        if (!el || prefersReducedMotion() || value <= 0) return;
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(value * eased).toLocaleString('ko-KR');
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        el.textContent = '0';
        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            el.textContent = final;
        };
    }, [value, duration, final]);

    return <span ref={ref} className="num">{final}</span>;
}
