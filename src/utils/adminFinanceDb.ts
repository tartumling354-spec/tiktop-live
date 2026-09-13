import { RechargeClaim, RegisteredAccount } from '../types';
import {
  getAllRechargeClaims,
  updateRechargeClaimStatus,
  saveRechargeClaim,
  getAdminWhatsAppPhone,
} from './rechargeVerificationDb';
import { getRegisteredAccounts } from './authDb';
import { saveInboxNotice } from './inboxNotices';

export interface AdminWithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  grossUSD: number;
  taxUSD?: number;
  taxPercent?: number;
  netUSD: number;
  amountFormatted: string;
  currency: string;
  country: string;
  paymentMethod: string;
  method?: string;
  accountNumber: string;
  accountName: string;
  bankName?: string;
  status: 'pending' | 'completed' | 'rejected';
  timestamp: string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface UserBalanceRecord {
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar?: string;
  email?: string;
  phone?: string;
  coins: number;
  points: number;
  role: 'admin' | 'creator' | 'host' | 'user';
  lastActive?: string;
}

const WITHDRAWAL_REQUESTS_KEY = 'tiktop_withdrawal_requests_db';
const ALL_USER_BALANCES_KEY = 'tiktop_all_user_balances_db';
const ADMIN_AUTH_SESSION_KEY = 'tiktop_admin_authenticated_session';
const ADMIN_MASTER_PIN_KEY = 'tiktop_admin_master_pin';

export const DEFAULT_MASTER_PIN = '2m2du6hkx9';

/**
 * Check if the active user or account is recognized as an Admin
 */
export function isUserAdminAuthorized(
  user?: { email?: string; phone?: string; id?: string; name?: string; handle?: string } | null
): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase();
  const phone = (user.phone || '').replace(/[^0-9]/g, '');
  const id = (user.id || '').toUpperCase();
  const name = (user.name || '').toLowerCase();

  // Matches owner credentials
  if (email === 'tartumling354@gmail.com') return true;
  if (phone.includes('989863991384') || phone.includes('9863991384')) return true;
  if (id === 'USR-35400') return true;
  if (name.includes('tar tumling') || name.includes('shambu lamsal')) return true;

  return false;
}

/**
 * Verify admin passcode / PIN (Master PIN: 2m2du6hkx9, completely confidential)
 */
export function verifyAdminPin(pinInput: string): boolean {
  const cleanInput = (pinInput || '').trim();
  // Remove legacy obsolete pins from storage if present
  try {
    const savedPin = localStorage.getItem(ADMIN_MASTER_PIN_KEY);
    if (savedPin === '9898' || savedPin === '3540') {
      localStorage.removeItem(ADMIN_MASTER_PIN_KEY);
    }
  } catch {
    // Ignore
  }

  const currentPin = localStorage.getItem(ADMIN_MASTER_PIN_KEY) || DEFAULT_MASTER_PIN;
  const isValid = cleanInput === DEFAULT_MASTER_PIN || cleanInput === currentPin;
  if (isValid) {
    try {
      sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, 'true');
    } catch {
      // Ignore
    }
  }
  return isValid;
}

/**
 * Check if admin session is currently authenticated
 */
export function isAdminSessionActive(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * End admin session
 */
export function endAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Get all withdrawal requests with initial seed data if empty
 */
export function getAllWithdrawalRequests(): AdminWithdrawalRequest[] {
  try {
    const raw = localStorage.getItem(WITHDRAWAL_REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallthrough to seeds
  }

  // Initial seed requests for realistic admin experience
  const seedWithdrawals: AdminWithdrawalRequest[] = [
    {
      id: 'WD-849201',
      userId: 'USR-84920',
      userName: 'Roshan Adhikari',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      points: 500000,
      grossUSD: 5.0,
      taxUSD: 0.4,
      taxPercent: 8,
      netUSD: 4.6,
      amountFormatted: '$4.60 USD (रू 611 NPR)',
      currency: 'USD',
      country: 'Nepal',
      paymentMethod: 'eSewa (+977 9841234567)',
      method: 'eSewa',
      accountNumber: '9841234567',
      accountName: 'Roshan Adhikari',
      status: 'pending',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toLocaleString(),
    },
    {
      id: 'WD-992015',
      userId: 'USR-99201',
      userName: 'Nepal Live Star',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      points: 2500000,
      grossUSD: 25.0,
      taxUSD: 2.0,
      taxPercent: 8,
      netUSD: 23.0,
      amountFormatted: '$23.00 USD (रू 3,059 NPR)',
      currency: 'USD',
      country: 'Nepal',
      paymentMethod: 'Nabil Bank (A/C: 0192837465019)',
      method: 'Nabil Bank',
      accountNumber: '0192837465019',
      accountName: 'Sita Devi Sharma',
      bankName: 'Nabil Bank Ltd. (Kathmandu)',
      status: 'pending',
      timestamp: new Date(Date.now() - 150 * 60 * 1000).toLocaleString(),
    },
    {
      id: 'WD-738192',
      userId: 'USR-48192',
      userName: 'Bikram Thapa',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      points: 1000000,
      grossUSD: 10.0,
      taxUSD: 0.8,
      taxPercent: 8,
      netUSD: 9.2,
      amountFormatted: '$9.20 USD',
      currency: 'USD',
      country: 'Nepal',
      paymentMethod: 'Khalti (+977 9810998877)',
      method: 'Khalti',
      accountNumber: '9810998877',
      accountName: 'Bikram Thapa',
      status: 'completed',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toLocaleString(),
      processedAt: new Date(Date.now() - 22 * 3600 * 1000).toLocaleString(),
    },
  ];

  try {
    localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(seedWithdrawals));
  } catch {
    // Ignore
  }
  return seedWithdrawals;
}

/**
 * Save new withdrawal request (Strictly PENDING approval)
 */
export function saveWithdrawalRequest(request: AdminWithdrawalRequest): void {
  const current = getAllWithdrawalRequests();
  const updated = [request, ...current.filter((r) => r.id !== request.id)];
  try {
    localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

/**
 * Admin action on withdrawal request: approve (mark paid) or reject (refund points)
 */
export function adminProcessWithdrawal(
  requestId: string,
  newStatus: 'completed' | 'rejected',
  rejectionReason?: string,
  onRefundPoints?: (points: number) => void
): AdminWithdrawalRequest | null {
  const requests = getAllWithdrawalRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  const target = requests[index];
  target.status = newStatus;
  target.processedAt = new Date().toLocaleString();

  if (newStatus === 'rejected') {
    target.rejectionReason = rejectionReason || 'खाता विवरण नमिलेको / एडमिनद्वारा अस्वीकृत';

    // 1. Refund points to local storage if it's the current user
    try {
      const savedPoints = parseInt(localStorage.getItem('tiktop_points') || '0', 10);
      const refunded = savedPoints + target.points;
      localStorage.setItem('tiktop_points', refunded.toString());
      if (onRefundPoints) onRefundPoints(target.points);
    } catch {
      // Ignore
    }

    // 2. Refund points in all users balance DB
    refundPointsToUserBalance(target.userId, target.points);

    // 3. Send inbox notice
    saveInboxNotice({
      type: 'recharge',
      title: 'Withdrawal Rejected (Refunded)',
      nepaliTitle: '❌ Points निकासी अस्वीकृत र फिर्ता भयो',
      message: `Your withdrawal request (${target.id}) of ${target.amountFormatted} was rejected. Reason: ${target.rejectionReason}. ${target.points.toLocaleString()} Points have been returned to your wallet.`,
      nepaliMessage: `तपाईंको निकासी अनुरोध (${target.id}) अस्वीकृत गरियो। कारण: ${target.rejectionReason}। तपाईंको ${target.points.toLocaleString()} Points खातामा फिर्ता गरिएको छ।`,
      severity: 'warning',
    });
  } else if (newStatus === 'completed') {
    saveInboxNotice({
      type: 'recharge',
      title: 'Withdrawal Payout Approved',
      nepaliTitle: '🎉 निकासी भुक्तानी सम्पन्न भयो!',
      message: `Your withdrawal of ${target.amountFormatted} (${target.points.toLocaleString()} Points) via ${target.paymentMethod} has been approved and transferred by Admin.`,
      nepaliMessage: `तपाईंको ${target.amountFormatted} को निकासी भुक्तानी स्वीकृत भई तपाईंको ${target.paymentMethod} खातामा रकम पठाइएको छ!`,
      severity: 'info',
    });
  }

  try {
    localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(requests));
  } catch {
    // Ignore
  }

  return target;
}

/**
 * Delete a single withdrawal request by ID
 */
export function deleteWithdrawalRequest(requestId: string): boolean {
  const requests = getAllWithdrawalRequests();
  const filtered = requests.filter((r) => r.id !== requestId);
  if (filtered.length === requests.length) return false;
  try {
    localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear completed/rejected withdrawal history or all history
 */
export function clearWithdrawalRequestsHistory(mode: 'completed_rejected' | 'all' = 'completed_rejected'): number {
  const requests = getAllWithdrawalRequests();
  let remaining: AdminWithdrawalRequest[] = [];
  if (mode === 'completed_rejected') {
    remaining = requests.filter((r) => r.status === 'pending');
  } else {
    remaining = [];
  }
  const deletedCount = requests.length - remaining.length;
  try {
    localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(remaining));
  } catch {
    // Ignore
  }
  return deletedCount;
}

/**
 * Get all seed recharge claims if none exist in localStorage
 */
export function ensureInitialRechargeClaims(): RechargeClaim[] {
  const existing = getAllRechargeClaims();
  if (existing.length > 0) return existing;

  const seedClaims: RechargeClaim[] = [
    {
      id: 'RC-993821',
      userId: 'USR-84920',
      userName: 'Roshan Adhikari',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      countryCode: 'NP',
      countryName: 'Nepal (नेपाल)',
      methodId: 'esewa',
      methodName: 'eSewa Official Wallet',
      targetAccount: '+977 9863991384 (Shambu Lamsal)',
      usdAmount: 50,
      localAmount: 6500,
      currencySymbol: 'रू',
      coins: 5000,
      senderAccount: '9841234567 (Roshan)',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'pending', // PENDING APPROVAL
      submittedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'RC-772109',
      userId: 'USR-61920',
      userName: 'Sunita Sharma',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      countryCode: 'NP',
      countryName: 'Nepal (नेपाल)',
      methodId: 'khalti',
      methodName: 'Khalti Official Wallet',
      targetAccount: '+977 9810465055 (Shambu Lamsal)',
      usdAmount: 10,
      localAmount: 1300,
      currencySymbol: 'रू',
      coins: 1000,
      senderAccount: '9810443322 (Sunita)',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'pending', // PENDING APPROVAL
      submittedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    },
    {
      id: 'RC-551029',
      userId: 'USR-48192',
      userName: 'Bikram Thapa',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      countryCode: 'NP',
      countryName: 'Nepal (नेपाल)',
      methodId: 'bank_np',
      methodName: 'Nabil Bank Ltd.',
      targetAccount: '04110017507343 (Shambu Lamsal)',
      usdAmount: 100,
      localAmount: 13000,
      currencySymbol: 'रू',
      coins: 10000,
      senderAccount: '041299881122',
      paymentDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'verified',
      submittedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString(),
    },
  ];

  for (const claim of seedClaims) {
    saveRechargeClaim(claim);
  }
  return getAllRechargeClaims();
}

/**
 * Retrieve user balances (को सँग कति Coins र Points छ)
 */
export function getAllUserBalances(
  currentUser?: { id?: string; name?: string; handle?: string; avatar?: string; email?: string; phone?: string } | null,
  currentUserCoins?: number,
  currentUserPoints?: number
): UserBalanceRecord[] {
  let balanceMap: Record<string, { coins: number; points: number }> = {};
  try {
    const raw = localStorage.getItem(ALL_USER_BALANCES_KEY);
    if (raw) {
      balanceMap = JSON.parse(raw);
    }
  } catch {
    // Ignore
  }

  // Get all registered accounts
  const registeredAccounts: RegisteredAccount[] = getRegisteredAccounts();

  // Known community creators & mock users
  const defaultDirectory: UserBalanceRecord[] = [
    {
      userId: currentUser?.id || 'USR-35400',
      userName: currentUser?.name || 'tar tumling',
      userHandle: currentUser?.handle || '@tartumling354',
      userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      email: currentUser?.email || 'tartumling354@gmail.com',
      phone: currentUser?.phone || '+977 989863991384',
      coins: currentUserCoins !== undefined ? currentUserCoins : parseInt(localStorage.getItem('tiktop_coins') || '1500', 10),
      points: currentUserPoints !== undefined ? currentUserPoints : parseInt(localStorage.getItem('tiktop_points') || '12500', 10),
      role: 'admin',
      lastActive: 'सक्रिय (Active Now)',
    },
    {
      userId: 'USR-84920',
      userName: 'Roshan Adhikari',
      userHandle: '@roshan_np',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      phone: '+977 9841234567',
      coins: balanceMap['USR-84920']?.coins ?? 4500,
      points: balanceMap['USR-84920']?.points ?? 320000,
      role: 'creator',
      lastActive: '१५ मिनेट अघि',
    },
    {
      userId: 'USR-99201',
      userName: 'Nepal Live Star',
      userHandle: '@nepallivestar',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      email: 'nepallivestar@gmail.com',
      coins: balanceMap['USR-99201']?.coins ?? 12000,
      points: balanceMap['USR-99201']?.points ?? 850000,
      role: 'host',
      lastActive: '१ घण्टा अघि',
    },
    {
      userId: 'USR-61920',
      userName: 'Sunita Sharma',
      userHandle: '@sunita_sharma',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phone: '+977 9810443322',
      coins: balanceMap['USR-61920']?.coins ?? 800,
      points: balanceMap['USR-61920']?.points ?? 95000,
      role: 'user',
      lastActive: '३० मिनेट अघि',
    },
    {
      userId: 'USR-48192',
      userName: 'Bikram Thapa',
      userHandle: '@bikram_thapa',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      phone: '+977 9810998877',
      coins: balanceMap['USR-48192']?.coins ?? 6200,
      points: balanceMap['USR-48192']?.points ?? 180000,
      role: 'creator',
      lastActive: '२ घण्टा अघि',
    },
    {
      userId: 'USR-11029',
      userName: 'Aayush Nepal',
      userHandle: '@aayush_live',
      userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      coins: balanceMap['USR-11029']?.coins ?? 2500,
      points: balanceMap['USR-11029']?.points ?? 45000,
      role: 'user',
      lastActive: 'हिजो',
    },
  ];

  // Include other registered accounts if any
  for (const acc of registeredAccounts) {
    if (!defaultDirectory.some((d) => d.userId === acc.id || d.email === acc.email)) {
      defaultDirectory.push({
        userId: acc.id,
        userName: acc.name,
        userHandle: acc.handle,
        userAvatar: acc.avatar,
        email: acc.email,
        phone: acc.phone,
        coins: balanceMap[acc.id]?.coins ?? 500,
        points: balanceMap[acc.id]?.points ?? 10000,
        role: 'user',
        lastActive: 'हालै दर्ता',
      });
    }
  }

  return defaultDirectory;
}

/**
 * Refund points to specific user balance
 */
export function refundPointsToUserBalance(userId: string, points: number): void {
  try {
    const raw = localStorage.getItem(ALL_USER_BALANCES_KEY);
    const balanceMap: Record<string, { coins: number; points: number }> = raw ? JSON.parse(raw) : {};
    if (!balanceMap[userId]) {
      balanceMap[userId] = { coins: 0, points: 0 };
    }
    balanceMap[userId].points += points;
    localStorage.setItem(ALL_USER_BALANCES_KEY, JSON.stringify(balanceMap));
  } catch {
    // Ignore
  }
}

/**
 * Credit coins to specific user balance when admin approves recharge
 */
export function creditCoinsToUserBalance(userId: string, coins: number): void {
  try {
    const raw = localStorage.getItem(ALL_USER_BALANCES_KEY);
    const balanceMap: Record<string, { coins: number; points: number }> = raw ? JSON.parse(raw) : {};
    if (!balanceMap[userId]) {
      balanceMap[userId] = { coins: 0, points: 0 };
    }
    balanceMap[userId].coins += coins;
    localStorage.setItem(ALL_USER_BALANCES_KEY, JSON.stringify(balanceMap));
  } catch {
    // Ignore
  }
}

/**
 * Admin manually adjust coins or points for any user
 */
export function adminAdjustUserBalance(
  userId: string,
  type: 'coins' | 'points',
  delta: number,
  isCurrentActiveUser?: boolean,
  onUpdateCurrentUserCoins?: (c: number) => void,
  onUpdateCurrentUserPoints?: (p: number) => void
): void {
  try {
    const raw = localStorage.getItem(ALL_USER_BALANCES_KEY);
    const balanceMap: Record<string, { coins: number; points: number }> = raw ? JSON.parse(raw) : {};
    if (!balanceMap[userId]) {
      balanceMap[userId] = { coins: 0, points: 0 };
    }
    if (type === 'coins') {
      balanceMap[userId].coins = Math.max(0, balanceMap[userId].coins + delta);
      if (isCurrentActiveUser) {
        const cur = parseInt(localStorage.getItem('tiktop_coins') || '0', 10);
        const next = Math.max(0, cur + delta);
        localStorage.setItem('tiktop_coins', next.toString());
        if (onUpdateCurrentUserCoins) onUpdateCurrentUserCoins(next);
      }
    } else {
      balanceMap[userId].points = Math.max(0, balanceMap[userId].points + delta);
      if (isCurrentActiveUser) {
        const cur = parseInt(localStorage.getItem('tiktop_points') || '0', 10);
        const next = Math.max(0, cur + delta);
        localStorage.setItem('tiktop_points', next.toString());
        if (onUpdateCurrentUserPoints) onUpdateCurrentUserPoints(next);
      }
    }
    localStorage.setItem(ALL_USER_BALANCES_KEY, JSON.stringify(balanceMap));
  } catch {
    // Ignore
  }
}
