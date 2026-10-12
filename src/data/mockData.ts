import {
  UserProfile,
  VideoItem,
  DigitalProduct,
  AccountabilityRoom,
  ArenaChallenge,
  ArenaDuel,
  DisciplineMetrics,
  TokenLedgerEntry,
  NotificationItem,
} from '../types';

export const CURRENT_USER: UserProfile = {
  id: 'usr_me',
  username: 'nshtpanwar',
  displayName: 'Nisheet Panwar',
  avatar: typeof window !== 'undefined' ? localStorage.getItem('riseup_user_avatar') || '' : '',
  bio: 'Systems Engineer & Builder. Building and documenting production architectures on RiseUp.',
  focusLane: 'Engineering',
  targetDailyFocusHours: 4,
  streakDays: 0,
  longestStreakDays: 0,
  tokens: 0,
  lockedTokens: 0,
  xp: 0,
  isCreator: true,
  joinedAt: 'Today',
};

export const INITIAL_VIDEOS: VideoItem[] = [];

export const INITIAL_SHORTS: VideoItem[] = [];

export const INITIAL_PRODUCTS: DigitalProduct[] = [];

export const INITIAL_ROOMS: AccountabilityRoom[] = [];

export const INITIAL_CHALLENGES: ArenaChallenge[] = [];

export const INITIAL_DUELS: ArenaDuel[] = [];

export const INITIAL_DISCIPLINE: DisciplineMetrics = {
  totalMinutesWatched: 0,
  learningMinutes: 0,
  passiveMinutes: 0,
  learningRatio: 0,
  streakDays: 0,
  longestStreakDays: 0,
  dailyGoalProgress: 0,
  weeklyBreakdown: [
    { day: 'Mon', learningMin: 0, passiveMin: 0 },
    { day: 'Tue', learningMin: 0, passiveMin: 0 },
    { day: 'Wed', learningMin: 0, passiveMin: 0 },
    { day: 'Thu', learningMin: 0, passiveMin: 0 },
    { day: 'Fri', learningMin: 0, passiveMin: 0 },
    { day: 'Sat', learningMin: 0, passiveMin: 0 },
    { day: 'Sun', learningMin: 0, passiveMin: 0 },
  ],
  categoryBreakdown: [],
};

export const INITIAL_LEDGER: TokenLedgerEntry[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
