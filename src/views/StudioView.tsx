import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem, CommentItem } from '../types';
import { videoStorageService } from '../services/videoStorage';
import { compressImage } from '../utils/imageCompressor';

type StudioSection =
  | 'dashboard'
  | 'content'
  | 'analytics'
  | 'comments'
  | 'earn'
  | 'customization'
  | 'audio';

export const StudioView: React.FC = () => {
  const {
    user,
    updateUser,
    videos,
    shorts,
    deleteVideo,
    setSelectedVideo,
    setCurrentView,
    openUploadModal,
    comments,
    addComment,
  } = useApp();

  const [activeSection, setActiveSection] = useState<StudioSection>('dashboard');
  const [contentTab, setContentTab] = useState<'videos' | 'shorts' | 'vault'>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Customization state
  const [customName, setCustomName] = useState(user.displayName || user.username || 'Creator');
  const [customUsername, setCustomUsername] = useState(user.username || 'creator');
  const [customBio, setCustomBio] = useState(user.bio || '');
  const [customAvatar, setCustomAvatar] = useState(user.avatar || '');
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState('');
  const customAvatarFileRef = useRef<HTMLInputElement | null>(null);

  // Edit Video Modal state
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Audio Library Preview State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Comments Reply state
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [commentsFilter, setCommentsFilter] = useState<'all' | 'questions' | 'tips'>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const allContent: VideoItem[] = [...videos, ...shorts];

  // Latest drop for dashboard spotlight
  const latestVideo = allContent[0];

  // Channel Metrics calculation
  const totalViews = allContent.reduce((sum, v) => sum + (v.viewsCount || 0), 0);
  const totalLikes = allContent.reduce((sum, v) => sum + (v.likesCount || 0), 0);
  const totalWatchHours = Math.round((totalViews * 4.5) / 60);

  // Filtered Content
  const filteredContent = allContent.filter((item) => {
    if (contentTab === 'videos' && item.isShort) return false;
    if (contentTab === 'shorts' && !item.isShort) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handlePlayVideo = (v: VideoItem) => {
    setSelectedVideo(v);
    setCurrentView('watch');
  };

  const handleOpenEdit = (v: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideo(v);
    setEditTitle(v.title);
    setEditDesc(v.description || '');
    setEditCategory(v.category || 'Fitness');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    editingVideo.title = editTitle;
    editingVideo.description = editDesc;
    editingVideo.category = editCategory as any;
    setEditingVideo(null);
    showToast('Video details updated successfully!');
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this video drop permanently?')) {
      deleteVideo(id);
      showToast('Video deleted from channel.');
    }
  };

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?v=${id}`;
    navigator.clipboard?.writeText(url);
    showToast('Video link copied to clipboard!');
  };

  // Curated royalty-free tracks for Audio Library
  const audioTracks = [
    {
      id: 'aud-01',
      title: 'Midnight Focus Cadence',
      artist: 'RiseUp Sound Lab',
      duration: '2:45',
      genre: 'Lofi Ambient',
      mood: 'Deep Work',
    },
    {
      id: 'aud-02',
      title: 'Vagus Nerve Gamma 40Hz',
      artist: 'Bioacoustics Collective',
      duration: '4:10',
      genre: 'Binaural Drone',
      mood: 'Flow State',
    },
    {
      id: 'aud-03',
      title: 'Heavy Compound Rhythm',
      artist: 'Operator Audio',
      duration: '3:15',
      genre: 'Industrial Minimal',
      mood: 'Training',
    },
    {
      id: 'aud-04',
      title: 'Dawn Syndicate Acoustic',
      artist: 'Marcus & Strings',
      duration: '2:12',
      genre: 'Neoclassical',
      mood: 'Morning Reflection',
    },
    {
      id: 'aud-05',
      title: 'Analog Tape Hiss & Rain',
      artist: 'Studio Atmospheric',
      duration: '5:00',
      genre: 'Soundscape',
      mood: 'Study',
    },
  ];

  // Real Studio Comments collection computed from actual user drops
  const userVideoIds = videos
    .filter((v) => v.creatorId === user.id || v.creatorUsername === user.username)
    .map((v) => v.id);

  const realStudioComments: Array<{
    id: string;
    videoId: string;
    videoTitle: string;
    author: string;
    avatar?: string;
    text: string;
    time: string;
    likes: number;
    isQuestion: boolean;
    hasTip: boolean;
    tipAmount: number;
  }> = [];

  videos.forEach((v) => {
    if (v.creatorId === user.id || v.creatorUsername === user.username) {
      const vComments = comments[v.id] || [];
      vComments.forEach((c) => {
        realStudioComments.push({
          id: c.id,
          videoId: v.id,
          videoTitle: v.title,
          author: c.userName || '@viewer',
          avatar: c.userAvatar,
          text: c.body,
          time: c.createdAt || 'Recent',
          likes: c.likes || 0,
          isQuestion: c.body?.includes('?') ?? false,
          hasTip: false,
          tipAmount: 0,
        });
      });
    }
  });

  const handleCustomAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImage(file, 256, 0.85);
      if (compressed) {
        setCustomAvatar(compressed);
        try {
          localStorage.setItem('riseup_user_avatar', compressed);
        } catch {}
        updateUser({ avatar: compressed });
        showToast('Channel profile picture updated everywhere!');
      }
    } catch (err) {
      console.warn('[StudioView] Error compressing avatar:', err);
    }
    e.target.value = '';
  };

  const handleApplyCustomAvatarUrl = () => {
    if (!customAvatarUrlInput.trim()) return;
    setCustomAvatar(customAvatarUrlInput.trim());
    updateUser({ avatar: customAvatarUrlInput.trim() });
    setCustomAvatarUrlInput('');
    showToast('Channel profile picture updated everywhere!');
  };

  const handleSaveCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      displayName: customName.trim(),
      username: customUsername.trim().replace(/^@/, ''),
      bio: customBio.trim(),
      avatar: customAvatar,
    });
    showToast('Channel branding and preferences published!');
  };

  const handleReplySubmit = (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = replyInputMap[commentId];
    if (!text?.trim()) return;
    showToast('Reply published to viewer!');
    setReplyInputMap((prev) => ({ ...prev, [commentId]: '' }));
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white select-none flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP STUDIO BAR (Inspired by YouTube Studio) */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-950 px-4 sm:px-6 flex items-center justify-between sticky top-14 z-30">
        <div className="flex items-center gap-4">
          {/* Studio Brand */}
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <h1 className="text-base sm:text-lg font-mono font-black uppercase tracking-tight text-white flex items-center gap-2">
              <span>RiseUp Studio</span>
              <span className="px-1.5 py-0.5 rounded bg-white text-black font-mono text-[9px] font-bold">
                CREATOR
              </span>
            </h1>
          </div>

          {/* Quick Exit back to Viewer App */}
          <button
            type="button"
            onClick={() => setCurrentView('feed')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono border border-neutral-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Back to RiseUp</span>
          </button>
        </div>

        {/* Right Action: Create Drop & Avatar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openUploadModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">add</span>
            <span>CREATE</span>
          </button>

          <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-xs font-bold font-mono text-white ring-1 ring-white/20 shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
        </div>
      </header>

      {/* MAIN STUDIO WORKSPACE (Side Navigation + Content Body) */}
      <div className="flex-1 flex overflow-hidden">
        {/* STUDIO SIDEBAR NAVIGATION */}
        <aside className="w-60 shrink-0 bg-neutral-950 border-r border-neutral-800 hidden md:flex flex-col justify-between p-3">
          <div className="space-y-1">
            {/* Channel Profile Preview in Studio */}
            <div className="p-3 mb-3 bg-black rounded-xl border border-neutral-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold font-mono text-white truncate">
                  {user.displayName || user.username || 'Creator'}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono truncate">
                  Your Channel
                </div>
              </div>
            </div>

            {/* Studio Navigation Links */}
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
              { id: 'content', label: 'Content', icon: 'video_library' },
              { id: 'analytics', label: 'Analytics', icon: 'insights' },
              { id: 'comments', label: 'Comments', icon: 'chat_bubble' },
              { id: 'earn', label: 'Earn & Tokens', icon: 'payments' },
              { id: 'customization', label: 'Customization', icon: 'tune' },
              { id: 'audio', label: 'Audio Library', icon: 'library_music' },
            ].map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id as StudioSection)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors text-left ${
                    active
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Studio Telemetry Footer */}
          <div className="p-3 bg-black rounded-xl border border-neutral-800 text-[10px] font-mono text-neutral-500 space-y-1">
            <div className="flex items-center justify-between text-neutral-300">
              <span>Channel Status</span>
              <span className="text-white font-bold">Good Standing</span>
            </div>
            <p className="text-[9px] text-neutral-500">Copyright strikes: 0 / 3</p>
          </div>
        </aside>

        {/* STUDIO CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* MOBILE STUDIO SECTION TABS */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-neutral-800">
            {(['dashboard', 'content', 'analytics', 'comments', 'earn', 'audio'] as const).map(
              (sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setActiveSection(sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase whitespace-nowrap border ${
                    activeSection === sec
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                  }`}
                >
                  {sec}
                </button>
              )
            )}
          </div>

          {/* 1. DASHBOARD VIEW */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
                  Channel Dashboard
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Real-time analytics, latest drop reception, and audience interactions.
                </p>
              </div>

              {/* 3-Column Studio Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 1: Latest Video Performance */}
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <h3 className="font-mono font-bold text-xs uppercase text-white">
                      Latest Drop Performance
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400">First 48h</span>
                  </div>

                  {latestVideo ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-800">
                        <img
                          src={latestVideo.thumbnailUrl}
                          alt={latestVideo.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/90 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                          Ranking: 1 of 10
                        </div>
                      </div>

                      <h4 className="text-xs font-mono font-bold text-white line-clamp-1">
                        {latestVideo.title}
                      </h4>

                      <div className="space-y-2 text-xs font-mono pt-1">
                        <div className="flex items-center justify-between text-neutral-400">
                          <span>Views:</span>
                          <span className="text-white font-bold">{latestVideo.viewsCount || 1420}</span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-400">
                          <span>Click-through rate (CTR):</span>
                          <span className="text-white font-bold">11.4% (Typical 6-9%)</span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-400">
                          <span>Average view duration:</span>
                          <span className="text-white font-bold">4m 12s (68%)</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSection('analytics')}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors border border-neutral-800"
                      >
                        Go To Video Analytics
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500 font-mono text-xs">
                      No videos uploaded yet. Click "+ CREATE" to publish your first drop.
                    </div>
                  )}
                </div>

                {/* Card 2: Channel Analytics Snapshot */}
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <h3 className="font-mono font-bold text-xs uppercase text-white">
                        Channel Analytics
                      </h3>
                      <span className="text-[10px] font-mono text-neutral-400">Last 28 Days</span>
                    </div>

                    <div className="py-3 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">
                        Current Subscribers
                      </span>
                      <div className="text-3xl font-mono font-black text-white">1,248</div>
                      <span className="text-[10px] text-neutral-400 font-mono block">
                        +84 in last 28 days
                      </span>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 space-y-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Views:</span>
                        <span className="text-white font-bold">{totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Watch Time:</span>
                        <span className="text-white font-bold">{totalWatchHours} Hours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Estimated Token Yield:</span>
                        <span className="text-white font-bold">{user.tokens} TK</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSection('analytics')}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors border border-neutral-800"
                  >
                    Go To Channel Analytics
                  </button>
                </div>

                {/* Card 3: Recent Comments */}
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <h3 className="font-mono font-bold text-xs uppercase text-white">
                        Recent Comments
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveSection('comments')}
                        className="text-[10px] font-mono text-neutral-400 hover:text-white"
                      >
                        View all
                      </button>
                    </div>

                    <div className="space-y-3 pt-2">
                      {realStudioComments.length === 0 ? (
                        <p className="text-xs text-neutral-500 font-mono py-2">
                          No recent comments on your drops.
                        </p>
                      ) : (
                        realStudioComments.slice(0, 2).map((c) => (
                          <div key={c.id} className="p-2.5 bg-black rounded-xl border border-neutral-800/80 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-white font-bold">{c.author}</span>
                              <span className="text-neutral-500 text-[10px]">{c.time}</span>
                            </div>
                            <p className="text-xs text-neutral-300 font-sans line-clamp-2">
                              "{c.text}"
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSection('comments')}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors border border-neutral-800"
                  >
                    Open Community Hub
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. CONTENT (VIDEO MANAGER TABLE) */}
          {activeSection === 'content' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
                    Channel Content
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Filter, edit metadata, inspect retention, or delete video drops.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openUploadModal()}
                    className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    + Upload New Drop
                  </button>
                </div>
              </div>

              {/* Sub-tabs & Filter Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContentTab('videos')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border ${
                      contentTab === 'videos'
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                    }`}
                  >
                    Long-Form Videos ({videos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentTab('shorts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border ${
                      contentTab === 'shorts'
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                    }`}
                  >
                    Reels & Shorts ({shorts.length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-2 text-neutral-500 text-[16px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drops..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none"
                  />
                </div>
              </div>

              {/* Professional YouTube Studio-Inspired Table */}
              <div className="bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
                {filteredContent.length === 0 ? (
                  <div className="p-12 text-center space-y-3 font-mono">
                    <span className="material-symbols-outlined text-[32px] text-neutral-500">
                      video_library
                    </span>
                    <h3 className="text-sm font-bold uppercase text-white">No Drops in this tab</h3>
                    <p className="text-xs text-neutral-500">
                      Click "+ Upload New Drop" to populate your channel content.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-800 text-[11px] font-mono uppercase text-neutral-400 bg-black">
                          <th className="py-3 px-4 font-bold">Video</th>
                          <th className="py-3 px-3 font-bold">Visibility</th>
                          <th className="py-3 px-3 font-bold">Yield / Tokens</th>
                          <th className="py-3 px-3 font-bold">Date</th>
                          <th className="py-3 px-3 font-bold">Views</th>
                          <th className="py-3 px-3 font-bold">Comments</th>
                          <th className="py-3 px-3 font-bold">Likes (Ratio)</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/80 text-xs font-mono">
                        {filteredContent.map((v) => (
                          <tr
                            key={v.id}
                            className="hover:bg-neutral-900/60 transition-colors group cursor-pointer"
                            onClick={() => handlePlayVideo(v)}
                          >
                            {/* Video Column */}
                            <td className="py-3.5 px-4 min-w-[280px]">
                              <div className="flex items-center gap-3">
                                <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-neutral-800">
                                  <img
                                    src={v.thumbnailUrl}
                                    alt={v.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 right-1 bg-black/90 px-1 py-0.5 rounded text-[8px] font-bold text-white">
                                    {v.durationFormatted || (v.isShort ? '0:45' : '15:20')}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-white truncate group-hover:text-neutral-200">
                                    {v.title}
                                  </h4>
                                  <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                                    {v.description || 'No description provided'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Visibility */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black text-neutral-300 border border-neutral-800 text-[10px]">
                                <span className="material-symbols-outlined text-[13px]">public</span>
                                <span>Public</span>
                              </span>
                            </td>

                            {/* Yield */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px] text-white font-bold">
                                <span className="material-symbols-outlined text-[14px]">monetization_on</span>
                                <span>Active Yield</span>
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-3 text-neutral-400 whitespace-nowrap text-[11px]">
                              {v.createdAt || 'Recent'}
                            </td>

                            {/* Views */}
                            <td className="py-3.5 px-3 text-white font-bold whitespace-nowrap">
                              {(v.viewsCount || 0).toLocaleString()}
                            </td>

                            {/* Comments */}
                            <td className="py-3.5 px-3 text-neutral-300 whitespace-nowrap">
                              {comments[v.id]?.length || 3}
                            </td>

                            {/* Likes */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <div className="space-y-1">
                                <span className="text-white font-bold">
                                  {v.likesCount || 0} (98.4%)
                                </span>
                                <div className="w-16 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-white w-[98%]" />
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEdit(v, e)}
                                  className="w-7 h-7 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center border border-neutral-800"
                                  title="Edit Drop Details"
                                >
                                  <span className="material-symbols-outlined text-[15px]">edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleCopyLink(v.id, e)}
                                  className="w-7 h-7 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center border border-neutral-800"
                                  title="Copy Link"
                                >
                                  <span className="material-symbols-outlined text-[15px]">link</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteItem(v.id, e)}
                                  className="w-7 h-7 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-800"
                                  title="Delete Drop"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. ANALYTICS VIEW */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
                  Channel Analytics
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Deep engagement diagnostics, audience retention, and token inflows.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">
                    Total Views
                  </span>
                  <div className="text-2xl font-mono font-bold text-white">{totalViews.toLocaleString()}</div>
                  <span className="text-[10px] text-neutral-400 font-mono">+18% vs usual</span>
                </div>

                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">
                    Watch Time (Hours)
                  </span>
                  <div className="text-2xl font-mono font-bold text-white">{totalWatchHours}</div>
                  <span className="text-[10px] text-neutral-400 font-mono">+22 hrs this week</span>
                </div>

                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">
                    Subscribers
                  </span>
                  <div className="text-2xl font-mono font-bold text-white">1,248</div>
                  <span className="text-[10px] text-neutral-400 font-mono">+84 this period</span>
                </div>

                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">
                    Token Revenue
                  </span>
                  <div className="text-2xl font-mono font-bold text-white">{user.tokens} TK</div>
                  <span className="text-[10px] text-neutral-400 font-mono">≈ ${(user.tokens * 0.1).toFixed(0)} USD</span>
                </div>
              </div>

              {/* Visual Performance Trend Chart */}
              <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <h3 className="font-mono font-bold text-xs uppercase text-white">
                    Views & Retention Flow (Last 28 Days)
                  </h3>
                  <span className="text-xs font-mono text-neutral-400">Peak: 1,420 views/day</span>
                </div>

                {/* Monochrome Bar Chart */}
                <div className="h-44 flex items-end gap-1.5 pt-4">
                  {[
                    24, 38, 45, 62, 55, 78, 92, 85, 110, 95, 120, 140, 130, 165,
                    150, 180, 210, 195, 230, 220, 260, 290, 280, 310, 340, 320, 380, 420,
                  ].map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-neutral-800 hover:bg-white rounded-t transition-colors cursor-pointer group relative"
                      style={{ height: `${(val / 420) * 100}%` }}
                    >
                      <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-0.5 rounded text-[9px] font-mono text-white border border-neutral-700 whitespace-nowrap z-10">
                        {val * 5} views
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-800">
                  <span>Day 1</span>
                  <span>Day 14</span>
                  <span>Day 28 (Today)</span>
                </div>
              </div>

              {/* Traffic Sources & Retention */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3 font-mono text-xs">
                  <h4 className="font-bold text-white uppercase text-xs">Traffic Sources</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                        <span>Cinema Feed</span>
                        <span>44.2%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[44.2%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                        <span>Shorts & Reels Theater</span>
                        <span>32.8%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[32.8%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                        <span>Digital Vault & Channels</span>
                        <span>14.5%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[14.5%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3 font-mono text-xs">
                  <h4 className="font-bold text-white uppercase text-xs">Audience Demographics</h4>
                  <div className="space-y-2 text-neutral-300">
                    <div className="flex justify-between pb-1 border-b border-neutral-800">
                      <span>India</span>
                      <span className="font-bold">42%</span>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-neutral-800">
                      <span>United States</span>
                      <span className="font-bold">28%</span>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-neutral-800">
                      <span>United Kingdom & EU</span>
                      <span className="font-bold">18%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Regions</span>
                      <span className="font-bold">12%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. COMMENTS & COMMUNITY VIEW */}
          {activeSection === 'comments' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
                  Channel Comments & Community
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Reply to viewers, highlight insightful comments, and interact with supporters.
                </p>
              </div>

              {/* Comments Filter */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCommentsFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border ${
                    commentsFilter === 'all'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                  }`}
                >
                  All Comments ({realStudioComments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCommentsFilter('questions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border ${
                    commentsFilter === 'questions'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                  }`}
                >
                  Contains Questions
                </button>
                <button
                  type="button"
                  onClick={() => setCommentsFilter('tips')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border ${
                    commentsFilter === 'tips'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                  }`}
                >
                  Token Tips
                </button>
              </div>

              {/* Comments Feed */}
              <div className="space-y-4">
                {realStudioComments.length === 0 ? (
                  <div className="p-12 text-center bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                    <span className="material-symbols-outlined text-[36px] text-neutral-600">
                      chat_bubble_outline
                    </span>
                    <h3 className="font-mono font-bold text-sm uppercase text-white">
                      No Comments Yet
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto font-sans">
                      When viewers comment on your drops and reels, their questions, feedback, and token tips will show up here.
                    </p>
                  </div>
                ) : (
                  realStudioComments
                    .filter((c) => {
                      if (commentsFilter === 'questions') return c.isQuestion;
                      if (commentsFilter === 'tips') return c.hasTip;
                      return true;
                    })
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-700 shrink-0 bg-neutral-800 flex items-center justify-center">
                              {c.avatar ? (
                                <img src={c.avatar} alt={c.author} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold font-mono text-white">
                                  {c.author.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-mono text-xs text-white">{c.author}</span>
                                <span className="text-[10px] text-neutral-500 font-mono">• {c.time}</span>
                                {c.hasTip && (
                                  <span className="px-2 py-0.5 rounded bg-white text-black font-mono font-bold text-[9px]">
                                    +{c.tipAmount} TK TIP
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                On drop: "{c.videoTitle}"
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                            <button
                              type="button"
                              onClick={() => showToast('Hearted comment!')}
                              className="w-7 h-7 rounded-lg hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
                              title="Heart comment"
                            >
                              <span className="material-symbols-outlined text-[16px]">favorite</span>
                            </button>
                            <span>{c.likes}</span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                          {c.text}
                        </p>

                        {/* Reply Form */}
                        <form
                          onSubmit={(e) => handleReplySubmit(c.id, e)}
                          className="flex items-center gap-2 pt-2 border-t border-neutral-800"
                        >
                          <input
                            type="text"
                            value={replyInputMap[c.id] || ''}
                            onChange={(e) =>
                              setReplyInputMap((prev) => ({ ...prev, [c.id]: e.target.value }))
                            }
                            placeholder={`Reply to ${c.author}...`}
                            className="flex-1 bg-black border border-neutral-800 focus:border-white px-3 py-1.5 rounded-xl text-xs text-white placeholder-neutral-500 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!replyInputMap[c.id]?.trim()}
                            className="px-3.5 py-1.5 bg-white disabled:bg-neutral-800 text-black disabled:text-neutral-500 text-xs font-mono font-bold uppercase rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                          >
                            Reply
                          </button>
                        </form>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* 5. EARN & TOKEN VAULT VIEW */}
          {activeSection === 'earn' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
                  Monetization & Vault Yield
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Peer-to-peer viewer tipping, Digital Vault asset sales, and token compounding.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">
                    Liquid Token Balance
                  </span>
                  <div className="text-3xl font-mono font-bold text-white">{user.tokens} TK</div>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Instant settlement available for wallet withdrawal.
                  </p>
                </div>

                <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">
                    Vault Payout Share
                  </span>
                  <div className="text-3xl font-mono font-bold text-white">95% Flat</div>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Keep 95% on all preset, Notion, and blueprint sales.
                  </p>
                </div>

                <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">
                    Yield Multiplier
                  </span>
                  <div className="text-3xl font-mono font-bold text-white">1.75x APY</div>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Boosted tier when locking tokens in creator vault.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                <h3 className="font-mono font-bold text-xs uppercase text-white">
                  Monetization Channels Active
                </h3>
                <div className="divide-y divide-neutral-800 text-xs font-mono">
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Viewer Super Tips</div>
                      <div className="text-[10px] text-neutral-400">Tokens tipped directly during playback</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-black text-white border border-neutral-700">
                      ENABLED
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Digital Vault Assets</div>
                      <div className="text-[10px] text-neutral-400">Digital downloads & presets sold via tokens</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-black text-white border border-neutral-700">
                      ENABLED
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Focus Room Hosting Payouts</div>
                      <div className="text-[10px] text-neutral-400">Yield generated from verified streak participants</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-black text-white border border-neutral-700">
                      ENABLED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. CUSTOMIZATION VIEW */}
          {activeSection === 'customization' && (
            <div className="space-y-6 max-w-3xl">
              <input
                ref={customAvatarFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomAvatarFile}
              />

              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
                  Channel Customization
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Configure channel branding, profile picture, bio, and handle.
                </p>
              </div>

              <form onSubmit={handleSaveCustomization} className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-neutral-800">
                  <div
                    className="relative group/custom-avatar w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-xl font-bold font-mono text-white ring-2 ring-white/20 shrink-0 cursor-pointer shadow-lg"
                    onClick={() => customAvatarFileRef.current?.click()}
                    title="Click to select new profile photo from device"
                  >
                    {customAvatar ? (
                      <img src={customAvatar} alt={customName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{customName.charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/custom-avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                      <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                      <span className="text-[8px] font-mono font-bold uppercase">Upload</span>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div>
                      <h4 className="text-sm font-bold font-mono text-white">Channel Profile Picture</h4>
                      <p className="text-xs text-neutral-400 font-sans mt-0.5">
                        Visible on all your videos, shorts, comments, leaderboard, and creator decks.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => customAvatarFileRef.current?.click()}
                        className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        Upload Photo File
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        value={customAvatarUrlInput}
                        onChange={(e) => setCustomAvatarUrlInput(e.target.value)}
                        placeholder="Or paste image URL (https://...)"
                        className="flex-1 bg-black border border-neutral-800 focus:border-white px-3 py-1.5 rounded-xl text-xs text-white placeholder-neutral-500 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomAvatarUrl}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono border border-neutral-800 cursor-pointer"
                      >
                        Apply URL
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                    Channel Display Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-xs text-white outline-none"
                    placeholder="Enter display name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                    Channel Handle
                  </label>
                  <input
                    type="text"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-xs text-white outline-none font-mono"
                    placeholder="creator_handle"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                    Channel Bio
                  </label>
                  <textarea
                    rows={3}
                    value={customBio}
                    onChange={(e) => setCustomBio(e.target.value)}
                    placeholder="Tell your viewers and subscribers about your channel focus and routine..."
                    className="w-full bg-black border border-neutral-800 focus:border-white p-3 rounded-xl text-xs text-white outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
                >
                  Publish Changes
                </button>
              </form>
            </div>
          )}

          {/* 7. AUDIO LIBRARY VIEW */}
          {activeSection === 'audio' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-mono uppercase text-white">
                  Creator Audio Library
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Royalty-free music, ambient lofi drones, and sound effects cleared for reels and drops.
                </p>
              </div>

              <div className="bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
                <div className="divide-y divide-neutral-800/80">
                  {audioTracks.map((track) => {
                    const isPlaying = playingAudioId === track.id;
                    return (
                      <div
                        key={track.id}
                        className="p-4 hover:bg-neutral-900/60 transition-colors flex items-center justify-between gap-4 font-mono text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              const next = isPlaying ? null : track.id;
                              setPlayingAudioId(next);
                              if (next) showToast(`Playing preview: ${track.title}`);
                            }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                              isPlaying
                                ? 'bg-white text-black'
                                : 'bg-black text-white hover:bg-neutral-800 border border-neutral-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {isPlaying ? 'pause' : 'play_arrow'}
                            </span>
                          </button>

                          <div className="min-w-0">
                            <h4 className="font-bold text-white truncate">{track.title}</h4>
                            <p className="text-[10px] text-neutral-500 truncate">
                              {track.artist} • {track.genre} • {track.mood}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-neutral-400">{track.duration}</span>
                          <button
                            type="button"
                            onClick={() => showToast(`Added "${track.title}" to video project!`)}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-lg text-xs font-bold uppercase border border-neutral-800"
                          >
                            Use in Reel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Video Details Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase">Edit Video Metadata</h3>
              <button
                type="button"
                onClick={() => setEditingVideo(null)}
                className="w-8 h-8 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-800"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-black border border-neutral-800 focus:border-white p-3 rounded-xl text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-xs text-white outline-none"
                >
                  <option value="Fitness">Fitness</option>
                  <option value="Discipline">Discipline</option>
                  <option value="Study">Study</option>
                  <option value="Mindset">Mindset</option>
                  <option value="Focus">Focus</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 bg-neutral-900 text-neutral-300 hover:text-white rounded-xl text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-neutral-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
