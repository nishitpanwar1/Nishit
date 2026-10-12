import React, { useState, useRef } from 'react';
import { useApp, isShortVideo } from '../context/AppContext';
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
    (v) =>
      !isShortVideo(v) &&
      (v.creatorId === user.id ||
        v.creatorUsername === user.username ||
        v.creatorName === user.displayName ||
        v.creatorUsername === 'you' ||
        v.creatorUsername === 'creator')
  );

  const userShorts = shorts.filter(
    (s) =>
      s.creatorId === user.id ||
      s.creatorUsername === user.username ||
      s.creatorName === user.displayName ||
      s.creatorUsername === 'you' ||
      s.creatorUsername === 'creator'
  );

  const watchLaterList = videos.filter((v) => watchLaterIds.includes(v.id));

  const formatViews = (count?: number) => {
    if (!count) return '0 plays';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M plays`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K plays`;
    return `${count} plays`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:05';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pb-24 select-none font-sans">
      {/* Channel Banner */}
      <div className="w-full h-36 sm:h-48 md:h-56 bg-neutral-950 border-b border-neutral-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-4 right-6 hidden sm:flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
          <span>RISEUP CREATOR HUB</span>
          <span>•</span>
          <span>VERIFIED SIGNAL</span>
        </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Channel Avatar with interactive change photo overlay */}
            <div
              onClick={() => profileFileInputRef.current?.click()}
              className="relative group/profile-avatar w-24 h-24 sm:w-32 sm:h-32 rounded-2xl ring-2 ring-neutral-700 bg-neutral-900 overflow-hidden shrink-0 shadow-2xl cursor-pointer"
              title="Click to update channel profile picture"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-mono font-bold text-neutral-300 bg-neutral-900">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/profile-avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                <span className="text-[10px] font-mono font-bold uppercase mt-1">Change</span>
              </div>
            </div>

            {/* Channel Metadata */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight m-0 font-sans">
                  {user.displayName || user.username || 'Your Channel'}
                </h1>
                <span className="material-symbols-outlined text-[20px] text-white">
                  verified
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono text-neutral-400">
                <span className="text-white font-bold">@{user.username || 'creator'}</span>
                <span>•</span>
                <span>{userVideos.length + userShorts.length} drops</span>
                <span>•</span>
                <span>{user.streakDays || 0}-day streak</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => profileFileInputRef.current?.click()}
                  className="text-neutral-300 hover:text-white underline cursor-pointer"
                >
                  Change Photo
                </button>
              </div>

              {user.bio && (
                <p className="text-xs text-neutral-400 max-w-xl leading-relaxed mt-1 font-mono">
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
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-mono font-semibold transition-colors border border-neutral-800 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <span>Photo</span>
            </button>
            <button
              type="button"
              onClick={() => openUploadModal()}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs font-mono font-extrabold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Create Drop</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('settings')}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-mono font-semibold transition-colors border border-neutral-800"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Channel Navigation Tabs */}
        <div className="border-b border-neutral-800 flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar text-xs font-mono">
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
              className={`py-3 transition-colors relative whitespace-nowrap uppercase tracking-wider ${
                channelTab === tab.id
                  ? 'text-white font-extrabold border-b-2 border-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {/* 1. HOME TAB */}
          {channelTab === 'home' && (
            <div className="space-y-8">
              {userVideos.length === 0 && userShorts.length === 0 ? (
                <div className="text-center py-16 max-w-md mx-auto space-y-4 p-8 rounded-2xl bg-neutral-950 border border-neutral-850">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                    <span className="material-symbols-outlined text-[32px]">video_library</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white font-sans">Upload a drop to get started</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-mono leading-relaxed">
                      Start publishing your technical walk-throughs, routines, and discipline protocols with the RiseUp network.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openUploadModal()}
                    className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-extrabold rounded-lg transition-colors shadow-sm"
                  >
                    Upload Video
                  </button>
                </div>
              ) : (
                <>
                  {/* Latest Uploads */}
                  {userVideos.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-300">
                          Video Drops
                        </h2>
                        <button
                          type="button"
                          onClick={() => setCurrentView('your-videos')}
                          className="text-xs font-mono text-neutral-400 hover:text-white underline"
                        >
                          Manage All
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {userVideos.map((vid) => (
                          <div
                            key={vid.id}
                            onClick={() => setSelectedVideo(vid)}
                            className="flex flex-col group cursor-pointer bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-xl p-2.5 transition-all"
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                              <img
                                src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                                alt={vid.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <span className="absolute bottom-1.5 right-1.5 bg-black/90 text-white text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-neutral-800">
                                {formatDuration(vid.durationSeconds || vid.duration)}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-2 mt-2 leading-snug group-hover:underline">
                              {vid.title}
                            </h4>
                            <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                              {formatViews(vid.viewsCount)} • {vid.createdAt || 'Recent'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Channel Shorts */}
                  {userShorts.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-neutral-800">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-white">bolt</span>
                        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-300">
                          Reels
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {userShorts.map((short) => (
                          <div
                            key={short.id}
                            onClick={() => openShort(short.id)}
                            className="flex flex-col group cursor-pointer bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-xl p-2 transition-all"
                          >
                            <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black shadow-xs">
                              <img
                                src={short.thumbnailUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80'}
                                alt={short.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-2 mt-1.5 group-hover:underline">
                              {short.title}
                            </h4>
                            <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
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
                <div className="text-center py-16 text-xs font-mono text-neutral-400 bg-neutral-950 rounded-2xl border border-neutral-850 p-8">
                  No long-form drops published yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userVideos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className="flex flex-col group cursor-pointer bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-xl p-2.5 transition-all"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                        <img
                          src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/90 text-white text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-neutral-800">
                          {formatDuration(vid.durationSeconds || vid.duration)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 mt-2 leading-snug group-hover:underline">
                        {vid.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-1 font-mono">
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
                <div className="text-center py-16 text-xs font-mono text-neutral-400 bg-neutral-950 rounded-2xl border border-neutral-850 p-8">
                  No shorts published yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {userShorts.map((short) => (
                    <div
                      key={short.id}
                      onClick={() => openShort(short.id)}
                      className="flex flex-col group cursor-pointer bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-xl p-2 transition-all"
                    >
                      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black">
                        <img
                          src={short.thumbnailUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80'}
                          alt={short.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 mt-1.5 group-hover:underline">
                        {short.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
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
                <div className="text-center py-16 text-xs font-mono text-neutral-400 bg-neutral-950 rounded-2xl border border-neutral-850 p-8">
                  No saved videos in your Watch Later backlog.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {watchLaterList.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className="flex flex-col group cursor-pointer bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-xl p-2.5 transition-all"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                        <img
                          src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/90 text-white text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-neutral-800">
                          {formatDuration(vid.durationSeconds || vid.duration)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 mt-2 leading-snug group-hover:underline">
                        {vid.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-1 font-mono">
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
            <div className="max-w-2xl space-y-6 text-sm text-white bg-neutral-950 border border-neutral-850 rounded-2xl p-6">
              <div className="space-y-2">
                <h3 className="font-bold text-base font-sans">Description</h3>
                <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                  {user.bio || 'Systems Engineer & Creator on RiseUp. Documenting high-impact protocols, deep work architectures, and unbreakable discipline habits.'}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-800 space-y-3 text-xs font-mono">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Channel Details</h3>
                <div className="space-y-2 text-neutral-400">
                  <p>Joined: {user.joinedAt || 'Recently'}</p>
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
