import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, FilterX } from 'lucide-react';
import { Select } from '@/components/ui/Select';

import { useEvents } from '@/hooks/useCalendar';
import { AgencyEventWithAttendees, AgencyEventType, AgencyEventRoom } from '@/types/calendar.types';
import { EventFormModal } from './components/EventFormModal';
import { EventDetailPanel } from './components/EventDetailPanel';
import { LobbyDisplay } from './components/LobbyDisplay';
import { Monitor, Calendar as CalendarIcon } from 'lucide-react';

const locales = {
  'vi': vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarView() {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  
  // Tab mode: 'manage' | 'lobby'
  const [displayMode, setDisplayMode] = useState<'manage' | 'lobby'>('manage');

  const [filterType, setFilterType] = useState<AgencyEventType | ''>('');
  const [filterRoom, setFilterRoom] = useState<AgencyEventRoom | ''>('');

  const { data: events = [], isLoading } = useEvents({
    type: filterType || undefined,
    roomId: filterRoom || undefined,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgencyEventWithAttendees | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | undefined>(undefined);

  const handleSelectSlot = (slotInfo: { start: Date, end: Date }) => {
    setSelectedSlot(slotInfo.start);
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    // find the exact event from our data to get full info
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
      setIsDetailOpen(true);
    }
  };

  const handleEditEvent = (event: AgencyEventWithAttendees) => {
    setSelectedEvent(event);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const mappedEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: new Date(e.start_time),
    end: new Date(e.end_time),
    resource: e,
  }));

  const eventStyleGetter = (event: any) => {
    const rawEvent = event.resource as AgencyEventWithAttendees;
    return {
      className: `agency-event agency-event-${rawEvent.event_type}`
    };
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterRoom('');
  };

  const hasActiveFilters = filterType !== '' || filterRoom !== '';

  return (
    <div className="flex flex-col h-full gap-4">
      <PageHeader 
        title="Lịch cơ quan" 
        description="Quản lý lịch họp, sự kiện, đi công tác của cơ quan"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setDisplayMode('manage')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${displayMode === 'manage' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <CalendarIcon className="w-4 h-4" />
                Quản lý
              </button>
              <button
                onClick={() => setDisplayMode('lobby')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${displayMode === 'lobby' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <Monitor className="w-4 h-4" />
                Tivi Sảnh
              </button>
            </div>
            
            {displayMode === 'manage' && (
              <Button 
                onClick={() => { setSelectedEvent(null); setSelectedSlot(undefined); setIsFormOpen(true); }}
                leftIcon={<Plus className="w-4 h-4 shrink-0" />}
                className="whitespace-nowrap"
              >
                Đăng ký lịch
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Toolbar (Only show in Manage mode) */}
      {displayMode === 'manage' && (
        <Card className="p-3 flex flex-wrap items-center gap-3">
        <div className="w-48">
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
        <div className="w-48">
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
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
            <FilterX className="w-4 h-4 mr-1.5" /> Bỏ lọc
          </Button>
        )}
      </Card>
      )}

      {displayMode === 'lobby' ? (
        <div className="flex-1 w-full min-h-[800px]">
          <LobbyDisplay events={events} />
        </div>
      ) : (
        <Card className="flex-1 p-4 min-h-[800px] flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center h-full min-h-[800px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="flex-1 w-full h-full min-h-[800px]">
            <Calendar
              localizer={localizer}
              events={mappedEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 800 }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              selectable
              dayLayoutAlgorithm="no-overlap"
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              culture="vi"
              messages={{
                next: "Tiếp",
                previous: "Trước",
                today: "Hôm nay",
                month: "Tháng",
                week: "Tuần",
                day: "Ngày",
                agenda: "Lịch trình",
                date: "Ngày",
                time: "Thời gian",
                event: "Sự kiện",
                noEventsInRange: "Không có sự kiện nào trong thời gian này."
              }}
            />
          </div>
        )}
      </Card>
      )}

      {/* Modals & Panels */}
      <EventFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        event={selectedEvent}
        selectedDate={selectedSlot}
      />
      
      <EventDetailPanel 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        event={selectedEvent}
        onEdit={handleEditEvent}
      />
    </div>
  );
}
