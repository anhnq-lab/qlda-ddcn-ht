// Design System — UI Primitives v2.2
// Single import point: import { Button, Badge, Modal, ... } from '@/components/ui'

// ── Badge ─────────────────────────────────────────────────────
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant as SimpleBadgeVariant } from './Badge';

// ── Button ────────────────────────────────────────────────────
export { Button, IconButton, ButtonGroup } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, IconButtonProps } from './Button';

export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardVariant, CardPadding } from './Card';

export { Input, Textarea, Checkbox, Radio } from './Input';
export type { InputProps, InputSize, TextareaProps, CheckboxProps, RadioProps } from './Input';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { Modal, ConfirmDialog } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

// DataTable — unified table component (đã hợp nhất Table)
export { default as DataTable } from './DataTable';
export type { Column, SortConfig, SortDirection } from './DataTable';

// Table — Atomic Components (for complex tables like rowSpan/colSpan/grouping)
export {
    TableContainer,
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TablePagination
} from './Table';

export {
    Skeleton,
    SkeletonText,
    SkeletonCard,
    TableSkeleton,
    SkeletonStatCard,
    SkeletonAvatarGroup
} from './Skeleton';
export type { SkeletonProps, SkeletonVariant } from './Skeleton';

// Shared UI Components (v2.1 — đóng gói)
export { SectionHeader } from './SectionHeader';
export type { SectionHeaderProps, SectionHeaderSize } from './SectionHeader';

export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps, BadgeVariant, BadgeSize } from './StatusBadge';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps, ProgressBarColor, ProgressBarSize } from './ProgressBar';

export { ViewToggle } from './ViewToggle';
export type { ViewToggleProps, ViewMode } from './ViewToggle';

export { Toolbar } from './Toolbar';
export type { ToolbarProps } from './Toolbar';

// ─── LAYOUT COMPONENTS (v2.1 — mới) ─────────────────────────
export { PageHeader } from './PageHeader';
export type { PageHeaderProps, BreadcrumbItem, PageHeaderAction } from './PageHeader';

export { FilterBar } from './FilterBar';
export type { FilterBarProps, FilterBarFilter, FilterOption } from './FilterBar';

export { FilterChip } from './FilterChip';
export type { FilterChipProps, FilterChipOption } from './FilterChip';

export { DetailLayout, TabNav } from './DetailLayout';
export type { DetailLayoutProps, TabNavProps, TabItem } from './DetailLayout';

export { FormSection, FormField } from './FormSection';
export type { FormSectionProps, FormFieldProps } from './FormSection';

// StatCard — unified, re-exported from common
export { StatCard } from '../common/StatCard';
export type { StatCardColor } from '../common/StatCard';

// ── Dropdown Menu (Radix wrapper) ─────────────────────────────
export {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
    DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
    DropdownMenuSubTrigger, DropdownMenuRadioGroup,
} from './DropdownMenu';

// ── Popover (Radix wrapper) ───────────────────────────────────
export { Popover, PopoverTrigger, PopoverContent, PopoverClose, PopoverAnchor } from './Popover';

// ── Slide Panel ───────────────────────────────────────────────
export { SlidePanelContainer } from './SlidePanel';

// ── Combobox ──────────────────────────────────────────────────
export { default as ComboboxSelect } from './ComboboxSelect';
export type { ComboboxOption } from './ComboboxSelect';

// ── Page Loading ──────────────────────────────────────────────
export { default as PageLoadingFallback } from './PageLoadingFallback';

// ── EmptyState (standalone) ───────────────────────────────────
export { EmptyState as EmptyStateFull } from './EmptyState';

// ── Legacy (backward compat) ──────────────────────────────────
export { LoadingSpinner, CardSkeleton, TableRowSkeleton } from './LoadingSpinner';
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorMessage, EmptyState } from './ErrorMessage';

// ── Avatar (new) ──────────────────────────────────────────────
export { Avatar, getInitials } from './Avatar';

