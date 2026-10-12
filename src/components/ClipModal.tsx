import React, { useState, useRef, useEffect } from 'react';
import { VideoItem } from '../types';
import { useApp } from '../context/AppContext';
import { formatTimestamp } from '../utils/videoEnhancements';
import { X, Scissors, Play, Pause, Check, Share2, Sparkles } from 'lucide-react';

interface ClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoItem;
  initialTime?: number;
}

export const ClipModal: React.FC<ClipModalProps> = ({
  isOpen,
  onClose,
  video,
  initialTime = 0,
}) => {
  const { addClip } = useApp();
  const maxDuration = video.durationSeconds || 180;

  const [clipTitle, setClipTitle] = useState('');
  const [startTime, setStartTime] = useState(Math.max(0, Math.floor(initialTime)));
  const [clipLength, setClipLength] = useState(30); // 10s to 60s
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const endTime = Math.min(maxDuration, startTime + clipLength);

  // Keep preview looping inside the clip boundary [startTime, endTime]
  useEffect(() => {
    const vid = previewVideoRef.current;
    if (!vid) return;

    vid.currentTime = startTime;
    vid.play().catch(() => {});
    setIsPlaying(true);

    const checkLoop = () => {
      if (vid.currentTime >= endTime || vid.currentTime < startTime) {
        vid.currentTime = startTime;
        vid.play().catch(() => {});
      }
    };

    vid.addEventListener('timeupdate', checkLoop);
    return () => vid.removeEventListener('timeupdate', checkLoop);
  }, [startTime, endTime, isOpen]);

  if (!isOpen) return null;

  const togglePreviewPlay = () => {
    const vid = previewVideoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleSaveClip = () => {
    const defaultTitle = clipTitle.trim() || `Key snippet from ${video.title.slice(0, 30)}...`;
    addClip({
      videoId: video.id,
      videoTitle: video.title,
      creatorName: video.creatorName,
      creatorAvatar: video.creatorAvatar,
      clipTitle: defaultTitle,
      startTime,
      endTime,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
    });

    // Copy clip link to clipboard
    const clipUrl = `${window.location.origin}/?clip=${video.id}&start=${startTime}&end=${endTime}`;
    navigator.clipboard?.writeText(clipUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-6 animate-in fade-in zoom-in-95 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm uppercase font-mono">
            <Scissors className="w-4 h-4 text-white" />
            <span>Create Clip</span>
            <span className="text-[11px] font-mono text-neutral-400">
              ({formatTimestamp(startTime)} – {formatTimestamp(endTime)})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Preview Loop */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800">
          <video
            ref={previewVideoRef}
            src={video.videoUrl || ''}
            poster={video.thumbnailUrl}
            playsInline
            muted={false}
            className="w-full h-full object-cover cursor-pointer"
            onClick={togglePreviewPlay}
          />
          <button
            onClick={togglePreviewPlay}
            className="absolute bottom-3 left-3 p-2 bg-black/80 hover:bg-black text-white rounded-lg transition-colors border border-neutral-700"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/90 rounded text-[10px] font-mono text-neutral-300 border border-neutral-700">
            Looping ({endTime - startTime}s)
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-300 font-mono uppercase">Clip Title</label>
          <input
            type="text"
            value={clipTitle}
            onChange={(e) => setClipTitle(e.target.value)}
            placeholder="Add a title for your clip..."
            maxLength={100}
            className="w-full bg-black border border-neutral-700 focus:border-white rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Sliders for Start Time and Duration */}
        <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-400 font-mono text-[11px]">
              <span>Start Time</span>
              <span className="text-white font-bold">{formatTimestamp(startTime)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, maxDuration - 10)}
              step={1}
              value={startTime}
              onChange={(e) => setStartTime(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-neutral-400 font-mono text-[11px]">
              <span>Clip Length</span>
              <span className="text-white font-bold">{clipLength} seconds</span>
            </div>
            <input
              type="range"
              min={10}
              max={Math.min(60, maxDuration - startTime)}
              step={1}
              value={clipLength}
              onChange={(e) => setClipLength(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-neutral-500 font-mono">Direct Share Link</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClip}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-extrabold rounded-lg transition-colors font-mono uppercase tracking-wider"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Share Clip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
