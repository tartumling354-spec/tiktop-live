export type Screen = 'home' | 'explore' | 'chat' | 'profile' | 'live_room';

export type LiveMode = 'face' | 'party';

export interface AuthUser {
  id: string; // e.g. 'USR-84920'
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  email?: string;
  phone?: string;
  password?: string;
  provider: 'google' | 'facebook' | 'phone' | 'email';
  createdAt: string;
}

export interface RegisteredAccount {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  email?: string;
  phone?: string;
  password?: string;
  provider: 'google' | 'facebook' | 'phone' | 'email';
  createdAt: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  userId?: string;
  provider?: 'google' | 'facebook' | 'phone' | 'email';
  phone?: string;
  email?: string;
}

export interface AppUser {
  userId: string; // Unique search ID, e.g. 'USR-84920'
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  isFriend: boolean;
  isLive: boolean;
  liveTitle?: string;
  liveMode?: LiveMode;
  liveStreamerId?: string;
  verified?: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  type: 'normal' | 'gift' | 'system' | 'join';
  giftName?: string;
  giftIcon?: string;
  badge?: string;
  timestamp: string;
}

export type GiftCategory = 'regular' | 'daily' | 'lucky' | 'custom' | 'event';

export interface Gift {
  id: string;
  name: string;
  nepaliName?: string;
  icon: string;
  coins?: number;
  diamonds: number;
  points?: number;
  effect: string;
  category?: GiftCategory;
  badge?: string;
}

export type PartySeatCount = 4 | 6 | 9 | 16 | 25;

export type PartyAccessMode = 'free' | 'approval' | 'fanclub';

export interface BannedUser {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bannedAt: number;
  expiresAt: number; // 30 minutes in ms
  bannedBy: string; // 'Host' or 'Admin'
  reason?: string;
}

export interface SeatJoinRequest {
  id: string;
  seatNumber: number;
  userId: string;
  userName: string;
  userAvatar: string;
  isFanClub?: boolean;
  requestedAt: number;
}

export interface SeatInvitation {
  id: string;
  seatNumber: number;
  invitedBy: string; // 'Admin' or 'Host'
  invitedUserName: string;
  invitedUserAvatar: string;
  timestamp: number;
}

export interface PartySeat {
  id: number;
  seatNumber: number;
  isOccupied: boolean;
  userName?: string;
  userAvatar?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
  isHost?: boolean;
  isAdmin?: boolean;
  isFanClub?: boolean;
  isVideoOn?: boolean;
  videoUrl?: string;
  pointsEarned?: number;
  recentGiftEffect?: {
    giftIcon: string;
    giftName: string;
    points: number;
    timestamp: number;
  };
}

export interface LiveStreamer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  thumbnail: string;
  title: string;
  category: string;
  viewerCount: number;
  tags: string[];
  mode: LiveMode;
  verified?: boolean;
}

export type VideoFilter = 'none' | 'beauty' | 'warm' | 'cool' | 'vintage' | 'vibrant';

export interface PostVideo {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  videoUrl: string;
  caption: string;
  soundTitle: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  createdAt: string;
  tags: string[];
  filter?: VideoFilter;
}

export interface RechargeClaim {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  countryCode: string;
  countryName: string;
  methodId: string;
  methodName: string;
  targetAccount: string; // e.g. eSewa: 9863991384, Khalti: 9810465055, Nabil: 04110017507343
  usdAmount: number;
  localAmount: number;
  currencySymbol: string;
  coins: number;
  senderAccount: string;
  receiptImage?: string; // Payment screenshot or digital card voucher
  screenshotHash?: string; // Unique image fingerprint to prevent duplicate reuse
  paymentDate: string; // Date of payment
  status: 'verified' | 'pending' | 'rejected';
  submittedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
}
