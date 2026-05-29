import React, { useState, useEffect, useRef } from 'react';
import { ToolbarProps, View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight, Plus, Calendar, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AgencyEventType, AgencyEventRoom } from '@/types/calendar.types';

interface ChipOption { value: string; label: string; hex?: string }

interface ChipSelectProps {
  label: string;
  value: string;
  options: ChipOption[];
  onChange: (val: string) => void;
}

const ChipSelect: React.FC<ChipSelectProps> = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = value !== '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedLabel = options.find(o => o.value === value)?.label ?? label;
  const selectedHex = options.find(o => o.value === value)?.hex;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold
          border transition-all duration-150 cursor-pointer select-none whitespace-nowrap
          ${isActive
            ? 'bg-bg-surface border-primary-500 dark:border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
            : 'bg-bg-surface border-border dark:border-slate-600 text-txt-secondary hover:bg-bg-hover-row'
          }
        `}
      >
        {isActive && selectedHex && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedHex }} />
        )}
        <span>{isActive ? selectedLabel : label}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="
          absolute top-full left-0 mt-1.5 min-w-[180px] max-h-72 overflow-y-auto
          bg-bg-surface rounded-xl shadow-xl border border-border
          py-1.5 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150
        ">
          {options.map(opt => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left
                  transition-colors cursor-pointer
                  ${selected
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-txt-secondary hover:bg-bg-hover-row'
                  }
                `}
              >
                {opt.hex && (
                  <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/50" style={{ backgroundColor: opt.hex }} />
                )}
                <span className="flex-1 truncate">{opt.label}</span>
                {selected && <span className="text-primary-600 dark:text-primary-400 text-[10px] font-bold ml-1">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export interface CustomToolbarProps extends ToolbarProps {
  filterType: AgencyEventType | '';
  setFilterType: (val: AgencyEventType | '') => void;
  filterRoom: AgencyEventRoom | '';
  setFilterRoom: (val: AgencyEventRoom | '') => void;
  clearFilters: () => void;
  displayMode?: 'manage' | 'lobby';
  setDisplayMode?: (mode: 'manage' | 'lobby') => void;
  onRegisterClick?: () => void;
}

export const CustomToolbar: React.FC<CustomToolbarProps> = (props) => {
  const { 
    label, 
    onNavigate, 
    onView, 
    view, 
    views,
    filterType,
    setFilterType,
    filterRoom,
    setFilterRoom,
    clearFilters,
    displayMode,
    setDisplayMode,
    onRegisterClick
  } = props;

  const goToBack = () => onNavigate('PREV');
  const goToNext = () => onNavigate('NEXT');
  const goToCurrent = () => onNavigate('TODAY');

  const hasActiveFilters = filterType !== '' || filterRoom !== '';

  return (
    <div className="bg-bg-surface p-2.5 pr-4 pl-4 rounded-2xl border border-border shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4 mb-5">
      {/* Left: Navigation & Filters */}
      <div className="flex flex-wrap items-center gap-3 flex-1 w-full lg:w-auto">
        {/* Page Title */}
        <div className="hidden md:flex items-center gap-2 text-txt-primary shrink-0">
          <Calendar className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-bold tracking-tight">
            Lịch cơ quan
          </span>
        </div>
        <div className="h-5 w-px bg-border hidden md:block mr-0.5"></div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToCurrent} 
            className="font-semibold text-txt-secondary border-border hover:bg-bg-muted h-8 text-xs px-2.5"
          >
            Hôm nay
          </Button>
          <div className="flex items-center gap-1">
            <button 
              onClick={goToBack}
              className="p-1.5 rounded-full text-txt-muted hover:text-txt-primary hover:bg-bg-muted border border-transparent hover:border-border transition-all cursor-pointer"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={goToNext}
              className="p-1.5 rounded-full text-txt-muted hover:text-txt-primary hover:bg-bg-muted border border-transparent hover:border-border transition-all cursor-pointer"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h2 className="text-sm font-bold text-txt-primary capitalize tracking-tight px-1 whitespace-nowrap min-w-[120px]">
          {label}
        </h2>

        <div className="h-5 w-px bg-border hidden sm:block"></div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Sliders icon and count */}
          <div className="flex items-center gap-1 mr-0.5">
            <SlidersHorizontal className={`w-3.5 h-3.5 ${hasActiveFilters ? 'text-primary-500' : 'text-txt-placeholder'}`} />
            {((filterType !== '' ? 1 : 0) + (filterRoom !== '' ? 1 : 0)) > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center">
                {(filterType !== '' ? 1 : 0) + (filterRoom !== '' ? 1 : 0)}
              </span>
            )}
          </div>

          <ChipSelect
            label="Loại sự kiện"
            value={filterType}
            options={[
              { value: '',               label: 'Tất cả loại sự kiện' },
              { value: 'meeting',        label: 'Họp nội bộ', hex: '#3b82f6' },
              { value: 'business_trip',  label: 'Đi công tác', hex: '#f59e0b' },
              { value: 'internal_event', label: 'Sự kiện nội bộ', hex: '#a855f7' },
              { value: 'other',          label: 'Khác', hex: '#64748b' },
            ]}
            onChange={(val) => setFilterType(val as AgencyEventType | '')}
          />

          <ChipSelect
            label="Phòng họp"
            value={filterRoom}
            options={[
              { value: '',            label: 'Tất cả phòng họp' },
              { value: 'Phòng họp 1', label: 'Phòng họp 1', hex: '#10b981' },
              { value: 'Phòng họp 2', label: 'Phòng họp 2', hex: '#10b981' },
              { value: 'Phòng họp 3', label: 'Phòng họp 3', hex: '#10b981' },
            ]}
            onChange={(val) => setFilterRoom(val as AgencyEventRoom | '')}
          />

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              title="Xóa tất cả bộ lọc"
              className="flex items-center gap-1 h-8 px-2 rounded-lg text-[11px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Right: View Switcher, Mode Switcher & Register Button */}
      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0 w-full lg:w-auto">
        {/* View Switcher */}
        <div className="flex items-center bg-bg-muted border border-border p-0.5 rounded-lg gap-0.5">
          {(views as View[]).map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all duration-200 cursor-pointer ${
                view === v 
                  ? 'bg-bg-surface text-txt-primary border border-border/50 shadow-sm' 
                  : 'text-txt-muted hover:text-txt-primary hover:bg-bg-subtle/50 border border-transparent'
              }`}
            >
              {v === 'month' ? 'Tháng' : v === 'week' ? 'Tuần' : v === 'day' ? 'Ngày' : 'Lịch trình'}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border hidden lg:block"></div>

        {/* Display Mode (Manage / Lobby) */}
        {displayMode && setDisplayMode && (
          <div className="flex items-center bg-bg-muted border border-border p-0.5 rounded-lg gap-0.5">
            <button
              onClick={() => setDisplayMode('manage')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                displayMode === 'manage' 
                  ? 'bg-bg-surface text-txt-primary border border-border/50 shadow-sm' 
                  : 'text-txt-muted hover:text-txt-primary hover:bg-bg-subtle/50 border border-transparent'
              }`}
            >
              Quản lý
            </button>
            <button
              onClick={() => setDisplayMode('lobby')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                displayMode === 'lobby' 
                  ? 'bg-bg-surface text-txt-primary border border-border/50 shadow-sm' 
                  : 'text-txt-muted hover:text-txt-primary hover:bg-bg-subtle/50 border border-transparent'
              }`}
            >
              Tivi Sảnh
            </button>
          </div>
        )}

        {/* Register Button */}
        {onRegisterClick && (
          <Button 
            onClick={onRegisterClick}
            leftIcon={<Plus className="w-3.5 h-3.5 shrink-0" />}
            className="h-8 text-xs font-bold whitespace-nowrap cursor-pointer px-3"
          >
            Đăng ký lịch
          </Button>
        )}
      </div>
    </div>
  );
};
