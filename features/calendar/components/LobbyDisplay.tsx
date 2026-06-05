import React, { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, MapPin, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgencyEventWithAttendees } from '@/types/calendar.types';
import { LogoDDCN } from '@/components/common/LogoDDCN';
import { useTheme } from '@/context/ThemeContext';

interface LobbyDisplayProps {
  events: AgencyEventWithAttendees[];
}

export const LobbyDisplay: React.FC<LobbyDisplayProps> = ({ events }) => {
  // Chế độ tivi sảnh mặc định sử dụng theme tối để tối ưu hiển thị và bảo vệ màn hình
  const theme = 'dark';
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const EVENTS_PER_PAGE = 4; // Tối ưu số lượng để các thẻ hiển thị to và rõ ràng hơn

  // Filter today's events (meetings, business trips, internal events, and others)
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

  const getEventsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    return events.filter(e => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      return start <= dayEnd && end >= dayStart;
    });
  };

  const weekStart = startOfWeek(currentTime, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

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

  // Ensure current page is within bounds when totalPages changes
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

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'meeting':
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap ${
            theme === 'dark'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : theme === 'nature'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            Họp nội bộ
          </span>
        );
      case 'business_trip':
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap ${
            theme === 'dark'
              ? 'bg-amber-500/20 text-white border border-amber-500/30'
              : theme === 'nature'
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            Đi công tác
          </span>
        );
      case 'internal_event':
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap ${
            theme === 'dark'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : theme === 'nature'
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : 'bg-purple-100 text-purple-800 border border-purple-200'
          }`}>
            Sự kiện nội bộ
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap ${
            theme === 'dark'
              ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
              : theme === 'nature'
              ? 'bg-slate-100 text-slate-800 border border-slate-200'
              : 'bg-slate-100 text-slate-800 border border-slate-200'
          }`}>
            Khác
          </span>
        );
    }
  };

  const getHostName = (event: AgencyEventWithAttendees) => {
    if (event.leader) {
      return `Đ/c ${event.leader.FullName}`;
    }
    if (event.attendees && event.attendees.length > 0) {
      // Find employee with highest rank/role
      const leader = event.attendees.find(a => 
        a.Position?.toLowerCase().includes('giám đốc') || 
        a.Position?.toLowerCase().includes('trưởng') ||
        a.Role === 'Admin' ||
        a.Role === 'Manager'
      );
      if (leader) return `Đ/c ${leader.FullName}`;
      return `Đ/c ${event.attendees[0].FullName}`;
    }
    return 'Lãnh đạo Ban';
  };

  // Day of week and formatted date
  const dayOfWeek = format(currentTime, 'EEEE', { locale: vi });
  const dayAndMonth = format(currentTime, 'dd/MM/yyyy');
  const clockStr = format(currentTime, 'HH:mm:ss');

  // Compute stats for today
  const meetingCount = displayEvents.filter(e => e.event_type === 'meeting').length;
  const businessTripCount = displayEvents.filter(e => e.event_type === 'business_trip').length;
  const internalEventCount = displayEvents.filter(e => e.event_type === 'internal_event').length;
  const otherCount = displayEvents.filter(e => e.event_type === 'other').length;

  // Local style configuration based on active theme
  const styles = {
    container: theme === 'dark'
      ? 'bg-slate-950 text-white border-indigo-950/40'
      : theme === 'nature'
      ? 'bg-[#FCF9F2] text-[#1d1c1c] border-[#ece7de]'
      : 'bg-white text-[#0f172a] border-slate-200',

    sidebar: theme === 'dark'
      ? 'bg-gradient-to-b from-[#00415a] to-[#001c26] border-[#005273]/20'
      : theme === 'nature'
      ? 'bg-gradient-to-b from-[#eadecb] to-[#dcd0bc] border-[#ece7de]'
      : 'bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] border-slate-200',

    sidebarWidget: theme === 'dark'
      ? 'bg-white/[0.03] border-sky-500/10'
      : theme === 'nature'
      ? 'bg-[#FCF9F2]/70 border-[#e5dfd4] shadow-sm'
      : 'bg-slate-50 border-slate-200 shadow-sm',

    sidebarWidgetTitle: theme === 'dark'
      ? 'text-sky-200/50'
      : theme === 'nature'
      ? 'text-[#4a3426]/70'
      : 'text-slate-500',

    sidebarWidgetDay: theme === 'dark'
      ? 'text-white'
      : theme === 'nature'
      ? 'text-[#1d1c1c]'
      : 'text-slate-950',

    sidebarWidgetDate: theme === 'dark'
      ? 'text-white'
      : theme === 'nature'
      ? 'text-amber-700 font-bold'
      : 'text-blue-600 font-bold',

    clock: theme === 'dark'
      ? 'bg-sky-950/60 border-sky-500/15 text-white'
      : theme === 'nature'
      ? 'bg-[#EDE8DF] border-[#d6cfc4] text-[#4a3426]'
      : 'bg-slate-100 border-slate-200 text-slate-950',

    statsBox: theme === 'dark'
      ? 'bg-[#002b3d]/60 border-sky-500/5'
      : theme === 'nature'
      ? 'bg-[#FCF9F2] border-[#e5dfd4]'
      : 'bg-white border-slate-200',

    statsTitle: theme === 'dark'
      ? 'text-sky-300/60'
      : theme === 'nature'
      ? 'text-[#78716c]'
      : 'text-slate-500',

    sloganCard: theme === 'dark'
      ? 'border-amber-500/20 bg-amber-500/5 text-amber-300 shadow-sm'
      : theme === 'nature'
      ? 'border-amber-600/20 bg-amber-600/5 text-amber-800 shadow-sm'
      : 'border-blue-500/20 bg-blue-500/5 text-blue-700 shadow-sm',

    supportText: theme === 'dark'
      ? 'text-sky-300/50 border-sky-500/10'
      : theme === 'nature'
      ? 'text-[#78716c]/60 border-[#e5dfd4]'
      : 'text-slate-400 border-slate-200',

    contentPanel: theme === 'dark'
      ? 'from-slate-950 via-[#0c0a24] to-slate-950'
      : theme === 'nature'
      ? 'from-[#FCF9F2] via-[#FBF7EE] to-[#FCF9F2]'
      : 'from-white via-[#f8fafc] to-white',

    contentHeaderTitle: theme === 'dark'
      ? 'text-white'
      : theme === 'nature'
      ? 'text-amber-800'
      : 'text-blue-700',

    contentHeaderSub: theme === 'dark'
      ? 'text-indigo-300'
      : theme === 'nature'
      ? 'text-[#4a3426]/80'
      : 'text-slate-600',

    tiviButton: theme === 'dark'
      ? 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-900/30 text-indigo-300 hover:text-white'
      : theme === 'nature'
      ? 'bg-[#EDE8DF] hover:bg-[#EDE8DF]/80 border-[#e5dfd4] text-[#4a3426] hover:text-[#1d1c1c]'
      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900',

    tableHeaderRow: theme === 'dark'
      ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300'
      : theme === 'nature'
      ? 'bg-[#EDE8DF] border-[#e5dfd4] text-[#4a3426]'
      : 'bg-slate-100 border-slate-200 text-slate-600',

    eventRow: theme === 'dark'
      ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 hover:border-sky-500/20'
      : theme === 'nature'
      ? 'bg-[#FCF9F2] hover:bg-[#EDE8DF]/30 border-[#e5dfd4] hover:border-amber-600/30 shadow-sm'
      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-500/30 shadow-sm',

    timeBadge: theme === 'dark'
      ? 'bg-sky-500/10 border-sky-500/20 text-white shadow-sm'
      : theme === 'nature'
      ? 'bg-amber-100/50 border-amber-200 text-amber-800 shadow-sm'
      : 'bg-blue-50 border-blue-100 text-blue-800 shadow-sm',

    attendeeBadge: theme === 'dark'
      ? 'bg-white/5 border-white/10 text-sky-200/90 shadow-sm'
      : theme === 'nature'
      ? 'bg-[#EDE8DF] border-[#e5dfd4] text-[#4a3426] shadow-sm'
      : 'bg-slate-100 border-slate-200 text-slate-700 shadow-sm',

    eventTitle: theme === 'dark'
      ? 'text-white hover:text-sky-300'
      : theme === 'nature'
      ? 'text-[#1d1c1c] hover:text-amber-800'
      : 'text-slate-900 hover:text-blue-600',

    hostName: theme === 'dark'
      ? 'text-yellow-100/95'
      : theme === 'nature'
      ? 'text-amber-800 font-semibold'
      : 'text-slate-800 font-semibold',

    locationText: theme === 'dark'
      ? 'text-emerald-300'
      : theme === 'nature'
      ? 'text-emerald-800'
      : 'text-emerald-700',

    locationIcon: theme === 'dark'
      ? 'text-emerald-400'
      : theme === 'nature'
      ? 'text-emerald-600'
      : 'text-emerald-500',

    emptyStateText: theme === 'dark'
      ? 'text-indigo-200/50 text-sky-200 text-sky-300/50'
      : theme === 'nature'
      ? 'text-[#78716c]/50 text-amber-800 text-[#78716c]'
      : 'text-slate-400 text-slate-800 text-slate-500',

    welcomeBanner: theme === 'dark'
      ? 'from-[#00364d]/30 to-[#001c26]/30 border-[#005273]/15 shadow-md'
      : theme === 'nature'
      ? 'from-[#EDE8DF]/40 to-[#eadecb]/40 border-[#e5dfd4] shadow-sm'
      : 'from-slate-50 to-slate-100 border-slate-200 shadow-sm',

    welcomeBannerTitle: theme === 'dark'
      ? 'text-white'
      : theme === 'nature'
      ? 'text-amber-800 font-bold'
      : 'text-blue-700 font-bold',

    welcomeBannerText: theme === 'dark'
      ? 'text-sky-200/70'
      : theme === 'nature'
      ? 'text-[#4a3426]'
      : 'text-slate-600',

    dotActive: theme === 'dark'
      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
      : theme === 'nature'
      ? 'bg-amber-600'
      : 'bg-blue-600',

    dotInactive: theme === 'dark'
      ? 'bg-indigo-950 hover:bg-indigo-900'
      : theme === 'nature'
      ? 'bg-[#EDE8DF] hover:bg-[#eadecb]'
      : 'bg-slate-200 hover:bg-slate-300',

    columnBorder: theme === 'dark'
      ? 'border-white/10'
      : theme === 'nature'
      ? 'border-[#e5dfd4]'
      : 'border-slate-200',
  };

  return (
    <div 
      id="lobby-display-container"
      className={`w-full flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl border font-sans ${theme === 'dark' ? 'dark' : ''} ${styles.container} ${
        isFullscreen ? 'h-screen rounded-none border-none' : 'h-full min-h-[700px]'
      }`}
    >
      
      {/* LEFT SIDEBAR (Branded theme) */}
      <div className={`w-full md:w-[22%] flex flex-col items-center justify-start gap-6 p-5 md:p-6 border-b md:border-b-0 md:border-r shrink-0 overflow-y-auto ${styles.sidebar}`}>
        
        {/* 1. Org Name */}
        <div className="flex flex-col items-center text-center w-full">
          <h2 className="text-center leading-snug mt-2 w-full">
            <span className="block text-lg md:text-2xl font-medium tracking-wider uppercase text-amber-800 dark:text-white">
              UBND TỈNH HÀ TĨNH
            </span>
            <span className={`block text-lg md:text-2xl font-black mt-2 tracking-wide uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
              BAN QLDA ĐẦU TƯ XÂY DỰNG
            </span>
            <span className={`block text-lg md:text-2xl font-black mt-2 tracking-wide uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
              CÔNG TRÌNH DÂN DỤNG
            </span>
            <span className={`block text-lg md:text-2xl font-black mt-2 tracking-wide uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
              VÀ HẠ TẦNG KHU VỰC
            </span>
          </h2>
        </div>

        {/* 2. Weekly Summary Widget */}
        <div className="w-full flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 px-1 border-b border-white/10 pb-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">
              Tóm tắt lịch tuần
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 no-scrollbar">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isTodayActive = format(day, 'yyyy-MM-dd') === format(currentTime, 'yyyy-MM-dd');
              const dayLabel = format(day, 'EEEE', { locale: vi });
              const dateLabel = format(day, 'dd/MM');

              return (
                <div 
                  key={day.toString()}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isTodayActive
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/5'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-bold capitalize ${isTodayActive ? 'text-amber-400' : 'text-slate-200'}`}>
                      {dayLabel}
                    </span>
                    <span className={`text-[10px] font-semibold ${isTodayActive ? 'text-amber-500/90' : 'text-slate-400'}`}>
                      {dateLabel}
                    </span>
                  </div>

                  {/* Day Events */}
                  <div className="space-y-1.5">
                    {dayEvents.length === 0 ? (
                      <p className="text-[11px] italic text-slate-500 pl-1">Không có lịch</p>
                    ) : (
                      dayEvents.slice(0, 3).map((event) => {
                        const eventStart = new Date(event.start_time);
                        const timeStr = format(eventStart, 'HH:mm');
                        
                        // Dot color based on event type
                        let dotColor = 'bg-slate-400';
                        if (event.event_type === 'meeting') dotColor = 'bg-sky-500';
                        else if (event.event_type === 'business_trip') dotColor = 'bg-amber-500';
                        else if (event.event_type === 'internal_event') dotColor = 'bg-purple-500';

                        return (
                          <div key={event.id} className="flex items-start gap-1.5 text-[11px]">
                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                            <div className="min-w-0 flex-1">
                              <span className="font-mono text-[9px] text-slate-400 mr-1 shrink-0">{timeStr}</span>
                              <span className="text-slate-300 line-clamp-1 break-words" title={event.title}>
                                {event.title}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-amber-500 font-semibold pl-3">
                        + {dayEvents.length - 3} lịch khác...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Support / Contact at very bottom (Packed) */}
        <div className={`w-full text-center mt-auto border-t pt-2 text-xs ${styles.supportText}`}>
          <p>Hỗ trợ kỹ thuật: Văn phòng Ban</p>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className={`w-full md:w-[78%] bg-gradient-to-br flex flex-col p-6 md:p-8 overflow-hidden relative ${styles.contentPanel}`}>
        {/* Background glow effects */}
        {theme === 'dark' && (
          <>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        {/* Top Header */}
        <header className={`grid grid-cols-3 items-center pb-6 border-b z-10 ${theme === 'dark' ? 'border-indigo-950/40' : 'border-slate-200'}`}>
          {/* Left Column: Date & Time Widget */}
          <div className="flex items-center justify-start">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border bg-white/[0.02] border-white/5 shadow-inner">
              <div className="flex flex-col text-left">
                <span className="text-xs md:text-sm font-black capitalize tracking-wide text-amber-500">
                  {dayOfWeek}
                </span>
                <span className="text-xs md:text-sm font-bold text-slate-300">
                  {dayAndMonth}
                </span>
              </div>
              <div className="w-[1px] h-7 bg-white/10" />
              <span className="text-xl md:text-2xl font-mono font-black tracking-wider text-white">
                {clockStr}
              </span>
            </div>
          </div>
          <div className="text-center">
            <h1 className={`text-3xl md:text-5xl font-black tracking-widest uppercase drop-shadow-sm ${styles.contentHeaderTitle}`}>
              LỊCH CÔNG TÁC
            </h1>
            <p className={`text-sm md:text-lg font-medium tracking-wide mt-2 ${styles.contentHeaderSub}`}>
              Hệ thống hiển thị lịch sự kiện trực quan tại sảnh
            </p>
          </div>
          <div className="flex items-center gap-4 justify-end">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 border ${
                theme === 'dark'
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                  : 'text-emerald-700 bg-emerald-100 border-emerald-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Trực tuyến
              </span>
            </div>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${styles.tiviButton}`}
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Main Schedule List */}
        <main className="flex-1 flex flex-col justify-start mt-6 z-10 overflow-y-auto no-scrollbar">
          {displayEvents.length === 0 ? (
            <div className={`flex-1 flex flex-col items-center justify-center py-16 ${styles.emptyStateText}`}>
              <div className={`p-5 rounded-full border mb-5 relative ${theme === 'dark' ? 'bg-indigo-950/30 border-indigo-900/30' : 'bg-slate-100 border-slate-200'}`}>
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
                <div className={`hidden md:grid grid-cols-12 text-lg md:text-xl font-bold uppercase tracking-wider rounded-xl mb-1 ${styles.tableHeaderRow}`}>
                  <div className={`col-span-2 py-3.5 text-center border-r ${styles.columnBorder}`}>Thời gian</div>
                  <div className={`col-span-3 py-3.5 text-center border-r ${styles.columnBorder}`}>Nội dung</div>
                  <div className={`col-span-3 py-3.5 text-center border-r ${styles.columnBorder}`}>Thành phần</div>
                  <div className={`col-span-2 py-3.5 text-center border-r ${styles.columnBorder}`}>Địa điểm</div>
                  <div className="col-span-2 py-3.5 text-center">Ghi chú</div>
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
                        className={`relative overflow-hidden border rounded-2xl transition-all duration-300 shadow-md grid grid-cols-1 md:grid-cols-12 md:items-stretch ${styles.eventRow}`}
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

                        {/* Column 1: Time */}
                        <div className={`col-span-1 md:col-span-2 flex items-center justify-center p-5 border-r ${styles.columnBorder}`}>
                          <div className={`px-4 py-2 rounded-lg border flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap ${styles.timeBadge}`}>
                            <span className="text-xl md:text-2xl font-bold font-mono leading-none">{timeStr}</span>
                            <span className="text-sm md:text-lg font-mono">-</span>
                            <span className="text-xl md:text-2xl font-bold font-mono leading-none">{format(endDate, 'HH:mm')}</span>
                          </div>
                        </div>

                        {/* Column 3: Content */}
                        <div className={`col-span-1 md:col-span-3 min-w-0 flex items-center p-5 border-r ${styles.columnBorder}`}>
                          <h3 className={`text-lg md:text-xl font-bold leading-relaxed break-words whitespace-normal transition-colors ${styles.eventTitle}`}>
                            {event.title}
                          </h3>
                        </div>

                        {/* Column 2: Attendees */}
                        <div className={`col-span-1 md:col-span-3 flex flex-col justify-center gap-1.5 min-w-0 p-5 border-r ${styles.columnBorder}`}>
                          {event.attendees && event.attendees.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {event.attendees.slice(0, 10).map((emp, idx) => (
                                <span key={emp.EmployeeID || idx} className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-sm md:text-base whitespace-nowrap ${styles.attendeeBadge}`}>
                                  <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400 mr-1.5" />
                                  {emp.FullName}
                                </span>
                              ))}
                              {event.attendees.length > 10 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/25 dark:border-sky-400/25 text-sm md:text-base font-bold text-sky-600 dark:text-sky-400 shadow-sm">
                                  +{event.attendees.length - 10}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={`text-lg md:text-xl italic ${theme === 'dark' ? 'text-sky-300/40' : 'text-slate-400'}`}>Toàn cơ quan</span>
                          )}
                        </div>

                        {/* Column 5: Location */}
                        <div className={`col-span-1 md:col-span-2 flex items-center gap-2.5 text-lg md:text-xl min-w-0 p-5 border-r ${styles.columnBorder} ${styles.locationText}`}>
                          <MapPin className={`w-5 h-5 md:w-6 md:h-6 shrink-0 mt-0.5 md:mt-1 ${styles.locationIcon}`} />
                          <span className="font-bold break-words whitespace-normal" title={event.room || event.location || undefined}>
                            {event.room || event.location || 'Không rõ'}
                          </span>
                        </div>

                        {/* Column 6: Notes */}
                        <div className="col-span-1 md:col-span-2 min-w-0 flex items-center p-5">
                          <span className={`text-lg md:text-xl break-words whitespace-normal block ${theme === 'dark' ? 'text-indigo-200/80' : 'text-slate-600'}`} title={event.description || undefined}>
                            {event.description || '-'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Dynamic Welcome Banner (shows when there are 3 or fewer events) to fill the empty space */}
              {displayEvents.length <= 3 && (
                <div className={`mt-8 border rounded-2xl p-6 flex items-center gap-6 relative overflow-hidden ${styles.welcomeBanner}`}>
                  {theme === 'dark' && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  )}
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
