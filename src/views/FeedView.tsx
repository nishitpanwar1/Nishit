import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';

export const FeedView: React.FC = () => {
  const {
    videos,
    shorts,
    setSelectedVideo,
    setActiveShortId,
    setCurrentView,
    openUploadModal,
    addToFocusQueue,
    toggleWatchLater,
    isWatchLater,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All Tracks');
  const [activeMenuVideoId, setActiveMenuVideoId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const shortsContainerRef = useRef<HTMLDivElement | null>(null);

  const categories = [
    'All Tracks',
    'Engineering',
    'Systems',
    'Discipline',
    'Deep Work',
    'Mindset',
    'Architecture',
    'WebCodecs',
    'Live Sessions',
  ];

  const standardVideos = videos.filter((v) => !v.isShort);

  const filteredVideos = standardVideos.filter((v) => {
    if (selectedCategory === 'All Tracks') return true;
    return (
      v.category === selectedCategory ||
      v.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase())
    );
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const scrollShorts = (direction: 'left' | 'right') => {
    if (shortsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      shortsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenShort = (shortItem: VideoItem) => {
    setSelectedVideo(null);
    setActiveShortId(shortItem.id);
    setCurrentView('shorts');
  };

  const formatViews = (count?: number) => {
    if (!count) return '0 plays';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M plays`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K plays`;
    return `${count} ${count === 1 ? 'play' : 'plays'}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:05';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleShare = (video: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/?v=${video.id}`;
    navigator.clipboard?.writeText(link);
    showToast('Direct stream link copied!');
    setActiveMenuVideoId(null);
  };

  const handleAddToQueue = (video: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    addToFocusQueue(video);
    showToast('Queued to Focus Sprint');
    setActiveMenuVideoId(null);
  };

  const handleToggleWatchLater = (video: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchLater(video);
    showToast(isWatchLater(video.id) ? 'Removed from Saved Queue' : 'Added to Saved Queue');
    setActiveMenuVideoId(null);
  };

  const isFeedCompletelyEmpty = standardVideos.length === 0 && shorts.length === 0;

  return (
    <div className="w-full min-h-screen bg-black text-white pb-24 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white border border-neutral-700 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Filter Chips Bar */}
      <div className="sticky top-14 bg-black/95 backdrop-blur-xl z-30 px-4 sm:px-6 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[1720px] mx-auto">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wide shrink-0 transition-all ${
                  active
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-900 hover:text-white border border-neutral-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-[1720px] mx-auto space-y-12">
        {/* Empty State: Authentic Creator Hub Start */}
        {isFeedCompletelyEmpty && (
          <div className="py-16 px-6 max-w-2xl mx-auto bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-6 shadow-xl">
            <div className="w-14 h-14 rounded-xl bg-white text-black flex items-center justify-center mx-auto shadow-md">
              <span className="material-symbols-outlined text-[28px] font-bold">video_library</span>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase font-mono">
                Cinema Deck Primed
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Clean state. Ready for video file uploads, browser webcam capture, or direct stream link imports.
              </p>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
              <div
                onClick={() => openUploadModal()}
                className="p-4 bg-neutral-900/60 border border-neutral-800 hover:border-neutral-600 rounded-xl cursor-pointer transition-all hover:bg-neutral-900 flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center mb-3 border border-white/10">
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white uppercase font-mono">
                    Upload Master Drop
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Upload 1080p/4K MP4 or WebM video.
                  </p>
                </div>
              </div>

              <div
                onClick={() => openUploadModal()}
                className="p-4 bg-neutral-900/60 border border-neutral-800 hover:border-neutral-600 rounded-xl cursor-pointer transition-all hover:bg-neutral-900 flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center mb-3 border border-white/10">
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white uppercase font-mono">
                    Studio Cam & Mic
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Record walkthroughs directly in browser.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setCurrentView('rooms')}
                className="p-4 bg-neutral-900/60 border border-neutral-800 hover:border-neutral-600 rounded-xl cursor-pointer transition-all hover:bg-neutral-900 flex flex-col justify-between"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center mb-3 border border-white/10">
                  <span className="material-symbols-outlined text-[18px]">sensors</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white uppercase font-mono">
                    Focus Room
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Join live sprint rooms with synced timer.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => openUploadModal()}
                className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs tracking-wider rounded-lg transition-colors inline-flex items-center gap-2 font-mono"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>PUBLISH FIRST DROP</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Video Grid (16:9 Long-Form Videos) */}
        {filteredVideos.length > 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex flex-col group cursor-pointer relative bg-neutral-950 p-2 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-all duration-150"
                  onClick={() => setSelectedVideo(video)}
                >
                  {/* 16:9 Thumbnail Canvas */}
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-neutral-800">
                    <img
                      src={
                        video.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      loading="lazy"
                    />

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border border-neutral-700">
                      {formatDuration(video.durationSeconds || video.duration)}
                    </div>

                    {/* Hover Quick Action Buttons */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={(e) => handleToggleWatchLater(video, e)}
                        className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                          isWatchLater(video.id)
                            ? 'bg-white text-black'
                            : 'bg-black/80 text-white hover:bg-black border border-neutral-700'
                        }`}
                        title={isWatchLater(video.id) ? 'Remove from Queue' : 'Save to Queue'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isWatchLater(video.id) ? 'check' : 'bookmark'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleAddToQueue(video, e)}
                        className="w-7 h-7 rounded bg-black/80 text-white hover:bg-black border border-neutral-700 flex items-center justify-center transition-all"
                        title="Add to Focus Queue"
                      >
                        <span className="material-symbols-outlined text-[16px]">queue_music</span>
                      </button>
                    </div>
                  </div>

                  {/* Video Info Row */}
                  <div className="flex items-start gap-2.5 mt-2.5 px-0.5">
                    {/* Creator Avatar with Ring */}
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-neutral-700">
                      {video.creatorAvatar ? (
                        <img
                          src={video.creatorAvatar}
                          alt={video.creatorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-mono font-bold text-white">
                          {video.creatorName ? video.creatorName.charAt(0).toUpperCase() : 'U'}
                        </span>
                      )}
                    </div>

                    {/* Title & Metadata */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-neutral-300 transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400">
                        <span className="truncate hover:text-white transition-colors">
                          {video.creatorName || video.creatorUsername || 'Creator'}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          {formatViews(video.viewsCount)}
                        </span>
                      </div>
                    </div>

                    {/* 3-Dots Quick Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuVideoId(activeMenuVideoId === video.id ? null : video.id);
                        }}
                        className="w-6 h-6 rounded hover:bg-neutral-800 opacity-0 group-hover:opacity-100 flex items-center justify-center text-neutral-400 hover:text-white transition-opacity shrink-0"
                      >
                        <span className="material-symbols-outlined text-[16px]">more_vert</span>
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuVideoId === video.id && (
                        <div
                          className="absolute right-0 top-7 w-44 bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl py-1 z-30 text-xs text-white animate-in fade-in duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleToggleWatchLater(video, e)}
                            className="w-full px-3 py-1.5 hover:bg-neutral-900 flex items-center gap-2 text-left text-neutral-300 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[15px]">bookmark</span>
                            <span>{isWatchLater(video.id) ? 'Remove from Queue' : 'Save to Queue'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleShare(video, e)}
                            className="w-full px-3 py-1.5 hover:bg-neutral-900 flex items-center gap-2 text-left text-neutral-300 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[15px]">share</span>
                            <span>Share Stream</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Short Reels Shelf (Black and White 9:16 Carousel) */}
        {shorts.length > 0 && (
          <div className="border-t border-neutral-800 pt-8">
            {/* Shelf Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-black font-bold">bolt</span>
                </div>
                <div>
                  <h2 className="text-base font-black text-white tracking-wider uppercase font-mono">Short Reels</h2>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollShorts('left')}
                  className="w-7 h-7 rounded border border-neutral-800 hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  title="Scroll Left"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollShorts('right')}
                  className="w-7 h-7 rounded border border-neutral-800 hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  title="Scroll Right"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Shorts Horizontal Cards Grid */}
            <div
              ref={shortsContainerRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 overflow-x-auto no-scrollbar pb-2"
            >
              {shorts.map((shortItem) => (
                <div
                  key={shortItem.id}
                  className="flex flex-col cursor-pointer group bg-neutral-950 p-2 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-all duration-150"
                  onClick={() => handleOpenShort(shortItem)}
                >
                  {/* 9:16 Vertical Card */}
                  <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden bg-black border border-neutral-800">
                    <img
                      src={
                        shortItem.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={shortItem.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      loading="lazy"
                    />

                    {/* Dark gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Play icon overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-lg bg-white text-black flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-[20px] font-bold">play_arrow</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Views below */}
                  <div className="mt-2 px-0.5">
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-neutral-300 transition-colors">
                      {shortItem.title}
                    </h3>
                    <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                      {formatViews(shortItem.viewsCount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
