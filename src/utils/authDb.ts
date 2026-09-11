import { RegisteredAccount, AuthUser, UserProfile } from '../types';

const DB_KEY = 'tiktop_registered_users_db';

// Initial default registered accounts for seamless testing
const SEED_ACCOUNTS: RegisteredAccount[] = [
  {
    id: 'USR-35400',
    name: 'tar tumling',
    handle: '@tartumling354',
    email: 'tartumling354@gmail.com',
    provider: 'google',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    bio: 'Official TikTop Live Creator 🌟 (Tumlingtar)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'USR-84920',
    name: 'Roshan Adhikari',
    handle: '@roshan_np',
    phone: '+977 9841234567',
    password: 'password123',
    provider: 'phone',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Live Music & Gaming Streamer 🎸',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'USR-99201',
    name: 'Nepal Live Star',
    handle: '@nepallivestar',
    provider: 'facebook',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    bio: 'Nepal Official Community Host 🇳🇵',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Get all registered accounts from localStorage
 */
export const getRegisteredAccounts = (): RegisteredAccount[] => {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON errors
  }

  // Seed default accounts if database is empty
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_ACCOUNTS));
  } catch {
    // Ignore storage errors
  }
  return SEED_ACCOUNTS;
};

/**
 * Save or update a registered account in localStorage
 */
export const saveRegisteredAccount = (account: RegisteredAccount): RegisteredAccount[] => {
  const all = getRegisteredAccounts();
  const normalizedPhone = account.phone?.replace(/\s+/g, '');
  
  const filtered = all.filter((u) => {
    if (u.id === account.id) return false;
    if (account.email && u.email?.toLowerCase() === account.email.toLowerCase()) return false;
    if (normalizedPhone && u.phone?.replace(/\s+/g, '') === normalizedPhone) return false;
    if (account.provider === 'facebook' && u.provider === 'facebook' && u.name.toLowerCase() === account.name.toLowerCase()) return false;
    return true;
  });

  const updated = [account, ...filtered];
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
};

/**
 * Update an existing registered account's profile details (name, handle, bio, avatar) in the database
 */
export const updateRegisteredAccount = (
  accountId: string,
  updates: Partial<RegisteredAccount>
): RegisteredAccount[] => {
  const all = getRegisteredAccounts();
  const updated = all.map((account) => {
    if (account.id === accountId) {
      return {
        ...account,
        ...updates,
      };
    }
    return account;
  });

  try {
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
};

/**
 * Find registered account by Google email
 */
export const findAccountByGoogleEmail = (email: string): RegisteredAccount | undefined => {
  const all = getRegisteredAccounts();
  const target = email.trim().toLowerCase();
  return all.find((u) => u.email?.trim().toLowerCase() === target);
};

/**
 * Find registered account by User ID (e.g. USR-35400) or handle (@username)
 */
export const findAccountByIdOrHandle = (query: string): RegisteredAccount | undefined => {
  const all = getRegisteredAccounts();
  const clean = query.trim().toLowerCase();
  return all.find(
    (u) =>
      u.id.toLowerCase() === clean ||
      u.handle.toLowerCase() === clean ||
      `@${u.handle.toLowerCase().replace(/^@/, '')}` === clean
  );
};

/**
 * Find registered account by Facebook name
 */
export const findAccountByFacebookName = (name: string): RegisteredAccount | undefined => {
  const all = getRegisteredAccounts();
  const target = name.trim().toLowerCase();
  return all.find((u) => u.provider === 'facebook' && u.name.trim().toLowerCase() === target);
};

/**
 * Find registered account by phone number
 */
export const findAccountByPhone = (phone: string): RegisteredAccount | undefined => {
  const all = getRegisteredAccounts();
  const target = phone.replace(/[^0-9+]/g, '');
  return all.find((u) => {
    if (!u.phone) return false;
    const cleanUPhone = u.phone.replace(/[^0-9+]/g, '');
    return cleanUPhone === target || cleanUPhone.endsWith(target.slice(-10));
  });
};

/**
 * Convert RegisteredAccount to AuthUser and UserProfile
 */
export const accountToAuthAndProfile = (
  account: RegisteredAccount
): { authUser: AuthUser; userProfile: UserProfile } => {
  const authUser: AuthUser = {
    id: account.id,
    name: account.name,
    handle: account.handle,
    avatar: account.avatar,
    bio: account.bio || 'TikTop Live Creator 🌟',
    email: account.email,
    phone: account.phone,
    provider: account.provider,
    createdAt: account.createdAt,
  };

  const userProfile: UserProfile = {
    userId: account.id,
    name: account.name,
    handle: account.handle,
    bio: account.bio || 'TikTop Live Creator 🌟',
    avatar: account.avatar,
    provider: account.provider,
    email: account.email,
    phone: account.phone,
  };

  return { authUser, userProfile };
};
