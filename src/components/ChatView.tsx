import React, { useState, useEffect, useRef } from 'react';
import { Search, Radio, User, Users, CheckCheck, Plus, MessageSquare, Send, Smile, Mic, X, ArrowLeft, Copy, Check, AlertTriangle, Bell, ShieldAlert } from 'lucide-react';
import { LiveMode, AppUser, LiveStreamer } from '../types';
import { ALL_APP_USERS, EXPLORE_STREAMERS } from '../data/mockData';
import { getStoredInboxNotices, markAllNoticesAsRead, SystemInboxNotice } from '../utils/inboxNotices';

interface ChatViewProps {
  onStartLive: (mode: LiveMode) => void;
  onWatchStream?: (streamer: LiveStreamer) => void;
  targetUser?: AppUser | null;
  onClearTargetUser?: () => void;
}

interface MessageItem {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  isAudio?: boolean;
}

interface ConversationItem {
  id: string;
  userId: string;
  name: string;
  handle: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isLive?: boolean;
  liveStreamerId?: string;
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'c1',
    userId: 'USR-73910',
    name: 'Pooja & Squad',
    handle: '@pooja_vibes',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Are you joining our Party Live tonight? 8 seats ready! 🔥',
    time: '2m ago',
    unread: 2,
    isOnline: true,
    isLive: true,
    liveStreamerId: 'stream-2',
  },
  {
    id: 'c2',
    userId: 'USR-84920',
    name: 'Aarav Sharma',
    handle: '@aarav_live',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Thanks for the roses during the live stream! 🌹',
    time: '1h ago',
    unread: 0,
    isOnline: true,
    isLive: true,
    liveStreamerId: 'stream-1',
  },
  {
    id: 'c3',
    userId: 'USR-10923',
    name: 'Sunita Gurung',
    handle: '@sunita_cooks',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'भोलिको मोमो रेसिपी लाइभमा आउनुहोला है! 🥟😋',
    time: '3h ago',
    unread: 1,
    isOnline: true,
    isLive: true,
    liveStreamerId: 'stream-4',
  },
  {
    id: 'c4',
    userId: 'USR-33912',
    name: 'Bipin Adhikari',
    handle: '@bipin_07',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Let me know when you start Face Live! 👋',
    time: 'Yesterday',
    unread: 0,
    isOnline: false,
    isLive: false,
  },
];

const INITIAL_MESSAGES_MAP: Record<string, MessageItem[]> = {
  c1: [
    { id: 'm1', text: 'नमस्ते! हाम्रो पार्टी लाइभमा स्वागत छ ✨', sender: 'them', time: '10:14 AM' },
    { id: 'm2', text: 'Are you joining our Party Live tonight? 8 seats ready! 🔥', sender: 'them', time: '10:15 AM' },
  ],
  c2: [
    { id: 'm3', text: 'Hey Aarav, great acoustic session yesterday! 🎸', sender: 'me', time: '09:30 AM' },
    { id: 'm4', text: 'Thanks for the roses during the live stream! 🌹', sender: 'them', time: '09:35 AM' },
  ],
  c3: [
    { id: 'm5', text: 'भोलिको मोमो रेसिपी लाइभमा आउनुहोला है! 🥟😋', sender: 'them', time: '08:00 AM' },
  ],
  c4: [
    { id: 'm6', text: 'Hey bro, are you streaming today?', sender: 'me', time: 'Yesterday' },
    { id: 'm7', text: 'Let me know when you start Face Live! 👋', sender: 'them', time: 'Yesterday' },
  ],
};

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '🌹', '😊', '🚀', '✨', '🥟', '🎉', '💯'];

export const ChatView: React.FC<ChatViewProps> = ({
  onStartLive,
  onWatchStream,
  targetUser,
  onClearTargetUser,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);
  const [messagesMap, setMessagesMap] = useState<Record<string, MessageItem[]>>(INITIAL_MESSAGES_MAP);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newUserSearchQuery, setNewUserSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // System Warning & Compliance Notices State
  const [systemNotices, setSystemNotices] = useState<SystemInboxNotice[]>(() => getStoredInboxNotices());
  const [showNoticesModal, setShowNoticesModal] = useState<boolean>(false);

  useEffect(() => {
    let lastFirstId = systemNotices[0]?.id || '';
    let lastLength = systemNotices.length;

    const checkNotices = () => {
      const fresh = getStoredInboxNotices();
      const freshFirstId = fresh[0]?.id || '';
      if (fresh.length !== lastLength || freshFirstId !== lastFirstId) {
        lastLength = fresh.length;
        lastFirstId = freshFirstId;
        setSystemNotices(fresh);
      }
    };

    const interval = setInterval(checkNotices, 3000);
    window.addEventListener('storage', checkNotices);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkNotices);
    };
  }, []);

  const unreadNoticesCount = systemNotices.filter((n) => !n.read).length;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesMap, selectedConv]);

  // Handle external targetUser passed from UserSearchModal or profile
  useEffect(() => {
    if (targetUser) {
      openChatWithUser(targetUser);
      onClearTargetUser?.();
    }
  }, [targetUser]);

  const openChatWithUser = (user: AppUser) => {
    // Check if conversation already exists
    let conv = conversations.find((c) => c.userId === user.userId);
    if (!conv) {
      const newConvId = `conv-${Date.now()}`;
      conv = {
        id: newConvId,
        userId: user.userId,
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        lastMessage: 'नयाँ सन्देश सुरु भयो',
        time: 'Just now',
        unread: 0,
        isOnline: true,
        isLive: user.isLive,
        liveStreamerId: user.liveStreamerId,
      };
      setConversations((prev) => [conv!, ...prev]);
      setMessagesMap((prev) => ({
        ...prev,
        [newConvId]: [
          {
            id: `sys-${Date.now()}`,
            text: `तपाईं र ${user.name} बीचको गोप्य SMS कुराकानी सुरु भयो।`,
            sender: 'them',
            time: 'Just now',
          },
        ],
      }));
    }
    setSelectedConv(conv);
    setIsNewChatModalOpen(false);
  };

  const handleSendMessage = (textToSend?: string, isAudio = false) => {
    const message = (textToSend || newMsgText).trim();
    if (!message || !selectedConv) return;

    const newMsg: MessageItem = {
      id: Date.now().toString(),
      text: message,
      sender: 'me',
      time: 'Just now',
      isAudio,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConv.id]: [...(prev[selectedConv.id] || []), newMsg],
    }));

    // Update conversation item preview
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? { ...c, lastMessage: message, time: 'Just now' }
          : c
      )
    );

    if (!textToSend) {
      setNewMsgText('');
    }

    // Realistic 2-way auto-reply from recipient
    const recipientName = selectedConv.name;
    const recipientConvId = selectedConv.id;
    setTimeout(() => {
      const replies = [
        `नमस्ते! तपाईंको सन्देश पाएँ, धेरै धेरै धन्यवाद! 💖`,
        `म अहिले लाइभ तयारी गर्दैछु, पछि कुरा गरौंला है! 🌟`,
        `हो नि! स्ट्रिममा भेटौंला! 🌹`,
        `Thank you so much! See you in my next stream! ✨`,
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        text: randomReply,
        sender: 'them',
        time: 'Just now',
      };
      setMessagesMap((prev) => ({
        ...prev,
        [recipientConvId]: [...(prev[recipientConvId] || []), replyMsg],
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === recipientConvId
            ? { ...c, lastMessage: randomReply, time: 'Just now' }
            : c
        )
      );
    }, 1500);
  };

  const currentMessages = selectedConv ? messagesMap[selectedConv.id] || [] : [];

  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Live friends for horizontal story carousel
  const liveFriends = ALL_APP_USERS.filter((u) => u.isFriend && u.isLive);

  // Filtered users for "New SMS" modal
  const searchableUsers = ALL_APP_USERS.filter((u) => {
    const q = newUserSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.userId.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q)
    );
  });

  return (
    <div id="chat-screen" className="flex-1 flex flex-col pb-24 max-w-2xl mx-auto w-full px-3 sm:px-4 pt-3 overflow-hidden">
      {/* If in conversation view */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-150">
          {/* Conversation Header */}
          <div className="p-3.5 border-b border-white/10 bg-neutral-950/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                id="btn-back-to-chats"
                onClick={() => setSelectedConv(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
                title="Back to inbox"
              >
                <ArrowLeft size={17} />
              </button>

              <div className="relative shrink-0">
                <img
                  src={selectedConv.avatar}
                  alt={selectedConv.name}
                  referrerPolicy="no-referrer"
                  className={`w-9 h-9 rounded-full object-cover border-2 ${
                    selectedConv.isLive ? 'border-rose-500' : 'border-white/10'
                  }`}
                />
                {selectedConv.isLive ? (
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-neutral-950 animate-pulse" />
                ) : (
                  selectedConv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  )
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white truncate block">
                    {selectedConv.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 truncate">
                    {selectedConv.handle}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                    ID: {selectedConv.userId}
                  </span>
                  {selectedConv.isLive ? (
                    <span className="text-rose-400 font-bold flex items-center gap-0.5">
                      <Radio size={8} className="animate-pulse" />
                      <span>लाइभ छन्</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400">अनलाइन</span>
                  )}
                </div>
              </div>
            </div>

            {/* Top action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {selectedConv.isLive && (
                <button
                  type="button"
                  id="btn-conv-watch-live"
                  onClick={() => {
                    const streamer = EXPLORE_STREAMERS.find(
                      (s) => s.id === selectedConv.liveStreamerId
                    );
                    if (streamer && onWatchStream) {
                      onWatchStream(streamer);
                    } else {
                      onStartLive('face');
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                >
                  <Radio size={12} className="animate-pulse" />
                  <span className="hidden sm:inline">लाइभ हेर्नुहोस्</span>
                  <span className="sm:hidden">लाइभ</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onStartLive('party')}
                className="px-2 py-1 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1"
                title="Invite to Party Live"
              >
                <Users size={12} />
                <span className="hidden sm:inline">पार्टी निमन्त्रणा</span>
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
            <div className="text-center py-2">
              <span className="text-[10px] text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                गोप्य सुरक्षित सन्देश (End-to-End Encrypted SMS)
              </span>
            </div>

            {currentMessages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    m.sender === 'me'
                      ? 'bg-rose-600 text-white rounded-br-none'
                      : 'bg-white/10 text-neutral-100 rounded-bl-none border border-white/5'
                  }`}
                >
                  {m.isAudio ? (
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Mic size={13} />
                      </div>
                      <span className="font-semibold text-xs">🎙️ 0:05 अडियो सन्देश (Voice SMS)</span>
                    </div>
                  ) : (
                    <p>{m.text}</p>
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/60">
                    <span>{m.time}</span>
                    {m.sender === 'me' && <CheckCheck size={11} className="text-white/80" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Emoji Bar */}
          <div className="px-3 py-1.5 bg-neutral-950/40 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto text-base">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendMessage(emoji)}
                className="hover:scale-125 transition-transform p-1 cursor-pointer shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-white/10 bg-neutral-950/80 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => handleSendMessage('🎙️ अडियो भ्वाइस सन्देश', true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-rose-400 transition-colors"
              title="Voice message"
            >
              <Mic size={17} />
            </button>

            <input
              type="text"
              id="input-inbox-sms-message"
              value={newMsgText}
              onChange={(e) => setNewMsgText(e.target.value)}
              placeholder="कुनै पनि सन्देश (SMS) लेख्नुहोस्..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />

            <button
              type="submit"
              id="btn-send-sms"
              disabled={!newMsgText.trim()}
              className="px-4 py-2 bg-rose-600 disabled:opacity-40 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-rose-900/30 cursor-pointer"
            >
              <Send size={14} />
              <span>पठाउनुहोस्</span>
            </button>
          </form>
        </div>
      ) : (
        /* Conversation List View */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Live Friends Row (लाइभ साथीहरू) */}
          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-3 mb-3 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <h4 className="text-xs font-bold text-white">
                  लाइभ साथीहरू (Live Friends)
                </h4>
              </div>
              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                {liveFriends.length} जना अहिले लाइभ
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {liveFriends.map((f) => {
                const streamer = EXPLORE_STREAMERS.find((s) => s.id === f.liveStreamerId);
                return (
                  <button
                    key={f.userId}
                    type="button"
                    onClick={() => {
                      if (streamer && onWatchStream) {
                        onWatchStream(streamer);
                      } else {
                        openChatWithUser(f);
                      }
                    }}
                    className="flex flex-col items-center gap-1 group shrink-0 cursor-pointer text-left"
                  >
                    <div className="relative">
                      <img
                        src={f.avatar}
                        alt={f.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border-2 border-rose-500 ring-2 ring-rose-500/40 group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[7px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                        <Radio size={6} />
                        <span>LIVE</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-300 font-semibold truncate max-w-[65px] text-center">
                      {f.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}

              {/* Add New Chat Button Inside Friends List */}
              <button
                type="button"
                id="btn-new-friend-chat-circle"
                onClick={() => setIsNewChatModalOpen(true)}
                className="flex flex-col items-center gap-1 group shrink-0 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-rose-500 group-hover:scale-105 transition-all">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] text-neutral-400 group-hover:text-white truncate max-w-[65px]">
                  नयाँ SMS
                </span>
              </button>
            </div>
          </div>

          {/* Official System Notices & Warning Alerts Card */}
          <div
            id="inbox-system-notices-banner"
            onClick={() => {
              setShowNoticesModal(true);
              markAllNoticesAsRead();
              setSystemNotices((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            className={`p-3 rounded-2xl border transition-all cursor-pointer mb-3 flex items-center justify-between ${
              unreadNoticesCount > 0
                ? 'bg-rose-950/40 border-rose-500/50 hover:bg-rose-950/60 shadow-lg shadow-rose-900/20'
                : 'bg-neutral-900/80 border-white/10 hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  unreadNoticesCount > 0
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-white/10 text-neutral-300'
                }`}
              >
                {unreadNoticesCount > 0 ? <AlertTriangle size={18} /> : <Bell size={18} />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    आधिकारिक प्रणाली सूचना (Official Warnings)
                  </span>
                  {unreadNoticesCount > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {unreadNoticesCount} नयाँ
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                  {systemNotices.length > 0
                    ? systemNotices[0].nepaliTitle || systemNotices[0].title
                    : 'कुनै पनि चेतावनी वा सूचना छैन'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-400 hover:underline">हेर्नुहोस् →</span>
          </div>

          {/* Search bar & + New SMS Button */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                id="input-search-conversations"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="कुनै पनि सन्देश, User ID वा साथी खोज्नुहोस्..."
                className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            {/* + New SMS Button */}
            <button
              type="button"
              id="btn-open-new-sms-modal"
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span>नयाँ SMS</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredConversations.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-neutral-400">कुनै कुराकानी फेला परेन</p>
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="mt-2 text-xs text-rose-400 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>कुनै पनि व्यक्तिलाई नयाँ SMS पठाउनुहोस्</span>
                </button>
              </div>
            ) : (
              filteredConversations.map((c) => (
                <div
                  key={c.id}
                  id={`conversation-item-${c.id}`}
                  onClick={() => setSelectedConv(c)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-white/5 hover:border-white/15 cursor-pointer transition-all active:scale-98 group"
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className={`w-12 h-12 rounded-full object-cover border-2 ${
                        c.isLive ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-white/10'
                      }`}
                    />
                    {c.isLive ? (
                      <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[7px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                        <Radio size={6} />
                        <span>LIVE</span>
                      </span>
                    ) : (
                      c.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                      )
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                          {c.userId}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">{c.time}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-neutral-300 truncate group-hover:text-white transition-colors">
                        {c.lastMessage}
                      </p>
                      {c.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Start New SMS / Message with ANY Person */}
      {isNewChatModalOpen && (
        <div
          id="modal-new-sms-user-picker"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsNewChatModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-neutral-950">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    नयाँ SMS पठाउनुहोस् (New Direct SMS)
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    कुनै पनि व्यक्ति वा User ID छान्नुहोस्
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search within modal */}
            <div className="p-3.5 bg-neutral-950/40 border-b border-white/10">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                <input
                  type="text"
                  value={newUserSearchQuery}
                  onChange={(e) => setNewUserSearchQuery(e.target.value)}
                  placeholder="User ID (उदा. USR-84920) वा नाम लेख्नुहोस्..."
                  autoFocus
                  className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Users list to pick from */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {searchableUsers.map((user) => (
                <div
                  key={user.userId}
                  id={`btn-pick-chat-user-${user.userId}`}
                  onClick={() => openChatWithUser(user)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950/50 hover:bg-neutral-800 border border-white/5 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{user.name}</span>
                        {user.isLive && (
                          <span className="text-[8px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full">
                            LIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 block">{user.handle}</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                        ID: {user.userId}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <span>SMS गर्नुहोस्</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Warning & Compliance Notices Modal */}
      {showNoticesModal && (
        <div
          id="modal-system-notices"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-neutral-900 border border-white/15 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">आधिकारिक प्रणाली सूचना</h3>
                  <p className="text-[10px] text-neutral-400">System Warning & Notices</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNoticesModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Notices List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {systemNotices.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">हाल कुनै पनि सूचना वा चेतावनी छैन।</p>
                </div>
              ) : (
                systemNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className={`p-3.5 rounded-2xl border text-left space-y-1.5 ${
                      notice.severity === 'warning'
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        <span>{notice.nepaliTitle || notice.title}</span>
                      </span>
                      <span className="text-[9px] text-neutral-400 shrink-0 font-mono">
                        {notice.timeString || new Date(notice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed">
                      {notice.nepaliMessage || notice.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-white/10 bg-neutral-950 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  markAllNoticesAsRead();
                  setSystemNotices((prev) => prev.map((n) => ({ ...n, read: true })));
                  setShowNoticesModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all active:scale-95 cursor-pointer"
              >
                बुझेँ (Acknowledge & Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
