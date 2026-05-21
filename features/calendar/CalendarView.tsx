import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, FilterX } from 'lucide-react';
import { Select } from '@/components/ui/Select';

import { useEvents, useUpdateEvent } from '@/hooks/useCalendar';
import { AgencyEventWithAttendees, AgencyEventType, AgencyEventRoom } from '@/types/calendar.types';
import { EventFormModal } from './components/EventFormModal';
import { EventSlidePanel } from './components/EventSlidePanel';
import { LobbyDisplay } from './components/LobbyDisplay';
import { CustomToolbar } from './components/CustomToolbar';
import { Monitor, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { useSlidePanel } from '@/context/SlidePanelContext';

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

const DnDCalendar = withDragAndDrop(Calendar as any);

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

  const { mutate: updateEvent } = useUpdateEvent();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgencyEventWithAttendees | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | undefined>(undefined);
  const { openPanel, closePanel } = useSlidePanel();

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
      openPanel({
        id: 'event-detail',
        title: 'Chi tiết lịch',
        icon: <FileText size={16} />,
        width: '50vw',
        component: () => (
          <EventSlidePanel
            event={fullEvent}
            onEdit={(e) => {
              setSelectedEvent(e);
              closePanel('event-detail');
              setIsFormOpen(true);
            }}
            onClose={() => closePanel('event-detail')}
          />
        ),
      });
    }
  };

  const handleEditEvent = (event: AgencyEventWithAttendees) => {
    setSelectedEvent(event);
    closePanel('event-detail');
    setIsFormOpen(true);
  };

  const handleEventDrop = ({ event, start, end }: any) => {
    if (window.confirm('Bạn có chắc chắn muốn thay đổi thời gian sự kiện này?')) {
      updateEvent({
        id: event.id,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
    }
  };

  const handleEventResize = ({ event, start, end }: any) => {
    if (window.confirm('Bạn có chắc chắn muốn thay đổi thời gian sự kiện này?')) {
      updateEvent({
        id: event.id,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
    }
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
        className="calendar-page-header"
        title="Lịch cơ quan" 
        description="Quản lý lịch họp, sự kiện, đi công tác của cơ quan"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-bg-muted border border-border p-1 rounded-lg">
              <button
                onClick={() => setDisplayMode('manage')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  displayMode === 'manage' 
                    ? 'bg-bg-surface text-txt-primary border border-border shadow-sm' 
                    : 'text-txt-muted hover:text-txt-primary hover:bg-bg-subtle/50 border border-transparent'
                }`}
              >
                <CalendarIcon className="w-4.5 h-4.5" />
                Quản lý
              </button>
              <button
                onClick={() => setDisplayMode('lobby')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  displayMode === 'lobby' 
                    ? 'bg-bg-surface text-txt-primary border border-border shadow-sm' 
                    : 'text-txt-muted hover:text-txt-primary hover:bg-bg-subtle/50 border border-transparent'
                }`}
              >
                <Monitor className="w-4.5 h-4.5" />
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

      {/* Filter Toolbar is now inside CustomToolbar */}

      {displayMode === 'lobby' ? (
        <div className="flex-1 w-full min-h-[800px]">
          <LobbyDisplay events={events} />
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center flex-1 min-h-[600px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="flex-1 w-full min-h-[600px] dnd-calendar-wrapper px-4 pb-4">
            <DnDCalendar
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
              resizable
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              dayLayoutAlgorithm="no-overlap"
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: (toolbarProps) => (
                  <CustomToolbar
                    {...toolbarProps}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    filterRoom={filterRoom}
                    setFilterRoom={setFilterRoom}
                    clearFilters={clearFilters}
                  />
                )
              }}
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
        </div>
      )}

      {/* Modals & Panels */}
      <EventFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        event={selectedEvent}
        selectedDate={selectedSlot}
      />
    </div>
  );
}
