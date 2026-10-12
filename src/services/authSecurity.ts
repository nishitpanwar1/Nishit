import { AuthSession, UserProfile } from '../types';

export class AuthSecurityService {
  private static failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
  private static sessionsStorageKey = 'riseup_active_sessions';

  /**
   * Validates username according to PRD Section 30:
   * Global unique username rules, ASCII alphanumeric, min 3, max 20 chars
   */
  static validateUsername(username: string): { valid: boolean; error?: string } {
    const trimmed = username.trim();
    if (trimmed.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
    if (trimmed.length > 20) return { valid: false, error: 'Username cannot exceed 20 characters' };
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return { valid: false, error: 'Username can only contain alphanumeric characters and underscores' };
    }
    return { valid: true };
  }

  /**
   * Password strength verification (PRD Section 4: modern password validation)
   */
  static validatePassword(password: string): { valid: boolean; score: number; feedback: string } {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (password.length < 8) {
      return { valid: false, score, feedback: 'Password must be at least 8 characters long.' };
    }

    if (score < 3) {
      return { valid: false, score, feedback: 'Password is too weak. Include numbers, uppercase letters, or symbols.' };
    }

    return { valid: true, score, feedback: 'Strong password.' };
  }

  /**
   * Rate limits login attempts and locks account if failed repeatedly (PRD Section 4: Account lock / risk)
   */
  static recordLoginAttempt(identifier: string, isSuccess: boolean): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const record = this.failedAttempts.get(identifier) || { count: 0, lockedUntil: 0 };

    if (record.lockedUntil > now) {
      const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }

    if (isSuccess) {
      this.failedAttempts.delete(identifier);
      return { allowed: true };
    }

    record.count += 1;
    if (record.count >= 5) {
      // Lock for 15 minutes
      record.lockedUntil = now + 15 * 60 * 1000;
      this.failedAttempts.set(identifier, record);
      return { allowed: false, waitSeconds: 15 * 60 };
    }

    this.failedAttempts.set(identifier, record);
    return { allowed: true };
  }

  /**
   * Retrieves active multi-device sessions for current user (PRD Section 4: Multi-device sessions)
   */
  static getActiveSessions(userId: string): AuthSession[] {
    try {
      const saved = localStorage.getItem(`${this.sessionsStorageKey}_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    const defaultSession: AuthSession = {
      id: `sess_${Date.now()}`,
      userId,
      device: navigator.platform || 'Desktop Computer',
      browser: navigator.userAgent.includes('Chrome')
        ? 'Chrome on Linux'
        : navigator.userAgent.includes('Firefox')
        ? 'Firefox'
        : 'Web Browser',
      ipPreview: '192.0.2.***',
      lastActive: 'Active Now',
      isCurrent: true,
    };

    const initial = [defaultSession];
    try {
      localStorage.setItem(`${this.sessionsStorageKey}_${userId}`, JSON.stringify(initial));
    } catch {}
    return initial;
  }

  /**
   * Revokes / logs out a specific remote session (PRD Section 4: Session theft / revocation)
   */
  static revokeSession(userId: string, sessionId: string): AuthSession[] {
    const sessions = this.getActiveSessions(userId).filter((s) => s.id !== sessionId);
    try {
      localStorage.setItem(`${this.sessionsStorageKey}_${userId}`, JSON.stringify(sessions));
    } catch {}
    return sessions;
  }
}
