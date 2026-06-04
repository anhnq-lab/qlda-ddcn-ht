import type React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCircle,
  BarChart2,
  BookOpen,
  User,
  Scale,
  FolderTree,
  Layers,
  CalendarRange,
  Calendar,
  GitBranch,
  LayoutList,
  Landmark,
} from 'lucide-react';
import type { PermissionResource } from '../types/permission.types';

// ========================================
// SIDEBAR MODULE REGISTRY — single source of truth
// Dùng chung bởi Sidebar (hiển thị) và SidebarModuleManager (cấu hình ẩn/hiện).
// `path` đồng thời là `module_key` lưu trong bảng sidebar_module_config.
// ========================================

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  /** Permission resource needed to see this item */
  resource?: PermissionResource;
}

export const navItems: NavItem[] = [
  { name: 'Tổng quan', path: '/', icon: LayoutDashboard, resource: 'dashboard' },
  { name: 'Dashboard cá nhân', path: '/my-dashboard', icon: User },
  { name: 'Lịch cơ quan', path: '/calendar', icon: Calendar, resource: 'calendar' },
  { name: 'Quản lý dự án', path: '/projects', icon: Briefcase, resource: 'projects' },
  { name: 'Quản lý công việc', path: '/work-plan', icon: LayoutList, resource: 'tasks' },
  { name: 'Nhân sự', path: '/employees', icon: UserCircle, resource: 'employees' },
  { name: 'Tài sản công', path: '/tai-san-cong', icon: Landmark, resource: 'projects' },
  { name: 'Nhà thầu', path: '/contractors', icon: Users, resource: 'contractors' },
  { name: 'Đấu thầu & Hợp đồng', path: '/bidding', icon: Briefcase, resource: 'bidding' },
  { name: 'KH Vốn & Giải ngân', path: '/capital-planning', icon: CalendarRange, resource: 'capital' },
  { name: 'Môi trường dữ liệu chung', path: '/cde', icon: FolderTree, resource: 'cde' },
  { name: 'Mô hình BIM', path: '/bim', icon: Layers, resource: 'bim' },
  { name: 'Văn bản pháp luật', path: '/legal-documents', icon: Scale, resource: 'legal_docs' },
  { name: 'Báo cáo', path: '/reports', icon: BarChart2, resource: 'reports' },
  { name: 'Quy chế làm việc', path: '/regulations', icon: BookOpen, resource: 'regulations' },
  { name: 'Quy trình', path: '/quy-trinh', icon: GitBranch, resource: 'workflows' },
];

// Contractor-only: limited menu
export const contractorNavItems: NavItem[] = [
  { name: 'Quản lý tài liệu', path: '/cde', icon: FolderTree },
  { name: 'Đấu thầu & Hợp đồng', path: '/bidding', icon: Briefcase },
];
