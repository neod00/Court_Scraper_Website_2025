'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            children={content}
            components={{
                // Headings
                h2: ({ children }) => (
                    <h2 className="text-2xl font-extrabold text-[#161616] mt-10 mb-4 pb-3 border-b-2 border-[#161616] flex items-center gap-2">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-xl font-bold text-[#161616] mt-8 mb-3 flex items-center gap-2">
                        {children}
                    </h3>
                ),
                // Paragraphs
                p: ({ children }) => (
                    <p className="text-[#2E2B27] leading-[1.85] mb-4 text-[15px]">
                        {children}
                    </p>
                ),
                // Strong
                strong: ({ children }) => (
                    <strong className="font-bold text-[#161616]">{children}</strong>
                ),
                // Blockquotes - styled as callout boxes
                blockquote: ({ children }) => (
                    <div className="my-6 bg-[#D7E7DF] border-l-4 border-[#161616] rounded-none px-5 py-4">
                        <div className="text-[#2E2B27] text-[15px] leading-relaxed [&>p]:mb-0">
                            {children}
                        </div>
                    </div>
                ),
                // Tables
                table: ({ children }) => (
                    <div className="overflow-x-auto my-6 rounded-none border border-[#161616]">
                        <table className="w-full text-sm">
                            {children}
                        </table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-[#161616] text-white text-xs uppercase tracking-wider">
                        {children}
                    </thead>
                ),
                th: ({ children }) => (
                    <th className="px-4 py-3 text-left font-semibold">{children}</th>
                ),
                tbody: ({ children }) => (
                    <tbody className="divide-y divide-[#C9C2B4]">{children}</tbody>
                ),
                tr: ({ children }) => (
                    <tr className="hover:bg-[#F4F0E6] transition-colors">{children}</tr>
                ),
                td: ({ children }) => (
                    <td className="px-4 py-3 text-[#2E2B27] font-medium">{children}</td>
                ),
                // Horizontal rules
                hr: () => (
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px" />
                        <span className="text-[#8A8478] text-xs">◆</span>
                        <div className="flex-1 h-px" />
                    </div>
                ),
                // Unordered lists
                ul: ({ children }) => {
                    // Check if it contains checkbox items (task list)
                    const childArray = Array.isArray(children) ? children : [children];
                    const hasCheckbox = childArray.some((child: any) =>
                        child?.props?.children?.toString?.()?.includes?.('[') ||
                        child?.props?.className?.includes?.('task-list')
                    );

                    return (
                        <ul className={`my-4 space-y-2 ${hasCheckbox ? '' : 'list-none'}`}>
                            {children}
                        </ul>
                    );
                },
                li: ({ children, ...props }) => {
                    const content = children?.toString?.() || '';
                    const checked = (props as any).checked;

                    // Task list items
                    if (checked !== undefined && checked !== null) {
                        return (
                            <li className="flex items-start gap-3 bg-[#F4F0E6] rounded-none px-4 py-3 border border-[#C9C2B4]">
                                <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-none border-2 flex items-center justify-center ${checked ? 'bg-[#161616] border-[#161616] text-white' : 'border-[#161616] bg-[#FAF7EC]'}`}>
                                    {checked && <span className="text-xs">✓</span>}
                                </span>
                                <span className="text-[#2E2B27] text-[15px] leading-relaxed">{children}</span>
                            </li>
                        );
                    }

                    // Regular list items with emoji bullet detection
                    return (
                        <li className="flex items-start gap-2 text-[#2E2B27] text-[15px] leading-relaxed pl-1">
                            {!content.match(/^[📍💰✨🥇🥈🥉]/) && (
                                <span className="text-[#1F3D7A] mt-1.5 flex-shrink-0">•</span>
                            )}
                            <span>{children}</span>
                        </li>
                    );
                },
                // Links
                a: ({ href, children }) => (
                    <a href={href} className="text-[#1F3D7A] hover:text-[#1F3D7A] underline decoration-indigo-200 hover:decoration-indigo-400 transition-colors font-medium" target="_blank" rel="noopener noreferrer">
                        {children}
                    </a>
                ),
                // Inline code
                code: ({ children }) => (
                    <code className="bg-[#E9E4D8] text-[#1F3D7A] px-1.5 py-0.5 rounded-none text-sm font-mono">
                        {children}
                    </code>
                ),
            }}
        />
    );
}
