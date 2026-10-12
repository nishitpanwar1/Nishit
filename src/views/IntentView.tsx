import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LaneType } from '../types';
import {
  Sparkles,
  ArrowRight,
  Target,
  Brain,
  Cpu,
  TrendingUp,
  Dumbbell,
  Play,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const IntentView: React.FC = () => {
  const {
    selectedLane,
    setSelectedLane,
    intentText,
    isCurating,
    curatedVideos,
    curateIntent,
    setSelectedVideo,
    setCurrentView,
  } = useApp();

  const [inputVal, setInputVal] = useState<string>(intentText || '');

  const lanes: { id: LaneType; label: string; icon: any; example: string }[] = [
    {
      id: 'Engineering',
      label: 'Engineering',
      icon: Cpu,
      example: 'Mastering distributed event queues and zero-copy Rust networking',
    },
    {
      id: 'Systems',
      label: 'Systems',
      icon: Target,
      example: 'PostgreSQL partitioning, replica failovers, and connection pool tuning',
    },
    {
      id: 'Focus',
      label: 'Focus & Deep Work',
      icon: Brain,
      example: 'Structuring uninterrupted 4-hour morning focus blocks with zero tab switching',
    },
    {
      id: 'Finance',
      label: 'Finance',
      icon: TrendingUp,
      example: 'Cash-flow modeling, LTV/CAC ratios, and bootstrapping without VC dilution',
    },
    {
      id: 'Fitness',
      label: 'Fitness',
      icon: Dumbbell,
      example: 'Zone 2 cardio and physical endurance protocols for sustained engineering focus',
    },
  ];

  const currentLaneObj = lanes.find((l) => l.id === selectedLane) || lanes[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    curateIntent(selectedLane, inputVal.trim());
  };

  const handleApplyPreset = (example: string) => {
    setInputVal(example);
    curateIntent(selectedLane, example);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-7 py-2">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#272727] rounded-full text-xs font-semibold text-white">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intent Gateway Protocol</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-display tracking-tight">
          Define What You Are Building Today
        </h1>
        <p className="text-xs sm:text-sm text-[#aaaaaa] leading-relaxed">
          State your precise technical or focus objective. RiseUp synthesizes a dedicated 5-video curriculum without algorithmic distractions.
        </p>
      </div>

      {/* 1. Lane Selection */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">
          Step 1: Select Your Lane
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {lanes.map((l) => {
            const Icon = l.icon;
            const active = selectedLane === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setSelectedLane(l.id);
                  if (inputVal === currentLaneObj.example) {
                    setInputVal(l.example);
                  }
                }}
                className={`p-3.5 rounded-xl text-left flex flex-col justify-between gap-3 transition-colors ${
                  active
                    ? 'bg-[#272727] text-white border border-white'
                    : 'bg-[#181818] text-[#aaaaaa] hover:text-white hover:bg-[#222222] border border-[#272727]'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#aaaaaa]'}`} />
                <span className="text-xs font-semibold truncate">{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. One-Sentence Intention Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">
          <span>Step 2: One-Sentence Intention</span>
          <span className="font-mono text-[11px] text-[#aaaaaa] tabular-nums">
            {inputVal.length}/180 chars
          </span>
        </div>

        <div className="relative">
          <textarea
            value={inputVal}
            maxLength={180}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`e.g. ${currentLaneObj.example}`}
            rows={2}
            className="w-full bg-[#181818] border border-[#2e2e2e] rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-[#717171] focus:outline-none focus:border-white leading-relaxed"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleApplyPreset(currentLaneObj.example)}
            className="text-[11px] text-[#aaaaaa] hover:text-white text-left transition-colors truncate max-w-lg"
          >
            Suggestion: <span className="underline italic">"{currentLaneObj.example}"</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('feed')}
              className="text-xs text-[#aaaaaa] hover:text-white transition-colors"
            >
              Skip to Open Feed
            </button>
            <button
              type="submit"
              disabled={isCurating || !inputVal.trim()}
              className="px-5 py-2.5 bg-white hover:bg-neutral-200 disabled:opacity-40 text-black font-semibold text-xs rounded-full transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              {isCurating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Curating Syllabus...</span>
                </>
              ) : (
                <>
                  <span>Curate Intent Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 3. Curated Results */}
      {intentText && !isCurating && curatedVideos.length === 0 && (
        <div className="p-8 text-center border border-dashed border-[#272727] rounded-2xl bg-[#141414] max-w-lg mx-auto space-y-3">
          <p className="text-xs text-[#aaaaaa] leading-relaxed">
            No videos in the library match this intention yet. Upload your first technical document in Studio to populate the curriculum.
          </p>
          <button
            onClick={() => setCurrentView('studio')}
            className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-full transition-colors shadow-sm"
          >
            Upload to Studio
          </button>
        </div>
      )}

      {curatedVideos && curatedVideos.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[#272727]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-display">
                Curated Set for: "{intentText || inputVal}"
              </h2>
            </div>
            <span className="text-xs font-mono text-[#aaaaaa] tabular-nums">
              {curatedVideos.length} Verified Pieces
            </span>
          </div>

          <div className="space-y-2.5">
            {curatedVideos.map((item, idx) => (
              <div
                key={item.video.id}
                onClick={() => setSelectedVideo(item.video)}
                className="group p-3.5 sm:p-4 bg-[#181818] hover:bg-[#202020] border border-[#272727] rounded-xl cursor-pointer transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative w-28 sm:w-36 aspect-video bg-[#272727] rounded-lg overflow-hidden shrink-0">
                    <img
                      src={item.video.thumbnailUrl}
                      alt={item.video.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-[#aaaaaa]">
                      <span className="text-white font-semibold">#{idx + 1} Priority</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Focus Score: {item.focusScore}%
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white font-display line-clamp-1">
                      {item.video.title}
                    </h3>
                    <p className="text-xs text-[#aaaaaa] line-clamp-1 italic">
                      "{item.reason}"
                    </p>
                  </div>
                </div>

                <button className="px-3.5 py-1.5 bg-[#272727] group-hover:bg-white group-hover:text-black text-white text-xs font-semibold rounded-full transition-colors whitespace-nowrap self-end md:self-center">
                  Watch Focus Block
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
