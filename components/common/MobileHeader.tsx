import React from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useImpersonation } from '../../context/ImpersonationContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { useSlidePanel } from '../../context/SlidePanelContext';
import { UserProfilePanel } from '../../features/profile/UserProfilePanel';
import { Avatar } from '../ui';
import { LogoDDCN } from './LogoDDCN';

interface MobileHeaderProps {
  onOpenSearch: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSearch }) => {
  const { currentUser } = useAuth();
  const { impersonatedUser, isImpersonating } = useImpersonation();
  const { openPanel } = useSlidePanel();

  const displayUser = isImpersonating && impersonatedUser ? impersonatedUser : currentUser;

  const handleAvatarClick = () => {
    openPanel({
      title: 'Hồ sơ cá nhân',
      component: <UserProfilePanel />,
      width: '100vw' // Full width on mobile for better UX
    });
  };

  return (
    <header className="lg:hidden h-16 bg-bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sticky top-0 z-30 transition-colors duration-200 shadow-sm">
      {/* Trái: Avatar (Chạm mở Profile) & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleAvatarClick}
          className="relative focus:outline-none cursor-pointer"
          aria-label="Xem hồ sơ cá nhân"
        >
          <Avatar
            name={displayUser?.FullName || 'User'}
            imageUrl={displayUser?.AvatarUrl}
            size="sm"
            ringColor={isImpersonating ? "ring-amber-500 animate-pulse" : "ring-primary-100 dark:ring-primary-900/50"}
          />
          {isImpersonating && (
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-bg-surface" />
          )}
        </button>
        
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-bg-surface rounded-md p-0.5 flex items-center justify-center shrink-0 border border-border">
            <LogoDDCN className="w-full h-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-warning-500 to-warning-600 dark:from-warning-400 dark:to-warning-500 uppercase leading-none tracking-wide">
              Ban QLDA DDCN
            </span>
            <span className="text-[8px] font-bold text-txt-muted uppercase mt-0.5 leading-none">
              Hệ thống QLDA
            </span>
          </div>
        </div>
      </div>

      {/* Phải: Thông báo & Tìm kiếm */}
      <div className="flex items-center gap-1.5">
        {/* Nút Tìm kiếm */}
        <button
          onClick={onOpenSearch}
          aria-label="Tìm kiếm nhanh"
          className="p-2 text-txt-muted hover:text-txt-primary hover:bg-bg-subtle rounded-xl transition-all cursor-pointer"
        >
          <Search size={20} />
        </button>

        {/* Nút Thông báo */}
        <NotificationBell />
      </div>
    </header>
  );
};

export default MobileHeader;
