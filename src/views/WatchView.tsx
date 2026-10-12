import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem, CommentItem } from '../types';
import { videoStorageService } from '../services/videoStorage';
import { getVideoTranscript } from '../utils/videoEnhancements';
import { ClipModal } from '../components/ClipModal';
import { ReportModal } from '../components/ReportModal';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Share2,
  Download,
  Scissors,
  Check,
  Subtitles,
  Tv,
  PictureInPicture2,
  Upload,
  ChevronRight,
  ChevronLeft,
  X,
  Copy,
  Code,
  Clock,
  Sliders,
  MessageSquare,
  Bookmark,
  ShieldAlert,
  Radio,
  Activity,
  RotateCcw,
  RotateCw,
  ThumbsUp,
} from 'lucide-react';

interface WatchViewProps {
  video: VideoItem;
  onClose: () => void;
  onSelectVideo?: (v: VideoItem) => void;
}

export const WatchView: React.FC<WatchViewProps> = ({ video, onClose, onSelectVideo }) => {
  const {
    videos,
    likeVideo,
    saveVideo,
    likedVideoIds,
    savedVideoIds,
    recordView,
    user,
    comments,
    addComment,
    setMiniPlayerVideo,
    setMiniPlayerTime,
    setIsMiniPlayerPlaying,
    openUploadModal,
  } = useApp();

  const [currentVideo, setCurrentVideo] = useState<VideoItem>(video);
  const [resolvedUrl, setResolvedUrl] = useState<string>(video.videoUrl || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.durationSeconds || 120);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(1);
  const [isLikedState, setIsLikedState] = useState<boolean>(likedVideoIds.includes(video.id));
  const [likesCount, setLikesCount] = useState<number>(video.likesCount || 1);
  const [isSavedState, setIsSavedState] = useState<boolean>(savedVideoIds.includes(video.id));
  const [commentInput, setCommentInput] = useState<string>('');
  const [isCommentFocused, setIsCommentFocused] = useState<boolean>(false);
  const [commentSort, setCommentSort] = useState<'top' | 'newest'>('top');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab state for the Studio Brief below player
  const [activeBriefTab, setActiveBriefTab] = useState<'synopsis' | 'chapters' | 'transcript' | 'telemetry'>('synopsis');

  // Real-time Video Quality State
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (1080p 60)');
  const [activeQualityLabel, setActiveQualityLabel] = useState<string>('1080p');
  const [qualityBadgeToast, setQualityBadgeToast] = useState<string | null>(null);

  // Settings Menu State ('main' | 'quality' | 'speed')
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsSubmenu, setSettingsSubmenu] = useState<'main' | 'quality' | 'speed'>('main');

  // Player controls state
  const [showCenterIcon, setShowCenterIcon] = useState<'play' | 'pause' | null>(null);
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState<boolean>(true);
  const [selectedFilterChip, setSelectedFilterChip] = useState<string>('All');
  const [isStatsForNerdsOpen, setIsStatsForNerdsOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isClipModalOpen, setIsClipModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [shareStartAtCurrent, setShareStartAtCurrent] = useState<boolean>(false);
  const [shareEmbedTab, setShareEmbedTab] = useState<boolean>(false);
  const [hoverScrubTime, setHoverScrubTime] = useState<number | null>(null);
  const [hoverScrubPercent, setHoverScrubPercent] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  // Sync state if prop video changes
  useEffect(() => {
    setCurrentVideo(video);
    setCurrentTime(0);
    setIsPlaying(true);
    setIsLikedState(likedVideoIds.includes(video.id));
    setIsSavedState(savedVideoIds.includes(video.id));
    setLikesCount(video.likesCount || 1);
  }, [video.id]);

  // Resolve playback URL
  useEffect(() => {
    let active = true;
    async function resolve() {
      if (!currentVideo) return;
      const url = await videoStorageService.resolvePlaybackUrl(currentVideo.id, currentVideo.videoUrl, false);
      if (active && url) {
        setResolvedUrl(url);
      } else if (active) {
        setResolvedUrl(currentVideo.videoUrl || '');
      }
    }
    resolve();
    return () => {
      active = false;
    };
  }, [currentVideo?.id, currentVideo?.videoUrl]);

  // Register view count in AppContext
  useEffect(() => {
    if (currentVideo?.id) {
      recordView(currentVideo.id);
    }
  }, [currentVideo?.id]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Video playback listeners
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      setShowCenterIcon('play');
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowCenterIcon('pause');
    }
    setTimeout(() => setShowCenterIcon(null), 600);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !videoRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * duration;
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverScrubPercent(pos * 100);
    setHoverScrubTime(pos * duration);
  };

  const handleScrubberMouseLeave = () => {
    setHoverScrubTime(null);
    setHoverScrubPercent(null);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setIsSettingsOpen(false);
    showToast(`Speed: ${rate}x`);
  };

  // Real-Time Video Quality Change Handler
  const handleQualityChange = (qualityOption: string) => {
    setSelectedQuality(qualityOption);

    let cleanLabel = '1080p';
    if (qualityOption.includes('4K')) cleanLabel = '4K';
    else if (qualityOption.includes('1080p')) cleanLabel = '1080p';
    else if (qualityOption.includes('720p')) cleanLabel = '720p';
    else if (qualityOption.includes('480p')) cleanLabel = '480p';
    else if (qualityOption.includes('360p')) cleanLabel = '360p';
    else if (qualityOption.includes('Auto')) cleanLabel = '1080p';

    setActiveQualityLabel(cleanLabel);
    setQualityBadgeToast(cleanLabel);
    setIsSettingsOpen(false);

    setTimeout(() => {
      setQualityBadgeToast(null);
    }, 2500);

    showToast(`Stream calibrated: ${cleanLabel} ${cleanLabel === '1080p' || cleanLabel === '4K' ? 'Ultra HD' : 'Optimized'}`);
  };

  // Real-time CSS Filter mapping for immediate visual rendering
  const qualityFilterStyle = useMemo(() => {
    switch (activeQualityLabel) {
      case '4K':
        return {
          filter: 'contrast(1.08) saturate(1.08) drop-shadow(0 0 1px rgba(255,255,255,0.08))',
          imageRendering: 'crisp-edges' as const,
        };
      case '1080p':
        return {
          filter: 'contrast(1.04) saturate(1.04)',
          imageRendering: 'auto' as const,
        };
      case '720p':
        return {
          filter: 'contrast(1.01) saturate(1.01)',
          imageRendering: 'auto' as const,
        };
      case '480p':
        return {
          filter: 'contrast(0.97) brightness(0.99) blur(0.35px)',
          imageRendering: 'auto' as const,
        };
      case '360p':
        return {
          filter: 'contrast(0.93) brightness(0.97) blur(0.85px)',
          imageRendering: 'pixelated' as const,
        };
      default:
        return {
          filter: 'contrast(1.03) saturate(1.03)',
        };
    }
  }, [activeQualityLabel]);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      playerContainerRef.current.requestFullscreen?.();
    }
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  // Cinema keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsTheaterMode((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCaptionsOn((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, duration]);

  // Video ended -> autoplay next in queue
  const otherVideos = videos.filter((v) => v.id !== currentVideo.id && !v.isShort);

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (autoplayNext && otherVideos.length > 0) {
      handleSelectVideo(otherVideos[0]);
    }
  };

  const handleSelectVideo = (target: VideoItem) => {
    setCurrentVideo(target);
    setCurrentTime(0);
    setIsPlaying(true);
    if (onSelectVideo) {
      onSelectVideo(target);
    }
  };

  // Subscribe / Back Guild
  const handleToggleSubscribe = () => {
    if (!isSubscribed) {
      setIsSubscribed(true);
      setSubscriberCount((prev) => prev + 1);
      showToast(`Joined @${currentVideo.creatorName || 'Creator'}'s Guild`);
    } else {
      setIsSubscribed(false);
      setSubscriberCount((prev) => Math.max(0, prev - 1));
      showToast('Left Guild');
    }
  };

  // Like video
  const handleLike = () => {
    if (!isLikedState) {
      setIsLikedState(true);
      setLikesCount((prev) => prev + 1);
      likeVideo(currentVideo.id);
      showToast('Liked video');
    } else {
      setIsLikedState(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
      likeVideo(currentVideo.id);
      showToast('Like removed');
    }
  };

  // Save to Vault
  const handleSaveToVault = () => {
    setIsSavedState(!isSavedState);
    saveVideo(currentVideo.id);
    showToast(isSavedState ? 'Removed from Queue' : 'Saved to Queue');
  };

  // Real File Download
  const handleDownload = () => {
    if (!resolvedUrl) {
      showToast('Stream source preparing...');
      return;
    }
    try {
      const a = document.createElement('a');
      a.href = resolvedUrl;
      const safeTitle = (currentVideo.title || 'video').replace(/[/\\?%*:|"<>]/g, '-');
      a.download = `${safeTitle}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Export initiated for "${currentVideo.title}"`);
    } catch {
      showToast('Export processing in background');
    }
  };

  // Add Comment
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(currentVideo.id, commentInput.trim());
    setCommentInput('');
    setIsCommentFocused(false);
    showToast('Comment posted');
  };

  const handleMiniPlayer = () => {
    setMiniPlayerVideo(currentVideo);
    setMiniPlayerTime(currentTime);
    setIsMiniPlayerPlaying(isPlaying);
    onClose();
  };

  // Transcript lines
  const transcriptLines = useMemo(() => getVideoTranscript(currentVideo), [currentVideo]);

  // Synchronized active caption line
  const activeCaptionText = useMemo(() => {
    if (!isCaptionsOn) return null;
    for (let i = transcriptLines.length - 1; i >= 0; i--) {
      if (currentTime >= transcriptLines[i].startTime) {
        return transcriptLines[i].text;
      }
    }
    return transcriptLines[0]?.text || null;
  }, [currentTime, isCaptionsOn, transcriptLines]);

  const rawComments: CommentItem[] = comments[currentVideo.id] || [];
  const sortedComments = useMemo(() => {
    const list = [...rawComments];
    if (commentSort === 'top') {
      return list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return list.reverse();
  }, [rawComments, commentSort]);

  const formatTime = (secs: number) => {
    const totalSecs = Math.max(0, Math.floor(secs));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatPublishDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
    return dateStr;
  };

  const shareUrl = `${window.location.origin}/?v=${currentVideo.id}${
    shareStartAtCurrent ? `&t=${Math.floor(currentTime)}s` : ''
  }`;

  const copyShareUrl = () => {
    navigator.clipboard?.writeText(shareUrl);
    showToast('Direct stream link copied!');
  };

  // Interactive video chapters (generated based on duration)
  const chapters = useMemo(() => {
    const dur = duration || 120;
    return [
      { title: 'Introduction & Mission Brief', time: 0 },
      { title: 'System Architecture & Core Loop', time: Math.floor(dur * 0.25) },
      { title: 'Live Execution & Deep Flow', time: Math.floor(dur * 0.55) },
      { title: 'Synthesis & Final Protocol', time: Math.floor(dur * 0.85) },
    ];
  }, [duration]);

  const filterChips = ['All Tracks', 'Engineering', 'Systems', 'Deep Work', 'Architecture'];

  return (
    <div className="w-full min-h-screen bg-black text-white pb-24 select-none relative overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Watch Page Container */}
      <div
        className={`w-full mx-auto px-3 sm:px-5 md:px-8 py-4 transition-all ${
          isTheaterMode ? 'max-w-full' : 'max-w-[1720px]'
        }`}
      >
        {/* Navigation Breadcrumb & Back to Cinema Deck */}
        <div className="flex items-center justify-between pb-3 text-xs text-neutral-400">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 transition-colors font-mono"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
            <span>Return to Feed</span>
          </button>

          <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>STREAM READY</span>
            </span>
            <span>·</span>
            <span>CINEMA STAGE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT COLUMN: Main Video Stage, Telemetry, Creator Deck, Brief, Comments */}
          <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-8'} space-y-5`}>
            {/* The Cinema Stage Container (Clean Pure Black Frame, Zero AI Slot Glow) */}
            <div className="relative group">
              {/* 16:9 Video Canvas Frame */}
              <div
                ref={playerContainerRef}
                className="relative w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-2xl cursor-pointer"
                onClick={togglePlay}
              >
                {/* HTML5 Video Element with Real-Time Quality Rendering Filter */}
                <video
                  ref={videoRef}
                  src={resolvedUrl}
                  poster={currentVideo.thumbnailUrl}
                  style={qualityFilterStyle}
                  className="w-full h-full object-contain bg-black transition-all duration-300"
                  playsInline
                  autoPlay
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                />

                {/* Real-time Quality Switch Toast Badge */}
                {qualityBadgeToast && (
                  <div className="absolute top-4 right-4 z-40 bg-neutral-900/95 text-white px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-mono font-bold tracking-wide flex items-center gap-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>Optics: {qualityBadgeToast}</span>
                  </div>
                )}

                {/* Subtitles Overlay */}
                {isCaptionsOn && activeCaptionText && (
                  <div className="absolute bottom-18 inset-x-0 flex justify-center pointer-events-none z-20 px-6">
                    <span className="bg-black/90 text-white border border-neutral-700 font-medium text-xs sm:text-base px-4 py-1.5 rounded-lg shadow-2xl text-center leading-snug tracking-wide">
                      {activeCaptionText}
                    </span>
                  </div>
                )}

                {/* Center Play / Pause Indicator */}
                {showCenterIcon && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="w-16 h-16 rounded-xl bg-black/80 border border-neutral-700 text-white flex items-center justify-center shadow-2xl">
                      {showCenterIcon === 'play' ? (
                        <Play className="w-8 h-8 fill-white ml-0.5" />
                      ) : (
                        <Pause className="w-8 h-8 fill-white" />
                      )}
                    </div>
                  </div>
                )}

                {/* Top Inside Telemetry Bar */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <div className="bg-black/90 border border-neutral-800 px-2.5 py-1 rounded-lg text-white font-mono text-[10px] sm:text-xs flex items-center gap-2 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="font-bold text-white">STREAM</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-300">{activeQualityLabel} {playbackRate !== 1 ? `${playbackRate}x` : ''}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 bg-black/90 border border-neutral-800 px-2 py-1 rounded-lg text-[10px] font-mono text-neutral-400">
                      <Activity className="w-3 h-3 text-white" />
                      <span>60 FPS</span>
                    </div>
                  </div>

                  {/* Autoplay Next Badge */}
                  <div className="pointer-events-auto flex items-center gap-1.5 bg-black/90 border border-neutral-800 px-2.5 py-1 rounded-lg text-[11px] text-neutral-400">
                    <span className="text-[10px] uppercase font-mono tracking-wider">Autoplay</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAutoplayNext(!autoplayNext);
                      }}
                      className={`text-xs font-mono font-bold transition-colors ${autoplayNext ? 'text-white' : 'text-neutral-600'}`}
                    >
                      {autoplayNext ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Tap to Unmute Overlay */}
                {isMuted && isPlaying && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="absolute top-14 left-3 z-30 px-3.5 py-1.5 bg-black/95 hover:bg-black text-white text-xs font-mono font-semibold rounded-lg flex items-center gap-2 border border-neutral-700 transition-colors cursor-pointer shadow-xl pointer-events-auto"
                  >
                    <VolumeX className="w-4 h-4 text-white" />
                    <span>Unmute Sound</span>
                  </div>
                )}

                {/* Cinema Player Controls Dock */}
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-14 pb-3 px-3 sm:px-5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Clean Monochrome Scrubber */}
                  <div
                    ref={scrubberRef}
                    onClick={handleScrubberClick}
                    onMouseMove={handleScrubberMouseMove}
                    onMouseLeave={handleScrubberMouseLeave}
                    className="relative w-full h-1.5 hover:h-2 bg-neutral-800 rounded-full cursor-pointer mb-3 transition-all flex items-center group/scrub"
                  >
                    {/* Hover time tooltip */}
                    {hoverScrubTime !== null && hoverScrubPercent !== null && (
                      <div
                        className="absolute -top-7 -translate-x-1/2 bg-black border border-neutral-700 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded pointer-events-none shadow-xl"
                        style={{ left: `${hoverScrubPercent}%` }}
                      >
                        {formatTime(hoverScrubTime)}
                      </div>
                    )}

                    {/* Active Played Line */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-white rounded-full"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />

                    {/* Scrubber Knob */}
                    <div
                      className="absolute w-3 h-3 bg-white border border-neutral-900 rounded-full shadow-lg -translate-x-1/2 scale-0 group-hover/scrub:scale-100 transition-transform"
                      style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Dock Controls Row */}
                  <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                    {/* Left Controls */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Play/Pause */}
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 flex items-center justify-center transition-colors"
                        title={isPlaying ? 'Pause (k)' : 'Play (k)'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      {/* Skip -10s */}
                      <button
                        type="button"
                        onClick={() => handleSkip(-10)}
                        className="w-8 h-8 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Back 10s (j)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      {/* Skip +10s */}
                      <button
                        type="button"
                        onClick={() => handleSkip(10)}
                        className="w-8 h-8 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Forward 10s (l)"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Volume & Slider */}
                      <div className="flex items-center gap-1.5 group/vol">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="w-8 h-8 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                          title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-4 h-4 text-white" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-0 group-hover/vol:w-16 sm:group-hover/vol:w-20 transition-all h-1 accent-white bg-neutral-700 rounded cursor-pointer"
                        />
                      </div>

                      {/* Timestamp & Timecode */}
                      <div className="text-[11px] font-mono text-neutral-300 select-none ml-1 bg-black/80 px-2 py-0.5 rounded border border-neutral-800">
                        <span>{formatTime(currentTime)}</span>
                        <span className="mx-1 text-neutral-600">/</span>
                        <span className="text-neutral-400">{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Subtitles CC Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCaptionsOn(!isCaptionsOn);
                          showToast(isCaptionsOn ? 'Captions hidden' : 'Captions enabled');
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isCaptionsOn
                            ? 'bg-white text-black'
                            : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                        title="Captions (c)"
                      >
                        <Subtitles className="w-3.5 h-3.5" />
                      </button>

                      {/* Realtime Video Quality Switcher Engine */}
                      <div className="relative" ref={settingsMenuRef}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsOpen(!isSettingsOpen);
                            setSettingsSubmenu('main');
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 transition-colors"
                          title="Video Settings & Quality"
                        >
                          <Sliders className="w-3.5 h-3.5 text-white" />
                          <span className="font-mono text-[10px] font-bold text-white hidden sm:inline">
                            {activeQualityLabel}
                          </span>
                        </button>

                        {/* Quality Matrix Menu */}
                        {isSettingsOpen && (
                          <div className="absolute right-0 bottom-11 w-64 bg-neutral-950 text-white border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                            {/* Main Submenu */}
                            {settingsSubmenu === 'main' && (
                              <div className="space-y-1">
                                <div className="px-2 py-1 border-b border-neutral-800 flex items-center justify-between text-neutral-400 text-[10px] font-mono uppercase">
                                  <span>STREAM CONFIG</span>
                                  <span className="text-white font-bold">REALTIME</span>
                                </div>

                                {/* Quality Row */}
                                <button
                                  type="button"
                                  onClick={() => setSettingsSubmenu('quality')}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-black hover:bg-neutral-900 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <Sliders className="w-3.5 h-3.5 text-white" />
                                    <span className="font-medium">Video Quality</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-white text-[11px] font-mono">
                                    <span>{selectedQuality.split(' ')[0]}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </div>
                                </button>

                                {/* Playback Speed */}
                                <button
                                  type="button"
                                  onClick={() => setSettingsSubmenu('speed')}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-black hover:bg-neutral-900 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-white" />
                                    <span className="font-medium">Speed</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-white text-[11px] font-mono">
                                    <span>{playbackRate === 1 ? '1.0x Normal' : `${playbackRate}x`}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </div>
                                </button>

                                {/* Telemetry Details */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsStatsForNerdsOpen(!isStatsForNerdsOpen);
                                    setIsSettingsOpen(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-black hover:bg-neutral-900 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5 text-white" />
                                    <span className="font-medium">Stream Telemetry</span>
                                  </div>
                                  <span className="text-neutral-400 text-[11px] font-mono">
                                    {isStatsForNerdsOpen ? 'Active' : 'Hidden'}
                                  </span>
                                </button>
                              </div>
                            )}

                            {/* Quality Selector */}
                            {settingsSubmenu === 'quality' && (
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => setSettingsSubmenu('main')}
                                  className="w-full flex items-center gap-1.5 px-2 py-1 font-bold text-white hover:text-neutral-300 border-b border-neutral-800 mb-1"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                  <span className="font-mono text-xs uppercase">Choose Quality</span>
                                </button>

                                {[
                                  { label: '4K Ultra Cinematic', spec: '2160p · Master Quality' },
                                  { label: '1080p Studio 60', spec: '1080p60 · Crisp HD' },
                                  { label: '720p HD Balanced', spec: '720p · Balanced' },
                                  { label: '480p Turbo Mobile', spec: '480p · Standard' },
                                  { label: '360p Data Saver', spec: '360p · Data Saver' },
                                  { label: 'Auto (1080p 60)', spec: 'Adaptive Stream Rate' },
                                ].map((item) => (
                                  <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => handleQualityChange(item.label)}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-left ${
                                      selectedQuality === item.label
                                        ? 'bg-white text-black font-bold'
                                        : 'hover:bg-neutral-900 text-neutral-300'
                                    }`}
                                  >
                                    <div>
                                      <div className="text-xs font-mono">{item.label}</div>
                                      <div className={`text-[10px] font-mono ${selectedQuality === item.label ? 'text-neutral-700' : 'text-neutral-500'}`}>
                                        {item.spec}
                                      </div>
                                    </div>
                                    {selectedQuality === item.label && <Check className="w-3.5 h-3.5" />}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Speed Selector */}
                            {settingsSubmenu === 'speed' && (
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => setSettingsSubmenu('main')}
                                  className="w-full flex items-center gap-1.5 px-2 py-1 font-bold text-white hover:text-neutral-300 border-b border-neutral-800 mb-1"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                  <span className="font-mono text-xs uppercase">Playback Speed</span>
                                </button>

                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                                  <button
                                    key={spd}
                                    type="button"
                                    onClick={() => handleRateChange(spd)}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-left ${
                                      playbackRate === spd
                                        ? 'bg-white text-black font-bold'
                                        : 'hover:bg-neutral-900 text-neutral-300'
                                    }`}
                                  >
                                    <span className="font-mono">{spd === 1 ? '1.0x Normal' : `${spd}x`}</span>
                                    {playbackRate === spd && <Check className="w-3.5 h-3.5" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* MiniPlayer */}
                      <button
                        type="button"
                        onClick={handleMiniPlayer}
                        className="w-8 h-8 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors hidden sm:flex"
                        title="Mini Player (i)"
                      >
                        <PictureInPicture2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Theater Mode */}
                      <button
                        type="button"
                        onClick={() => setIsTheaterMode(!isTheaterMode)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors hidden sm:flex ${
                          isTheaterMode
                            ? 'bg-white text-black'
                            : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                        title="Theater Mode (t)"
                      >
                        <Tv className="w-3.5 h-3.5" />
                      </button>

                      {/* Fullscreen */}
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="w-8 h-8 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Fullscreen (f)"
                      >
                        <Maximize className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Title Header */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  {currentVideo.category || 'Standard Drop'}
                </span>
                <span>·</span>
                <span className="text-neutral-500">{formatPublishDate(currentVideo.createdAt)}</span>
                <span>·</span>
                <span className="text-neutral-500">{currentVideo.viewsCount || 1} views</span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                {currentVideo.title || 'Untitled Stream'}
              </h1>
            </div>

            {/* Creator Deck & Action Rail (Monochrome Black & White) */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              {/* Creator Info (Left) */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700 overflow-hidden shrink-0">
                  {currentVideo.creatorAvatar ? (
                    <img
                      src={currentVideo.creatorAvatar}
                      alt={currentVideo.creatorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-mono font-bold text-sm">
                      {(currentVideo.creatorName || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                      {currentVideo.creatorName || 'Creator'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                      VERIFIED
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 font-mono">
                    {subscriberCount} {subscriberCount === 1 ? 'follower' : 'followers'}
                  </span>
                </div>

                {/* Follow/Subscribe Button */}
                <button
                  type="button"
                  onClick={handleToggleSubscribe}
                  className={`ml-2 px-4 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                    isSubscribed
                      ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-700'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Following</span>
                    </>
                  ) : (
                    <span>Follow</span>
                  )}
                </button>
              </div>

              {/* Action Buttons (Right) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {/* Like */}
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors border ${
                    isLikedState
                      ? 'bg-white text-black border-white'
                      : 'bg-black hover:bg-neutral-900 text-neutral-300 border-neutral-800'
                  }`}
                  title="Like this stream"
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLikedState ? 'fill-black' : ''}`} />
                  <span>{likesCount}</span>
                </button>

                {/* Save to Queue */}
                <button
                  type="button"
                  onClick={handleSaveToVault}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors border ${
                    isSavedState
                      ? 'bg-white text-black border-white'
                      : 'bg-black hover:bg-neutral-900 text-neutral-300 border-neutral-800'
                  }`}
                  title="Save to Queue"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSavedState ? 'fill-black' : ''}`} />
                  <span>Queue</span>
                </button>

                {/* Share Stream */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 transition-colors"
                  title="Share stream"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                {/* Clip */}
                <button
                  type="button"
                  onClick={() => setIsClipModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 transition-colors"
                  title="Create Clip"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Clip</span>
                </button>

                {/* Download */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 transition-colors"
                  title="Export master file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                {/* Report */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-8 h-8 rounded-lg bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 flex items-center justify-center transition-colors"
                  title="Report stream"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Description & Tab Deck (Monochrome Black & White) */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-5 space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveBriefTab('synopsis')}
                  className={`px-3 py-1.5 rounded-lg transition-colors uppercase ${
                    activeBriefTab === 'synopsis'
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  SYNOPSIS
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBriefTab('chapters')}
                  className={`px-3 py-1.5 rounded-lg transition-colors uppercase ${
                    activeBriefTab === 'chapters'
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  CHAPTERS
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBriefTab('transcript')}
                  className={`px-3 py-1.5 rounded-lg transition-colors uppercase ${
                    activeBriefTab === 'transcript'
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  TRANSCRIPT
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBriefTab('telemetry')}
                  className={`px-3 py-1.5 rounded-lg transition-colors uppercase ${
                    activeBriefTab === 'telemetry'
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  TELEMETRY
                </button>
              </div>

              {/* Tab 1: Synopsis */}
              {activeBriefTab === 'synopsis' && (
                <div className="space-y-3 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                  <p className="whitespace-pre-line">
                    {currentVideo.description ||
                      'Master video stream, presentation materials, and architecture walkthrough.'}
                  </p>

                  {currentVideo.tags && currentVideo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {currentVideo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-black border border-neutral-800 text-[11px] font-mono text-neutral-400"
                        >
                          #{tag.replace(/\s+/g, '')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Chapters */}
              {activeBriefTab === 'chapters' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {chapters.map((chap, i) => (
                    <div
                      key={chap.title}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = chap.time;
                          setCurrentTime(chap.time);
                          showToast(`Jumped to: ${chap.title}`);
                        }
                      }}
                      className="p-3 rounded-lg bg-black hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-600 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-neutral-500 font-mono">PART 0{i + 1}</div>
                        <div className="font-bold text-xs text-white group-hover:text-neutral-200">
                          {chap.title}
                        </div>
                      </div>
                      <span className="font-mono text-xs px-2 py-1 rounded bg-neutral-900 text-white border border-neutral-700">
                        {formatTime(chap.time)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Transcript */}
              {activeBriefTab === 'transcript' && (
                <div className="max-h-60 overflow-y-auto space-y-2 text-xs no-scrollbar">
                  {transcriptLines.map((line) => (
                    <div
                      key={line.id}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = line.startTime;
                          setCurrentTime(line.startTime);
                        }
                      }}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-black cursor-pointer transition-colors"
                    >
                      <span className="font-mono text-white font-bold shrink-0 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-[11px]">
                        {formatTime(line.startTime)}
                      </span>
                      <span className="text-neutral-300 leading-normal">{line.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Telemetry */}
              {activeBriefTab === 'telemetry' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-black border border-neutral-800">
                    <div className="text-neutral-500 text-[10px]">VIDEO RESOLUTION</div>
                    <div className="font-bold text-white mt-1">{activeQualityLabel}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black border border-neutral-800">
                    <div className="text-neutral-500 text-[10px]">FRAME RATE</div>
                    <div className="font-bold text-white mt-1">60.0 FPS</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black border border-neutral-800">
                    <div className="text-neutral-500 text-[10px]">RENDER CODEC</div>
                    <div className="font-bold text-white mt-1">VP9 / AVC</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black border border-neutral-800">
                    <div className="text-neutral-500 text-[10px]">BUFFER TIME</div>
                    <div className="font-bold text-white mt-1">{Math.max(0, Math.round(duration - currentTime))}s</div>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section (Monochrome Black & White) */}
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-white" />
                  <h3 className="font-bold text-sm sm:text-base text-white uppercase font-mono">
                    Comments ({sortedComments.length})
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-xs font-mono text-neutral-400">
                  <button
                    type="button"
                    onClick={() => setCommentSort('top')}
                    className={`px-2 py-0.5 rounded transition-colors uppercase ${
                      commentSort === 'top' ? 'bg-white text-black font-bold' : 'hover:text-white'
                    }`}
                  >
                    Top
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setCommentSort('newest')}
                    className={`px-2 py-0.5 rounded transition-colors uppercase ${
                      commentSort === 'newest' ? 'bg-white text-black font-bold' : 'hover:text-white'
                    }`}
                  >
                    Newest
                  </button>
                </div>
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-700 shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-mono font-bold text-xs">
                      {(user?.displayName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onFocus={() => setIsCommentFocused(true)}
                    placeholder="Add a comment to this stream..."
                    className="w-full text-xs sm:text-sm bg-black border border-neutral-700 focus:border-white rounded-lg px-3.5 py-2 outline-none transition-colors text-white placeholder-neutral-500"
                  />

                  {isCommentFocused && (
                    <div className="flex items-center justify-end gap-2 pt-1 animate-in fade-in duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          setCommentInput('');
                          setIsCommentFocused(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-neutral-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!commentInput.trim()}
                        className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-white hover:bg-neutral-200 text-black disabled:opacity-40 transition-colors"
                      >
                        Comment
                      </button>
                    </div>
                  )}
                </div>
              </form>

              {/* Comments Feed */}
              <div className="space-y-2.5 pt-1">
                {sortedComments.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-2 text-center font-mono">
                    No comments yet. Write the first response!
                  </p>
                ) : (
                  sortedComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 rounded-lg bg-black border border-neutral-800 flex gap-3 text-xs sm:text-sm"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-700 shrink-0">
                        {comment.userAvatar ? (
                          <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-mono font-bold text-xs">
                            {(comment.userName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">
                            @{comment.userName || 'viewer'}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">{comment.createdAt || 'Just now'}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{comment.body || (comment as any).text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Up Next Queue Stream (Monochrome Black & White) */}
          <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-4 xl:col-span-4'} space-y-4`}>
            {/* Queue Header & Filters */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-white" />
                  <h3 className="font-bold text-sm text-white uppercase font-mono">Next in Stream</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-neutral-400 border border-neutral-800">
                  {otherVideos.length} QUEUED
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {filterChips.map((chip) => {
                  const active = selectedFilterChip === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setSelectedFilterChip(chip)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold shrink-0 transition-colors ${
                        active
                          ? 'bg-white text-black font-bold'
                          : 'bg-black text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Queue Stream Cards */}
            <div className="space-y-2.5">
              {otherVideos.length === 0 ? (
                <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center mx-auto border border-neutral-800">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-white uppercase font-mono">Queue Empty</p>
                    <p className="text-xs text-neutral-500 font-mono">
                      Upload your own recordings or clips to expand the stream!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openUploadModal()}
                    className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Video</span>
                  </button>
                </div>
              ) : (
                otherVideos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectVideo(item)}
                    className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors cursor-pointer flex gap-3 group"
                  >
                    {/* 16:9 Thumbnail */}
                    <div className="relative w-36 sm:w-40 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-neutral-800">
                      <img
                        src={
                          item.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        loading="lazy"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border border-neutral-700">
                        {item.durationFormatted || formatTime(item.durationSeconds || 120)}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col justify-between py-0.5 min-w-0 pr-1 flex-1">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-neutral-300 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
                          <span className="truncate">{item.creatorName || 'Creator'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1">
                        <span>{item.viewsCount || 1} views</span>
                        <span>{formatPublishDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-sm uppercase font-mono text-white">Share Stream</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Social Share Grid */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${currentVideo.title} ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1 text-xs text-neutral-400 hover:text-white shrink-0"
              >
                <div className="w-11 h-11 rounded-xl bg-black border border-neutral-800 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </div>
                <span className="font-mono text-[10px]">WhatsApp</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(currentVideo.title)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1 text-xs text-neutral-400 hover:text-white shrink-0"
              >
                <div className="w-11 h-11 rounded-xl bg-black border border-neutral-800 text-white flex items-center justify-center shadow-md">
                  <span className="font-bold text-sm">𝕏</span>
                </div>
                <span className="font-mono text-[10px]">X / Post</span>
              </a>

              <button
                type="button"
                onClick={() => setShareEmbedTab(!shareEmbedTab)}
                className="flex flex-col items-center gap-1 text-xs text-neutral-400 hover:text-white shrink-0"
              >
                <div className="w-11 h-11 rounded-xl bg-black border border-neutral-800 text-white flex items-center justify-center shadow-md">
                  <Code className="w-4 h-4" />
                </div>
                <span className="font-mono text-[10px]">Embed</span>
              </button>
            </div>

            {/* Embed Snippet */}
            {shareEmbedTab && (
              <div className="bg-black p-3 rounded-xl border border-neutral-800 space-y-1.5 text-xs font-mono">
                <div className="text-[10px] text-neutral-500 uppercase">HTML EMBED CODE:</div>
                <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800 break-all select-all text-neutral-300">
                  {`<iframe width="560" height="315" src="${shareUrl}" title="${currentVideo.title}" frameborder="0" allowfullscreen></iframe>`}
                </div>
              </div>
            )}

            {/* URL Input & Copy Button */}
            <div className="flex items-center gap-2 p-2 bg-black rounded-xl border border-neutral-800">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent flex-1 text-xs text-white outline-none select-all px-2 font-mono"
              />
              <button
                type="button"
                onClick={copyShareUrl}
                className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>

            {/* Start at Timestamp */}
            <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer pt-1 font-mono">
              <input
                type="checkbox"
                checked={shareStartAtCurrent}
                onChange={(e) => setShareStartAtCurrent(e.target.checked)}
                className="rounded accent-white w-4 h-4 cursor-pointer"
              />
              <span>Start at {formatTime(currentTime)}</span>
            </label>
          </div>
        </div>
      )}

      {/* Clip Modal */}
      <ClipModal
        isOpen={isClipModalOpen}
        onClose={() => setIsClipModalOpen(false)}
        video={currentVideo}
        initialTime={currentTime}
      />

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="video"
        targetId={currentVideo.id}
        targetTitle={currentVideo.title}
      />
    </div>
  );
};
