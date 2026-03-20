'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ViewTrackerProps {
    tableName: string;
    idColumn: string;
    idValue: string;
    initialCount?: number;
    showIcon?: boolean;
    className?: string;
}

export default function ViewTracker({
    tableName,
    idColumn,
    idValue,
    initialCount = 0,
    showIcon = true,
    className = ""
}: ViewTrackerProps) {
    const [count, setCount] = useState(initialCount);

    useEffect(() => {
        // Increment view count on page load (once per session per notice)
        const sessionKey = `viewed_${tableName}_${idValue}`;
        
        if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
            const incrementView = async () => {
                try {
                    // Call the universal RPC function
                    const { error } = await supabase.rpc('increment_content_view', {
                        table_name: tableName,
                        target_id_col: idColumn,
                        target_id_val: idValue
                    });
                    
                    if (!error) {
                        sessionStorage.setItem(sessionKey, 'true');
                        setCount(prev => prev + 1);
                    }
                } catch {
                    // Silently fail if RPC not yet created
                }
            };
            incrementView();
        }
    }, [tableName, idColumn, idValue]);

    return (
        <span className={`inline-flex items-center gap-1 text-xs ${className || "text-gray-400"}`}>
            {showIcon && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )}
            {(count || 0).toLocaleString()}
        </span>
    );
}
