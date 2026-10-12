import React from 'react';
import { useApp } from '../context/AppContext';

export const DisciplineView: React.FC = () => {
  const { discipline, user, distractionBlockerEnabled, setDistractionBlockerEnabled } = useApp();

  const learningHours = (discipline.learningMinutes / 60).toFixed(1);
  const passiveHours = (discipline.passiveMinutes / 60).toFixed(1);
  const totalHours = (discipline.totalMinutesWatched / 60).toFixed(1);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-8 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                Attention Metrics & Audit
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono mt-1">
              Discipline & Focus Analytics
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans max-w-xl">
              RiseUp tracks intentional learning and building vs passive scroll consumption.
            </p>
          </div>

          {/* Distraction Blocker Toggle */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs self-start sm:self-center shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-white">shield</span>
            <span className="font-mono uppercase text-white font-bold">Focus Shield</span>
            <button
              type="button"
              onClick={() => setDistractionBlockerEnabled(!distractionBlockerEnabled)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                distractionBlockerEnabled ? 'bg-white' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full transition-transform ${
                  distractionBlockerEnabled ? 'translate-x-4 bg-black' : 'translate-x-0 bg-neutral-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 4 Quantitative Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Intentional Learning Ratio */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 shadow-lg">
            <div className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Learning Ratio
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white tabular-nums">
                {discipline.learningRatio}%
              </span>
              <span className="text-xs font-mono text-neutral-400 uppercase font-bold">Intentional</span>
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, discipline.learningRatio)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Deep Work Time */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 shadow-lg">
            <div className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Deep Work & Build
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white tabular-nums">
                {learningHours}h
              </span>
              <span className="text-xs font-mono text-neutral-400 uppercase font-bold">Focused</span>
            </div>
            <div className="text-xs text-neutral-500 font-sans">
              Tutorials, engineering streams, and study sprints.
            </div>
          </div>

          {/* Card 3: Passive Consumed */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 shadow-lg">
            <div className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Passive Consumption
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-neutral-400 tabular-nums">
                {passiveHours}h
              </span>
              <span className="text-xs font-mono text-neutral-500 uppercase font-bold">Casual</span>
            </div>
            <div className="text-xs text-neutral-500 font-sans">
              Reels and recreational playback logged.
            </div>
          </div>

          {/* Card 4: Daily Goal Status */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 shadow-lg">
            <div className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Daily Target Progress
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white tabular-nums">
                {Math.round((Number(learningHours) / (user.targetDailyFocusHours || 4)) * 100)}%
              </span>
              <span className="text-xs font-mono text-neutral-400 uppercase font-bold">
                Goal: {user.targetDailyFocusHours || 4}h
              </span>
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (Number(learningHours) / (user.targetDailyFocusHours || 4)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Weekly Breakdown Graph */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-white text-[20px]">bar_chart</span>
              <h3 className="font-mono text-sm uppercase text-white font-bold m-0">Weekly Focus Cadence</h3>
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Total Watched: {totalHours}h
            </span>
          </div>

          <div className="grid grid-cols-7 gap-3 pt-3">
            {discipline.weeklyBreakdown.map((item) => (
              <div key={item.day} className="flex flex-col items-center gap-2">
                <div className="w-full bg-black h-32 rounded-xl border border-neutral-800 relative flex flex-col justify-end p-1 overflow-hidden">
                  <div
                    className="w-full bg-white rounded-lg transition-all"
                    style={{ height: `${Math.min(100, Math.max(10, item.learningMin * 2))}%` }}
                    title={`${item.learningMin} min focused`}
                  />
                </div>
                <span className="text-xs font-mono uppercase font-bold text-neutral-400">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
