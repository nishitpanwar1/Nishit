import React from 'react';
import { useApp, isShortVideo } from '../context/AppContext';
import { formatTimestamp } from '../utils/videoEnhancements';
import { Clock, Heart, Bookmark, Scissors, Trash2, Play, Share2 } from 'lucide-react';

interface LibraryViewProps {
  type: 'history' | 'liked' | 'saved' | 'clips' | 'watchlater';
}

export const LibraryView: React.FC<LibraryViewProps> = ({ type }) => {
  const {
    videos,
    likedVideoIds,
    savedVideoIds,
    watchLaterIds,
    clips,
    deleteClip,
    setSelectedVideo,
    openShort,
  } = useApp();

  let title = 'Watch History';
  let desc = 'Your record of watched protocol and masterclass drops.';
  let icon = <Clock className="w-5 h-5 text-[#ff0000]" />;
  let displayedVideos: typeof videos = [];

  if (type === 'liked') {
    title = 'Liked Videos';
    desc = 'Videos and protocols you have liked.';
    icon = <Heart className="w-5 h-5 text-[#ff0000] fill-current" />;
    displayedVideos = videos.filter((v) => likedVideoIds.includes(v.id));
  } else if (type === 'saved' || type === 'watchlater') {
    title = 'Watch Later';
    desc = 'Saved videos queued for your upcoming study and focus sprints.';
    icon = <Bookmark className="w-5 h-5 text-[#ff0000] fill-current" />;
    displayedVideos = videos.filter((v) => watchLaterIds.includes(v.id) || savedVideoIds.includes(v.id));
  } else if (type === 'clips') {
    title = 'Your Video Clips';
    desc = 'Snippets and timestamps you captured from tutorials and protocols.';
    icon = <Scissors className="w-5 h-5 text-[#ff0000]" />;
  } else {
    // type === 'history'
    displayedVideos = videos.filter((v) => !isShortVideo(v)).slice(0, 8);
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:05';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full min-h-screen bg-white text-[#0f0f0f] py-6 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#0f0f0f]">{title}</h1>
              <p className="text-xs text-[#606060] mt-0.5">{desc}</p>
            </div>
          </div>
        </div>

        {type === 'clips' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {clips.length === 0 ? (
              <div className="col-span-full text-center py-20 text-[#606060] text-xs space-y-2">
                <Scissors className="w-8 h-8 text-[#cccccc] mx-auto mb-2" />
                <div className="font-bold text-[#0f0f0f]">No clips saved yet</div>
                <p className="text-[11px] text-[#606060] max-w-sm mx-auto">
                  Open any video and click "Clip" to capture a 15-60 second high-signal moment.
                </p>
              </div>
            ) : (
              clips.map((clip) => {
                const originVideo = videos.find((v) => v.id === clip.videoId);
                return (
                  <div
                    key={clip.id}
                    className="p-3 bg-white border border-[#e5e5e5] hover:border-[#cccccc] rounded-2xl transition-all shadow-xs space-y-2.5 flex flex-col justify-between group"
                  >
                    <div
                      onClick={() => {
                        if (originVideo) {
                          setSelectedVideo(originVideo);
                        }
                      }}
                      className="relative aspect-video rounded-xl overflow-hidden bg-black cursor-pointer"
                    >
                      <img
                        src={clip.thumbnailUrl || originVideo?.thumbnailUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'}
                        alt={clip.clipTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/85 text-[10px] font-mono px-2 py-0.5 rounded text-white border border-white/10 flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-[#ff0000]" />
                        <span>
                          {formatTimestamp(clip.startTime)} – {formatTimestamp(clip.endTime)}
                        </span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#0f0f0f] line-clamp-1">{clip.clipTitle}</h3>
                      <div className="flex items-center justify-between text-[11px] text-[#606060] font-mono">
                        <span className="truncate max-w-[150px]">{clip.videoTitle}</span>
                        <span>{clip.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f2f2f2]">
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/?v=${clip.videoId}&clip=${clip.id}`;
                          navigator.clipboard?.writeText(url);
                        }}
                        className="text-[11px] font-semibold text-[#606060] hover:text-[#0f0f0f] flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Clip</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteClip(clip.id)}
                        className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedVideos.length === 0 ? (
              <div className="col-span-full text-center py-20 text-[#606060] text-xs space-y-2">
                <Clock className="w-8 h-8 text-[#cccccc] mx-auto mb-2" />
                <div className="font-bold text-[#0f0f0f]">No videos found in this collection</div>
                <p className="text-[11px] text-[#606060] max-w-sm mx-auto">
                  Browse the home feed or search to discover and save videos to this list.
                </p>
              </div>
            ) : (
              displayedVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => {
                    if (isShortVideo(video)) {
                      openShort(video.id);
                    } else {
                      setSelectedVideo(video);
                    }
                  }}
                  className="p-2.5 bg-white border border-[#e5e5e5] hover:border-[#cccccc] rounded-2xl transition-all shadow-xs space-y-2 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                    <img
                      src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/80 text-[10px] font-mono px-1.5 py-0.5 rounded text-white">
                      {formatDuration(video.durationSeconds || video.duration)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-[#0f0f0f] line-clamp-2 leading-snug group-hover:text-[#ff0000] transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-[#606060]">
                      <span className="truncate max-w-[140px]">{video.creatorName}</span>
                      <span>{video.createdAt || 'Recent'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
