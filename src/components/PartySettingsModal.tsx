import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Unlock,
  Star,
  UserCheck,
  UserX,
  Clock,
  Ban,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PartyAccessMode, SeatJoinRequest, BannedUser, PartySeat } from '../types';

interface PartySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessMode: PartyAccessMode;
  onChangeAccessMode: (mode: PartyAccessMode) => void;
  joinRequests: SeatJoinRequest[];
  onApproveRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  bannedUsers: BannedUser[];
  onUnbanUser: (userId: string) => void;
  seats: PartySeat[];
  onToggleAdmin: (seatNumber: number, makeAdmin: boolean) => void;
  isHost: boolean;
  isAdmin: boolean;
}

export const PartySettingsModal: React.FC<PartySettingsModalProps> = ({
  isOpen,
  onClose,
  accessMode,
  onChangeAccessMode,
  joinRequests,
  onApproveRequest,
  onDeclineRequest,
  bannedUsers,
  onUnbanUser,
  seats,
  onToggleAdmin,
  isHost,
  isAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'mode' | 'requests' | 'admins' | 'banned'>('mode');
  const [now, setNow] = useState<number>(Date.now());

  // Update timer every second for 30-minute ban countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const adminSeats = seats.filter((s) => s.isOccupied && s.isAdmin && !s.isHost);

  const formatRemainingTime = (expiresAt: number) => {
    const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="modal-party-settings-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="modal-party-settings-panel"
        className="w-full max-w-md bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl animate-scale-up text-white flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Party Live व्यवस्थापन (Seat & Moderation)</span>
                {isHost && (
                  <span className="text-[10px] bg-amber-500 text-neutral-950 px-1.5 py-0.2 rounded font-black">
                    Host
                  </span>
                )}
                {!isHost && isAdmin && (
                  <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-black">
                    Admin
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-400">
                सिट अनुमति, एडमिन प्रणाली र ३० मिनेट निष्कासन नियम
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-party-settings"
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-2.5 border-b border-white/10 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('mode')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'mode'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <Lock size={12} />
            <span>सिट नियम (Access)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 relative ${
              activeTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <Users size={12} />
            <span>अनुरोधहरू</span>
            {joinRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-500 text-white font-extrabold rounded-full">
                {joinRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'admins'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <ShieldCheck size={12} />
            <span>Admins ({adminSeats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 relative ${
              activeTab === 'banned'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-neutral-300 hover:bg-white/10'
            }`}
          >
            <Ban size={12} />
            <span>प्रतिबन्धित ({bannedUsers.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 pr-1 scrollbar-thin scrollbar-thumb-white/20">
          {/* TAB 1: ACCESS MODE SETTINGS */}
          {activeTab === 'mode' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-neutral-800/80 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-white block mb-1">
                  स्टेज सिट बस्ने अनुमति प्रणाली (Seat Access Mode)
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                  होस्टले पार्टी लाइभको सिट कसले बस्न पाउने भन्ने नियम निर्धारण गर्न सक्नुहुन्छ:
                </p>

                <div className="space-y-2">
                  {/* Mode 1: Free for all */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      accessMode === 'free'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    } ${!isHost ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="accessMode"
                      checked={accessMode === 'free'}
                      disabled={!isHost}
                      onChange={() => isHost && onChangeAccessMode('free')}
                      className="mt-1 text-indigo-500 focus:ring-indigo-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Unlock size={14} className="text-emerald-400" />
                        <span className="text-xs font-bold text-white">सबै बस्न मिल्ने (Open To All)</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        कुनै पनि दर्शकले खाली सिटमा क्लिक गरेर सिधै बस्न पाउनेछन्।
                      </p>
                    </div>
                  </label>

                  {/* Mode 2: Host & Admin Approval */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      accessMode === 'approval'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    } ${!isHost ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="accessMode"
                      checked={accessMode === 'approval'}
                      disabled={!isHost}
                      onChange={() => isHost && onChangeAccessMode('approval')}
                      className="mt-1 text-indigo-500 focus:ring-indigo-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-400" />
                        <span className="text-xs font-bold text-white">
                          स्वीकृति प्रणाली (Host / Admin Approval)
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        बस्न चाहने व्यक्तिले अनुरोध पठाउनुपर्छ। होस्ट वा एडमिनले स्वीकार गरेपछि मात्र बस्न मिल्छ।
                      </p>
                    </div>
                  </label>

                  {/* Mode 3: Fan Club Only */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      accessMode === 'fanclub'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                    } ${!isHost ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="accessMode"
                      checked={accessMode === 'fanclub'}
                      disabled={!isHost}
                      onChange={() => isHost && onChangeAccessMode('fanclub')}
                      className="mt-1 text-indigo-500 focus:ring-indigo-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-white">
                          फ्यानक्लब सदस्य मात्र (Fan Club Only)
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        फ्यानक्लबमा जोडिएका विशिष्ट सदस्यहरूले मात्र सिट लिन पाउनेछन्।
                      </p>
                    </div>
                  </label>
                </div>

                {!isHost && (
                  <p className="mt-3 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    💡 नोट: सिट नियम परिवर्तन गर्ने अधिकार होस्टसँग मात्र छ। एडमिनले अनुरोध स्वीकृत वा आमन्त्रण गर्न सक्नुहुन्छ।
                  </p>
                )}
              </div>

              {/* Host Seat Rule Notice */}
              <div className="p-3 bg-neutral-800/50 rounded-2xl border border-white/10 text-xs text-neutral-300">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                  <span>👑</span>
                  <span>होस्ट सिट नियम (Seat #1 Rule):</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  होस्ट सधैं १ नम्बर सिटमै बसेको हुनुपर्छ। १ नम्बर सिट अरू कसैले लिन वा खाली गर्न पाउँदैनन्।
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SEAT JOIN REQUESTS (Approval queue) */}
          {activeTab === 'requests' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-neutral-300">
                  प्रतीक्षारत अनुरोधहरू ({joinRequests.length})
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">
                  (होस्ट वा एडमिन दुवैले स्वीकृत गर्न मिल्ने)
                </span>
              </div>

              {joinRequests.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 bg-white/5 rounded-2xl border border-white/10">
                  <UserCheck size={32} className="mx-auto text-neutral-500 mb-2" />
                  <p className="text-xs font-bold text-white">कुनै नयाँ अनुरोध छैन</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    दर्शकहरूले सिट अनुरोध पठाउँदा यहाँ देखिनेछ।
                  </p>
                </div>
              ) : (
                joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-neutral-800 rounded-2xl border border-white/10 flex items-center justify-between gap-2 shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30 shrink-0">
                        <img
                          src={req.userAvatar}
                          alt={req.userName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white truncate">{req.userName}</span>
                          {req.isFanClub && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1 rounded">
                              Fan
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-indigo-300 block">
                          Seat #{req.seatNumber} मा बस्न चाहनुहुन्छ
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onApproveRequest(req.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition-all active:scale-95"
                      >
                        <Check size={13} strokeWidth={3} />
                        <span>स्वीकार</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineRequest(req.id)}
                        className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-bold transition-all"
                      >
                        अस्वीकार
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ADMINS LIST */}
          {activeTab === 'admins' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-neutral-800 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-white block mb-1">
                  कोठाका व्यवस्थापकहरू (Room Admins)
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  होस्टले कसैलाई पनि व्यवस्थापक (Admin) बनाउन वा हटाउन सक्नुहुन्छ। एडमिनले पाहुनाहरूलाई सिटबाट हटाउन, ३० मिनेट निष्कासन गर्न, र लक हुँदा दर्शकलाई सिटमा आमन्त्रण गर्न सक्नुहुन्छ।
                </p>
              </div>

              {/* Host Card */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shrink-0">
                    <img
                      src={seats.find((s) => s.isHost)?.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt="Host"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white">होस्ट (Room Owner)</span>
                      <span className="text-[9px] bg-amber-500 text-neutral-950 font-black px-1.5 py-0.2 rounded">
                        Host • Seat #1
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400">सबैभन्दा उच्च अधिकार (सर्वोच्च)</span>
                  </div>
                </div>
              </div>

              {/* Appointed Admins List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-300 block px-1">
                  नियुक्त एडमिनहरू ({adminSeats.length})
                </span>

                {adminSeats.length === 0 ? (
                  <div className="py-6 text-center text-neutral-400 bg-white/5 rounded-2xl border border-white/10">
                    <Shield size={24} className="mx-auto text-neutral-500 mb-1" />
                    <p className="text-xs font-medium">हाल कोही पनि एडमिन नियुक्त गरिएको छैन</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      स्टेजमा बसेको कुनै पनि साथीलाई क्लिक गरेर होस्टले एडमिन बनाउन सक्नुहुन्छ।
                    </p>
                  </div>
                ) : (
                  adminSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className="p-3 bg-neutral-800 rounded-2xl border border-indigo-500/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-indigo-400 shrink-0">
                          <img
                            src={seat.userAvatar}
                            alt={seat.userName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white">{seat.userName}</span>
                            <span className="text-[9px] bg-indigo-600 text-white font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Shield size={9} />
                              Admin
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">Seat #{seat.seatNumber}</span>
                        </div>
                      </div>

                      {/* Remove Admin Button (Host only) */}
                      {isHost && (
                        <button
                          type="button"
                          onClick={() => onToggleAdmin(seat.seatNumber, false)}
                          className="text-[11px] px-2.5 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold transition-all"
                        >
                          हटाउनुहोस्
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BANNED USERS (30-minute block list) */}
          {activeTab === 'banned' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1 mb-1">
                  <AlertCircle size={14} />
                  <span>३० मिनेटका लागि निष्कासित व्यक्तिहरूको सूची</span>
                </span>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  अनुचित व्यवहार वा नियम उल्लंघन गरेका व्यक्तिहरू ३० मिनेटसम्म यस पार्टी लाइभमा आउन पाउँदैनन्। आवश्यक परे होस्ट वा एडमिनले फुकुवा (Unban) गर्न सक्नुहुन्छ।
                </p>
              </div>

              {bannedUsers.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 bg-white/5 rounded-2xl border border-white/10">
                  <Ban size={28} className="mx-auto text-neutral-500 mb-1" />
                  <p className="text-xs font-bold text-white">हाल कुनै पनि प्रतिबन्धित व्यक्ति छैनन्</p>
                  <p className="text-[11px] text-neutral-400 mt-1">कोठा शान्त र नियम संगत छ।</p>
                </div>
              ) : (
                bannedUsers.map((user) => {
                  const isExpired = user.expiresAt <= now;
                  return (
                    <div
                      key={user.id}
                      className="p-3 bg-neutral-800 rounded-2xl border border-rose-500/25 flex items-center justify-between gap-2 shadow-md"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-rose-500/50 shrink-0">
                          <img
                            src={user.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={user.userName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white truncate block">{user.userName}</span>
                          <span className="text-[10px] text-rose-300 block truncate">
                            कारण: {user.reason || 'अनुचित व्यवहार'}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono mt-0.5">
                            <Clock size={10} />
                            <span>{isExpired ? 'समय समाप्त (Expired)' : `बाँकी समय: ${formatRemainingTime(user.expiresAt)}`}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onUnbanUser(user.userId)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shrink-0 active:scale-95"
                      >
                        फुकुवा (Unban)
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
