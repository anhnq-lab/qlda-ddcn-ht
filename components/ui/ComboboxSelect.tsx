import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface ComboboxOption {
    value: string;
    label: string;
    sublabel?: string;
    avatar?: string;
    disabled?: boolean;
}

interface ComboboxSelectProps {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string, option: ComboboxOption | null) => void;
    placeholder?: string;
    allowCustom?: boolean;  // Cho phép nhập tự do nếu không match
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    /** Label hiển thị khi value được chọn nhưng không có trong options */
    displayValue?: string;
    clearable?: boolean;
}

const ComboboxSelect: React.FC<ComboboxSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    allowCustom = false,
    loading = false,
    disabled = false,
    className = '',
    displayValue,
    clearable = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [highlightIdx, setHighlightIdx] = useState(0);
    const uid = useId();

    // Tính label hiện tại
    const selectedOption = options.find(o => o.value === value);
    const currentLabel = selectedOption?.label ?? displayValue ?? (value || '');

    // Lọc options theo search
    const filtered = search.trim()
        ? options.filter(o =>
            o.label.toLowerCase().includes(search.toLowerCase()) ||
            o.sublabel?.toLowerCase().includes(search.toLowerCase())
        )
        : options;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [search, allowCustom]);

    const handleOpen = () => {
        if (disabled) return;
        setSearch('');
        setHighlightIdx(0);
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearch('');
        // Nếu allowCustom và search không rỗng → lưu custom value
    }, []);

    const handleSelect = (opt: ComboboxOption) => {
        if (opt.disabled) return;
        onChange(opt.value, opt);
        handleClose();
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('', null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) { if (e.key === 'Enter' || e.key === ' ') handleOpen(); return; }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIdx(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filtered[highlightIdx]) handleSelect(filtered[highlightIdx]);
                else if (allowCustom && search.trim()) {
                    onChange(search.trim(), { value: search.trim(), label: search.trim() });
                    handleClose();
                }
                break;
            case 'Escape':
                handleClose();
                break;
        }
    };

    // Scroll highlight into view
    useEffect(() => {
        const el = listRef.current?.children[highlightIdx] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
    }, [highlightIdx]);

    return (
        <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={`${uid}-listbox`}
                className={`
                    w-full flex items-center justify-between gap-2 px-3 py-2
                    border rounded-lg text-sm text-left transition-all
                    ${disabled
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : isOpen
                            ? 'border-primary-500 ring-2 ring-primary-500/20 bg-white dark:bg-slate-800 dark:border-primary-400'
                            : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                    }
                `}
            >
                <span className={`flex-1 truncate ${!currentLabel ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                    {currentLabel || placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {clearable && value && !disabled && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setHighlightIdx(0); }}
                                placeholder="Tìm kiếm..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <ul
                        ref={listRef}
                        id={`${uid}-listbox`}
                        role="listbox"
                        className="max-h-56 overflow-y-auto py-1"
                    >
                        {loading ? (
                            <li className="px-3 py-3 text-center text-sm text-slate-400">Đang tải...</li>
                        ) : filtered.length === 0 ? (
                            <li className="px-3 py-3 text-center text-sm text-slate-400">
                                {allowCustom && search.trim()
                                    ? <span>Nhấn <kbd className="px-1 bg-slate-100 rounded text-xs">Enter</kbd> để dùng "<b>{search}</b>"</span>
                                    : 'Không tìm thấy kết quả'}
                            </li>
                        ) : (
                            filtered.map((opt, idx) => (
                                <li
                                    key={opt.value}
                                    role="option"
                                    aria-selected={opt.value === value}
                                    onClick={() => handleSelect(opt)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2 cursor-pointer select-none transition-colors
                                        ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                                        ${idx === highlightIdx ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}
                                    `}
                                >
                                    {opt.avatar && (
                                        <img
                                            src={opt.avatar}
                                            alt=""
                                            className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${idx === highlightIdx ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {opt.label}
                                        </p>
                                        {opt.sublabel && (
                                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{opt.sublabel}</p>
                                        )}
                                    </div>
                                    {opt.value === value && (
                                        <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ComboboxSelect;
