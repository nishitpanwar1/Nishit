import React, { useState, useEffect, useMemo } from 'react';
import { useApp, isShortVideo } from '../context/AppContext';
import { VideoItem } from '../types';
import { formatTimestamp } from '../utils/videoEnhancements';

export type LibrarySectionType = 'your-videos' | 'history' | 'saved' | 'queue' | 'liked' | 'clips' | 'watchlater';

interface LibraryViewProps {
  type: LibrarySectionType;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ type }) => {
  const {
    videos,
    shorts,
    user,
    likedVideoIds,
    savedVideoIds,
    watchLaterIds,
    clips,
    deleteClip,
    setSelectedVideo,
    openShort,
    setCurrentView,
    openUploadModal,
    focusQueue,
    removeFromFocusQueue,
    clearFocusQueue,
    playNextInQueue,
    addToFocusQueue,
    toggleWatchLater,
    likeVideo,
    deleteVideo,
  } = useApp();

  // Active section tab (can be switched within the library view)
  const initialTab = type === 'watchlater' ? 'saved' : type;
  const [activeTab, setActiveTab] = useState<LibrarySectionType>(initialTab);
  const [yourVideosFilter, setYourVideosFilter] = useState<'all' | 'videos' | 'shorts'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<VideoItem[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Sync internal active tab if prop changes
  useEffect(() => {
    setActiveTab(type === 'watchlater' ? 'saved' : type);
  }, [type]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Watch history tracking via localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('riseup_watch_history');
      if (raw) {
        const parsedIds: string[] = JSON.parse(raw);
        const mapped = parsedIds
          .map((id) => videos.find((v) => v.id === id) || shorts.find((s) => s.id === id))
          .filter(Boolean) as VideoItem[];
        setHistoryList(mapped);
      } else {
        // Fallback demo history from standard videos
        setHistoryList(videos.filter((v) => !isShortVideo(v)).slice(0, 6));
      }
    } catch {
      setHistoryList(videos.filter((v) => !isShortVideo(v)).slice(0, 6));
    }
  }, [videos, shorts]);

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('riseup_watch_history');
    } catch {}
    setHistoryList([]);
    showToast('Watch history cleared');
  };

  // Filter user's uploaded videos and shorts for "Your Videos"
  const userVideos = useMemo(() => {
    return videos.filter(
      (v) =>
        !isShortVideo(v) &&
        (v.creatorId === user.id ||
          v.creatorUsername === user.username ||
          v.creatorName === user.displayName ||
          v.creatorUsername === 'you' ||
          v.creatorUsername === 'creator')
    );
  }, [videos, user]);

  const userShorts = useMemo(() => {
    return shorts.filter(
      (s) =>
        s.creatorId === user.id ||
        s.creatorUsername === user.username ||
        s.creatorName === user.displayName ||
        s.creatorUsername === 'you' ||
        s.creatorUsername === 'creator'
    );
  }, [shorts, user]);

  // Combined user content
  const allUserDrops = useMemo(() => {
    if (yourVideosFilter === 'videos') return userVideos;
    if (yourVideosFilter === 'shorts') return userShorts;
    return [...userVideos, ...userShorts];
  }, [userVideos, userShorts, yourVideosFilter]);

  // Filtered lists for each section
  const savedVideos = useMemo(() => {
    return videos.filter((v) => watchLaterIds.includes(v.id) || savedVideoIds.includes(v.id));
  }, [videos, watchLaterIds, savedVideoIds]);

  const likedVideos = useMemo(() => {
    return videos.filter((v) => likedVideoIds.includes(v.id));
  }, [videos, likedVideoIds]);

  // Calculate format stats
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:05';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatViews = (count?: number) => {
    if (!count) return '0 plays';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M plays`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K plays`;
    return `${count} plays`;
  };

  const handlePlayVideo = (video: VideoItem) => {
    // Record to watch history
    try {
      const raw = localStorage.getItem('riseup_watch_history');
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const updated = [video.id, ...existing.filter((id) => id !== video.id)].slice(0, 30);
      localStorage.setItem('riseup_watch_history', JSON.stringify(updated));
    } catch {}

    if (isShortVideo(video)) {
      openShort(video.id);
    } else {
      setSelectedVideo(video);
    }
  };

  const handlePlayAll = (list: VideoItem[]) => {
    if (list.length === 0) return;
    const [first, ...rest] = list;
    handlePlayVideo(first);
    rest.forEach((item) => addToFocusQueue(item));
    showToast(`Playing first drop and queued ${rest.length} drops to Focus Queue`);
  };

  const handleDeleteUserDrop = async (e: React.MouseEvent, dropId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this drop permanently from RiseUp?')) {
      await deleteVideo(dropId);
      showToast('Drop removed from your channel');
    }
  };

  const tabs: Array<{ id: LibrarySectionType; label: string; icon: string; count?: number }> = [
    { id: 'your-videos', label: 'Your Videos', icon: 'video_library', count: userVideos.length + userShorts.length },
    { id: 'history', label: 'History', icon: 'history', count: historyList.length },
    { id: 'saved', label: 'Saved', icon: 'bookmark', count: savedVideos.length },
    { id: 'queue', label: 'Queue', icon: 'queue_music', count: focusQueue.length },
    { id: 'liked', label: 'Liked Videos', icon: 'thumb_up', count: likedVideos.length },
    { id: 'clips', label: 'Clips', icon: 'content_cut', count: clips.length },
  ];

  // Header content per active tab
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'your-videos':
        return {
          title: 'Your Videos',
          subtitle: 'Manage and monitor your uploaded protocols, video masterclasses, and reels.',
          icon: 'video_library',
          count: `${userVideos.length + userShorts.length} drops`,
        };
      case 'history':
        return {
          title: 'Watch History',
          subtitle: 'Your record of completed study sessions, focus drops, and architecture reels.',
          icon: 'history',
          count: `${historyList.length} watched`,
        };
      case 'saved':
      case 'watchlater':
        return {
          title: 'Saved Collection',
          subtitle: 'Deep study protocols and priority videos queued for future focus sprints.',
          icon: 'bookmark',
          count: `${savedVideos.length} saved`,
        };
      case 'queue':
        return {
          title: 'Focus Queue',
          subtitle: 'Real-time sequence of tracks and protocols queued for non-stop playback.',
          icon: 'queue_music',
          count: `${focusQueue.length} queued`,
        };
      case 'liked':
        return {
          title: 'Liked Videos',
          subtitle: 'Protocols and masterclasses you have upvoted and endorsed across the network.',
          icon: 'thumb_up',
          count: `${likedVideos.length} liked`,
        };
      case 'clips':
        return {
          title: 'Your Video Clips',
          subtitle: 'High-signal timestamps and clips captured from long-form engineering lectures.',
          icon: 'content_cut',
          count: `${clips.length} clips`,
        };
      default:
        return {
          title: 'Your Videos',
          subtitle: 'Your creator library on RiseUp.',
          icon: 'video_library',
          count: '0 items',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="w-full min-h-screen bg-black text-white py-6 px-4 sm:px-8 select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white border border-neutral-700 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs Bar - All 5 Core Options in Sleek Monochrome */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-neutral-800">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'saved') setCurrentView('saved');
                  else if (tab.id === 'your-videos') setCurrentView('your-videos');
                  else setCurrentView(tab.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono tracking-tight shrink-0 transition-all ${
                  active
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-850'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
                <span className="uppercase">{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      active ? 'bg-black text-white' : 'bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[24px]">{headerInfo.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                  {headerInfo.title}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-neutral-900 text-neutral-300 border border-neutral-800">
                  {headerInfo.count}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl font-mono leading-relaxed">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Contextual Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {activeTab === 'your-videos' && (
              <>
                <button
                  type="button"
                  onClick={() => openUploadModal()}
                  className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>NEW DROP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('studio')}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono font-semibold rounded-lg transition-colors border border-neutral-800 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">token</span>
                  <span>STUDIO</span>
                </button>
              </>
            )}

            {activeTab === 'history' && (
              <>
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-semibold rounded-lg transition-colors border border-neutral-800 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    <span>CLEAR HISTORY</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentView('feed')}
                  className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                  <span>EXPLORE DECK</span>
                </button>
              </>
            )}

            {activeTab === 'saved' && (
              <>
                {savedVideos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handlePlayAll(savedVideos)}
                    className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    <span>PLAY ALL</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentView('feed')}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono font-semibold rounded-lg transition-colors border border-neutral-800 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>DISCOVER</span>
                </button>
              </>
            )}

            {activeTab === 'queue' && (
              <>
                {focusQueue.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={playNextInQueue}
                      className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      <span>PLAY NEXT</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearFocusQueue}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-semibold rounded-lg transition-colors border border-neutral-800 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">clear_all</span>
                      <span>CLEAR QUEUE</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentView('feed')}
                    className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">queue</span>
                    <span>QUEUE DROPS</span>
                  </button>
                )}
              </>
            )}

            {activeTab === 'liked' && (
              <>
                {likedVideos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handlePlayAll(likedVideos)}
                    className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    <span>PLAY ALL</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentView('feed')}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-mono font-semibold rounded-lg transition-colors border border-neutral-800 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                  <span>FIND DROPS</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. TAB: YOUR VIDEOS                                           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'your-videos' && (
          <div className="space-y-5">
            {/* Filter Sub-Tabs for Your Videos (All / Videos / Shorts) */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: `All Drops (${userVideos.length + userShorts.length})` },
                  { id: 'videos', label: `Standard Videos (${userVideos.length})` },
                  { id: 'shorts', label: `Shorts (${userShorts.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setYourVideosFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-tight transition-all ${
                      yourVideosFilter === f.id
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="text-xs font-mono text-neutral-400 hidden sm:block">
                Creator: <span className="text-white font-bold">@{user.username || 'creator'}</span>
              </div>
            </div>

            {allUserDrops.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-2xl bg-neutral-950 border border-neutral-850 text-center space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <span className="material-symbols-outlined text-[32px]">video_library</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-sans">No drops published yet</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
                    Start publishing high-yield engineering walkthroughs, discipline protocols, and architecture reels to build your channel audience.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => openUploadModal()}
                    className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-mono font-extrabold text-xs uppercase rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Upload First Drop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('profile')}
                    className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase rounded-lg transition-colors border border-neutral-800"
                  >
                    View Channel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {allUserDrops.map((video) => {
                  const isShort = isShortVideo(video);
                  return (
                    <div
                      key={video.id}
                      onClick={() => handlePlayVideo(video)}
                      className="group flex flex-col justify-between bg-neutral-950 border border-neutral-850 hover:border-neutral-700 hover:bg-neutral-900/50 rounded-xl p-3 transition-all cursor-pointer shadow-sm relative"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-3">
                        <img
                          src={
                            video.thumbnailUrl ||
                            (isShort
                              ? 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80'
                              : 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80')
                          }
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          {isShort ? (
                            <span className="bg-black/90 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-neutral-800 uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">bolt</span>
                              Reel
                            </span>
                          ) : (
                            <span className="bg-black/90 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-neutral-800 uppercase">
                              Drop
                            </span>
                          )}
                          <span className="bg-white text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                            PUBLIC
                          </span>
                        </div>
                        <span className="absolute bottom-2 right-2 bg-black/90 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-neutral-800">
                          {formatDuration(video.durationSeconds || video.duration)}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:underline">
                          {video.title}
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                          <span>{formatViews(video.viewsCount)}</span>
                          <span>{video.createdAt || 'Recent'}</span>
                        </div>
                      </div>

                      {/* Card Action Row */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-850">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">
                          {video.category || 'General'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = `${window.location.origin}/?v=${video.id}`;
                              navigator.clipboard?.writeText(link);
                              showToast('Link copied to clipboard');
                            }}
                            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                            title="Copy Direct Link"
                          >
                            <span className="material-symbols-outlined text-[16px]">share</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteUserDrop(e, video.id)}
                            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                            title="Delete drop"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. TAB: WATCH HISTORY                                         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'history' && (
          <div className="space-y-5">
            {historyList.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-2xl bg-neutral-950 border border-neutral-850 text-center space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <span className="material-symbols-outlined text-[32px]">history</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-sans">No watch history yet</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
                    Videos you watch on RiseUp will appear here so you can easily resume study sessions and retrieve masterclasses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('feed')}
                  className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-mono font-extrabold text-xs uppercase rounded-lg transition-colors shadow-sm"
                >
                  Explore Cinema Deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {historyList.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handlePlayVideo(video)}
                    className="group flex flex-col justify-between bg-neutral-950 border border-neutral-850 hover:border-neutral-700 hover:bg-neutral-900/50 rounded-xl p-3 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-3">
                      <img
                        src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/90 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-neutral-800">
                        {formatDuration(video.durationSeconds || video.duration)}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:underline">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                        <span className="truncate max-w-[150px]">{video.creatorName || video.creatorUsername}</span>
                        <span>{video.createdAt || 'Recent'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-850">
                      <span className="text-[10px] font-mono text-neutral-500">Watched</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToFocusQueue(video);
                            showToast('Added to Focus Queue');
                          }}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                          title="Queue video"
                        >
                          <span className="material-symbols-outlined text-[16px]">queue</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchLater(video);
                            showToast('Updated Saved collection');
                          }}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                          title="Save video"
                        >
                          <span className="material-symbols-outlined text-[16px]">bookmark</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. TAB: SAVED (WATCH LATER)                                   */}
        {/* ------------------------------------------------------------- */}
        {(activeTab === 'saved' || activeTab === 'watchlater') && (
          <div className="space-y-5">
            {savedVideos.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-2xl bg-neutral-950 border border-neutral-850 text-center space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <span className="material-symbols-outlined text-[32px]">bookmark</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-sans">No saved videos yet</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
                    Bookmark protocols and masterclasses to watch later during your dedicated focus sprints.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('feed')}
                  className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-mono font-extrabold text-xs uppercase rounded-lg transition-colors shadow-sm"
                >
                  Browse Cinema Deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {savedVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handlePlayVideo(video)}
                    className="group flex flex-col justify-between bg-neutral-950 border border-neutral-850 hover:border-neutral-700 hover:bg-neutral-900/50 rounded-xl p-3 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-3">
                      <img
                        src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/90 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-neutral-800">
                        {formatDuration(video.durationSeconds || video.duration)}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:underline">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                        <span className="truncate max-w-[150px]">{video.creatorName || video.creatorUsername}</span>
                        <span>{video.createdAt || 'Recent'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-850">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchLater(video);
                          showToast('Removed from Saved');
                        }}
                        className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">bookmark_remove</span>
                        <span>Remove</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToFocusQueue(video);
                          showToast('Added to Queue');
                        }}
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                        title="Add to queue"
                      >
                        <span className="material-symbols-outlined text-[16px]">queue</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. TAB: FOCUS QUEUE                                           */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'queue' && (
          <div className="space-y-5">
            {focusQueue.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-2xl bg-neutral-950 border border-neutral-850 text-center space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <span className="material-symbols-outlined text-[32px]">queue_music</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-sans">Focus Queue is empty</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
                    Hover over drops across Cinema Deck and click "Queue" to build a dedicated playlist for uninterrupted study sessions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('feed')}
                  className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-mono font-extrabold text-xs uppercase rounded-lg transition-colors shadow-sm"
                >
                  Explore Cinema Deck
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {focusQueue.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    onClick={() => handlePlayVideo(item)}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 bg-neutral-950 border border-neutral-850 hover:border-neutral-700 hover:bg-neutral-900/40 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold text-neutral-500 w-6 shrink-0 text-center">
                        #{index + 1}
                      </span>
                      <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                        <img
                          src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/90 text-[9px] font-mono px-1 py-0.2 rounded text-white border border-neutral-800">
                          {formatDuration(item.durationSeconds || item.duration)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-xs font-bold text-white truncate group-hover:underline">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                          <span>{item.creatorName || item.creatorUsername}</span>
                          <span>•</span>
                          <span>{formatViews(item.viewsCount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVideo(item);
                          removeFromFocusQueue(item.id);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                        <span>PLAY</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromFocusQueue(item.id);
                          showToast('Removed from queue');
                        }}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                        title="Remove from queue"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. TAB: LIKED VIDEOS                                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'liked' && (
          <div className="space-y-5">
            {likedVideos.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-2xl bg-neutral-950 border border-neutral-850 text-center space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <span className="material-symbols-outlined text-[32px]">thumb_up</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-sans">No liked videos yet</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
                    Like drops that deliver peak value and insight. They will be archived here for easy retrieval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('feed')}
                  className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-mono font-extrabold text-xs uppercase rounded-lg transition-colors shadow-sm"
                >
                  Browse Drops
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {likedVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handlePlayVideo(video)}
                    className="group flex flex-col justify-between bg-neutral-950 border border-neutral-850 hover:border-neutral-700 hover:bg-neutral-900/50 rounded-xl p-3 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-3">
                      <img
                        src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/90 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-neutral-800">
                        {formatDuration(video.durationSeconds || video.duration)}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:underline">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                        <span className="truncate max-w-[150px]">{video.creatorName || video.creatorUsername}</span>
                        <span>{formatViews(video.viewsCount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-850">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          likeVideo(video.id);
                          showToast('Removed from Liked Videos');
                        }}
                        className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">thumb_down</span>
                        <span>Unlike</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToFocusQueue(video);
                          showToast('Added to Queue');
                        }}
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                        title="Add to queue"
                      >
                        <span className="material-symbols-outlined text-[16px]">queue</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6. TAB: CLIPS                                                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'clips' && (
          <div className="space-y-5">
            {clips.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-2xl bg-neutral-950 border border-neutral-850 text-center space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <span className="material-symbols-outlined text-[32px]">content_cut</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-sans">No clips saved yet</h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
                    Open any video player and click "Clip" to extract a 15-60 second high-signal moment to save and share.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {clips.map((clip) => {
                  const originVideo = videos.find((v) => v.id === clip.videoId);
                  return (
                    <div
                      key={clip.id}
                      className="p-3 bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-xl transition-all shadow-sm space-y-2.5 flex flex-col justify-between group"
                    >
                      <div
                        onClick={() => {
                          if (originVideo) {
                            setSelectedVideo(originVideo);
                          }
                        }}
                        className="relative aspect-video rounded-lg overflow-hidden bg-black cursor-pointer"
                      >
                        <img
                          src={
                            clip.thumbnailUrl ||
                            originVideo?.thumbnailUrl ||
                            'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'
                          }
                          alt={clip.clipTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                          </div>
                        </div>
                        <span className="absolute bottom-2 right-2 bg-black/90 text-[10px] font-mono px-2 py-0.5 rounded text-white border border-neutral-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">content_cut</span>
                          <span>
                            {formatTimestamp(clip.startTime)} – {formatTimestamp(clip.endTime)}
                          </span>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-white line-clamp-1">{clip.clipTitle}</h3>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                          <span className="truncate max-w-[150px]">{clip.videoTitle}</span>
                          <span>{clip.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-850">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/?v=${clip.videoId}&clip=${clip.id}`;
                            navigator.clipboard?.writeText(url);
                            showToast('Direct clip link copied');
                          }}
                          className="text-[11px] font-mono font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">share</span>
                          <span>Share Clip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteClip(clip.id)}
                          className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 font-semibold"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
