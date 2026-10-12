export type LaneType = 'Finance' | 'Fitness' | 'Focus' | 'Mindset' | 'Engineering' | 'Systems';

export type UserRole = 'user' | 'creator' | 'moderator' | 'admin';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  focusLane: LaneType;
  targetDailyFocusHours: number;
  streakDays: number;
  longestStreakDays: number;
  tokens: number;
  lockedTokens: number;
  xp: number;
  isCreator: boolean;
  role?: UserRole;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  accountLocked?: boolean;
  joinedAt: string;
  privacySettings?: {
    emailVisible: boolean;
    activityVisible: boolean;
  };
}

export interface VideoRendition {
  height: 360 | 720 | 1080;
  label: '360p' | '720p' | '1080p';
  path: string;
  bytes: number;
  codec: string;
  signedUrl: string;
}

export interface VideoItem {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorUsername: string;
  title: string;
  description: string;
  category: LaneType | string;
  tags: string[];
  durationSeconds: number;
  durationFormatted: string;
  duration?: number;
  aspectRatio: '16:9' | '9:16';
  isShort: boolean;
  thumbnailUrl: string;
  videoUrl: string;
  viewsCount: number;
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  createdAt: string;
  status: 'published' | 'processing' | 'draft' | 'under_review' | 'restricted' | 'removed';
  isLearning: boolean; // Classified as educational/discipline builder content vs passive scrolling
  renditions: VideoRendition[];
  boostTokens?: number;
  aiTakeaways?: string[];
  moderationReason?: string;
  chapters?: VideoChapter[];
  transcript?: TranscriptLine[];
  audioTitle?: string;
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  thumbnailUrl?: string;
}

export interface TranscriptLine {
  id: string;
  startTime: number;
  text: string;
}

export interface VideoClip {
  id: string;
  videoId: string;
  videoTitle: string;
  creatorName: string;
  creatorAvatar: string;
  clipTitle: string;
  startTime: number;
  endTime: number;
  createdAt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface CommentItem {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  body: string;
  createdAt: string;
  likes: number;
}

export interface DigitalProduct {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  description: string;
  category: LaneType | string;
  priceTokens: number;
  coverUrl: string;
  fileSize: string;
  format: string;
  salesCount: number;
  rating: number;
  features: string[];
  createdAt: string;
  thumbnailUrl?: string;
  type?: 'codebase' | 'blueprint' | 'notion_template' | 'course' | 'mentorship' | string;
  priceUsd?: number;
  downloadUrl?: string;
  reviewsCount?: number;
  ratingCount?: number;
}

export interface ProductOrder {
  id: string;
  buyerId: string;
  productId: string;
  sellerId: string;
  priceTokens: number;
  status: 'completed' | 'refunded';
  purchasedAt: string;
  downloadUrl: string;
}

export interface TokenLedgerEntry {
  id: string;
  userId: string;
  delta: number;
  type:
    | 'EARN_VIEW'
    | 'EARN_PUBLISH'
    | 'AD_REWARD'
    | 'EARN_DAILY'
    | 'TIP_SENT'
    | 'TIP_RECEIVED'
    | 'BOOST_SPENT'
    | 'PRODUCT_PURCHASE'
    | 'PRODUCT_SALE'
    | 'VAULT_LOCK'
    | 'VAULT_UNLOCK'
    | 'ARENA_REWARD';
  description: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface VaultLock {
  id: string;
  userId?: string;
  amount: number;
  termDays: number;
  rewardMultiplier: number;
  startedAt: string;
  unlockAt: string;
  status: 'active' | 'matured' | 'withdrawn';
}

export interface AccountabilityRoom {
  id: string;
  name: string;
  description: string;
  lane: LaneType;
  ownerId: string;
  ownerName: string;
  membersCount: number;
  currentStreak: number;
  coverUrl: string;
  isPrivate: boolean;
  rules: string[];
  todayCheckins: number;
  hasCheckedInToday?: boolean;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  userName?: string;
  senderAvatar: string;
  body: string;
  type: 'chat' | 'checkin';
  createdAt: string;
  timestamp?: string;
}

export interface ArenaChallenge {
  id: string;
  title: string;
  description: string;
  category: LaneType;
  participantsCount: number;
  prizePoolTokens: number;
  daysRemaining: number;
  endsAt: string;
  rules: string[];
  hasJoined?: boolean;
  topBuilder: {
    username: string;
    avatar: string;
    score: number;
  };
}

export interface ArenaDuel {
  id: string;
  challenger: {
    name: string;
    username: string;
    avatar: string;
    currentScore: number;
  };
  opponent: {
    name: string;
    username: string;
    avatar: string;
    currentScore: number;
  };
  task: string;
  stakeTokens: number;
  status: 'active' | 'concluded';
  timeLeft: string;
}

export interface DisciplineMetrics {
  totalMinutesWatched: number;
  learningMinutes: number;
  passiveMinutes: number;
  learningRatio: number; // e.g. 82%
  streakDays: number;
  longestStreakDays: number;
  dailyGoalProgress: number; // percentage
  weeklyBreakdown: { day: string; learningMin: number; passiveMin: number }[];
  categoryBreakdown: { category: LaneType; minutes: number }[];
}

export interface NotificationItem {
  id: string;
  recipientId?: string;
  type: 'tip' | 'checkin' | 'duel' | 'comment' | 'follow' | 'room';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  avatar?: string;
  actorName?: string;
  actorAvatar?: string;
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: 'video' | 'comment' | 'room' | 'creator';
  targetId: string;
  targetTitle?: string;
  reason: 'spam' | 'misleading' | 'harmful' | 'harassment' | 'copyright' | 'low_effort';
  details: string;
  createdAt: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed' | 'appealed';
  priority?: 'low' | 'medium' | 'high';
  moderatorNotes?: string;
  reviewedBy?: string;
  actionTaken?: 'none' | 'warning' | 'restricted' | 'removed';
  appealReason?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ipPreview: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface EconomyReconciliationReport {
  timestamp: string;
  isConsistent: boolean;
  calculatedBalance: number;
  actualBalance: number;
  discrepancy: number;
  ledgerEntriesCount: number;
  status: 'healthy' | 'anomaly_detected';
  reconciledBy?: string;
}

export interface FeatureKillSwitches {
  aiGenerationEnabled: boolean;
  economyRewardsEnabled: boolean;
  liveStreamingEnabled: boolean;
  publicUploadsEnabled: boolean;
}

export interface SystemHealthStatus {
  apiHealth: 'healthy' | 'degraded' | 'down';
  dbHealth: 'healthy' | 'degraded' | 'down';
  storageHealth: 'healthy' | 'degraded';
  walletHealth: 'healthy' | 'anomaly';
  activeKillSwitches: FeatureKillSwitches;
  errorRatePercent: number;
  lastBackupTime: string;
  rtoMinutes: number;
  rpoMinutes: number;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
  ipPreview?: string;
}
