/**
 * useProjectsRealtime — Supabase real-time subscription for projects table
 * 
 * Listens to INSERT, UPDATE, DELETE events on `projects` table.
 * When a change happens, invalidates React Query cache to refetch.
 * 
 * Usage: Call once at the top level (e.g., ProjectList).
 * All paginated queries will automatically refetch.
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PROJECTS_QUERY_KEY } from './usePaginatedProjects';
import { LEGACY_PROJECTS_QUERY_KEY } from './useProjects';

export function useProjectsRealtime() {
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        const channel = supabase
            .channel('projects-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'projects',
                },
                (_payload) => {
                    // Invalidate both query namespaces so paginated list
                    // views AND the legacy fetch-all consumers (widgets,
                    // dropdowns, NotificationCenter, GlobalSearch) refresh.
                    queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
                    queryClient.invalidateQueries({ queryKey: [LEGACY_PROJECTS_QUERY_KEY] });
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [queryClient]);
}
