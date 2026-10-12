import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const GoLiveView: React.FC = () => {
  const { user } = useApp();

  const [captureSource, setCaptureSource] = useState<'camera' | 'screen' | 'none'>('camera');
  const [streamTitle, setStreamTitle] = useState<string>('05:00 AM Silent Calisthenics & Deep Work Session');
  const [pillar, setPillar] = useState<string>('Discipline');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pillars = ['Discipline', 'Fitness', 'Study', 'Creative', 'Mindset', 'Morning'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleLive = () => {
    const next = !isLive;
    setIsLive(next);
    showToast(next ? 'Broadcast is now LIVE!' : 'Stream transmission ended.');
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-white animate-ping' : 'bg-neutral-600'}`} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                Live Broadcast Studio
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono mt-1">
              Go Live
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans max-w-xl">
              Broadcast direct in-browser live streams with camera or screen capture.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300">
              WebRTC Direct
            </span>
            <span
              className={`px-3 py-1.5 rounded-xl border font-bold ${
                isLive
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800'
              }`}
            >
              {isLive ? '● ON AIR' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* 2-Column Live Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Stream Settings (7 cols) */}
          <div className="lg:col-span-7 p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-5 shadow-lg">
            <div className="pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase text-white">
                Stream Setup & Ingest
              </h3>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                Capture Source
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCaptureSource('camera')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    captureSource === 'camera'
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">videocam</span>
                  <span className="font-mono font-bold text-xs uppercase">Webcam</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCaptureSource('screen')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    captureSource === 'screen'
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">screen_share</span>
                  <span className="font-mono font-bold text-xs uppercase">Screen Share</span>
                </button>
              </div>
            </div>

            {/* Stream Title */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                Broadcast Title
              </label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2.5 rounded-xl text-xs text-white outline-none"
              />
            </div>

            {/* Pillar */}
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                Focus Category
              </label>
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value)}
                className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2.5 rounded-xl text-xs text-white outline-none"
              >
                {pillars.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Live CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleToggleLive}
                className={`w-full py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-md ${
                  isLive
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    : 'bg-white hover:bg-neutral-200 text-black'
                }`}
              >
                {isLive ? 'End Stream Transmission' : 'Go Live Now'}
              </button>
            </div>
          </div>

          {/* Live Monitor / Preview Stage (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 shadow-lg">
            <div className="pb-3 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm uppercase text-white">
                Stage Monitor
              </h3>
              <span className="text-xs font-mono text-neutral-400">1080p 60fps</span>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
              {isLive ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white mb-2">
                    <span className="material-symbols-outlined text-[24px]">videocam</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white uppercase">
                    Transmitting Live Video
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-1">
                    Latency: 120ms • Audio: Normal
                  </span>
                </div>
              ) : (
                <div className="text-center p-4 space-y-1">
                  <span className="material-symbols-outlined text-[32px] text-neutral-600">
                    videocam_off
                  </span>
                  <div className="text-xs font-mono text-neutral-400">Preview Standby</div>
                  <div className="text-[10px] text-neutral-600 font-mono">
                    Click "Go Live Now" to start stream
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
