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
 * Get all registered accounts from localStorage with custom profile edits preserved
 */
export const getRegisteredAccounts = (): RegisteredAccount[] => {
  let accounts: RegisteredAccount[] = SEED_ACCOUNTS;
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        accounts = parsed;
      }
    }
  } catch {
    // Ignore JSON errors
  }

  // Check if user has saved a customized profile name
  try {
    const customName = localStorage.getItem('tiktop_custom_user_name');
    const customHandle = localStorage.getItem('tiktop_custom_user_handle');
    const customAvatar = localStorage.getItem('tiktop_custom_user_avatar');
    const customBio = localStorage.getItem('tiktop_custom_user_bio');
    const lastActiveId = localStorage.getItem('tiktop_last_active_user_id') || 'USR-35400';

    if (customName && customName.trim().length > 0) {
      accounts = accounts.map((acc) => {
        if (acc.id === lastActiveId || acc.id === 'USR-35400' || acc.email === 'tartumling354@gmail.com') {
          return {
            ...acc,
            name: customName.trim(),
            ...(customHandle ? { handle: customHandle.trim() } : {}),
            ...(customAvatar ? { avatar: customAvatar } : {}),
            ...(customBio ? { bio: customBio } : {}),
          };
        }
        return acc;
      });
    }
  } catch {
    // Ignore
  }

  // Ensure accounts are persisted
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage errors
  }
  return accounts;
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
    if (account.name) {
      localStorage.setItem('tiktop_custom_user_name', account.name);
    }
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
    if (account.id === accountId || account.id === 'USR-35400' || account.email === 'tartumling354@gmail.com') {
      return {
        ...account,
        ...updates,
      };
    }
    return account;
  });

  try {
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
    if (updates.name) {
      localStorage.setItem('tiktop_custom_user_name', updates.name);
    }
    if (updates.handle) {
      localStorage.setItem('tiktop_custom_user_handle', updates.handle);
    }
    if (updates.avatar) {
      localStorage.setItem('tiktop_custom_user_avatar', updates.avatar);
    }
    if (updates.bio) {
      localStorage.setItem('tiktop_custom_user_bio', updates.bio);
    }
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
  let effectiveName = account.name;
  let effectiveHandle = account.handle;
  let effectiveAvatar = account.avatar;
  let effectiveBio = account.bio || 'TikTop Live Creator 🌟';

  try {
    const customName = localStorage.getItem('tiktop_custom_user_name');
    const customHandle = localStorage.getItem('tiktop_custom_user_handle');
    const customAvatar = localStorage.getItem('tiktop_custom_user_avatar');
    const customBio = localStorage.getItem('tiktop_custom_user_bio');

    if (customName && (account.id === 'USR-35400' || account.email === 'tartumling354@gmail.com' || account.provider === 'google')) {
      effectiveName = customName.trim();
    }
    if (customHandle) effectiveHandle = customHandle.trim();
    if (customAvatar) effectiveAvatar = customAvatar;
    if (customBio) effectiveBio = customBio;
  } catch {
    // Ignore
  }

  const authUser: AuthUser = {
    id: account.id,
    name: effectiveName,
    handle: effectiveHandle,
    avatar: effectiveAvatar,
    bio: effectiveBio,
    email: account.email,
    phone: account.phone,
    provider: account.provider,
    createdAt: account.createdAt,
  };

  const userProfile: UserProfile = {
    userId: account.id,
    name: effectiveName,
    handle: effectiveHandle,
    bio: effectiveBio,
    avatar: effectiveAvatar,
    provider: account.provider,
    email: account.email,
    phone: account.phone,
  };

  return { authUser, userProfile };
};

/**
 * Change or set password for an existing account
 */
export const changeAccountPassword = (
  accountId: string,
  oldPassword: string,
  newPassword: string
): { success: boolean; message: string } => {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'नयाँ पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ (Minimum 6 characters required)' };
  }

  const all = getRegisteredAccounts();
  const account = all.find(
    (u) =>
      u.id === accountId ||
      u.id === 'USR-35400' ||
      u.email === 'tartumling354@gmail.com'
  );

  if (!account) {
    return { success: false, message: 'खाता फेला परेन (Account not found)' };
  }

  // If the account already had a password, verify old password
  if (account.password && account.password !== oldPassword) {
    return { success: false, message: 'पुरानो पासवर्ड मिलेन (Current password does not match)' };
  }

  account.password = newPassword;
  saveRegisteredAccount(account);

  // Also update in auth user if active
  try {
    const rawAuth = localStorage.getItem('tiktop_auth_user');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      parsed.password = newPassword;
      localStorage.setItem('tiktop_auth_user', JSON.stringify(parsed));
    }
  } catch {
    // Ignore
  }

  return { success: true, message: 'पासवर्ड सफलतापूर्वक परिवर्तन भयो! (Password updated successfully)' };
};
