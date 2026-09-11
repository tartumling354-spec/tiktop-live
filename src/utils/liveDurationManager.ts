// Nepal Time (NPT: UTC+05:45) Daily Live Duration Tracker
// Rule:
// 1. If a host goes live, ends/cuts the stream, and returns later the same day,
//    the live duration continues from where they left off (accumulated time today).
// 2. At 12:00 AM (Midnight) Nepal Time (00:00:00 NPT), a new day starts.
//    Previous day's accumulated time is invalidated and the timer starts freshly from 0.

export interface DailyLiveRecord {
  nepalDate: string; // YYYY-MM-DD in Asia/Kathmandu
  accumulatedSeconds: number;
  lastUpdatedTimestamp: number;
}

/**
 * Returns current date string in Nepal Time (Asia/Kathmandu: UTC+5:45) as YYYY-MM-DD
 */
export function getNepalDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Output format: YYYY-MM-DD
  } catch {
    // Robust fallback if Asia/Kathmandu is unavailable on legacy runtimes
    // Nepal is UTC + 5 hours and 45 minutes = 345 minutes
    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
    const nepalDate = new Date(utcTime + 345 * 60000);
    const year = nepalDate.getFullYear();
    const month = String(nepalDate.getMonth() + 1).padStart(2, '0');
    const day = String(nepalDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Returns current time representation in Nepal Time for display/logging
 */
export function getNepalCurrentTimeString(): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kathmandu',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString();
  }
}

const STORAGE_KEY_PREFIX = 'tiktop_daily_live_duration_';

/**
 * Gets accumulated live stream seconds for the current day (in Nepal Time).
 * If the last recorded session was before today (before 12:00 AM Nepal Time),
 * returns 0.
 */
export function getTodayLiveSeconds(userId: string = 'host'): number {
  if (typeof window === 'undefined') return 0;
  const currentNepalDate = getNepalDateString();
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 0;

    const record: DailyLiveRecord = JSON.parse(raw);
    // If the saved date matches today's Nepal date, return the accumulated seconds
    if (record.nepalDate === currentNepalDate) {
      return Math.max(0, Math.floor(record.accumulatedSeconds || 0));
    }

    // Previous day's time is not valid for today; reset to 0
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Saves current accumulated live stream seconds for today (in Nepal Time).
 */
export function saveTodayLiveSeconds(seconds: number, userId: string = 'host'): void {
  if (typeof window === 'undefined') return;
  const currentNepalDate = getNepalDateString();
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

  try {
    const record: DailyLiveRecord = {
      nepalDate: currentNepalDate,
      accumulatedSeconds: Math.max(0, Math.floor(seconds)),
      lastUpdatedTimestamp: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // Storage access fallback
  }
}

/**
 * Formats duration in seconds to "mm:ss" or "hh:mm:ss"
 */
export function formatLiveDuration(secs: number): string {
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainder = secs % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
}
