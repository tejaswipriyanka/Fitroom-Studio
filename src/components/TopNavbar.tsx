import React from 'react';
import { LogOut, Menu, Settings, User } from 'lucide-react';
import { AuthUser, FitroomSettings, GuestProfile } from '../types';

interface TopNavbarProps {
  authUser: AuthUser | null;
  guestProfile: GuestProfile;
  settings: FitroomSettings;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  isSidebarOpenMobile: boolean;
  onToggleSidebarMobile: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  authUser,
  guestProfile,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
  isSidebarOpenMobile,
  onToggleSidebarMobile,
}) => {
  return (
    <header className="h-14 bg-white dark:bg-[#0c0c0e] border-b border-stone-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          aria-label={isSidebarOpenMobile ? 'Close stylist drawer' : 'Open stylist drawer'}
          className="md:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center shrink-0">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-14_at_12.04.58_AM_6b830908.jpeg"
            alt="Fitroom Studio"
            referrerPolicy="no-referrer"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-cover border border-stone-200 dark:border-zinc-700 bg-[#FAF9F6]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900 transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <span className="w-6 h-6 rounded-full bg-blue-700 dark:bg-[#8c4a1e] text-white text-[11px] font-semibold flex items-center justify-center">
            {guestProfile.avatarInitials || <User className="w-3.5 h-3.5" />}
          </span>
          <span className="hidden sm:inline text-xs font-medium text-stone-800 dark:text-stone-200 max-w-[140px] truncate">
            {guestProfile.name}
          </span>
          {guestProfile.skinToneMonk !== undefined && (
            <span className="hidden lg:inline text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
              MST {guestProfile.skinToneMonk}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open studio settings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-800 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-900 transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-zinc-900 transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
