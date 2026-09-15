export interface UserPrivacySettings {
  followingVisibility: 'everyone' | 'followers' | 'only_me';
  followersVisibility: 'everyone' | 'followers' | 'only_me';
  likesVisibility: 'everyone' | 'only_me';
  privateAccount: boolean;
  whoCanComment: 'everyone' | 'friends' | 'no_one';
  whoCanDuet: 'everyone' | 'friends' | 'only_me';
}

export interface BlockedUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  blockedAt: string;
  reason: string;
}

export type AppLanguageCode = 'ne' | 'en' | 'mai' | 'bho' | 'hi';

export interface AppLanguage {
  code: AppLanguageCode;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  { code: 'ne', label: 'Nepali', nativeName: 'नेपाली (पूर्वनिर्धारित)', flag: '🇳🇵' },
  { code: 'en', label: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'mai', label: 'Maithili', nativeName: 'मैथिली', flag: '🇳🇵' },
  { code: 'bho', label: 'Bhojpuri', nativeName: 'भोजपुरी', flag: '🇳🇵' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

const PRIVACY_KEY = 'tiktop_user_privacy_settings';
const BLOCKED_KEY = 'tiktop_blocked_users_list';
const LANG_KEY = 'tiktop_app_selected_language';
const FOLLOWING_KEY = 'tiktop_user_following_ids';
const FOLLOWERS_KEY = 'tiktop_user_followers_ids';

const DEFAULT_PRIVACY: UserPrivacySettings = {
  followingVisibility: 'everyone',
  followersVisibility: 'everyone',
  likesVisibility: 'everyone',
  privateAccount: false,
  whoCanComment: 'everyone',
  whoCanDuet: 'everyone',
};

const INITIAL_BLOCKED_USERS: BlockedUser[] = [
  {
    id: 'USR-BLOCK-01',
    name: 'Spam Bot 99',
    handle: '@spambot_promo',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    blockedAt: '२०२६-०१-१०',
    reason: 'अनुचित कमेन्ट र अनावश्यक लिङ्क स्पाम',
  },
  {
    id: 'USR-BLOCK-02',
    name: 'Fake Coins seller',
    handle: '@cheap_coins_nepal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    blockedAt: '२०२६-०२-१५',
    reason: 'नक्कली सिक्का बेच्ने ठगी प्रयास',
  },
];

export const getUserPrivacySettings = (): UserPrivacySettings => {
  try {
    const raw = localStorage.getItem(PRIVACY_KEY);
    if (raw) {
      return { ...DEFAULT_PRIVACY, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_PRIVACY;
};

export const saveUserPrivacySettings = (settings: UserPrivacySettings): void => {
  try {
    localStorage.setItem(PRIVACY_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('tiktop_privacy_changed', { detail: settings }));
  } catch {
    // Ignore
  }
};

export const getBlockedUsers = (): BlockedUser[] => {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return INITIAL_BLOCKED_USERS;
};

export const saveBlockedUsers = (users: BlockedUser[]): void => {
  try {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('tiktop_blocked_users_changed', { detail: users }));
  } catch {
    // Ignore
  }
};

export const unblockUser = (userId: string): BlockedUser[] => {
  const current = getBlockedUsers();
  const updated = current.filter((u) => u.id !== userId);
  saveBlockedUsers(updated);
  return updated;
};

export const blockUser = (user: Omit<BlockedUser, 'blockedAt'>): BlockedUser[] => {
  const current = getBlockedUsers();
  if (current.some((u) => u.id === user.id)) return current;
  const newBlocked: BlockedUser = {
    ...user,
    blockedAt: new Date().toLocaleDateString('ne-NP'),
  };
  const updated = [newBlocked, ...current];
  saveBlockedUsers(updated);
  return updated;
};

export const getAppLanguage = (): AppLanguageCode => {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    if (raw && ['ne', 'en', 'mai', 'bho', 'hi'].includes(raw)) {
      return raw as AppLanguageCode;
    }
  } catch {
    // Ignore
  }
  return 'ne';
};

export const setAppLanguage = (lang: AppLanguageCode): void => {
  try {
    localStorage.setItem(LANG_KEY, lang);
    window.dispatchEvent(new CustomEvent('tiktop_language_changed', { detail: lang }));
  } catch {
    // Ignore
  }
};

export interface ConnectionUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followersCount: number;
  isFollowing: boolean;
  isLive?: boolean;
  level?: number;
  verified?: boolean;
}

export const INITIAL_FOLLOWING_LIST: ConnectionUser[] = [
  {
    id: 'USR-84920',
    name: 'Aarav Sharma',
    handle: '@aarav_live',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Guitarist 🎸 • Acoustic Jamming & Chill streams • Kathmandu 🇳🇵',
    followersCount: 48200,
    isFollowing: true,
    isLive: true,
    level: 28,
    verified: true,
  },
  {
    id: 'USR-73910',
    name: 'Pooja & Squad',
    handle: '@pooja_vibes',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Party Room Host 👑 • Daily PK Battles & Late Night Chats!',
    followersCount: 142500,
    isFollowing: true,
    isLive: true,
    level: 35,
    verified: true,
  },
  {
    id: 'USR-10923',
    name: 'Sunita Gurung',
    handle: '@sunita_cooks',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Food Blogger & Chef 🥟 • Authentic Nepali recipes and cooking tutorials!',
    followersCount: 89400,
    isFollowing: true,
    isLive: false,
    level: 19,
    verified: true,
  },
  {
    id: 'USR-44820',
    name: 'Kathmandu Beats',
    handle: '@ktm_beats',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Open mic host & Karaoke enthusiast 🎤 • Kathmandu lo-fi music producer.',
    followersCount: 76900,
    isFollowing: true,
    isLive: true,
    level: 24,
    verified: true,
  },
  {
    id: 'USR-55219',
    name: 'Rohan Tech & Gaming',
    handle: '@rohan_gaming',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bio: 'Pro Gamer 🎮 • Esports streamer • Let us reach Conqueror together!',
    followersCount: 32100,
    isFollowing: true,
    isLive: false,
    level: 15,
  },
  {
    id: 'USR-61920',
    name: 'Anjali Sharma',
    handle: '@anjali_dances',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Nepali Folk & Contemporary Dancer 💃 • Pokhara vibes',
    followersCount: 54100,
    isFollowing: true,
    isLive: true,
    level: 22,
    verified: true,
  },
];

export const INITIAL_FOLLOWERS_LIST: ConnectionUser[] = [
  {
    id: 'USR-FL-01',
    name: 'Bikash Thapa',
    handle: '@bikash_thapa',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'TikTop fan from Dharan ⛰️ Love watching live PK battles!',
    followersCount: 1240,
    isFollowing: true,
    level: 12,
  },
  {
    id: 'USR-FL-02',
    name: 'Sushila Magar',
    handle: '@sushila_magar',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    bio: 'Music lover 🎵 Supporter of all Nepali creators',
    followersCount: 890,
    isFollowing: false,
    level: 8,
  },
  {
    id: 'USR-FL-03',
    name: 'Dipesh Shrestha',
    handle: '@dipesh_official',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    bio: 'Live Gifting Squad 🎁 Top supporter in Kathmandu',
    followersCount: 3400,
    isFollowing: true,
    level: 25,
    verified: true,
  },
  {
    id: 'USR-FL-04',
    name: 'Monika KC',
    handle: '@monika_kc',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Beauty & Lifestyle Creator 🌸 Butwal Nepal',
    followersCount: 18200,
    isFollowing: false,
    level: 16,
  },
  {
    id: 'USR-FL-05',
    name: 'Pradeep Rai',
    handle: '@pradeep_rai',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    bio: 'Fitness & Travel Enthusiast 🏔️ Solukhumbu to KTM',
    followersCount: 4200,
    isFollowing: true,
    level: 14,
  },
];

export const getFollowingList = (): ConnectionUser[] => {
  try {
    const raw = localStorage.getItem(FOLLOWING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return INITIAL_FOLLOWING_LIST;
};

export const saveFollowingList = (list: ConnectionUser[]): void => {
  try {
    localStorage.setItem(FOLLOWING_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('tiktop_following_updated', { detail: list }));
  } catch {
    // Ignore
  }
};

export const getFollowersList = (): ConnectionUser[] => {
  try {
    const raw = localStorage.getItem(FOLLOWERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return INITIAL_FOLLOWERS_LIST;
};

export const saveFollowersList = (list: ConnectionUser[]): void => {
  try {
    localStorage.setItem(FOLLOWERS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('tiktop_followers_updated', { detail: list }));
  } catch {
    // Ignore
  }
};
