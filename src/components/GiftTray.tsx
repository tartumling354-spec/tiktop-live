import React, { useState, useMemo } from 'react';
import { X, Coins, Sparkles, Award, Gift as GiftIcon, ShieldCheck, Flame, Crown, Users, Check, Heart } from 'lucide-react';
import { Gift, GiftCategory, PartySeat } from '../types';
import { ALL_GIFTS, GIFT_CATEGORIES } from '../data/giftsData';
import { getStoredWealthTotal, calculateWealthLevel } from '../utils/levelSystem';

export type RecipientTarget = 'all' | number[];

interface GiftTrayProps {
  isOpen: boolean;
  userCoins?: number;
  userDiamonds?: number;
  isPartyLive?: boolean;
  partySeats?: PartySeat[];
  selectedRecipients?: 'all' | number[];
  onSelectRecipients?: (recipients: 'all' | number[]) => void;
  selectedRecipient?: 'all' | number; // 'all' or seatNumber for backwards compat
  onSelectRecipient?: (recipient: 'all' | number) => void;
  onClose: () => void;
  onSendGift: (gift: Gift, recipientTarget?: 'all' | number[]) => void;
  onRechargeCoins?: () => void;
  onRechargeDiamonds?: () => void;
  onQuickAddTestCoins?: () => void;
}

export const GiftTray: React.FC<GiftTrayProps> = ({
  isOpen,
  userCoins,
  userDiamonds,
  isPartyLive = false,
  partySeats = [],
  selectedRecipients: externalRecipients,
  onSelectRecipients,
  selectedRecipient: externalRecipient,
  onSelectRecipient,
  onClose,
  onSendGift,
  onRechargeCoins,
  onRechargeDiamonds,
  onQuickAddTestCoins,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GiftCategory | 'all'>('regular');
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [internalRecipients, setInternalRecipients] = useState<'all' | number[]>('all');

  // Occupied party seats (for gifting target)
  const occupiedSeats = useMemo(() => partySeats.filter((s) => s.isOccupied), [partySeats]);
  const occupiedCount = Math.max(1, occupiedSeats.length);

  // Active recipients: controlled or internal
  const activeRecipients: 'all' | number[] = useMemo(() => {
    if (externalRecipients !== undefined) {
      return externalRecipients;
    }
    if (externalRecipient !== undefined) {
      if (externalRecipient === 'all') return 'all';
      return [externalRecipient];
    }
    return internalRecipients;
  }, [externalRecipients, externalRecipient, internalRecipients]);

  const updateRecipients = (newRecs: 'all' | number[]) => {
    setInternalRecipients(newRecs);
    if (onSelectRecipients) {
      onSelectRecipients(newRecs);
    }
    if (onSelectRecipient) {
      if (newRecs === 'all') {
        onSelectRecipient('all');
      } else if (newRecs.length === 1) {
        onSelectRecipient(newRecs[0]);
      } else {
        onSelectRecipient('all');
      }
    }
  };

  const isAllSelected = activeRecipients === 'all';
  const selectedSeatNumbers: number[] = useMemo(() => {
    if (activeRecipients === 'all') {
      return occupiedSeats.map((s) => s.seatNumber);
    }
    return activeRecipients;
  }, [activeRecipients, occupiedSeats]);

  const recipientCount = isPartyLive
    ? isAllSelected
      ? occupiedCount
      : Math.max(1, selectedSeatNumbers.length)
    : 1;

  // Toggle single seat in/out of selection (१, ३, ८ आदि छानेर gifting गर्न मिल्ने)
  const handleToggleSeat = (seatNumber: number) => {
    if (activeRecipients === 'all') {
      // Switched from all to this specific friend
      updateRecipients([seatNumber]);
    } else {
      const isAlreadySelected = activeRecipients.includes(seatNumber);
      if (isAlreadySelected) {
        const remaining = activeRecipients.filter((n) => n !== seatNumber);
        updateRecipients(remaining.length === 0 ? 'all' : remaining);
      } else {
        const next = [...activeRecipients, seatNumber].sort((a, b) => a - b);
        updateRecipients(next);
      }
    }
  };

  const handleSelectAll = () => {
    updateRecipients('all');
  };

  const handleClear = () => {
    const hostSeat = occupiedSeats.find((s) => s.isHost);
    updateRecipients(hostSeat ? [hostSeat.seatNumber] : [1]);
  };

  if (!isOpen) return null;

  // Available coins (fall back to userDiamonds if coins not passed)
  const coinsBalance = userCoins !== undefined ? userCoins : (userDiamonds ?? 0);
  const handleRecharge = onRechargeCoins || onRechargeDiamonds || (() => {});

  // Filter gifts by category
  const displayedGifts = ALL_GIFTS.filter((g) => {
    if (selectedCategory === 'all') return true;
    return g.category === selectedCategory;
  });

  const formatPoints = (amount: number) => {
    if (amount >= 1000) {
      const k = amount / 1000;
      return `${k}k`;
    }
    return `${amount}`;
  };

  const handleGiftClick = (gift: Gift) => {
    setSelectedGiftId(gift.id);
    onSendGift(gift, activeRecipients);
  };

  return (
    <div
      id="gift-tray-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in pointer-events-none"
    >
      {/* Upper viewport is 100% transparent and clear so host & party guests are completely visible */}
      <div
        className="w-full flex-1 pointer-events-auto cursor-pointer"
        onClick={onClose}
        title="लाइभ स्ट्रिम हेर्न वा बन्द गर्न यहाँ थिच्नुहोस्"
      />
      <div
        id="gift-tray-sheet"
        className="w-full max-w-xl mx-auto bg-neutral-900/98 border-t border-white/20 rounded-t-3xl p-3 sm:p-4 shadow-2xl animate-slide-up flex flex-col max-h-[48vh] sm:max-h-[50vh] text-white pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Unobstructed Live Stream Confirmation Bar */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[11px]">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>लाइभ स्ट्रिम पूर्ण खुला छ (Face Unobstructed)</span>
          </span>
          <div className="w-8 h-1 rounded-full bg-white/20 mx-auto" />
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-white/10"
          >
            बन्द गर्नुहोस्
          </button>
        </div>

        {/* Header: Title, Coins Balance, Recharge */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow">
              <GiftIcon size={14} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">उपहार पसल (Gift Store)</span>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-amber-300 font-bold">
                <Coins size={11} className="text-amber-400" />
                <span>{coinsBalance.toLocaleString()} Coins बाँकी</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {onQuickAddTestCoins && (
              <button
                type="button"
                id="btn-quick-test-coins"
                onClick={onQuickAddTestCoins}
                className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 transition-all shadow-sm active:scale-95"
                title="परीक्षणको लागि तत्काल +१००k सिक्का थप्नुहोस्"
              >
                <span>+100k Test</span>
              </button>
            )}
            <button
              type="button"
              id="btn-recharge-coins"
              onClick={handleRecharge}
              className="text-[11px] bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-neutral-950 font-black px-3 py-1 rounded-full transition-all active:scale-95 shadow-md flex items-center gap-1"
            >
              <Coins size={12} className="text-neutral-950" />
              <span>रिचार्ज</span>
            </button>
            <button
              type="button"
              id="btn-close-gift-tray"
              onClick={onClose}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Wealth Level Progress Strip */}
        {(() => {
          const totalCoins = getStoredWealthTotal();
          const wealth = calculateWealthLevel(totalCoins);
          const toNext = Math.max(0, wealth.nextVal - totalCoins);
          return (
            <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-400/25 rounded-2xl my-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{wealth.icon}</span>
                <span className="font-extrabold text-amber-300">Wealth Lv.{wealth.level}</span>
                <span className="text-[10px] text-neutral-400 hidden sm:inline">({wealth.nepaliTitle})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 sm:w-28 bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-rose-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${wealth.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-amber-300/90 font-mono font-bold">
                  {wealth.level >= 10 ? 'MAX LV' : `Lv.${wealth.level + 1} मा पुग्न ${toNext >= 1000 ? `${(toNext / 1000).toFixed(0)}k` : toNext} बाँकी`}
                </span>
              </div>
            </div>
          );
        })()}

        {/* PARTY LIVE: FAMILIAR FRIENDS PHOTO PICKER (१/३/८ वा अन्य नम्बरका साथीहरूलाई एकै पटक वा छानेर gifting गर्न मिल्ने) */}
        {isPartyLive && occupiedSeats.length > 0 && (
          <div className="mb-2 p-2.5 bg-neutral-800/90 border border-indigo-500/35 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-indigo-400" />
                <span className="text-[11px] font-bold text-indigo-300">
                  उपहार पाउने परिचित साथीहरू छान्नुहोस्:
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-select-all-seats"
                  onClick={handleSelectAll}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all ${
                    isAllSelected
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                  }`}
                >
                  सबै (All)
                </button>
                <button
                  type="button"
                  id="btn-clear-seat-selection"
                  onClick={handleClear}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                >
                  रिसेट
                </button>
              </div>
            </div>

            {/* Scrollable Row with Small Photos (Avatars) of Seated Friends */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-white/20">
              {/* Option 1: Send to All Seated Guests (सबैलाई) */}
              <button
                type="button"
                id="btn-target-recipient-all"
                onClick={handleSelectAll}
                className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all active:scale-95 shrink-0 min-w-[58px] ${
                  isAllSelected
                    ? 'bg-gradient-to-b from-amber-500/25 to-rose-500/25 border-2 border-amber-400 text-white shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-neutral-200 opacity-60'
                }`}
              >
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-inner">
                  <Users size={18} />
                  {isAllSelected && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] shadow">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold mt-1 leading-none text-amber-300">सबैलाई</span>
                <span className="text-[9px] text-neutral-400 font-mono mt-0.5">({occupiedCount} जना)</span>
              </button>

              {/* Option 2: Seated Friends Small Photos (Avatars) */}
              {occupiedSeats.map((seat) => {
                const isSelected = isAllSelected || selectedSeatNumbers.includes(seat.seatNumber);
                return (
                  <button
                    key={seat.id}
                    type="button"
                    id={`btn-target-recipient-seat-${seat.seatNumber}`}
                    onClick={() => handleToggleSeat(seat.seatNumber)}
                    className={`relative flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all active:scale-95 shrink-0 min-w-[58px] ${
                      isSelected
                        ? 'bg-indigo-600/20 border-2 border-emerald-400 text-white shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                        : 'bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-neutral-200 opacity-50'
                    }`}
                  >
                    {/* Small Photo (Avatar) */}
                    <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/40">
                      <img
                        src={seat.userAvatar}
                        alt={seat.userName || `Seat #${seat.seatNumber}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />

                      {/* Seat Number Tag */}
                      <span className="absolute top-0 left-0 bg-black/80 backdrop-blur-sm text-[8px] font-black px-1 rounded-br text-amber-300 font-mono">
                        #{seat.seatNumber}
                      </span>

                      {/* Host Crown */}
                      {seat.isHost && (
                        <span className="absolute top-0 right-0 bg-amber-500 text-neutral-950 p-0.5 rounded-bl shadow">
                          <Crown size={9} strokeWidth={3} />
                        </span>
                      )}

                      {/* Selection Checkmark */}
                      {isSelected && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] shadow ring-1 ring-neutral-900">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    {/* Friend Name */}
                    <span className="text-[10px] font-bold mt-1 truncate max-w-[56px] leading-none">
                      {seat.isHost ? '👑 Host' : seat.userName?.split(' ')[0]}
                    </span>

                    {/* Accumulated Points */}
                    <span className="text-[9px] text-amber-300/80 font-mono mt-0.5">
                      💎{formatPoints(seat.pointsEarned || 0)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selection Status & Multiplier Note */}
            <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <Check size={12} className="text-emerald-400" />
                {isAllSelected ? (
                  <span>स्टेजमा बसेका सबै <strong>{occupiedCount} जनालाई</strong> उपहार जानेछ</span>
                ) : (
                  <span>
                    <strong>{selectedSeatNumbers.length} जना साथीहरू</strong> छानिएका छन् (Seat #{selectedSeatNumbers.join(', #')})
                  </span>
                )}
              </span>
              <span className="text-amber-300 font-mono font-bold bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-lg text-[10px]">
                {recipientCount}x Coins
              </span>
            </div>
          </div>
        )}

        {/* Categories Tab Navigation (नाम मात्र: Regular / Daily & Love / Lucky / Custom / Event / All) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none border-b border-white/5 shrink-0">
          {GIFT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                id={`tab-gift-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 shrink-0 ${
                  isSelected
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-md ring-1 ring-white/30`
                    : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}

          <button
            type="button"
            id="tab-gift-cat-all"
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-neutral-700 to-neutral-600 text-white shadow-md ring-1 ring-white/30'
                : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
            }`}
          >
            <span>✨</span>
            <span>All</span>
          </button>
        </div>

        {/* Category Description Banner - NO price range details outside */}
        <div className="py-1 px-2 text-[11px] text-neutral-300 flex items-center justify-between bg-white/[0.03] rounded-xl my-1.5 border border-white/5">
          <span className="flex items-center gap-1.5">
            {selectedCategory === 'regular' && (
              <>
                <Flame size={13} className="text-rose-400" />
                <span>Regular Gifts • मुख्य लोकप्रिय उपहारहरू</span>
              </>
            )}
            {selectedCategory === 'daily' && (
              <>
                <Heart size={13} className="text-pink-400" />
                <span>Daily & Love Gifts • Hi (500), Good Morning/Night (1k), I Miss You (2k), Kiss You (5k), I Love You (10k), Sweet Hug (15k), Forever Love/Hug (20k)</span>
              </>
            )}
            {selectedCategory === 'lucky' && (
              <>
                <Sparkles size={13} className="text-emerald-400" />
                <span>Lucky Gifts • सरप्राइज लक्की बोनस अंक मिल्ने</span>
              </>
            )}
            {selectedCategory === 'custom' && (
              <>
                <Award size={13} className="text-purple-400" />
                <span>Custom Gifts • उच्चस्तरीय भीआईपी उपहारहरू</span>
              </>
            )}
            {selectedCategory === 'event' && (
              <>
                <ShieldCheck size={13} className="text-rose-400" />
                <span>Event Gifts • विशेष उत्सव तथा गाला उपहारहरू</span>
              </>
            )}
            {selectedCategory === 'all' && (
              <span>सबै उपहारहरू (All Gifts)</span>
            )}
          </span>
          <span className="text-neutral-400 font-mono text-[10px]">
            {displayedGifts.length} gifts
          </span>
        </div>

        {/* Gifts Grid Display */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 overflow-y-auto py-2 pr-1 max-h-72 scrollbar-thin scrollbar-thumb-white/20">
          {displayedGifts.map((gift) => {
            const singleCost = gift.coins ?? gift.diamonds;
            const totalRequired = singleCost * recipientCount;
            const canAfford = coinsBalance >= totalRequired;
            const isSelected = selectedGiftId === gift.id;

            // Category card styling
            let borderStyle = 'border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10';
            if (gift.category === 'daily') {
              borderStyle = 'border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/15';
            } else if (gift.category === 'lucky') {
              borderStyle = 'border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/15';
            } else if (gift.category === 'custom') {
              borderStyle = 'border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/15';
            } else if (gift.category === 'event') {
              borderStyle = 'border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/15';
            }

            return (
              <button
                key={gift.id}
                type="button"
                id={`btn-gift-${gift.id}`}
                onClick={() => handleGiftClick(gift)}
                className={`relative flex flex-col items-center justify-between p-2 rounded-2xl border transition-all active:scale-95 group ${
                  isSelected ? 'ring-2 ring-amber-400 scale-[1.02]' : ''
                } ${
                  canAfford
                    ? `bg-white/[0.04] ${borderStyle}`
                    : 'bg-white/[0.01] border-white/5 opacity-55 hover:opacity-80'
                }`}
              >
                {/* Points / Affordability indicator */}
                <div className="w-full flex items-center justify-between">
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md font-mono bg-white/10 text-amber-300">
                    +{formatPoints((gift.points || singleCost) * recipientCount)} Pts
                  </span>
                  {!canAfford && (
                    <span className="text-[8px] bg-rose-500/80 text-white px-1 rounded">Coins पुगेन</span>
                  )}
                </div>

                {/* Big Animated Icon */}
                <span className="text-3xl sm:text-4xl my-1 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:scale-115 transition-transform duration-200">
                  {gift.icon}
                </span>

                {/* Names */}
                <div className="w-full text-center">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {gift.name}
                  </span>
                  {gift.nepaliName && (
                    <span className="text-[10px] text-neutral-400 block truncate leading-tight">
                      {gift.nepaliName}
                    </span>
                  )}
                </div>

                {/* Cost / Points Button Pill */}
                <div className={`mt-1.5 w-full py-1 rounded-xl flex items-center justify-center gap-1 text-[11px] font-black ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/30 group-hover:from-amber-500 group-hover:to-yellow-500 group-hover:text-neutral-950 transition-all'
                    : 'bg-white/5 text-neutral-400 border border-white/10'
                }`}>
                  <Coins size={11} className={canAfford ? 'text-amber-400 group-hover:text-neutral-950' : 'text-neutral-400'} />
                  <span>
                    {recipientCount > 1 ? `${formatPoints(totalRequired)} (${recipientCount}x)` : `${formatPoints(singleCost)} Coins`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info (only party recipient summary if party live) */}
        {isPartyLive && (
          <div className="pt-2 border-t border-white/10 mt-1 text-center">
            <p className="text-[11px] text-neutral-400">
              💡 {isAllSelected ? `स्टेजका सबै ${occupiedCount} जना` : `${selectedSeatNumbers.length} जना साथीहरू (Seat #${selectedSeatNumbers.join(', #')})`} लाई उपहार पठाइनेछ।
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
