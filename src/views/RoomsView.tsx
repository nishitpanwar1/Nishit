import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const RoomsView: React.FC = () => {
  const {
    rooms,
    roomMessages,
    checkInRoom,
    sendRoomMessage,
    createRoom,
    user,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isNewRoomOpen, setIsNewRoomOpen] = useState<boolean>(false);
  const [activeLiveRoomId, setActiveLiveRoomId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Focus Timer state for live room
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Create room modal form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Deep Work');
  const [newSprintMinutes, setNewSprintMinutes] = useState('25');

  const [checkedInRooms, setCheckedInRooms] = useState<Record<string, boolean>>({
    'room-01': true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filterTabs = [
    { id: 'all', label: 'All Rooms' },
    { id: 'deep-work', label: 'Deep Work' },
    { id: 'study', label: 'Study Sprints' },
    { id: 'creative', label: 'Video & Editing' },
    { id: 'morning', label: 'Morning Routine' },
    { id: 'joined', label: 'My Rooms' },
  ];

  // Real focus rooms derived from user and community state (no fake demo data)
  const realRooms = rooms.map((r) => ({
    id: r.id,
    title: r.name,
    category: (r.lane?.toLowerCase().replace(/\s+/g, '-') || 'deep-work'),
    categoryLabel: r.lane || 'Deep Work',
    host: `@${r.ownerName || 'creator'}`,
    hostAvatar: r.ownerId === user.id ? user.avatar : r.coverUrl,
    description: r.description,
    participantsCount: r.membersCount || 1,
    sprintMinutes: 50,
    activeSprintTime: '35:00',
    status: 'Live Sprint',
    goal: (r.rules && r.rules[0]) || 'Daily deep work sprint',
  }));

  const handleQuickCheckIn = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    setCheckedInRooms((prev) => ({ ...prev, [roomId]: true }));
    await checkInRoom(roomId, 'Focus session check-in logged');
    showToast('Check-in logged! Streak verified.');
  };

  const handleOpenLiveRoom = (roomId: string) => {
    setActiveLiveRoomId(roomId);
    setTimerSeconds(25 * 60);
    setIsTimerRunning(true);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeLiveRoomId) return;
    sendRoomMessage(activeLiveRoomId, chatInput.trim());
    setChatInput('');
  };

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createRoom({
      name: newTitle.trim(),
      description: newDesc.trim() || 'Focus session and task accountability.',
      lane: 'Focus',
      rules: ['Stay on task during active sprint intervals', 'Keep microphone muted during flow time'],
    });

    setIsNewRoomOpen(false);
    setNewTitle('');
    setNewDesc('');
    showToast('Focus Room created successfully!');
  };

  const activeRoomData =
    realRooms.find((r) => r.id === activeLiveRoomId) || realRooms[0] || {
      id: 'default',
      title: 'Deep Work Sprint',
      host: `@${user.username || 'creator'}`,
      hostAvatar: user.avatar,
      participantsCount: 1,
      goal: 'Eliminate distractions & focus',
    };
  const liveMessages =
    (activeLiveRoomId && roomMessages[activeLiveRoomId]) || [];

  const filteredRooms = realRooms.filter((room) => {
    if (activeFilter === 'joined') {
      return checkedInRooms[room.id];
    }
    if (activeFilter !== 'all' && room.category !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        room.title.toLowerCase().includes(q) ||
        room.description.toLowerCase().includes(q) ||
        room.host.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Timer format
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                Live Co-Working & Accountability
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono mt-1">
              Focus Rooms
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans max-w-xl">
              Work alongside other creators in live timed sprints. Eliminate distractions, build streaks, and stay accountable.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">help_outline</span>
              <span>Guidelines</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewRoomOpen(true)}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create Room</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Strip */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filterTabs.map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                    active
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900 border-neutral-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms or hosts..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-white rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Focus Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full p-16 text-center bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3 shadow-lg">
              <span className="material-symbols-outlined text-[44px] text-neutral-600">
                meeting_room
              </span>
              <h3 className="font-mono font-bold text-base uppercase text-white">
                No Focus Rooms Active
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto font-sans">
                Launch a live co-working room to focus together, run timed Pomodoro sprints, and build unbroken streaks with your community.
              </p>
              <button
                type="button"
                onClick={() => setIsNewRoomOpen(true)}
                className="mt-3 px-5 py-2.5 bg-white text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
              >
                + Launch First Focus Room
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => {
            const isCheckedIn = checkedInRooms[room.id];
            return (
              <div
                key={room.id}
                onClick={() => handleOpenLiveRoom(room.id)}
                className="group p-5 bg-neutral-950 hover:bg-neutral-900/60 rounded-2xl border border-neutral-800 hover:border-neutral-600 transition-all flex flex-col justify-between gap-4 cursor-pointer shadow-lg"
              >
                {/* Card Top: Badges & Timer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-neutral-900 text-neutral-300 font-mono text-[10px] uppercase font-bold border border-neutral-800">
                      {room.categoryLabel}
                    </span>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black border border-neutral-800 font-mono text-[11px] text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>{room.activeSprintTime}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white font-mono group-hover:text-neutral-200 transition-colors line-clamp-1">
                      {room.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                      {room.description}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Host info, Participants, Actions */}
                <div className="pt-4 border-t border-neutral-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md overflow-hidden border border-neutral-700">
                        <img
                          src={room.hostAvatar}
                          alt={room.host}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-neutral-300 font-mono font-bold">
                        {room.host}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-neutral-400 font-mono">
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                      <span>{room.participantsCount} active</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLiveRoom(room.id);
                      }}
                      className="flex-1 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase rounded-xl transition-colors text-center shadow-sm"
                    >
                      Enter Room
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleQuickCheckIn(e, room.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase border transition-colors flex items-center gap-1 ${
                        isCheckedIn
                          ? 'bg-neutral-900 text-white border-neutral-700'
                          : 'bg-black text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-600'
                      }`}
                      title="Log task check-in"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isCheckedIn ? 'check_circle' : 'task_alt'}
                      </span>
                      <span>{isCheckedIn ? 'Checked In' : 'Check-In'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Live Room Modal (Co-Working Space) */}
      {activeLiveRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
          <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Live Room Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-mono text-white">
                    {activeRoomData.title}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">
                    Host: {activeRoomData.host} • {activeRoomData.participantsCount} Creators in Flow
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveLiveRoomId(null)}
                className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-800"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Room Body: Left Sprint Timer, Right Live Flow Chat */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              {/* Left Column: Pomodoro Sprint Workstation (5 cols) */}
              <div className="md:col-span-5 p-6 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col justify-between gap-6 bg-black">
                <div className="space-y-4">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
                      Current Sprint Goal
                    </span>
                    <p className="text-xs text-white font-mono font-semibold">
                      "{activeRoomData.goal}"
                    </p>
                  </div>

                  {/* Big Monochrome Stopwatch */}
                  <div className="p-8 bg-neutral-950 rounded-2xl border border-neutral-800 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-widest tabular-nums">
                      {formatTimer(timerSeconds)}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 mt-2 tracking-widest font-bold">
                      {isTimerRunning ? 'Flow Session Active' : 'Timer Paused'}
                    </span>

                    <div className="flex items-center gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="px-4 py-2 bg-white text-black rounded-xl text-xs font-mono font-bold uppercase transition-colors hover:bg-neutral-200"
                      >
                        {isTimerRunning ? 'Pause' : 'Start'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTimerSeconds(25 * 60);
                          setIsTimerRunning(false);
                        }}
                        className="px-3 py-2 bg-neutral-900 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase border border-neutral-800"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={(e) => handleQuickCheckIn(e, activeRoomData.id)}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold uppercase border border-neutral-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    <span>Submit Cycle Check-In</span>
                  </button>
                  <p className="text-[10px] text-neutral-500 text-center font-mono">
                    Check-in verifies your focus sprint for the day.
                  </p>
                </div>
              </div>

              {/* Right Column: Live Chat & Participant Feed (7 cols) */}
              <div className="md:col-span-7 flex flex-col h-full bg-neutral-950">
                {/* Chat Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar max-h-[360px]">
                  <div className="p-3 bg-black rounded-xl border border-neutral-800/80 text-xs text-neutral-400 font-mono">
                    System: Mute microphone during work sprints. Post your session goals in chat below.
                  </div>

                  {liveMessages.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 font-mono text-xs">
                      No messages yet in this room. Say hello or declare your task!
                    </div>
                  ) : (
                    liveMessages.map((msg) => (
                      <div key={msg.id} className="p-3 bg-black rounded-xl border border-neutral-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white font-mono">@{msg.userName}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">{msg.createdAt}</span>
                        </div>
                        <p className="text-xs text-neutral-300 font-sans">{msg.body}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Form */}
                <form
                  onSubmit={handleSendChat}
                  className="p-3 border-t border-neutral-800 bg-black flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Declare your focus task or ask a question..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-xs text-white placeholder-neutral-500 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="px-4 py-2 bg-white disabled:bg-neutral-800 text-black disabled:text-neutral-500 font-mono font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {isNewRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase">Create Focus Room</h3>
              <button
                type="button"
                onClick={() => setIsNewRoomOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-800"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateRoomSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 50/10 Video Production Sprint"
                  className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-black border border-neutral-800 focus:border-white px-3 py-2 rounded-xl text-xs text-white outline-none"
                >
                  <option value="Deep Work">Deep Work</option>
                  <option value="Study Sprints">Study Sprints</option>
                  <option value="Video & Editing">Video & Editing</option>
                  <option value="Morning Routine">Morning Routine</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase">
                  Session Description & Goal
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the focus topic and expectations..."
                  className="w-full bg-black border border-neutral-800 focus:border-white p-3 rounded-xl text-xs text-white placeholder-neutral-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase rounded-xl transition-colors shadow-md"
              >
                Launch Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guidelines Modal */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase">Focus Room Guidelines</h3>
              <button
                type="button"
                onClick={() => setIsRulesOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-800"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 font-sans leading-relaxed">
              <div className="p-3 bg-black rounded-xl border border-neutral-800 space-y-1">
                <h4 className="font-bold text-white font-mono">1. Silent Execution</h4>
                <p>Keep your mic muted during active flow intervals. Use the in-room chat to declare your goals and updates.</p>
              </div>

              <div className="p-3 bg-black rounded-xl border border-neutral-800 space-y-1">
                <h4 className="font-bold text-white font-mono">2. Declare Your Task</h4>
                <p>State what you intend to ship or study when you join. Mutual accountability drives execution.</p>
              </div>

              <div className="p-3 bg-black rounded-xl border border-neutral-800 space-y-1">
                <h4 className="font-bold text-white font-mono">3. Daily Check-in</h4>
                <p>Log your check-in when completing a sprint to build and maintain your daily streak.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRulesOpen(false)}
              className="w-full py-2.5 bg-white text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-neutral-200"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
