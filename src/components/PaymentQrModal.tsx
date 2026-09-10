import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Smartphone,
  Building2,
  ShieldCheck,
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export interface QrConfig {
  id: 'esewa' | 'khalti' | 'imepay' | 'nabil' | 'phonepe' | 'gcash' | 'paypal';
  name: string;
  sub: string;
  badge: string;
  accountNumber: string;
  accountHolder: string;
  bankName?: string;
  brandColor: string;
  accentBg: string;
  borderColor: string;
  textColor: string;
  instruction: string;
  getPayload: (amount: number, userId: string) => string;
}

export const QR_CONFIGS: QrConfig[] = [
  {
    id: 'esewa',
    name: 'eSewa',
    sub: 'नेपालको प्रमुख वालेट',
    badge: '🟢 eSewa Pay QR',
    accountNumber: '+977 9863991384',
    accountHolder: 'Shambu Lamsal',
    brandColor: 'bg-emerald-600',
    accentBg: 'from-emerald-950/80 via-neutral-900 to-black',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-400',
    instruction: "eSewa एप खोलेर 'Scan QR' बाट सिधै स्क्यान गर्नुहोस् वा यो QR डाउनलोड गरी 'Upload from Gallery' गर्नुहोस्।",
    getPayload: (amount, userId) =>
      `esewa://pay?account=9863991384&name=TikTop%20Official&amount=${amount}&remarks=${encodeURIComponent(
        userId || 'TikTop Coins'
      )}`,
  },
  {
    id: 'khalti',
    name: 'Khalti',
    sub: 'डिजिटल वालेट',
    badge: '🟣 Khalti Pay QR',
    accountNumber: '+977 9810465055',
    accountHolder: 'Shambu Lamsal',
    brandColor: 'bg-purple-600',
    accentBg: 'from-purple-950/80 via-neutral-900 to-black',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400',
    instruction: "Khalti एप खोलेर 'Scan & Pay' बाट स्क्यान गर्नुहोस् वा ग्यालरीबाट QR छनोट गर्नुहोस्।",
    getPayload: (amount, userId) =>
      `khalti://pay?mobile=9810465055&name=TikTop%20Official&amount=${amount}&remarks=${encodeURIComponent(
        userId || 'TikTop Coins'
      )}`,
  },
  {
    id: 'imepay',
    name: 'IME Pay',
    sub: 'डिजिटल वालेट',
    badge: '🔴 IME Pay QR',
    accountNumber: '+977 9810465055',
    accountHolder: 'Shambu Lamsal',
    brandColor: 'bg-red-600',
    accentBg: 'from-red-950/80 via-neutral-900 to-black',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-400',
    instruction: "IME Pay एप खोलेर 'Scan Any QR' बाट स्क्यान गर्नुहोस् वा ग्यालरीबाट QR छनोट गर्नुहोस्।",
    getPayload: (amount, userId) =>
      `imepay://pay?mobile=9810465055&name=TikTop%20Official&amount=${amount}&remarks=${encodeURIComponent(
        userId || 'TikTop Coins'
      )}`,
  },
  {
    id: 'nabil',
    name: 'Nabil Bank',
    sub: 'Fonepay / NepalPay QR',
    badge: '🏦 Fonepay / Bank QR',
    accountNumber: '04110017507343',
    accountHolder: 'Shambu Lamsal',
    bankName: 'Nabil Bank Limited (तुम्लिङटार शाखा - Tumlingtar Branch)',
    brandColor: 'bg-blue-600',
    accentBg: 'from-blue-950/80 via-neutral-900 to-black',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    instruction:
      'कुनै पनि नेपाली बैंकको Mobile Banking एप (Nabil, Global IME, NIC Asia, Sanima, आदि) बाट Fonepay/NepalPay QR स्क्यान गर्नुहोस्।',
    getPayload: (amount, userId) =>
      `fonepay://payment?mid=04110017507343&bank=NABIL&name=TikTop%20Official&amount=${amount}&remarks=${encodeURIComponent(
        userId || 'TikTop Coins'
      )}`,
  },
  {
    id: 'phonepe',
    name: 'India UPI',
    sub: 'PhonePe / GPay / Paytm',
    badge: '🇮🇳 BHIM UPI QR',
    accountNumber: '9863991384@ybl',
    accountHolder: 'TikTop Live',
    brandColor: 'bg-indigo-600',
    accentBg: 'from-indigo-950/80 via-neutral-900 to-black',
    borderColor: 'border-indigo-500/50',
    textColor: 'text-indigo-400',
    instruction: 'PhonePe, Google Pay, Paytm वा कुनै पनि भारतीय UPI एपबाट स्क्यान गरी भुक्तानी गर्नुहोस्।',
    getPayload: (amount, userId) =>
      `upi://pay?pa=9863991384@ybl&pn=TikTop%20Live&am=${amount}&cu=INR&tn=${encodeURIComponent(
        userId || 'TikTop Coins'
      )}`,
  },
  {
    id: 'gcash',
    name: 'GCash',
    sub: 'Philippines Wallet',
    badge: '🇵🇭 GCash Pay QR',
    accountNumber: '+63 9863991384',
    accountHolder: 'TikTop Philippines Official',
    brandColor: 'bg-blue-600',
    accentBg: 'from-blue-950/80 via-neutral-900 to-black',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
    instruction: 'Open GCash App and scan this QR to pay instantly or download to gallery.',
    getPayload: (amount, userId) =>
      `gcash://pay?mobile=09863991384&name=TikTop%20PH&amount=${amount}&message=${encodeURIComponent(
        userId || 'TikTop Coins'
      )}`,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    sub: 'International USD',
    badge: '🌐 PayPal USD QR',
    accountNumber: 'tiktopnepalpay@gmail.com',
    accountHolder: 'TikTop Media Global',
    brandColor: 'bg-sky-600',
    accentBg: 'from-sky-950/80 via-neutral-900 to-black',
    borderColor: 'border-sky-500/50',
    textColor: 'text-sky-400',
    instruction: 'Scan with camera or PayPal app to transfer USD instantly.',
    getPayload: (amount, userId) =>
      `https://paypal.me/tiktopnepalpay/${amount}`,
  },
];

interface PaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMethod?: 'esewa' | 'khalti' | 'imepay' | 'nabil' | 'phonepe' | 'gcash' | 'paypal';
  amount: number;
  currencySymbol: string;
  currencyCode: string;
  coins: number;
  userId?: string;
}

export const PaymentQrModal: React.FC<PaymentQrModalProps> = ({
  isOpen,
  onClose,
  defaultMethod = 'esewa',
  amount,
  currencySymbol,
  currencyCode,
  coins,
  userId = 'USR-OFFICIAL',
}) => {
  const [selectedId, setSelectedId] = useState<'esewa' | 'khalti' | 'imepay' | 'nabil' | 'phonepe' | 'gcash' | 'paypal'>(defaultMethod);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (defaultMethod) {
      setSelectedId(defaultMethod);
    }
  }, [defaultMethod, isOpen]);

  // Generate QR code data URLs for all methods
  useEffect(() => {
    let isMounted = true;

    const generateAll = async () => {
      const results: Record<string, string> = {};
      for (const config of QR_CONFIGS) {
        try {
          const payload = config.getPayload(amount, userId);
          const url = await QRCode.toDataURL(payload, {
            width: 320,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
          results[config.id] = url;
        } catch (err) {
          console.error('Failed to generate QR for', config.id, err);
        }
      }
      if (isMounted) {
        setQrImages(results);
      }
    };

    if (isOpen) {
      generateAll();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, userId]);

  if (!isOpen) return null;

  const currentConfig = QR_CONFIGS.find((c) => c.id === selectedId) || QR_CONFIGS[0];
  const qrUrl = qrImages[currentConfig.id];

  const handleCopyAccount = () => {
    try {
      navigator.clipboard.writeText(currentConfig.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `TikTop-${currentConfig.name}-Payment-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div
      id="payment-qr-modal-backdrop"
      className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="payment-qr-modal-card"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg bg-gradient-to-b ${currentConfig.accentBg} border-2 ${currentConfig.borderColor} rounded-3xl text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300`}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/30">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  आधिकारिक भुक्तानी QR कोड
                </h3>
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  सबै भुक्तानीका लागि तयार
                </span>
              </div>
              <span className="text-[10px] text-neutral-400">
                स्क्यान गर्नुहोस् र सिधै Coins प्राप्त गर्नुहोस्
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

        {/* Tab Selection for All Available QRs */}
        <div className="p-3 bg-neutral-950/80 border-b border-white/10 shrink-0">
          <div className="text-[11px] font-bold text-neutral-300 mb-2 flex items-center justify-between">
            <span>कुन माध्यमको QR स्क्यान गर्ने? (यहाँ छनोट गर्नुहोस्):</span>
            <span className="text-[10px] text-amber-400 font-mono">सबै आधिकारिक QR</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {QR_CONFIGS.map((cfg) => {
              const isSelected = selectedId === cfg.id;
              return (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => setSelectedId(cfg.id)}
                  className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 ${
                    isSelected
                      ? `${cfg.brandColor} text-white border-white shadow-lg ring-2 ring-white/30 scale-[1.02]`
                      : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold block truncate">{cfg.name}</span>
                    <span className="text-[9px] opacity-80 block truncate">{cfg.sub}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* QR Presentation Card */}
          <div className="bg-neutral-950/90 border border-white/15 rounded-3xl p-4 sm:p-5 text-center shadow-xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <span className={`text-xs font-black px-2.5 py-1 rounded-full text-white ${currentConfig.brandColor}`}>
                {currentConfig.badge}
              </span>
              <div className="text-right">
                <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/40">
                  {currencySymbol} {amount} {currencyCode}
                </span>
                <span className="text-[10px] text-neutral-400 block font-mono">
                  = {coins.toLocaleString()} Coins
                </span>
              </div>
            </div>

            {/* QR Visual Canvas */}
            <div className="flex justify-center my-2">
              <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-white ring-4 ring-white/20 relative group">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`${currentConfig.name} QR Code`}
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center bg-neutral-100 text-neutral-400">
                    <QrCode size={48} className="animate-spin" />
                  </div>
                )}

                {/* Scan Overlay text */}
                <div className="mt-1.5 py-0.5 px-2 bg-neutral-900 rounded-md text-[10px] font-bold text-white tracking-wide uppercase flex items-center justify-center gap-1">
                  <Smartphone size={11} className="text-amber-400" />
                  <span>Scan to Pay ({currentConfig.name})</span>
                </div>
              </div>
            </div>

            {/* Account Info Details */}
            <div className="mt-3 p-3 bg-neutral-900/90 rounded-2xl border border-white/10 text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">खातावाला (Merchant):</span>
                <span className="font-bold text-white">{currentConfig.accountHolder}</span>
              </div>

              {currentConfig.bankName && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">बैंक / शाखा:</span>
                  <span className="font-bold text-white">{currentConfig.bankName}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-neutral-300 font-bold">{currentConfig.name} नम्बर:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-400/40 text-xs">
                    {currentConfig.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300"
                    title="नम्बर कपी गर्नुहोस्"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction Pill */}
            <p className="text-[11px] text-neutral-300 mt-3 bg-white/5 p-2.5 rounded-xl border border-white/5 text-center leading-relaxed">
              👉 {currentConfig.instruction}
            </p>

            {/* Action Buttons: Download and Close */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
              >
                {downloadSuccess ? (
                  <>
                    <Check size={15} className="text-neutral-950" />
                    <span>ग्यालरीमा सुरक्षित भयो! ✅</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>ग्यालरीमा QR डाउनलोड गर्नुहोस्</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
              >
                मैले तिरेँ, अब रसिद अपलोड गर्छु
              </button>
            </div>
          </div>

          {/* Quick Guide Reminder */}
          <div className="p-3 bg-neutral-950/60 rounded-2xl border border-white/10 text-[11px] text-neutral-300 space-y-1">
            <span className="font-bold text-amber-300 block mb-1 flex items-center gap-1">
              <ShieldCheck size={14} />
              <span>सिक्का प्राप्त गर्ने ३ सजिलो नियम:</span>
            </span>
            <div className="space-y-0.5 text-neutral-400">
              <div>१. माथिको QR बाट रू. {amount} भुक्तानी गर्नुहोस्।</div>
              <div>२. भुक्तानी सफल भएको रसिदको स्क्रिनसट (Screenshot) लिनुहोस्।</div>
              <div>३. यो विन्डो बन्द गरी तल स्क्रिनसट अपलोड गर्नुहोस, Coins तुरुन्तै थपिनेछ!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
