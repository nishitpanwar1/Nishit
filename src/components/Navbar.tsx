import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { RiseUpLogo } from './RiseUpLogo';
import { UserAccountMenu } from './UserAccountMenu';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const {
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    user,
    notifications,
    openUploadModal,
    setSelectedVideo,
  } = useApp();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const handleCloseAccountMenu = useCallback(() => {
    setIsAccountMenuOpen(false);
  }, []);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      setCurrentView('search');
    }
  };

  const userInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'B';

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-neutral-800 z-50 flex items-center justify-between px-3 sm:px-5 select-none text-white">
      {/* Left: Hamburger menu + RiseUp Logo */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-lg hover:bg-neutral-900 active:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          title="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div
          onClick={() => {
            setSelectedVideo(null);
            setCurrentView('feed');
          }}
          className="cursor-pointer flex items-center hover:opacity-90 transition-opacity"
          title="RiseUp Video"
        >
          <RiseUpLogo className="h-7 w-auto" />
        </div>
      </div>

      {/* Center: Command Palette Search Bar */}
      <div className="flex items-center justify-center flex-1 max-w-[560px] mx-2 sm:mx-6">
        <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
          <div className="flex items-center flex-1 h-9 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus-within:border-white focus-within:ring-1 focus-within:ring-white rounded-lg px-3 transition-all">
            <span className="material-symbols-outlined text-neutral-500 text-[18px] mr-2 shrink-0">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'search' && e.target.value.trim().length > 0) {
                  setCurrentView('search');
                }
              }}
              placeholder="Search streams, tracks, creators..."
              className="w-full bg-transparent text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-500 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            ) : (
              <span className="hidden md:inline-flex items-center text-[10px] font-mono text-neutral-500 border border-neutral-800 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Right Controls: Upload Drop, Notifications, Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        {/* Go Live Quick Action Button */}
        <button
          type="button"
          onClick={() => {
            setSelectedVideo(null);
            setCurrentView('golive');
          }}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-extrabold text-xs tracking-wider transition-colors shadow-sm font-mono"
          title="Go Live Direct"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>LIVE</span>
        </button>

        {/* Upload Action Button */}
        <button
          type="button"
          onClick={() => openUploadModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-extrabold text-xs tracking-wider transition-colors shadow-sm"
          title="New Drop"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span className="hidden sm:inline font-mono">NEW DROP</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => setCurrentView('notifications')}
          className="relative w-8 h-8 rounded-lg hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white ring-2 ring-black" />
          )}
        </button>

        {/* User Profile Avatar with YouTube-Style Dropdown Menu */}
        <button
          ref={profileButtonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsAccountMenuOpen((prev) => !prev);
          }}
          className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/30 hover:ring-white transition-all shrink-0 flex items-center justify-center bg-neutral-800 shadow-sm cursor-pointer relative z-50"
          title={user.displayName || user.username || 'Creator'}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-mono font-black text-white">
              {userInitial}
            </span>
          )}
        </button>

        {/* YouTube-Style Account Popup / Dropdown Menu */}
        <UserAccountMenu
          isOpen={isAccountMenuOpen}
          onClose={handleCloseAccountMenu}
          anchorRef={profileButtonRef}
        />
      </div>
    </header>
  );
};
