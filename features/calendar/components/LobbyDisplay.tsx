import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgencyEventWithAttendees } from '@/types/calendar.types';

interface LobbyDisplayProps {
  events: AgencyEventWithAttendees[];
}

export const LobbyDisplay: React.FC<LobbyDisplayProps> = ({ events }) => {
  const theme = 'dark';
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const EVENTS_PER_PAGE = 4;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const displayEvents = events
    .filter(e => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      return start <= todayEnd && end >= todayStart;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const totalPages = Math.ceil(displayEvents.length / EVENTS_PER_PAGE) || 1;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 10000); // 10 seconds per page
    return () => clearInterval(timer);
  }, [totalPages]);

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const el = document.getElementById('lobby-display-container');
      if (el) {
        if (el.requestFullscreen) {
          el.requestFullscreen();
        }
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const currentEvents = displayEvents.slice(currentPage * EVENTS_PER_PAGE, (currentPage + 1) * EVENTS_PER_PAGE);

  const dayOfWeek = format(currentTime, 'EEEE', { locale: vi });
  const dayAndMonth = format(currentTime, 'dd/MM/yyyy');
  const clockStr = format(currentTime, 'HH:mm:ss');

  const styles = {
    container: 'bg-slate-950 text-white border-indigo-950/40',
    contentPanel: 'from-slate-950 via-[#0c0a24] to-slate-950',
    contentHeaderTitle: 'text-white',
    tableHeaderRow: 'bg-indigo-950/20 border-indigo-900/40 text-slate-300',
    eventRow: 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 hover:border-sky-500/20',
    emptyStateText: 'text-indigo-200/50 text-sky-200 text-sky-300/50',
    welcomeBanner: 'from-[#00364d]/30 to-[#001c26]/30 border-[#005273]/15 shadow-md',
    welcomeBannerTitle: 'text-white',
    welcomeBannerText: 'text-sky-200/70',
    dotActive: 'bg-gradient-to-r from-amber-400 to-orange-500',
    dotInactive: 'bg-indigo-950 hover:bg-indigo-900',
    columnBorder: 'border-white/10',
  };

  return (
    <div 
      id="lobby-display-container"
      className={`w-full flex flex-col rounded-2xl overflow-hidden shadow-2xl border font-sans dark ${styles.container} ${
        isFullscreen ? 'h-screen rounded-none border-none' : 'h-full min-h-[700px]'
      }`}
    >
      {/* CONTENT PANEL */}
      <div className={`w-full bg-gradient-to-br flex flex-col p-6 md:p-8 overflow-hidden relative flex-1 ${styles.contentPanel}`}>
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] items-center gap-4 px-6 py-4 rounded-3xl border z-10 mb-6 bg-white/[0.02] border-white/5 shadow-lg text-center lg:text-left">
          {/* Left Column: Date & Time Widget */}
          <div className="flex items-center justify-center lg:justify-start">
            <div className="flex items-center gap-4 px-4 py-2 rounded-2xl border bg-white/[0.01] border-white/5 shadow-inner">
              <div className="flex flex-col text-left">
                <span className="text-base md:text-lg font-black capitalize tracking-wide text-amber-500 leading-tight">
                  {dayOfWeek}
                </span>
                <span className="text-xs md:text-sm font-bold text-slate-300 leading-tight">
                  {dayAndMonth}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <span className="text-2xl md:text-3xl font-mono font-black tracking-wider text-white">
                {clockStr}
              </span>
            </div>
          </div>
          
          {/* Center Column: Branding & Main Title */}
          <div className="text-center flex flex-col items-center justify-center">
            <span className="block text-sm md:text-base lg:text-lg font-bold tracking-widest uppercase text-amber-500">
              UBND TỈNH HÀ TĨNH
            </span>
            <span className="block text-[11px] md:text-xs lg:text-sm font-black mt-1 tracking-wider uppercase text-white/90">
              BAN QLDA ĐẦU TƯ XÂY DỰNG CÔNG TRÌNH DÂN DỤNG VÀ HẠ TẦNG KHU VỰC
            </span>
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-widest uppercase drop-shadow-sm mt-3 ${styles.contentHeaderTitle}`}>
              LỊCH CÔNG TÁC
            </h1>
          </div>
          
          {/* Right Column: Status & Controls Widget */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="flex items-center gap-4 px-4 py-2 rounded-2xl border bg-white/[0.01] border-white/5 shadow-inner">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Trực tuyến
              </span>
              <div className="w-[1px] h-8 bg-white/10" />
              <button
                onClick={toggleFullscreen}
                className="p-1 text-indigo-300 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Schedule List */}
        <main className="flex-1 flex flex-col justify-start mt-2 z-10 overflow-y-auto no-scrollbar">
          {displayEvents.length === 0 ? (
            <div className={`flex-1 flex flex-col items-center justify-center py-16 ${styles.emptyStateText}`}>
              <div className="p-5 rounded-full border mb-5 relative bg-indigo-950/30 border-indigo-900/30">
                <CalendarIcon className="w-16 h-16 text-sky-500 opacity-60 dark:text-sky-400" />
                <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-xl font-bold">Không có lịch công tác hôm nay</p>
              <p className="text-sm mt-2 max-w-[320px] text-center leading-relaxed opacity-85">
                Để đăng ký lịch mới, vui lòng đăng nhập tài khoản quản trị và nhấn nút &quot;Đăng ký lịch&quot; ở trang quản lý.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                {/* Header Row */}
                <div className={`hidden md:grid lobby-grid-layout text-lg md:text-xl lg:text-2xl font-bold uppercase tracking-wider rounded-xl mb-1 ${styles.tableHeaderRow}`}>
                  <div className={`py-3.5 text-center border-r ${styles.columnBorder}`}>Thời gian</div>
                  <div className={`py-3.5 text-center border-r ${styles.columnBorder}`}>Nội dung</div>
                  <div className={`py-3.5 text-center border-r ${styles.columnBorder}`}>Thành phần</div>
                  <div className={`py-3.5 text-center border-r ${styles.columnBorder}`}>Địa điểm</div>
                  <div className="py-3.5 text-center">Ghi chú</div>
                </div>

                <AnimatePresence mode="wait">
                  {currentEvents.map((event, index) => {
                    const startDate = new Date(event.start_time);
                    const endDate = new Date(event.end_time);
                    const timeStr = format(startDate, 'HH:mm');

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`relative overflow-hidden border rounded-2xl transition-all duration-300 shadow-md ${styles.eventRow}`}
                      >
                        {/* Event Left border accent */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          event.event_type === 'meeting'
                            ? 'bg-sky-500'
                            : event.event_type === 'business_trip'
                            ? 'bg-amber-500'
                            : event.event_type === 'internal_event'
                            ? 'bg-purple-500'
                            : 'bg-slate-500'
                        }`} />

                        {/* Inner Grid Columns Container */}
                        <div className="grid grid-cols-1 lobby-grid-layout md:items-stretch w-full">
                          {/* Column 1: Time */}
                          <div className={`col-span-1 flex items-center justify-center p-5 border-r ${styles.columnBorder}`}>
                            <span className="text-lg md:text-xl lg:text-2xl font-semibold text-white whitespace-nowrap">
                              {timeStr} - {format(endDate, 'HH:mm')}
                            </span>
                          </div>

                          {/* Column 2: Content */}
                          <div className={`col-span-1 min-w-0 flex items-center p-5 border-r ${styles.columnBorder}`}>
                            <span className="text-lg md:text-xl lg:text-2xl font-semibold text-white leading-snug break-words whitespace-normal">
                              {event.title}
                            </span>
                          </div>

                          {/* Column 3: Attendees */}
                          <div className={`col-span-1 flex items-center min-w-0 p-5 border-r ${styles.columnBorder}`}>
                            <span className="text-lg md:text-xl lg:text-2xl font-semibold text-white break-words whitespace-normal">
                              {event.attendees && event.attendees.length > 0 
                                ? event.attendees.map(a => a.FullName).join(', ') 
                                : 'Toàn cơ quan'
                              }
                            </span>
                          </div>

                          {/* Column 4: Location */}
                          <div className={`col-span-1 flex items-center min-w-0 p-5 border-r ${styles.columnBorder}`}>
                            <span className="text-lg md:text-xl lg:text-2xl font-semibold text-white whitespace-nowrap">
                              {event.room || event.location || 'Không rõ'}
                            </span>
                          </div>

                          {/* Column 5: Notes */}
                          <div className="col-span-1 min-w-0 flex items-center p-5">
                            <span className="text-lg md:text-xl lg:text-2xl font-semibold text-white break-words whitespace-normal">
                              {event.description || '-'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Dynamic Welcome Banner (shows when there are 3 or fewer events) to fill the empty space */}
              {displayEvents.length <= 3 && (
                <div className={`mt-8 border rounded-2xl p-6 flex items-center gap-6 relative overflow-hidden ${styles.welcomeBanner}`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-amber-500 dark:text-amber-400 shrink-0 w-12 h-12 flex items-center justify-center shadow-inner">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className={`text-sm uppercase tracking-wider flex items-center gap-2 ${styles.welcomeBannerTitle}`}>
                      Chào mừng quý khách & đồng nghiệp
                    </h4>
                    <p className={`text-xs mt-2 leading-relaxed font-medium ${styles.welcomeBannerText}`}>
                      Chúc tập thể cán bộ, viên chức Ban Quản lý dự án Đầu tư xây dựng công trình Dân dụng và Công nghiệp tỉnh Hà Tĩnh một ngày làm việc hiệu quả, đoàn kết, kỷ cương và sáng tạo!
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination indicators */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 pt-4">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentPage 
                          ? `w-10 ${styles.dotActive}` 
                          : `w-2 ${styles.dotInactive}`
                      }`}
                      aria-label={`Trang ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
