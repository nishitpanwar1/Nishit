import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TipModal } from '../components/TipModal';
import { VideoItem, CommentItem } from '../types';
import { videoStorageService } from '../services/videoStorage';

type AspectRatioMode = 'auto' | '9:16' | '4:5' | '1:1' | '3:4' | 'fit';

export const ShortsView: React.FC = () => {
  const {
    shorts,
    likeVideo,
    saveVideo,
    likedVideoIds,
    savedVideoIds,
    recordView,
    activeShortId,
    setActiveShortId,
    openUploadModal,
    user,
    comments,
    addComment,
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentShort: VideoItem | undefined = shorts[currentIndex] || shorts[0];

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [resolvedShortUrl, setResolvedShortUrl] = useState<string>(
    currentShort?.videoUrl || ''
  );
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [detectedRatio, setDetectedRatio] = useState<number | null>(null);
  const [ratioMode, setRatioMode] = useState<AspectRatioMode>('auto');
  const [objectFitMode, setObjectFitMode] = useState<'contain' | 'cover'>('contain');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isLiked = currentShort ? likedVideoIds.includes(currentShort.id) : false;
  const isSaved = currentShort ? savedVideoIds.includes(currentShort.id) : false;
  const currentComments: CommentItem[] = currentShort ? comments[currentShort.id] || [] : [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Resolve safe playback URL
  useEffect(() => {
    let active = true;
    async function resolve() {
      if (!currentShort) return;
      const url = await videoStorageService.resolvePlaybackUrl(currentShort.id, currentShort.videoUrl, true);
      if (active && url) {
        setResolvedShortUrl(url);
      }
    }
    resolve();
    return () => {
      active = false;
    };
  }, [currentShort?.id, currentShort?.videoUrl]);

  useEffect(() => {
    if (activeShortId) {
      const idx = shorts.findIndex((s) => s.id === activeShortId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [activeShortId, shorts]);

  // Handle video playback and autoplay
  useEffect(() => {
    if (currentShort && videoRef.current) {
      setDetectedRatio(null);
      recordView(currentShort.id);
      setProgress(0);
      setIsPlaying(true);
      videoRef.current.currentTime = 0;
      videoRef.current.load();
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        });
      }
    }
  }, [currentIndex, currentShort?.id, resolvedShortUrl]);

  // Wheel listener for vertical scroll navigation
  useEffect(() => {
    let lastWheel = 0;
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheel < 600) return;
      if (e.deltaY > 40) {
        lastWheel = now;
        handleNext();
      } else if (e.deltaY < -40) {
        lastWheel = now;
        handlePrev();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [shorts.length, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, shorts.length]);

  const handleNext = () => {
    if (shorts.length <= 1) return;
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (shorts.length <= 1) return;
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(shorts.length - 1);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          });
      }
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 500);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(prog);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleShare = () => {
    if (!currentShort) return;
    const url = `${window.location.origin}/?v=${currentShort.id}`;
    navigator.clipboard?.writeText(url);
    showToast('Link copied to clipboard!');
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentShort) return;
    addComment(currentShort.id, commentInput.trim());
    setCommentInput('');
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight } = e.currentTarget;
    if (videoWidth && videoHeight) {
      const ratio = videoWidth / videoHeight;
      setDetectedRatio(ratio);
    }
  };

  // Determine computed aspect ratio based on selected ratio mode
  const getComputedRatio = (): number => {
    switch (ratioMode) {
      case '9:16':
        return 9 / 16;
      case '4:5':
        return 4 / 5;
      case '1:1':
        return 1 / 1;
      case '3:4':
        return 3 / 4;
      case 'fit':
        return detectedRatio || 9 / 16;
      case 'auto':
      default:
        return detectedRatio || (9 / 16);
    }
  };

  const effectiveRatio = getComputedRatio();

  // Cycle aspect ratios helper
  const cycleRatioMode = () => {
    const modes: AspectRatioMode[] = ['auto', '9:16', '4:5', '1:1', '3:4'];
    const nextIdx = (modes.indexOf(ratioMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setRatioMode(nextMode);
    showToast(`Aspect Ratio: ${nextMode.toUpperCase()}`);
  };

  const toggleFitMode = () => {
    const next = objectFitMode === 'contain' ? 'cover' : 'contain';
    setObjectFitMode(next);
    showToast(`Scaling: ${next === 'contain' ? 'FIT (Letterbox)' : 'FILL (Cover)'}`);
  };

  if (!currentShort) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-6 bg-black text-white select-none">
        <div className="w-14 h-14 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-4 border border-neutral-800 shadow-lg">
          <span className="material-symbols-outlined text-[28px]">bolt</span>
        </div>
        <h2 className="text-xl font-extrabold text-white uppercase font-mono tracking-wide">
          Reel Deck Empty
        </h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm font-mono leading-relaxed">
          Clean state. Upload any vertical video (9:16, 4:5, 1:1, 3:4) to launch the reel feed.
        </p>
        <button
          type="button"
          onClick={() => openUploadModal()}
          className="mt-5 px-6 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Upload First Video</span>
        </button>
      </div>
    );
  }

  const audioTitle = currentShort.audioTitle || `Original Audio - @${currentShort.creatorUsername || 'creator'}`;

  // Calculate container max width based on ratio
  const getContainerMaxWidth = () => {
    if (effectiveRatio >= 1) return '540px';
    if (effectiveRatio >= 0.75) return '480px';
    if (effectiveRatio >= 0.65) return '440px';
    return '420px';
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white flex items-center justify-center py-4 px-2 select-none relative overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Centered Reel Theater */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 max-w-full">
        {/* Adaptive Video Player Container supporting ALL Vertical Ratios */}
        <div className="relative group">
          <div
            style={{
              aspectRatio: `${effectiveRatio}`,
              maxHeight: 'calc(100vh - 5.5rem)',
              height: '750px',
              maxWidth: getContainerMaxWidth(),
              minWidth: '280px',
            }}
            className="relative w-auto rounded-2xl overflow-hidden shadow-2xl bg-black cursor-pointer border border-neutral-800 flex items-center justify-center transition-all duration-200"
            onClick={togglePlay}
          >
            {/* Background Video Player */}
            <video
              ref={videoRef}
              src={resolvedShortUrl || currentShort.videoUrl}
              poster={currentShort.thumbnailUrl}
              className={`w-full h-full bg-black transition-all ${
                objectFitMode === 'cover' ? 'object-cover' : 'object-contain'
              }`}
              loop
              playsInline
              autoPlay
              muted={isMuted}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Central Pause / Play indicator */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-20">
                <div className="w-16 h-16 rounded-xl bg-black/80 border border-neutral-700 text-white flex items-center justify-center shadow-2xl">
                  <span className="material-symbols-outlined text-[36px] ml-1">play_arrow</span>
                </div>
              </div>
            )}

            {showFeedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="w-16 h-16 rounded-xl bg-black/80 border border-neutral-700 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[36px]">
                    {isPlaying ? 'play_arrow' : 'pause'}
                  </span>
                </div>
              </div>
            )}

            {/* Tap to unmute prompt */}
            {isMuted && isPlaying && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    setIsMuted(false);
                  }
                }}
                className="absolute top-16 left-4 z-30 px-3 py-1.5 bg-black/90 hover:bg-black text-white text-xs font-mono font-semibold rounded-lg flex items-center gap-2 border border-neutral-700 transition-colors cursor-pointer pointer-events-auto shadow-xl"
              >
                <span className="material-symbols-outlined text-[16px] text-white">volume_off</span>
                <span>Unmute Audio</span>
              </div>
            )}

            {/* Top Badges: Aspect Ratio Controls, Duration & Mute */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="bg-black/90 px-3 py-1 rounded-lg text-white font-mono text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1.5 border border-neutral-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-white font-bold">REEL</span>
                </div>

                {/* Aspect Ratio Mode Cycle Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleRatioMode();
                  }}
                  className="bg-black/90 hover:bg-neutral-900 px-2.5 py-1 rounded-lg text-neutral-300 hover:text-white font-mono text-[10px] shadow-md border border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Click to cycle vertical aspect ratios (Auto, 9:16, 4:5, 1:1, 3:4)"
                >
                  <span className="material-symbols-outlined text-[13px]">aspect_ratio</span>
                  <span className="font-bold uppercase">{ratioMode}</span>
                </button>

                {/* Fit vs Cover Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFitMode();
                  }}
                  className="bg-black/90 hover:bg-neutral-900 px-2.5 py-1 rounded-lg text-neutral-300 hover:text-white font-mono text-[10px] shadow-md border border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Toggle Fit (contain) vs Fill (cover)"
                >
                  <span className="material-symbols-outlined text-[13px]">crop</span>
                  <span className="uppercase">{objectFitMode}</span>
                </button>
              </div>

              {/* Mute Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="w-8 h-8 rounded-lg bg-black/80 text-white hover:bg-black flex items-center justify-center pointer-events-auto transition-colors border border-neutral-700"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
            </div>

            {/* Bottom Inside Overlay: Creator Deck, Description, Sound */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent z-20 pointer-events-none">
              {/* Creator Squircle & Name */}
              <div className="flex items-center gap-2.5 pointer-events-auto">
                <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-700 overflow-hidden shrink-0 shadow-md">
                  {currentShort.creatorAvatar ? (
                    <img
                      src={currentShort.creatorAvatar}
                      alt={currentShort.creatorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold font-mono">
                      {currentShort.creatorName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm tracking-tight">
                      @{currentShort.creatorName || currentShort.creatorUsername || 'creator'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[9px] font-bold">
                      CREATOR
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Description */}
              {currentShort.description && (
                <p className="text-neutral-200 text-xs leading-relaxed mt-2 line-clamp-2 font-sans pointer-events-auto">
                  {currentShort.description}
                </p>
              )}

              {/* Sound Audio Bar & Category */}
              <div className="flex items-center gap-2 mt-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAudioDrawerOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-black/80 hover:bg-black px-2.5 py-1 rounded-lg text-neutral-300 hover:text-white text-[11px] font-mono truncate max-w-[210px] transition-colors border border-neutral-800"
                  title="View audio details"
                >
                  <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                  <span className="truncate">{audioTitle}</span>
                </button>

                <div className="bg-neutral-900 text-neutral-300 font-mono font-semibold text-[10px] px-2 py-1 rounded border border-neutral-800">
                  #{currentShort.category ? currentShort.category.toUpperCase() : 'REEL'}
                </div>
              </div>
            </div>

            {/* Crisp White Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800 z-30">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Floating Right Kinetic Action Rail (Pure Monochrome Black & White) */}
        <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center gap-3.5 py-3 shrink-0 shadow-2xl">
          {/* Like Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => likeVideo(currentShort.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
                isLiked
                  ? 'bg-white text-black border-white'
                  : 'bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
              }`}
              title="Like"
            >
              <span className="material-symbols-outlined text-[20px]">
                thumb_up
              </span>
            </button>
            <span className="text-[10px] font-mono font-bold text-neutral-400 mt-1 text-center">
              {formatNumber(currentShort.likesCount)}
            </span>
          </div>

          {/* Comments Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
                isCommentsOpen
                  ? 'bg-white text-black border-white'
                  : 'bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
              }`}
              title="Comments"
            >
              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            </button>
            <span className="text-[10px] font-mono font-bold text-neutral-400 mt-1 text-center">
              {formatNumber(currentComments.length)}
            </span>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-black hover:bg-neutral-900 active:scale-95 text-neutral-400 hover:text-white border border-neutral-800 flex items-center justify-center transition-all"
              title="Share"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <span className="text-[9px] font-mono font-bold text-neutral-500 mt-1 uppercase">
              SHARE
            </span>
          </div>

          {/* Tip Creator Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsTipOpen(true)}
              className="w-10 h-10 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 flex items-center justify-center transition-all shadow-md"
              title="Tip Creator"
            >
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </button>
            <span className="text-[9px] font-mono font-bold text-neutral-400 mt-1 uppercase">
              TIP
            </span>
          </div>

          {/* Save Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => saveVideo(currentShort.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
                isSaved
                  ? 'bg-white text-black border-white'
                  : 'bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
              }`}
              title="Save to Queue"
            >
              <span className="material-symbols-outlined text-[20px]">
                bookmark
              </span>
            </button>
            <span className="text-[9px] font-mono font-bold text-neutral-500 mt-1 uppercase">
              SAVE
            </span>
          </div>

          {/* Separator */}
          <div className="w-5 h-px bg-neutral-800 my-0.5" />

          {/* Up Navigation Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 rounded-lg bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800"
            title="Previous (Up)"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
          </button>

          {/* Down Navigation Arrow */}
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-lg bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800"
            title="Next (Down)"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
          </button>
        </div>
      </div>

      {/* Slide-over Comments Drawer */}
      {isCommentsOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col p-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">chat</span>
              <h3 className="font-mono font-bold text-sm uppercase">
                Comments ({currentComments.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCommentsOpen(false)}
              className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 no-scrollbar">
            {currentComments.length === 0 ? (
              <div className="text-center py-10 text-neutral-500 font-mono text-xs">
                No comments yet. Start the conversation!
              </div>
            ) : (
              currentComments.map((c) => (
                <div key={c.id} className="p-3 bg-black rounded-xl border border-neutral-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-200">@{c.userName}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">{c.createdAt}</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-sans">{c.body}</p>
                </div>
              ))
            )}
          </div>

          {/* Add comment input */}
          <form onSubmit={handlePostComment} className="pt-3 border-t border-neutral-800 flex items-center gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-black border border-neutral-800 focus:border-white px-3 py-2 rounded-lg text-xs text-white placeholder-neutral-500 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="px-4 py-2 bg-white disabled:bg-neutral-800 text-black disabled:text-neutral-500 font-mono font-bold text-xs uppercase rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Post
            </button>
          </form>
        </div>
      )}

      {/* Audio Drawer */}
      {isAudioDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col p-5 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
              <h3 className="font-mono font-bold text-sm uppercase">Sound Details</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAudioDrawerOpen(false)}
              className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-neutral-800"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="py-6 space-y-4">
            <div className="p-4 bg-black rounded-xl border border-neutral-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center text-white border border-neutral-800">
                <span className="material-symbols-outlined text-[24px]">music_note</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{audioTitle}</h4>
                <p className="text-xs text-neutral-400 font-mono">Original Audio • 1.4K Reels Created</p>
              </div>
            </div>

            <div className="p-4 bg-black rounded-xl border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider">Audio Licensing</span>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                Cleared for community reels and remixing inside the platform. Royalty-free playback enabled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tip Creator Modal */}
      {isTipOpen && currentShort && (
        <TipModal
          isOpen={isTipOpen}
          onClose={() => setIsTipOpen(false)}
          videoId={currentShort.id}
          creatorName={currentShort.creatorName || currentShort.creatorUsername || 'Creator'}
          creatorId={currentShort.creatorId || 'usr_creator'}
        />
      )}
    </div>
  );
};
