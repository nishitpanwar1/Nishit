import React, { useState, useRef, useEffect } from 'react';
import { VideoAdItem } from '../data/adsData';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  Info,
  SkipForward,
  Coins,
  ShieldCheck,
  X,
} from 'lucide-react';

interface YouTubeVideoAdProps {
  ad: VideoAdItem;
  onComplete: () => void;
  onSkip: () => void;
  onReward?: () => void;
}

export const YouTubeVideoAd: React.FC<YouTubeVideoAdProps> = ({
  ad,
  onComplete,
  onSkip,
  onReward,
}) => {
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(ad.durationSeconds || 15);
  const [skipRemaining, setSkipRemaining] = useState<number>(ad.skipOffsetSeconds || 5);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  // Fallback simulator if video decoder or network fails in test environment
  useEffect(() => {
    if (videoError) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            clearInterval(interval);
            handleEnded();
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [videoError, duration]);

  // Skip countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSkipRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    e.preventDefault();
    e.stopPropagation();
    setVideoError(true);
  };

  const handleTimeUpdate = () => {
    if (adVideoRef.current) {
      setCurrentTime(adVideoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (adVideoRef.current && adVideoRef.current.duration) {
      setDuration(adVideoRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (!rewardClaimed && onReward) {
      setRewardClaimed(true);
      onReward();
    }
    onComplete();
  };

  const handleSkipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (skipRemaining === 0) {
      onSkip();
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adVideoRef.current) return;
    if (adVideoRef.current.paused) {
      adVideoRef.current.play();
      setIsPlaying(true);
    } else {
      adVideoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adVideoRef.current) return;
    adVideoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleOpenAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer');
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none group">
      {/* Video Commercial Element or Fallback Poster */}
      {!videoError && ad.videoUrl ? (
        <video
          ref={adVideoRef}
          key={ad.videoUrl}
          src={ad.videoUrl || '/videos/sample.mp4'}
          poster={ad.thumbnailUrl}
          className="w-full h-full object-contain cursor-pointer"
          autoPlay
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleVideoError}
          onClick={togglePlay}
        />
      ) : (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img
            src={ad.thumbnailUrl}
            alt={ad.headline}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
        </div>
      )}

      {/* Top Banner: Authentic YouTube "Ad · 1 of 1" and Sponsor info */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Yellow Ad Pill */}
          <div className="px-2 py-0.5 bg-[#fbc02d] text-black font-extrabold text-[11px] rounded tracking-wider uppercase font-mono shadow-sm">
            Ad
          </div>
          <span className="text-white/90 text-xs font-medium font-mono">
            1 of 1 · 0:{Math.max(0, Math.round(duration - currentTime)).toString().padStart(2, '0')}
          </span>
          <span className="hidden sm:inline text-white/50 text-xs">·</span>
          <span className="hidden sm:inline text-white/90 text-xs font-semibold truncate max-w-xs">
            {ad.advertiserName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Rewarded Ad Badge */}
          {ad.rewardTokens && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 font-mono text-[11px] shadow-sm">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>+{ad.rewardTokens} RUP Reward</span>
            </div>
          )}

          {/* Info Icon: Why this ad? */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowInfoModal(true);
            }}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 transition-colors"
            title="Why this ad? / Ad details"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Advertiser Card + YouTube Skip Ad Button */}
      <div className="absolute bottom-0 inset-x-0 pb-3 pt-6 px-3 sm:px-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-end justify-between gap-3">
          {/* Advertiser Info Banner Card */}
          <div
            onClick={handleOpenAd}
            className="flex items-center gap-3 p-2 sm:p-2.5 bg-black/75 hover:bg-black/90 border border-white/15 rounded-xl cursor-pointer max-w-sm sm:max-w-md backdrop-blur-md transition-all hover:scale-[1.01] shadow-xl group/card"
          >
            <img
              src={ad.advertiserLogo}
              alt={ad.advertiserName}
              className="w-10 h-10 rounded-lg object-cover bg-white/10 shrink-0 border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white line-clamp-1 group-hover/card:text-[#3ea6ff] transition-colors">
                {ad.headline}
              </div>
              <div className="text-[11px] text-[#aaaaaa] font-mono truncate flex items-center gap-1 mt-0.5">
                <span>{ad.displayUrl}</span>
                <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenAd}
              className="hidden sm:inline-flex px-3 py-1.5 bg-[#3ea6ff] hover:bg-[#65b8ff] text-black font-bold text-xs rounded-full transition-colors shrink-0 shadow-sm"
            >
              {ad.ctaText}
            </button>
          </div>

          {/* Skip Ad Button Container (Exact YouTube Mechanics) */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {skipRemaining > 0 ? (
              <div className="px-3.5 py-2 bg-black/85 border border-white/20 text-white/90 text-xs font-mono font-medium rounded-md shadow-lg backdrop-blur-md flex items-center gap-2">
                <span>Video will play after ad</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-[11px]">
                  {skipRemaining}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSkipClick}
                className="px-4 py-2 bg-[#0f0f0f]/95 hover:bg-black text-white font-bold text-xs border border-white/40 hover:border-white rounded-md shadow-2xl flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 group/skip"
              >
                <span>Skip Ad</span>
                <SkipForward className="w-4 h-4 fill-white group-hover/skip:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Ad Controls + Yellow Progress Bar */}
        <div className="space-y-1 pt-1">
          {/* YouTube Signature Yellow Ad Scrubber Bar */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#fbc02d] transition-all duration-150 ease-linear shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/80 pt-0.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 hover:text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <span className="font-mono text-[10px] text-white/60">
                Ad Audio · Click video to pause
              </span>
            </div>

            <div className="text-[10px] text-white/60 font-mono">
              Google AdMob · VAST 4.0 Standard
            </div>
          </div>
        </div>
      </div>

      {/* Info Popover Modal ("Why this ad?") */}
      {showInfoModal && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowInfoModal(false);
          }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181818] border border-[#303030] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#272727]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-[#3ea6ff]" />
                <span>About This Video Ad</span>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 text-[#aaaaaa] hover:text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#cccccc]">
              <div>
                <div className="font-semibold text-white mb-0.5">Advertiser Information:</div>
                <div className="text-[#aaaaaa] font-mono text-[11px]">{ad.advertiserName}</div>
                <div className="text-[#717171] text-[10px]">{ad.displayUrl} · Verified Partner</div>
              </div>

              <div>
                <div className="font-semibold text-white mb-0.5">Integration Creative Unit:</div>
                <div className="p-2 bg-[#101010] rounded border border-[#252525] font-mono text-[10px] text-[#3ea6ff] select-all">
                  Unit ID: {ad.adUnitId}
                </div>
              </div>

              <div>
                <div className="font-semibold text-white mb-0.5">Why am I seeing this?</div>
                <p className="text-[11px] text-[#999999] leading-relaxed">
                  Ads support content creators on RiseUp. Technical and developer-focused brands are displayed based on current programming and architecture topics.
                </p>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-[11px] text-amber-300">
                Watching this ad to the end automatically credits <strong className="text-white">+2 RUP tokens</strong> to your append-only ledger.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-full transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
