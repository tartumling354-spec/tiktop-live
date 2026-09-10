import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  Crown,
  Check,
  Sparkles,
  Users,
  Clock,
  Heart,
} from 'lucide-react';
import { SeatInvitation } from '../types';

interface AudienceMember {
  id: string;
  name: string;
  avatar: string;
  isFanClub?: boolean;
  role?: string;
}

interface SeatInvitePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  seatNumber: number;
  onSendInvite: (targetUser: AudienceMember, seatNumber: number) => void;
  senderRole: 'Host' | 'Admin';
}

const SAMPLE_AUDIENCE: AudienceMember[] = [
  {
    id: 'aud-1',
    name: 'Rohan Sharma',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    isFanClub: true,
  },
  {
    id: 'aud-2',
    name: 'Sneha Thapa',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isFanClub: true,
  },
  {
    id: 'aud-3',
    name: 'Nirav Shrestha',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isFanClub: false,
  },
  {
    id: 'aud-4',
    name: 'Pooja Gurung',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isFanClub: true,
  },
  {
    id: 'aud-5',
    name: 'Kritika KC',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isFanClub: false,
  },
];

export const SeatInvitePickerModal: React.FC<SeatInvitePickerModalProps> = ({
  isOpen,
  onClose,
  seatNumber,
  onSendInvite,
  senderRole,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-seat-invite-picker"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl animate-scale-up text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>सिटमा आमन्त्रण (Invite to Seat #{seatNumber})</span>
              </h3>
              <span className="text-[10px] text-neutral-400">
                {senderRole === 'Host' ? '👑 होस्टको आमन्त्रण' : '🛡️ एडमिनको सिधा आमन्त्रण'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white rounded-full hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-[11px] text-neutral-300 my-2.5 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/10">
          💡 होस्ट व्यस्त रहँदा वा पार्टी लक भएको समयमा पनि एडमिनले आमन्त्रण पठाएपछि दर्शकले सिधै स्वीकार गरि सिटमा बस्न पाउनेछन्।
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20">
          {SAMPLE_AUDIENCE.map((user) => (
            <div
              key={user.id}
              className="p-2.5 bg-neutral-800 rounded-2xl border border-white/10 flex items-center justify-between gap-2 hover:border-indigo-500/50 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30 shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate">{user.name}</span>
                    {user.isFanClub && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1 rounded">
                        Fan
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400">दर्शक (Audience)</span>
                </div>
              </div>

              <button
                type="button"
                id={`btn-invite-user-${user.id}`}
                onClick={() => {
                  onSendInvite(user, seatNumber);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
              >
                आमन्त्रण (Invite)
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SeatInvitePromptProps {
  invitation: SeatInvitation | null;
  onAccept: (invitation: SeatInvitation) => void;
  onDecline: () => void;
}

export const SeatInvitePrompt: React.FC<SeatInvitePromptProps> = ({
  invitation,
  onAccept,
  onDecline,
}) => {
  if (!invitation) return null;

  return (
    <div
      id="modal-seat-invite-received"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="w-full max-w-sm bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-400/80 rounded-3xl p-5 shadow-[0_0_30px_rgba(251,191,36,0.3)] animate-scale-up text-white text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-xl relative mb-3">
          <img
            src={invitation.invitedUserAvatar}
            alt="Seat Invite"
            referrerPolicy="no-referrer"
            className="w-full h-full rounded-full object-cover"
          />
          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-neutral-950 p-1 rounded-full shadow">
            <Sparkles size={14} />
          </span>
        </div>

        <div className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-bold px-3 py-0.5 rounded-full mb-2">
          <Shield size={12} className="text-amber-400" />
          <span>{invitation.invitedBy} ले पठाउनुभएको आमन्त्रण</span>
        </div>

        <h3 className="text-base font-black text-white mb-1.5">
          Party Seat #{invitation.seatNumber} मा बस्ने आमन्त्रण!
        </h3>

        <p className="text-xs text-neutral-300 leading-relaxed mb-5">
          नमस्ते <strong>{invitation.invitedUserName}</strong>! तपाईंलाई पार्टी स्टेजको <strong>Seat #{invitation.seatNumber}</strong> मा बस्न आमन्त्रण गरिएको छ। के तपाईं स्टेजमा जोडिन तयार हुनुहुन्छ?
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-decline-seat-invite"
            onClick={onDecline}
            className="flex-1 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-neutral-300 font-bold text-xs transition-all active:scale-95"
          >
            अस्वीकार (Decline)
          </button>

          <button
            type="button"
            id="btn-accept-seat-invite"
            onClick={() => onAccept(invitation)}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Check size={16} strokeWidth={3} />
            <span>स्वीकार गरि बस्नुहोस्</span>
          </button>
        </div>
      </div>
    </div>
  );
};
