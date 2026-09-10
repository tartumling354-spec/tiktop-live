import React, { useState } from 'react';
import {
  X,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export interface WithdrawalRecord {
  id: string;
  points: number;
  grossUSD?: number;
  taxUSD?: number;
  taxPercent?: number;
  netUSD?: number;
  amountFormatted: string;
  currency: string;
  country: string;
  paymentMethod: string;
  method?: string;
  accountNumber: string;
  accountName: string;
  status: 'completed' | 'processing';
  timestamp: string;
}

interface WithdrawPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPoints?: number;
  currentPoints?: number;
  onWithdrawSuccess?: (pointsToDeduct: number, record: WithdrawalRecord) => void;
}

// Exact economic rules as specified:
// 100,000 Points = $1 USD
// Minimum withdrawal = $5 USD (500,000 Points)
// Platform tax = 8% when withdrawing >= $5
// All payouts and rates strictly in USD ($)
export const POINTS_PER_USD = 100000;
export const MIN_WITHDRAW_USD = 5;
export const MIN_WITHDRAW_POINTS = 500000;
export const PLATFORM_TAX_PERCENT = 8; // 8%

interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  methods: {
    id: string;
    name: string;
    icon: string;
    color: string;
    sub: string;
    inputLabel: string;
    inputPlaceholder: string;
    isBank?: boolean;
  }[];
}

const COUNTRIES_CONFIG: CountryConfig[] = [
  {
    code: 'NP',
    name: 'नेपाल (Nepal)',
    flag: '🇳🇵',
    methods: [
      {
        id: 'esewa',
        name: 'eSewa',
        icon: '🟢',
        color: 'bg-emerald-600',
        sub: 'eSewa Mobile Wallet ID (USD Payout)',
        inputLabel: 'eSewa ID / मोबाइल नम्बर',
        inputPlaceholder: '98XXXXXXXX',
      },
      {
        id: 'khalti',
        name: 'Khalti',
        icon: '🟣',
        color: 'bg-purple-600',
        sub: 'Khalti Digital Wallet (USD Payout)',
        inputLabel: 'Khalti मोबाइल नम्बर',
        inputPlaceholder: '98XXXXXXXX',
      },
      {
        id: 'imepay',
        name: 'IME Pay',
        icon: '🔴',
        color: 'bg-red-600',
        sub: 'IME Pay Wallet (USD Payout)',
        inputLabel: 'IME Pay वालेट नम्बर',
        inputPlaceholder: '98XXXXXXXX',
      },
      {
        id: 'bank_np',
        name: 'Bank Transfer (ConnectIPS)',
        icon: '🏦',
        color: 'bg-blue-600',
        sub: 'Direct Bank Wire (USD Payout)',
        inputLabel: 'बैंक खाता नम्बर (Account Number)',
        inputPlaceholder: 'Account Number',
        isBank: true,
      },
    ],
  },
  {
    code: 'GLOBAL',
    name: 'International (USD)',
    flag: '🌐',
    methods: [
      {
        id: 'paypal',
        name: 'PayPal',
        icon: '🅿️',
        color: 'bg-blue-600',
        sub: 'Instant PayPal USD Transfer',
        inputLabel: 'PayPal Email Address',
        inputPlaceholder: 'youremail@example.com',
      },
      {
        id: 'payoneer',
        name: 'Payoneer',
        icon: '💳',
        color: 'bg-orange-600',
        sub: 'Payoneer USD Account',
        inputLabel: 'Payoneer Email / ID',
        inputPlaceholder: 'payoneer-email@example.com',
      },
      {
        id: 'wise',
        name: 'Wise (TransferWise)',
        icon: '🟢',
        color: 'bg-emerald-600',
        sub: 'Wise USD Multi-Currency Account',
        inputLabel: 'Wise Email / Account Number',
        inputPlaceholder: 'wise-email@example.com',
      },
      {
        id: 'bank_intl',
        name: 'International Wire / SWIFT',
        icon: '🏦',
        color: 'bg-neutral-700',
        sub: 'Global Wire Transfer in USD',
        inputLabel: 'SWIFT / IBAN & Account Number',
        inputPlaceholder: 'SWIFT / IBAN',
        isBank: true,
      },
    ],
  },
  {
    code: 'IN',
    name: 'India (भारत)',
    flag: '🇮🇳',
    methods: [
      {
        id: 'paytm',
        name: 'Paytm / UPI',
        icon: '💙',
        color: 'bg-sky-600',
        sub: 'UPI / Paytm (USD Payout)',
        inputLabel: 'UPI ID / Mobile Number',
        inputPlaceholder: '98XXXXXXXX or mobile@paytm',
      },
      {
        id: 'gpay',
        name: 'Google Pay (GPay)',
        icon: '🌈',
        color: 'bg-blue-500',
        sub: 'Google Pay UPI (USD Payout)',
        inputLabel: 'Google Pay UPI ID',
        inputPlaceholder: 'username@okaxis',
      },
      {
        id: 'bank_in',
        name: 'Direct Bank Transfer',
        icon: '🏦',
        color: 'bg-emerald-700',
        sub: 'IMPS/NEFT (USD Payout)',
        inputLabel: 'Bank Account Number & IFSC',
        inputPlaceholder: 'Account Number & IFSC Code',
        isBank: true,
      },
    ],
  },
  {
    code: 'PH',
    name: 'Philippines (Pilipinas)',
    flag: '🇵🇭',
    methods: [
      {
        id: 'gcash',
        name: 'GCash',
        icon: '🔵',
        color: 'bg-blue-600',
        sub: 'GCash USD Payout',
        inputLabel: 'GCash Mobile Number (09XXXXXXXXX)',
        inputPlaceholder: '09XXXXXXXXX',
      },
      {
        id: 'maya',
        name: 'Maya (PayMaya)',
        icon: '🟢',
        color: 'bg-emerald-500',
        sub: 'Maya USD Payout',
        inputLabel: 'Maya Mobile Number',
        inputPlaceholder: '09XXXXXXXXX',
      },
      {
        id: 'bank_ph',
        name: 'Bank Transfer',
        icon: '🏦',
        color: 'bg-indigo-700',
        sub: 'InstaPay (USD Payout)',
        inputLabel: 'Bank Account Number',
        inputPlaceholder: 'Bank Account Number',
        isBank: true,
      },
    ],
  },
];

export const WithdrawPointsModal: React.FC<WithdrawPointsModalProps> = ({
  isOpen,
  onClose,
  userPoints,
  currentPoints,
  onWithdrawSuccess,
}) => {
  const actualUserPoints = typeof userPoints === 'number' ? userPoints : (typeof currentPoints === 'number' ? currentPoints : 0);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('NP');
  const activeCountry = COUNTRIES_CONFIG.find((c) => c.code === selectedCountryCode) || COUNTRIES_CONFIG[0];

  const [selectedMethodId, setSelectedMethodId] = useState<string>(activeCountry.methods[0]?.id || 'esewa');
  const activeMethod = activeCountry.methods.find((m) => m.id === selectedMethodId) || activeCountry.methods[0] || {
    id: 'default',
    name: 'Wallet',
    icon: '💳',
    color: 'bg-rose-600',
    sub: 'Default Account',
    inputLabel: 'खाता नम्बर',
    inputPlaceholder: 'Account Number',
  };

  // Default to 500,000 points ($5 min) or user balance
  const [pointsAmount, setPointsAmount] = useState<number>(() =>
    actualUserPoints >= MIN_WITHDRAW_POINTS ? MIN_WITHDRAW_POINTS : actualUserPoints
  );
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'withdraw' | 'history'>('withdraw');
  const [completedWithdrawal, setCompletedWithdrawal] = useState<WithdrawalRecord | null>(null);

  // Sync points amount when modal opens or userPoints change
  React.useEffect(() => {
    if (isOpen) {
      setPointsAmount((prev) => {
        if (prev <= 0 && actualUserPoints >= MIN_WITHDRAW_POINTS) {
          return MIN_WITHDRAW_POINTS;
        }
        if (prev > actualUserPoints && actualUserPoints > 0) {
          return actualUserPoints;
        }
        return prev > 0 ? prev : (actualUserPoints >= MIN_WITHDRAW_POINTS ? MIN_WITHDRAW_POINTS : actualUserPoints);
      });
    }
  }, [isOpen, actualUserPoints]);

  // Local saved withdrawal history
  const [history, setHistory] = useState<WithdrawalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tiktop_withdrawal_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  if (!isOpen) return null;

  // 100,000 Points = $1 USD
  const grossUSD = pointsAmount > 0 ? pointsAmount / POINTS_PER_USD : 0;
  const isMinimumMet = pointsAmount >= MIN_WITHDRAW_POINTS; // at least $5 (500,000 pts)

  // 8% platform tax applies when $5 is reached
  const platformTaxUSD = isMinimumMet ? grossUSD * (PLATFORM_TAX_PERCENT / 100) : 0;
  const netUSD = isMinimumMet ? grossUSD - platformTaxUSD : 0;

  // Switch country handler
  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const country = COUNTRIES_CONFIG.find((c) => c.code === code) || COUNTRIES_CONFIG[0];
    if (country?.methods?.length > 0) {
      setSelectedMethodId(country.methods[0].id);
    }
  };

  const handleQuickPointsSelect = (pts: number) => {
    setPointsAmount(Math.min(actualUserPoints, pts));
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pointsAmount < MIN_WITHDRAW_POINTS) {
      alert(`न्यूनतम निकासी $५.०० हुनुपर्छ।`);
      return;
    }

    if (pointsAmount > actualUserPoints) {
      alert(
        `तपाईंसँग पर्याप्त पोइन्ट छैन। तपाईंको मौज्दात ${(actualUserPoints ?? 0).toLocaleString()} Points ($${(
          actualUserPoints / POINTS_PER_USD
        ).toFixed(2)} USD) मात्र छ।`
      );
      return;
    }

    if (!accountNumber.trim()) {
      alert(`कृपया ${activeMethod?.inputLabel || 'खाता नम्बर'} प्रविष्ट गर्नुहोस्!`);
      return;
    }

    if (!accountHolderName.trim()) {
      alert('कृपया खातावालाको पूरा नाम (Account Holder Name) प्रविष्ट गर्नुहोस्!');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const netFormatted = `$${netUSD.toFixed(2)} USD`;

      const record: WithdrawalRecord = {
        id: `WD-${Date.now().toString().slice(-6)}`,
        points: pointsAmount,
        grossUSD,
        taxUSD: platformTaxUSD,
        taxPercent: PLATFORM_TAX_PERCENT,
        netUSD,
        amountFormatted: netFormatted,
        currency: 'USD',
        country: activeCountry.name,
        paymentMethod: `${activeMethod.name} (${activeCountry.name.split(' ')[0]})`,
        method: activeMethod.name,
        accountNumber: accountNumber.trim(),
        accountName: accountHolderName.trim(),
        status: 'completed',
        timestamp: new Date().toLocaleString(),
      };

      // Save to history
      const updatedHistory = [record, ...history];
      setHistory(updatedHistory);
      try {
        localStorage.setItem('tiktop_withdrawal_history', JSON.stringify(updatedHistory));
      } catch {
        // Ignore
      }

      if (onWithdrawSuccess) {
        try {
          onWithdrawSuccess(pointsAmount, record);
        } catch (err) {
          console.error('onWithdrawSuccess error:', err);
        }
      }
      setCompletedWithdrawal(record);
    }, 1200);
  };

  return (
    <div
      id="withdraw-points-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="withdraw-points-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-neutral-900 border border-white/15 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Award size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Points निकासी (Points Withdrawal)</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30">
                  USD Only
                </span>
              </h3>
              <span className="text-[10px] text-neutral-400">
                लाइभ स्ट्रिमबाट कमाएको Points डलर ($ USD) मा सिधै निकाल्नुहोस्
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-withdraw-modal"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher: Withdraw vs History */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 my-3 shrink-0">
          <button
            type="button"
            id="tab-withdraw-form"
            onClick={() => {
              setActiveTab('withdraw');
              setCompletedWithdrawal(null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'withdraw'
                ? 'bg-rose-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Award size={13} />
            <span>निकासी गर्नुहोस् (Withdraw USD)</span>
          </button>

          <button
            type="button"
            id="tab-withdraw-history"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-rose-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <History size={13} />
            <span>इतिहास (History) ({history.length})</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-1 pr-1 space-y-4 text-xs">
          {/* TAB 1: WITHDRAW FORM */}
          {activeTab === 'withdraw' && !completedWithdrawal && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Points Balance Banner */}
              <div className="bg-gradient-to-r from-rose-950/50 via-neutral-900 to-amber-950/40 border border-rose-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                    तपाईंको उपलब्ध Points (Available Balance)
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-rose-400">
                      {(actualUserPoints ?? 0).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-neutral-300">Points</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    कुल मूल्य (Total USD Value)
                  </span>
                  <span className="text-base font-black text-white">
                    ≈ ${((actualUserPoints ?? 0) / POINTS_PER_USD).toFixed(2)} USD
                  </span>
                  <span className="text-[10px] text-neutral-400 block">
                    (न्यूनतम $५)
                  </span>
                </div>
              </div>

              {/* Validation Warning if balance below $5 */}
              {actualUserPoints < MIN_WITHDRAW_POINTS && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-200">
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                  <span>
                    तपाईंसँग न्यूनतम निकासी रकम पुगेको छैन।
                  </span>
                </div>
              )}

              {/* 1. Country Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                  <span>१. देश चयन गर्नुहोस् (Select Region / Country):</span>
                  <span className="text-[10px] text-emerald-400 font-bold">भुक्तानी: $ USD</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {COUNTRIES_CONFIG.map((c) => {
                    const isSelected = selectedCountryCode === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        id={`country-btn-${c.code.toLowerCase()}`}
                        onClick={() => handleCountryChange(c.code)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-white font-bold ring-1 ring-rose-500/40 shadow-sm'
                            : 'bg-white/5 border-white/10 text-neutral-300 hover:border-white/20'
                        }`}
                      >
                        <span className="text-base block mb-0.5">{c.flag}</span>
                        <span className="text-[10px] truncate block leading-tight">{c.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Payment Method Selector Based on Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                  <span>२. भुक्तानी माध्यम (Withdrawal Method - {activeCountry.name}):</span>
                  <span className="text-[10px] text-amber-300 font-semibold">
                    सिधै $ USD ट्रान्सफर
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {activeCountry.methods.map((method) => {
                    const isSelected = selectedMethodId === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        id={`method-btn-${method.id}`}
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500 text-white shadow-md ring-1 ring-rose-500/40'
                            : 'bg-white/5 border-white/10 hover:border-white/20 text-neutral-300'
                        }`}
                      >
                        <span className="text-lg leading-none shrink-0">{method.icon}</span>
                        <div className="truncate">
                          <span className="text-xs font-bold block truncate text-white">{method.name}</span>
                          <span className="text-[9px] text-neutral-400 block truncate">{method.sub}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Points Amount & Quick Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300">
                    ३. निकाल्न चाहेको Points (न्यूनतम ५,००,००० = $५):
                  </label>
                  <span className="text-[11px] font-black text-amber-300">
                    = ${grossUSD.toFixed(2)} USD Gross
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={MIN_WITHDRAW_POINTS}
                    step={10000}
                    value={pointsAmount || ''}
                    onChange={(e) => setPointsAmount(parseInt(e.target.value, 10) || 0)}
                    placeholder="५००००० वा सोभन्दा बढी Points..."
                    className={`w-full bg-neutral-950 border rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none pr-16 ${
                      pointsAmount < MIN_WITHDRAW_POINTS
                        ? 'border-amber-500/60 focus:border-amber-400'
                        : 'border-white/20 focus:border-rose-500'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-400">
                    Pts
                  </span>
                </div>

                {/* Quick Points Presets: 500k ($5), 1M ($10), 2M ($20), 5M ($50), All */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[
                    { label: '$५ (५००k)', pts: 500000 },
                    { label: '$१० (१M)', pts: 1000000 },
                    { label: '$२० (२M)', pts: 2000000 },
                    { label: '$५० (५M)', pts: 5000000 },
                  ].map((preset) => (
                    <button
                      key={preset.pts}
                      type="button"
                      disabled={actualUserPoints < preset.pts}
                      onClick={() => handleQuickPointsSelect(preset.pts)}
                      className={`flex-1 py-1.5 px-1 rounded-lg border text-[10px] font-bold transition-all text-center ${
                        pointsAmount === preset.pts
                          ? 'bg-rose-500/30 border-rose-500 text-white'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white disabled:opacity-30'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleQuickPointsSelect(actualUserPoints)}
                    className="py-1.5 px-2.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 text-[10px] font-bold text-rose-300 transition-all"
                  >
                    सबै
                  </button>
                </div>
              </div>

              {/* 8% Platform Tax & Payout Calculation Box strictly in USD */}
              <div className="rounded-2xl border p-3.5 space-y-2 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black border-white/15">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <span className="text-xs font-bold text-neutral-200">
                    निकासी हिसाब विवरण (Payout Breakdown in USD):
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {pointsAmount.toLocaleString()} Points
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-neutral-300">
                    <span>कुल रकम (Gross Amount):</span>
                    <span className="font-bold text-white">
                      ${grossUSD.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex justify-between text-rose-400">
                    <span className="flex items-center gap-1">
                      <span>प्लेटफर्म कर (8% Platform Tax):</span>
                    </span>
                    <span className="font-bold">
                      -${platformTaxUSD.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-white/10 flex justify-between items-baseline">
                    <div>
                      <span className="text-xs font-black text-emerald-400 block">
                        तपाईंले पाउने खुद रकम (Net Payout):
                      </span>
                      <span className="text-[9px] text-neutral-400">८% कर कट्टी पछिको रकम</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-400">
                        ${netUSD.toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Warnings */}
                {!isMinimumMet && (
                  <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-rose-400" />
                    <span>
                      ⚠️ न्यूनतम निकासी रकम $५.०० हुनुपर्छ।
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Account Details Input */}
              <div className="space-y-2 bg-white/[0.03] border border-white/10 rounded-2xl p-3">
                <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-rose-400" />
                  <span>४. खाता विवरण (Account Details):</span>
                </h4>

                {/* Bank Name if Bank Transfer */}
                {activeMethod.isBank && (
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">बैंकको नाम (Bank Name):</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., Nabil Bank / NIC Asia / Global Bank"
                      className="w-full bg-neutral-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                {/* Account Number / Wallet Number */}
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    {activeMethod.inputLabel}:
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={activeMethod.inputPlaceholder}
                    className="w-full bg-neutral-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                {/* Account Holder Name */}
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    खातावालाको पूरा नाम (Account Holder Full Name):
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="e.g., Ram Bahadur Shrestha"
                    className="w-full bg-neutral-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-submit-points-withdraw"
                  disabled={
                    isSubmitting ||
                    actualUserPoints < MIN_WITHDRAW_POINTS ||
                    pointsAmount < MIN_WITHDRAW_POINTS ||
                    pointsAmount > actualUserPoints
                  }
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>निकासी प्रक्रिया हुँदैछ...</span>
                  ) : !isMinimumMet ? (
                    <span>न्यूनतम $५.०० आवश्यक छ</span>
                  ) : pointsAmount > actualUserPoints ? (
                    <span>अपर्याप्त मौज्दात</span>
                  ) : (
                    <>
                      <span>
                        Net ${netUSD.toFixed(2)} USD निकासी गर्नुहोस्
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* SUCCESS RECEIPT VIEW */}
          {completedWithdrawal && (
            <div className="p-4 bg-neutral-950 border border-emerald-500/30 rounded-2xl text-center space-y-3 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 size={32} />
              </div>

              <h4 className="text-base font-black text-white">निकासी अनुरोध सफल भयो! 🎉</h4>
              <p className="text-xs text-neutral-300">
                तपाईंको निकासी अनुरोध सफलतापूर्वक पेश भएको छ।
              </p>

              {/* Receipt Details Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-left space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-white/10">
                  <span className="text-neutral-400">Reference ID:</span>
                  <span className="font-mono font-bold text-white">{completedWithdrawal.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">कटौती गरिएको Points:</span>
                  <span className="font-bold text-rose-400">
                    -{completedWithdrawal.points.toLocaleString()} Pts
                  </span>
                </div>

                {completedWithdrawal.grossUSD !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">कुल रकम (Gross USD):</span>
                    <span className="font-bold text-neutral-200">
                      ${completedWithdrawal.grossUSD.toFixed(2)} USD
                    </span>
                  </div>
                )}

                {completedWithdrawal.taxUSD !== undefined && (
                  <div className="flex justify-between text-rose-400">
                    <span>प्लेटफर्म कर (8% Tax):</span>
                    <span className="font-bold">
                      -${completedWithdrawal.taxUSD.toFixed(2)} USD
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-neutral-400">तपाईंले पाउने खुद रकम (Net):</span>
                  <span className="font-black text-emerald-400 text-sm">
                    {completedWithdrawal.amountFormatted}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">भुक्तानी माध्यम:</span>
                  <span className="font-bold text-white">{completedWithdrawal.paymentMethod}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">खाता / वालेट नम्बर:</span>
                  <span className="font-mono text-white">{completedWithdrawal.accountNumber}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">खातावालाको नाम:</span>
                  <span className="font-bold text-white">{completedWithdrawal.accountName}</span>
                </div>

                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-neutral-400">स्थिति (Status):</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>सफल (Approved - USD Payout Processed)</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCompletedWithdrawal(null);
                  setActiveTab('history');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
              >
                इतिहास हेर्नुहोस् (View History)
              </button>
            </div>
          )}

          {/* TAB 2: WITHDRAWAL HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-neutral-300">अघिल्ला निकासीहरू (Past Withdrawals):</span>
                <span className="text-[10px] text-neutral-400">{history.length} transactions</span>
              </div>

              {history.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl">
                  <History size={28} className="text-neutral-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-300">कुनै निकासी इतिहास छैन</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    लाइभ बसेर Points कमाउनुहोस् र डलर ($ USD) मा निकाल्नुहोस्।
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{item.paymentMethod}</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                            सफल (Completed)
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 block font-mono">
                          A/C: {item.accountNumber} ({item.accountName})
                        </span>
                        <span className="text-[9px] text-neutral-500 flex items-center gap-1">
                          <Clock size={10} />
                          <span>{item.timestamp}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400 block">
                          +{item.amountFormatted}
                        </span>
                        <span className="text-[10px] text-rose-400 font-bold block">
                          -{item.points.toLocaleString()} Pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
