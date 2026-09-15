import React from 'react';
import { Radio, Search, Bell } from 'lucide-react';
import { Screen } from '../types';

interface NavbarProps {
  currentScreen: Screen;
  userCoins?: number;
  userDiamonds?: number;
  userPoints?: number;
  onOpenRecharge?: () => void;
  onOpenWithdrawPoints?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenNotifications,
}) => {
  return (
    <header
      id="app-top-navbar"
      className="w-full bg-neutral-950/80 backdrop-blur-md border-b border-white/10 px-4 py-2.5 sticky top-0 z-40 flex items-center justify-between"
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
          <Radio size={18} className="animate-pulse" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-base tracking-tight text-white">TikTop</span>
            <span className="bg-rose-600 text-[8px] font-black px-1.5 py-0.2 rounded uppercase text-white tracking-widest">
              LIVE
            </span>
          </div>
          <span className="text-[9px] text-neutral-400 font-medium">Stream & Connect</span>
        </div>
      </div>

      {/* Right Action Icons: Search + Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          id="btn-navbar-search"
          onClick={onOpenSearch}
          className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors cursor-pointer"
          title="User ID खोज्नुहोस्"
        >
          <Search size={15} />
        </button>

        <button
          type="button"
          id="btn-navbar-bell"
          onClick={onOpenNotifications}
          className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors relative cursor-pointer"
          title="Notifications & Live Alerts"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
        </button>
      </div>
    </header>
  );
};

