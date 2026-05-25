import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, MapPin, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgencyEventWithAttendees } from '@/types/calendar.types';
import { Employee } from '@/types/employee.types';
import { LogoDDCN } from '@/components/common/LogoDDCN';

interface LobbyDisplayProps {
  events: AgencyEventWithAttendees[];
}

export const LobbyDisplay: React.FC<LobbyDisplayProps> = ({ events }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const EVENTS_PER_PAGE = 4; // Tối ưu số lượng để các thẻ hiển thị to và rõ ràng hơn

  // Filter today's meetings and business trips
  const today = new Date();
  const displayEvents = events
    .filter(e => {
      const isTypeValid = e.event_type === 'meeting' || e.event_type === 'business_trip';
      const start = new Date(e.start_time);
      return isTypeValid && 
             start.getDate() === today.getDate() &&
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
    if (type === 'meeting') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
          Họp nội bộ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
        Đi công tác
      </span>
    );
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

  return (
    <div 
      id="lobby-display-container"
      className={`w-full flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl border border-indigo-950/40 bg-slate-950 text-white font-sans dark ${
        isFullscreen ? 'h-screen rounded-none border-none' : 'h-full min-h-[700px]'
      }`}
    >
      
      {/* LEFT SIDEBAR (Branded Deep Teal/Blue theme - Narrower width 22% - Compact layout) */}
      <div className="w-full md:w-[22%] bg-gradient-to-b from-[#00415a] to-[#001c26] flex flex-col items-center justify-start gap-5 p-5 md:p-6 border-b md:border-b-0 md:border-r border-[#005273]/20 shrink-0 overflow-y-auto">
        
        {/* 1. Logo & Org Name */}
        <div className="flex flex-col items-center text-center w-full">
          <LogoDDCN className="w-20 h-24 drop-shadow-[0_4px_20px_rgba(0,180,216,0.2)]" />
          <h2 className="text-white text-center leading-snug mt-3 w-full">
            <span className="block text-xs md:text-sm font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
              UBND TỈNH HÀ TĨNH
            </span>
            <span className="block text-[11px] md:text-[12px] font-bold text-sky-200 mt-1 tracking-wide">
              Ban QLDA Đầu tư xây dựng
            </span>
            <span className="block text-[9.5px] md:text-[11px] font-semibold text-sky-300/80 mt-0.5 tracking-normal">
              Dân dụng & Hạ tầng khu vực
            </span>
          </h2>
        </div>

        {/* 2. Date & Time Widget */}
        <div className="w-full bg-white/[0.03] rounded-2xl border border-sky-500/10 p-4 text-center flex flex-col items-center shadow-lg backdrop-blur-sm">
          <p className="text-sky-200/50 text-[10px] font-bold uppercase tracking-widest">
            Thời gian hiện tại
          </p>
          <p className="text-white text-lg font-black capitalize tracking-wide mt-1.5">
            {dayOfWeek}
          </p>
          <p className="text-amber-300 text-sm font-bold mt-0.5 tracking-wider">
            {dayAndMonth}
          </p>
          <div className="text-xl font-mono font-black text-white tracking-tight mt-2.5 bg-sky-950/60 px-4 py-1.5 rounded-xl border border-sky-500/15 shadow-inner w-full text-center">
            {clockStr}
          </div>
        </div>

        {/* 3. Lịch sảnh & Stats Info Hub (Unified) */}
        <div className="w-full bg-white/[0.03] rounded-2xl border border-sky-500/10 p-3.5 flex flex-col gap-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-2 shadow-md border border-amber-300 w-10 h-10 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                Lịch sảnh hôm nay
              </p>
              <p className="text-[9px] text-sky-300/60 mt-0.5">
                Thông tin trực quan
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-sky-500/10 pt-3">
            <div className="bg-[#002b3d]/60 p-2.5 rounded-lg border border-sky-500/5 flex flex-col">
              <span className="text-sky-300/60 text-[9px] font-semibold">Họp nội bộ</span>
              <span className="text-amber-300 font-black text-lg font-mono mt-0.5">
                {meetingCount}
              </span>
            </div>
            <div className="bg-[#002b3d]/60 p-2.5 rounded-lg border border-sky-500/5 flex flex-col">
              <span className="text-sky-300/60 text-[9px] font-semibold">Đi công tác</span>
              <span className="text-amber-300 font-black text-lg font-mono mt-0.5">
                {businessTripCount}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Slogan Card */}
        <div className="w-full p-3.5 border border-amber-500/20 bg-amber-500/5 rounded-2xl text-center shadow-lg backdrop-blur-sm">
          <p className="text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider leading-relaxed">
            KỶ CƯƠNG - TRÁCH NHIỆM
            <span className="block text-[9px] text-sky-200 mt-1">HIỆU QUẢ - SÁNG TẠO</span>
          </p>
        </div>

        {/* 5. Support / Contact at very bottom (Packed) */}
        <div className="w-full text-center mt-auto border-t border-sky-500/10 pt-2 text-[10px] text-sky-300/50">
          <p>Hỗ trợ kỹ thuật: Văn phòng Ban</p>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL (Deep blue/violet theme - Wider width 78%) */}
      <div className="w-full md:w-[78%] bg-gradient-to-br from-slate-950 via-[#0c0a24] to-slate-950 flex flex-col p-6 md:p-8 overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="flex justify-between items-center pb-6 border-b border-indigo-950/40 z-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 uppercase drop-shadow-md">
              LỊCH CÔNG TÁC & HỘI HỌP
            </h1>
            <p className="text-indigo-300 text-xs md:text-sm font-medium tracking-wide mt-1">
              Hệ thống hiển thị lịch sự kiện trực quan tại sảnh
            </p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Trực tuyến
              </span>
            </div>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-900/30 text-indigo-300 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Main Schedule List */}
        <main className="flex-1 flex flex-col justify-start mt-6 z-10 overflow-y-auto no-scrollbar">
          {displayEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-indigo-200/50 py-16">
              <div className="p-5 bg-indigo-950/30 rounded-full border border-indigo-900/30 mb-5 relative">
                <CalendarIcon className="w-16 h-16 text-sky-400 opacity-60" />
                <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-xl font-bold text-sky-200">Không có lịch công tác & hội họp hôm nay</p>
              <p className="text-sm text-sky-300/50 mt-2 max-w-[320px] text-center leading-relaxed">
                Để đăng ký lịch mới, vui lòng đăng nhập tài khoản quản trị và nhấn nút &quot;Đăng ký lịch&quot; ở trang quản lý.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                {/* Header Row */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-indigo-900/40 bg-indigo-950/20 text-xs md:text-sm font-bold text-indigo-300 uppercase tracking-wider rounded-xl mb-1">
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
                        className="relative overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-sky-500/20 rounded-2xl p-5 transition-all duration-300 shadow-md grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center"
                      >
                        {/* Event Left border accent */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          event.event_type === 'meeting' ? 'bg-sky-500' : 'bg-amber-500'
                        }`} />

                        {/* Column 1: Time and Type */}
                        <div className="col-span-1 md:col-span-2 flex flex-row md:flex-col items-center md:items-start gap-3 pl-2 justify-center">
                          <div className="bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20 flex items-center justify-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap">
                            <span className="text-base md:text-lg font-bold text-amber-300 font-mono leading-none">{timeStr}</span>
                            <span className="text-xs text-sky-300/60 font-mono">-</span>
                            <span className="text-base md:text-lg font-bold text-amber-300 font-mono leading-none">{format(endDate, 'HH:mm')}</span>
                          </div>
                          <div className="shrink-0">
                            {getEventTypeBadge(event.event_type)}
                          </div>
                        </div>

                        {/* Column 2: Attendees */}
                        <div className="col-span-1 md:col-span-3 flex flex-col gap-1.5 min-w-0">
                          {event.attendees && event.attendees.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {event.attendees.slice(0, 4).map((emp, idx) => (
                                <span key={emp.EmployeeID || idx} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs md:text-sm text-sky-200/90 whitespace-nowrap shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-2" />
                                  {emp.FullName}
                                </span>
                              ))}
                              {event.attendees.length > 4 && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-xs md:text-sm font-bold text-sky-300 shadow-sm">
                                  +{event.attendees.length - 4}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm md:text-base text-sky-300/40 italic">Toàn cơ quan</span>
                          )}
                        </div>

                        {/* Column 3: Content */}
                        <div className="col-span-1 md:col-span-3 min-w-0">
                          <h3 className="text-base md:text-lg font-bold text-white leading-relaxed break-words whitespace-normal hover:text-sky-300 transition-colors">
                            {event.title}
                          </h3>
                        </div>

                        {/* Column 4: Host */}
                        <div className="col-span-1 md:col-span-2 min-w-0">
                          <span className="text-sm md:text-base font-bold text-yellow-100/95 break-words whitespace-normal block" title={getHostName(event)}>
                            {getHostName(event)}
                          </span>
                        </div>

                        {/* Column 5: Location */}
                        <div className="col-span-1 md:col-span-2 flex items-start gap-2 text-sm md:text-base text-emerald-300 min-w-0">
                          <MapPin className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 shrink-0 mt-0.5 md:mt-1" />
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
                <div className="mt-8 bg-gradient-to-r from-[#00364d]/30 to-[#001c26]/30 border border-[#005273]/15 rounded-2xl p-6 flex items-center gap-6 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 text-amber-400 shrink-0">
                    <LogoDDCN className="w-10 h-12 opacity-80" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      Chào mừng quý khách & đồng nghiệp
                    </h4>
                    <p className="text-xs text-sky-200/70 mt-2 leading-relaxed font-medium">
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
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentPage 
                          ? 'w-10 bg-gradient-to-r from-amber-400 to-orange-500' 
                          : 'w-2 bg-indigo-950 hover:bg-indigo-900'
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
