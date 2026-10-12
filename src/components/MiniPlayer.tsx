import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, X, Maximize2, RotateCcw, RotateCw } from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const {
    miniPlayerVideo,
    setMiniPlayerVideo,
    miniPlayerTime,
    setMiniPlayerTime,
    isMiniPlayerPlaying,
    setIsMiniPlayerPlaying,
    expandMiniPlayer,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && miniPlayerVideo) {
      videoRef.current.currentTime = miniPlayerTime;
      if (isMiniPlayerPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [miniPlayerVideo]);

  if (!miniPlayerVideo) return null;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isMiniPlayerPlaying) {
      videoRef.current.pause();
      setIsMiniPlayerPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsMiniPlayerPlaying(true);
    }
  };

  const handleSeek = (deltaSec: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const next = Math.max(0, Math.min(videoRef.current.duration || 100, videoRef.current.currentTime + deltaSec));
    videoRef.current.currentTime = next;
    setMiniPlayerTime(next);
  };

  const duration = miniPlayerVideo.durationSeconds || 180;
  const progressPercent = Math.min(100, (miniPlayerTime / duration) * 100);

  return (
    <div
      onClick={expandMiniPlayer}
      className="fixed bottom-16 md:bottom-4 right-4 z-40 w-72 sm:w-80 md:w-96 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden cursor-pointer group hover:border-neutral-600 transition-colors animate-in slide-in-from-bottom-5 duration-150"
    >
      {/* Video Preview Frame */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={miniPlayerVideo.videoUrl || ''}
          poster={miniPlayerVideo.thumbnailUrl}
          playsInline
          muted={false}
          className="w-full h-full object-cover pointer-events-none"
          onTimeUpdate={() => {
            if (videoRef.current) {
              setMiniPlayerTime(videoRef.current.currentTime);
            }
          }}
          onEnded={() => setIsMiniPlayerPlaying(false)}
        />

        {/* Hover Controls Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => handleSeek(-10, e)}
            className="p-1.5 text-white hover:text-neutral-300 transition-colors bg-black/70 rounded-lg"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 text-white hover:scale-105 transition-transform bg-white/20 backdrop-blur-md rounded-lg"
            title={isMiniPlayerPlaying ? 'Pause' : 'Play'}
          >
            {isMiniPlayerPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => handleSeek(10, e)}
            className="p-1.5 text-white hover:text-neutral-300 transition-colors bg-black/70 rounded-lg"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Top Floating Buttons (Expand & Close) */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              expandMiniPlayer();
            }}
            className="p-1 bg-black/80 hover:bg-black text-white rounded transition-colors"
            title="Expand to Full Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMiniPlayerVideo(null);
            }}
            className="p-1 bg-black/80 hover:bg-black text-white rounded transition-colors"
            title="Close Miniplayer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrubber Progress Line */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-neutral-800">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Info Footer Bar */}
      <div className="p-2.5 flex items-center justify-between gap-2 bg-black text-white border-t border-neutral-800">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white truncate m-0">
            {miniPlayerVideo.title}
          </h4>
          <p className="text-[11px] text-neutral-400 truncate mt-0.5 m-0 font-mono">
            {miniPlayerVideo.creatorName}
          </p>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          className="p-1.5 text-white hover:text-neutral-300 shrink-0 transition-colors"
        >
          {isMiniPlayerPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};
