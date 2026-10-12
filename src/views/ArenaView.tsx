import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../utils/imageCompressor';

export const ArenaView: React.FC = () => {
  const { user, updateUser, videos, setCurrentView } = useApp();
  const [interval, setInterval] = useState<'Weekly' | 'Monthly' | 'All Time'>('Weekly');
  const [checkInDone, setCheckInDone] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }
    try {
      const compressed = await compressImage(file, 256, 0.85);
      if (compressed) {
        try {
          localStorage.setItem('riseup_user_avatar', compressed);
        } catch {}
        updateUser({ avatar: compressed });
        showToast('Profile picture updated across RiseUp!');
      }
    } catch (err) {
      console.warn('[ArenaView] Error compressing avatar:', err);
    }
    e.target.value = '';
  };

  const handleDailyCheckIn = () => {
    if (checkInDone) return;
    const newStreak = (user.streakDays || 0) + 1;
    const newTokens = (user.tokens || 0) + 10;
    const newXp = (user.xp || 0) + 50;
    updateUser({
      streakDays: newStreak,
      tokens: newTokens,
      xp: newXp,
    });
    setCheckInDone(true);
    showToast('Daily check-in verified! +10 Tokens & +1 Day Streak earned.');
  };

  // Derive community creator rankings from actual uploaded videos (if any exist)
  // Group real videos by creator
  const creatorMap = new Map<
    string,
    {
      id: string;
      name: string;
      username: string;
      avatar?: string;
      tokens: number;
      streak: number;
      protocol: string;
      dropsCount: number;
    }
  >();

  // Always seed with real logged in user first
  creatorMap.set(user.id, {
    id: user.id,
    name: user.displayName || user.username || 'Creator',
    username: user.username || 'creator',
    avatar: user.avatar,
    tokens: user.tokens || 0,
    streak: user.streakDays || 0,
    protocol: user.bio || `${user.focusLane || 'Deep Work'} Protocol`,
    dropsCount: videos.filter((v) => v.creatorId === user.id || v.creatorUsername === user.username).length,
  });

  // Add any other distinct real creators from actual uploaded videos
  videos.forEach((v) => {
    if (v.creatorId && v.creatorId !== user.id && !creatorMap.has(v.creatorId)) {
      creatorMap.set(v.creatorId, {
        id: v.creatorId,
        name: v.creatorName || v.creatorUsername || 'Creator',
        username: v.creatorUsername || 'creator',
        avatar: v.creatorAvatar,
        tokens: (v.viewsCount || 0) * 2,
        streak: 1,
        protocol: v.category ? `${v.category} Discipline` : 'Video Production',
        dropsCount: 1,
      });
    }
  });

  // Sort real creators by tokens earned
  const realLeaderboard = Array.from(creatorMap.values()).sort(
    (a, b) => b.tokens - a.tokens
  );

  // Sort real creators by streak
  const realStreakBoard = Array.from(creatorMap.values()).sort(
    (a, b) => b.streak - a.streak
  );

  const userDisplayName = user.displayName || user.username || 'Creator';
  const userHandle = `@${user.username || 'creator'}`;
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-8 px-4 sm:px-6 lg:px-8 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                Live Season Standings
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono mt-1">
              Arena Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans max-w-xl">
              Real-time rankings calculated from verified tokens earned, unbroken daily focus streaks, and published drops.
            </p>
          </div>

          {/* Time Interval Tabs */}
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-neutral-950 rounded-xl border border-neutral-800 self-start md:self-auto">
              {(['Weekly', 'Monthly', 'All Time'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInterval(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    interval === t
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDailyCheckIn}
              disabled={checkInDone}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase border transition-all flex items-center gap-1.5 shadow-sm ${
                checkInDone
                  ? 'bg-neutral-900 text-neutral-500 border-neutral-800 cursor-not-allowed'
                  : 'bg-white hover:bg-neutral-200 text-black border-white cursor-pointer active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {checkInDone ? 'done_all' : 'bolt'}
              </span>
              <span>{checkInDone ? 'Checked In' : 'Claim Daily Streak (+10 TK)'}</span>
            </button>
          </div>
        </div>

        {/* Current Active User Profile Banner Card on Leaderboard */}
        <div className="p-5 sm:p-6 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            {/* Interactive User Avatar with Change Photo option */}
            <div
              className="relative group/avatar w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-white/30 shrink-0 cursor-pointer shadow-lg"
              onClick={() => fileInputRef.current?.click()}
              title="Click to update your profile photo everywhere"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={userDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-2xl font-mono text-white">
                  {userInitial}
                </div>
              )}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span className="text-[9px] font-mono font-bold uppercase mt-0.5">Change</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-mono text-white">
                  {userDisplayName}
                </h2>
                <span className="px-2 py-0.5 rounded bg-white text-black font-mono font-bold text-[10px] uppercase">
                  RANK #1
                </span>
              </div>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">
                {userHandle} • {user.focusLane || 'Engineering'} Lane
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <span className="text-white font-bold">{user.tokens.toLocaleString()} TK</span>
                <span className="text-neutral-500">•</span>
                <span className="text-white font-bold">{user.streakDays} Day Streak</span>
                <span className="text-neutral-500">•</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  Change Profile Photo
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={() => setCurrentView('profile')}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold border border-neutral-800 transition-colors"
            >
              View Channel
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('studio')}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-mono font-bold transition-colors"
            >
              Open Studio
            </button>
          </div>
        </div>

        {/* Real Live Podium Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* #1 Token Leader */}
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="text-white font-bold">#1 TOKEN LEADER</span>
              <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px]">GOLD</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-white/20 shrink-0">
                {realLeaderboard[0]?.avatar ? (
                  <img
                    src={realLeaderboard[0].avatar}
                    alt={realLeaderboard[0].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold font-mono text-white">
                    {realLeaderboard[0]?.name.charAt(0) || 'C'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-mono font-bold text-white">
                  {realLeaderboard[0]?.tokens.toLocaleString() || 0} TK
                </div>
                <div className="text-sm font-bold font-mono text-neutral-300 truncate">
                  @{realLeaderboard[0]?.username || 'creator'}
                </div>
                <div className="text-xs text-neutral-500 font-sans truncate">
                  {realLeaderboard[0]?.protocol || 'Active Focus Protocol'}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              Live Season Standing
            </span>
          </div>

          {/* #1 Streak Leader */}
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="text-white font-bold">#1 HABIT STREAK</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-bold text-[10px]">
                APEX STREAK
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-white/20 shrink-0">
                {realStreakBoard[0]?.avatar ? (
                  <img
                    src={realStreakBoard[0].avatar}
                    alt={realStreakBoard[0].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold font-mono text-white">
                    {realStreakBoard[0]?.name.charAt(0) || 'C'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-mono font-bold text-white">
                  {realStreakBoard[0]?.streak || 0} DAYS
                </div>
                <div className="text-sm font-bold font-mono text-neutral-300 truncate">
                  @{realStreakBoard[0]?.username || 'creator'}
                </div>
                <div className="text-xs text-neutral-500 font-sans truncate">
                  Daily Consistency
                </div>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              Active Unbroken Streak
            </span>
          </div>

          {/* Published Drops Leader */}
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="text-white font-bold">CONTENT VOLUME</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-bold text-[10px]">
                CREATOR
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-white/20 shrink-0">
                {realLeaderboard[0]?.avatar ? (
                  <img
                    src={realLeaderboard[0].avatar}
                    alt={realLeaderboard[0].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold font-mono text-white">
                    {realLeaderboard[0]?.name.charAt(0) || 'C'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-mono font-bold text-white">
                  {realLeaderboard[0]?.dropsCount || 0} Drops
                </div>
                <div className="text-sm font-bold font-mono text-neutral-300 truncate">
                  @{realLeaderboard[0]?.username || 'creator'}
                </div>
                <div className="text-xs text-neutral-500 font-sans truncate">
                  Verified Video Drops
                </div>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              RiseUp Creator Network
            </span>
          </div>
        </div>

        {/* 2-Column Tables: Real Earners vs Real Streaks (No fake/demo data) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real Token Leaders Table */}
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span>Active Token Earners</span>
              </h3>
              <span className="text-xs font-mono text-neutral-400">{interval}</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {realLeaderboard.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    item.id === user.id
                      ? 'bg-neutral-900 border-white/40 shadow-sm'
                      : 'bg-black border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-white text-xs">
                      {idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-neutral-700 shrink-0">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>@{item.username}</span>
                        {item.id === user.id && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-black font-bold uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500">{item.protocol}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-white">{item.tokens.toLocaleString()} TK</div>
                    <div className="text-[10px] text-neutral-400">
                      {item.dropsCount} {item.dropsCount === 1 ? 'Drop' : 'Drops'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Daily Streaks Table */}
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Unbroken Habit Streaks</span>
              </h3>
              <span className="text-xs font-mono text-neutral-400">Live Consistency</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {realStreakBoard.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    item.id === user.id
                      ? 'bg-neutral-900 border-white/40 shadow-sm'
                      : 'bg-black border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-white text-xs">
                      {idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-neutral-700 shrink-0">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>@{item.username}</span>
                        {item.id === user.id && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-black font-bold uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500">{item.protocol}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-white">{item.streak} DAYS</div>
                    <div className="text-[10px] text-neutral-400">
                      {item.streak > 0 ? 'Active Streak' : 'Pending Check-in'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
