import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  VideoItem,
  DigitalProduct,
  ProductOrder,
  AccountabilityRoom,
  RoomMessage,
  ArenaChallenge,
  ArenaDuel,
  DisciplineMetrics,
  TokenLedgerEntry,
  VaultLock,
  NotificationItem,
  SafetyReport,
  LaneType,
  CommentItem,
  VideoClip,
} from '../types';
import {
  CURRENT_USER,
  INITIAL_VIDEOS,
  INITIAL_SHORTS,
  INITIAL_PRODUCTS,
  INITIAL_ROOMS,
  INITIAL_CHALLENGES,
  INITIAL_DUELS,
  INITIAL_DISCIPLINE,
  INITIAL_LEDGER,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { dbService } from '../services/dbService';
import { compressImage } from '../utils/imageCompressor';
import { videoStorageService } from '../services/videoStorage';
import { EconomyService } from '../services/economyService';
import { AbusePreventionService } from '../services/abusePrevention';
import { ModerationService } from '../services/moderationService';

export const isShortVideo = (v: Partial<VideoItem> | null | undefined): boolean => {
  if (!v) return false;
  // If explicitly flagged with duration > 60s or 16:9 aspect ratio and not isShort, it is a long video
  if (v.durationSeconds && v.durationSeconds > 60) return false;
  if (v.aspectRatio === '16:9' && !v.isShort) return false;
  return Boolean(
    v.isShort === true ||
    v.aspectRatio === '9:16' ||
    (typeof v.id === 'string' && (v.id.startsWith('short-') || v.id.startsWith('short_'))) ||
    (v.tags && Array.isArray(v.tags) && v.tags.some((t: string) => typeof t === 'string' && (t.toLowerCase() === 'short' || t.toLowerCase() === 'shorts')))
  );
};

export const cleanVideoUrl = (url?: string, _isShort?: boolean): string => {
  if (!url) return '';
  if (
    url.includes('commondatastorage.googleapis.com') ||
    url.includes('BigBuckBunny') ||
    url.includes('ForBiggerBlazes')
  ) {
    return '';
  }
  return url;
};

interface IntentResult {
  video: VideoItem;
  reason: string;
  focusScore: number;
}

interface AppContextType {
  // Navigation
  currentView: string;
  setCurrentView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // User & Profile
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;

  // Videos & Shorts
  videos: VideoItem[];
  shorts: VideoItem[];
  selectedVideo: VideoItem | null;
  setSelectedVideo: (v: VideoItem | null) => void;
  activeShortId: string | null;
  setActiveShortId: (id: string | null) => void;
  openShort: (shortId: string) => void;
  likeVideo: (id: string) => void;
  saveVideo: (id: string) => void;
  likedVideoIds: string[];
  savedVideoIds: string[];
  recordView: (id: string) => Promise<void> | void;
  addComment: (videoId: string, text: string) => void;
  comments: Record<string, CommentItem[]>;
  uploadVideo: (video: Partial<VideoItem>) => Promise<VideoItem>;
  updateVideoMedia: (videoId: string, videoUrl: string) => Promise<void>;
  deleteVideo: (videoId: string) => Promise<void>;
  isKeyboardShortcutsOpen: boolean;
  setIsKeyboardShortcutsOpen: (open: boolean) => void;

  // Modern YouTube Studio Upload Modal
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  openUploadModal: () => void;

  // Modern YouTube-inspired PiP Miniplayer
  miniPlayerVideo: VideoItem | null;
  setMiniPlayerVideo: (video: VideoItem | null) => void;
  miniPlayerTime: number;
  setMiniPlayerTime: (time: number) => void;
  isMiniPlayerPlaying: boolean;
  setIsMiniPlayerPlaying: (playing: boolean) => void;
  expandMiniPlayer: () => void;

  // Modern Ambient Mode (Theater Glow)
  ambientMode: boolean;
  setAmbientMode: (enabled: boolean) => void;

  // Focus & Sleep Sprint Timer
  sleepTimerMinutes: number | null;
  setSleepTimer: (minutes: number | null) => void;

  // Video Clips Maker
  clips: VideoClip[];
  addClip: (clip: Omit<VideoClip, 'id' | 'createdAt'>) => VideoClip;
  deleteClip: (clipId: string) => void;

  // Intent Gateway
  selectedLane: LaneType;
  setSelectedLane: (lane: LaneType) => void;
  intentText: string;
  setIntentText: (text: string) => void;
  isCurating: boolean;
  curatedVideos: IntentResult[];
  curateIntent: (lane: LaneType, intent: string) => Promise<void>;

  // Shop & Entitlements
  products: DigitalProduct[];
  orders: ProductOrder[];
  buyProduct: (product: DigitalProduct) => { success: boolean; message: string };
  hasEntitlement: (productId: string) => boolean;
  createProduct: (product: Partial<DigitalProduct>) => void;

  // Rooms
  rooms: AccountabilityRoom[];
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  roomMessages: Record<string, RoomMessage[]>;
  checkInRoom: (roomId: string, note?: string) => void;
  sendRoomMessage: (roomId: string, message: string) => void;
  joinRoom: (roomId: string) => void;
  createRoom: (room: Partial<AccountabilityRoom>) => void;

  // Arena & Duels
  challenges: ArenaChallenge[];
  duels: ArenaDuel[];
  joinChallenge: (challengeId: string) => void;
  createDuel: (task: string, opponentUsername: string, stakeTokens: number) => void;

  // Wallet & Vault
  ledger: TokenLedgerEntry[];
  vaultLocks: VaultLock[];
  lockTokensInVault: (amount: number, termDays: number) => { success: boolean; message: string };
  sendTip: (creatorId: string, creatorName: string, videoId: string | null, tokens: number) => Promise<boolean> | boolean;
  boostVideo: (videoId: string, tokens: number) => Promise<boolean> | boolean;

  // Discipline & Metrics
  discipline: DisciplineMetrics;
  distractionBlockerEnabled: boolean;
  setDistractionBlockerEnabled: (v: boolean) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (item: Partial<NotificationItem> & { title: string; message: string }) => void;

  // Trust & Safety & Moderation (PRD Section 13)
  reports: SafetyReport[];
  submitReport: (targetType: 'video' | 'comment' | 'room' | 'creator', targetId: string, reason: any, details: string) => void;
  isModerationOpen: boolean;
  setIsModerationOpen: (open: boolean) => void;
  tokenLedger: TokenLedgerEntry[];

  // Video Ads & Monetization
  adsEnabled: boolean;
  toggleAdsEnabled: () => void;
  claimAdReward: (adTitle?: string) => void;

  // Focus Queue & Flow Session (YouTube Queue equivalent)
  focusQueue: VideoItem[];
  addToFocusQueue: (video: VideoItem) => void;
  removeFromFocusQueue: (videoId: string) => void;
  clearFocusQueue: () => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  playNextInQueue: () => void;

  // Watch Later (YouTube Watch Later equivalent)
  watchLaterIds: string[];
  toggleWatchLater: (video: VideoItem) => void;
  isWatchLater: (videoId: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // One-time cleanup of legacy mock localStorage cache
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('riseup_user');
      if (rawUser && (rawUser.includes('marcus_vance') || rawUser.includes('usr_current_01'))) {
        localStorage.removeItem('riseup_user');
        localStorage.removeItem('riseup_videos');
        localStorage.removeItem('riseup_shorts');
        localStorage.removeItem('riseup_products');
      }
    } catch {
      // safe fallback
    }
  }, []);

  // Navigation
  const [currentView, setCurrentView] = useState<string>('feed');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User
  const [user, setUser] = useState<UserProfile>(() => {
    const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('riseup_user_avatar') : null;
    try {
      const saved = localStorage.getItem('riseup_user');
      if (saved && !saved.includes('marcus_vance') && !saved.includes('usr_current_01')) {
        const parsed = JSON.parse(saved);
        if (savedAvatar) {
          parsed.avatar = savedAvatar;
        } else if (parsed.avatar && parsed.avatar.includes('photo-1535713875002-d1d0cf377fde')) {
          parsed.avatar = '';
        }
        return parsed;
      }
    } catch {}
    const defaultUser = { ...CURRENT_USER };
    if (savedAvatar) {
      defaultUser.avatar = savedAvatar;
    } else if (defaultUser.avatar && defaultUser.avatar.includes('photo-1535713875002-d1d0cf377fde')) {
      defaultUser.avatar = '';
    }
    return defaultUser;
  });

  // Videos & Shorts state with automatic 9:16 Shorts partitioning & deduplication
  const [initialData] = useState(() => {
    const allItems: VideoItem[] = [];
    try {
      const mockIds = new Set([
        'vid-arch-01',
        'vid-focus-02',
        'vid-prod-03',
        'short-sys-01',
        'short-scale-02',
        'short-code-03',
        'vid-riseup-01',
        'vid-morning-02',
        'vid-focus-03',
        'short-valkyrie-01',
        'short-sxwd-02',
        'short-sdfg-03',
        'short-stayhard-04',
      ]);
      const isDemoItem = (p: VideoItem) => {
        if (!p || !p.id) return true;
        if (mockIds.has(p.id)) return true;
        if (p.videoUrl && (p.videoUrl.includes('long_stream_') || p.videoUrl.includes('short_stream_') || p.videoUrl.includes('sample.mp4'))) return true;
        return false;
      };
      const savedV = localStorage.getItem('riseup_videos');
      if (savedV) {
        const parsed = JSON.parse(savedV);
        if (Array.isArray(parsed)) {
          allItems.push(...parsed.filter((p: VideoItem) => !isDemoItem(p)));
        }
      }
      const savedS = localStorage.getItem('riseup_shorts');
      if (savedS) {
        const parsed = JSON.parse(savedS);
        if (Array.isArray(parsed)) {
          allItems.push(...parsed.filter((p: VideoItem) => !isDemoItem(p)));
        }
      }
    } catch {}

    const map = new Map<string, VideoItem>();
    allItems.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    INITIAL_VIDEOS.forEach((v) => { if (!map.has(v.id)) map.set(v.id, v); });
    INITIAL_SHORTS.forEach((s) => { if (!map.has(s.id)) map.set(s.id, s); });

    const merged = Array.from(map.values());
    const std: VideoItem[] = [];
    const sh: VideoItem[] = [];

    merged.forEach((item) => {
      const isShort = isShortVideo(item);
      const cleaned = { ...item, videoUrl: cleanVideoUrl(item.videoUrl, isShort) };
      if (isShort) {
        sh.push({ ...cleaned, isShort: true, aspectRatio: '9:16' });
      } else {
        std.push({ ...cleaned, isShort: false, aspectRatio: cleaned.aspectRatio || '16:9' });
      }
    });

    try {
      localStorage.setItem('riseup_videos', JSON.stringify(std));
      localStorage.setItem('riseup_shorts', JSON.stringify(sh));
    } catch {}

    return {
      videos: std,
      shorts: sh,
    };
  });

  const [videos, setVideos] = useState<VideoItem[]>(initialData.videos);
  const [shorts, setShorts] = useState<VideoItem[]>(initialData.shorts);
  const [selectedVideo, setSelectedVideoInternal] = useState<VideoItem | null>(null);
  const [activeShortId, setActiveShortId] = useState<string | null>(null);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState<boolean>(false);

  // Global YouTube keyboard shortcuts listener (? for shortcuts dialog)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsKeyboardShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  const openShort = (shortId: string) => {
    setSelectedVideoInternal(null);
    setActiveShortId(shortId);
    setCurrentView('shorts');
  };

  const setSelectedVideo = (v: VideoItem | null) => {
    if (v && isShortVideo(v)) {
      openShort(v.id);
      return;
    }
    setSelectedVideoInternal(v);
  };

  // Modern YouTube Studio Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const openUploadModal = () => setIsUploadModalOpen(true);

  // Modern YouTube PiP Miniplayer State
  const [miniPlayerVideo, setMiniPlayerVideo] = useState<VideoItem | null>(null);
  const [miniPlayerTime, setMiniPlayerTime] = useState<number>(0);
  const [isMiniPlayerPlaying, setIsMiniPlayerPlaying] = useState<boolean>(true);

  const expandMiniPlayer = () => {
    if (miniPlayerVideo) {
      setSelectedVideoInternal(miniPlayerVideo);
      setMiniPlayerVideo(null);
    }
  };

  // Modern YouTube Ambient Mode (Dynamic lighting behind player)
  const [ambientMode, setAmbientModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('riseup_ambient_mode');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setAmbientMode = (enabled: boolean) => {
    setAmbientModeState(enabled);
    try {
      localStorage.setItem('riseup_ambient_mode', JSON.stringify(enabled));
    } catch {}
  };

  // Focus & Sleep Sprint Timer (Minutes)
  const [sleepTimerMinutes, setSleepTimer] = useState<number | null>(null);

  // Video Clips Collection (YouTube Clip tool)
  const [clips, setClips] = useState<VideoClip[]>(() => {
    try {
      const saved = localStorage.getItem('riseup_clips');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const addClip = (clipData: Omit<VideoClip, 'id' | 'createdAt'>): VideoClip => {
    const newClip: VideoClip = {
      ...clipData,
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setClips((prev) => {
      const next = [newClip, ...prev];
      try {
        localStorage.setItem('riseup_clips', JSON.stringify(next));
      } catch {}
      return next;
    });
    return newClip;
  };

  const deleteClip = (clipId: string) => {
    setClips((prev) => {
      const next = prev.filter((c) => c.id !== clipId);
      try {
        localStorage.setItem('riseup_clips', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [likedVideoIds, setLikedVideoIds] = useState<string[]>([]);
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);
  const [viewedVideoIds, setViewedVideoIds] = useState<Set<string>>(new Set());

  // Comments
  const [comments, setComments] = useState<Record<string, CommentItem[]>>({});

  // Intent Gateway
  const [selectedLane, setSelectedLane] = useState<LaneType>('Focus');
  const [intentText, setIntentText] = useState<string>('');
  const [isCurating, setIsCurating] = useState<boolean>(false);
  const [curatedVideos, setCuratedVideos] = useState<IntentResult[]>([]);

  // Shop & Orders
  const [products, setProducts] = useState<DigitalProduct[]>(() => {
    try {
      const saved = localStorage.getItem('riseup_products');
      if (saved && !saved.includes('prod_01')) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState<ProductOrder[]>([]);

  // Rooms
  const [rooms, setRooms] = useState<AccountabilityRoom[]>(INITIAL_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomMessages, setRoomMessages] = useState<Record<string, RoomMessage[]>>({});

  // Arena
  const [challenges, setChallenges] = useState<ArenaChallenge[]>(INITIAL_CHALLENGES);
  const [duels, setDuels] = useState<ArenaDuel[]>(INITIAL_DUELS);

  // Wallet
  const [ledger, setLedger] = useState<TokenLedgerEntry[]>(INITIAL_LEDGER);
  const [vaultLocks, setVaultLocks] = useState<VaultLock[]>([]);

  // Discipline
  const [discipline, setDiscipline] = useState<DisciplineMetrics>(INITIAL_DISCIPLINE);
  const [distractionBlockerEnabled, setDistractionBlockerEnabled] = useState<boolean>(true);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Reports
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [isModerationOpen, setIsModerationOpen] = useState<boolean>(false);

  // Real-time Firestore Subscriptions & Auto-Sync
  useEffect(() => {
    // 1. Subscribe to User Profile
    const unsubUser = dbService.subscribeUser(user.id, (remoteUser) => {
      if (remoteUser) {
        const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('riseup_user_avatar') : null;
        let effectiveAvatar = remoteUser.avatar || '';
        if (savedAvatar) {
          effectiveAvatar = savedAvatar;
        } else if (effectiveAvatar.includes('photo-1535713875002-d1d0cf377fde')) {
          effectiveAvatar = '';
        }
        const resolvedUser: UserProfile = { ...remoteUser, avatar: effectiveAvatar };
        setUser(resolvedUser);
        try {
          localStorage.setItem('riseup_user', JSON.stringify(resolvedUser));
          if (effectiveAvatar) {
            localStorage.setItem('riseup_user_avatar', effectiveAvatar);
          }
        } catch {}
        if (remoteUser.avatar !== effectiveAvatar) {
          dbService.saveUser(resolvedUser);
        }
      } else {
        dbService.saveUser(user);
      }
    });

    // 2. Subscribe to Videos & Shorts (Zero-index removed content according to PRD Section 13)
    const unsubVideos = dbService.subscribeVideos((allVideos) => {
      if (allVideos && allVideos.length > 0) {
        const cleaned = allVideos.map((v) => {
          const isShort = isShortVideo(v);
          return {
            ...v,
            videoUrl: cleanVideoUrl(v.videoUrl, isShort),
          };
        });
        // Filter out content that has been restricted or removed by moderation
        const standardVids: VideoItem[] = [];
        const shortVids: VideoItem[] = [];

        cleaned.forEach((v) => {
          if (v.status === 'removed') return;
          if (isShortVideo(v)) {
            shortVids.push({ ...v, isShort: true, aspectRatio: '9:16' });
          } else {
            standardVids.push({ ...v, isShort: false, aspectRatio: v.aspectRatio || '16:9' });
          }
        });

        setVideos(standardVids);
        setShorts(shortVids);
        try {
          localStorage.setItem('riseup_videos', JSON.stringify(standardVids));
          localStorage.setItem('riseup_shorts', JSON.stringify(shortVids));
        } catch {}
      }
    });

    // 3. Subscribe to Likes & Saves
    const unsubLikes = dbService.subscribeLikes(user.id, (likes) => {
      setLikedVideoIds(likes);
    });
    const unsubSaves = dbService.subscribeSaves(user.id, (saves) => {
      setSavedVideoIds(saves);
    });

    // 4. Subscribe to Rooms
    const unsubRooms = dbService.subscribeRooms((remoteRooms) => {
      setRooms(remoteRooms);
    });

    // 5. Subscribe to Products
    const unsubProducts = dbService.subscribeProducts((remoteProducts) => {
      setProducts(remoteProducts);
    });

    // 6. Subscribe to Entitlements
    const unsubEntitlements = dbService.subscribeEntitlements(user.id, (prodIds) => {
      const entOrders: ProductOrder[] = prodIds.map((pId) => ({
        id: `ent_${pId}`,
        buyerId: user.id,
        productId: pId,
        sellerId: '',
        priceTokens: 0,
        status: 'completed',
        purchasedAt: 'Purchased',
        downloadUrl: `/downloads/${pId}/bundle.zip`,
      }));
      setOrders(entOrders);
    });

    // 7. Subscribe to Ledger
    const unsubLedger = dbService.subscribeLedger(user.id, (remoteLedger) => {
      setLedger(remoteLedger);
    });

    // 8. Subscribe to Vault Locks
    const unsubVault = dbService.subscribeVaultLocks(user.id, (remoteLocks) => {
      setVaultLocks(remoteLocks);
    });

    // 9. Subscribe to Arena Challenges & Duels
    const unsubChallenges = dbService.subscribeChallenges((remoteChallenges) => {
      setChallenges(remoteChallenges);
    });
    const unsubDuels = dbService.subscribeDuels((remoteDuels) => {
      setDuels(remoteDuels);
    });

    // 10. Subscribe to Notifications
    const unsubNotifications = dbService.subscribeNotifications(user.id, (remoteNotifs) => {
      setNotifications(remoteNotifs);
    });

    return () => {
      unsubUser();
      unsubVideos();
      unsubLikes();
      unsubSaves();
      unsubRooms();
      unsubProducts();
      unsubEntitlements();
      unsubLedger();
      unsubVault();
      unsubChallenges();
      unsubDuels();
      unsubNotifications();
    };
  }, [user.id]);

  const updateUser = async (updates: Partial<UserProfile>) => {
    let finalUpdates = { ...updates };

    if (updates.avatar) {
      let resolvedAvatar = updates.avatar;
      if (resolvedAvatar.startsWith('data:image/')) {
        try {
          resolvedAvatar = await compressImage(resolvedAvatar, 256, 0.85);
        } catch {}
      }
      finalUpdates.avatar = resolvedAvatar;
      try {
        localStorage.setItem('riseup_user_avatar', resolvedAvatar);
      } catch {}
    }

    setUser((prev) => {
      const updated = { ...prev, ...finalUpdates };
      dbService.saveUser(updated);
      try {
        localStorage.setItem('riseup_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Cascade profile picture and display name changes everywhere (Feed videos, Shorts, Comments)
    if (finalUpdates.avatar || finalUpdates.displayName || finalUpdates.username) {
      const newAvatar = finalUpdates.avatar;
      const newName = finalUpdates.displayName;
      const newUsername = finalUpdates.username;

      if (newAvatar) {
        dbService.updateUserAvatarEverywhere(user.id, newAvatar);
      }

      setVideos((prev) => {
        const updated = prev.map((v) => {
          if (v.creatorId === user.id || v.creatorUsername === user.username) {
            const next = {
              ...v,
              creatorAvatar: newAvatar ?? v.creatorAvatar,
              creatorName: newName ?? v.creatorName,
              creatorUsername: newUsername ?? v.creatorUsername,
            };
            dbService.addVideo(next);
            return next;
          }
          return v;
        });
        try {
          localStorage.setItem('riseup_videos', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setShorts((prev) => {
        const updated = prev.map((s) => {
          if (s.creatorId === user.id || s.creatorUsername === user.username) {
            const next = {
              ...s,
              creatorAvatar: newAvatar ?? s.creatorAvatar,
              creatorName: newName ?? s.creatorName,
              creatorUsername: newUsername ?? s.creatorUsername,
            };
            dbService.addVideo(next);
            return next;
          }
          return s;
        });
        try {
          localStorage.setItem('riseup_shorts', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setComments((prev) => {
        const nextMap: Record<string, CommentItem[]> = {};
        Object.entries(prev).forEach(([videoId, commentList]) => {
          nextMap[videoId] = commentList.map((c) => {
            if (c.userId === user.id) {
              return {
                ...c,
                userAvatar: newAvatar ?? c.userAvatar,
                userName: newName ?? c.userName,
              };
            }
            return c;
          });
        });
        return nextMap;
      });

      setRoomMessages((prev) => {
        const nextMap: Record<string, RoomMessage[]> = {};
        Object.entries(prev).forEach(([roomId, msgList]) => {
          nextMap[roomId] = msgList.map((m) => {
            if (m.senderId === user.id) {
              return {
                ...m,
                senderAvatar: newAvatar ?? m.senderAvatar,
                senderName: newName ?? m.senderName,
              };
            }
            return m;
          });
        });
        return nextMap;
      });

      setDuels((prev) =>
        prev.map((d) => {
          let nextD = { ...d };
          if (d.challenger.username === user.username) {
            nextD.challenger = {
              ...d.challenger,
              avatar: newAvatar ?? d.challenger.avatar,
              name: newName ?? d.challenger.name,
            };
          }
          if (d.opponent.username === user.username) {
            nextD.opponent = {
              ...d.opponent,
              avatar: newAvatar ?? d.opponent.avatar,
              name: newName ?? d.opponent.name,
            };
          }
          return nextD;
        })
      );

      setProducts((prev) => {
        const updated = prev.map((p) => {
          if (p.creatorId === user.id || p.creatorName === user.displayName) {
            return {
              ...p,
              creatorAvatar: newAvatar ?? p.creatorAvatar,
              creatorName: newName ?? p.creatorName,
            };
          }
          return p;
        });
        try {
          localStorage.setItem('riseup_products', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setRooms((prev) => {
        const updated = prev.map((r) => {
          if (r.ownerId === user.id || r.ownerName === user.displayName) {
            return {
              ...r,
              coverUrl: newAvatar ?? r.coverUrl,
              ownerName: newName ?? r.ownerName,
            };
          }
          return r;
        });
        try {
          localStorage.setItem('riseup_rooms', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setNotifications((prev) =>
        prev.map((n) => {
          if (n.actorName === user.displayName || n.actorName === user.username) {
            return {
              ...n,
              actorAvatar: newAvatar ?? n.actorAvatar,
            };
          }
          return n;
        })
      );
    }
  };

  const likeVideo = (id: string) => {
    const isLiked = likedVideoIds.includes(id);
    setLikedVideoIds((prev) => (isLiked ? prev.filter((v) => v !== id) : [...prev, id]));
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, likesCount: isLiked ? v.likesCount - 1 : v.likesCount + 1 } : v))
    );
    setShorts((prev) =>
      prev.map((v) => (v.id === id ? { ...v, likesCount: isLiked ? v.likesCount - 1 : v.likesCount + 1 } : v))
    );
    dbService.toggleLike(user.id, id, isLiked);
  };

  const saveVideo = (id: string) => {
    const isSaved = savedVideoIds.includes(id);
    setSavedVideoIds((prev) => (isSaved ? prev.filter((v) => v !== id) : [...prev, id]));
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, savesCount: isSaved ? v.savesCount - 1 : v.savesCount + 1 } : v))
    );
    dbService.toggleSave(user.id, id, isSaved);
  };

  // Rule from PRD: +1 token per verified view, deduplicated by session
  const recordView = async (id: string) => {
    if (viewedVideoIds.has(id)) return;
    setViewedVideoIds((prev) => new Set(prev).add(id));

    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, viewsCount: v.viewsCount + 1 } : v))
    );

    // Validate anti-farming watch progress & reward using AbusePreventionService & EconomyService
    const canReward = AbusePreventionService.canClaimWatchReward(user.id, id);
    if (canReward.eligible) {
      const idempotencyKey = EconomyService.generateIdempotencyKey(user.id, 'EARN_VIEW', id);
      const res = await EconomyService.recordLedgerTransaction(
        user.id,
        1,
        'EARN_VIEW',
        'Verified builder watch time (+1 RUP)',
        idempotencyKey,
        user.tokens
      );

      if (res.success) {
        setUser((prev) => {
          const updated = { ...prev, tokens: res.newBalance, xp: prev.xp + 25 };
          dbService.saveUser(updated);
          return updated;
        });

        const newEntry: TokenLedgerEntry = {
          id: `ledg_${Date.now()}`,
          userId: user.id,
          delta: 1,
          type: 'EARN_VIEW',
          description: 'Educational view verified (+1 Token)',
          idempotencyKey,
          createdAt: new Date().toISOString(),
        };
        setLedger((prev) => [newEntry, ...prev]);
      }
    }

    // Update discipline metrics
    setDiscipline((prev) => {
      const addedMin = 15;
      const newLearning = prev.learningMinutes + addedMin;
      const newTotal = prev.totalMinutesWatched + addedMin;
      return {
        ...prev,
        totalMinutesWatched: newTotal,
        learningMinutes: newLearning,
        learningRatio: Math.round((newLearning / newTotal) * 100),
      };
    });
  };

  const addComment = (videoId: string, text: string) => {
    // Anti-comment spam & velocity check (PRD Section 10)
    const validation = AbusePreventionService.validateComment(user.id, text);
    if (!validation.valid) {
      console.warn('[AbusePrevention] Comment rejected:', validation.error);
      return;
    }

    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      videoId,
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatar,
      body: text.trim(),
      createdAt: 'Just now',
      likes: 0,
    };
    setComments((prev) => ({
      ...prev,
      [videoId]: [newComment, ...(prev[videoId] || [])],
    }));
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, commentsCount: v.commentsCount + 1 } : v))
    );
    dbService.addComment(newComment);
  };

  // Upload video with client-side transcoding ladder simulator + +10 tokens reward
  const uploadVideo = async (videoData: Partial<VideoItem>): Promise<VideoItem> => {
    const isShort = isShortVideo(videoData);
    const newId = videoData.id || (isShort ? `short_${Date.now()}` : `vid_${Date.now()}`);
    const videoSource = cleanVideoUrl(videoData.videoUrl, isShort);
    const renditions = [
      {
        height: 1080 as const,
        label: '1080p' as const,
        path: `/renditions/${newId}_1080p.mp4`,
        bytes: 110000000,
        codec: 'avc1.64002a',
        signedUrl: videoSource,
      },
      {
        height: 720 as const,
        label: '720p' as const,
        path: `/renditions/${newId}_720p.mp4`,
        bytes: 58000000,
        codec: 'avc1.4d401f',
        signedUrl: videoSource,
      },
      {
        height: 360 as const,
        label: '360p' as const,
        path: `/renditions/${newId}_360p.mp4`,
        bytes: 22000000,
        codec: 'avc1.42e01e',
        signedUrl: videoSource,
      },
    ];

    const newVideo: VideoItem = {
      id: newId,
      creatorId: user.id,
      creatorName: user.displayName,
      creatorUsername: user.username,
      creatorAvatar: user.avatar,
      title: videoData.title || (isShort ? 'Untitled Short' : 'Untitled Build Document'),
      description: videoData.description || 'Raw technical walk-through and build documentation.',
      category: videoData.category || 'Engineering',
      tags: videoData.tags || (isShort ? ['Shorts', 'RiseUp'] : ['Building', 'RiseUp']),
      durationSeconds: videoData.durationSeconds || (isShort ? 45 : 600),
      durationFormatted: videoData.durationFormatted || (isShort ? '0:45' : '10:00'),
      aspectRatio: isShort ? '9:16' : '16:9',
      isShort,
      thumbnailUrl: videoData.thumbnailUrl || (isShort
        ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80'),
      videoUrl: videoSource,
      viewsCount: 1,
      likesCount: 1,
      savesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      status: 'published',
      isLearning: true,
      renditions,
      aiTakeaways: [
        'Modular architecture ensures zero regression on core pathways.',
        'High-density logs with structured spans enable sub-second root causing.',
      ],
    };

    if (newVideo.videoUrl) {
      videoStorageService.registerMemoryUrl(newId, newVideo.videoUrl);
    }

    if (isShort) {
      setShorts((prev) => {
        const updated = [newVideo, ...prev.filter((p) => p.id !== newId)];
        try { localStorage.setItem('riseup_shorts', JSON.stringify(updated)); } catch {}
        return updated;
      });
      setVideos((prev) => {
        const updated = prev.filter((p) => p.id !== newId);
        try { localStorage.setItem('riseup_videos', JSON.stringify(updated)); } catch {}
        return updated;
      });
    } else {
      setVideos((prev) => {
        const updated = [newVideo, ...prev.filter((p) => p.id !== newId)];
        try { localStorage.setItem('riseup_videos', JSON.stringify(updated)); } catch {}
        return updated;
      });
      setShorts((prev) => {
        const updated = prev.filter((p) => p.id !== newId);
        try { localStorage.setItem('riseup_shorts', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
    dbService.addVideo(newVideo);

    // Economy rule: +10 tokens on publish!
    setUser((prev) => {
      const updated = { ...prev, tokens: prev.tokens + 10, xp: prev.xp + 100 };
      dbService.saveUser(updated);
      return updated;
    });
    const ledgerEntry: TokenLedgerEntry = {
      id: `ledg_${Date.now()}`,
      userId: user.id,
      delta: 10,
      type: 'EARN_PUBLISH',
      description: `Published technical upload: "${newVideo.title.slice(0, 32)}..." (+10 Tokens)`,
      idempotencyKey: `idemp_pub_${newId}`,
      createdAt: 'Just now',
    };
    setLedger((prev) => [ledgerEntry, ...prev]);
    dbService.addLedgerEntry(ledgerEntry);

    return newVideo;
  };

  const updateVideoMedia = async (videoId: string, videoUrl: string) => {
    videoStorageService.registerMemoryUrl(videoId, videoUrl);
    setShorts((prev) => {
      const updated = prev.map((s) => (s.id === videoId ? { ...s, videoUrl } : s));
      try {
        localStorage.setItem('riseup_shorts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setVideos((prev) => {
      const updated = prev.map((v) => (v.id === videoId ? { ...v, videoUrl } : v));
      try {
        localStorage.setItem('riseup_videos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    await dbService.updateVideoUrl(videoId, videoUrl);
  };

  const deleteVideo = async (videoId: string) => {
    // 1. Permanently delete from Firestore
    await dbService.deleteVideo(videoId);

    // 2. Permanently delete binary blob from IndexedDB & memory
    await videoStorageService.deleteVideoBlob(videoId);

    // 3. Delete from backend disk storage
    try {
      await fetch(`/api/upload/video?id=${encodeURIComponent(videoId)}`, { method: 'DELETE' });
    } catch {}

    // 4. Update in-memory and local state
    setVideos((prev) => {
      const updated = prev.filter((v) => v.id !== videoId);
      try { localStorage.setItem('riseup_videos', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setShorts((prev) => {
      const updated = prev.filter((s) => s.id !== videoId);
      try { localStorage.setItem('riseup_shorts', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (selectedVideo?.id === videoId) {
      setSelectedVideo(null);
    }
  };

  // Intent Gateway Curation with Gemini API or smart semantic matcher
  const curateIntent = async (lane: LaneType, intent: string) => {
    setIsCurating(true);
    setSelectedLane(lane);
    setIntentText(intent);

    try {
      // Call server-side proxy route `/api/intent/curate`
      const res = await fetch('/api/intent/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lane, intent, availableVideos: videos }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setCuratedVideos(data.results);
          setIsCurating(false);
          return;
        }
      }
    } catch {
      // fallback smoothly to client-side semantic matching
    }

    // Client-side intelligent semantic fallback
    const matched = videos
      .filter((v) => v.category === lane || v.tags.some((t) => intent.toLowerCase().includes(t.toLowerCase())))
      .map((video, idx) => ({
        video,
        reason: `Matched "${lane}" lane and keywords in: "${intent.slice(0, 40)}..."`,
        focusScore: 95 - idx * 4,
      }));

    const finalResults = matched.length >= 3 ? matched : videos.slice(0, 5).map((video, idx) => ({
      video,
      reason: `High discipline builder signal in ${video.category}`,
      focusScore: 90 - idx * 3,
    }));

    setCuratedVideos(finalResults);
    setIsCurating(false);
  };

  // Buy digital product with tokens
  const buyProduct = (product: DigitalProduct) => {
    if (user.tokens < product.priceTokens) {
      return { success: false, message: `Insufficient tokens. You need ${product.priceTokens} Tokens (Balance: ${user.tokens}).` };
    }

    const orderId = `ord_${Date.now()}`;
    const newOrder: ProductOrder = {
      id: orderId,
      buyerId: user.id,
      productId: product.id,
      sellerId: product.creatorId,
      priceTokens: product.priceTokens,
      status: 'completed',
      purchasedAt: 'Just now',
      downloadUrl: `/downloads/${product.id}/asset.zip?token=signed_${Date.now()}`,
    };

    setUser((prev) => {
      const updated = { ...prev, tokens: prev.tokens - product.priceTokens };
      dbService.saveUser(updated);
      return updated;
    });
    setOrders((prev) => [newOrder, ...prev]);

    // Ledger debit
    const debitEntry: TokenLedgerEntry = {
      id: `ledg_${Date.now()}`,
      userId: user.id,
      delta: -product.priceTokens,
      type: 'PRODUCT_PURCHASE',
      description: `Purchased: ${product.title}`,
      idempotencyKey: `idemp_buy_${product.id}_${Date.now()}`,
      createdAt: 'Just now',
    };
    setLedger((prev) => [debitEntry, ...prev]);
    dbService.addLedgerEntry(debitEntry);
    dbService.buyProduct(user, product, `idemp_buy_${product.id}_${Date.now()}`);

    // Increment sales count on product
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, salesCount: p.salesCount + 1 } : p))
    );

    return { success: true, message: `Successfully purchased "${product.title}"!` };
  };

  const hasEntitlement = (productId: string) => {
    return orders.some((o) => o.productId === productId && o.status === 'completed');
  };

  const createProduct = (prodData: Partial<DigitalProduct>) => {
    const newProduct: DigitalProduct = {
      id: `prod_${Date.now()}`,
      creatorId: user.id,
      creatorName: user.displayName,
      creatorAvatar: user.avatar,
      title: prodData.title || 'Untitled Digital Asset',
      description: prodData.description || 'Direct architectural playbook and files.',
      category: prodData.category || 'Systems',
      priceTokens: prodData.priceTokens || 30,
      coverUrl: prodData.coverUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      fileSize: prodData.fileSize || '12.4 MB',
      format: prodData.format || 'ZIP Codebase + PDF Guide',
      salesCount: 0,
      rating: 5.0,
      features: prodData.features || ['Complete source code', 'Architecture diagram', 'Lifetime updates'],
      createdAt: 'Just now',
    };
    setProducts((prev) => [newProduct, ...prev]);
    dbService.addProduct(newProduct);
  };

  // Accountability Rooms
  const checkInRoom = (roomId: string, note?: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              currentStreak: r.hasCheckedInToday ? r.currentStreak : r.currentStreak + 1,
              todayCheckins: r.hasCheckedInToday ? r.todayCheckins : r.todayCheckins + 1,
              hasCheckedInToday: true,
            }
          : r
      )
    );

    // Update user streak
    setUser((prev) => {
      const updated = {
        ...prev,
        streakDays: prev.streakDays + 1,
        longestStreakDays: Math.max(prev.longestStreakDays, prev.streakDays + 1),
        xp: prev.xp + 50,
        tokens: prev.tokens + 2,
      };
      dbService.saveUser(updated);
      return updated;
    });

    // Post check-in message to room
    const checkinMsg: RoomMessage = {
      id: `msg_${Date.now()}`,
      roomId,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      body: note || 'Daily check-in completed. Focused on core objectives.',
      type: 'checkin',
      createdAt: 'Just now',
    };
    setRoomMessages((prev) => ({
      ...prev,
      [roomId]: [checkinMsg, ...(prev[roomId] || [])],
    }));
    dbService.sendRoomMessage(roomId, checkinMsg);

    // Add ledger entry
    const entry: TokenLedgerEntry = {
      id: `ledg_${Date.now()}`,
      userId: user.id,
      delta: 2,
      type: 'ARENA_REWARD',
      description: 'Daily Room check-in streak reward (+2 Tokens)',
      idempotencyKey: `idemp_checkin_${roomId}_${Date.now()}`,
      createdAt: 'Just now',
    };
    setLedger((prev) => [entry, ...prev]);
    dbService.addLedgerEntry(entry);
  };

  const sendRoomMessage = (roomId: string, message: string) => {
    if (!message.trim()) return;
    const msg: RoomMessage = {
      id: `msg_${Date.now()}`,
      roomId,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      body: message.trim(),
      type: 'chat',
      createdAt: 'Just now',
    };
    setRoomMessages((prev) => ({
      ...prev,
      [roomId]: [msg, ...(prev[roomId] || [])],
    }));
    dbService.sendRoomMessage(roomId, msg);
  };

  const joinRoom = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, membersCount: r.membersCount + 1 } : r))
    );
  };

  const createRoom = (roomData: Partial<AccountabilityRoom>) => {
    const newRoom: AccountabilityRoom = {
      id: `room_${Date.now()}`,
      name: roomData.name || 'New Accountability Room',
      description: roomData.description || 'Commit to daily output and build in public.',
      lane: roomData.lane || 'Engineering',
      ownerId: user.id,
      ownerName: user.displayName,
      membersCount: 1,
      currentStreak: 1,
      coverUrl: roomData.coverUrl || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
      isPrivate: roomData.isPrivate || false,
      rules: roomData.rules || ['Post daily target before 11 AM', 'Verify shipping at end of day'],
      todayCheckins: 1,
      hasCheckedInToday: true,
    };
    setRooms((prev) => [newRoom, ...prev]);
    setActiveRoomId(newRoom.id);
    dbService.addRoom(newRoom);
  };

  // Arena & Duels
  const joinChallenge = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId ? { ...c, participantsCount: c.participantsCount + 1, hasJoined: true } : c
      )
    );
  };

  const createDuel = (task: string, opponentUsername: string, stakeTokens: number) => {
    if (user.tokens < stakeTokens) return;
    const newDuel: ArenaDuel = {
      id: `duel_${Date.now()}`,
      challenger: {
        name: user.displayName,
        username: user.username,
        avatar: user.avatar,
        currentScore: 0,
      },
      opponent: {
        name: opponentUsername,
        username: opponentUsername,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        currentScore: 0,
      },
      task,
      stakeTokens,
      status: 'active',
      timeLeft: '7d 00h',
    };
    setDuels((prev) => [newDuel, ...prev]);
    dbService.addDuel(newDuel);
  };

  // Wallet & Vault
  const lockTokensInVault = (amount: number, termDays: number) => {
    if (user.tokens < amount) {
      return { success: false, message: `Insufficient tokens. Available: ${user.tokens}` };
    }
    const multiplier = termDays >= 90 ? 1.4 : termDays >= 60 ? 1.25 : 1.1;
    const newLock: VaultLock = {
      id: `vault_${Date.now()}`,
      amount,
      termDays,
      rewardMultiplier: multiplier,
      startedAt: 'Today',
      unlockAt: `In ${termDays} days`,
      status: 'active',
    };
    setUser((prev) => {
      const updated = {
        ...prev,
        tokens: prev.tokens - amount,
        lockedTokens: prev.lockedTokens + amount,
      };
      dbService.saveUser(updated);
      return updated;
    });
    setVaultLocks((prev) => [newLock, ...prev]);

    const entry: TokenLedgerEntry = {
      id: `ledg_${Date.now()}`,
      userId: user.id,
      delta: -amount,
      type: 'VAULT_LOCK',
      description: `Locked ${amount} tokens in Vault for ${termDays} days (${multiplier}x yield)`,
      idempotencyKey: `idemp_vault_${Date.now()}`,
      createdAt: 'Just now',
    };
    setLedger((prev) => [entry, ...prev]);
    dbService.createVaultLock(user.id, newLock, amount);

    return { success: true, message: `Successfully locked ${amount} Tokens for ${termDays} days!` };
  };

  const sendTip = async (creatorId: string, creatorName: string, videoId: string | null, tokens: number) => {
    if (user.tokens < tokens) return false;

    // Velocity control: max 6 tips per minute (PRD Section 10)
    if (!AbusePreventionService.checkActionVelocity(user.id, 'TIP', 6, 60000)) {
      console.warn('[AbusePrevention] Tip velocity throttled');
      return false;
    }

    const idempotencyKey = EconomyService.generateIdempotencyKey(user.id, 'TIP_SENT', `${creatorId}_${Date.now()}`);
    const res = await EconomyService.recordLedgerTransaction(
      user.id,
      -tokens,
      'TIP_SENT',
      `Sent tip of ${tokens} tokens to ${creatorName}`,
      idempotencyKey,
      user.tokens
    );

    if (!res.success) return false;

    setUser((prev) => {
      const updated = { ...prev, tokens: res.newBalance };
      dbService.saveUser(updated);
      return updated;
    });

    const entry: TokenLedgerEntry = {
      id: `ledg_${Date.now()}`,
      userId: user.id,
      delta: -tokens,
      type: 'TIP_SENT',
      description: `Sent tip of ${tokens} tokens to ${creatorName}`,
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    setLedger((prev) => [entry, ...prev]);

    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      recipientId: creatorId,
      type: 'tip',
      title: 'Tip Received!',
      message: `${user.displayName} supported you with ${tokens} Tokens.`,
      read: false,
      createdAt: 'Just now',
      actorName: user.displayName,
      actorAvatar: user.avatar,
    };
    setNotifications((prev) => [notif, ...prev]);
    dbService.addNotification(notif);
    return true;
  };

  const boostVideo = async (videoId: string, tokens: number) => {
    if (user.tokens < tokens) return false;

    const idempotencyKey = EconomyService.generateIdempotencyKey(user.id, 'BOOST_SPENT', `${videoId}_${Date.now()}`);
    const res = await EconomyService.recordLedgerTransaction(
      user.id,
      -tokens,
      'BOOST_SPENT',
      `Boosted video distribution with ${tokens} tokens`,
      idempotencyKey,
      user.tokens
    );

    if (!res.success) return false;

    setUser((prev) => {
      const updated = { ...prev, tokens: res.newBalance };
      dbService.saveUser(updated);
      return updated;
    });
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, boostTokens: (v.boostTokens || 0) + tokens } : v))
    );

    const entry: TokenLedgerEntry = {
      id: `ledg_${Date.now()}`,
      userId: user.id,
      delta: -tokens,
      type: 'BOOST_SPENT',
      description: `Boosted video distribution with ${tokens} tokens`,
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    setLedger((prev) => [entry, ...prev]);
    return true;
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    dbService.markNotificationRead(id);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notifications.forEach((n) => dbService.markNotificationRead(n.id));
  };

  const addNotification = (item: Partial<NotificationItem> & { title: string; message: string }) => {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: item.title,
      message: item.message,
      type: item.type || 'tip',
      read: false,
      createdAt: 'Just now',
      actorName: item.actorName || user.displayName || 'System',
      actorAvatar: item.actorAvatar || user.avatar,
      avatar: item.avatar || user.avatar,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  // Safety & Reports (PRD Section 13)
  const submitReport = async (
    targetType: 'video' | 'comment' | 'room' | 'creator',
    targetId: string,
    reason: any,
    details: string
  ) => {
    // Velocity control: prevent report spamming
    if (!AbusePreventionService.checkActionVelocity(user.id, 'REPORT', 5, 300000)) {
      console.warn('[AbusePrevention] Report throttled');
      return;
    }

    const targetTitle =
      targetType === 'video'
        ? videos.find((v) => v.id === targetId)?.title || shorts.find((s) => s.id === targetId)?.title || 'Video'
        : `${targetType} #${targetId}`;

    const newReport = await ModerationService.submitReport({
      reporterId: user.id,
      reporterName: user.username,
      targetType,
      targetId,
      targetTitle,
      reason,
      details,
    });

    setReports((prev) => [newReport, ...prev]);
  };

  // Video Ads & Monetization (Disabled by default so users enjoy uninterrupted real video)
  const [adsEnabled, setAdsEnabled] = useState<boolean>(false);

  const toggleAdsEnabled = () => setAdsEnabled((prev) => !prev);

  // Focus Queue & Flow Session (YouTube Queue equivalent)
  const [focusQueue, setFocusQueue] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('riseup_focus_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  const addToFocusQueue = (v: VideoItem) => {
    setFocusQueue((prev) => {
      if (prev.some((item) => item.id === v.id)) return prev;
      const next = [...prev, v];
      try { localStorage.setItem('riseup_focus_queue', JSON.stringify(next)); } catch {}
      return next;
    });
    setIsQueueOpen(true);
  };

  const removeFromFocusQueue = (videoId: string) => {
    setFocusQueue((prev) => {
      const next = prev.filter((item) => item.id !== videoId);
      try { localStorage.setItem('riseup_focus_queue', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearFocusQueue = () => {
    setFocusQueue([]);
    try { localStorage.removeItem('riseup_focus_queue'); } catch {}
  };

  const playNextInQueue = () => {
    if (focusQueue.length > 0) {
      const nextVideo = focusQueue[0];
      setSelectedVideo(nextVideo);
      removeFromFocusQueue(nextVideo.id);
    }
  };

  // Watch Later (YouTube Watch Later equivalent)
  const [watchLaterIds, setWatchLaterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('riseup_watch_later');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWatchLater = (v: VideoItem) => {
    setWatchLaterIds((prev) => {
      const exists = prev.includes(v.id);
      const next = exists ? prev.filter((id) => id !== v.id) : [...prev, v.id];
      try { localStorage.setItem('riseup_watch_later', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const isWatchLater = (videoId: string) => watchLaterIds.includes(videoId);

  const claimAdReward = async (adTitle: string = 'Sponsored Partner') => {
    const reward = 2;
    const canReward = AbusePreventionService.canClaimWatchReward(user.id, 'ad_reward');
    if (!canReward.eligible) {
      console.warn('[AbusePrevention] Ad reward capped:', canReward.reason);
      return;
    }

    const idempotencyKey = EconomyService.generateIdempotencyKey(user.id, 'AD_REWARD', `${Date.now()}`);
    const res = await EconomyService.recordLedgerTransaction(
      user.id,
      reward,
      'AD_REWARD',
      `Rewarded Ad: Watched ${adTitle} video commercial`,
      idempotencyKey,
      user.tokens
    );

    if (res.success) {
      setUser((prev) => {
        const updated = { ...prev, tokens: res.newBalance };
        dbService.saveUser(updated);
        return updated;
      });

      const entry: TokenLedgerEntry = {
        id: `ad_rew_${Date.now()}`,
        userId: user.id,
        delta: reward,
        type: 'AD_REWARD',
        description: `Rewarded Ad: Watched ${adTitle} video commercial`,
        idempotencyKey,
        createdAt: new Date().toISOString(),
      };
      setLedger((prev) => [entry, ...prev]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        searchQuery,
        setSearchQuery,
        user,
        updateUser,
        videos,
        shorts,
        selectedVideo,
        setSelectedVideo,
        activeShortId,
        setActiveShortId,
        openShort,
        likeVideo,
        saveVideo,
        likedVideoIds,
        savedVideoIds,
        recordView,
        addComment,
        comments,
        uploadVideo,
        updateVideoMedia,
        deleteVideo,
        isKeyboardShortcutsOpen,
        setIsKeyboardShortcutsOpen,
        isUploadModalOpen,
        setIsUploadModalOpen,
        openUploadModal,
        miniPlayerVideo,
        setMiniPlayerVideo,
        miniPlayerTime,
        setMiniPlayerTime,
        isMiniPlayerPlaying,
        setIsMiniPlayerPlaying,
        expandMiniPlayer,
        ambientMode,
        setAmbientMode,
        sleepTimerMinutes,
        setSleepTimer,
        clips,
        addClip,
        deleteClip,
        selectedLane,
        setSelectedLane,
        intentText,
        setIntentText,
        isCurating,
        curatedVideos,
        curateIntent,
        products,
        orders,
        buyProduct,
        hasEntitlement,
        createProduct,
        rooms,
        activeRoomId,
        setActiveRoomId,
        roomMessages,
        checkInRoom,
        sendRoomMessage,
        joinRoom,
        createRoom,
        challenges,
        duels,
        joinChallenge,
        createDuel,
        ledger,
        tokenLedger: ledger,
        vaultLocks,
        lockTokensInVault,
        sendTip,
        boostVideo,
        discipline,
        distractionBlockerEnabled,
        setDistractionBlockerEnabled,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        reports,
        submitReport,
        isModerationOpen,
        setIsModerationOpen,
        adsEnabled,
        toggleAdsEnabled,
        claimAdReward,
        focusQueue,
        addToFocusQueue,
        removeFromFocusQueue,
        clearFocusQueue,
        isQueueOpen,
        setIsQueueOpen,
        playNextInQueue,
        watchLaterIds,
        toggleWatchLater,
        isWatchLater,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
