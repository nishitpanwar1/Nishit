import React, { useState, useRef, useEffect } from 'react';
import { VideoItem } from '../types';
import { useApp, isShortVideo } from '../context/AppContext';
import { TipModal } from './TipModal';
import { BoostModal } from './BoostModal';
import { ReportModal } from './ReportModal';
import { YouTubeVideoAd } from './YouTubeVideoAd';
import { ClipModal } from './ClipModal';
import { SAMPLE_VIDEO_ADS, VideoAdItem } from '../data/adsData';
import { videoStorageService } from '../services/videoStorage';
import { getVideoChapters, getVideoTranscript, formatTimestamp } from '../utils/videoEnhancements';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Heart,
  Bookmark,
  Share2,
  Coins,
  Rocket,
  ShieldAlert,
  Send,
  KeyRound,
  Check,
  Tv,
  Scissors,
  PictureInPicture,
  Sparkles,
  Clock,
  ListOrdered,
  FileText,
  Search,
  SlidersHorizontal,
  SkipForward,
} from 'lucide-react';

interface VideoPlayerModalProps {
  video: VideoItem;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  const {
    videos,
    likeVideo,
    saveVideo,
    likedVideoIds,
    savedVideoIds,
    recordView,
    comments,
    addComment,
    adsEnabled,
    claimAdReward,
    setCurrentView,
    openShort,
    setMiniPlayerVideo,
    setMiniPlayerTime,
    setIsMiniPlayerPlaying,
    ambientMode,
    setAmbientMode,
    sleepTimerMinutes,
    setSleepTimer,
    addToFocusQueue,
    toggleWatchLater,
    isWatchLater,
  } = useApp();

  // Active playing video (allows continuous viewing of Up Next videos)
  const [currentVideo, setCurrentVideo] = useState<VideoItem>(video);
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const otherVideos = videos.filter((v) => v.id !== currentVideo.id && !isShortVideo(v));

  useEffect(() => {
    setCurrentVideo(video);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [video.id]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(currentVideo.durationSeconds || 65);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [selectedQuality, setSelectedQuality] = useState<'1080p' | '720p' | '360p'>('1080p');
  const [commentInput, setCommentInput] = useState<string>('');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // Click & Double-click ripple feedback
  const [clickFeedback, setClickFeedback] = useState<'play' | 'pause' | 'rewind' | 'forward' | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Modern YouTube Feature States: Up Next, Chapters, Transcript, Clip, Sleep Timer
  const [activeSideTab, setActiveSideTab] = useState<'upnext' | 'comments' | 'chapters' | 'transcript'>('upnext');
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [isClipOpen, setIsClipOpen] = useState<boolean>(false);
  const [isSleepMenuOpen, setIsSleepMenuOpen] = useState<boolean>(false);
  const [sleepTimerSecondsLeft, setSleepTimerSecondsLeft] = useState<number | null>(null);

  const chapters = getVideoChapters(currentVideo);
  const transcript = getVideoTranscript(currentVideo);
  const currentChapter =
    chapters.find((ch) => currentTime >= ch.startTime && (ch.endTime === undefined || currentTime < ch.endTime)) ||
    chapters[0];

  // In-stream YouTube Video Ad State
  const [currentAd, setCurrentAd] = useState<VideoAdItem | null>(() => {
    if (!adsEnabled) return null;
    const instreamAds = SAMPLE_VIDEO_ADS.filter((a) => a.format === 'preroll' || a.format === 'rewarded');
    return instreamAds[Math.floor(Math.random() * instreamAds.length)] || SAMPLE_VIDEO_ADS[0];
  });
  const [isShowingAd, setIsShowingAd] = useState<boolean>(adsEnabled);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>(
    currentVideo.videoUrl || '/videos/long_stream_1.mp4'
  );

  // Sub-modals
  const [isTipOpen, setIsTipOpen] = useState<boolean>(false);
  const [isBoostOpen, setIsBoostOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Transition to next video in Up Next
  const handleSelectNextVideo = (nextVid?: VideoItem) => {
    const target = nextVid || otherVideos[0];
    if (target) {
      setCurrentVideo(target);
      setCurrentTime(0);
      setIsPlaying(true);
      setRewardToast(`Playing: ${target.title}`);
      setTimeout(() => setRewardToast(null), 2500);
    }
  };

  // Video ended: auto play next if enabled
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (autoplayNext && otherVideos.length > 0) {
      handleSelectNextVideo(otherVideos[0]);
    }
  };

  // Minimize to YouTube Picture-in-Picture Miniplayer
  const handleMinimizeToMiniPlayer = () => {
    setMiniPlayerVideo(currentVideo);
    setMiniPlayerTime(currentTime);
    setIsMiniPlayerPlaying(isPlaying);
    onClose();
  };

  // Sleep / Focus Sprint Timer countdown
  useEffect(() => {
    if (sleepTimerMinutes === null) {
      setSleepTimerSecondsLeft(null);
      return;
    }
    setSleepTimerSecondsLeft(sleepTimerMinutes * 60);
    const interval = setInterval(() => {
      setSleepTimerSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
          setRewardToast('Focus sprint completed! Great intentional session.');
          setTimeout(() => setRewardToast(null), 4000);
          setSleepTimer(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  const isLiked = likedVideoIds.includes(currentVideo.id);
  const isSaved = savedVideoIds.includes(currentVideo.id);
  const videoComments = comments[currentVideo.id] || [];

  useEffect(() => {
    let active = true;
    async function resolve() {
      const safeUrl = await videoStorageService.resolvePlaybackUrl(currentVideo.id, currentVideo.videoUrl, false);
      if (active) {
        setResolvedUrl(safeUrl || '/videos/long_stream_1.mp4');
      }
    }
    resolve();
    return () => {
      active = false;
    };
  }, [currentVideo.id, currentVideo.videoUrl]);

  const handleVideoError = (e?: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setVideoError(true);
  };

  useEffect(() => {
    if (isShortVideo(currentVideo)) {
      onClose();
      openShort(currentVideo.id);
    }
  }, [currentVideo, onClose, openShort]);

  useEffect(() => {
    recordView(currentVideo.id);
  }, [currentVideo.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        (target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const vid = videoRef.current;
      if (!vid) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (isShowingAd) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          handleMinimizeToMiniPlayer();
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          vid.currentTime = Math.max(0, vid.currentTime - 10);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          vid.currentTime = Math.max(0, vid.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          vid.volume = Math.min(1, vid.volume + 0.05);
          setIsMuted(false);
          vid.muted = false;
          break;
        case 'ArrowDown':
          e.preventDefault();
          vid.volume = Math.max(0, vid.volume - 0.05);
          if (vid.volume <= 0.01) {
            setIsMuted(true);
            vid.muted = true;
          }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted((prev) => {
            vid.muted = !prev;
            return !prev;
          });
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            vid.parentElement?.requestFullscreen?.().catch(() => {
              vid.requestFullscreen?.();
            });
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
          break;
        case '<':
          e.preventDefault();
          setPlaybackRate((prev) => {
            const next = Math.max(0.25, prev - 0.25);
            vid.playbackRate = next;
            return next;
          });
          break;
        case '>':
          e.preventDefault();
          setPlaybackRate((prev) => {
            const next = Math.min(2, prev + 0.25);
            vid.playbackRate = next;
            return next;
          });
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          if (vid.duration) {
            const fraction = parseInt(e.key, 10) / 10;
            vid.currentTime = vid.duration * fraction;
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isShowingAd, playbackRate]);

  // Synchronize DOM muted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
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
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || currentVideo.durationSeconds || 65);
      if (!isShowingAd) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay policy prevented unmuted audio: retry muted automatically
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
  };

  const handleVideoContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.player-controls-bar') || target.closest('button') || target.closest('input')) {
      return;
    }
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Check double click (< 320ms)
    if (now - lastClickTimeRef.current < 320) {
      if (x < width * 0.35) {
        // Left double click: -10s
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          setClickFeedback('rewind');
          setTimeout(() => setClickFeedback(null), 600);
        }
        lastClickTimeRef.current = 0;
        return;
      } else if (x > width * 0.65) {
        // Right double click: +10s
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          setClickFeedback('forward');
          setTimeout(() => setClickFeedback(null), 600);
        }
        lastClickTimeRef.current = 0;
        return;
      }
    }

    lastClickTimeRef.current = now;
    togglePlay();
    setClickFeedback(isPlaying ? 'pause' : 'play');
    setTimeout(() => setClickFeedback(null), 600);
  };

  // Video Ad Handlers
  const handleSkipAd = () => {
    setIsShowingAd(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 50);
  };

  const handleCompleteAd = () => {
    setIsShowingAd(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 50);
  };

  const handleRewardAd = () => {
    if (currentAd) {
      claimAdReward(currentAd.advertiserName);
      setRewardToast(`+${currentAd.rewardTokens || 2} RUP reward credited to wallet!`);
      setTimeout(() => setRewardToast(null), 3500);
    }
  };

  const handleTriggerRewardedAd = () => {
    const nextAd = SAMPLE_VIDEO_ADS[Math.floor(Math.random() * SAMPLE_VIDEO_ADS.length)];
    setCurrentAd(nextAd);
    setIsShowingAd(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleRateChange = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(video.id, commentInput);
    setCommentInput('');
  };

  const activeRendition =
    video.renditions.find((r) => r.label === selectedQuality) || video.renditions[0];

  const isShort = video.isShort || video.aspectRatio === '9:16';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-1 sm:p-3 md:p-6 overflow-y-auto">
      <div
        className={`w-full ${
          isShort ? 'max-w-md sm:max-w-lg md:max-w-xl lg:max-w-4xl' : 'max-w-7xl'
        } max-h-[96vh] md:max-h-[92vh] bg-surface-container-lowest text-on-surface border border-surface-container rounded-xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl relative my-auto`}
      >
        {/* Top bar with signed URL badge and close */}
        <div className="flex items-center justify-between px-3 md:px-5 py-2.5 border-b border-surface-container bg-surface-container-low text-xs">
          <div className="flex items-center gap-2 text-secondary">
            <KeyRound className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-mono text-[11px] truncate max-w-xs sm:max-w-md md:max-w-lg">
              {isShort ? 'Shorts Stream (9:16)' : 'Signed Stream'}:{' '}
              <span className="text-on-surface font-bold">token_auth_valid_24h</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Ambient Mode Toggle */}
            <button
              type="button"
              onClick={() => setAmbientMode(!ambientMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                ambientMode
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'bg-surface-container text-secondary hover:text-on-surface border border-surface-container'
              }`}
              title="Ambient Mode: Casts dynamic theater aura glow around player"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ambient</span>
              <span>{ambientMode ? 'On' : 'Off'}</span>
            </button>

            {/* Sleep / Focus Timer Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSleepMenuOpen(!isSleepMenuOpen)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  sleepTimerMinutes !== null
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#222222] text-[#aaaaaa] hover:text-white border border-white/10'
                }`}
                title="Focus & Sleep Sprint Timer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {sleepTimerSecondsLeft !== null ? formatTimestamp(sleepTimerSecondsLeft) : 'Timer'}
                </span>
              </button>

              {isSleepMenuOpen && (
                <div className="absolute top-8 right-0 z-50 w-48 bg-[#202020] border border-[#383838] rounded-xl shadow-2xl p-1.5 space-y-1 text-xs text-white animate-in fade-in">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#aaaaaa] tracking-wider">
                    Focus / Sleep Timer
                  </div>
                  {[
                    { label: 'Off', val: null },
                    { label: '10 minutes', val: 10 },
                    { label: '25 min (Pomodoro)', val: 25 },
                    { label: '45 min (Deep Focus)', val: 45 },
                    { label: 'End of video', val: Math.ceil(duration / 60) },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setSleepTimer(opt.val);
                        setIsSleepMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        sleepTimerMinutes === opt.val
                          ? 'bg-[#ff0033] text-white font-semibold'
                          : 'hover:bg-[#303030] text-[#f1f1f1]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sleepTimerMinutes === opt.val && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture Miniplayer Button */}
            <button
              type="button"
              onClick={handleMinimizeToMiniPlayer}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#222222] hover:bg-[#333333] text-[#aaaaaa] hover:text-white rounded-full text-[11px] font-semibold border border-white/10 transition-colors"
              title="Minimize to Picture-in-Picture Miniplayer (I)"
            >
              <PictureInPicture className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Miniplayer</span>
            </button>

            {isShort && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openShort(video.id);
                }}
                className="px-2.5 py-1 bg-[#ff0033] hover:bg-[#cc0029] text-white font-semibold text-[11px] rounded-full transition-colors cursor-pointer"
              >
                Full Shorts View
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-[#272727] rounded-full transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Player & Metadata */}
          <div
            className={`${
              isShort
                ? 'lg:col-span-7 flex flex-col items-center justify-center p-3 md:p-4 bg-[#0a0a0a]'
                : 'lg:col-span-8 flex flex-col'
            } border-b lg:border-b-0 lg:border-r border-[#272727] overflow-y-auto`}
          >
            {/* Video Container (Strictly 9:16 for Shorts, 16:9 aspect-video for standard) */}
            <div
              onClick={handleVideoContainerClick}
              className={`relative bg-black flex items-center justify-center group overflow-hidden cursor-pointer select-none ${
                isShort
                  ? 'aspect-[9/16] w-full max-w-[320px] sm:max-w-[360px] max-h-[66vh] md:max-h-[74vh] rounded-2xl shadow-2xl border border-[#272727]'
                  : 'aspect-video w-full'
              }`}
            >
              {/* Dynamic YouTube Ambient Mode Glow Aura */}
              {ambientMode && !isShort && (
                <div className="absolute -inset-10 bg-gradient-to-tr from-[#ff0033]/20 via-[#3ea6ff]/15 to-[#fbc02d]/20 blur-3xl opacity-75 pointer-events-none rounded-3xl -z-10 transition-all duration-700" />
              )}

              {rewardToast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-400 text-black font-bold text-xs rounded-full shadow-2xl flex items-center gap-2 animate-pulse pointer-events-none">
                  <Coins className="w-4 h-4 fill-current" />
                  <span>{rewardToast}</span>
                </div>
              )}

              {/* Big Center Play Button when paused */}
              {!isPlaying && !isShowingAd && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ff0000] text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                  </div>
                </div>
              )}

              {/* Central Ripple Feedback for Play / Pause / Seek */}
              {clickFeedback && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/75 text-white flex items-center justify-center backdrop-blur-xs animate-ping">
                    {clickFeedback === 'play' && <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />}
                    {clickFeedback === 'pause' && <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />}
                    {clickFeedback === 'rewind' && <span className="font-bold text-sm sm:text-base">-10s</span>}
                    {clickFeedback === 'forward' && <span className="font-bold text-sm sm:text-base">+10s</span>}
                  </div>
                </div>
              )}

              {/* Click to unmute banner */}
              {isMuted && isPlaying && !isShowingAd && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      videoRef.current.muted = false;
                      setIsMuted(false);
                    }
                  }}
                  className="absolute top-4 left-4 z-40 px-3 py-1.5 bg-black/80 hover:bg-black text-white text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all shadow-xl cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5 text-[#ff0000]" />
                  <span>Click to unmute</span>
                </button>
              )}

              {isShowingAd && currentAd ? (
                <YouTubeVideoAd
                  ad={currentAd}
                  onSkip={handleSkipAd}
                  onComplete={handleCompleteAd}
                  onReward={handleRewardAd}
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={resolvedUrl || currentVideo.videoUrl || '/videos/long_stream_1.mp4'}
                    poster={currentVideo.thumbnailUrl}
                    preload="auto"
                    className={`w-full h-full ${isShort ? 'object-cover' : 'object-contain'} pointer-events-none`}
                    autoPlay
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleVideoEnded}
                    onError={handleVideoError}
                  />

                  {/* Hover / Overlay Player Controls */}
                  <div className="player-controls-bar absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 sm:p-4 pointer-events-auto">
                    <div className="flex justify-between items-center text-xs text-white">
                      <span className="font-semibold truncate max-w-sm sm:max-w-md">{currentVideo.title}</span>
                      {/* Quality selector */}
                      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                        {(['1080p', '720p', '360p'] as const).map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQuality(q);
                            }}
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                              selectedQuality === q
                                ? 'bg-[#ff0033] text-white font-bold'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Bar Controls with YouTube Red Scrubber */}
                    <div className="space-y-1.5">
                      {/* Active Chapter Label */}
                      {currentChapter && (
                        <div className="flex items-center justify-between text-[11px] text-white/95 font-medium px-0.5">
                          <div className="truncate flex items-center gap-1.5 max-w-[70%]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff0033] shrink-0" />
                            <span className="truncate font-semibold text-[#f1f1f1]">
                              Chapter: {currentChapter.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#aaaaaa] shrink-0">
                            {formatTimestamp(currentChapter.startTime)} –{' '}
                            {formatTimestamp(currentChapter.endTime || duration)}
                          </span>
                        </div>
                      )}

                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-1 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#ff0033]"
                      />

                      <div className="flex items-center justify-between text-xs text-white">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlay();
                            }}
                            className="p-1 hover:text-white transition-colors"
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>

                          {/* Next Video Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectNextVideo();
                            }}
                            className="p-1 hover:text-white transition-colors"
                            title="Play next video (Shift+N)"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>

                          {/* Volume & Hover Slider */}
                          <div className="flex items-center group/vol">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (videoRef.current) {
                                  videoRef.current.muted = !isMuted;
                                  setIsMuted(!isMuted);
                                }
                              }}
                              className="p-1 hover:text-white transition-colors"
                            >
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={isMuted ? 0 : volume}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setVolume(v);
                                if (videoRef.current) {
                                  videoRef.current.volume = v;
                                  if (v === 0) {
                                    videoRef.current.muted = true;
                                    setIsMuted(true);
                                  } else {
                                    videoRef.current.muted = false;
                                    setIsMuted(false);
                                  }
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-0 group-hover/vol:w-16 transition-all duration-200 h-1 bg-[#333333] accent-[#ff0033] appearance-none rounded cursor-pointer ml-1"
                              title="Volume"
                            />
                          </div>

                          <span className="font-mono text-[11px] tabular-nums text-[#aaaaaa]">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Autoplay Next Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAutoplayNext(!autoplayNext);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                              autoplayNext
                                ? 'bg-[#ff0033] text-white font-bold'
                                : 'bg-[#272727] text-[#aaaaaa] hover:text-white'
                            }`}
                            title={`Autoplay is ${autoplayNext ? 'ON' : 'OFF'}`}
                          >
                            Autoplay {autoplayNext ? 'ON' : 'OFF'}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRateChange();
                            }}
                            className="font-mono text-[11px] px-2 py-0.5 bg-[#272727] rounded hover:bg-[#383838]"
                          >
                            {playbackRate}x
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (videoRef.current?.requestFullscreen) {
                                videoRef.current.requestFullscreen();
                              }
                            }}
                            className="p-1 hover:text-white"
                          >
                            <Maximize className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Video Details & Actions */}
            <div className="p-4 sm:p-5 space-y-4 bg-surface-container-lowest text-on-surface">
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-on-surface font-display leading-snug">
                  {currentVideo.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-secondary mt-1.5 font-mono">
                  <span>{currentVideo.viewsCount.toLocaleString()} views</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentVideo.createdAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentVideo.category}</span>
                </div>
              </div>

              {/* Creator Lockup + Action Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-3 border-y border-surface-container">
                {/* Creator Profile + Subscribe button */}
                <div className="flex items-center gap-3">
                  <img
                    src={currentVideo.creatorAvatar}
                    alt={currentVideo.creatorName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-on-surface">{currentVideo.creatorName}</div>
                    <div className="text-[11px] text-secondary font-mono">@{currentVideo.creatorUsername}</div>
                  </div>

                  <button
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    className={`ml-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      isSubscribed
                        ? 'bg-surface-container-high text-on-surface'
                        : 'bg-primary text-on-primary hover:bg-primary-container'
                    }`}
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                </div>

                {/* Action Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Like Pill */}
                  <button
                    onClick={() => likeVideo(currentVideo.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isLiked
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-mono tabular-nums">{currentVideo.likesCount}</span>
                  </button>

                  {/* Share Pill */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container transition-colors"
                  >
                    {copiedShare ? <Check className="w-3.5 h-3.5 text-primary" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedShare ? 'Copied' : 'Share'}</span>
                  </button>

                  {/* Save Pill */}
                  <button
                    onClick={() => saveVideo(currentVideo.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isSaved
                        ? 'bg-on-surface text-surface-container-lowest'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                    <span>Save</span>
                  </button>

                  {/* Watch Later Pill */}
                  <button
                    onClick={() => {
                      toggleWatchLater(currentVideo);
                      setRewardToast(isWatchLater(currentVideo.id) ? 'Removed from Watch Later' : 'Saved to Watch Later');
                      setTimeout(() => setRewardToast(null), 2000);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isWatchLater(currentVideo.id)
                        ? 'bg-[#ff0000] text-white'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isWatchLater(currentVideo.id) ? 'Saved' : 'Watch Later'}</span>
                  </button>

                  {/* Add to Focus Queue Pill */}
                  <button
                    onClick={() => {
                      addToFocusQueue(currentVideo);
                      setRewardToast('Added to Focus Queue');
                      setTimeout(() => setRewardToast(null), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container transition-colors"
                    title="Add to upcoming focus queue"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-[#ff0000]" />
                    <span>Queue</span>
                  </button>

                  {/* Create Clip Pill */}
                  <button
                    type="button"
                    onClick={() => setIsClipOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container transition-colors"
                    title="Clip a 15-60s snippet to share"
                  >
                    <Scissors className="w-3.5 h-3.5 text-primary" />
                    <span>Clip</span>
                  </button>

                  {/* Tip Pill */}
                  <button
                    onClick={() => setIsTipOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container transition-colors"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tip</span>
                  </button>

                  {/* Boost Pill */}
                  <button
                    onClick={() => setIsBoostOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container transition-colors"
                  >
                    <Rocket className="w-3.5 h-3.5 text-secondary" />
                    <span>Boost</span>
                  </button>
                </div>
              </div>

              {/* Description Box */}
              <div className="p-3.5 bg-surface-container-low rounded-xl space-y-2 text-xs text-on-surface border border-surface-container">
                <p className="leading-relaxed m-0">{currentVideo.description}</p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px] text-primary">
                  {currentVideo.tags.map((t) => (
                    <span key={t} className="hover:underline cursor-pointer">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Comments, Chapters & Transcript */}
          <div
            className={`${
              isShort ? 'lg:col-span-5' : 'lg:col-span-4'
            } flex flex-col h-full bg-surface-container-low p-4 overflow-hidden border-l border-surface-container`}
          >
            {/* Tab Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-3">
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-surface-container w-full overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveSideTab('upnext')}
                  className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors text-center whitespace-nowrap px-2 ${
                    activeSideTab === 'upnext'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Up Next ({otherVideos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('comments')}
                  className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors text-center whitespace-nowrap px-2 ${
                    activeSideTab === 'comments'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Comments ({videoComments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('chapters')}
                  className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors text-center flex items-center justify-center gap-1 whitespace-nowrap px-2 ${
                    activeSideTab === 'chapters'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <ListOrdered className="w-3 h-3" />
                  <span>Chapters ({chapters.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('transcript')}
                  className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors text-center flex items-center justify-center gap-1 whitespace-nowrap px-2 ${
                    activeSideTab === 'transcript'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Transcript</span>
                </button>
              </div>
            </div>

            {/* TAB 0: Up Next / Recommended Videos */}
            {activeSideTab === 'upnext' && (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                <div className="flex items-center justify-between text-xs text-secondary pb-1">
                  <span className="font-bold text-on-surface">Queue / Recommended</span>
                  <button
                    type="button"
                    onClick={() => setAutoplayNext(!autoplayNext)}
                    className="flex items-center gap-1.5 text-[11px] font-mono hover:text-on-surface cursor-pointer"
                  >
                    <span>Autoplay</span>
                    <span className={`w-2 h-2 rounded-full ${autoplayNext ? 'bg-[#ff0033]' : 'bg-neutral-600'}`} />
                  </button>
                </div>

                {otherVideos.length === 0 ? (
                  <div className="text-center py-12 text-xs text-secondary">
                    No other videos available. Upload or record more videos to populate the queue!
                  </div>
                ) : (
                  otherVideos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => handleSelectNextVideo(vid)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container cursor-pointer transition-colors group"
                    >
                      <div className="relative aspect-video w-32 shrink-0 rounded-lg overflow-hidden bg-black">
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px] font-mono text-white">
                          {vid.durationFormatted || '1:05'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-on-surface line-clamp-2 leading-tight group-hover:text-primary">
                          {vid.title}
                        </h4>
                        <p className="text-[11px] text-secondary mt-1 truncate">{vid.creatorName}</p>
                        <p className="text-[10px] text-secondary font-mono">{vid.viewsCount?.toLocaleString()} views</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 1: Comments */}
            {activeSideTab === 'comments' && (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {videoComments.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#aaaaaa]">
                      No comments yet. Be the first to start the discussion!
                    </div>
                  ) : (
                    videoComments.map((c) => (
                      <div key={c.id} className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={c.userAvatar}
                            alt={c.userName}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="font-semibold text-[#0f0f0f]">{c.userName}</span>
                          <span className="text-[10px] text-[#606060] font-mono">{c.createdAt}</span>
                        </div>
                        <p className="text-[#0f0f0f] pl-8 leading-relaxed">{c.body}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleCommentSubmit} className="pt-3 border-t border-[#e5e5e5] mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent border-b border-[#cccccc] focus:border-[#0f0f0f] px-2 py-1.5 text-xs text-[#0f0f0f] placeholder-[#606060] focus:outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!commentInput.trim()}
                      className="px-3 py-1.5 bg-[#0f0f0f] hover:bg-black disabled:opacity-30 text-white rounded-full text-xs font-semibold transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* TAB 2: Interactive Chapters & Key Moments */}
            {activeSideTab === 'chapters' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                <div className="text-[11px] text-[#aaaaaa] mb-1">
                  Click any key moment to jump directly to that chapter.
                </div>
                {chapters.map((ch) => {
                  const isActive =
                    currentTime >= ch.startTime &&
                    (ch.endTime === undefined || currentTime < ch.endTime);
                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = ch.startTime;
                          setCurrentTime(ch.startTime);
                          if (!isPlaying) {
                            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                          }
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-[#f2f2f2] border-[#ff0000] shadow-xs'
                          : 'bg-white border-[#e5e5e5] hover:border-[#cccccc]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`px-2 py-1 rounded text-[11px] font-mono font-bold shrink-0 ${
                            isActive ? 'bg-[#ff0000] text-white' : 'bg-[#f2f2f2] text-[#065fd4]'
                          }`}
                        >
                          {formatTimestamp(ch.startTime)}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-medium truncate ${
                              isActive ? 'text-[#0f0f0f] font-bold' : 'text-[#333333]'
                            }`}
                          >
                            {ch.title}
                          </h4>
                          <span className="text-[10px] text-[#606060] font-mono">
                            {formatTimestamp(ch.startTime)} – {formatTimestamp(ch.endTime || duration)}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#ff0000] shrink-0 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0000] animate-ping" />
                          <span>PLAYING</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: Synchronized Searchable Transcript */}
            {activeSideTab === 'transcript' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#606060]" />
                  <input
                    type="text"
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    placeholder="Search inside video transcript..."
                    className="w-full bg-white border border-[#cccccc] focus:border-[#0f0f0f] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0f0f0f] placeholder-[#606060] focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-1">
                  {transcript
                    .filter((line) =>
                      transcriptSearch.trim()
                        ? line.text.toLowerCase().includes(transcriptSearch.toLowerCase())
                        : true
                    )
                    .map((line) => {
                      const isLineActive =
                        currentTime >= line.startTime && currentTime < line.startTime + 18;
                      return (
                        <div
                          key={line.id}
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = line.startTime;
                              setCurrentTime(line.startTime);
                              if (!isPlaying) {
                                videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                              }
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors cursor-pointer flex items-start gap-2.5 text-xs ${
                            isLineActive
                              ? 'bg-[#f2f2f2] text-[#0f0f0f] border-l-2 border-[#ff0000]'
                              : 'hover:bg-[#f2f2f2] text-[#333333]'
                          }`}
                        >
                          <span className="text-[11px] font-mono text-[#065fd4] shrink-0 mt-0.5 font-semibold">
                            {formatTimestamp(line.startTime)}
                          </span>
                          <p className="leading-relaxed flex-1">{line.text}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ClipModal
        isOpen={isClipOpen}
        onClose={() => setIsClipOpen(false)}
        video={video}
        initialTime={currentTime}
      />

      <TipModal
        isOpen={isTipOpen}
        onClose={() => setIsTipOpen(false)}
        creatorId={video.creatorId}
        creatorName={video.creatorName}
        videoId={video.id}
      />

      <BoostModal
        isOpen={isBoostOpen}
        onClose={() => setIsBoostOpen(false)}
        videoId={video.id}
        videoTitle={video.title}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="video"
        targetId={video.id}
        targetTitle={video.title}
      />
    </div>
  );
};
