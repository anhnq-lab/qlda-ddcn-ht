import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgencyEventWithAttendees } from '@/types/calendar.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface LobbyDisplayProps {
  events: AgencyEventWithAttendees[];
}

export const LobbyDisplay: React.FC<LobbyDisplayProps> = ({ events }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const EVENTS_PER_PAGE = 4;

  const displayEvents = events
    .filter(e => e.event_type === 'meeting' || e.event_type === 'business_trip')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const totalPages = Math.ceil(displayEvents.length / EVENTS_PER_PAGE) || 1;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 12000); // 12 seconds per page
    return () => clearInterval(timer);
  }, [totalPages]);

  const currentEvents = displayEvents.slice(currentPage * EVENTS_PER_PAGE, (currentPage + 1) * EVENTS_PER_PAGE);

  const groupedEvents = currentEvents.reduce((acc, event) => {
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
    <div className="w-full h-full min-h-[800px] flex flex-col bg-bg-app rounded-2xl overflow-hidden shadow-sm border border-border relative">
      {/* Header */}
      <header className="bg-bg-surface border-b border-border p-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-500/10 rounded-lg">
            <Monitor className="w-6 h-6 text-primary-600 dark:text-primary-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400 leading-tight">
              LỊCH CÔNG TÁC & HỘI HỌP
            </h1>
            <p className="text-txt-secondary text-sm font-medium tracking-wide">
              Ban QLDA Đầu tư Xây dựng Dân dụng và Công nghiệp
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-4xl font-black text-txt-primary tracking-tighter leading-none">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-base text-primary-600 dark:text-primary-400 font-semibold mt-1 capitalize">
            {format(currentTime, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-5 bg-bg-app">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-txt-muted">
            <CalendarIcon className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-xl font-medium">Không có lịch họp hoặc đi công tác nào sắp tới</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-5 flex-1"
              >
                {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => {
                  const isToday = dateStr === format(currentTime, 'yyyy-MM-dd');
                  const dayDate = new Date(dateStr);
                  
                  return (
                    <div key={dateStr}>
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
                            <motion.div 
                              key={event.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              style={{ borderLeftColor: typeColor === 'blue' ? 'var(--color-primary-500, #3b82f6)' : '#f97316' }}
                            >
                            <Card className="bg-bg-surface border border-border border-l-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full">
                              <div className="p-4 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                  <Badge variant={typeColor as any} className="text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider">
                                    {getEventTypeName(event.event_type)}
                                  </Badge>
                                  <div className="flex items-center text-txt-primary font-mono text-base bg-bg-muted px-2.5 py-1 rounded-md border border-border shadow-sm">
                                    <Clock className="w-4 h-4 mr-1.5 text-primary-500" />
                                    <span className="font-bold">{format(startDate, 'HH:mm')}</span>
                                    <span className="mx-1.5 text-txt-muted">-</span>
                                    <span>{format(endDate, 'HH:mm')}</span>
                                  </div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-txt-primary mb-3 leading-snug flex-1">
                                  {event.title}
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                  {(event.room || event.location) && (
                                    <div className="flex items-start">
                                      <div className="p-1.5 bg-bg-muted rounded-md mr-2 border border-border">
                                        <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-txt-muted uppercase tracking-wider font-semibold mb-0.5">Địa điểm</p>
                                        <p className="text-sm text-txt-primary font-medium line-clamp-2">
                                          {event.room ? event.room : event.location}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-start">
                                    <div className="p-1.5 bg-bg-muted rounded-md mr-2 border border-border">
                                      <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-txt-muted uppercase tracking-wider font-semibold mb-0.5">Tham dự</p>
                                      <p className="text-sm text-txt-primary font-medium">
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
                                        <div key={emp.EmployeeID || idx} className="bg-bg-muted px-2 py-0.5 rounded text-[11px] font-medium text-txt-secondary flex items-center border border-border">
                                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-1.5"></span>
                                          {emp.FullName || emp.full_name || 'Nhân viên'}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Pagination Indicators */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-border">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentPage ? 'w-8 bg-primary-500' : 'w-2 bg-border'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

