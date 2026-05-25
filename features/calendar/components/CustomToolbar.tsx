import React from 'react';
import { ToolbarProps, View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight, FilterX, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { AgencyEventType, AgencyEventRoom } from '@/types/calendar.types';

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
        <div className="flex items-center gap-2">
          <div className="w-36">
            <Select
              size="sm"
              placeholder="Loại sự kiện..."
              options={[
                { value: 'meeting',        label: 'Họp nội bộ' },
                { value: 'business_trip',  label: 'Đi công tác' },
                { value: 'internal_event', label: 'Sự kiện nội bộ' },
                { value: 'other',          label: 'Khác' },
              ]}
              value={filterType}
              onChange={(val) => setFilterType(val as AgencyEventType)}
              clearable
            />
          </div>
          <div className="w-36">
            <Select
              size="sm"
              placeholder="Phòng họp..."
              options={[
                { value: 'Phòng họp 1', label: 'Phòng họp 1' },
                { value: 'Phòng họp 2', label: 'Phòng họp 2' },
                { value: 'Phòng họp 3', label: 'Phòng họp 3' },
              ]}
              value={filterRoom}
              onChange={(val) => setFilterRoom(val as AgencyEventRoom)}
              clearable
            />
          </div>
          
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters} 
              className="text-txt-muted hover:text-txt-primary px-1.5 h-8 w-8 flex items-center justify-center cursor-pointer"
              title="Xóa bộ lọc"
            >
              <FilterX className="w-4 h-4" />
            </Button>
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
