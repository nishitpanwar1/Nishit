import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { LiveStreamItem } from '../types';

export const GoLiveView: React.FC = () => {
  const {
    user,
    liveStreams,
    activeLiveStream,
    startLiveStream,
    endLiveStream,
    liveChatMessages,
    sendLiveChatMessage,
    setCurrentView,
  } = useApp();

  // Stream configuration
  const [captureSource, setCaptureSource] = useState<'camera' | 'screen'>('camera');
  const [streamTitle, setStreamTitle] = useState<string>('Live Deep Work & Engineering Session');
  const [category, setCategory] = useState<string>('Engineering');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);

  // Media & Device states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCameraMuted, setIsCameraMuted] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active watching stream (if viewing another user's stream)
  const [watchingStream, setWatchingStream] = useState<LiveStreamItem | null>(null);

  // Stream telemetry
  const [streamDuration, setStreamDuration] = useState<number>(0);
  const [viewerCount, setViewerCount] = useState<number>(1);
  const [resolution, setResolution] = useState<string>('1080p 60fps');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<any>(null);

  const categories = ['Engineering', 'Systems', 'Discipline', 'Deep Work', 'Mindset', 'Fitness', 'Architecture'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Start Device Camera or Screen Capture directly
  const startDeviceMedia = useCallback(async (source: 'camera' | 'screen') => {
    try {
      setMediaError(null);
      // Stop any existing tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream;
      if (source === 'screen') {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error('Screen sharing not supported on this browser or platform');
        }
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' as any },
          audio: true,
        });
      } else {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Webcam capture not supported on this browser');
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
          audio: true,
        });
      }

      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      setIsCameraMuted(false);
      setIsMicMuted(false);
      setResolution(source === 'screen' ? '2K 60fps' : '1080p 60fps');
    } catch (err: any) {
      console.warn('Device media acquisition notice:', err?.message || err);
      setMediaError(err?.message || 'Permission denied or media device unavailable.');
      setIsCameraActive(false);
    }
  }, []);

  // Stop Device Media
  const stopDeviceMedia = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Initialize camera preview on mount
  useEffect(() => {
    startDeviceMedia('camera');
    return () => {
      stopDeviceMedia();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startDeviceMedia, stopDeviceMedia]);

  // Handle switching source
  const handleChangeSource = async (newSource: 'camera' | 'screen') => {
    setCaptureSource(newSource);
    await startDeviceMedia(newSource);
  };

  // Toggle Microphone Mute
  const handleToggleMic = () => {
    if (!mediaStreamRef.current) return;
    const audioTracks = mediaStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const next = !audioTracks[0].enabled;
      audioTracks[0].enabled = next;
      setIsMicMuted(!next);
      showToast(!next ? 'Microphone muted' : 'Microphone unmuted');
    }
  };

  // Toggle Camera Video Mute
  const handleToggleCamera = () => {
    if (!mediaStreamRef.current) return;
    const videoTracks = mediaStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const next = !videoTracks[0].enabled;
      videoTracks[0].enabled = next;
      setIsCameraMuted(!next);
      showToast(!next ? 'Video feed disabled' : 'Video feed enabled');
    }
  };

  // Go Live Transmission
  const handleStartStream = () => {
    if (!streamTitle.trim()) {
      showToast('Please provide a broadcast title');
      return;
    }

    // Capture thumbnail from active canvas/video element
    let thumbUrl = '';
    if (localVideoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(localVideoRef.current, 0, 0, canvas.width, canvas.height);
          thumbUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch {}
    }

    const created = startLiveStream({
      title: streamTitle.trim(),
      category,
      source: captureSource,
      thumbnailUrl: thumbUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    });

    setCurrentStreamId(created.id);
    setIsLive(true);
    setStreamDuration(0);
    setViewerCount(Math.floor(Math.random() * 10) + 1);

    timerRef.current = setInterval(() => {
      setStreamDuration((prev) => prev + 1);
      // Simulate live organic viewer fluctuation
      if (Math.random() > 0.7) {
        setViewerCount((v) => Math.max(1, v + (Math.random() > 0.4 ? 1 : -1)));
      }
    }, 1000);

    showToast('🔴 Transmission is now LIVE across RiseUp!');
  };

  // End Live Transmission
  const handleEndStream = () => {
    if (currentStreamId) {
      endLiveStream(currentStreamId);
    }
    setIsLive(false);
    setCurrentStreamId(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    showToast('Stream broadcast ended. Session archived to your channel.');
  };

  // Format Stream Duration
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Chat Submission
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const streamTarget = watchingStream ? watchingStream.id : currentStreamId || 'stream_demo_1';
    sendLiveChatMessage(streamTarget, chatInput.trim());
    setChatInput('');

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // Auto-scroll chat on updates
  const activeStreamIdForChat = watchingStream ? watchingStream.id : currentStreamId || 'stream_demo_1';
  const currentMessages = liveChatMessages[activeStreamIdForChat] || [];

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [currentMessages.length]);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-6 px-4 sm:px-6 lg:px-8 select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-white animate-ping' : 'bg-neutral-600'}`} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                Direct In-Browser Broadcast Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase font-mono mt-1 text-white">
              Live Stream Studio
            </h1>
            <p className="text-xs text-neutral-400 mt-1 font-mono max-w-xl">
              Broadcast directly from your device camera or screen share. Zero OBS Studio, zero software install required.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">sensors</span>
              WebRTC Direct
            </span>
            <span
              className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 ${
                isLive
                  ? 'bg-white text-black border-white animate-pulse'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-black' : 'bg-neutral-500'}`} />
              {isLive ? 'LIVE ON AIR' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* 2-Column Live Studio Layout (Stage Monitor + Control / Real-time Live Chat) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Stage & Video Canvas (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Real-time Video Viewport */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl flex items-center justify-center group">
              {/* Local Real Camera/Screen Video Element */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isCameraActive && !isCameraMuted ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Offline or Video Feed Muted Placeholder */}
              {(!isCameraActive || isCameraMuted) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                    <span className="material-symbols-outlined text-[32px]">
                      {isCameraMuted ? 'videocam_off' : 'photo_camera'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white uppercase">
                      {isCameraMuted ? 'Camera Feed Muted' : 'Direct Device Camera Standby'}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-1 max-w-sm">
                      {mediaError
                        ? mediaError
                        : 'Click "Start Camera" below to grant device camera or screen access.'}
                    </p>
                  </div>
                  {!isCameraActive && (
                    <button
                      type="button"
                      onClick={() => startDeviceMedia(captureSource)}
                      className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">videocam</span>
                      Enable Device Media
                    </button>
                  )}
                </div>
              )}

              {/* Live Overlay HUD when broadcasting */}
              {isLive && (
                <>
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-white text-black font-mono font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                      LIVE
                    </span>
                    <span className="px-2.5 py-1 bg-black/85 backdrop-blur-md text-white font-mono text-xs rounded-lg border border-neutral-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      {viewerCount} viewers
                    </span>
                    <span className="px-2.5 py-1 bg-black/85 backdrop-blur-md text-white font-mono text-xs rounded-lg border border-neutral-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      {formatTime(streamDuration)}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2 font-mono text-xs">
                    <span className="px-2.5 py-1 bg-black/85 backdrop-blur-md text-neutral-300 rounded-lg border border-neutral-700">
                      {resolution}
                    </span>
                  </div>
                </>
              )}

              {/* Bottom In-Video Device Toolbar */}
              <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between p-2 rounded-xl bg-black/80 backdrop-blur-md border border-neutral-800">
                <div className="flex items-center gap-2">
                  {/* Mic Mute Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      isMicMuted
                        ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        : 'bg-white text-black font-bold shadow-sm'
                    }`}
                    title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isMicMuted ? 'mic_off' : 'mic'}
                    </span>
                  </button>

                  {/* Video Mute Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      isCameraMuted
                        ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        : 'bg-white text-black font-bold shadow-sm'
                    }`}
                    title={isCameraMuted ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isCameraMuted ? 'videocam_off' : 'videocam'}
                    </span>
                  </button>

                  <span className="text-[11px] font-mono text-neutral-400 ml-1 hidden sm:inline">
                    {captureSource === 'screen' ? 'Sharing Screen' : 'Webcam Active'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Source Switcher */}
                  <button
                    type="button"
                    onClick={() => handleChangeSource(captureSource === 'camera' ? 'screen' : 'camera')}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {captureSource === 'camera' ? 'screen_share' : 'videocam'}
                    </span>
                    <span>Switch to {captureSource === 'camera' ? 'Screen' : 'Webcam'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stream Settings & Metadata Controls */}
            <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[18px]">tune</span>
                  <h3 className="font-mono font-bold text-xs uppercase text-white">
                    Broadcast Parameters
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  {user.displayName || user.username}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-neutral-400 uppercase">
                    Broadcast Title
                  </label>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="Enter stream title..."
                    disabled={isLive}
                    className="w-full bg-black border border-neutral-800 focus:border-white px-3.5 py-2.5 rounded-xl text-xs text-white outline-none font-mono disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-neutral-400 uppercase">
                    Category Track
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isLive}
                    className="w-full bg-black border border-neutral-800 focus:border-white px-3.5 py-2.5 rounded-xl text-xs text-white outline-none font-mono disabled:opacity-60"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Go Live Big Action Button */}
              <div className="pt-2">
                {isLive ? (
                  <button
                    type="button"
                    onClick={handleEndStream}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                    <span>End Stream Transmission</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartStream}
                    className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
                    <span>Go Live Now (Direct Broadcast)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Currently Active Network Live Streams Section */}
            {liveStreams.length > 0 && (
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <h3 className="font-mono font-bold text-xs uppercase text-white">
                      Live Now Across RiseUp ({liveStreams.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    Real-Time WebRTC Ingest
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {liveStreams.map((stream) => (
                    <div
                      key={stream.id}
                      onClick={() => setWatchingStream(stream)}
                      className="group p-3 bg-black border border-neutral-850 hover:border-neutral-600 rounded-xl transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="relative aspect-video w-24 shrink-0 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
                          <img
                            src={stream.thumbnailUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80'}
                            alt={stream.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute top-1 left-1 px-1 py-0.2 bg-white text-black font-mono font-bold text-[8px] rounded">
                            LIVE
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:underline">
                            {stream.title}
                          </h4>
                          <p className="text-[11px] font-mono text-neutral-400 truncate mt-0.5">
                            {stream.creatorName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 mt-1">
                            <span>{stream.viewerCount} watching</span>
                            <span>•</span>
                            <span>{stream.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Real-Time Live Chat (Same as YouTube Live Chat) (4 cols) */}
          <div className="lg:col-span-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col h-[650px] shadow-2xl overflow-hidden">
            {/* Live Chat Top Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-white">chat</span>
                <h3 className="font-mono font-bold text-xs uppercase text-white">
                  Live Stream Chat
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-black border border-neutral-800">
                ● Connected
              </span>
            </div>

            {/* Chat Messages Feed Container */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs no-scrollbar"
            >
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                  <span className="material-symbols-outlined text-[32px] mb-2 text-neutral-600">
                    forum
                  </span>
                  <span className="font-bold uppercase text-[11px]">No messages yet</span>
                  <span className="text-[10px] mt-1 text-neutral-600">
                    Be the first to say something in live broadcast!
                  </span>
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      msg.isSuperChat
                        ? 'bg-neutral-900 border-white text-white'
                        : 'bg-black/60 border-neutral-850 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white uppercase">{msg.userName}</span>
                        {msg.isSuperChat && (
                          <span className="px-1.5 py-0.2 rounded bg-white text-black font-extrabold text-[9px]">
                            ⚡ {msg.tokensPledged} TOKENS
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-snug break-words">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Live Chat Input Form */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-neutral-800 bg-black shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Chat with stream community..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-xs text-white outline-none font-mono placeholder-neutral-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-9 h-9 rounded-xl bg-white disabled:bg-neutral-800 text-black disabled:text-neutral-500 flex items-center justify-center font-bold transition-all shadow-sm"
                  title="Send message"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
