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
import { EventFormPanel } from './components/EventFormPanel';
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
  startOfWeek: (date: any, options: any) => startOfWeek(date, { ...options, weekStartsOn: 1 }),
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

  const { openPanel, closePanel } = useSlidePanel();

  const openFormPanel = (event: AgencyEventWithAttendees | null, date?: Date) => {
    openPanel({
      id: 'event-form',
      title: event ? 'Cập nhật lịch' : 'Đăng ký lịch mới',
      icon: <CalendarIcon size={16} />,
      width: '50vw',
      component: () => (
        <EventFormPanel
          event={event}
          selectedDate={date}
          onClose={() => closePanel('event-form')}
        />
      ),
    });
  };

  const handleSelectSlot = (slotInfo: { start: Date, end: Date }) => {
    openFormPanel(null, slotInfo.start);
  };

  const handleSelectEvent = (event: any) => {
    // find the exact event from our data to get full info
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      openPanel({
        id: 'event-detail',
        title: 'Chi tiết lịch',
        icon: <FileText size={16} />,
        width: '50vw',
        component: () => (
          <EventSlidePanel
            event={fullEvent}
            onEdit={(e) => {
              closePanel('event-detail');
              openFormPanel(e);
            }}
            onClose={() => closePanel('event-detail')}
          />
        ),
      });
    }
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
    <div className="flex flex-col flex-1 h-full min-h-screen bg-slate-50/50 dark:bg-slate-900">
      {displayMode === 'lobby' ? (
        <div className="flex-1 w-full flex flex-col px-6 py-4">
          {/* Lobby Display Mini Controller */}
          <div className="bg-bg-surface p-2 px-4 rounded-2xl border border-border shadow-sm flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-txt-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Lịch cơ quan (Tivi sảnh)
            </span>
            <div className="flex items-center bg-bg-muted border border-border p-0.5 rounded-lg gap-0.5">
              <button
                onClick={() => setDisplayMode('manage')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 text-txt-muted hover:text-txt-primary hover:bg-bg-subtle/50 cursor-pointer"
              >
                Quản lý
              </button>
              <button
                onClick={() => setDisplayMode('lobby')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 bg-bg-surface text-txt-primary border border-border/50 shadow-sm cursor-pointer"
              >
                Tivi Sảnh
              </button>
            </div>
          </div>
          <LobbyDisplay events={events} />
        </div>
      ) : (
        <div className="px-6 py-4 flex-1 w-full flex flex-col">
          {isLoading ? (
            <div className="flex justify-center items-center flex-1 min-h-[600px]">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="flex-1 w-full min-h-[600px] dnd-calendar-wrapper">
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
                      displayMode={displayMode}
                      setDisplayMode={setDisplayMode}
                      onRegisterClick={() => openFormPanel(null)}
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


    </div>
  );
}
