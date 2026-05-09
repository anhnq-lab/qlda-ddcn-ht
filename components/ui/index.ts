// UI Components - Design System v2.1
// Export all reusable UI components

// Core Components
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

// Table — backward compat alias → DataTable
export { Table, TablePagination } from './Table';

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

export { DetailLayout, TabNav } from './DetailLayout';
export type { DetailLayoutProps, TabNavProps, TabItem } from './DetailLayout';

export { FormSection, FormField } from './FormSection';
export type { FormSectionProps, FormFieldProps } from './FormSection';

// StatCard — unified, re-exported from common
export { StatCard } from '../common/StatCard';
export type { StatCardColor } from '../common/StatCard';

// Legacy Components (for backwards compatibility)
export { LoadingSpinner, CardSkeleton, TableRowSkeleton } from './LoadingSpinner';
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorMessage, EmptyState } from './ErrorMessage';
