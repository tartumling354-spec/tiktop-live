import React from 'react';
import { Radio, Search, Bell, Coins, Award } from 'lucide-react';
import { Screen } from '../types';

interface NavbarProps {
  currentScreen: Screen;
  userCoins?: number;
  userDiamonds?: number;
  userPoints?: number;
  onOpenRecharge: () => void;
  onOpenWithdrawPoints?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userCoins,
  userDiamonds,
  userPoints = 0,
  onOpenRecharge,
  onOpenWithdrawPoints,
  onOpenSearch,
  onOpenNotifications,
}) => {
  const displayCoins = userCoins !== undefined ? userCoins : (userDiamonds ?? 0);
  const displayPoints = userPoints;

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

      {/* Right Action Pill: Coins (सिक्का) + Points (अंक) + Search + Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Coins Counter & Recharge Button */}
        <button
          type="button"
          id="btn-navbar-coins"
          onClick={onOpenRecharge}
          className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold text-amber-300 transition-all active:scale-95 shadow-sm"
          title="Coins (सिक्का) रिचार्ज गर्न ट्याप गर्नुहोस्"
        >
          <Coins size={13} className="text-amber-400" />
          <span>{displayCoins.toLocaleString()}</span>
        </button>

        {/* Points Option right next to Coins (xeuma points vanne option rakhnu) */}
        <button
          type="button"
          id="btn-navbar-points"
          onClick={onOpenWithdrawPoints}
          className="flex items-center gap-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold text-rose-300 transition-all active:scale-95 shadow-sm"
          title="Points (अंक) निकासी गर्न ट्याप गर्नुहोस्"
        >
          <Award size={13} className="text-rose-400" />
          <span>{displayPoints.toLocaleString()} Pts</span>
        </button>

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

