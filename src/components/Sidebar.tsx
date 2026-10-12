import React from 'react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const { currentView, setCurrentView, setSelectedVideo } = useApp();

  const handleNavClick = (viewId: string) => {
    setSelectedVideo(null);
    setCurrentView(viewId);
  };

  const primaryNav = [
    { id: 'feed', label: 'Cinema Deck', icon: 'grid_view' },
    { id: 'shorts', label: 'Short Reels', icon: 'bolt' },
    { id: 'rooms', label: 'Focus Rooms', icon: 'groups' },
    { id: 'shop', label: 'Digital Vault', icon: 'diamond' },
  ];

  const youNav = [
    { id: 'history', label: 'History', icon: 'history', target: 'history' },
    { id: 'watch-later', label: 'Saved Queue', icon: 'bookmark', target: 'watchlater' },
    { id: 'liked', label: 'Liked Videos', icon: 'thumb_up', target: 'liked' },
    { id: 'your-videos', label: 'Your Videos', icon: 'video_library', target: 'profile' },
  ];

  const exploreNav = [
    { id: 'trending', label: 'Arena Leaderboard', icon: 'trophy', target: 'arena' },
    { id: 'focus', label: 'Discipline Sprint', icon: 'timer', target: 'discipline' },
    { id: 'settings', label: 'Settings', icon: 'settings', target: 'settings' },
  ];

  if (!isOpen) {
    // Collapsed compact rail (0 Studio on main rail)
    return (
      <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-[72px] bg-black border-r border-neutral-800 z-40 flex-col items-center py-3 select-none text-neutral-400">
        {primaryNav.map((item) => {
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-14 py-2.5 flex flex-col items-center justify-center rounded-lg transition-all mb-1 ${
                active
                  ? 'bg-white text-black font-extrabold shadow-sm'
                  : 'hover:bg-neutral-900 hover:text-white text-neutral-400'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              <span className="text-[9px] font-mono mt-1 tracking-tight truncate max-w-[50px] uppercase">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => handleNavClick('profile')}
          className="w-14 py-2.5 flex flex-col items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all mt-auto mb-2"
        >
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="text-[9px] font-mono mt-1 tracking-tight uppercase">You</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-[240px] bg-black border-r border-neutral-800 z-40 flex-col justify-between overflow-y-auto no-scrollbar select-none px-3 py-4 text-white">
      <div className="flex flex-col space-y-5">
        {/* Primary Navigation */}
        <div className="flex flex-col space-y-1">
          {primaryNav.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3.5 px-3 h-9 rounded-lg text-xs font-semibold transition-all text-left ${
                  active
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-neutral-800" />

        {/* You Section */}
        <div className="flex flex-col space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono tracking-wider uppercase text-neutral-500 font-bold">
            You
          </div>

          {youNav.map((item) => {
            const active = currentView === item.target;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.target)}
                className={`flex items-center gap-3.5 px-3 h-9 rounded-lg text-xs font-semibold transition-all text-left ${
                  active
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-neutral-800" />

        {/* Explore Section */}
        <div className="flex flex-col space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono tracking-wider uppercase text-neutral-500 font-bold">
            Explore
          </div>

          {exploreNav.map((item) => {
            const active = currentView === item.target;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.target)}
                className={`flex items-center gap-3.5 px-3 h-9 rounded-lg text-xs font-semibold transition-all text-left ${
                  active
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RiseUp Monochrome Footer */}
      <div className="pt-4 border-t border-neutral-800 px-3 space-y-2 text-[10px] text-neutral-500 font-mono">
        <div className="flex items-center justify-between text-neutral-400">
          <span>RISEUP CINEMA</span>
          <span>● ONLINE</span>
        </div>
        <p className="text-[10px] text-neutral-600">
          Pure monochrome video architecture.
        </p>
      </div>
    </aside>
  );
};
