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
      className={`fixed bottom-4 right-4 z-40 w-80 sm:w-96 bg-white border border-[#e5e5e5] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 font-sans ${
        isQueueOpen ? 'h-[440px]' : 'h-14'
      }`}
    >
      {/* Queue Header Bar */}
      <div
        onClick={() => setIsQueueOpen(!isQueueOpen)}
        className="h-14 px-4 bg-[#0f0f0f] text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-[20px] text-[#ff0000]">
            queue_music
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight">Focus Queue</span>
              <span className="text-[11px] font-bold px-1.5 py-0.2 bg-[#272727] text-[#aaaaaa] rounded-md">
                {focusQueue.length}
              </span>
            </div>
            {!isQueueOpen && (
              <span className="text-[11px] text-[#aaaaaa] truncate">
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
              className="text-xs text-[#aaaaaa] hover:text-white px-2 py-1 rounded hover:bg-[#272727] transition-colors"
              title="Clear all queued videos"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#272727] text-white transition-colors"
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
        <div className="flex flex-col h-[384px] bg-white text-[#0f0f0f]">
          {/* Quick Actions Bar */}
          <div className="px-3.5 py-2.5 bg-[#f9f9f9] border-b border-[#eeeeee] flex items-center justify-between text-xs">
            <span className="text-[#606060] font-medium">
              ~{totalMinutes} mins total run-time
            </span>
            <button
              type="button"
              onClick={playNextInQueue}
              className="px-3 py-1 bg-[#ff0000] hover:bg-[#cc0000] text-white font-bold rounded-full transition-colors flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[14px]">play_arrow</span>
              Play Next
            </button>
          </div>

          {/* Scrollable Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f2f2f2] p-1.5">
            {focusQueue.map((item, index) => (
              <div
                key={item.id}
                className="group p-2 rounded-xl hover:bg-[#f2f2f2] flex items-center gap-2.5 transition-colors cursor-pointer"
                onClick={() => handlePlayItem(item)}
              >
                {/* Index / Drag handle indicator */}
                <span className="text-xs font-semibold text-[#888888] w-4 text-center">
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
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-white text-[9px] font-bold rounded font-mono">
                    {item.durationFormatted || '0:05'}
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#0f0f0f] truncate group-hover:text-[#ff0000] transition-colors leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#606060] truncate mt-0.5">
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
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-[#e5e5e5] text-[#606060] hover:text-[#0f0f0f] transition-all"
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
