import React, { useState } from 'react';
import { AppProvider, useApp, isShortVideo } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { WatchView } from './views/WatchView';
import { MiniPlayer } from './components/MiniPlayer';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { UploadVideoModal } from './components/UploadVideoModal';
import { FocusQueueDrawer } from './components/FocusQueueDrawer';
import { FeedView } from './views/FeedView';
import { IntentView } from './views/IntentView';
import { ShortsView } from './views/ShortsView';
import { RoomsView } from './views/RoomsView';
import { ArenaView } from './views/ArenaView';
import { ShopView } from './views/ShopView';
import { DisciplineView } from './views/DisciplineView';
import { StudioView } from './views/StudioView';
import { WalletView } from './views/WalletView';
import { NotificationsView } from './views/NotificationsView';
import { SearchView } from './views/SearchView';
import { LibraryView } from './views/LibraryView';
import { SettingsView } from './views/SettingsView';
import { PolicyView } from './views/PolicyView';
import { ProfileView } from './views/ProfileView';
import { GoLiveView } from './views/GoLiveView';
import { SellProductView } from './views/SellProductView';

const MainLayout: React.FC = () => {
  const {
    currentView,
    selectedVideo,
    setSelectedVideo,
    isKeyboardShortcutsOpen,
    setIsKeyboardShortcutsOpen,
    isUploadModalOpen,
    setIsUploadModalOpen,
  } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isWatchPage = Boolean(selectedVideo && !isShortVideo(selectedVideo));

  const renderView = () => {
    if (isWatchPage && selectedVideo) {
      return (
        <WatchView
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onSelectVideo={(v) => setSelectedVideo(v)}
        />
      );
    }

    switch (currentView) {
      case 'feed':
        return <FeedView />;
      case 'intent':
        return <IntentView />;
      case 'shorts':
        return <ShortsView />;
      case 'rooms':
        return <RoomsView />;
      case 'arena':
        return <ArenaView />;
      case 'shop':
        return <ShopView />;
      case 'discipline':
        return <DisciplineView />;
      case 'studio':
        return <StudioView />;
      case 'wallet':
        return <WalletView />;
      case 'notifications':
        return <NotificationsView />;
      case 'search':
        return <SearchView />;
      case 'history':
        return <LibraryView type="history" />;
      case 'watchlater':
        return <LibraryView type="watchlater" />;
      case 'liked':
        return <LibraryView type="liked" />;
      case 'saved':
        return <LibraryView type="saved" />;
      case 'clips':
        return <LibraryView type="clips" />;
      case 'profile':
        return <ProfileView />;
      case 'golive':
        return <GoLiveView />;
      case 'sell':
        return <SellProductView />;
      case 'settings':
        return <SettingsView />;
      case 'policy':
        return <PolicyView />;
      default:
        return <FeedView />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Desktop & Laptop Fixed Sidebar */}
      {!isWatchPage && <Sidebar isOpen={isSidebarOpen} />}

      {/* Top Fixed Navigation */}
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev: boolean) => !prev)} />

      {/* Main Viewport Container */}
      <div
        className={`transition-all duration-200 ${
          isWatchPage ? 'pl-0' : isSidebarOpen ? 'pl-0 md:pl-[240px]' : 'pl-0 md:pl-[72px]'
        }`}
      >
        <main className="relative pt-14 bg-black min-h-screen flex flex-col w-full pb-16 md:pb-6">
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {!isWatchPage && <MobileNav />}

      {/* Picture-in-Picture Miniplayer (Persistent Background Player) */}
      {!selectedVideo && <MiniPlayer />}

      {/* Fast YouTube Studio Upload Modal */}
      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* YouTube Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />

      {/* Focus Queue & Flow Session Dock */}
      <FocusQueueDrawer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
