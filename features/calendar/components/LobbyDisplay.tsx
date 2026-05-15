import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Monitor } from 'lucide-react';
import { AgencyEventWithAttendees } from '@/types/calendar.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface LobbyDisplayProps {
  events: AgencyEventWithAttendees[];
}

export const LobbyDisplay: React.FC<LobbyDisplayProps> = ({ events }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayEvents = events
    .filter(e => e.event_type === 'meeting' || e.event_type === 'business_trip')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const groupedEvents = displayEvents.reduce((acc, event) => {
    const dateStr = format(new Date(event.start_time), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, AgencyEventWithAttendees[]>);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'blue';
      case 'business_trip': return 'orange';
      default: return 'gray';
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'meeting': return 'Họp nội bộ';
      case 'business_trip': return 'Đi công tác';
      default: return 'Sự kiện';
    }
  };

  return (
    <div className="w-full h-full min-h-[800px] flex flex-col bg-bg-base rounded-2xl overflow-hidden shadow-sm border border-border relative">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-border p-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <Monitor className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400 leading-tight">
              LỊCH CÔNG TÁC & HỘI HỌP
            </h1>
            <p className="text-text-secondary text-sm font-medium tracking-wide">
              Ban QLDA Đầu tư Xây dựng Dân dụng và Công nghiệp
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-4xl font-black text-text-primary tracking-tighter leading-none">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-base text-primary-600 dark:text-primary-400 font-medium mt-1 capitalize">
            {format(currentTime, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-5 bg-bg-base">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <CalendarIcon className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-xl font-medium">Không có lịch họp hoặc đi công tác nào sắp tới</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => {
              const isToday = dateStr === format(currentTime, 'yyyy-MM-dd');
              const dayDate = new Date(dateStr);
              
              return (
                <div key={dateStr} className="animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className={`text-lg font-bold ${isToday ? 'text-warning-600 dark:text-warning-400' : 'text-primary-600 dark:text-primary-400'} uppercase tracking-wider`}>
                      {isToday ? 'Hôm nay' : format(dayDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </h2>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {dayEvents.map(event => {
                      const startDate = new Date(event.start_time);
                      const endDate = new Date(event.end_time);
                      const typeColor = getEventTypeColor(event.event_type);
                      
                      return (
                        <div key={event.id} style={{ borderLeftColor: typeColor === 'blue' ? 'var(--color-primary-500, #3b82f6)' : '#f97316' }}>
                        <Card className="border-l-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                          <div className="p-4 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                              <Badge variant={typeColor as any} className="text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider">
                                {getEventTypeName(event.event_type)}
                              </Badge>
                              <div className="flex items-center text-text-primary font-mono text-base bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-border shadow-sm">
                                <Clock className="w-4 h-4 mr-1.5 text-primary-500" />
                                <span className="font-bold">{format(startDate, 'HH:mm')}</span>
                                <span className="mx-1.5 text-text-muted">-</span>
                                <span>{format(endDate, 'HH:mm')}</span>
                              </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-text-primary mb-3 leading-snug flex-1">
                              {event.title}
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-3 mt-auto">
                              {(event.room || event.location) && (
                                <div className="flex items-start">
                                  <div className="p-1.5 bg-slate-50 dark:bg-slate- rounded-md mr-2 border border-slate-100 dark:border-slate-700">
                                    <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-0.5">Địa điểm</p>
                                    <p className="text-sm text-text-primary font-medium line-clamp-2">
                                      {event.room ? event.room : event.location}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-start">
                                <div className="p-1.5 bg-slate-50 dark:bg-slate- rounded-md mr-2 border border-slate-100 dark:border-slate-700">
                                  <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-0.5">Tham dự</p>
                                  <p className="text-sm text-text-primary font-medium">
                                    {event.attendees && event.attendees.length > 0 
                                      ? `${event.attendees.length} người` 
                                      : 'Toàn cơ quan'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="flex flex-wrap gap-1.5">
                                  {event.attendees.map((emp: any, idx: number) => (
                                    <div key={emp.EmployeeID || idx} className="bg-slate-50 dark:bg-slate- px-2 py-0.5 rounded text-[11px] font-medium text-text-secondary flex items-center border border-border">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-1.5"></span>
                                      {emp.FullName || emp.full_name || 'Nhân viên'}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

