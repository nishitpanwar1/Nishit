import React from 'react';
import { useApp } from '../context/AppContext';

export const MobileNav: React.FC = () => {
  const { currentView, setCurrentView, openUploadModal, setSelectedVideo } = useApp();

  const handleNav = (view: string) => {
    setSelectedVideo(null);
    setCurrentView(view);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black border-t border-neutral-800 h-14 px-3 flex items-center justify-around select-none text-white">
      {/* Cinema Deck */}
      <button
        type="button"
        onClick={() => handleNav('feed')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          currentView === 'feed' ? 'text-white font-bold' : 'text-neutral-500 hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] ${currentView === 'feed' ? 'font-bold' : ''}`}>
          grid_view
        </span>
        <span className="text-[10px] font-mono leading-none mt-1">Deck</span>
      </button>

      {/* Short Reels */}
      <button
        type="button"
        onClick={() => handleNav('shorts')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          currentView === 'shorts' ? 'text-white font-bold' : 'text-neutral-500 hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] ${currentView === 'shorts' ? 'font-bold' : ''}`}>
          bolt
        </span>
        <span className="text-[10px] font-mono leading-none mt-1">Reels</span>
      </button>

      {/* Center Upload Drop Action */}
      <button
        type="button"
        onClick={() => openUploadModal()}
        className="flex items-center justify-center flex-1 py-1"
        title="Upload Video"
      >
        <div className="w-10 h-10 rounded-lg bg-white text-black hover:bg-neutral-200 flex items-center justify-center shadow-md active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[20px] font-bold">add</span>
        </div>
      </button>

      {/* Focus Rooms */}
      <button
        type="button"
        onClick={() => handleNav('rooms')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          currentView === 'rooms' ? 'text-white font-bold' : 'text-neutral-500 hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] ${currentView === 'rooms' ? 'font-bold' : ''}`}>
          groups
        </span>
        <span className="text-[10px] font-mono leading-none mt-1">Rooms</span>
      </button>

      {/* You / Channel */}
      <button
        type="button"
        onClick={() => handleNav('profile')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          currentView === 'profile' ? 'text-white font-bold' : 'text-neutral-500 hover:text-white'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] ${currentView === 'profile' ? 'font-bold' : ''}`}>
          account_circle
        </span>
        <span className="text-[10px] font-mono leading-none mt-1">You</span>
      </button>
    </nav>
  );
};
