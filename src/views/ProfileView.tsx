import React, { useState, useRef } from 'react';
import { useApp, isShortVideo } from '../context/AppContext';
import { VideoItem } from '../types';
import { compressImage } from '../utils/imageCompressor';

export const ProfileView: React.FC = () => {
  const {
    user,
    updateUser,
    videos,
    shorts,
    openUploadModal,
    setSelectedVideo,
    openShort,
    watchLaterIds,
    setCurrentView,
  } = useApp();

  const [channelTab, setChannelTab] = useState<'home' | 'videos' | 'shorts' | 'watchlater' | 'about'>('home');
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProfileAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImage(file, 256, 0.85);
      if (compressed) {
        try {
          localStorage.setItem('riseup_user_avatar', compressed);
        } catch {}
        updateUser({ avatar: compressed });
      }
    } catch (err) {
      console.warn('[ProfileView] Error compressing avatar:', err);
    }
    e.target.value = '';
  };

  const userVideos = videos.filter(
    (v) => !isShortVideo(v) && (v.creatorId === user.id || v.creatorUsername === user.username || v.creatorName === user.displayName)
  );

  const userShorts = shorts.filter(
    (s) => s.creatorId === user.id || s.creatorUsername === user.username || s.creatorName === user.displayName
  );

  const watchLaterList = videos.filter((v) => watchLaterIds.includes(v.id));

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
      {/* Channel Banner */}
      <div className="w-full h-36 sm:h-48 md:h-56 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Hidden file input for channel avatar upload */}
      <input
        ref={profileFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProfileAvatarFile}
      />

      {/* Channel Header Information */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Channel Avatar with interactive change photo overlay */}
            <div
              onClick={() => profileFileInputRef.current?.click()}
              className="relative group/profile-avatar w-24 h-24 sm:w-32 sm:h-32 rounded-full ring-4 ring-white bg-[#e5e5e5] overflow-hidden shrink-0 shadow-lg cursor-pointer"
              title="Click to update channel profile picture"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#606060] bg-neutral-200">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/profile-avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                <span className="text-[10px] font-mono font-bold uppercase mt-1">Change</span>
              </div>
            </div>

            {/* Channel Metadata */}
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0f0f0f] tracking-tight m-0">
                  {user.displayName || user.username || 'Your Channel'}
                </h1>
                <span className="material-symbols-outlined text-[20px] text-[#606060]">
                  verified
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#606060]">
                <span className="font-medium text-[#0f0f0f]">@{user.username || 'creator'}</span>
                <span>•</span>
                <span>{userVideos.length + userShorts.length} drops</span>
                <span>•</span>
                <span>{user.streakDays || 0}-day streak</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => profileFileInputRef.current?.click()}
                  className="underline hover:text-black font-semibold cursor-pointer"
                >
                  Change Profile Photo
                </button>
              </div>

              {user.bio && (
                <p className="text-xs text-[#606060] max-w-xl leading-relaxed mt-1">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => profileFileInputRef.current?.click()}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-full text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>Change Photo</span>
            </button>
            <button
              type="button"
              onClick={() => openUploadModal()}
              className="px-5 py-2.5 bg-[#ff0000] hover:bg-[#cc0000] text-white rounded-full text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create Drop</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('settings')}
              className="px-4 py-2.5 bg-[#f2f2f2] hover:bg-[#e5e5e5] text-[#0f0f0f] rounded-full text-xs font-bold transition-colors"
            >
              Customize Channel
            </button>
          </div>
        </div>

        {/* Channel Navigation Tabs */}
        <div className="border-b border-[#e5e5e5] flex items-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar text-sm font-medium">
          {[
            { id: 'home', label: 'Home' },
            { id: 'videos', label: `Videos (${userVideos.length})` },
            { id: 'shorts', label: `Shorts (${userShorts.length})` },
            { id: 'watchlater', label: `Watch Later (${watchLaterList.length})` },
            { id: 'about', label: 'About' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setChannelTab(tab.id as any)}
              className={`py-3.5 transition-colors relative whitespace-nowrap ${
                channelTab === tab.id
                  ? 'text-[#0f0f0f] font-bold'
                  : 'text-[#606060] hover:text-[#0f0f0f]'
              }`}
            >
              <span>{tab.label}</span>
              {channelTab === tab.id && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0f0f0f]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {/* 1. HOME TAB */}
          {channelTab === 'home' && (
            <div className="space-y-10">
              {userVideos.length === 0 && userShorts.length === 0 ? (
                <div className="text-center py-12 max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#f2f2f2] flex items-center justify-center mx-auto text-[#606060]">
                    <span className="material-symbols-outlined text-[32px]">video_library</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#0f0f0f]">Upload a video to get started</h3>
                    <p className="text-xs text-[#606060] mt-1">
                      Start sharing your technical walk-throughs, routines, and discipline protocols with your audience.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openUploadModal()}
                    className="px-6 py-2.5 bg-[#ff0000] hover:bg-[#cc0000] text-white text-xs font-bold rounded-full transition-colors shadow-sm"
                  >
                    Upload Video
                  </button>
                </div>
              ) : (
                <>
                  {/* Latest Uploads */}
                  {userVideos.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-base font-bold text-[#0f0f0f]">Uploads</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {userVideos.map((vid) => (
                          <div
                            key={vid.id}
                            onClick={() => setSelectedVideo(vid)}
                            className="flex flex-col group cursor-pointer"
                          >
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#e5e5e5]">
                              <img
                                src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                                alt={vid.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono">
                                {formatDuration(vid.durationSeconds || vid.duration)}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-[#0f0f0f] line-clamp-2 mt-2 leading-snug group-hover:text-[#ff0000] transition-colors">
                              {vid.title}
                            </h4>
                            <p className="text-xs text-[#606060] mt-0.5">
                              {formatViews(vid.viewsCount)} • {vid.createdAt || 'Recent'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Channel Shorts */}
                  {userShorts.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-[#e5e5e5]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#ff0000] rounded-md flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 8.5v7l6-3.5-6-3.5z" />
                          </svg>
                        </div>
                        <h2 className="text-base font-bold text-[#0f0f0f]">Shorts</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {userShorts.map((short) => (
                          <div
                            key={short.id}
                            onClick={() => openShort(short.id)}
                            className="flex flex-col group cursor-pointer"
                          >
                            <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-xs">
                              <img
                                src={short.thumbnailUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80'}
                                alt={short.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <h4 className="text-xs font-bold text-[#0f0f0f] line-clamp-2 mt-1.5 uppercase group-hover:text-[#ff0000] transition-colors">
                              {short.title}
                            </h4>
                            <p className="text-[11px] text-[#606060] mt-0.5">
                              {formatViews(short.viewsCount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 2. VIDEOS TAB */}
          {channelTab === 'videos' && (
            <div>
              {userVideos.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#606060]">
                  No long-form videos published yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userVideos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className="flex flex-col group cursor-pointer"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#e5e5e5]">
                        <img
                          src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono">
                          {formatDuration(vid.durationSeconds || vid.duration)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0f0f0f] line-clamp-2 mt-2 leading-snug group-hover:text-[#ff0000] transition-colors">
                        {vid.title}
                      </h4>
                      <p className="text-xs text-[#606060] mt-0.5">
                        {formatViews(vid.viewsCount)} • {vid.createdAt || 'Recent'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SHORTS TAB */}
          {channelTab === 'shorts' && (
            <div>
              {userShorts.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#606060]">
                  No shorts published yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {userShorts.map((short) => (
                    <div
                      key={short.id}
                      onClick={() => openShort(short.id)}
                      className="flex flex-col group cursor-pointer"
                    >
                      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-xs">
                        <img
                          src={short.thumbnailUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80'}
                          alt={short.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-[#0f0f0f] line-clamp-2 mt-1.5 uppercase group-hover:text-[#ff0000] transition-colors">
                        {short.title}
                      </h4>
                      <p className="text-[11px] text-[#606060] mt-0.5">
                        {formatViews(short.viewsCount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. WATCH LATER TAB */}
          {channelTab === 'watchlater' && (
            <div>
              {watchLaterList.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#606060]">
                  No saved videos in your Watch Later backlog. Click the clock icon on any video to add it.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {watchLaterList.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className="flex flex-col group cursor-pointer"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#e5e5e5]">
                        <img
                          src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono">
                          {formatDuration(vid.durationSeconds || vid.duration)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0f0f0f] line-clamp-2 mt-2 leading-snug group-hover:text-[#ff0000] transition-colors">
                        {vid.title}
                      </h4>
                      <p className="text-xs text-[#606060] mt-0.5">
                        {vid.creatorName} • {formatViews(vid.viewsCount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. ABOUT TAB */}
          {channelTab === 'about' && (
            <div className="max-w-2xl space-y-6 text-sm text-[#0f0f0f]">
              <div className="space-y-2">
                <h3 className="font-bold text-base">Description</h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  {user.bio || 'Systems Engineer & Builder on RiseUp. Documenting high-impact protocols, deep work architectures, and unbreakable discipline habits.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#e5e5e5] space-y-3 text-xs">
                <h3 className="font-bold text-sm">Channel Details</h3>
                <div className="space-y-2 text-[#606060]">
                  <p>Joined {user.joinedAt || 'Recently'}</p>
                  <p>{userVideos.length + userShorts.length} total videos uploaded</p>
                  <p>{user.streakDays || 0}-day consecutive discipline streak</p>
                  <p>{user.tokens.toLocaleString()} RUP community tokens earned</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
