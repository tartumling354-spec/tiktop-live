import React from 'react';
import { X, Gift, CheckCircle, Clock, AlertCircle, FastForward, Sparkles, Award } from 'lucide-react';
import { LiveMode } from '../types';

interface LiveRewardRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: LiveMode;
  currentDurationSeconds: number;
  totalRewardPointsEarned: number;
  claimedFaceHour1: boolean;
  claimedFaceHour2: boolean;
  claimedPartyHour1: boolean;
  claimedPartyHour2: boolean;
  onFastForward: (additionalSeconds: number) => void;
  onSetDuration: (targetSeconds: number) => void;
}

export const LiveRewardRulesModal: React.FC<LiveRewardRulesModalProps> = ({
  isOpen,
  onClose,
  mode,
  currentDurationSeconds,
  totalRewardPointsEarned,
  claimedFaceHour1,
  claimedFaceHour2,
  claimedPartyHour1,
  claimedPartyHour2,
  onFastForward,
  onSetDuration,
}) => {
  if (!isOpen) return null;

  const formatHoursMinsSecs = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainder = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isFace = mode === 'face';

  return (
    <div
      id="live-reward-rules-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="live-reward-rules-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">लाइभ समय रिवार्ड नियम (Live Rewards)</h3>
              <span className="text-[10px] text-neutral-400">
                {isFace ? '👤 Face Live Milestones' : '🎉 Party Live Milestones'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-3 space-y-4 pr-1 text-xs">
          {/* Current Live Stats Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-rose-950/40 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock size={20} className="text-amber-400" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">लाइभ अवधि (Live Time)</span>
                <span className="text-base font-black text-amber-300">
                  {formatHoursMinsSecs(currentDurationSeconds)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">प्राप्त रिवार्ड (Earned)</span>
              <span className="text-base font-black text-emerald-400">
                +{totalRewardPointsEarned.toLocaleString()} Pts
              </span>
            </div>
          </div>

          {/* Current Mode Milestones & Rules */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-neutral-300 flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-amber-400" />
              <span>{isFace ? '👤 Face Live का रिवार्ड नियमहरू:' : '🎉 Party Live का रिवार्ड नियमहरू:'}</span>
            </h4>

            {isFace ? (
              // FACE LIVE RULES
              <div className="space-y-2">
                {/* 1 Hour Face Live Card */}
                <div
                  className={`border rounded-2xl p-3 flex items-center justify-between transition-all ${
                    claimedFaceHour1
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : currentDurationSeconds >= 3600
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-neutral-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        claimedFaceHour1 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {claimedFaceHour1 ? <CheckCircle size={16} /> : '1'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">१ घण्टा (1 Hour) पूरा</div>
                      <div className="text-[11px] text-amber-300 font-semibold">+१०,००० Points रिवार्ड</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {currentDurationSeconds >= 3600
                          ? '✅ १ घण्टा पूरा भएको छ'
                          : `बाँकी समय: ${Math.max(0, Math.ceil((3600 - currentDurationSeconds) / 60))} मिनेट`}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      claimedFaceHour1
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {claimedFaceHour1 ? 'प्राप्त भयो (Claimed)' : '१०,००० Pts'}
                  </span>
                </div>

                {/* 2 Hours Face Live Card */}
                <div
                  className={`border rounded-2xl p-3 flex items-center justify-between transition-all ${
                    claimedFaceHour2
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : currentDurationSeconds >= 7200
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-neutral-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        claimedFaceHour2 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {claimedFaceHour2 ? <CheckCircle size={16} /> : '2'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">२ घण्टा (2 Hours) पूरा</div>
                      <div className="text-[11px] text-amber-300 font-semibold">फेरि +१०,००० Points रिवार्ड</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {currentDurationSeconds >= 7200
                          ? '✅ २ घण्टा पूरा भएको छ (अधिकतम सीमा)'
                          : `बाँकी समय: ${Math.max(0, Math.ceil((7200 - currentDurationSeconds) / 60))} मिनेट`}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      claimedFaceHour2
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {claimedFaceHour2 ? 'प्राप्त भयो (Claimed)' : '+१०,००० Pts'}
                  </span>
                </div>

                {/* Cap & Unlimited Live Rule Note */}
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <AlertCircle size={14} />
                    <span>२ घण्टा सम्म मात्र रिवार्ड (Max 2 Hours Cap):</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Face Live मा कुल <strong>२०,००० Points सम्म मात्र</strong> (१ घण्टामा १०,००० + २ घण्टामा १०,०००)
                    रिवार्ड मिल्नेछ। २ घण्टा भन्दा बढी लाइभ बसे पनि कुनै थप पोइन्ट दिइने छैन। तर तपाईं जति समय पनि
                    अनवरत लाइभ बस्न सक्नुहुन्छ!
                  </p>
                </div>
              </div>
            ) : (
              // PARTY LIVE RULES (Now 2 Hours Limit with 2,000 Points each hour, Max 4,000 Points Cap)
              <div className="space-y-2">
                {/* 1 Hour Party Live Card */}
                <div
                  className={`border rounded-2xl p-3 flex items-center justify-between transition-all ${
                    claimedPartyHour1
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : currentDurationSeconds >= 3600
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-neutral-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        claimedPartyHour1 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {claimedPartyHour1 ? <CheckCircle size={16} /> : '1'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">१ घण्टा (1 Hour) पूरा</div>
                      <div className="text-[11px] text-indigo-300 font-semibold">+२,००० Points रिवार्ड</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {currentDurationSeconds >= 3600
                          ? '✅ १ घण्टा पूरा भएको छ'
                          : `बाँकी समय: ${Math.max(0, Math.ceil((3600 - currentDurationSeconds) / 60))} मिनेट`}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      claimedPartyHour1
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {claimedPartyHour1 ? 'प्राप्त भयो (Claimed)' : '२,००० Pts'}
                  </span>
                </div>

                {/* 2 Hours Party Live Card */}
                <div
                  className={`border rounded-2xl p-3 flex items-center justify-between transition-all ${
                    claimedPartyHour2
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : currentDurationSeconds >= 7200
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-neutral-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        claimedPartyHour2 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {claimedPartyHour2 ? <CheckCircle size={16} /> : '2'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">२ घण्टा (2 Hours) पूरा</div>
                      <div className="text-[11px] text-indigo-300 font-semibold">फेरि +२,००० Points रिवार्ड (कुल ४,००० Pts)</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {currentDurationSeconds >= 7200
                          ? '✅ २ घण्टा पूरा भएको छ (Party Live अधिकतम सीमा)'
                          : `बाँकी समय: ${Math.max(0, Math.ceil((7200 - currentDurationSeconds) / 60))} मिनेट`}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      claimedPartyHour2
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {claimedPartyHour2 ? 'प्राप्त भयो (Claimed)' : '+२,००० Pts'}
                  </span>
                </div>

                {/* Party Live Cap Note */}
                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                    <AlertCircle size={14} />
                    <span>Party Live मा २ घण्टा सम्म मात्र रिवार्ड (Max 2 Hours Cap):</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Party Live मा पनि <strong>२ घण्टा सम्म मात्र</strong> (१ घण्टामा २,००० + २ घण्टामा २,००० = कुल ४,००० Points)
                    रिवार्ड प्राप्त हुन्छ। २ घण्टा भन्दा बढी बसे पनि थप पोइन्ट दिइने छैन। तर साथीहरूसँग जति समय पनि पार्टी लाइभ च्याट बस्न सक्नुहुन्छ!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Simulation / Fast-Forward Testing Bar */}
          <div className="bg-white/5 border border-white/15 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <FastForward size={14} />
                <span>⚡ परीक्षण मोड (Fast-Forward Test Timer)</span>
              </span>
              <span className="text-[10px] text-neutral-400">१-क्लिकमा समय अघि बढाउनुहोस्</span>
            </div>

            <p className="text-[10px] text-neutral-400 leading-normal">
              तपाईंले वास्तविक १-२ घण्टा पर्खनु पर्दैन; तलका बटन थिचेर तुरुन्तै माइलस्टोन रिवार्ड परीक्षण गर्न सक्नुहुन्छ:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                id="btn-ff-15m"
                onClick={() => onFastForward(900)}
                className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold text-white transition-all text-center"
              >
                +१५ मिनेट (+15 min)
              </button>

              <button
                type="button"
                id="btn-ff-30m"
                onClick={() => onFastForward(1800)}
                className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold text-white transition-all text-center"
              >
                +३० मिनेट (+30 min)
              </button>

              <button
                type="button"
                id="btn-jump-1h"
                onClick={() => onSetDuration(3595)}
                className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-600/60 to-rose-600/60 hover:from-amber-600 hover:to-rose-600 active:scale-95 text-[11px] font-bold text-white transition-all text-center col-span-2"
              >
                🎯 Jump to 59:55 (१ घण्टा रिवार्ड तत्काल टेस्ट)
              </button>

              <button
                type="button"
                id="btn-jump-2h"
                onClick={() => onSetDuration(7195)}
                className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-rose-600/60 to-purple-600/60 hover:from-rose-600 hover:to-purple-600 active:scale-95 text-[11px] font-bold text-white transition-all text-center col-span-2"
              >
                🏆 Jump to 1:59:55 (२ घण्टा रिवार्ड तत्काल टेस्ट)
              </button>

              <button
                type="button"
                id="btn-jump-post-cap"
                onClick={() => onSetDuration(8000)}
                className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-[10px] text-neutral-300 transition-all text-center"
              >
                २ घण्टा १५ मिनेट (नो-रिवार्ड टेस्ट)
              </button>

              <button
                type="button"
                id="btn-reset-timer"
                onClick={() => onSetDuration(0)}
                className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-[10px] text-neutral-400 transition-all text-center"
              >
                रिसेट ००:०० (Reset 0s)
              </button>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="pt-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            id="btn-close-reward-rules"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-98"
          >
            बुझेँ (Close & Return)
          </button>
        </div>
      </div>
    </div>
  );
};
