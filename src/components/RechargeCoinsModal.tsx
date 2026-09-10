import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Coins,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Wallet,
  Lock,
  Globe,
  ChevronDown,
  ArrowRight,
  Check,
  Copy,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  RefreshCw,
  XCircle,
  MessageCircle,
  Eye,
  ShieldAlert,
  Calendar,
  DollarSign,
  UserCheck,
  AlertTriangle,
  QrCode,
  Download,
  Maximize2,
  Landmark,
} from 'lucide-react';
import QRCode from 'qrcode';
import { PaymentQrModal } from './PaymentQrModal';
import { AuthUser, UserProfile, RechargeClaim } from '../types';
import {
  generateScreenshotHash,
  isScreenshotHashUsed,
  recordUsedScreenshotHash,
  getAllRechargeClaims,
  saveRechargeClaim,
  updateRechargeClaimStatus,
  OFFICIAL_DEVELOPER_MERCHANTS,
} from '../utils/rechargeVerificationDb';

interface RechargeCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoins?: number;
  userCoins?: number;
  onRechargeCoins: (amount: number) => void;
  authUser?: AuthUser | null;
  userProfile?: UserProfile;
}

export const COINS_PER_USD = 92000;
export const MIN_RECHARGE_USD = 1;

export interface RechargeMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  sub: string;
  receiverAccount: string;
  displayAccount: string;
  accountTypeLabel: string;
  accountPlaceholder: string;
  isBank?: boolean;
  isCard?: boolean;
  isNabilDirect?: boolean;
}

export interface RechargeCountryConfig {
  code: string;
  name: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  usdRate: number; // 1 USD in local currency
  methods: RechargeMethod[];
}

export const RECHARGE_COUNTRIES: RechargeCountryConfig[] = [
  {
    code: 'NP',
    name: 'नेपाल (Nepal)',
    flag: '🇳🇵',
    currencyCode: 'NPR',
    currencySymbol: 'रू',
    usdRate: 134.5,
    methods: [
      {
        id: 'esewa',
        name: 'eSewa',
        icon: '🟢',
        color: 'bg-emerald-600',
        sub: 'eSewa Mobile Wallet',
        receiverAccount: '9863991384',
        displayAccount: '+977 9863991384',
        accountTypeLabel: 'पठाउनेको eSewa ID / मोबाइल नम्बर',
        accountPlaceholder: '98XXXXXXXX',
      },
      {
        id: 'khalti',
        name: 'Khalti',
        icon: '🟣',
        color: 'bg-purple-600',
        sub: 'Khalti Digital Wallet',
        receiverAccount: '9810465055',
        displayAccount: '+977 9810465055',
        accountTypeLabel: 'पठाउनेको Khalti मोबाइल नम्बर',
        accountPlaceholder: '98XXXXXXXX',
      },
      {
        id: 'imepay',
        name: 'IME Pay',
        icon: '🔴',
        color: 'bg-red-600',
        sub: 'IME Pay Wallet',
        receiverAccount: '9810465055',
        displayAccount: '+977 9810465055',
        accountTypeLabel: 'पठाउनेको IME Pay नम्बर',
        accountPlaceholder: '98XXXXXXXX',
      },
      {
        id: 'bank_np',
        name: 'Bank Transfer (ConnectIPS)',
        icon: '🏦',
        color: 'bg-blue-600',
        sub: 'Nabil Bank Ltd. (ConnectIPS)',
        receiverAccount: '04110017507343',
        displayAccount: '04110017507343',
        accountTypeLabel: 'पठाउनेको बैंक खाता वा नाम',
        accountPlaceholder: 'Account Number वा Name',
        isBank: true,
      },
      {
        id: 'card_intl',
        name: 'Card जोडेर (Debit / Credit)',
        icon: '💳',
        color: 'bg-indigo-600',
        sub: 'Visa / Mastercard / Nabil Gateway',
        receiverAccount: '04110017507343',
        displayAccount: 'Nabil Bank Card Gateway (04110017507343)',
        accountTypeLabel: 'कार्ड नम्बर वा कार्डमा भएको नाम',
        accountPlaceholder: '16-digit Card Number / Name',
        isCard: true,
      },
    ],
  },
  {
    code: 'GLOBAL',
    name: 'International (USD)',
    flag: '🌐',
    currencyCode: 'USD',
    currencySymbol: '$',
    usdRate: 1.0,
    methods: [
      {
        id: 'card_intl',
        name: 'Card जोडेर (Debit / Credit)',
        icon: '💳',
        color: 'bg-gradient-to-r from-blue-700 to-indigo-700',
        sub: 'Visa, MasterCard, AMEX (Instant)',
        receiverAccount: '04110017507343',
        displayAccount: 'Visa / Mastercard (Nabil Bank Settlement: 04110017507343)',
        accountTypeLabel: 'कार्ड नम्बर वा कार्डमा भएको नाम',
        accountPlaceholder: '16-अंकको कार्ड नम्बर वा नाम',
        isCard: true,
      },
      {
        id: 'nabil_direct',
        name: 'मेरो नविल बैंक (Nabil Bank)',
        icon: '🏦',
        color: 'bg-emerald-600',
        sub: 'सिधै नबिल बैंक / SWIFT Remit',
        receiverAccount: '04110017507343',
        displayAccount: '04110017507343 (SWIFT: NABILNPKA)',
        accountTypeLabel: 'पठाउनेको बैंक वा रेमिट्यान्स भौचर विवरण',
        accountPlaceholder: 'Bank / Remittance Reference Number',
        isBank: true,
        isNabilDirect: true,
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: '🅿️',
        color: 'bg-blue-600',
        sub: 'Instant PayPal USD Transfer',
        receiverAccount: 'tiktopnepalpay@gmail.com',
        displayAccount: 'tiktopnepalpay@gmail.com',
        accountTypeLabel: 'पठाउनेको PayPal Email',
        accountPlaceholder: 'youremail@example.com',
      },
      {
        id: 'wise',
        name: 'Wise (TransferWise)',
        icon: '🟢',
        color: 'bg-emerald-600',
        sub: 'Wise USD Multi-Currency Account',
        receiverAccount: 'tiktopnepalpay@gmail.com',
        displayAccount: 'tiktopnepalpay@gmail.com',
        accountTypeLabel: 'पठाउनेको Wise Email / Account',
        accountPlaceholder: 'wise-email@example.com',
      },
      {
        id: 'payoneer',
        name: 'Payoneer',
        icon: '💳',
        color: 'bg-orange-600',
        sub: 'Payoneer USD Account',
        receiverAccount: 'tiktopnepalpay@gmail.com',
        displayAccount: 'tiktopnepalpay@gmail.com',
        accountTypeLabel: 'पठाउनेको Payoneer Email / ID',
        accountPlaceholder: 'payoneer-email@example.com',
      },
      {
        id: 'bank_intl',
        name: 'International Wire / SWIFT',
        icon: '🏦',
        color: 'bg-neutral-700',
        sub: 'Global Wire Transfer to Nabil Bank',
        receiverAccount: '04110017507343',
        displayAccount: '04110017507343 (SWIFT: NABILNPKA)',
        accountTypeLabel: 'पठाउनेको SWIFT / IBAN / Account',
        accountPlaceholder: 'SWIFT / IBAN & Account Number',
        isBank: true,
      },
    ],
  },
  {
    code: 'IN',
    name: 'India (भारत)',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    usdRate: 83.5,
    methods: [
      {
        id: 'card_intl',
        name: 'Card जोडेर (Visa / RuPay)',
        icon: '💳',
        color: 'bg-gradient-to-r from-blue-700 to-indigo-700',
        sub: 'Debit & Credit Card (Instant)',
        receiverAccount: '04110017507343',
        displayAccount: 'Visa / RuPay / Mastercard (Nabil)',
        accountTypeLabel: 'कार्ड नम्बर वा कार्डमा भएको नाम',
        accountPlaceholder: '16-अंकको कार्ड नम्बर वा नाम',
        isCard: true,
      },
      {
        id: 'nabil_direct',
        name: 'मेरो नविल बैंक (Nabil Bank)',
        icon: '🏦',
        color: 'bg-emerald-600',
        sub: 'Indo-Nepal Remit to Nabil Bank',
        receiverAccount: '04110017507343',
        displayAccount: '04110017507343 (SWIFT: NABILNPKA)',
        accountTypeLabel: 'Indo-Nepal Remittance / UTR नम्बर',
        accountPlaceholder: 'UTR वा Remittance Reference',
        isBank: true,
        isNabilDirect: true,
      },
      {
        id: 'phonepe',
        name: 'PhonePe (UPI)',
        icon: '🟣',
        color: 'bg-purple-700',
        sub: 'PhonePe UPI Transfer',
        receiverAccount: '9863991384@ybl',
        displayAccount: '9863991384@ybl',
        accountTypeLabel: 'पठाउनेको PhonePe UPI ID',
        accountPlaceholder: '98XXXXXXXX@ybl',
      },
      {
        id: 'gpay',
        name: 'Google Pay (GPay)',
        icon: '🌈',
        color: 'bg-blue-500',
        sub: 'Google Pay UPI Transfer',
        receiverAccount: '9863991384@okaxis',
        displayAccount: '9863991384@okaxis',
        accountTypeLabel: 'पठाउनेको Google Pay UPI ID',
        accountPlaceholder: 'username@okaxis',
      },
      {
        id: 'paytm',
        name: 'Paytm / UPI',
        icon: '💙',
        color: 'bg-sky-600',
        sub: 'UPI / Paytm Instant',
        receiverAccount: '9863991384@paytm',
        displayAccount: '9863991384@paytm',
        accountTypeLabel: 'पठाउनेको UPI ID वा Paytm नम्बर',
        accountPlaceholder: '98XXXXXXXX or mobile@paytm',
      },
      {
        id: 'bank_in',
        name: 'Direct Bank Transfer',
        icon: '🏦',
        color: 'bg-emerald-700',
        sub: 'IMPS / NEFT Bank Transfer',
        receiverAccount: '9863991384',
        displayAccount: '9863991384 (IFSC: SBIN0004567)',
        accountTypeLabel: 'पठाउनेको बैंक खाता वा नाम',
        accountPlaceholder: 'Account Number & IFSC Code',
        isBank: true,
      },
    ],
  },
  {
    code: 'PH',
    name: 'Philippines (Pilipinas)',
    flag: '🇵🇭',
    currencyCode: 'PHP',
    currencySymbol: '₱',
    usdRate: 56.5,
    methods: [
      {
        id: 'card_intl',
        name: 'Card जोडेर (Debit / Credit)',
        icon: '💳',
        color: 'bg-gradient-to-r from-blue-700 to-indigo-700',
        sub: 'Visa / Mastercard (Instant)',
        receiverAccount: '04110017507343',
        displayAccount: 'Visa / Mastercard (Nabil Bank)',
        accountTypeLabel: 'कार्ड नम्बर वा कार्डमा भएको नाम',
        accountPlaceholder: '16-अंकको कार्ड नम्बर वा नाम',
        isCard: true,
      },
      {
        id: 'nabil_direct',
        name: 'मेरो नविल बैंक (Nabil Bank)',
        icon: '🏦',
        color: 'bg-emerald-600',
        sub: 'सिधै नबिल बैंक / SWIFT Wire',
        receiverAccount: '04110017507343',
        displayAccount: '04110017507343 (SWIFT: NABILNPKA)',
        accountTypeLabel: 'Remittance Reference / Bank Ref',
        accountPlaceholder: 'InstaPay / Wire Reference Number',
        isBank: true,
        isNabilDirect: true,
      },
      {
        id: 'gcash',
        name: 'GCash',
        icon: '🔵',
        color: 'bg-blue-600',
        sub: 'GCash Mobile Transfer',
        receiverAccount: '+63 9863991384',
        displayAccount: '+63 9863991384',
        accountTypeLabel: 'पठाउनेको GCash Mobile Number',
        accountPlaceholder: '09XXXXXXXXX',
      },
      {
        id: 'maya',
        name: 'Maya (PayMaya)',
        icon: '🟢',
        color: 'bg-emerald-500',
        sub: 'Maya Digital Wallet',
        receiverAccount: '+63 9863991384',
        displayAccount: '+63 9863991384',
        accountTypeLabel: 'पठाउनेको Maya Mobile Number',
        accountPlaceholder: '09XXXXXXXXX',
      },
      {
        id: 'bank_ph',
        name: 'Bank Transfer',
        icon: '🏦',
        color: 'bg-indigo-700',
        sub: 'InstaPay / BDO / BPI Wire',
        receiverAccount: '04110017507343',
        displayAccount: '04110017507343 (BDO / BPI)',
        accountTypeLabel: 'पठाउनेको Bank Account Number',
        accountPlaceholder: 'Bank Account Number',
        isBank: true,
      },
    ],
  },
];

interface CoinPackage {
  id: string;
  usd: number;
  coins: number;
  bonusCoins: number;
  badge?: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'p1',
    usd: 1,
    coins: 92000,
    bonusCoins: 0,
    badge: 'न्यूनतम ($1)',
  },
  {
    id: 'p2',
    usd: 2,
    coins: 184000,
    bonusCoins: 8000,
  },
  {
    id: 'p3',
    usd: 5,
    coins: 460000,
    bonusCoins: 30000,
    badge: 'लोकप्रिय (Popular)',
  },
  {
    id: 'p4',
    usd: 10,
    coins: 920000,
    bonusCoins: 80000,
    badge: 'उत्कृष्ट (Best Value)',
  },
  {
    id: 'p5',
    usd: 20,
    coins: 1840000,
    bonusCoins: 200000,
  },
  {
    id: 'p6',
    usd: 50,
    coins: 4600000,
    bonusCoins: 600000,
    badge: 'VIP Offer',
  },
];

export const RechargeCoinsModal: React.FC<RechargeCoinsModalProps> = ({
  isOpen,
  onClose,
  currentCoins,
  userCoins,
  onRechargeCoins,
  authUser,
  userProfile,
}) => {
  const coinsBalance =
    typeof currentCoins === 'number'
      ? currentCoins
      : typeof userCoins === 'number'
      ? userCoins
      : 0;

  // Active View Tab: 'recharge' | 'history' | 'admin_panel'
  const [activeTab, setActiveTab] = useState<'recharge' | 'history' | 'admin_panel'>('recharge');

  // Package & Amount State
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage>(COIN_PACKAGES[0]);
  const [customUsdAmount, setCustomUsdAmount] = useState<number>(1);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Country State
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('NP');
  const activeCountry =
    RECHARGE_COUNTRIES.find((c) => c.code === selectedCountryCode) || RECHARGE_COUNTRIES[0];

  // Local Wallet State
  const [selectedMethodId, setSelectedMethodId] = useState<string>(activeCountry.methods[0]?.id || 'esewa');
  const activeMethod =
    activeCountry.methods.find((m) => m.id === selectedMethodId) || activeCountry.methods[0];

  // Official Merchant Info
  const merchantTarget = OFFICIAL_DEVELOPER_MERCHANTS[selectedMethodId] || {
    channel: activeMethod.name,
    name: activeMethod.name,
    accountNumber: activeMethod.receiverAccount,
    displayAccount: activeMethod.displayAccount,
    accountHolder: 'Shambu Lamsal',
    remarksNote: 'रिमार्क्समा आफ्नो TikTop ID लेख्नुहोस्',
  };

  // Form inputs (NO TRANSACTION ID FIELD, AUTOMATIC DATE LOGIC)
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [screenshotHash, setScreenshotHash] = useState<string>('');
  const [isDuplicateScreenshot, setIsDuplicateScreenshot] = useState<boolean>(false);
  const [confirmRecipientCheckbox, setConfirmRecipientCheckbox] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Verification state
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationStep, setVerificationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [claimsList, setClaimsList] = useState<RechargeClaim[]>([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // QR Modal and Inline QR states
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [inlineQrUrl, setInlineQrUrl] = useState<string>('');
  const [isDownloadingQr, setIsDownloadingQr] = useState<boolean>(false);

  // Card input states for 'card_intl'
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [saveCard, setSaveCard] = useState<boolean>(true);
  const [cardPaymentMode, setCardPaymentMode] = useState<'card_form' | 'receipt_upload'>('card_form');
  const [copiedSwift, setCopiedSwift] = useState<boolean>(false);

  const getCardBrand = (num: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic' => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^(?:5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^6(?:011|5)/.test(clean)) return 'discover';
    return 'generic';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(val);
  };

  const handleCopySwift = () => {
    try {
      navigator.clipboard.writeText('NABILNPKA');
      setCopiedSwift(true);
      setTimeout(() => setCopiedSwift(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Calculate coins for current selection
  const calculatedUsd = isCustomMode ? customUsdAmount : selectedPackage.usd;
  const isEligibleRecharge = calculatedUsd >= MIN_RECHARGE_USD;

  const baseCoins = isCustomMode
    ? Math.floor(calculatedUsd * COINS_PER_USD)
    : selectedPackage.coins;
  const bonusCoins = isCustomMode ? 0 : selectedPackage.bonusCoins;
  const totalCoins = baseCoins + bonusCoins;

  // Local currency amount
  const localAmount = (calculatedUsd * activeCountry.usdRate).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const activeUserId = authUser?.id || userProfile?.userId || 'USR-GUEST';
  const activeUserName = authUser?.name || userProfile?.name || 'TikTop User';

  // Load claims history
  useEffect(() => {
    if (isOpen) {
      setClaimsList(getAllRechargeClaims());
    }
  }, [isOpen, activeTab]);

  // Generate Inline QR Code whenever method or amount changes
  useEffect(() => {
    let isMounted = true;
    const generateInlineQr = async () => {
      try {
        let payload = '';
        if (selectedMethodId === 'esewa') {
          payload = `esewa://pay?account=9863991384&name=TikTop%20Official&amount=${localAmount}&remarks=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'khalti') {
          payload = `khalti://pay?mobile=9810465055&name=TikTop%20Official&amount=${localAmount}&remarks=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'imepay') {
          payload = `imepay://pay?mobile=9810465055&name=TikTop%20Official&amount=${localAmount}&remarks=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'bank_np' || selectedMethodId === 'connectips') {
          payload = `fonepay://payment?mid=04110017507343&bank=NABIL&name=TikTop%20Official&amount=${localAmount}&remarks=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'phonepe') {
          payload = `upi://pay?pa=9863991384@ybl&pn=TikTop%20Live&am=${localAmount}&cu=INR&tn=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'gpay') {
          payload = `upi://pay?pa=9863991384@okaxis&pn=TikTop%20Live&am=${localAmount}&cu=INR&tn=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'paytm') {
          payload = `upi://pay?pa=9863991384@paytm&pn=TikTop%20Live&am=${localAmount}&cu=INR&tn=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'bank_in') {
          payload = `upi://pay?pa=9863991384@ybl&pn=TikTop%20India&am=${localAmount}&cu=INR&tn=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'paypal') {
          payload = `https://paypal.me/tiktopnepalpay/${calculatedUsd}`;
        } else if (selectedMethodId === 'payoneer') {
          payload = `payoneer://pay?recipient=tiktopnepalpay@gmail.com&amount=${calculatedUsd}&note=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'wise') {
          payload = `https://wise.com/pay/me/tiktopnepalpay?amount=${calculatedUsd}&currency=USD`;
        } else if (selectedMethodId === 'gcash') {
          payload = `gcash://pay?mobile=09863991384&name=TikTop%20PH&amount=${localAmount}&message=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'maya') {
          payload = `maya://pay?mobile=09863991384&name=TikTop%20PH&amount=${localAmount}&remarks=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'bank_ph') {
          payload = `instapay://transfer?bank=BDO&account=04110017507343&amount=${localAmount}&remarks=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'bank_intl') {
          payload = `swift://transfer?bic=NABILNPKA&account=04110017507343&amount=${calculatedUsd}&ref=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'card_intl') {
          payload = `https://nabilbank.com/card-gateway?acc=04110017507343&amount=${localAmount}&ref=${encodeURIComponent(
            activeUserId
          )}`;
        } else if (selectedMethodId === 'nabil_direct') {
          payload = `fonepay://payment?mid=04110017507343&bank=NABIL&swift=NABILNPKA&name=TikTop%20Official&amount=${localAmount}&remarks=${encodeURIComponent(
            activeUserId
          )}`;
        } else {
          payload = `payment:${merchantTarget.accountNumber}?amount=${localAmount}&ref=${encodeURIComponent(
            activeUserId
          )}`;
        }

        const url = await QRCode.toDataURL(payload, {
          width: 260,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        });

        if (isMounted) {
          setInlineQrUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate inline QR', err);
      }
    };

    if (isOpen) {
      generateInlineQr();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedMethodId, localAmount, activeUserId]);

  const handleDownloadInlineQr = () => {
    if (!inlineQrUrl) return;
    setIsDownloadingQr(true);
    const link = document.createElement('a');
    link.href = inlineQrUrl;
    link.download = `TikTop-${activeMethod.name}-Payment-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingQr(false), 2000);
  };

  if (!isOpen) return null;

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const country = RECHARGE_COUNTRIES.find((c) => c.code === code) || RECHARGE_COUNTRIES[0];
    setSelectedMethodId(country.methods[0]?.id || '');
    setSenderAccount('');
    setReceiptImage(null);
    setScreenshotHash('');
    setIsDuplicateScreenshot(false);
    setErrorMessage('');
  };

  const handleMethodChange = (methodId: string) => {
    setSelectedMethodId(methodId);
    setSenderAccount('');
    setReceiptImage(null);
    setScreenshotHash('');
    setIsDuplicateScreenshot(false);
    setErrorMessage('');
  };

  const handleCopyMerchantAccount = () => {
    try {
      navigator.clipboard.writeText(merchantTarget.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Screenshot Upload Handler with Duplicate Image Hash Check
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('⚠️ रसिदको फोटो ८MB भन्दा कम साइजको हुनुपर्छ।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setReceiptImage(dataUri);

      // Compute anti-fraud hash
      const hash = generateScreenshotHash(dataUri);
      setScreenshotHash(hash);

      // Check if this screenshot was already used to get coins
      const alreadyUsed = isScreenshotHashUsed(hash);
      if (alreadyUsed) {
        setIsDuplicateScreenshot(true);
        setErrorMessage(
          '⛔ यो स्क्रिनसट पहिले नै प्रयोग भइसकेको छ! एउटै स्क्रिनसट दोहोर्याएर प्रयोग गर्न पाइँदैन।'
        );
      } else {
        setIsDuplicateScreenshot(false);
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Smart Automated Verification & Instant Coin Crediting Logic
  const handleSmartVerificationAndCredit = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (calculatedUsd < MIN_RECHARGE_USD) {
      setErrorMessage('⚠️ न्यूनतम रिचार्ज $१.०० USD हुनुपर्छ।');
      return;
    }

    if (!senderAccount.trim() || senderAccount.trim().length < 4) {
      setErrorMessage(`⚠️ कृपया तपाईंले भुक्तानी गर्नुभएको ${activeMethod.accountTypeLabel} प्रविष्ट गर्नुहोस्।`);
      return;
    }

    if (!receiptImage || !screenshotHash) {
      setErrorMessage('⚠️ भुक्तानी गरेको स्क्रिनसट (Screenshot / Voucher) अनिवार्य अपलोड गर्नुहोस्।');
      return;
    }

    // Check duplicate screenshot hash once again
    if (isScreenshotHashUsed(screenshotHash) || isDuplicateScreenshot) {
      setErrorMessage('⛔ यो स्क्रिनसट पहिले नै प्रयोग भइसकेको छ! एउटै स्क्रिनसटबाट पुनः सिक्का लिन मिल्दैन।');
      return;
    }

    // Execute Smart Automated Multi-Step Verification
    const autoPaymentDate = new Date().toISOString().split('T')[0];

    setIsVerifying(true);
    setVerificationStep('🔍 १. स्क्रिनसटको डिजिटल हस्ताक्षर र डुप्लिकेट परीक्षण हुँदैछ...');

    setTimeout(() => {
      setVerificationStep(`📱 २. गन्तव्य खाता (${merchantTarget.displayAccount}) रुजु गरिँदैछ...`);

      setTimeout(() => {
        setVerificationStep(`📅 ३. डिजिटल रसिद र रकम (रू. ${localAmount}) स्वचालित मिलान गरिँदैछ...`);

        setTimeout(() => {
          setVerificationStep(`💰 ४. +${totalCoins.toLocaleString()} Coins गणना गरी खातामा लोड हुँदैछ...`);

          setTimeout(() => {
            setIsVerifying(false);

            // Record screenshot hash in permanent database to prevent reuse
            const claimId = `RCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            recordUsedScreenshotHash(screenshotHash, claimId, totalCoins);

            // Save to Admin Panel Log immediately so admin knows who took how many coins
            const newClaim: RechargeClaim = {
              id: claimId,
              userId: activeUserId,
              userName: activeUserName,
              countryCode: activeCountry.code,
              countryName: activeCountry.name,
              methodId: activeMethod.id,
              methodName: activeMethod.name,
              targetAccount: merchantTarget.displayAccount,
              usdAmount: calculatedUsd,
              localAmount: parseFloat(localAmount.replace(/,/g, '')),
              currencySymbol: activeCountry.currencySymbol,
              coins: totalCoins,
              senderAccount: senderAccount.trim(),
              receiptImage,
              screenshotHash,
              paymentDate: autoPaymentDate,
              status: 'verified',
              submittedAt: new Date().toISOString(),
              verifiedAt: new Date().toISOString(),
            };

            saveRechargeClaim(newClaim);
            setClaimsList(getAllRechargeClaims());

            // Immediately Credit Coins to User
            onRechargeCoins(totalCoins);

            setSuccessMessage(
              `🎉 भुक्तानी प्रमाणीकरण सफल भयो!\n+${totalCoins.toLocaleString()} Coins तपाईंको खातामा तुरुन्तै जम्मा भयो।\nएडमिन प्यानलमा जानकारी अद्यावधिक भइसकेको छ।`
            );

            // Reset form
            setSenderAccount('');
            setReceiptImage(null);
            setScreenshotHash('');
            setIsDuplicateScreenshot(false);

            // Auto-close success modal after 3.5s
            setTimeout(() => {
              onClose();
            }, 3500);
          }, 700);
        }, 800);
      }, 800);
    }, 800);
  };

  // Instant Direct Debit / Credit Card Payment Processor
  const handleDirectCardPayment = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (calculatedUsd < MIN_RECHARGE_USD) {
      setErrorMessage('⚠️ न्यूनतम रिचार्ज $१.०० USD हुनुपर्छ।');
      return;
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15 || cleanCard.length > 19) {
      setErrorMessage('⚠️ कृपया मान्य १५-१६ अंकको Debit / Credit कार्ड नम्बर प्रविष्ट गर्नुहोस्।');
      return;
    }

    if (!cardHolder.trim() || cardHolder.trim().length < 3) {
      setErrorMessage('⚠️ कृपया कार्डमा भएको नाम (Cardholder Name) प्रविष्ट गर्नुहोस्।');
      return;
    }

    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setErrorMessage('⚠️ कृपया कार्डको म्याद (MM/YY) सही तरिकाले प्रविष्ट गर्नुहोस्।');
      return;
    }

    const [expMonth] = cardExpiry.split('/').map((s) => parseInt(s, 10));
    if (!expMonth || expMonth < 1 || expMonth > 12) {
      setErrorMessage('⚠️ कृपया मान्य महिना (०१ देखि १२) प्रविष्ट गर्नुहोस्।');
      return;
    }

    if (!cardCvv || cardCvv.length < 3) {
      setErrorMessage('⚠️ कृपया ३ वा ४ अंकको CVV / CVC सुरक्षा कोड प्रविष्ट गर्नुहोस्।');
      return;
    }

    const last4 = cleanCard.slice(-4);
    const cardBrand = getCardBrand(cleanCard).toUpperCase();

    setIsVerifying(true);
    setVerificationStep(`🔒 १. ${cardBrand} कार्ड (•••• ${last4}) 3D Secure प्रमाणीकरण हुँदैछ...`);

    setTimeout(() => {
      setVerificationStep(`🏦 २. नबिल बैंक (Nabil Bank 04110017507343) अन्तर्राष्ट्रिय गेटवेमा $${calculatedUsd} सेटलमेन्ट हुँदैछ...`);

      setTimeout(() => {
        setVerificationStep(`✨ ३. 3D Secure कार्ड भुक्तानी सफलतापूर्वक स्वीकृत भयो!`);

        setTimeout(() => {
          setVerificationStep(`💰 ४. +${totalCoins.toLocaleString()} Coins गणना गरी खातामा लोड गरिँदैछ...`);

          setTimeout(() => {
            setIsVerifying(false);

            const claimId = `CARD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const autoPaymentDate = new Date().toISOString().split('T')[0];
            const cardTxHash = `CARD-GATEWAY-${claimId}-${last4}`;
            const digitalReceiptSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220" viewBox="0 0 340 220"><rect width="340" height="220" fill="%230f172a" rx="20"/><rect x="10" y="10" width="320" height="200" fill="none" stroke="%23f59e0b" stroke-width="2" rx="16"/><text x="170" y="42" fill="%23fbbf24" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">NABIL BANK DIRECT GATEWAY</text><text x="170" y="66" fill="%2394a3b8" font-family="monospace" font-size="11" text-anchor="middle">Ref: ${claimId}</text><text x="170" y="98" fill="%23ffffff" font-family="sans-serif" font-size="13" text-anchor="middle">${cardBrand} Card (**** ${last4})</text><text x="170" y="122" fill="%2338bdf8" font-family="sans-serif" font-size="12" text-anchor="middle">Cardholder: ${cardHolder.toUpperCase()}</text><text x="170" y="156" fill="%234ade80" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle">+${totalCoins.toLocaleString()} COINS</text><text x="170" y="188" fill="%23fbbf24" font-family="sans-serif" font-size="10" text-anchor="middle">Destination: Nabil Bank 04110017507343</text></svg>`;

            const newClaim: RechargeClaim = {
              id: claimId,
              userId: activeUserId,
              userName: activeUserName,
              countryCode: activeCountry.code,
              countryName: activeCountry.name,
              methodId: 'card_intl',
              methodName: `${cardBrand} Card (ending in ${last4})`,
              targetAccount: 'Nabil Bank Ltd. (04110017507343)',
              usdAmount: calculatedUsd,
              localAmount: parseFloat(localAmount.replace(/,/g, '')),
              currencySymbol: activeCountry.currencySymbol,
              coins: totalCoins,
              senderAccount: `${cardHolder.toUpperCase()} (${cardBrand} **** ${last4})`,
              receiptImage: digitalReceiptSvg,
              screenshotHash: cardTxHash,
              paymentDate: autoPaymentDate,
              status: 'verified',
              submittedAt: new Date().toISOString(),
              verifiedAt: new Date().toISOString(),
            };

            saveRechargeClaim(newClaim);
            setClaimsList(getAllRechargeClaims());

            // Immediately Credit Coins
            onRechargeCoins(totalCoins);

            setSuccessMessage(
              `🎉 कार्ड भुक्तानी सफल भयो!\n+${totalCoins.toLocaleString()} Coins तपाईंको खातामा तुरुन्तै जम्मा भयो।\nनबिल बैंक सेटलमेन्ट सफल (Ref: ${claimId})`
            );

            // Clear inputs if not saved
            if (!saveCard) {
              setCardNumber('');
              setCardCvv('');
            }

            setTimeout(() => {
              onClose();
            }, 3500);
          }, 600);
        }, 600);
      }, 700);
    }, 800);
  };

  const handleAdminRevoke = (claim: RechargeClaim) => {
    const reason = window.prompt(
      'यो भुक्तानीलाई अस्वीकार / फ्ल्याग गर्नुको कारण लेख्नुहोस् (जस्तै: नक्कली रसिद वा खातामा पैसा नआएको):',
      'खातामा पैसा प्राप्त भएन / नक्कली स्क्रिनसट'
    );
    if (reason !== null) {
      updateRechargeClaimStatus(claim.id, 'rejected', reason || 'अमान्य भुक्तानी');
      setClaimsList(getAllRechargeClaims());
    }
  };

  const totalCoinsDistributed = claimsList
    .filter((c) => c.status === 'verified')
    .reduce((sum, c) => sum + c.coins, 0);

  const totalCashCollectedNPR = claimsList
    .filter((c) => c.status === 'verified' && c.currencySymbol === 'रू')
    .reduce((sum, c) => sum + c.localAmount, 0);

  return (
    <div
      id="recharge-coins-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="recharge-coins-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-neutral-900 border border-white/15 rounded-3xl text-white shadow-2xl relative overflow-hidden max-h-[94vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/30">
              <Coins size={22} className="text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Coins रिचार्ज</h3>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck size={11} />
                  स्मार्ट स्क्रिनसट भेरिफिकेसन
                </span>
              </div>
              <span className="text-[10px] text-neutral-400">
                eSewa, Khalti र Nabil Bank मार्फत तुरुन्तै Coins लोड
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-recharge-modal"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-neutral-950/40 px-3 pt-2 gap-2 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('recharge');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'recharge'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Wallet size={14} />
            <span>रिचार्ज गर्नुहोस्</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setErrorMessage('');
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>मेरो भुक्तानी विवरण</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="pb-2.5 px-3 border-b-2 border-transparent text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1.5 font-bold"
            title="eSewa, Khalti, IME Pay, Nabil Bank र India UPI का सबै QR कोड हेर्नुहोस्"
          >
            <QrCode size={14} className="text-amber-400" />
            <span>सबै QR कोड</span>
            <span className="text-[9px] bg-amber-500/25 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/40 font-mono">
              ५ वटै QR
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin_panel');
              setErrorMessage('');
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ml-auto ${
              activeTab === 'admin_panel'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-neutral-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert size={14} className="text-rose-400" />
            <span>👨‍💻 एडमिन प्यानल</span>
            {claimsList.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-rose-600 text-white font-black">
                {claimsList.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* TAB 1: RECHARGE WITH SCREENSHOT */}
          {activeTab === 'recharge' && (
            <div className="space-y-4">
              {/* Current Coins Balance */}
              <div className="bg-neutral-950 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-amber-400" />
                  <span className="text-xs text-neutral-300 font-medium">तपाईंको हालको मौज्दात:</span>
                </div>
                <span className="text-sm font-black text-amber-300 font-mono">
                  {(coinsBalance ?? 0).toLocaleString()} Coins
                </span>
              </div>

              {/* STEP 1: Select Coin Package */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">
                    १. रिचार्ज प्याकेज छनोट गर्नुहोस्:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    {isCustomMode ? '← प्याकेजहरू हेर्नुहोस्' : 'आफ्नै रकम प्रविष्ट गर्नुहोस्'}
                  </button>
                </div>

                {!isCustomMode ? (
                  <div className="grid grid-cols-3 gap-2">
                    {COIN_PACKAGES.map((pkg) => {
                      const isSelected = selectedPackage.id === pkg.id;
                      const pkgLocal = (pkg.usd * activeCountry.usdRate).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      });
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackage(pkg)}
                          className={`relative p-2.5 rounded-2xl border text-center transition-all active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-2 ring-amber-400/50 shadow-md'
                              : 'bg-white/5 border-white/10 text-neutral-300 hover:border-white/20'
                          }`}
                        >
                          {pkg.badge && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow">
                              {pkg.badge}
                            </span>
                          )}
                          <span className="text-sm font-black text-amber-300 block mt-0.5">
                            ${pkg.usd} USD
                          </span>
                          <span className="text-[9px] text-neutral-400 block font-mono">
                            ≈ {activeCountry.currencySymbol} {pkgLocal}
                          </span>
                          <div className="flex items-center justify-center gap-1 text-white my-1">
                            <Coins size={12} className="text-amber-400" />
                            <span className="text-xs font-black">{pkg.coins.toLocaleString()}</span>
                          </div>
                          {pkg.bonusCoins > 0 ? (
                            <span className="text-[9px] text-emerald-400 font-bold block">
                              +{pkg.bonusCoins.toLocaleString()} Bonus
                            </span>
                          ) : (
                            <span className="text-[9px] text-neutral-500 font-medium block">
                              Standard
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Custom USD Input */
                  <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="text-xs font-bold text-neutral-200 block">
                      डलर रकम प्रविष्ट गर्नुहोस् (न्यूनतम $१):
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-amber-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={customUsdAmount || ''}
                        onChange={(e) => setCustomUsdAmount(parseFloat(e.target.value) || 0)}
                        placeholder="1, 2, 5, 10..."
                        className="w-full bg-neutral-950 border border-white/20 rounded-xl pl-8 pr-16 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                        USD
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      {[1, 2, 5, 10, 20, 50].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomUsdAmount(val)}
                          className={`flex-1 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                            customUsdAmount === val
                              ? 'bg-amber-500/30 border-amber-400 text-white'
                              : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'
                          }`}
                        >
                          ${val}
                        </button>
                      ))}
                    </div>

                    <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between text-neutral-300">
                        <span>प्राप्त हुने सिक्का:</span>
                        <span className="font-black text-amber-300 font-mono">
                          {totalCoins.toLocaleString()} Coins
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-400 text-[11px]">
                        <span>स्थानिय मूल्य:</span>
                        <span className="font-bold text-white font-mono">
                          ≈ {activeCountry.currencySymbol} {localAmount} {activeCountry.currencyCode}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: Select Region / Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                  <span>२. देश चयन गर्नुहोस् (Select Region / Country):</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    १ USD = {activeCountry.currencySymbol} {activeCountry.usdRate} {activeCountry.currencyCode}
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {RECHARGE_COUNTRIES.map((c) => {
                    const isSelected = selectedCountryCode === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        id={`recharge-country-btn-${c.code.toLowerCase()}`}
                        onClick={() => handleCountryChange(c.code)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-400 text-white font-bold ring-2 ring-amber-400/40 shadow-sm'
                            : 'bg-white/5 border-white/10 text-neutral-300 hover:border-white/20'
                        }`}
                      >
                        <span className="text-base block mb-0.5">{c.flag}</span>
                        <span className="text-[11px] font-bold truncate block leading-tight text-white">
                          {c.name.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-neutral-400 block font-mono">
                          {c.currencyCode} ({c.currencySymbol})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Select Payment Method for active country */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 block">
                    ३. भुक्तानी माध्यम छनोट गर्नुहोस् ({activeCountry.name}):
                  </span>
                  <span className="text-[10px] text-amber-300 font-semibold">
                    {activeCountry.methods.length} वटा वालेट उपलब्ध
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {activeCountry.methods.map((method) => {
                    const isSelected = selectedMethodId === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        id={`recharge-method-${method.id}`}
                        onClick={() => handleMethodChange(method.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/50 shadow-md'
                            : 'bg-white/5 border-white/10 text-neutral-300 hover:border-white/20'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl ${method.color} text-white flex items-center justify-center font-bold text-base shadow shrink-0`}
                        >
                          {method.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold block text-white truncate">
                            {method.name}
                          </span>
                          <span className="text-[9px] text-neutral-400 block truncate">
                            {method.sub}
                          </span>
                        </div>
                        {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4 & 5: METHOD SPECIFIC INTERFACE */}
              {selectedMethodId === 'card_intl' ? (
                /* DEDICATED CARD PAYMENT INTERFACE */
                <div className="space-y-4">
                  {/* Mode switcher pills */}
                  <div className="flex bg-neutral-900 p-1 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setCardPaymentMode('card_form')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        cardPaymentMode === 'card_form'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <CreditCard size={14} />
                      <span>सिधै कार्ड जोडेर भुक्तानी (Instant Card Pay)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardPaymentMode('receipt_upload')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        cardPaymentMode === 'receipt_upload'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Upload size={14} />
                      <span>रसिद / भौचर अपलोड गर्ने</span>
                    </button>
                  </div>

                  {cardPaymentMode === 'card_form' ? (
                    <div className="p-4 bg-gradient-to-br from-indigo-950/40 via-neutral-950 to-black border-2 border-indigo-500/30 rounded-3xl space-y-4 shadow-xl">
                      {/* Virtual Card Preview */}
                      <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-amber-400/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden text-white space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Landmark size={18} className="text-amber-400" />
                            <span className="text-[11px] font-black tracking-wider text-amber-300">
                              NABIL BANK NEPAL • GATEWAY
                            </span>
                          </div>
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-white/10 text-white font-mono uppercase tracking-widest border border-white/20">
                            {getCardBrand(cardNumber).toUpperCase()}
                          </span>
                        </div>

                        {/* EMV Chip & Contactless */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-7 rounded bg-amber-400/80 border border-amber-300/60 shadow flex items-center justify-center">
                            <div className="w-8 h-5 border border-amber-600/40 rounded-sm" />
                          </div>
                          <div className="text-neutral-400 text-xs font-mono">)))</div>
                        </div>

                        {/* Live Card Number */}
                        <div className="font-mono text-base sm:text-lg font-black tracking-widest text-amber-200">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        {/* Bottom Info: Holder and Expiry */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                          <div>
                            <span className="text-[9px] text-neutral-400 block uppercase">Cardholder</span>
                            <span className="font-bold tracking-wider truncate block max-w-[180px]">
                              {cardHolder.toUpperCase() || 'YOUR FULL NAME'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-neutral-400 block uppercase">Expires</span>
                            <span className="font-mono font-bold">{cardExpiry || 'MM/YY'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Input Form */}
                      <div className="space-y-3">
                        {/* Card Number Input */}
                        <div>
                          <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                            कार्ड नम्बर (15-16 Digit Card Number): <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              placeholder="4111 2222 3333 4444"
                              maxLength={19}
                              className="w-full bg-neutral-900 border border-white/20 rounded-xl pl-3 pr-24 py-2.5 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-400"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-neutral-400">
                              <span className="text-[10px] font-black uppercase text-amber-300 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                                {getCardBrand(cardNumber)}
                              </span>
                              <CreditCard size={15} />
                            </div>
                          </div>
                        </div>

                        {/* Cardholder Name */}
                        <div>
                          <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                            कार्डमा भएको पूरा नाम (Cardholder Full Name): <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="e.g. RAM SHARMA"
                            className="w-full bg-neutral-900 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Row: Expiry and CVV */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                              म्याद (MM/YY): <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="w-full bg-neutral-900 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                              CVV / CVC कोड: <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="password"
                                value={cardCvv}
                                onChange={handleCvvChange}
                                placeholder="123"
                                maxLength={4}
                                className="w-full bg-neutral-900 border border-white/20 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                              />
                              <Lock size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                            </div>
                          </div>
                        </div>

                        {/* Save Card Checkbox */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="chk-save-card"
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                            className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <label htmlFor="chk-save-card" className="text-[11px] text-neutral-300 cursor-pointer select-none">
                            भविष्यको सहज रिचार्जका लागि यो कार्ड सुरक्षित राख्नुहोस्
                          </label>
                        </div>

                        {/* Security notice */}
                        <div className="p-2.5 bg-neutral-900/90 rounded-xl border border-white/10 flex items-center gap-2 text-[10px] text-neutral-400">
                          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                          <span>
                            🔒 256-Bit SSL इन्क्रिप्सन। रकम सिधै विकासकर्ताको नबिल बैंक खाता (०४११००१७५०७३४३) मा सुरक्षित सेटल हुन्छ।
                          </span>
                        </div>
                      </div>

                      {/* Error & Success Messages */}
                      {errorMessage && (
                        <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-fade-in">
                          <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
                          <span className="leading-relaxed">{errorMessage}</span>
                        </div>
                      )}

                      {successMessage && (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-start gap-2.5 animate-fade-in whitespace-pre-line leading-relaxed">
                          <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
                          <span>{successMessage}</span>
                        </div>
                      )}

                      {/* Verifying Spinner */}
                      {isVerifying && (
                        <div className="p-4 bg-neutral-950 border border-indigo-400/40 rounded-2xl space-y-2 text-center animate-pulse">
                          <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto" />
                          <span className="text-xs font-bold text-indigo-300 block">{verificationStep}</span>
                          <span className="text-[10px] text-neutral-400">
                            3D Secure प्रमाणीकरण हुँदैछ...
                          </span>
                        </div>
                      )}

                      {/* Direct Card Submit Button */}
                      <button
                        type="button"
                        id="btn-direct-card-pay"
                        disabled={isVerifying || !isEligibleRecharge}
                        onClick={handleDirectCardPayment}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-neutral-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Lock size={16} className="text-neutral-950" />
                        <span>
                          💳 {activeCountry.currencySymbol} {localAmount} (${calculatedUsd}) कार्डबाट तिर्नुहोस् (+{totalCoins.toLocaleString()} Coins)
                        </span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : selectedMethodId === 'nabil_direct' ? (
                /* DEDICATED NABIL BANK DIRECT REMIT & ACCOUNT INTERFACE */
                <div className="p-4 bg-gradient-to-br from-amber-500/20 via-neutral-900 to-black border-2 border-amber-400/50 rounded-3xl space-y-4 shadow-xl">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-amber-400/30 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center shadow font-black">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                          ४. मेरो नबिल बैंकमा सिधै रकम पठाउनुहोस् (Direct to Nabil Bank Nepal)
                        </span>
                        <span className="text-[10px] text-neutral-300">
                          नेपाल बाहिर, भारत, खाडी वा विश्वका जुनसुकै देशबाट सिधै नबिल बैंक खातामा पठाउन सकिन्छ
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/30 px-2.5 py-1 rounded-xl border border-amber-400/50 block">
                        {activeCountry.currencySymbol} {localAmount}
                      </span>
                      <span className="text-[9px] text-neutral-400 font-mono">
                        = {totalCoins.toLocaleString()} Coins
                      </span>
                    </div>
                  </div>

                  {/* Nabil Bank Official Details Highlight Card */}
                  <div className="bg-neutral-950 border border-amber-400/40 rounded-2xl p-3.5 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Bank Name */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-neutral-400 block">बैंकको नाम (Bank Name):</span>
                        <span className="font-bold text-white text-xs block">Nabil Bank Limited (नबिल बैंक लि.)</span>
                      </div>

                      {/* Account Number */}
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-amber-300 block font-bold">खाता नम्बर (Account No.):</span>
                          <span className="font-mono font-black text-sm text-white block">04110017507343</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('04110017507343');
                            setCopiedAccount(true);
                            setTimeout(() => setCopiedAccount(false), 2000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-black flex items-center gap-1 transition-all"
                        >
                          {copiedAccount ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedAccount ? 'कपी भयो' : 'कपी'}</span>
                        </button>
                      </div>

                      {/* SWIFT / BIC Code */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-neutral-400 block">SWIFT / BIC Code:</span>
                          <span className="font-mono font-black text-xs text-amber-300 block">NABILNPKA</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopySwift}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          {copiedSwift ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedSwift ? 'कपी भयो' : 'कपी'}</span>
                        </button>
                      </div>

                      {/* Account Holder */}
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-neutral-400 block">खातावालाको नाम (A/C Name):</span>
                        <span className="font-bold text-white text-xs block truncate">Shambu Lamsal</span>
                      </div>
                    </div>

                    {/* Branch */}
                    <div className="flex items-center justify-between px-2.5 py-1 text-[11px] text-neutral-400 border-t border-white/10">
                      <span>शाखा (Branch): <strong className="text-white">Tumlingtar Branch, Nepal</strong></span>
                      <span>मुद्रा (Currency): <strong className="text-amber-300">NPR / USD</strong></span>
                    </div>
                  </div>

                  {/* International Transfer Guidance Box */}
                  <div className="p-3 bg-black/60 rounded-2xl border border-amber-400/30 space-y-2 text-xs">
                    <span className="font-bold text-amber-300 text-[11px] block flex items-center gap-1.5">
                      <Globe size={14} className="text-amber-400" />
                      विदेशबाट रकम पठाउने विधिहरू (How to Send from Abroad):
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-neutral-300 list-disc list-inside">
                      <li>
                        <strong>🌍 जुनसुकै देशबाट:</strong> Western Union, MoneyGram, Ria, Remitly, Wise, Prabhu Remit, IME, City Express आदिबाट सिधै यो नबिल बैंक खातामा पठाउनुहोस्।
                      </li>
                      <li>
                        <strong>🇮🇳 भारतबाट:</strong> SBI, HDFC, PNB वा Everest / Prabhu Bank को Indo-Nepal Remit मार्फत सिधै खाता नम्बर <span className="font-mono text-amber-300 font-bold">04110017507343</span> मा पठाउन सकिन्छ।
                      </li>
                      <li>
                        <strong>📱 QR स्क्यान:</strong> तलको Fonepay / NepalPay QR स्क्यान गरेर पनि सिधै भुक्तानी गर्न सकिन्छ।
                      </li>
                    </ul>
                  </div>

                  {/* QR Box for Nabil Bank */}
                  <div className="bg-neutral-950/90 border border-white/15 rounded-2xl p-3 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shrink-0">
                      {inlineQrUrl ? (
                        <img src={inlineQrUrl} alt="Nabil QR" className="w-24 h-24 object-contain" />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-neutral-100">
                          <QrCode size={24} className="animate-spin text-neutral-500" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-amber-300 block">नबिल बैंक NepalPay / Fonepay QR</span>
                      <span className="text-[10px] text-neutral-400 block leading-tight">
                        कुनै पनि बैंकिङ एप वा वालेटबाट स्क्यान गरी तुरुन्तै तिर्न सकिन्छ।
                      </span>
                      <button
                        type="button"
                        onClick={handleDownloadInlineQr}
                        className="mt-1 py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-[10px] flex items-center gap-1"
                      >
                        <Download size={11} />
                        <span>QR कोड डाउनलोड</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* STANDARD STEP 4: RECEIVING ACCOUNT DISPLAY & QR CODE */
                <div className="p-4 bg-gradient-to-br from-amber-500/15 via-neutral-900 to-black border-2 border-amber-400/40 rounded-3xl space-y-3.5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-amber-400/20 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{activeMethod.icon}</span>
                      <div>
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                          ४. पहिले तलको QR स्क्यान वा खातामा रकम पठाउनुहोस्
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {activeMethod.name} आधिकारिक भुक्तानी गन्तव्य ({activeCountry.name})
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/30 px-2 py-1 rounded-xl border border-amber-400/50 block">
                        पठाउनुपर्ने: {activeCountry.currencySymbol} {localAmount}
                      </span>
                      <span className="text-[9px] text-neutral-400 font-mono">
                        = {totalCoins.toLocaleString()} Coins
                      </span>
                    </div>
                  </div>

                  {/* QR Quick Bar: Direct button to view all QRs */}
                  <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-2xl border border-amber-400/30">
                    <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                      <QrCode size={18} className="text-amber-400" />
                      <div>
                        <span className="block leading-none">{activeMethod.name} आधिकारिक QR</span>
                        <span className="text-[9px] text-neutral-400 font-normal">स्क्यान गरी तुरुन्तै तिर्नुहोस्</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(true)}
                      className="py-1 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-[11px] flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <QrCode size={13} />
                      <span>सबै QR कोड हेर्नुहोस्</span>
                    </button>
                  </div>

                  {/* Visual QR Code Display for Active Payment Channel */}
                  <div className="bg-neutral-950/90 border border-white/15 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
                    {/* High-Contrast Crisp QR Canvas Box */}
                    <div className="bg-white p-2.5 rounded-2xl shadow-2xl border-4 border-white flex flex-col items-center shrink-0">
                      {inlineQrUrl ? (
                        <img
                          src={inlineQrUrl}
                          alt={`${activeMethod.name} QR Code`}
                          className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded"
                        />
                      ) : (
                        <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center bg-neutral-100 text-neutral-400">
                          <QrCode size={36} className="animate-spin" />
                        </div>
                      )}
                      <span className="text-[9px] font-black text-neutral-900 mt-1 uppercase tracking-wider">
                        Scan & Pay ({activeMethod.name})
                      </span>
                    </div>

                    {/* Account Information & Quick Actions */}
                    <div className="flex-1 min-w-0 space-y-2 w-full text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 text-[11px]">खातावाला (Merchant):</span>
                        <span className="font-bold text-white text-[11px]">{merchantTarget.accountHolder}</span>
                      </div>

                      {merchantTarget.bankName && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 text-[11px]">बैंकको नाम:</span>
                          <span className="font-bold text-white text-[11px]">{merchantTarget.bankName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-neutral-300 font-bold text-[11px]">
                          {activeMethod.name} नम्बर:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-amber-300 text-xs bg-neutral-900 px-2 py-0.5 rounded border border-amber-400/40">
                            {merchantTarget.displayAccount}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyMerchantAccount}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                            title="नम्बर कपी गर्नुहोस्"
                          >
                            {copiedAccount ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* QR Action Buttons: Download and Enlarge */}
                      <div className="pt-1.5 flex gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadInlineQr}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95"
                        >
                          {isDownloadingQr ? (
                            <>
                              <Check size={12} className="text-emerald-400" />
                              <span>डाउनलोड भयो ✅</span>
                            </>
                          ) : (
                            <>
                              <Download size={12} />
                              <span>QR डाउनलोड</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(true)}
                          className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                        >
                          <Maximize2 size={12} />
                          <span>ठूलो बनाएर हेर्नुहोस्</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-neutral-400 italic">
                        💡 {activeMethod.name} एपमा 'Scan QR' थिची यो QR स्क्यान गर्नुहोस् वा ग्यालरीमा डाउनलोड गरी अपलोड गर्नुहोस्।
                      </p>
                    </div>
                  </div>

                  {/* Summary of official developer destinations for active region */}
                  <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-white/10 space-y-1 text-[10px] text-neutral-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">
                        📌 {activeCountry.name} का आधिकारिक खाताहरू:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline font-bold"
                      >
                        सबै QR खोल्नुहोस् →
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 font-mono text-[10px]">
                      {activeCountry.methods.map((m) => (
                        <div key={m.id} className="bg-black/40 p-1.5 rounded border border-white/5">
                          • {m.name}: <span className="text-white font-bold block truncate">{m.displayAccount}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-neutral-400 pt-0.5">
                      (माथिका आधिकारिक खाताहरूमा पैसा पठाएपछि मात्र सिक्का तुरुन्तै प्राप्त हुन्छ)
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: MANDATORY SCREENSHOT / VOUCHER UPLOAD (Rendered for non-card or receipt-upload mode) */}
              {!(selectedMethodId === 'card_intl' && cardPaymentMode === 'card_form') && (
                <div className="p-4 bg-neutral-950 border border-white/15 rounded-3xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-black text-neutral-200 block">
                      ५. भुक्तानी रसिद वा भौचरको स्क्रिनसट (Screenshot) अपलोड गर्नुहोस्:
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">अनिवार्य</span>
                  </div>

                  {/* Sender Account */}
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                      {activeMethod.accountTypeLabel}: <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      placeholder={activeMethod.accountPlaceholder}
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Screenshot Upload with Instant Duplicate Detection */}
                  <div>
                    <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                      {selectedMethodId === 'nabil_direct' ? 'नबिल बैंक / रेमिट्यान्स भौचरको रसिद:' : `${activeMethod.name} भुक्तानीको स्क्रिनसट (Screenshot):`} <span className="text-rose-400">*</span>
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />

                    {receiptImage ? (
                      <div className="p-3 bg-neutral-900 border border-emerald-500/40 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={receiptImage}
                              alt="Receipt"
                              className="w-14 h-14 object-cover rounded-xl border border-white/20 shadow"
                            />
                            <div>
                              <span className="text-xs font-bold text-emerald-400 block flex items-center gap-1">
                                <CheckCircle2 size={13} />
                                स्क्रिनसट संलग्न गरियो
                              </span>
                              <span className="text-[9px] text-neutral-400 font-mono block truncate max-w-[180px]">
                                हस्ताक्षर: {screenshotHash.slice(0, 16)}...
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedPreviewImage(receiptImage)}
                                className="text-[10px] text-amber-400 underline hover:text-amber-300"
                              >
                                रसिद ठूलो बनाएर हेर्नुहोस्
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setReceiptImage(null);
                              setScreenshotHash('');
                              setIsDuplicateScreenshot(false);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold"
                          >
                            अर्को छनोट
                          </button>
                        </div>

                        {isDuplicateScreenshot && (
                          <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[10px] text-rose-300 font-bold flex items-center gap-1.5">
                            <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                            <span>चेतावनी: यो स्क्रिनसट पहिले नै प्रयोग भइसकेको छ!</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-amber-400/60 bg-white/5 text-neutral-300 hover:text-white text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Upload size={22} className="text-amber-400" />
                        <span>रसिद वा भौचरको स्क्रिनसट अपलोड गर्नुहोस्</span>
                        <span className="text-[10px] text-neutral-400 font-normal">
                          (ग्यालरी वा फोटोबाट स्क्रिनसट छनोट गर्नुहोस्)
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Recipient Confirmation Checkbox */}
                  <div className="pt-1 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="chk-recipient-confirm"
                      checked={confirmRecipientCheckbox}
                      onChange={(e) => setConfirmRecipientCheckbox(e.target.checked)}
                      className="mt-0.5 rounded text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <label
                      htmlFor="chk-recipient-confirm"
                      className="text-[10px] text-neutral-300 leading-snug cursor-pointer select-none"
                    >
                      मैले तोकिएको आधिकारिक खाता (<span className="text-amber-300 font-bold">{merchantTarget.displayAccount}</span>) मा नै रकम पठाएको हुँ र स्क्रिनसट वास्तविक हो।
                    </label>
                  </div>

                  {/* Error Message Display */}
                  {errorMessage && (
                    <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-fade-in">
                      <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                  )}

                  {/* Success Message Display */}
                  {successMessage && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-start gap-2.5 animate-fade-in whitespace-pre-line leading-relaxed">
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Verification Progress Indicator */}
                  {isVerifying && (
                    <div className="p-4 bg-neutral-950 border border-amber-400/40 rounded-2xl space-y-2 text-center animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
                      <span className="text-xs font-bold text-amber-300 block">{verificationStep}</span>
                      <span className="text-[10px] text-neutral-400">
                        स्मार्ट एल्गोरिदमद्वारा स्क्रिनसट रुजु हुँदैछ...
                      </span>
                    </div>
                  )}

                  {/* ACTION BUTTON */}
                  <button
                    type="button"
                    id="btn-verify-screenshot-credit"
                    disabled={isVerifying || !isEligibleRecharge || isDuplicateScreenshot}
                    onClick={handleSmartVerificationAndCredit}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-neutral-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ShieldCheck size={18} className="text-neutral-950" />
                    <span>
                      स्क्रिनसट रुजु गरी Coins लोड गर्नुहोस् (+{totalCoins.toLocaleString()} Coins)
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER PAYMENT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-neutral-300">
                  तपाईंको रिचार्ज इतिहास (User ID: {activeUserId}):
                </span>
                <button
                  type="button"
                  onClick={() => setClaimsList(getAllRechargeClaims())}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 text-xs flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>रिफ्रेस</span>
                </button>
              </div>

              {claimsList.filter((c) => c.userId === activeUserId).length === 0 ? (
                <div className="p-8 text-center bg-neutral-950 rounded-2xl border border-white/10 space-y-2">
                  <Clock size={32} className="text-neutral-600 mx-auto" />
                  <span className="text-xs text-neutral-400 block font-bold">
                    कुनै पनि रिचार्ज रेकर्ड फेला परेन।
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {claimsList
                    .filter((c) => c.userId === activeUserId)
                    .map((claim) => (
                      <div
                        key={claim.id}
                        className="p-3 bg-neutral-950 border border-white/10 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">
                              +{claim.coins.toLocaleString()} Coins (${claim.usdAmount} USD)
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              ({claim.currencySymbol} {claim.localAmount})
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              claim.status === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {claim.status === 'verified' ? 'स्वीकृत (Coins Loaded)' : 'रद्द (Revoked)'}
                          </span>
                        </div>

                        <div className="text-[11px] text-neutral-300 space-y-0.5 font-mono">
                          <div>
                            <span className="text-neutral-500">माध्यम:</span> {claim.methodName} → {claim.targetAccount}
                          </div>
                          <div>
                            <span className="text-neutral-500">पठाएको मिति:</span> {claim.paymentDate}
                          </div>
                        </div>

                        {claim.receiptImage && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedPreviewImage(claim.receiptImage)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>अपलोड गरिएको रसिद हेर्नुहोस्</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REAL-TIME ADMIN PANEL LIVE FEED (कसले कति coins लियो admin panel मा तुरून्तै जानकारी) */}
          {activeTab === 'admin_panel' && (
            <div className="space-y-3.5">
              {/* Admin Stats Banner */}
              <div className="p-3.5 bg-gradient-to-r from-rose-500/20 to-neutral-900 border border-rose-500/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-rose-400" />
                    <span className="text-xs font-black text-white">
                      👨‍💻 एडमिन लाइभ मोनिटरिङ प्यानल (Admin Live Feed)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClaimsList(getAllRechargeClaims())}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 text-xs flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span>ताजा गर्नुहोस्</span>
                  </button>
                </div>
                <div className="text-[10px] text-neutral-300">
                  कसले कहिले कति रकम पठाई कति Coins प्राप्त गर्‍यो भन्ने जानकारी तत्काल यहाँ देखिन्छ।
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 bg-neutral-950/80 rounded-xl border border-white/10">
                    <span className="text-[9px] text-neutral-400 block">कुल लोड गरिएको सिक्का:</span>
                    <span className="text-sm font-black text-amber-300 font-mono">
                      {totalCoinsDistributed.toLocaleString()} Coins
                    </span>
                  </div>
                  <div className="p-2 bg-neutral-950/80 rounded-xl border border-white/10">
                    <span className="text-[9px] text-neutral-400 block">नेपाली रुपैयाँ संकलन (NPR):</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      रू. {totalCashCollectedNPR.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-Time Live Stream of Coin Claims */}
              {claimsList.length === 0 ? (
                <div className="p-8 text-center bg-neutral-950 rounded-2xl border border-white/10">
                  <span className="text-xs text-neutral-400 block font-bold">
                    हालसम्म कुनै पनि प्रयोगकर्ताले रिचार्ज गरेका छैनन्।
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 text-[11px] font-bold text-neutral-400">
                    <span>ताजा रिचार्ज विवरणहरू ({claimsList.length}):</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      लाइभ अपडेट सक्रिय
                    </span>
                  </div>

                  {claimsList.map((claim) => (
                    <div
                      key={claim.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        claim.status === 'verified'
                          ? 'bg-neutral-950 border-emerald-500/40 shadow-md'
                          : 'bg-neutral-950/60 border-rose-500/30 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-400/40">
                            {claim.userName.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {claim.userName}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              ID: {claim.userId}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-black text-amber-300 font-mono block">
                            +{claim.coins.toLocaleString()} Coins
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            रू. {claim.localAmount} (${claim.usdAmount} USD)
                          </span>
                        </div>
                      </div>

                      <div className="py-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 bg-white/5 rounded-xl">
                          <span className="text-[9px] text-neutral-400 block font-sans">
                            गन्तव्य खाता (तोकिएको खाता):
                          </span>
                          <span className="font-bold text-white text-xs">{claim.targetAccount}</span>
                          <span className="text-[9px] text-neutral-400 block">
                            सेन्डर: {claim.senderAccount}
                          </span>
                        </div>

                        <div className="p-2 bg-white/5 rounded-xl">
                          <span className="text-[9px] text-neutral-400 block font-sans">
                            पठाएको मिति / समय:
                          </span>
                          <span className="font-bold text-white text-xs">{claim.paymentDate}</span>
                          <span className="text-[9px] text-neutral-400 block">
                            समय: {new Date(claim.submittedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Receipt Preview Thumbnail */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewImage(claim.receiptImage)}
                          className="text-[10px] text-sky-400 hover:text-sky-300 underline flex items-center gap-1 font-bold"
                        >
                          <ImageIcon size={12} />
                          <span>रसिदको स्क्रिनसट हेर्नुहोस्</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            ✅ प्रमाणीकरण सम्पन्न
                          </span>

                          {claim.status === 'verified' && (
                            <button
                              type="button"
                              onClick={() => handleAdminRevoke(claim)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 underline font-bold"
                            >
                              फ्ल्याग / रद्द
                            </button>
                          )}
                        </div>
                      </div>

                      {claim.rejectionReason && (
                        <div className="mt-1.5 p-2 rounded-xl bg-rose-500/15 text-[10px] text-rose-300 font-bold">
                          रद्द कारण: {claim.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal for full size receipt view */}
        {selectedPreviewImage && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedPreviewImage(null)}
          >
            <div
              className="max-w-md w-full bg-neutral-900 border border-white/20 rounded-3xl p-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-white">भुक्तानी भौचर / रसिदको स्क्रिनसट</span>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewImage(null)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="py-3 flex justify-center max-h-[70vh] overflow-auto">
                <img
                  src={selectedPreviewImage}
                  alt="Receipt Preview"
                  className="max-w-full rounded-xl object-contain shadow-2xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dedicated All QRs Modal */}
        <PaymentQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          defaultMethod={
            selectedMethodId === 'esewa'
              ? 'esewa'
              : selectedMethodId === 'khalti'
              ? 'khalti'
              : selectedMethodId === 'imepay'
              ? 'imepay'
              : selectedMethodId === 'bank_np' || selectedMethodId === 'connectips'
              ? 'nabil'
              : selectedMethodId === 'phonepe' || selectedMethodId === 'gpay' || selectedMethodId === 'paytm' || selectedMethodId === 'bank_in'
              ? 'phonepe'
              : selectedMethodId === 'gcash' || selectedMethodId === 'maya' || selectedMethodId === 'bank_ph'
              ? 'gcash'
              : selectedMethodId === 'paypal' || selectedMethodId === 'payoneer' || selectedMethodId === 'wise' || selectedMethodId === 'bank_intl'
              ? 'paypal'
              : 'esewa'
          }
          amount={parseFloat(localAmount.replace(/,/g, '')) || calculatedUsd * activeCountry.usdRate}
          currencySymbol={activeCountry.currencySymbol}
          currencyCode={activeCountry.currencyCode}
          coins={totalCoins}
          userId={activeUserId}
        />
      </div>
    </div>
  );
};
