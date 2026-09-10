import { Gift, LiveStreamer, PartySeat, PostVideo, PartySeatCount, UserProfile, AppUser } from '../types';

export const INITIAL_GIFTS: Gift[] = [
  { id: 'g1', name: 'Rose', icon: '🌹', coins: 1, diamonds: 1, effect: 'petals' },
  { id: 'g2', name: 'Love Heart', icon: '💖', coins: 5, diamonds: 5, effect: 'hearts' },
  { id: 'g3', name: 'Fire Blast', icon: '🔥', coins: 10, diamonds: 10, effect: 'fire' },
  { id: 'g4', name: 'Party Popper', icon: '🎉', coins: 25, diamonds: 25, effect: 'confetti' },
  { id: 'g5', name: 'Golden Crown', icon: '👑', coins: 99, diamonds: 99, effect: 'crown' },
  { id: 'g6', name: 'Sports Car', icon: '🏎️', coins: 299, diamonds: 299, effect: 'car' },
  { id: 'g7', name: 'Galaxy Rocket', icon: '🚀', coins: 599, diamonds: 599, effect: 'rocket' },
  { id: 'g8', name: 'Majestic Lion', icon: '🦁', coins: 999, diamonds: 999, effect: 'lion' },
];

export const EXPLORE_STREAMERS: LiveStreamer[] = [
  {
    id: 'stream-1',
    name: 'Aarav Sharma',
    handle: '@aarav_live',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    title: 'Guitar Jamming & Chill Night 🎸🎵',
    category: 'Music',
    viewerCount: 1420,
    tags: ['Acoustic', 'Singing', 'NepaliSong'],
    mode: 'face',
    verified: true,
  },
  {
    id: 'stream-2',
    name: 'Pooja & Squad',
    handle: '@pooja_vibes',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    title: 'Party Room #12 - Fun Debates & PK Battle! 🔥',
    category: 'Party',
    viewerCount: 3890,
    tags: ['Party', 'Talks', 'PKBattle'],
    mode: 'party',
    verified: true,
  },
  {
    id: 'stream-3',
    name: 'Rohan Tech & Gaming',
    handle: '@rohan_gaming',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    title: 'Rank Push To Conqueror! Road to 100K 🎮🏆',
    category: 'Gaming',
    viewerCount: 840,
    tags: ['Gaming', 'BGMI', 'Esports'],
    mode: 'face',
  },
  {
    id: 'stream-4',
    name: 'Sunita Gurung',
    handle: '@sunita_cooks',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80',
    title: 'Making Authentic Momo & Evening Chat! 🥟😋',
    category: 'Cooking',
    viewerCount: 2150,
    tags: ['Cooking', 'Foodie', 'LiveChat'],
    mode: 'face',
    verified: true,
  },
  {
    id: 'stream-5',
    name: 'Kathmandu Beats Party',
    handle: '@ktm_beats',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    title: '8-Seat Open Mic & Karaoke Room! Sing Along 🎤',
    category: 'Party',
    viewerCount: 4210,
    tags: ['Karaoke', 'Voice', 'OpenMic'],
    mode: 'party',
  }
];

export const INITIAL_PARTY_SEATS: PartySeat[] = [
  { id: 1, seatNumber: 1, isOccupied: true, userName: 'You (Host)', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', isHost: true, isSpeaking: true, isMuted: false, isVideoOn: true },
  { id: 2, seatNumber: 2, isOccupied: true, userName: 'Pabitra K.', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', isSpeaking: false, isMuted: false, isVideoOn: true, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-happy-in-the-street-41551-large.mp4' },
  { id: 3, seatNumber: 3, isOccupied: true, userName: 'Bipin_07', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', isSpeaking: true, isMuted: false, isVideoOn: false },
  { id: 4, seatNumber: 4, isOccupied: false },
  { id: 5, seatNumber: 5, isOccupied: true, userName: 'Simran_X', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', isSpeaking: false, isMuted: true, isVideoOn: false },
  { id: 6, seatNumber: 6, isOccupied: false },
];

/**
 * Assigns or moves a user to a seat, STRICTLY ensuring:
 * 'ek byakti ek mattra seat ma basna milnu parxa' (One person can ONLY occupy ONE seat at a time).
 */
export function assignUserToSeat(
  seats: PartySeat[],
  targetSeatNumber: number,
  user: {
    userName: string;
    userAvatar: string;
    isHost?: boolean;
    isVideoOn?: boolean;
    videoUrl?: string;
  }
): PartySeat[] {
  // 1. Clear any seat this user was previously sitting in
  const cleaned = seats.map((s) => {
    if (s.isOccupied && s.userName === user.userName) {
      return {
        ...s,
        isOccupied: false,
        userName: undefined,
        userAvatar: undefined,
        isHost: false,
        isSpeaking: false,
        isMuted: false,
        isVideoOn: false,
        videoUrl: undefined,
      };
    }
    return s;
  });

  // 2. Assign exclusively to the target seat
  return cleaned.map((s) => {
    if (s.seatNumber === targetSeatNumber) {
      return {
        ...s,
        isOccupied: true,
        userName: user.userName,
        userAvatar: user.userAvatar,
        isHost: user.isHost ?? false,
        isSpeaking: false,
        isMuted: false,
        isVideoOn: user.isVideoOn ?? true,
        videoUrl: user.videoUrl,
      };
    }
    return s;
  });
}

/**
 * Generates or adapts Party Seats for 4, 6, 9, 16, or 25 seats.
 * Preserves existing occupants while enforcing strictly 1 seat per person.
 */
export function generatePartySeats(
  count: PartySeatCount,
  existingSeats?: PartySeat[]
): PartySeat[] {
  const sampleGuests = [
    { userName: 'You (Host)', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', isHost: true, isVideoOn: true, isSpeaking: true },
    { userName: 'Pabitra K.', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', isHost: false, isVideoOn: true, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-happy-in-the-street-41551-large.mp4', isSpeaking: false },
    { userName: 'Bipin_07', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', isHost: false, isVideoOn: false, isSpeaking: true },
    { userName: 'Simran_X', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', isHost: false, isVideoOn: false, isMuted: true },
    { userName: 'Aayush_NP', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', isHost: false, isVideoOn: true, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-playing-acoustic-guitar-at-home-43206-large.mp4' },
    { userName: 'Kritika_K', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', isHost: false, isVideoOn: false },
    { userName: 'Rohan_Play', userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', isHost: false, isVideoOn: true, videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skater-riding-her-skateboard-41604-large.mp4' },
    { userName: 'Sunita_G', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', isHost: false, isVideoOn: false },
    { userName: 'Anjali_R', userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', isHost: false, isVideoOn: true, videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  ];

  const result: PartySeat[] = [];

  if (existingSeats && existingSeats.length > 0) {
    const usedNames = new Set<string>();

    for (let i = 1; i <= count; i++) {
      const existing = existingSeats.find((s) => s.seatNumber === i);
      if (existing && existing.isOccupied && existing.userName && !usedNames.has(existing.userName)) {
        usedNames.add(existing.userName);
        result.push({
          ...existing,
          id: i,
          seatNumber: i,
        });
      } else {
        result.push({
          id: i,
          seatNumber: i,
          isOccupied: false,
        });
      }
    }

    // Migrate any user beyond count (e.g. previously on seat 8, now switched to 4 or 6 seats)
    const displacedUsers = existingSeats.filter(
      (s) => s.seatNumber > count && s.isOccupied && s.userName && !usedNames.has(s.userName)
    );

    for (const displaced of displacedUsers) {
      if (!displaced.userName) continue;
      const emptyIdx = result.findIndex((s) => !s.isOccupied);
      if (emptyIdx !== -1) {
        usedNames.add(displaced.userName);
        result[emptyIdx] = {
          ...displaced,
          id: emptyIdx + 1,
          seatNumber: emptyIdx + 1,
        };
      }
    }

    return result;
  }

  // Initial generation
  for (let i = 1; i <= count; i++) {
    if (i === 1) {
      result.push({ id: 1, seatNumber: 1, isOccupied: true, ...sampleGuests[0] });
    } else if (i === 2) {
      result.push({ id: 2, seatNumber: 2, isOccupied: true, ...sampleGuests[1] });
    } else if (i === 3 && count >= 4) {
      result.push({ id: 3, seatNumber: 3, isOccupied: true, ...sampleGuests[2] });
    } else if (i === 5 && count >= 6) {
      result.push({ id: 5, seatNumber: 5, isOccupied: true, ...sampleGuests[3] });
    } else if (i === 7 && count >= 9) {
      result.push({ id: 7, seatNumber: 7, isOccupied: true, ...sampleGuests[4] });
    } else if (i === 10 && count >= 16) {
      result.push({ id: 10, seatNumber: 10, isOccupied: true, ...sampleGuests[5] });
    } else if (i === 12 && count >= 16) {
      result.push({ id: 12, seatNumber: 12, isOccupied: true, ...sampleGuests[6] });
    } else if (i === 18 && count >= 25) {
      result.push({ id: 18, seatNumber: 18, isOccupied: true, ...sampleGuests[7] });
    } else {
      result.push({
        id: i,
        seatNumber: i,
        isOccupied: false,
      });
    }
  }

  return result;
}

export const SAMPLE_AUDIO_TRACKS = [
  { id: 'sound-1', name: 'Original Sound - Creator NP 🎶', artist: 'Creator NP', duration: '0:30' },
  { id: 'sound-2', name: 'Resham Firiri (Modern Lo-Fi Remix) 🏔️', artist: 'KTM Beats', duration: '0:45' },
  { id: 'sound-3', name: 'Trending Dance Beat 2026 🔥', artist: 'TikTop Viral', duration: '0:25' },
  { id: 'sound-4', name: 'Acoustic Guitar Melodies 🎸', artist: 'Aarav Live', duration: '0:35' },
  { id: 'sound-5', name: 'Kathmandu Night Vibe Pop 🎵', artist: 'Himalayan Sounds', duration: '0:40' },
];

export const SAMPLE_VIDEO_PRESETS = [
  {
    id: 'preset-1',
    title: 'Nepali Dance & Beats',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-happy-in-the-street-41551-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    tags: ['Dance', 'Nepal', 'Vibe'],
  },
  {
    id: 'preset-2',
    title: 'Acoustic Guitar Live Jam',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-playing-acoustic-guitar-at-home-43206-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    tags: ['Music', 'Acoustic', 'Jam'],
  },
  {
    id: 'preset-3',
    title: 'Street Skater Lifestyle',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skater-riding-her-skateboard-41604-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
    tags: ['Skate', 'Urban', 'Fun'],
  },
  {
    id: 'preset-4',
    title: 'Mountain Vibe & Travel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    tags: ['Travel', 'Pokhara', 'Himalayas'],
  },
];

export const INITIAL_POST_VIDEOS: PostVideo[] = [
  {
    id: 'post-1',
    authorName: 'Aarav Sharma',
    authorHandle: '@aarav_live',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-playing-acoustic-guitar-at-home-43206-large.mp4',
    caption: 'Late night acoustic vibes 🎸🎵 Nepali unplugged songs hit differently! What song should I play next? #NepaliSong #Acoustic #Viral #Foryou',
    soundTitle: 'Acoustic Guitar Melodies 🎸 - Aarav Live',
    likesCount: 1240,
    commentsCount: 88,
    sharesCount: 42,
    isLiked: false,
    createdAt: '2 hours ago',
    tags: ['NepaliSong', 'Acoustic', 'Viral', 'Foryou'],
    filter: 'warm',
  },
  {
    id: 'post-2',
    authorName: 'Pooja Vibes',
    authorHandle: '@pooja_vibes',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-happy-in-the-street-41551-large.mp4',
    caption: 'Dance challenge with my bestie! 💃✨ Drop a ❤️ if you love this energy! #DanceChallenge #TikTopNepal #Trending #GoodVibes',
    soundTitle: 'Trending Dance Beat 2026 🔥',
    likesCount: 3490,
    commentsCount: 215,
    sharesCount: 140,
    isLiked: true,
    createdAt: '5 hours ago',
    tags: ['DanceChallenge', 'TikTopNepal', 'Trending', 'GoodVibes'],
    filter: 'beauty',
  },
  {
    id: 'post-3',
    authorName: 'Kathmandu Beats',
    authorHandle: '@ktm_beats',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skater-riding-her-skateboard-41604-large.mp4',
    caption: 'Cruising through the city lights 🛹💨 Evening mood in KTM! #Kathmandu #SkateLife #Vibe #Nepal',
    soundTitle: 'Resham Firiri (Modern Lo-Fi Remix) 🏔️',
    likesCount: 890,
    commentsCount: 46,
    sharesCount: 19,
    isLiked: false,
    createdAt: '1 day ago',
    tags: ['Kathmandu', 'SkateLife', 'Vibe', 'Nepal'],
    filter: 'vibrant',
  },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'TikTop Live Creator',
  handle: '@creator_np',
  bio: 'Live Streamer • Host • Singer 🎵 • Welcome to my daily Face & Party streams!',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
};

export const AVATAR_PRESETS: { id: string; name: string; url: string }[] = [
  {
    id: 'preset-1',
    name: 'Smart Host',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-2',
    name: 'Energetic Girl',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-3',
    name: 'Musician',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-4',
    name: 'Glamour Queen',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-5',
    name: 'Creative Artist',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-6',
    name: 'Pro Gamer',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-7',
    name: 'Friendly Smile',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-8',
    name: 'Vibrant Creator',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
];

export const ALL_APP_USERS: AppUser[] = [
  {
    userId: 'USR-84920',
    name: 'Aarav Sharma',
    handle: '@aarav_live',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Guitarist 🎸 • Acoustic Jamming & Chill streams • Kathmandu 🇳🇵',
    followersCount: 48200,
    followingCount: 310,
    isFriend: true,
    isLive: true,
    liveTitle: 'Guitar Jamming & Chill Night 🎸🎵',
    liveMode: 'face',
    liveStreamerId: 'stream-1',
    verified: true,
  },
  {
    userId: 'USR-73910',
    name: 'Pooja & Squad',
    handle: '@pooja_vibes',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Party Room Host 👑 • Daily PK Battles & Late Night Chats!',
    followersCount: 142500,
    followingCount: 620,
    isFriend: true,
    isLive: true,
    liveTitle: 'Party Room #12 - Fun Debates & PK Battle! 🔥',
    liveMode: 'party',
    liveStreamerId: 'stream-2',
    verified: true,
  },
  {
    userId: 'USR-55219',
    name: 'Rohan Tech & Gaming',
    handle: '@rohan_gaming',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bio: 'Pro Gamer 🎮 • Esports streamer • Let us reach Conqueror together!',
    followersCount: 32100,
    followingCount: 145,
    isFriend: false,
    isLive: true,
    liveTitle: 'Rank Push To Conqueror! Road to 100K 🎮🏆',
    liveMode: 'face',
    liveStreamerId: 'stream-3',
  },
  {
    userId: 'USR-10923',
    name: 'Sunita Gurung',
    handle: '@sunita_cooks',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Food Blogger & Chef 🥟 • Authentic Nepali recipes and cooking tutorials!',
    followersCount: 89400,
    followingCount: 480,
    isFriend: true,
    isLive: true,
    liveTitle: 'Making Authentic Momo & Evening Chat! 🥟😋',
    liveMode: 'face',
    liveStreamerId: 'stream-4',
    verified: true,
  },
  {
    userId: 'USR-44820',
    name: 'Kathmandu Beats',
    handle: '@ktm_beats',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Open mic host & Karaoke enthusiast 🎤 • Kathmandu lo-fi music producer.',
    followersCount: 76900,
    followingCount: 512,
    isFriend: true,
    isLive: true,
    liveTitle: '8-Seat Open Mic & Karaoke Room! Sing Along 🎤',
    liveMode: 'party',
    liveStreamerId: 'stream-5',
  },
  {
    userId: 'USR-33912',
    name: 'Bipin Adhikari',
    handle: '@bipin_07',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Photographer & Travel vlogger 📸 • Nepal hills & culture explorer.',
    followersCount: 19800,
    followingCount: 420,
    isFriend: true,
    isLive: false,
  },
  {
    userId: 'USR-99201',
    name: 'Simran Shrestha',
    handle: '@simran_x',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Dancer & Choreographer 💃 • TikTop dance challenges creator!',
    followersCount: 65400,
    followingCount: 390,
    isFriend: false,
    isLive: false,
  },
  {
    userId: 'USR-22104',
    name: 'Pabitra Karki',
    handle: '@pabitra_k',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    bio: 'Lifestyle & Fitness advocate 🧘‍♀️ • Join my morning meditation live sessions!',
    followersCount: 28400,
    followingCount: 215,
    isFriend: true,
    isLive: false,
  },
];

