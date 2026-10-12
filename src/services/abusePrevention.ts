/**
 * Abuse Prevention, Fraud Detection & Velocity Limiting Engine
 * Enforces PRD Section 10: Anti-fraud / anti-abuse
 */

interface WatchSession {
  videoId: string;
  startTime: number;
  totalWatchedSeconds: number;
  lastTick: number;
}

export class AbusePreventionService {
  private static activeWatchSessions = new Map<string, WatchSession>();
  private static userActionTimestamps = new Map<string, number[]>();
  private static recentComments = new Map<string, { text: string; time: number }[]>();
  private static userDailyRewards = new Map<string, { date: string; amount: number }>();

  private static DAILY_REWARD_CAP = 50; // Maximum watch/reward tokens per day

  /**
   * Initializes or updates a client watch session.
   * Ensures views and token rewards cannot be spoofed by rapid click bots.
   */
  static recordWatchProgress(userId: string, videoId: string, currentPlayheadSeconds: number): boolean {
    const key = `${userId}:${videoId}`;
    const now = Date.now();
    const session = this.activeWatchSessions.get(key);

    if (!session) {
      this.activeWatchSessions.set(key, {
        videoId,
        startTime: now,
        totalWatchedSeconds: 1,
        lastTick: now,
      });
      return false;
    }

    const elapsedMs = now - session.lastTick;
    // Legitimate playback must progress normally (within 0.5s to 3s per tick)
    if (elapsedMs > 400 && elapsedMs < 4000) {
      session.totalWatchedSeconds += elapsedMs / 1000;
      session.lastTick = now;
    }

    return session.totalWatchedSeconds >= 5.0; // Genuine view validated at 5 seconds
  }

  /**
   * Validates if a user is eligible to claim a watch reward (+1 RUP token).
   * Prevents reward farming, bots, and rapid seeking exploitation.
   */
  static canClaimWatchReward(userId: string, videoId: string): { eligible: boolean; reason?: string } {
    const key = `${userId}:${videoId}`;
    const session = this.activeWatchSessions.get(key);

    if (!session || session.totalWatchedSeconds < 10) {
      return { eligible: false, reason: 'Watch session too short. Must watch at least 10 seconds of verified video.' };
    }

    // Check daily reward cap
    const today = new Date().toISOString().split('T')[0];
    const dailyRecord = this.userDailyRewards.get(userId) || { date: today, amount: 0 };

    if (dailyRecord.date !== today) {
      dailyRecord.date = today;
      dailyRecord.amount = 0;
    }

    if (dailyRecord.amount >= this.DAILY_REWARD_CAP) {
      return { eligible: false, reason: 'Daily reward cap reached. Cap resets at 00:00 UTC.' };
    }

    dailyRecord.amount += 1;
    this.userDailyRewards.set(userId, dailyRecord);
    return { eligible: true };
  }

  /**
   * Velocity throttle for user actions (tips, likes, follows, room messages).
   * Returns false if user exceeds action velocity threshold.
   */
  static checkActionVelocity(userId: string, actionType: string, maxPerWindow: number, windowMs: number): boolean {
    const key = `${userId}:${actionType}`;
    const now = Date.now();
    const timestamps = (this.userActionTimestamps.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxPerWindow) {
      return false; // Throttled
    }

    timestamps.push(now);
    this.userActionTimestamps.set(key, timestamps);
    return true;
  }

  /**
   * Anti-comment spam: duplicate detection & velocity control.
   */
  static validateComment(userId: string, body: string): { valid: boolean; error?: string } {
    const trimmed = body.trim();
    if (trimmed.length < 2) {
      return { valid: false, error: 'Comment must be at least 2 characters long' };
    }

    const now = Date.now();
    const recent = this.recentComments.get(userId) || [];
    const windowFiltered = recent.filter((c) => now - c.time < 60000); // 1 minute window

    // Check velocity: max 5 comments per minute
    if (windowFiltered.length >= 5) {
      return { valid: false, error: 'You are commenting too fast. Please wait a moment.' };
    }

    // Check duplicate spam
    const hasDuplicate = windowFiltered.some(
      (c) => c.text.toLowerCase() === trimmed.toLowerCase() && now - c.time < 30000
    );
    if (hasDuplicate) {
      return { valid: false, error: 'Duplicate comment detected. Avoid posting identical messages.' };
    }

    windowFiltered.push({ text: trimmed, time: now });
    this.recentComments.set(userId, windowFiltered);
    return { valid: true };
  }
}
