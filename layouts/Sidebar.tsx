import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LogoDDCN } from '../components/common/LogoDDCN';
import {
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import { useSidebarModuleConfig } from '../hooks/useSidebarModuleConfig';
import { navItems, contractorNavItems } from './sidebarModules';

// ========================================
// SIDEBAR COMPONENT — Ban DDCN TP.HCM Theme (Amber Style)
// ========================================

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  onClose
}) => {
  const { currentUser, logout, userType } = useAuth();
  const { can, loading: permLoading } = usePermissionCheck();
  const { isModuleVisible } = useSidebarModuleConfig();
  const isContractor = userType === 'contractor';

  // Filter nav items based on permissions + admin's module visibility config
  const visibleNavItems = useMemo(() => {
    // Contractors get a limited menu (also respects admin's hide config)
    if (isContractor) return contractorNavItems.filter(item => isModuleVisible(item.path));
    // While permissions are loading, show nothing to avoid flash of wrong items
    if (permLoading) return [];
    return navItems.filter(item => {
      if (!isModuleVisible(item.path)) return false; // Admin đã ẩn module này
      if (!item.resource) return true; // No resource = always visible
      return can(item.resource, 'view');
    });
  }, [can, isContractor, permLoading, isModuleVisible]);


  return (
    <div
      className={`layout-sidebar
        h-full flex flex-col justify-between
        transition-all duration-300 ease-out bg-bg-surface border-r border-border z-50
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* ── Logo & Brand ── */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className={`relative h-16 px-4 shrink-0 flex items-center justify-between ${isCollapsed ? 'md:px-3 md:justify-center' : ''} border-b border-border-subtle`}>
          {/* Subtle gradient accent line at bottom */}
          <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Logo - Expanded state */}
          <div className={`flex items-center overflow-hidden transition-all duration-300 gap-3 ${isCollapsed ? 'md:hidden' : 'w-auto'}`}>
            <div className="w-10 h-10 bg-bg-surface rounded-lg p-0.5 flex items-center justify-center shrink-0 shadow-card border border-border">
               <LogoDDCN className="w-full h-full" />
            </div>
            <div className="animate-fade-in flex flex-col justify-center min-w-0">
               <h1 className="text-[14px] font-black text-transparent bg-clip-text bg-gradient-to-r from-warning-400 via-warning-200 to-warning-400 drop-shadow-sm leading-tight uppercase tracking-wide w-full">
                 UBND tỉnh Hà Tĩnh
               </h1>
               <p className="text-[8.5px] font-bold text-txt-primary uppercase leading-tight tracking-tight mt-0.5">
                 Ban QLDA Đầu tư xây dựng<br />Dân dụng & Hạ tầng khu vực
               </p>
            </div>
          </div>

          {/* Logo - Collapsed state */}
          <div className={`hidden transition-all duration-300 ${isCollapsed ? 'md:flex justify-center' : ''}`}>
             <div className="w-10 h-10 bg-bg-surface rounded-lg p-0.5 flex items-center justify-center shrink-0 shadow-card border border-border">
               <LogoDDCN className="w-full h-full" />
             </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className={`flex-1 overflow-y-auto min-h-0 p-4 ${isCollapsed ? 'md:px-2' : 'px-4'} space-y-1 no-scrollbar`}>
          {/* Skeleton — shown while permissions are loading to prevent flash of empty/wrong menu */}
          {permLoading && !isContractor && (
            <div className="space-y-1 animate-pulse">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isCollapsed ? 'md:px-0 md:justify-center' : ''}`}>
                  <div className="w-[18px] h-[18px] rounded bg-bg-muted shrink-0" />
                  {!isCollapsed && <div className="h-3 rounded bg-bg-muted flex-1" style={{ width: `${50 + (i * 13) % 35}%` }} />}
                </div>
              ))}
            </div>
          )}
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) => `
                relative w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-1
                ${isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-card border-l-[3px] border-l-primary-600 dark:border-l-primary-500'
                  : 'text-txt-muted hover:bg-bg-muted hover:text-txt-primary border-l-[3px] border-l-transparent'
                }
                ${isCollapsed ? 'md:px-0 md:justify-center' : ''}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`
                    w-[18px] h-[18px] shrink-0 transition-transform
                    ${isActive ? '' : 'group-hover:scale-110'}
                  `} />

                  <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100 flex-1'}`}>
                       {item.name}
                  </span>

                  {/* Badge */}
                  {item.badge && !isCollapsed && (
                    <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md leading-none bg-primary-500 text-white shadow-lg">
                      {item.badge}
                    </span>
                  )}
                  {item.badge && isCollapsed && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500 border-2 border-bg-surface" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Footer ── */}
      <div className={`p-4 border-t border-border-subtle space-y-1 ${isCollapsed ? 'md:px-2' : ''}`}>
        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-1
              text-txt-muted hover:bg-bg-muted hover:text-txt-primary border-l-[3px] border-l-transparent
              ${isCollapsed ? 'md:px-0 md:justify-center' : ''}
            `}
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-[18px] h-[18px]" />
            ) : (
              <>
                <ChevronLeft className="w-[18px] h-[18px]" />
                <span className="flex-1 text-left">Thu gọn</span>
              </>
            )}
          </button>
        )}

        {/* Settings (Admin Only) — canh theo cùng điều kiện guard của trang Settings
            (currentUser.Role === 'Admin') để admin luôn thấy link, không phụ thuộc
            vào việc resolve systemRole vốn có thể chập chờn. */}
        {(currentUser?.Role === 'Admin' || can('admin_accounts', 'view')) && (
          <NavLink
            to="/settings"
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-1
              text-txt-muted hover:bg-bg-muted hover:text-txt-primary border-l-[3px] border-l-transparent
              ${isCollapsed ? 'md:px-0 md:justify-center' : ''}
            `}
            title={isCollapsed ? 'Cài đặt hệ thống' : undefined}
          >
            <Settings className="w-[18px] h-[18px]" />
            {!isCollapsed && <span className="flex-1 text-left">Cài đặt hệ thống</span>}
          </NavLink>
        )}

        {/* Logout */}
        <button
          onClick={() => { logout(); }}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-1
            text-txt-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border-l-[3px] border-l-transparent
            ${isCollapsed ? 'md:px-0 md:justify-center' : ''}
          `}
          title={isCollapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!isCollapsed && <span className="flex-1 text-left">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

// triggered hot reload
