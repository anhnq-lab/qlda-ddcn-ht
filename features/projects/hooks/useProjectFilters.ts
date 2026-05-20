/**
 * useProjectFilters — Server-side filter state + URL sync + debounce search
 *
 * v2: No longer filters client-side. Instead builds QueryParams
 * that get pushed to useScopedProjects → server-side Supabase query.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectStatus, ProjectGroup, PROJECT_CURRENT_STATUS_CONFIG } from '../../../types';
import type { QueryParams } from '../../../types/api';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
export const STATUS_OPTIONS = [
    { val: 'all', label: 'Tất cả', hex: '#9CA3AF' },
    { val: ProjectStatus.Preparation.toString(), label: 'Chuẩn bị dự án', hex: '#3B82F6' },
    { val: ProjectStatus.Execution.toString(), label: 'Thực hiện dự án', hex: '#F97316' },
    { val: ProjectStatus.Completion.toString(), label: 'Kết thúc xây dựng', hex: '#10B981' },
] as const;

export const CURRENT_STATUS_OPTIONS = [
    { val: 'all', label: 'Tất cả', hex: '#9CA3AF' },
    ...Object.entries(PROJECT_CURRENT_STATUS_CONFIG).map(([code, s]) => ({
        val: code.toString(),
        label: `${code}. ${s.label}`,
        hex: s.hex
    }))
];

export const GROUP_OPTIONS = ['all', ProjectGroup.A, ProjectGroup.B, ProjectGroup.C] as const;

export const SPECIALTY_OPTIONS = [
    { val: 'all', label: 'Tất cả chuyên ngành' },
    { val: 'transport_urban', label: 'Giao thông & Đô thị' },
    { val: 'civil_industrial', label: 'Dân dụng & Công nghiệp' },
    { val: 'agriculture_rural', label: 'Nông nghiệp & PTNT' },
    { val: 'mixed', label: 'Hỗn hợp' },
    { val: 'other', label: 'Khác' }
] as const;

export type SortOption = 'name' | 'budget' | 'progress' | 'created';

// ═══════════════════════════════════════════════════════════════
// DEBOUNCE HOOK
// ═══════════════════════════════════════════════════════════════

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

// ═══════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════

export interface ProjectFiltersResult {
    // Raw input
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    // Filter state
    selectedStatus: string;
    setSelectedStatus: (s: string) => void;
    selectedCurrentStatus: string;
    setSelectedCurrentStatus: (s: string) => void;
    selectedGroup: string;
    setSelectedGroup: (g: string) => void;
    selectedBoard: string;
    setSelectedBoard: (b: string) => void;
    selectedSpecialty: string;
    setSelectedSpecialty: (s: string) => void;
    sortBy: SortOption;
    setSortBy: (s: SortOption) => void;
    // Pagination
    page: number;
    setPage: (p: number) => void;
    pageSize: number;
    // View mode
    viewMode: 'grid' | 'list';
    setViewMode: (m: 'grid' | 'list') => void;
    /** QueryParams to pass to useScopedProjects — server-side filtering */
    queryParams: QueryParams;
    // Actions
    clearFilters: () => void;
    hasActiveFilters: boolean;
}

export function useProjectFilters(defaultPageSize = 50): ProjectFiltersResult {
    const [searchParams, setSearchParams] = useSearchParams();
    const isInitRef = useRef(false);

    // ── State from URL or defaults ──
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
    const [selectedCurrentStatus, setSelectedCurrentStatus] = useState(searchParams.get('currentStatus') || 'all');
    const [selectedGroup, setSelectedGroup] = useState(searchParams.get('group') || 'all');
    const [selectedBoard, setSelectedBoard] = useState(searchParams.get('board') || 'all');
    const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'all');
    const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'created');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>((searchParams.get('view') as 'grid' | 'list') || 'grid');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

    // Debounced search for server query
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedStatus, selectedCurrentStatus, selectedGroup, selectedBoard, selectedSpecialty, sortBy]);

    // ── Sync state → URL (skip on first render) ──
    useEffect(() => {
        if (!isInitRef.current) {
            isInitRef.current = true;
            return;
        }
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (selectedStatus !== 'all') params.set('status', selectedStatus);
        if (selectedCurrentStatus !== 'all') params.set('currentStatus', selectedCurrentStatus);
        if (selectedGroup !== 'all') params.set('group', selectedGroup);
        if (selectedBoard !== 'all') params.set('board', selectedBoard);
        if (selectedSpecialty !== 'all') params.set('specialty', selectedSpecialty);
        if (sortBy !== 'created') params.set('sort', sortBy);
        if (viewMode !== 'grid') params.set('view', viewMode);
        if (page > 1) params.set('page', page.toString());
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, selectedStatus, selectedCurrentStatus, selectedGroup, selectedBoard, selectedSpecialty, sortBy, viewMode, page, setSearchParams]);

    // ── Build QueryParams for server-side query ──
    const queryParams = useMemo((): QueryParams => ({
        page,
        pageSize: defaultPageSize,
        search: debouncedSearch || undefined,
        sortBy: sortBy,
        sortOrder: sortBy === 'name' ? 'asc' : 'desc',
        filters: {
            ...(selectedStatus !== 'all' && { status: selectedStatus }),
            ...(selectedCurrentStatus !== 'all' && { currentStatus: selectedCurrentStatus }),
            ...(selectedGroup !== 'all' && { group: selectedGroup }),
            ...(selectedBoard !== 'all' && { board: selectedBoard }),
            ...(selectedSpecialty !== 'all' && { specialtyType: selectedSpecialty }),
        },
    }), [page, defaultPageSize, debouncedSearch, sortBy, selectedStatus, selectedCurrentStatus, selectedGroup, selectedBoard, selectedSpecialty]);

    // ── Actions ──
    const hasActiveFilters = debouncedSearch !== '' || selectedStatus !== 'all' || selectedCurrentStatus !== 'all' || selectedGroup !== 'all' || selectedBoard !== 'all' || selectedSpecialty !== 'all';

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedStatus('all');
        setSelectedCurrentStatus('all');
        setSelectedGroup('all');
        setSelectedBoard('all');
        setSelectedSpecialty('all');
        setPage(1);
    }, []);

    return {
        searchQuery, setSearchQuery,
        selectedStatus, setSelectedStatus,
        selectedCurrentStatus, setSelectedCurrentStatus,
        selectedGroup, setSelectedGroup,
        selectedBoard, setSelectedBoard,
        selectedSpecialty, setSelectedSpecialty,
        sortBy, setSortBy,
        page, setPage,
        pageSize: defaultPageSize,
        viewMode, setViewMode,
        queryParams,
        clearFilters, hasActiveFilters,
    };
}
