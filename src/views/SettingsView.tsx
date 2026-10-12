import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LaneType } from '../types';
import { compressImage } from '../utils/imageCompressor';
import {
  Settings,
  Check,
  Camera,
  Upload,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=256&q=80',
];

export const SettingsView: React.FC = () => {
  const { user, updateUser, adsEnabled, toggleAdsEnabled } = useApp();

  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [focusLane, setFocusLane] = useState<LaneType>(user.focusLane);
  const [targetHours, setTargetHours] = useState<number>(user.targetDailyFocusHours);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle local image file upload from device
  const handleAvatarFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImage(file, 256, 0.85);
      if (compressed) {
        setAvatar(compressed);
        try {
          localStorage.setItem('riseup_user_avatar', compressed);
        } catch {}
        updateUser({ avatar: compressed });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.warn('[SettingsView] Error compressing avatar:', err);
    }
  };

  const handleApplyUrl = () => {
    if (!avatarUrlInput.trim()) return;
    setAvatar(avatarUrlInput.trim());
    updateUser({ avatar: avatarUrlInput.trim() });
    setAvatarUrlInput('');
    setShowUrlInput(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSelectPreset = (url: string) => {
    setAvatar(url);
    updateUser({ avatar: url });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      displayName,
      username,
      bio,
      avatar,
      focusLane,
      targetDailyFocusHours: targetHours,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-4 border-b border-[#272727]">
        <h1 className="text-xl md:text-2xl font-bold text-white font-display flex items-center gap-2">
          <Settings className="w-5 h-5 text-white" />
          <span>Channel & Builder Preferences</span>
        </h1>
        <p className="text-xs text-[#aaaaaa] mt-0.5">
          Manage your channel profile picture, builder identity, daily focus targets, and primary lane affinity.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Channel preferences and profile picture updated successfully!</span>
        </div>
      )}

      {/* Profile Picture Customization Card */}
      <div className="p-5 sm:p-6 bg-[#181818] border border-[#272727] rounded-xl space-y-4">
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#3ea6ff]" />
          <span>Channel Profile Picture</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar with Camera overlay */}
          <div className="relative group/avatar shrink-0 self-start">
            <img
              src={avatar}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[#383838] group-hover/avatar:border-white transition-all shadow-md"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer backdrop-blur-[2px]"
              title="Upload new profile photo"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-semibold">Change</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleAvatarFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Action buttons & Presets */}
          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <h3 className="font-bold text-sm text-white font-display">{displayName}</h3>
              <p className="text-xs text-[#aaaaaa] mt-0.5">
                Upload a square photo from your device (JPG, PNG, GIF) or pick a builder preset avatar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Device</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-1.5 bg-[#272727] hover:bg-[#383838] text-white font-semibold text-xs rounded-full transition-colors flex items-center gap-1.5 border border-[#383838]"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image Link</span>
              </button>
            </div>

            {/* Custom URL Input dropdown */}
            {showUrlInput && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="url"
                  placeholder="Paste direct image URL (https://...)..."
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#383838] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#717171] focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-1.5 bg-[#3ea6ff] hover:bg-[#65b8ff] text-black font-bold text-xs rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Quick Preset Avatars */}
            <div className="pt-1 space-y-1.5">
              <div className="text-[11px] text-[#717171] font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Or select a builder avatar preset:</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {AVATAR_PRESETS.map((pUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(pUrl)}
                    className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 shrink-0 ${
                      avatar === pUrl ? 'border-white ring-2 ring-[#3ea6ff]' : 'border-[#383838] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={pUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 bg-[#181818] border border-[#272727] rounded-xl space-y-4 text-xs">
        <div>
          <label className="block text-[#aaaaaa] font-semibold mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-[#121212] border border-[#272727] rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-white"
          />
        </div>

        <div>
          <label className="block text-[#aaaaaa] font-semibold mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#121212] border border-[#272727] rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-white font-mono"
          />
        </div>

        <div>
          <label className="block text-[#aaaaaa] font-semibold mb-1">Builder Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-[#121212] border border-[#272727] rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-white leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#aaaaaa] font-semibold mb-1">Primary Focus Lane</label>
            <select
              value={focusLane}
              onChange={(e) => setFocusLane(e.target.value as LaneType)}
              className="w-full bg-[#121212] border border-[#272727] rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-white"
            >
              <option value="Engineering">Engineering</option>
              <option value="Focus">Focus & Deep Work</option>
              <option value="Systems">Systems & Architecture</option>
              <option value="Finance">Finance</option>
              <option value="Fitness">Fitness</option>
            </select>
          </div>

          <div>
            <label className="block text-[#aaaaaa] font-semibold mb-1">Daily Target Focus (Hours)</label>
            <input
              type="number"
              min="1"
              max="16"
              value={targetHours}
              onChange={(e) => setTargetHours(parseFloat(e.target.value) || 4)}
              className="w-full bg-[#121212] border border-[#272727] rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-full transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Video Ads & Platform Monetization Settings */}
      <div className="p-6 bg-[#181818] border border-[#272727] rounded-xl space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#272727]">
          <div>
            <h3 className="font-bold text-sm text-white font-display">Video Ads & Monetization Preferences</h3>
            <p className="text-[11px] text-[#aaaaaa]">
              Manage YouTube-style in-stream pre-roll ads, Shorts sponsor cards, and rewarded tokens.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAdsEnabled}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              adsEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            {adsEnabled ? 'Ads Active' : 'Ads Paused'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-[#121212] border border-[#272727] rounded-lg space-y-1">
            <div className="text-[10px] text-[#717171] uppercase tracking-wider font-semibold">Format</div>
            <div className="text-white font-bold">In-Stream & Shorts</div>
            <div className="text-[10px] text-[#aaaaaa]">5s skip countdown timer</div>
          </div>

          <div className="p-3 bg-[#121212] border border-[#272727] rounded-lg space-y-1">
            <div className="text-[10px] text-[#717171] uppercase tracking-wider font-semibold">Creator Revenue</div>
            <div className="text-emerald-400 font-bold">55% Revenue Pool</div>
            <div className="text-[10px] text-[#aaaaaa]">Standard YouTube split</div>
          </div>

          <div className="p-3 bg-[#121212] border border-[#272727] rounded-lg space-y-1">
            <div className="text-[10px] text-[#717171] uppercase tracking-wider font-semibold">Viewer Reward</div>
            <div className="text-amber-400 font-bold">+2 RUP / Complete Ad</div>
            <div className="text-[10px] text-[#aaaaaa]">Instant ledger balance</div>
          </div>
        </div>
      </div>
    </div>
  );
};
