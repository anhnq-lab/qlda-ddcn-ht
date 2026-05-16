import React from 'react';
import { ToolbarProps, View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { AgencyEventType, AgencyEventRoom } from '@/types/calendar.types';

export interface CustomToolbarProps extends ToolbarProps {
  filterType: AgencyEventType | '';
  setFilterType: (val: AgencyEventType | '') => void;
  filterRoom: AgencyEventRoom | '';
  setFilterRoom: (val: AgencyEventRoom | '') => void;
  clearFilters: () => void;
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
    clearFilters
  } = props;

  const goToBack = () => onNavigate('PREV');
  const goToNext = () => onNavigate('NEXT');
  const goToCurrent = () => onNavigate('TODAY');

  const hasActiveFilters = filterType !== '' || filterRoom !== '';

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
      {/* Left: Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={goToCurrent} className="font-medium text-slate-600 dark:text-slate-300">
          Hôm nay
        </Button>
        <div className="flex items-center gap-1">
          <button 
            onClick={goToBack}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={goToNext}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 ml-2 capitalize tracking-tight">
          {label}
        </h2>
      </div>

      {/* Right: Filters & View Switcher */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40">
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
        <div className="w-40">
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
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 px-2 h-9">
            <FilterX className="w-4 h-4" />
          </Button>
        )}

        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg gap-1">
          {(views as View[]).map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-200 ${
                view === v 
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {v === 'month' ? 'Tháng' : v === 'week' ? 'Tuần' : v === 'day' ? 'Ngày' : 'Lịch trình'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
