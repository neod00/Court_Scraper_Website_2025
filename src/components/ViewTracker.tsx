'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ViewTrackerProps {
    noticeId: string;
    initialCount: number;
}

export default function ViewTracker({ noticeId, initialCount }: ViewTrackerProps) {
    useEffect(() => {
        // Increment view count on page load (once per session per notice)
        const sessionKey = `viewed_${noticeId}`;
        if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
            const incrementView = async () => {
                try {
                    await supabase.rpc('increment_view_count', { target_id: noticeId });
                    sessionStorage.setItem(sessionKey, 'true');
                } catch {
                    // Silently fail if RPC not yet created
                }
            };
            incrementView();
        }
    }, [noticeId]);

    return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            조회 {(initialCount || 0).toLocaleString()}
        </span>
    );
}
