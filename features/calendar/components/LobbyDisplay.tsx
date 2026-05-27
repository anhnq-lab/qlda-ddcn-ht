import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, MapPin, Maximize2, Minimize2 } from 'lucide-react';
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
  const displayEvents = events
    .filter(e => {
      const start = new Date(e.start_time);
      return start.getDate() === today.getDate() &&
             start.getMonth() === today.getMonth() &&
             start.getFullYear() === today.getFullYear();
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
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
      ? 'text-amber-300'
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
      ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200'
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
      ? 'bg-sky-500/10 border-sky-500/20 text-amber-300 shadow-sm'
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
      ? 'text-amber-300'
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
  };

  return (
    <div 
      id="lobby-display-container"
      className={`w-full flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl border font-sans ${styles.container} ${
        isFullscreen ? 'h-screen rounded-none border-none' : 'h-full min-h-[700px]'
      }`}
    >
      
      {/* LEFT SIDEBAR (Branded theme) */}
      <div className={`w-full md:w-[22%] flex flex-col items-center justify-start gap-5 p-5 md:p-6 border-b md:border-b-0 md:border-r shrink-0 overflow-y-auto ${styles.sidebar}`}>
        
        {/* 1. Logo & Org Name */}
        <div className="flex flex-col items-center text-center w-full">
          <LogoDDCN className="w-20 h-24 drop-shadow-[0_4px_20px_rgba(0,180,216,0.15)]" />
          <h2 className="text-center leading-snug mt-3 w-full">
            <span className="block text-xs md:text-sm font-black tracking-wider uppercase bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-200 dark:to-yellow-400 bg-clip-text text-transparent">
              UBND TỈNH HÀ TĨNH
            </span>
            <span className={`block text-[11px] md:text-[12px] font-bold mt-1 tracking-wide uppercase ${theme === 'dark' ? 'text-sky-200' : 'text-slate-700'}`}>
              BAN QLDA ĐẦU TƯ XÂY DỰNG
            </span>
            <span className={`block text-[9.5px] md:text-[11px] font-semibold mt-0.5 tracking-normal uppercase ${theme === 'dark' ? 'text-sky-300/80' : 'text-slate-500'}`}>
              DÂN DỤNG & HẠ TẦNG KHU VỰC
            </span>
          </h2>
        </div>

        {/* 2. Date & Time Widget */}
        <div className={`w-full rounded-2xl p-4 text-center flex flex-col items-center border ${styles.sidebarWidget}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${styles.sidebarWidgetTitle}`}>
            Thời gian hiện tại
          </p>
          <p className={`text-lg font-black capitalize tracking-wide mt-1.5 ${styles.sidebarWidgetDay}`}>
            {dayOfWeek}
          </p>
          <p className={`text-sm mt-0.5 tracking-wider ${styles.sidebarWidgetDate}`}>
            {dayAndMonth}
          </p>
          <div className={`text-xl font-mono font-black tracking-tight mt-2.5 px-4 py-1.5 rounded-xl border shadow-inner w-full text-center ${styles.clock}`}>
            {clockStr}
          </div>
        </div>

        {/* 3. Lịch sảnh & Stats Info Hub (Unified) */}
        <div className={`w-full rounded-2xl p-3.5 flex flex-col gap-3 border ${styles.sidebarWidget}`}>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-2 shadow-md border border-amber-300 w-10 h-10 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Lịch Hôm Nay
              </p>
              <p className={`text-[9px] mt-0.5 ${styles.statsTitle}`}>
                Thông tin trực quan
              </p>
            </div>
          </div>
          
          <div className={`grid grid-cols-2 gap-2 text-[11px] border-t pt-3 ${theme === 'dark' ? 'border-sky-500/10' : 'border-slate-200'}`}>
            <div className={`p-2.5 rounded-lg border flex flex-col ${styles.statsBox}`}>
              <span className={`text-[9px] font-semibold ${styles.statsTitle}`}>Họp nội bộ</span>
              <span className="text-amber-600 dark:text-amber-300 font-black text-lg font-mono mt-0.5">
                {meetingCount}
              </span>
            </div>
            <div className={`p-2.5 rounded-lg border flex flex-col ${styles.statsBox}`}>
              <span className={`text-[9px] font-semibold ${styles.statsTitle}`}>Đi công tác</span>
              <span className="text-amber-600 dark:text-amber-300 font-black text-lg font-mono mt-0.5">
                {businessTripCount}
              </span>
            </div>
            <div className={`p-2.5 rounded-lg border flex flex-col ${styles.statsBox}`}>
              <span className={`text-[9px] font-semibold ${styles.statsTitle}`}>Sự kiện nội bộ</span>
              <span className="text-amber-600 dark:text-amber-300 font-black text-lg font-mono mt-0.5">
                {internalEventCount}
              </span>
            </div>
            <div className={`p-2.5 rounded-lg border flex flex-col ${styles.statsBox}`}>
              <span className={`text-[9px] font-semibold ${styles.statsTitle}`}>Khác</span>
              <span className="text-amber-600 dark:text-amber-300 font-black text-lg font-mono mt-0.5">
                {otherCount}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Slogan Card */}
        <div className={`w-full p-3.5 border rounded-2xl text-center ${styles.sloganCard}`}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider leading-relaxed">
            KỶ CƯƠNG - TRÁCH NHIỆM
            <span className="block text-[9px] opacity-90 mt-1">HIỆU QUẢ - SÁNG TẠO</span>
          </p>
        </div>

        {/* 5. Support / Contact at very bottom (Packed) */}
        <div className={`w-full text-center mt-auto border-t pt-2 text-[10px] ${styles.supportText}`}>
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
        <header className={`flex justify-between items-center pb-6 border-b z-10 ${theme === 'dark' ? 'border-indigo-950/40' : 'border-slate-200'}`}>
          <div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-widest uppercase drop-shadow-sm ${styles.contentHeaderTitle}`}>
              LỊCH CÔNG TÁC & HỘI HỌP
            </h1>
            <p className={`text-xs md:text-sm font-medium tracking-wide mt-1 ${styles.contentHeaderSub}`}>
              Hệ thống hiển thị lịch sự kiện trực quan tại sảnh
            </p>
          </div>
          <div className="flex items-center gap-4 text-right">
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
              <p className="text-xl font-bold">Không có lịch công tác & hội họp hôm nay</p>
              <p className="text-sm mt-2 max-w-[320px] text-center leading-relaxed opacity-85">
                Để đăng ký lịch mới, vui lòng đăng nhập tài khoản quản trị và nhấn nút &quot;Đăng ký lịch&quot; ở trang quản lý.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                {/* Header Row */}
                <div className={`hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl mb-1 ${styles.tableHeaderRow}`}>
                  <div className="col-span-2 pl-4">Thời gian</div>
                  <div className="col-span-3">Thành phần</div>
                  <div className="col-span-3">Nội dung</div>
                  <div className="col-span-2">Chủ trì</div>
                  <div className="col-span-2">Địa điểm</div>
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
                        className={`relative overflow-hidden border rounded-2xl p-5 transition-all duration-300 shadow-md grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center ${styles.eventRow}`}
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

                        {/* Column 1: Time and Type */}
                        <div className="col-span-1 md:col-span-2 flex flex-row md:flex-col items-center md:items-start gap-3 pl-2 justify-center">
                          <div className={`px-3 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap ${styles.timeBadge}`}>
                            <span className="text-base md:text-lg font-bold font-mono leading-none">{timeStr}</span>
                            <span className="text-xs font-mono">-</span>
                            <span className="text-base md:text-lg font-bold font-mono leading-none">{format(endDate, 'HH:mm')}</span>
                          </div>
                          <div className="shrink-0">
                            {getEventTypeBadge(event.event_type)}
                          </div>
                        </div>

                        {/* Column 2: Attendees */}
                        <div className="col-span-1 md:col-span-3 flex flex-col gap-1 min-w-0">
                          {event.attendees && event.attendees.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {event.attendees.slice(0, 10).map((emp, idx) => (
                                <span key={emp.EmployeeID || idx} className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10.5px] md:text-xs whitespace-nowrap ${styles.attendeeBadge}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 mr-1" />
                                  {emp.FullName}
                                </span>
                              ))}
                              {event.attendees.length > 10 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/25 dark:border-sky-400/25 text-[10.5px] md:text-xs font-bold text-sky-600 dark:text-sky-400 shadow-sm">
                                  +{event.attendees.length - 10}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={`text-sm md:text-base italic ${theme === 'dark' ? 'text-sky-300/40' : 'text-slate-400'}`}>Toàn cơ quan</span>
                          )}
                        </div>

                        {/* Column 3: Content */}
                        <div className="col-span-1 md:col-span-3 min-w-0">
                          <h3 className={`text-base md:text-lg font-bold leading-relaxed break-words whitespace-normal transition-colors ${styles.eventTitle}`}>
                            {event.title}
                          </h3>
                        </div>

                        {/* Column 4: Host */}
                        <div className="col-span-1 md:col-span-2 min-w-0">
                          <span className={`text-sm md:text-base break-words whitespace-normal block ${styles.hostName}`} title={getHostName(event)}>
                            {getHostName(event)}
                          </span>
                        </div>

                        {/* Column 5: Location */}
                        <div className={`col-span-1 md:col-span-2 flex items-start gap-2 text-sm md:text-base min-w-0 ${styles.locationText}`}>
                          <MapPin className={`w-4 h-4 md:w-5 md:h-5 shrink-0 mt-0.5 md:mt-1 ${styles.locationIcon}`} />
                          <span className="font-bold break-words whitespace-normal" title={event.room || event.location || undefined}>
                            {event.room || event.location || 'Không rõ'}
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
                  <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 text-amber-500 dark:text-amber-400 shrink-0">
                    <LogoDDCN className="w-10 h-12 opacity-85" />
                  </div>
                  <div>
                    <h4 className={`text-sm uppercase tracking-wider flex items-center gap-2 ${styles.welcomeBannerTitle}`}>
                      Chào mừng quý khách & đồng nghiệp
                    </h4>
                    <p className={`text-xs mt-2 leading-relaxed font-medium ${styles.welcomeBannerText}`}>
                      Chúc tập thể cán bộ, công chức, viên chức Ban Quản lý dự án Đầu tư xây dựng công trình Dân dụng và Công nghiệp tỉnh Hà Tĩnh một ngày làm việc hiệu quả, đoàn kết, kỷ cương và sáng tạo!
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
