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
                    <h2 className="text-2xl font-extrabold text-gray-900 mt-10 mb-4 pb-3 border-b-2 border-indigo-100 flex items-center gap-2">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3 flex items-center gap-2">
                        {children}
                    </h3>
                ),
                // Paragraphs
                p: ({ children }) => (
                    <p className="text-gray-700 leading-[1.85] mb-4 text-[15px]">
                        {children}
                    </p>
                ),
                // Strong
                strong: ({ children }) => (
                    <strong className="font-bold text-gray-900">{children}</strong>
                ),
                // Blockquotes - styled as callout boxes
                blockquote: ({ children }) => (
                    <div className="my-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-400 rounded-r-xl px-5 py-4 shadow-sm">
                        <div className="text-gray-700 text-[15px] leading-relaxed [&>p]:mb-0">
                            {children}
                        </div>
                    </div>
                ),
                // Tables
                table: ({ children }) => (
                    <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 shadow-sm">
                        <table className="w-full text-sm">
                            {children}
                        </table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-xs uppercase tracking-wider">
                        {children}
                    </thead>
                ),
                th: ({ children }) => (
                    <th className="px-4 py-3 text-left font-semibold">{children}</th>
                ),
                tbody: ({ children }) => (
                    <tbody className="divide-y divide-gray-100">{children}</tbody>
                ),
                tr: ({ children }) => (
                    <tr className="hover:bg-gray-50 transition-colors">{children}</tr>
                ),
                td: ({ children }) => (
                    <td className="px-4 py-3 text-gray-700 font-medium">{children}</td>
                ),
                // Horizontal rules
                hr: () => (
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                        <span className="text-gray-300 text-xs">◆</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
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
                            <li className="flex items-start gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                                <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                                    {checked && <span className="text-xs">✓</span>}
                                </span>
                                <span className="text-gray-700 text-[15px] leading-relaxed">{children}</span>
                            </li>
                        );
                    }

                    // Regular list items with emoji bullet detection
                    return (
                        <li className="flex items-start gap-2 text-gray-700 text-[15px] leading-relaxed pl-1">
                            {!content.match(/^[📍💰✨🥇🥈🥉]/) && (
                                <span className="text-indigo-400 mt-1.5 flex-shrink-0">•</span>
                            )}
                            <span>{children}</span>
                        </li>
                    );
                },
                // Links
                a: ({ href, children }) => (
                    <a href={href} className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-200 hover:decoration-indigo-400 transition-colors font-medium" target="_blank" rel="noopener noreferrer">
                        {children}
                    </a>
                ),
                // Inline code
                code: ({ children }) => (
                    <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                    </code>
                ),
            }}
        />
    );
}
