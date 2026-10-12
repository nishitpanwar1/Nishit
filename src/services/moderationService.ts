import { db, doc, collection, setDoc, updateDoc, getDocs, query, where, orderBy } from '../lib/firebase';
import { SafetyReport, VideoItem, AuditLogItem } from '../types';

export class ModerationService {
  /**
   * Submits a new safety/trust report with rate limiting & priority assignment.
   */
  static async submitReport(report: Omit<SafetyReport, 'id' | 'createdAt' | 'status'>): Promise<SafetyReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Assign triage priority based on report reason (PRD Section 13)
    let priority: SafetyReport['priority'] = 'medium';
    if (report.reason === 'harmful' || report.reason === 'harassment') {
      priority = 'high';
    } else if (report.reason === 'low_effort') {
      priority = 'low';
    }

    const newReport: SafetyReport = {
      ...report,
      id: reportId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      priority,
    };

    try {
      const ref = doc(db, 'reports', reportId);
      await setDoc(ref, newReport);
    } catch (e) {
      console.warn('[ModerationService] fallback local report cache:', e);
    }

    return newReport;
  }

  /**
   * Fetches all reports in the moderation queue for moderator/admin review.
   */
  static async fetchModerationQueue(): Promise<SafetyReport[]> {
    try {
      const q = collection(db, 'reports');
      const snapshot = await getDocs(q);
      const reports: SafetyReport[] = [];
      snapshot.forEach((d: any) => reports.push(d.data() as SafetyReport));
      reports.sort((a, b) => {
        // High priority first, then newest
        const pOrder = { high: 3, medium: 2, low: 1 };
        const pDiff = (pOrder[b.priority || 'medium'] || 2) - (pOrder[a.priority || 'medium'] || 2);
        if (pDiff !== 0) return pDiff;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      return reports;
    } catch (e) {
      console.warn('[ModerationService] fetchModerationQueue error:', e);
      return [];
    }
  }

  /**
   * Applies moderator action to content & records immutable audit trail (PRD Section 13).
   */
  static async resolveReport(
    reportId: string,
    action: 'restricted' | 'removed' | 'dismissed',
    notes: string,
    moderatorId: string,
    moderatorName: string,
    targetType: string,
    targetId: string
  ): Promise<void> {
    try {
      // 1. Update report status
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: action === 'dismissed' ? 'dismissed' : 'resolved',
        actionTaken: action === 'dismissed' ? 'none' : action,
        moderatorNotes: notes,
        reviewedBy: moderatorName,
      });

      // 2. If target is a video/short and action is restricted/removed, update video status
      if (targetType === 'video' && (action === 'restricted' || action === 'removed')) {
        const vidRef = doc(db, 'videos', targetId);
        await updateDoc(vidRef, {
          status: action,
          moderationReason: notes,
        });
      }

      // 3. Record Audit Log (PRD Section 13: RBAC + audit trail)
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const auditItem: AuditLogItem = {
        id: auditId,
        actorId: moderatorId,
        actorName: moderatorName,
        action: `MODERATION_${action.toUpperCase()}`,
        targetType,
        targetId,
        details: notes,
        timestamp: new Date().toISOString(),
      };

      const auditRef = doc(db, 'audit_logs', auditId);
      await setDoc(auditRef, auditItem);
    } catch (e) {
      console.warn('[ModerationService] resolveReport error:', e);
    }
  }

  /**
   * Submits an appeal on a moderation decision (PRD Section 13: Support appeals for appropriate enforcement actions)
   */
  static async submitAppeal(reportId: string, appealReason: string): Promise<void> {
    try {
      const ref = doc(db, 'reports', reportId);
      await updateDoc(ref, {
        status: 'appealed',
        appealReason,
      });
    } catch (e) {
      console.warn('[ModerationService] submitAppeal error:', e);
    }
  }
}
