import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../utils/imageCompressor';

interface UserAccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  isOpen,
  onClose,
  anchorRef,
}) => {
  const {
    user,
    updateUser,
    setCurrentView,
    setIsKeyboardShortcutsOpen,
    setSelectedVideo,
  } = useApp();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sub-menu states for menu items
  const [activeSubMenu, setActiveSubMenu] = useState<
    'main' | 'appearance' | 'language' | 'location' | 'switch-account' | 'account-details'
  >('main');

  const [appearanceTheme, setAppearanceTheme] = useState<'dark' | 'contrast'>('dark');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [selectedLocation, setSelectedLocation] = useState<string>('Global');
  const [isRestrictedMode, setIsRestrictedMode] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [photoUrlInput, setPhotoUrlInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset all sub-menus to main menu whenever the dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setActiveSubMenu('main');
      setIsHelpOpen(false);
    }
  }, [isOpen]);

  // Handle Escape key to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSubMenu('main');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (viewId: string) => {
    setSelectedVideo(null);
    setCurrentView(viewId);
    setActiveSubMenu('main');
    onClose();
  };

  const handleOpenShortcuts = () => {
    setIsKeyboardShortcutsOpen(true);
    setActiveSubMenu('main');
    onClose();
  };

  const handleToggleRestricted = () => {
    const next = !isRestrictedMode;
    setIsRestrictedMode(next);
    showToast(`Restricted Mode is now ${next ? 'ON' : 'OFF'}`);
  };

  const handleSignOut = () => {
    showToast('Signed out of session. Guest mode enabled.');
    setTimeout(() => {
      setActiveSubMenu('main');
      onClose();
    }, 1200);
  };

  // Handle local avatar image file selection with compression & persistence
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    try {
      const compressed = await compressImage(file, 256, 0.85);
      if (compressed) {
        try {
          localStorage.setItem('riseup_user_avatar', compressed);
        } catch {}
        updateUser({ avatar: compressed });
        showToast('Profile photo updated everywhere!');
      }
    } catch (err) {
      console.warn('[AvatarUpload] Error compressing avatar:', err);
    }
    e.target.value = '';
  };

  const handleApplyPhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrlInput.trim()) return;
    const url = photoUrlInput.trim();
    try {
      localStorage.setItem('riseup_user_avatar', url);
    } catch {}
    updateUser({ avatar: url });
    setPhotoUrlInput('');
    showToast('Profile photo updated everywhere!');
  };

  const languages = [
    'English',
    'Español',
    'Deutsch',
    'Français',
    'हिन्दी (Hindi)',
    '日本語 (Japanese)',
    'Português',
  ];

  const locations = [
    'Global / All Regions',
    'India',
    'United States',
    'United Kingdom',
    'Canada',
    'Germany',
    'Japan',
  ];

  const userDisplayName = user.displayName || user.username || 'Creator';
  const userHandle = `@${user.username || 'creator'}`;
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Invisible fixed backdrop for clean, reliable click-outside handling */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={(e) => {
          e.stopPropagation();
          setActiveSubMenu('main');
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Hidden file input for updating profile picture */}
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[120] bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Account Dropdown Menu */}
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed top-14 right-3 sm:right-5 w-80 max-h-[calc(100vh-4.5rem)] overflow-y-auto no-scrollbar bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl z-50 text-white select-none animate-in fade-in duration-150"
      >
        {/* SUB-MENU: ACCOUNT DETAILS (Inside Menu Container, No Detached Modal) */}
        {activeSubMenu === 'account-details' && (
          <div className="p-3 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveSubMenu('main')}
                className="w-7 h-7 rounded-lg hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Back to menu"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <span className="font-mono font-bold text-xs uppercase text-white">
                Account Details
              </span>
            </div>

            {/* Profile Avatar & Identity Card */}
            <div className="p-4 bg-black rounded-xl border border-neutral-800/80 space-y-3">
              <div className="flex items-center gap-3.5">
                <div
                  className="relative group/avatar w-12 h-12 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-white/20 shrink-0 flex items-center justify-center cursor-pointer shadow-md"
                  onClick={() => avatarFileInputRef.current?.click()}
                  title="Click to update photo"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={userDisplayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold font-mono text-white">
                      {userInitial}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate font-sans">
                    {userDisplayName}
                  </h4>
                  <p className="text-xs text-neutral-400 font-mono truncate">{userHandle}</p>
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="text-[11px] font-mono text-neutral-300 hover:text-white underline mt-0.5 cursor-pointer"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-black rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-400 text-[11px]">Token Balance</span>
                <span className="text-white font-bold">{user.tokens.toLocaleString()} TK</span>
              </div>

              <div className="p-3 bg-black rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-400 text-[11px]">Daily Habit Streak</span>
                <span className="text-white font-bold">{user.streakDays} Days</span>
              </div>

              <div className="p-3 bg-black rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-400 text-[11px]">Channel Status</span>
                <span className="text-white font-bold">Verified Creator</span>
              </div>
            </div>

            {/* Actions: View Channel & Done */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleNavigate('profile')}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase rounded-xl transition-colors border border-neutral-800 cursor-pointer"
              >
                View Channel
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSubMenu('main');
                  onClose();
                }}
                className="w-full py-2 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* SUB-MENU: APPEARANCE */}
        {activeSubMenu === 'appearance' && (
          <div className="p-2 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800 mb-1">
              <button
                type="button"
                onClick={() => setActiveSubMenu('main')}
                className="w-7 h-7 rounded-lg hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <span className="font-mono font-bold text-xs uppercase text-white">Appearance</span>
            </div>
            <p className="px-3 py-1 text-[11px] text-neutral-500 font-sans">
              Setting applies to this browser only.
            </p>
            <button
              type="button"
              onClick={() => {
                setAppearanceTheme('dark');
                showToast('Theme set to Obsidian Monochrome');
                setActiveSubMenu('main');
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                appearanceTheme === 'dark' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-900/60 text-neutral-300'
              }`}
            >
              <span>Obsidian Black (Default)</span>
              {appearanceTheme === 'dark' && (
                <span className="material-symbols-outlined text-[16px]">check</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setAppearanceTheme('contrast');
                showToast('High Contrast Mode Active');
                setActiveSubMenu('main');
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                appearanceTheme === 'contrast' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-900/60 text-neutral-300'
              }`}
            >
              <span>High Contrast Monochrome</span>
              {appearanceTheme === 'contrast' && (
                <span className="material-symbols-outlined text-[16px]">check</span>
              )}
            </button>
          </div>
        )}

        {/* SUB-MENU: LANGUAGE */}
        {activeSubMenu === 'language' && (
          <div className="p-2 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800 mb-1">
              <button
                type="button"
                onClick={() => setActiveSubMenu('main')}
                className="w-7 h-7 rounded-lg hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <span className="font-mono font-bold text-xs uppercase text-white">Choose Language</span>
            </div>
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang);
                  showToast(`Language set to ${lang}`);
                  setActiveSubMenu('main');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
                  selectedLanguage === lang ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-900/60 text-neutral-300'
                }`}
              >
                <span>{lang}</span>
                {selectedLanguage === lang && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* SUB-MENU: LOCATION */}
        {activeSubMenu === 'location' && (
          <div className="p-2 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800 mb-1">
              <button
                type="button"
                onClick={() => setActiveSubMenu('main')}
                className="w-7 h-7 rounded-lg hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <span className="font-mono font-bold text-xs uppercase text-white">Choose Location</span>
            </div>
            {locations.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setSelectedLocation(loc);
                  showToast(`Location set to ${loc}`);
                  setActiveSubMenu('main');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors ${
                  selectedLocation === loc ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-900/60 text-neutral-300'
                }`}
              >
                <span>{loc}</span>
                {selectedLocation === loc && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* SUB-MENU: SWITCH ACCOUNT */}
        {activeSubMenu === 'switch-account' && (
          <div className="p-2 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800 mb-1">
              <button
                type="button"
                onClick={() => setActiveSubMenu('main')}
                className="w-7 h-7 rounded-lg hover:bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <span className="font-mono font-bold text-xs uppercase text-white">Your Account</span>
            </div>

            {/* Real Active Account */}
            <div
              onClick={() => {
                showToast(`Active account: ${userDisplayName}`);
                setActiveSubMenu('main');
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer bg-neutral-900 text-white"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-neutral-700 flex items-center justify-center shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={userDisplayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold font-mono text-white">{userInitial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold font-mono truncate">{userDisplayName}</div>
                <div className="text-[10px] text-neutral-400 truncate">{userHandle}</div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-white">check</span>
            </div>

            <div className="pt-2 border-t border-neutral-800 mt-2 space-y-1">
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-900 text-xs font-mono text-neutral-300 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span>Change profile photo</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-900 text-xs font-mono text-neutral-300 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        {/* MAIN PROFILE MENU (Full YouTube-Style Navigation Menu) */}
        {activeSubMenu === 'main' && (
          <div className="py-2">
            {/* Top User Card with Real Avatar & Instant Photo Update */}
            <div className="px-4 py-3 flex items-start gap-3 border-b border-neutral-800">
              {/* Profile Avatar Button with Hover Camera Overlay */}
              <div
                className="relative group/avatar w-10 h-10 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-neutral-700 shrink-0 flex items-center justify-center cursor-pointer shadow-md"
                onClick={() => avatarFileInputRef.current?.click()}
                title="Click to change profile picture"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={userDisplayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base font-bold font-mono text-white">
                    {userInitial}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                </div>
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-sm text-white truncate font-sans">
                  {userDisplayName}
                </span>
                <span className="text-xs text-neutral-400 truncate font-mono">
                  {userHandle}
                </span>

                <div className="flex items-center gap-3 mt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleNavigate('profile')}
                    className="text-white hover:underline font-medium transition-colors cursor-pointer"
                  >
                    View your channel
                  </button>
                  <span className="text-neutral-600">•</span>
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Change photo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 1: Account / Switch / Sign out */}
            <div className="py-1 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveSubMenu('account-details')}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px] text-neutral-400">
                    account_circle
                  </span>
                  <span>RiseUp Account</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-neutral-500">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubMenu('switch-account')}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px] text-neutral-400">
                    switch_account
                  </span>
                  <span>Switch account</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-neutral-500">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-neutral-400">
                  logout
                </span>
                <span>Sign out</span>
              </button>
            </div>

            {/* SECTION 2: Your Videos, RiseUp Studio & Purchases */}
            <div className="py-1 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => handleNavigate('your-videos')}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px] text-neutral-400">
                    video_library
                  </span>
                  <span>Your Videos</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-neutral-500">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('studio')}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-900 text-white text-xs font-semibold transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px] text-white group-hover:scale-110 transition-transform">
                    token
                  </span>
                  <span className="font-mono tracking-tight font-bold">RiseUp Studio</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-white text-black font-mono font-bold text-[9px] uppercase">
                  Creator
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('shop')}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-neutral-400">
                  monetization_on
                </span>
                <span>Digital Vault Purchases</span>
              </button>
            </div>

            {/* SECTION 3: Data, Appearance, Language, Restricted Mode, Location, Shortcuts */}
            <div className="py-1 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  showToast('Your RiseUp Data & Ledger are securely synced.');
                }}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-neutral-400">
                  security
                </span>
                <span>Your data in RiseUp</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubMenu('appearance')}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px] text-neutral-400">
                    dark_mode
                  </span>
                  <span>Appearance: Monochrome</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-neutral-500">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubMenu('language')}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px] text-neutral-400">
                    translate
                  </span>
                  <span>Language: {selectedLanguage.split(' ')[0]}</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-neutral-500">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleRestricted}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px] text-neutral-400">
                    verified_user
                  </span>
                  <span>Restricted Mode: {isRestrictedMode ? 'On' : 'Off'}</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-neutral-500">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubMenu('location')}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px] text-neutral-400">
                    public
                  </span>
                  <span>Location: {selectedLocation}</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-neutral-500">
                  chevron_right
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenShortcuts}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-neutral-400">
                  keyboard
                </span>
                <span>Keyboard shortcuts</span>
              </button>
            </div>

            {/* SECTION 4: Settings & Help */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleNavigate('settings')}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-neutral-400">
                  settings
                </span>
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-neutral-900 text-neutral-200 hover:text-white text-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-neutral-400">
                  help
                </span>
                <span>Help & feedback</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help & Feedback Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-mono font-bold text-sm uppercase">Help & Feedback</h3>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="w-8 h-8 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center border border-neutral-800 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Have feedback, reporting a bug, or need assistance with RiseUp Studio?
            </p>

            <textarea
              rows={3}
              placeholder="Describe your issue or suggestions..."
              className="w-full bg-black border border-neutral-800 focus:border-white p-3 rounded-xl text-xs text-white placeholder-neutral-500 outline-none resize-none"
            />

            <button
              type="button"
              onClick={() => {
                showToast('Thank you! Your feedback was received.');
                setIsHelpOpen(false);
              }}
              className="w-full py-2.5 bg-white text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Send Feedback
            </button>
          </div>
        </div>
      )}
    </>
  );
};
