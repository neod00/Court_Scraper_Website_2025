// 계산기 페이지 공용 부품(편집형 디자인). 상태가 없는 표시 부품이라 서버·클라이언트 어디서나 쓸 수 있다.
import Link from 'next/link';
import type { ReactNode } from 'react';

export const wonText = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

export function shortWonText(n: number): string {
    const v = Math.round(n);
    if (Math.abs(v) >= 100_000_000) {
        const eok = Math.floor(Math.abs(v) / 100_000_000);
        const man = Math.round((Math.abs(v) % 100_000_000) / 10_000);
        return `${v < 0 ? '−' : ''}${eok}억${man ? ` ${man.toLocaleString('ko-KR')}만` : ''} 원`;
    }
    if (Math.abs(v) >= 10_000) return `${v < 0 ? '−' : ''}${Math.round(Math.abs(v) / 10_000).toLocaleString('ko-KR')}만 원`;
    return wonText(v);
}

export const digits = (s: string) => Number(s.replace(/[^\d]/g, '')) || 0;
export const withComma = (s: string) => {
    const d = s.replace(/[^\d]/g, '');
    return d ? Number(d).toLocaleString('ko-KR') : '';
};

export function ToolHeader({ title, intro, checked }: { title: string; intro: ReactNode; checked?: string }) {
    return (
        <header className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-[#57534E] mb-6" aria-label="breadcrumb">
                <Link href="/" className="hover:underline">홈</Link>
                <span>/</span>
                <Link href="/tools" className="hover:underline">계산기</Link>
                <span>/</span>
                <span className="text-[#161616] font-medium">{title}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.05em]">{title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#3A3A3A] max-w-3xl">{intro}</p>
            {checked && <p className="mt-2 text-xs text-[#57534E]">규칙 확인일 {checked}</p>}
        </header>
    );
}

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-bold mb-1.5">{label}</label>
            {children}
            {hint && <p className="mt-1 text-xs text-[#57534E]">{hint}</p>}
        </div>
    );
}

const inputCls = 'w-full min-h-12 border border-[#161616] bg-[#FAF7EC] px-3 text-right text-base num focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#161616]';

export function MoneyInput({ id, value, onChange, placeholder = '0', unit = '원' }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; unit?: string }) {
    return (
        <div className="relative">
            <input id={id} type="text" inputMode="numeric" value={value} placeholder={placeholder} onChange={(e) => onChange(withComma(e.target.value))} className={`${inputCls} pr-10`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#57534E]">{unit}</span>
        </div>
    );
}

export function NumberInput({ id, value, onChange, unit, step = 'any', placeholder = '0' }: { id: string; value: string; onChange: (v: string) => void; unit?: string; step?: string; placeholder?: string }) {
    return (
        <div className="relative">
            <input id={id} type="text" inputMode="decimal" value={value} step={step} placeholder={placeholder} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))} className={`${inputCls} ${unit ? 'pr-11' : ''}`} />
            {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#57534E]">{unit}</span>}
        </div>
    );
}

export function Choice<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
    return (
        <div role="group" aria-label={label} className="grid" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
            {options.map((o, i) => (
                <button
                    key={o.value}
                    type="button"
                    aria-pressed={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={`min-h-11 px-2 text-sm font-bold border border-[#161616] ${i > 0 ? 'border-l-0' : ''} ${value === o.value ? 'bg-[#161616] text-[#FAF7EC]' : 'bg-[#FAF7EC] hover:bg-[#E9E4D8]'}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function Panels({ input, result }: { input: ReactNode; result: ReactNode }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section aria-label="입력" className="border border-[#161616] bg-[#FAF7EC] p-5 sm:p-6 space-y-5">{input}</section>
            <section aria-label="계산 결과" aria-live="polite" className="border border-[#161616] bg-[#161616] text-[#FAF7EC] p-5 sm:p-6">{result}</section>
        </div>
    );
}

export function ResultRows({ rows }: { rows: { label: string; value: string; strong?: boolean }[] }) {
    return (
        <dl className="space-y-2.5">
            {rows.map((r) => (
                <div key={r.label} className={`flex justify-between gap-4 ${r.strong ? 'border-t border-[#FAF7EC]/30 pt-3 mt-1' : ''}`}>
                    <dt className={r.strong ? 'font-bold' : 'text-[#CFC8B8]'}>{r.label}</dt>
                    <dd className={`num text-right ${r.strong ? 'text-2xl font-extrabold' : 'font-semibold'}`}>{r.value}</dd>
                </div>
            ))}
        </dl>
    );
}

export function EmptyResult({ text }: { text: string }) {
    return <p className="py-10 text-center text-[#CFC8B8]">{text}</p>;
}

export function Explain({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section aria-labelledby={id} className="mt-10">
            <h2 id={id} className="text-xl font-extrabold tracking-[-0.04em] pb-2 mb-4 border-b-2 border-[#161616]">{title}</h2>
            <div className="text-[15px] leading-relaxed text-[#2E2B27] space-y-3">{children}</div>
        </section>
    );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
    return (
        <div className="space-y-2">
            {items.map((f) => (
                <details key={f.q} className="border border-[#161616] bg-[#FAF7EC] p-4">
                    <summary className="font-bold cursor-pointer">{f.q}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-[#2E2B27]">{f.a}</p>
                </details>
            ))}
        </div>
    );
}

export function Limits({ items }: { items: string[] }) {
    return (
        <section className="mt-10 border border-[#161616] bg-[#F6F1C4] p-5">
            <h2 className="text-base font-extrabold mb-2">계산하지 않는 것</h2>
            <ul className="text-sm leading-relaxed space-y-1">
                {items.map((t) => <li key={t}>• {t}</li>)}
            </ul>
        </section>
    );
}

export function Related({ links }: { links: { href: string; label: string }[] }) {
    return (
        <div className="mt-8 flex flex-wrap gap-2">
            {links.map((l) => (
                <Link key={l.href} href={l.href} className="inline-flex items-center min-h-11 px-4 border border-[#161616] bg-[#FAF7EC] text-sm font-bold hover:bg-[#161616] hover:text-[#FAF7EC]">
                    {l.label} →
                </Link>
            ))}
        </div>
    );
}
