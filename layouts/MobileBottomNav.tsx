import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LayoutList, GitBranch, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMenuClick, isSidebarOpen }) => {
  const activeClass = "flex flex-col items-center justify-center flex-1 h-full text-primary-600 dark:text-primary-400 font-bold transition-all";
  const inactiveClass = "flex flex-col items-center justify-center flex-1 h-full text-txt-muted hover:text-txt-primary transition-all";

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-surface/90 backdrop-blur-md border-t border-border flex items-center justify-around z-40 px-2 shadow-lg safe-bottom">
      {/* 1. Trang chủ */}
      <NavLink
        to="/"
        className={({ isActive }) => isActive ? activeClass : inactiveClass}
      >
        <LayoutDashboard className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-tight">Trang chủ</span>
      </NavLink>

      {/* 2. Dự án */}
      <NavLink
        to="/projects"
        className={({ isActive }) => isActive ? activeClass : inactiveClass}
      >
        <Briefcase className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-tight">Dự án</span>
      </NavLink>

      {/* 3. Tiến độ (Work-Plan) */}
      <NavLink
        to="/work-plan"
        className={({ isActive }) => isActive ? activeClass : inactiveClass}
      >
        <LayoutList className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-tight">Tiến độ</span>
      </NavLink>

      {/* 4. Phê duyệt (Quy trình) */}
      <NavLink
        to="/quy-trinh"
        className={({ isActive }) => isActive ? activeClass : inactiveClass}
      >
        <GitBranch className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-tight">Phê duyệt</span>
      </NavLink>

      {/* 5. Menu mở rộng (Kích hoạt Sidebar di động) */}
      <button
        onClick={onMenuClick}
        className={`flex flex-col items-center justify-center flex-1 h-full transition-all cursor-pointer ${
          isSidebarOpen 
            ? 'text-primary-600 dark:text-primary-400 font-bold' 
            : 'text-txt-muted hover:text-txt-primary'
        }`}
        aria-label="Mở menu mở rộng"
      >
        <Menu className="w-5 h-5 mb-1" />
        <span className="text-[10px] leading-tight">Menu</span>
      </button>
    </div>
  );
};

export default MobileBottomNav;
