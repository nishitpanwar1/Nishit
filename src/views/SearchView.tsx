import React, { useState } from 'react';
import { useApp, isShortVideo } from '../context/AppContext';
import { VideoItem } from '../types';

export const SearchView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    videos,
    shorts,
    setSelectedVideo,
    openShort,
    addToFocusQueue,
    toggleWatchLater,
    isWatchLater,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'shorts'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'views' | 'date'>('relevance');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const query = searchQuery.toLowerCase().trim();

  const standardVideos = videos.filter((v) => !isShortVideo(v));

  let filteredVideos = standardVideos.filter((v) =>
    !query ||
    v.title.toLowerCase().includes(query) ||
    v.description?.toLowerCase().includes(query) ||
    v.category?.toLowerCase().includes(query) ||
    v.tags?.some((t) => t.toLowerCase().includes(query)) ||
    v.creatorName?.toLowerCase().includes(query) ||
    v.creatorUsername?.toLowerCase().includes(query)
  );

  let filteredShorts = shorts.filter((s) =>
    !query ||
    s.title.toLowerCase().includes(query) ||
    s.description?.toLowerCase().includes(query) ||
    s.category?.toLowerCase().includes(query) ||
    s.tags?.some((t) => t.toLowerCase().includes(query)) ||
    s.creatorName?.toLowerCase().includes(query) ||
    s.creatorUsername?.toLowerCase().includes(query)
  );

  if (sortBy === 'views') {
    filteredVideos = [...filteredVideos].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    filteredShorts = [...filteredShorts].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  } else if (sortBy === 'date') {
    filteredVideos = [...filteredVideos].reverse();
    filteredShorts = [...filteredShorts].reverse();
  }

  const totalResults = filteredVideos.length + filteredShorts.length;

  const formatViews = (count?: number) => {
    if (!count) return '0 views';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:05';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full min-h-screen bg-white text-[#0f0f0f] pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f0f0f] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px] text-[#ff0000]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Query Bar & Filters Ribbon */}
      <section className="w-full bg-white px-4 sm:px-6 py-4 border-b border-[#e5e5e5]">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-2xl relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#606060] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, shorts, topics, channels..."
                className="w-full h-11 pl-11 pr-10 bg-[#f9f9f9] border border-[#cccccc] focus:border-[#ff0000] text-[#0f0f0f] text-sm rounded-full focus:bg-white focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 w-6 h-6 rounded-full hover:bg-[#e5e5e5] text-[#606060] flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-[#606060]">
              <span className="font-medium hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#f2f2f2] hover:bg-[#e5e5e5] text-[#0f0f0f] font-medium py-1.5 px-3 rounded-lg border border-[#e5e5e5] focus:outline-none cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="views">View Count</option>
                <option value="date">Upload Date</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 pt-1">
            {[
              { id: 'all', label: `All (${totalResults})` },
              { id: 'videos', label: `Videos (${filteredVideos.length})` },
              { id: 'shorts', label: `Shorts (${filteredShorts.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#0f0f0f] text-white'
                    : 'bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Results Container */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        {totalResults === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#f2f2f2] text-[#606060] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">search_off</span>
            </div>
            <h3 className="text-base font-bold text-[#0f0f0f]">
              No results found {searchQuery ? `for "${searchQuery}"` : ''}
            </h3>
            <p className="text-xs text-[#606060] max-w-sm mx-auto">
              Try searching with different keywords, check for spelling, or upload a video with relevant tags.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Horizontal Video Cards (YouTube Desktop Format) */}
            {(activeTab === 'all' || activeTab === 'videos') && filteredVideos.length > 0 && (
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className="flex flex-col sm:flex-row gap-4 p-2 rounded-2xl hover:bg-[#f9f9f9] transition-all cursor-pointer group"
                  >
                    {/* Thumbnail on left */}
                    <div className="relative w-full sm:w-72 lg:w-80 aspect-video rounded-xl overflow-hidden bg-[#e5e5e5] shrink-0">
                      <img
                        src={
                          video.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded font-mono">
                        {formatDuration(video.durationSeconds || video.duration)}
                      </span>

                      {/* Quick Hover Actions */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchLater(video);
                            showToast(isWatchLater(video.id) ? 'Removed from Watch Later' : 'Saved to Watch Later');
                          }}
                          className={`w-7 h-7 rounded-md backdrop-blur-md flex items-center justify-center transition-colors shadow-xs ${
                            isWatchLater(video.id) ? 'bg-[#ff0000] text-white' : 'bg-black/60 text-white hover:bg-black/80'
                          }`}
                          title="Watch Later"
                        >
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToFocusQueue(video);
                            showToast('Added to Focus Queue');
                          }}
                          className="w-7 h-7 rounded-md bg-black/60 text-white hover:bg-black/80 backdrop-blur-md flex items-center justify-center transition-colors shadow-xs"
                          title="Add to Focus Queue"
                        >
                          <span className="material-symbols-outlined text-[16px]">queue_music</span>
                        </button>
                      </div>
                    </div>

                    {/* Video Metadata on right */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="text-base font-bold text-[#0f0f0f] line-clamp-2 leading-snug group-hover:text-[#ff0000] transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-xs text-[#606060] mt-1">
                          {formatViews(video.viewsCount)} • {video.createdAt || 'Recent'}
                        </p>

                        {/* Channel Row */}
                        <div className="flex items-center gap-2 my-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#e5e5e5] overflow-hidden shrink-0">
                            {video.creatorAvatar ? (
                              <img src={video.creatorAvatar} alt={video.creatorName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#0f0f0f]">
                                {video.creatorName?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-[#606060] hover:text-[#0f0f0f] font-medium truncate">
                            {video.creatorName || video.creatorUsername || 'Creator'}
                          </span>
                          <span className="material-symbols-outlined text-[14px] text-[#606060]">
                            verified
                          </span>
                        </div>

                        {/* Description snippet */}
                        {video.description && (
                          <p className="text-xs text-[#606060] line-clamp-2 leading-relaxed max-w-2xl">
                            {video.description}
                          </p>
                        )}
                      </div>

                      {/* Tags / Category Badges */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 bg-[#f2f2f2] text-[#0f0f0f] text-[10px] font-semibold rounded uppercase">
                          {video.category || 'Focus'}
                        </span>
                        {video.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[11px] text-[#606060]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shorts Shelf in Search */}
            {(activeTab === 'all' || activeTab === 'shorts') && filteredShorts.length > 0 && (
              <div className="border-t border-[#e5e5e5] pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-[#ff0000] rounded-md flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 8.5v7l6-3.5-6-3.5z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-[#0f0f0f]">Shorts</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredShorts.map((short) => (
                    <div
                      key={short.id}
                      onClick={() => openShort(short.id)}
                      className="cursor-pointer group flex flex-col"
                    >
                      <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black shadow-xs">
                        <img
                          src={
                            short.thumbnailUrl ||
                            'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={short.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <div className="mt-2 px-0.5">
                        <h4 className="text-xs font-bold text-[#0f0f0f] line-clamp-2 leading-tight uppercase group-hover:text-[#ff0000] transition-colors">
                          {short.title}
                        </h4>
                        <p className="text-[11px] text-[#606060] mt-0.5">
                          {formatViews(short.viewsCount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
