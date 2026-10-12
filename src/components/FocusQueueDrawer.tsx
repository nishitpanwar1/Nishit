import React from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';

export const FocusQueueDrawer: React.FC = () => {
  const {
    focusQueue,
    removeFromFocusQueue,
    clearFocusQueue,
    isQueueOpen,
    setIsQueueOpen,
    setSelectedVideo,
    playNextInQueue,
  } = useApp();

  if (focusQueue.length === 0) return null;

  const totalDurationSeconds = focusQueue.reduce((acc, curr) => acc + (curr.durationSeconds || curr.duration || 60), 0);
  const totalMinutes = Math.round(totalDurationSeconds / 60);

  const handlePlayItem = (video: VideoItem) => {
    setSelectedVideo(video);
    removeFromFocusQueue(video.id);
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 w-80 sm:w-96 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 font-sans select-none text-white ${
        isQueueOpen ? 'h-[440px]' : 'h-14'
      }`}
    >
      {/* Queue Header Bar */}
      <div
        onClick={() => setIsQueueOpen(!isQueueOpen)}
        className="h-14 px-4 bg-black text-white flex items-center justify-between cursor-pointer select-none border-b border-neutral-800"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-[20px] text-white">
            queue_music
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight font-sans">Focus Queue</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-neutral-900 text-neutral-300 rounded border border-neutral-800">
                {focusQueue.length}
              </span>
            </div>
            {!isQueueOpen && (
              <span className="text-[11px] font-mono text-neutral-400 truncate">
                Next: {focusQueue[0]?.title}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isQueueOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFocusQueue();
              }}
              className="text-xs font-mono text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-neutral-900 transition-colors"
              title="Clear all queued drops"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
            title={isQueueOpen ? 'Collapse' : 'Expand'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isQueueOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
            </span>
          </button>
        </div>
      </div>

      {/* Queue Body List */}
      {isQueueOpen && (
        <div className="flex flex-col h-[384px] bg-neutral-950 text-white">
          {/* Quick Actions Bar */}
          <div className="px-3.5 py-2.5 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">
              ~{totalMinutes} mins total run-time
            </span>
            <button
              type="button"
              onClick={playNextInQueue}
              className="px-3 py-1 bg-white hover:bg-neutral-200 text-black font-extrabold rounded-lg transition-colors flex items-center gap-1 shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">play_arrow</span>
              <span>Play Next</span>
            </button>
          </div>

          {/* Scrollable Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-850 p-1.5 no-scrollbar">
            {focusQueue.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="group p-2 rounded-xl hover:bg-neutral-900/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                onClick={() => handlePlayItem(item)}
              >
                {/* Index indicator */}
                <span className="text-xs font-mono font-bold text-neutral-500 w-4 text-center">
                  {index + 1}
                </span>

                {/* Thumbnail */}
                <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                  <img
                    src={
                      item.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/90 text-white text-[9px] font-bold rounded font-mono border border-neutral-800">
                    {item.durationFormatted || '0:05'}
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-bold text-white truncate group-hover:underline leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-400 truncate">
                    {item.creatorName || item.creatorUsername || 'Creator'}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromFocusQueue(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
                  title="Remove from queue"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
