/**
 * TikTop Inbox Security & Compliance Warnings Service
 * Handles live violations, camera absent notices, and inbox records
 */

export interface SystemInboxNotice {
  id: string;
  type: 'live_face_absent' | 'system_security' | 'reward' | 'recharge';
  title: string;
  message: string;
  nepaliTitle: string;
  nepaliMessage: string;
  timestamp: number;
  timeString: string;
  read: boolean;
  severity: 'warning' | 'critical' | 'info';
}

const INBOX_NOTICES_KEY = 'tiktop_system_inbox_notices';

export function getStoredInboxNotices(): SystemInboxNotice[] {
  try {
    const raw = localStorage.getItem(INBOX_NOTICES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return [];
}

export function saveInboxNotice(notice: Omit<SystemInboxNotice, 'id' | 'timestamp' | 'timeString' | 'read'>): SystemInboxNotice {
  const existing = getStoredInboxNotices();
  const newNotice: SystemInboxNotice = {
    ...notice,
    id: `notice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };

  // Avoid flooding: if the last notice of same type was within 15 seconds, don't duplicate
  if (existing.length > 0) {
    const last = existing[0];
    if (last.type === notice.type && Date.now() - last.timestamp < 15000) {
      return last;
    }
  }

  const updated = [newNotice, ...existing].slice(0, 30);
  try {
    localStorage.setItem(INBOX_NOTICES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return newNotice;
}

export function markAllNoticesAsRead(): void {
  try {
    const existing = getStoredInboxNotices();
    const updated = existing.map((n) => ({ ...n, read: true }));
    localStorage.setItem(INBOX_NOTICES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}
