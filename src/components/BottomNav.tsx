import React from 'react';
import { Home, Compass, Plus, MessageCircle, User as UserIcon } from 'lucide-react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onSelectScreen: (screen: Screen) => void;
  onOpenCreateMenu: () => void;
  unreadCount?: number;
  userAvatar?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenCreateMenu,
  unreadCount = 3,
  userAvatar,
}) => {
  return (
    <nav
      id="app-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur-lg border-t border-white/10 max-w-2xl mx-auto flex items-center justify-around py-1.5 px-3 select-none"
    >
      {/* Home Tab */}
      <button
        type="button"
        id="nav-tab-home"
        onClick={() => onSelectScreen('home')}
        className={`flex flex-col items-center justify-center p-1.5 transition-all ${
          currentScreen === 'home' ? 'text-rose-500 scale-105' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <Home size={20} />
        <span className="text-[10px] font-medium mt-0.5">Home</span>
      </button>

      {/* Explore Tab */}
      <button
        type="button"
        id="nav-tab-explore"
        onClick={() => onSelectScreen('explore')}
        className={`flex flex-col items-center justify-center p-1.5 transition-all ${
          currentScreen === 'explore' ? 'text-rose-500 scale-105' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <Compass size={20} />
        <span className="text-[10px] font-medium mt-0.5">Explore</span>
      </button>

      {/* CENTER CREATE (+) BUTTON (Post Video / Go Live) */}
      <button
        type="button"
        id="nav-btn-create-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenCreateMenu();
        }}
        className="relative -top-2 flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 text-white shadow-lg shadow-rose-500/30 transition-transform hover:scale-105 active:scale-95 border border-white/20"
        title="Create (Post Video / Go Live)"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Chat / Messages Tab */}
      <button
        type="button"
        id="nav-tab-chat"
        onClick={() => onSelectScreen('chat')}
        className={`flex flex-col items-center justify-center p-1.5 relative transition-all ${
          currentScreen === 'chat' ? 'text-rose-500 scale-105' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <MessageCircle size={20} />
        <span className="text-[10px] font-medium mt-0.5">Chat</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Profile Tab */}
      <button
        type="button"
        id="nav-tab-profile"
        onClick={() => onSelectScreen('profile')}
        className={`flex flex-col items-center justify-center p-1.5 transition-all ${
          currentScreen === 'profile' ? 'text-rose-500 scale-105' : 'text-neutral-400 hover:text-white'
        }`}
      >
        {userAvatar ? (
          <div
            className={`w-5 h-5 rounded-full overflow-hidden border ${
              currentScreen === 'profile' ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-neutral-500'
            }`}
          >
            <img
              src={userAvatar}
              alt="Profile"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <UserIcon size={20} />
        )}
        <span className="text-[10px] font-medium mt-0.5">Profile</span>
      </button>
    </nav>
  );
};
