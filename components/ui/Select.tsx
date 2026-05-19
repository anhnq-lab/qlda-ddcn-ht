import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ========================================
// SELECT / COMBOBOX COMPONENT - Design System v2 (Radix UI Powered)
// ========================================

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export interface SelectProps {
    options: SelectOption[];
    value?: string | number | (string | number)[];
    onChange?: (value: string | number | (string | number)[]) => void;
    placeholder?: string;
    label?: string;
    helperText?: string;
    error?: string;
    disabled?: boolean;
    searchable?: boolean;
    multiple?: boolean;
    clearable?: boolean;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    className?: string;
}

const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
};

export const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    label,
    helperText,
    error,
    disabled = false,
    searchable = false,
    multiple = false,
    clearable = false,
    size = 'md',
    fullWidth = true,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const hasError = !!error;

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
        } else if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen, searchable]);

    const filteredOptions = searchable
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const selectedOptions = Array.isArray(value)
        ? options.filter(opt => value.includes(opt.value))
        : options.find(opt => opt.value === value);

    const handleSelect = useCallback((option: SelectOption) => {
        if (option.disabled) return;

        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(option.value)
                ? currentValues.filter(v => v !== option.value)
                : [...currentValues, option.value];
            onChange?.(newValues);
        } else {
            onChange?.(option.value);
            setIsOpen(false);
        }
    }, [multiple, value, onChange]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.(multiple ? [] : '');
    };

    const displayValue = () => {
        if (multiple) {
            const selected = Array.isArray(selectedOptions) ? selectedOptions : [];
            if (selected.length === 0) return placeholder;
            if (selected.length === 1) return selected[0].label;
            return `${selected.length} đã chọn`;
        }
        return (selectedOptions as SelectOption)?.label || placeholder;
    };

    const hasValue = multiple
        ? Array.isArray(value) && value.length > 0
        : value !== undefined && value !== '';

    return (
        <div className={cn("relative", fullWidth && "w-full", className)}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {label}
                </label>
            )}

            <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                            "w-full flex items-center justify-between gap-2",
                            "bg-white dark:bg-[#151d2e] border rounded-xl",
                            "text-left transition-all duration-200",
                            "focus:outline-none focus:ring-2",
                            "disabled:bg-slate-50 dark:disabled:bg-[#151d2e] disabled:text-slate-500 disabled:cursor-not-allowed",
                            sizeStyles[size],
                            isOpen ? "ring-2 ring-primary-100 dark:ring-primary-900 border-primary-500" : "",
                            hasError
                                ? "border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-900"
                                : "border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-100 dark:focus:ring-primary-900"
                        )}
                    >
                        <span className={cn("truncate", hasValue ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-400")}>
                            {displayValue()}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                            {clearable && hasValue && (
                                <span
                                    onClick={handleClear}
                                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                                >
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                            )}
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                        </div>
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        sideOffset={4}
                        align="start"
                        style={{ width: 'var(--radix-popover-trigger-width)' }}
                        onOpenAutoFocus={(e) => {
                            if (searchable) {
                                e.preventDefault();
                                inputRef.current?.focus();
                            }
                        }}
                        className={cn(
                            "z-[70] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-dropdown overflow-hidden",
                            "animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 duration-200"
                        )}
                    >
                        {/* Search Input */}
                        {searchable && (
                            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm kiếm..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border-0 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto scrollbar-thin">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                    Không tìm thấy kết quả
                                </div>
                            ) : (
                                filteredOptions.map((option) => {
                                    const isSelected = multiple
                                        ? Array.isArray(value) && value.includes(option.value)
                                        : value === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            disabled={option.disabled}
                                            onClick={() => handleSelect(option)}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors outline-none",
                                                option.disabled
                                                    ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                                    : "hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 focus:bg-slate-50 dark:bg-slate-800 dark:focus:bg-slate-800",
                                                isSelected
                                                    ? "bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 font-medium"
                                                    : "text-slate-700 dark:text-slate-300"
                                            )}
                                        >
                                            {multiple && (
                                                <div className={cn(
                                                    "w-4 h-4 border rounded flex flex-shrink-0 items-center justify-center transition-colors",
                                                    isSelected
                                                        ? "bg-primary-500 border-primary-500 text-white"
                                                        : "border-slate-300 dark:border-slate-600"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </div>
                                            )}
                                            {option.icon && <span className="shrink-0">{option.icon}</span>}
                                            <span className="flex-1 truncate">{option.label}</span>
                                            {!multiple && isSelected && (
                                                <Check className="w-4 h-4 text-primary-500 shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>

            {/* Helper/Error Text */}
            {(error || helperText) && (
                <p className={cn("mt-1.5 text-xs", hasError ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400")}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default Select;
