import React from 'react';
import { X, Coins } from 'lucide-react';
import { Gift } from '../types';
import { INITIAL_GIFTS } from '../data/mockData';

interface GiftTrayProps {
  isOpen: boolean;
  userCoins?: number;
  userDiamonds?: number;
  onClose: () => void;
  onSendGift: (gift: Gift) => void;
  onRechargeCoins?: () => void;
  onRechargeDiamonds?: () => void;
}

export const GiftTray: React.FC<GiftTrayProps> = ({
  isOpen,
  userCoins,
  userDiamonds,
  onClose,
  onSendGift,
  onRechargeCoins,
  onRechargeDiamonds,
}) => {
  if (!isOpen) return null;

  // Available coins (fall back to userDiamonds if coins not passed)
  const coinsBalance = userCoins !== undefined ? userCoins : (userDiamonds ?? 0);
  const handleRecharge = onRechargeCoins || onRechargeDiamonds || (() => {});

  return (
    <div
      id="gift-tray-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        id="gift-tray-sheet"
        className="w-full max-w-lg mx-auto bg-neutral-900 border-t border-white/10 rounded-t-3xl p-4 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Send Live Gift</span>
            <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-amber-300 text-xs font-bold">
              <Coins size={13} className="text-amber-400" />
              <span>{coinsBalance.toLocaleString()} Coins</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-recharge-coins"
              onClick={handleRecharge}
              className="text-xs bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-black px-3 py-1 rounded-full transition-all active:scale-95 shadow-sm"
            >
              + Recharge Coins
            </button>
            <button
              type="button"
              id="btn-close-gift-tray"
              onClick={onClose}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Gifts Grid */}
        <div className="grid grid-cols-4 gap-2.5 max-h-64 overflow-y-auto py-1">
          {INITIAL_GIFTS.map((gift) => {
            const cost = gift.coins ?? gift.diamonds;
            const canAfford = coinsBalance >= cost;
            return (
              <button
                key={gift.id}
                type="button"
                id={`btn-gift-${gift.id}`}
                onClick={() => onSendGift(gift)}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all active:scale-90 ${
                  canAfford
                    ? 'bg-white/5 border-white/10 hover:border-amber-500/60 hover:bg-amber-500/10'
                    : 'bg-white/[0.02] border-white/5 opacity-60'
                }`}
              >
                <span className="text-3xl mb-1 filter drop-shadow-md">{gift.icon}</span>
                <span className="text-xs font-medium text-white/90 truncate w-full text-center">
                  {gift.name}
                </span>
                <div className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 mt-0.5">
                  <Coins size={10} />
                  <span>{cost} Coins</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-white/40 mt-3">
          सिक्का (Coins) प्रयोग गरेर उपहार पठाउनुहोस्, होस्टले अंक (Points) रिवार्ड पाउनेछन्!
        </p>
      </div>
    </div>
  );
};
