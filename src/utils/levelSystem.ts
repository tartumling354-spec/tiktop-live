// TikTop Live Level and Wealth Level Calculation & State Manager
// Wealth Level: Increases when user sends gifts to others (Coins spent)
// Live Level: Increases when streamer receives gifts from audience (Points/Gifts received)

export interface LevelInfo {
  level: number;
  title: string;
  nepaliTitle: string;
  icon: string;
  minVal: number;
  nextVal: number;
  progress: number; // 0 to 100
  badgeGradient: string;
  borderGradient: string;
  textColor: string;
}

// User specified Wealth Level thresholds:
// < 10k: Level 1
// 10k - 20k: Level 2
// 20k - 50k: Level 3
// 50k - 90k: Level 4
// 90k - 150k: Level 5
// 150k - 250k: Level 6
// 250k - 500k: Level 7
// 500k - 1,000k: Level 8
// 1M - 2M: Level 9
// 2M+: Level 10
export const WEALTH_TIERS = [
  { level: 1, min: 0, next: 10000, title: 'Wealth Novice', nepaliTitle: 'प्रारम्भिक दाता', icon: '🪙', badgeGradient: 'from-amber-700 to-amber-900', borderGradient: 'border-amber-700/50', textColor: 'text-amber-300' },
  { level: 2, min: 10000, next: 20000, title: 'Bronze Patron', nepaliTitle: 'कांस्य दाता', icon: '🥉', badgeGradient: 'from-amber-600 to-amber-800', borderGradient: 'border-amber-600/50', textColor: 'text-amber-300' },
  { level: 3, min: 20000, next: 50000, title: 'Silver Supporter', nepaliTitle: 'चाँदी समर्थक', icon: '🥈', badgeGradient: 'from-slate-400 to-slate-600', borderGradient: 'border-slate-400/50', textColor: 'text-slate-200' },
  { level: 4, min: 50000, next: 90000, title: 'Gold Gifter', nepaliTitle: 'सुनौलो गिफ्टर', icon: '🥇', badgeGradient: 'from-yellow-500 to-amber-600', borderGradient: 'border-yellow-400/60', textColor: 'text-yellow-300' },
  { level: 5, min: 90000, next: 150000, title: 'Platinum VIP', nepaliTitle: 'प्लाटिनम भीआईपी', icon: '💎', badgeGradient: 'from-cyan-500 to-blue-600', borderGradient: 'border-cyan-400/60', textColor: 'text-cyan-300' },
  { level: 6, min: 150000, next: 250000, title: 'Diamond Noble', nepaliTitle: 'हीरा कुलीन', icon: '💠', badgeGradient: 'from-blue-600 to-indigo-700', borderGradient: 'border-blue-400/60', textColor: 'text-blue-300' },
  { level: 7, min: 250000, next: 500000, title: 'Crown Royal', nepaliTitle: 'शाही राजकुमार', icon: '👑', badgeGradient: 'from-purple-600 to-pink-600', borderGradient: 'border-purple-400/60', textColor: 'text-purple-300' },
  { level: 8, min: 500000, next: 1000000, title: 'Wealth Emperor', nepaliTitle: 'धन सम्राट', icon: '🌟', badgeGradient: 'from-rose-600 via-purple-600 to-amber-500', borderGradient: 'border-rose-400/70', textColor: 'text-rose-300' },
  { level: 9, min: 1000000, next: 2000000, title: 'King of Wealth', nepaliTitle: 'महाधनी नरेश', icon: '⚡', badgeGradient: 'from-amber-400 via-rose-500 to-indigo-600', borderGradient: 'border-amber-300/80', textColor: 'text-amber-200' },
  { level: 10, min: 2000000, next: 5000000, title: 'Supreme Wealth God', nepaliTitle: 'सर्वोच्च कुबेर', icon: '🪐', badgeGradient: 'from-yellow-400 via-pink-500 to-purple-700', borderGradient: 'border-yellow-300', textColor: 'text-yellow-200' },
];

// User specified Live Level thresholds:
// < 20k: Level 1
// 20k - 50k: Level 2
// 50k - 100k: Level 3
// 100k - 200k: Level 4
// 200k - 350k: Level 5
// 350k - 500k: Level 6
// 500k - 1,000k: Level 7
// 1M - 2M: Level 8
// 2M+: Level 9
// 5M+: Level 10
export const LIVE_TIERS = [
  { level: 1, min: 0, next: 20000, title: 'Rookie Host', nepaliTitle: 'नयाँ होस्ट', icon: '🎙️', badgeGradient: 'from-emerald-700 to-emerald-900', borderGradient: 'border-emerald-700/50', textColor: 'text-emerald-300' },
  { level: 2, min: 20000, next: 50000, title: 'Rising Star', nepaliTitle: 'उदयीमान स्टार', icon: '🌱', badgeGradient: 'from-emerald-600 to-teal-700', borderGradient: 'border-emerald-500/60', textColor: 'text-emerald-300' },
  { level: 3, min: 50000, next: 100000, title: 'Active Streamer', nepaliTitle: 'सक्रिय लाइभर', icon: '🔥', badgeGradient: 'from-teal-500 to-cyan-600', borderGradient: 'border-teal-400/60', textColor: 'text-teal-300' },
  { level: 4, min: 100000, next: 200000, title: 'Popular Creator', nepaliTitle: 'लोकप्रिय क्रिएटर', icon: '⭐', badgeGradient: 'from-blue-500 to-indigo-600', borderGradient: 'border-blue-400/60', textColor: 'text-blue-300' },
  { level: 5, min: 200000, next: 350000, title: 'Elite Influencer', nepaliTitle: 'प्रख्यात इन्फ्लुएन्सर', icon: '🌟', badgeGradient: 'from-indigo-600 to-purple-600', borderGradient: 'border-indigo-400/60', textColor: 'text-indigo-300' },
  { level: 6, min: 350000, next: 500000, title: 'Master Performer', nepaliTitle: 'सिपालु कलाकार', icon: '🏆', badgeGradient: 'from-purple-600 to-pink-600', borderGradient: 'border-purple-400/70', textColor: 'text-purple-300' },
  { level: 7, min: 500000, next: 1000000, title: 'Grand Celebrity', nepaliTitle: 'भव्य सेलिब्रिटी', icon: '🎭', badgeGradient: 'from-pink-600 to-rose-600', borderGradient: 'border-pink-400/70', textColor: 'text-pink-300' },
  { level: 8, min: 1000000, next: 2000000, title: 'Superstar Idol', nepaliTitle: 'सुपरस्टार आइडल', icon: '👑', badgeGradient: 'from-rose-600 via-amber-500 to-pink-600', borderGradient: 'border-rose-400/80', textColor: 'text-rose-200' },
  { level: 9, min: 2000000, next: 5000000, title: 'Legendary Streamer', nepaliTitle: 'लिजेन्डरी होस्ट', icon: '🌌', badgeGradient: 'from-amber-400 via-rose-500 to-purple-600', borderGradient: 'border-amber-400', textColor: 'text-amber-200' },
  { level: 10, min: 5000000, next: 10000000, title: 'Hall of Fame Icon', nepaliTitle: 'विश्वविख्यात आइकन', icon: '⚡', badgeGradient: 'from-yellow-400 via-pink-500 to-cyan-500', borderGradient: 'border-yellow-300', textColor: 'text-yellow-200' },
];

export function calculateWealthLevel(totalCoinsGifted: number): LevelInfo {
  const safeCoins = Math.max(0, totalCoinsGifted || 0);
  
  for (let i = WEALTH_TIERS.length - 1; i >= 0; i--) {
    const tier = WEALTH_TIERS[i];
    if (safeCoins >= tier.min) {
      const span = tier.next - tier.min;
      const progress = span > 0 ? Math.min(100, Math.max(0, Math.round(((safeCoins - tier.min) / span) * 100))) : 100;
      return {
        level: tier.level,
        title: tier.title,
        nepaliTitle: tier.nepaliTitle,
        icon: tier.icon,
        minVal: tier.min,
        nextVal: tier.next,
        progress,
        badgeGradient: tier.badgeGradient,
        borderGradient: tier.borderGradient,
        textColor: tier.textColor,
      };
    }
  }

  const defaultTier = WEALTH_TIERS[0];
  return {
    level: defaultTier.level,
    title: defaultTier.title,
    nepaliTitle: defaultTier.nepaliTitle,
    icon: defaultTier.icon,
    minVal: defaultTier.min,
    nextVal: defaultTier.next,
    progress: 0,
    badgeGradient: defaultTier.badgeGradient,
    borderGradient: defaultTier.borderGradient,
    textColor: defaultTier.textColor,
  };
}

export function calculateLiveLevel(totalPointsReceived: number): LevelInfo {
  const safePoints = Math.max(0, totalPointsReceived || 0);

  for (let i = LIVE_TIERS.length - 1; i >= 0; i--) {
    const tier = LIVE_TIERS[i];
    if (safePoints >= tier.min) {
      const span = tier.next - tier.min;
      const progress = span > 0 ? Math.min(100, Math.max(0, Math.round(((safePoints - tier.min) / span) * 100))) : 100;
      return {
        level: tier.level,
        title: tier.title,
        nepaliTitle: tier.nepaliTitle,
        icon: tier.icon,
        minVal: tier.min,
        nextVal: tier.next,
        progress,
        badgeGradient: tier.badgeGradient,
        borderGradient: tier.borderGradient,
        textColor: tier.textColor,
      };
    }
  }

  const defaultTier = LIVE_TIERS[0];
  return {
    level: defaultTier.level,
    title: defaultTier.title,
    nepaliTitle: defaultTier.nepaliTitle,
    icon: defaultTier.icon,
    minVal: defaultTier.min,
    nextVal: defaultTier.next,
    progress: 0,
    badgeGradient: defaultTier.badgeGradient,
    borderGradient: defaultTier.borderGradient,
    textColor: defaultTier.textColor,
  };
}

// LocalStorage helpers for user-wide tracking
export const STORAGE_KEYS = {
  WEALTH_TOTAL: 'tiktop_wealth_total_gifted_coins',
  LIVE_TOTAL: 'tiktop_live_total_received_points',
};

export function getStoredWealthTotal(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.WEALTH_TOTAL);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

export function recordGiftSent(coinsSpent: number): {
  newTotal: number;
  prevLevel: number;
  newLevel: number;
  didLevelUp: boolean;
  levelInfo: LevelInfo;
} {
  const currentTotal = getStoredWealthTotal();
  const prevLevel = calculateWealthLevel(currentTotal).level;
  const newTotal = currentTotal + coinsSpent;
  try {
    localStorage.setItem(STORAGE_KEYS.WEALTH_TOTAL, newTotal.toString());
  } catch {
    // Ignore
  }
  const levelInfo = calculateWealthLevel(newTotal);
  const didLevelUp = levelInfo.level > prevLevel;

  return {
    newTotal,
    prevLevel,
    newLevel: levelInfo.level,
    didLevelUp,
    levelInfo,
  };
}

export function getStoredLiveTotal(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LIVE_TOTAL);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

export function recordGiftReceived(pointsReceived: number): {
  newTotal: number;
  prevLevel: number;
  newLevel: number;
  didLevelUp: boolean;
  levelInfo: LevelInfo;
} {
  const currentTotal = getStoredLiveTotal();
  const prevLevel = calculateLiveLevel(currentTotal).level;
  const newTotal = currentTotal + pointsReceived;
  try {
    localStorage.setItem(STORAGE_KEYS.LIVE_TOTAL, newTotal.toString());
  } catch {
    // Ignore
  }
  const levelInfo = calculateLiveLevel(newTotal);
  const didLevelUp = levelInfo.level > prevLevel;

  return {
    newTotal,
    prevLevel,
    newLevel: levelInfo.level,
    didLevelUp,
    levelInfo,
  };
}
