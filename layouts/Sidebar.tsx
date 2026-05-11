import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LogoDDCN } from '../components/common/LogoDDCN';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  CreditCard,
  FileBox,
  Settings,
  LogOut,
  UserCircle,
  CheckSquare,
  BarChart2,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  Scale,
  FolderTree,
  ShieldCheck,
  Layers,
  CalendarRange,
  GitBranch,
  Network,
  LayoutList,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import type { PermissionResource } from '../types/permission.types';

// ========================================
// SIDEBAR COMPONENT — Ban DDCN TP.HCM Theme (Amber Style)
// ========================================

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  /** Permission resource needed to see this item */
  resource?: PermissionResource;
}

const navItems: NavItem[] = [
  { name: 'Tổng quan', path: '/', icon: LayoutDashboard, resource: 'dashboard' },
  { name: 'Dashboard cá nhân', path: '/my-dashboard', icon: User },
  { name: 'Quản lý dự án', path: '/projects', icon: Briefcase, resource: 'projects' },
  { name: 'Quản lý công việc', path: '/work-plan', icon: LayoutList, resource: 'tasks' },
  { name: 'Nhân sự', path: '/employees', icon: UserCircle, resource: 'employees' },
  { name: 'Nhà thầu', path: '/contractors', icon: Users, resource: 'contractors' },
  { name: 'Đấu thầu & Hợp đồng', path: '/bidding', icon: Briefcase, resource: 'bidding' },
  { name: 'KH Vốn & Giải ngân', path: '/capital-planning', icon: CalendarRange, resource: 'capital' },
  { name: 'Môi trường dữ liệu chung', path: '/cde', icon: FolderTree, resource: 'cde' },
  { name: 'Mô hình BIM', path: '/bim', icon: Layers, resource: 'bim' },
  { name: 'Văn bản pháp luật', path: '/legal-documents', icon: Scale, resource: 'legal_docs' },
  { name: 'Báo cáo', path: '/reports', icon: BarChart2, resource: 'reports' },
  { name: 'Quy chế làm việc', path: '/regulations', icon: BookOpen, resource: 'regulations' },
  { name: 'Đánh giá, xếp loại', path: '/evaluation', icon: ClipboardCheck },
  { name: 'Quy trình', path: '/quy-trinh', icon: GitBranch, resource: 'workflows' },
  { name: 'Quản lý tài khoản', path: '/admin', icon: ShieldCheck, resource: 'admin_accounts' },
  { name: 'Nhật ký hệ thống', path: '/audit-log', icon: Network, resource: 'admin_audit' },
];

// Contractor-only: limited menu
const contractorNavItems: NavItem[] = [
  { name: 'Quản lý tài liệu', path: '/cde', icon: FolderTree },
  { name: 'Đấu thầu & Hợp đồng', path: '/bidding', icon: Briefcase },
];


const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  onClose
}) => {
  const { currentUser, logout, userType } = useAuth();
  const { can } = usePermissionCheck();
  const isContractor = userType === 'contractor';

  // Filter nav items based on permissions
  const visibleNavItems = useMemo(() => {
    // Contractors get a limited menu
    if (isContractor) return contractorNavItems;
    return navItems.filter(item => {
      if (!item.resource) return true; // No resource = always visible  
      return can(item.resource, 'view');
    });
  }, [can, isContractor]);


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
        <div className={`relative h-16 px-4 shrink-0 flex items-center justify-between ${isCollapsed ? 'md:px-3 md:justify-center' : ''} border-b border-slate-100 dark:border-slate-800`}>
          {/* Subtle gradient accent line at bottom */}
          <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

          {/* Logo - Expanded state */}
          <div className={`flex items-center overflow-hidden transition-all duration-300 gap-3 ${isCollapsed ? 'md:hidden' : 'w-auto'}`}>
            <div className="w-10 h-10 bg-bg-surface rounded-lg p-0.5 flex items-center justify-center shrink-0 shadow-lg border border-border">
               <LogoDDCN className="w-full h-full" />
            </div>
            <div className="animate-fade-in flex flex-col justify-center min-w-0">
               <h1 className="text-[11px] font-black text-slate-900 dark:text-slate-100 leading-tight uppercase tracking-tight w-full">Ban QLDA Đầu tư xây dựng Dân dụng & Hạ tầng khu vực</h1>
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">UBND tỉnh Hà Tĩnh</p>
            </div>
          </div>

          {/* Logo - Collapsed state */}
          <div className={`hidden transition-all duration-300 ${isCollapsed ? 'md:flex justify-center' : ''}`}>
             <div className="w-10 h-10 bg-bg-surface rounded-lg p-0.5 flex items-center justify-center shrink-0 shadow-lg border border-border">
               <LogoDDCN className="w-full h-full" />
             </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className={`flex-1 overflow-y-auto min-h-0 p-4 ${isCollapsed ? 'md:px-2' : 'px-4'} space-y-1 no-scrollbar`}>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) => `
                relative w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-1
                ${isActive
                  ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400 shadow-lg dark:shadow-primary-500/5 border-l-[3px] border-l-primary-600 dark:border-l-primary-500'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 border-l-[3px] border-l-transparent'
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
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500 border-2 border-white dark:border-slate-900" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Footer ── */}
      <div className={`p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 ${isCollapsed ? 'md:px-2' : ''}`}>
        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-1
              text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 border-l-[3px] border-l-transparent
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

        {/* Settings */}
        <NavLink
          to="/settings"
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-1
            text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 border-l-[3px] border-l-transparent
            ${isCollapsed ? 'md:px-0 md:justify-center' : ''}
          `}
          title={isCollapsed ? 'Cài đặt' : undefined}
        >
          <Settings className="w-[18px] h-[18px]" />
          {!isCollapsed && <span className="flex-1 text-left">Cài đặt</span>}
        </NavLink>

        {/* Logout */}
        <button
          onClick={() => { logout(); }}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold rounded-lg transition-all mb-1
            text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border-l-[3px] border-l-transparent
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
