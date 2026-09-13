import { RechargeClaim } from '../types';

const CLAIMED_SCREENSHOT_HASHES_KEY = 'tiktop_claimed_screenshot_hashes';
const RECHARGE_CLAIMS_KEY = 'tiktop_recharge_claims_log';

/**
 * Generates a robust deterministic hash / fingerprint from a base64 image data string.
 * This ensures that duplicate screenshots (or renamed duplicate files) are caught.
 */
export function generateScreenshotHash(dataUri: string): string {
  if (!dataUri) return '';
  let hash = 0;
  const step = Math.max(1, Math.floor(dataUri.length / 500));
  for (let i = 0; i < dataUri.length; i += step) {
    const char = dataUri.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Combine with length and segment samples for high uniqueness
  const head = dataUri.slice(50, 80);
  const tail = dataUri.slice(-40);
  let extraHash = 0;
  for (let i = 0; i < head.length; i++) {
    extraHash = (extraHash << 3) ^ head.charCodeAt(i);
  }
  for (let i = 0; i < tail.length; i++) {
    extraHash = (extraHash << 3) ^ tail.charCodeAt(i);
  }
  return `HASH-${Math.abs(hash).toString(16)}-${Math.abs(extraHash).toString(16)}-LEN${dataUri.length}`;
}

/**
 * Retrieves all screenshot hashes that have already been used to claim coins.
 */
export function getClaimedScreenshotHashes(): Record<string, { claimId: string; date: string; coins: number }> {
  try {
    const raw = localStorage.getItem(CLAIMED_SCREENSHOT_HASHES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Checks if a screenshot hash has already been used to claim coins.
 */
export function isScreenshotHashUsed(hash: string): boolean {
  if (!hash) return false;
  const claimed = getClaimedScreenshotHashes();
  return Boolean(claimed[hash]);
}

/**
 * Records a screenshot hash permanently in the anti-fraud database.
 */
export function recordUsedScreenshotHash(hash: string, claimId: string, coins: number): void {
  if (!hash) return;
  const claimed = getClaimedScreenshotHashes();
  claimed[hash] = {
    claimId,
    date: new Date().toISOString(),
    coins,
  };
  try {
    localStorage.setItem(CLAIMED_SCREENSHOT_HASHES_KEY, JSON.stringify(claimed));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieves all recharge claims from persistent storage.
 */
export function getAllRechargeClaims(): RechargeClaim[] {
  try {
    const raw = localStorage.getItem(RECHARGE_CLAIMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new recharge claim to persistent storage.
 */
export function saveRechargeClaim(claim: RechargeClaim): void {
  const existing = getAllRechargeClaims();
  const updated = [claim, ...existing.filter((c) => c.id !== claim.id)];
  try {
    localStorage.setItem(RECHARGE_CLAIMS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Admin action: approve, revoke or reject a claim
 */
export function updateRechargeClaimStatus(
  claimId: string,
  status: 'verified' | 'pending' | 'rejected',
  rejectionReason?: string
): RechargeClaim | null {
  const claims = getAllRechargeClaims();
  const index = claims.findIndex((c) => c.id === claimId);
  if (index === -1) return null;

  claims[index].status = status;
  claims[index].verifiedAt = new Date().toISOString();
  if (rejectionReason) {
    claims[index].rejectionReason = rejectionReason;
  }

  try {
    localStorage.setItem(RECHARGE_CLAIMS_KEY, JSON.stringify(claims));
  } catch {
    // Ignore storage errors
  }

  return claims[index];
}

/**
 * Delete a single recharge claim by ID
 */
export function deleteRechargeClaim(claimId: string): boolean {
  const claims = getAllRechargeClaims();
  const filtered = claims.filter((c) => c.id !== claimId);
  if (filtered.length === claims.length) return false;
  try {
    localStorage.setItem(RECHARGE_CLAIMS_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear completed/rejected recharge claims history or all claims
 */
export function clearRechargeClaimsHistory(mode: 'completed_rejected' | 'all' = 'completed_rejected'): number {
  const claims = getAllRechargeClaims();
  let remaining: RechargeClaim[] = [];
  if (mode === 'completed_rejected') {
    // keep only pending
    remaining = claims.filter((c) => c.status === 'pending');
  } else {
    remaining = [];
  }
  const deletedCount = claims.length - remaining.length;
  try {
    localStorage.setItem(RECHARGE_CLAIMS_KEY, JSON.stringify(remaining));
  } catch {
    // Ignore
  }
  return deletedCount;
}

/**
 * Admin WhatsApp Alert Integration
 * Default: Owner WhatsApp (+977 989863991384)
 */
export const DEFAULT_ADMIN_WHATSAPP_PHONE = '+977989863991384';
const ADMIN_WHATSAPP_KEY = 'tiktop_admin_whatsapp_number';

export function getAdminWhatsAppPhone(): string {
  try {
    const saved = localStorage.getItem(ADMIN_WHATSAPP_KEY);
    if (saved && saved.trim().length >= 8) {
      // If still set to the old placeholder, update to new number
      if (saved.includes('9863991384') && !saved.includes('989863991384')) {
        localStorage.setItem(ADMIN_WHATSAPP_KEY, DEFAULT_ADMIN_WHATSAPP_PHONE);
        return DEFAULT_ADMIN_WHATSAPP_PHONE;
      }
      return saved.trim();
    }
  } catch {
    // Ignore
  }
  return DEFAULT_ADMIN_WHATSAPP_PHONE;
}

export function setAdminWhatsAppPhone(phone: string): void {
  try {
    localStorage.setItem(ADMIN_WHATSAPP_KEY, phone.trim());
  } catch {
    // Ignore
  }
}

/**
 * Builds formatted WhatsApp message & click-to-chat URL
 * When user applies for recharge, admin immediately receives SMS on WhatsApp
 */
export function buildRechargeWhatsAppUrl(claim: RechargeClaim, customPhone?: string): string {
  const rawPhone = customPhone || getAdminWhatsAppPhone();
  // Strip non-digits for wa.me URL
  let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) cleanPhone = '977989863991384';

  const lines = [
    `🔔 *नयाँ TIKTOP सिक्का रिचार्ज अनुरोध (New Recharge Request)*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *प्रयोगकर्ता (User):* ${claim.userName}`,
    `🆔 *TikTop ID:* ${claim.userId}`,
    `🪙 *रिचार्ज सिक्का:* +${claim.coins.toLocaleString()} Coins`,
    `💵 *जम्मा रकम:* ${claim.currencySymbol} ${claim.localAmount.toLocaleString()} ($${claim.usdAmount.toFixed(2)} USD)`,
    `💳 *भुक्तानी माध्यम:* ${claim.methodName}`,
    `📱 *पठाउनेको खाता/नम्बर:* ${claim.senderAccount || 'उल्लेख छैन'}`,
    `🏢 *गन्तव्य खाता:* ${claim.targetAccount}`,
    `🔖 *अर्डर Ref ID:* ${claim.id}`,
    `📅 *मिति:* ${claim.paymentDate || new Date().toISOString().split('T')[0]}`,
    `⏳ *स्थिति:* विचाराधीन (Pending Your Approval)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👉 *एडमिन निर्देशन:* कृपया भुक्तानी रसिद जाँच गरी TikTop Admin Panel मा Approve गरेपछि मात्र प्रयोगकर्ताको खातामा सिक्का जम्मा हुनेछ।`,
  ];

  const fullText = lines.join('\n');
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullText)}`;
}

/**
 * Builds formatted WhatsApp message & click-to-chat URL for Withdrawal
 * When user applies for points/USD withdrawal, admin immediately receives SMS on WhatsApp (+977 989863991384)
 */
export function buildWithdrawWhatsAppUrl(
  record: {
    id: string;
    accountName: string;
    points: number;
    amountFormatted: string;
    grossUSD: number;
    taxUSD?: number;
    netUSD: number;
    paymentMethod: string;
    accountNumber: string;
    country: string;
    timestamp: string;
    bankName?: string;
  },
  customPhone?: string
): string {
  const rawPhone = customPhone || getAdminWhatsAppPhone();
  let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) cleanPhone = '977989863991384';

  const lines = [
    `🔔 *नयाँ TIKTOP Points निकासी अनुरोध (New Withdrawal Request)*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *खातावालाको नाम:* ${record.accountName}`,
    `🪙 *निकासी Points:* ${record.points.toLocaleString()} Pts`,
    `💵 *खुद भुक्तानी रकम (Net Payout):* ${record.amountFormatted}`,
    `💰 *कुल रकम (Gross):* $${record.grossUSD.toFixed(2)} USD`,
    record.taxUSD ? `📉 *प्लेटफर्म शुल्क/कर (8%):* -$${record.taxUSD.toFixed(2)} USD` : '',
    `💳 *भुक्तानी माध्यम:* ${record.paymentMethod}`,
    `📱 *खाता / वालेट नम्बर:* ${record.accountNumber}`,
    record.bankName ? `🏦 *बैंकको नाम:* ${record.bankName}` : '',
    `🌍 *देश (Country):* ${record.country}`,
    `🔖 *निकासी Ref ID:* ${record.id}`,
    `📅 *मिति / समय:* ${record.timestamp}`,
    `⏳ *स्थिति:* प्रक्रियामा (Up to 24 Hours Processing)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👉 *एडमिन निर्देशन:* कृपया २४ घण्टाभित्र माथि उल्लेखित खातामा रकम ट्रान्सफर गरी निकासी सम्पन्न गर्नुहोस्।`,
  ].filter(Boolean);

  const fullText = lines.join('\n');
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullText)}`;
}

/**
 * Official Developer Payment Receiving Accounts
 * USER MANDATE:
 * - eSewa: +977 9863991384
 * - Khalti: +977 9810465055
 * - Nabil Bank: 04110017507343
 */
export interface MerchantPaymentTarget {
  channel: string;
  name: string;
  accountNumber: string;
  displayAccount: string;
  accountHolder: string;
  bankName?: string;
  branch?: string;
  remarksNote: string;
}

export const OFFICIAL_DEVELOPER_MERCHANTS: Record<string, MerchantPaymentTarget> = {
  esewa: {
    channel: 'eSewa',
    name: 'eSewa Official Wallet',
    accountNumber: '9863991384',
    displayAccount: '+977 9863991384',
    accountHolder: 'Shambu Lamsal',
    remarksNote: 'रिमार्क्समा आफ्नो TikTop ID अनिवार्य लेख्नुहोस्',
  },
  khalti: {
    channel: 'Khalti',
    name: 'Khalti Official Wallet',
    accountNumber: '9810465055',
    displayAccount: '+977 9810465055',
    accountHolder: 'Shambu Lamsal',
    remarksNote: 'रिमार्क्समा आफ्नो TikTop ID अनिवार्य लेख्नुहोस्',
  },
  bank_np: {
    channel: 'Nabil Bank',
    name: 'Nabil Bank Ltd. (ConnectIPS)',
    bankName: 'Nabil Bank Ltd.',
    accountNumber: '04110017507343',
    displayAccount: '04110017507343',
    accountHolder: 'Shambu Lamsal',
    branch: 'Tumlingtar Branch',
    remarksNote: 'बैंक भौचर वा ट्रान्सफरमा TikTop ID लेख्नुहोस्',
  },
  connectips: {
    channel: 'Nabil Bank',
    name: 'Nabil Bank Ltd.',
    bankName: 'Nabil Bank Ltd.',
    accountNumber: '04110017507343',
    displayAccount: '04110017507343',
    accountHolder: 'Shambu Lamsal',
    branch: 'Tumlingtar Branch',
    remarksNote: 'बैंक भौचर वा ट्रान्सफरमा TikTop ID लेख्नुहोस्',
  },
  imepay: {
    channel: 'IME Pay',
    name: 'IME Pay Official',
    accountNumber: '9810465055',
    displayAccount: '+977 9810465055',
    accountHolder: 'Shambu Lamsal',
    remarksNote: 'रिमार्क्समा TikTop ID लेख्नुहोस्',
  },
  card_np: {
    channel: 'Debit / Credit Card',
    name: 'Nabil Bank Gateway',
    bankName: 'Nabil Bank Ltd.',
    accountNumber: '04110017507343',
    displayAccount: '04110017507343',
    accountHolder: 'Shambu Lamsal',
    remarksNote: 'Nabil Bank Card Transfer',
  },
  card_intl: {
    channel: 'Debit / Credit Card',
    name: 'International Card (Visa / MasterCard / AMEX)',
    bankName: 'Nabil Bank International Card Gateway',
    accountNumber: '04110017507343',
    displayAccount: 'Visa / MasterCard / Amex (Nabil Bank Settlement: 04110017507343)',
    accountHolder: 'Shambu Lamsal',
    branch: 'Tumlingtar Branch',
    remarksNote: 'अन्तर्राष्ट्रिय कार्डबाट सुरक्षित भुक्तानी (256-Bit SSL)',
  },
  nabil_direct: {
    channel: 'Nabil Bank Remit',
    name: 'मेरो नविल बैंक (Nabil Bank Direct / SWIFT)',
    bankName: 'Nabil Bank Limited (नबिल बैंक लि., नेपाल)',
    accountNumber: '04110017507343',
    displayAccount: '04110017507343 (SWIFT: NABILNPKA)',
    accountHolder: 'Shambu Lamsal',
    branch: 'Tumlingtar Branch, Nepal',
    remarksNote: 'विदेशबाट सिधै नबिल बैंक खातामा रेमिट्यान्स वा स्वीफ्ट (SWIFT) पठाउनुहोस्',
  },
  phonepe: {
    channel: 'PhonePe',
    name: 'PhonePe UPI India',
    accountNumber: '9863991384@ybl',
    displayAccount: '9863991384@ybl',
    accountHolder: 'TikTop Media Official',
    remarksNote: 'Add TikTop ID in UPI remarks',
  },
  gpay: {
    channel: 'Google Pay',
    name: 'Google Pay UPI',
    accountNumber: '9863991384@okaxis',
    displayAccount: '9863991384@okaxis',
    accountHolder: 'TikTop Media Official',
    remarksNote: 'Add TikTop ID in UPI message',
  },
  paytm: {
    channel: 'Paytm',
    name: 'Paytm Wallet & UPI',
    accountNumber: '9863991384@paytm',
    displayAccount: '9863991384@paytm',
    accountHolder: 'TikTop Media Official',
    remarksNote: 'Add TikTop ID in note',
  },
  bank_in: {
    channel: 'India Bank Transfer',
    name: 'State Bank of India (IMPS/NEFT)',
    bankName: 'State Bank of India',
    accountNumber: '9863991384',
    displayAccount: '9863991384 (IFSC: SBIN0004567)',
    accountHolder: 'TikTop Media Official',
    branch: 'New Delhi Special Branch',
    remarksNote: 'Add TikTop ID in transfer remarks',
  },
  paypal: {
    channel: 'PayPal',
    name: 'PayPal Global',
    accountNumber: 'tiktopnepalpay@gmail.com',
    displayAccount: 'tiktopnepalpay@gmail.com',
    accountHolder: 'TikTop Media Global',
    remarksNote: 'Add TikTop ID in PayPal note',
  },
  payoneer: {
    channel: 'Payoneer',
    name: 'Payoneer USD Account',
    accountNumber: 'tiktopnepalpay@gmail.com',
    displayAccount: 'tiktopnepalpay@gmail.com',
    accountHolder: 'TikTop Media Global LLC',
    remarksNote: 'Add TikTop ID in payment note',
  },
  wise: {
    channel: 'Wise',
    name: 'Wise USD Multi-Currency',
    accountNumber: 'tiktopnepalpay@gmail.com',
    displayAccount: 'tiktopnepalpay@gmail.com',
    accountHolder: 'TikTop Media Global LLC',
    remarksNote: 'Add TikTop ID in reference',
  },
  bank_intl: {
    channel: 'International Wire',
    name: 'SWIFT / Wire Transfer',
    bankName: 'Nabil Bank Ltd. (SWIFT: NABILNPKA)',
    accountNumber: '04110017507343',
    displayAccount: '04110017507343 (SWIFT: NABILNPKA)',
    accountHolder: 'Shambu Lamsal',
    branch: 'Tumlingtar Branch',
    remarksNote: 'Include TikTop ID in sender message / reference',
  },
  gcash: {
    channel: 'GCash',
    name: 'GCash Philippines',
    accountNumber: '+63 9863991384',
    displayAccount: '+63 9863991384',
    accountHolder: 'TikTop Philippines Official',
    remarksNote: 'Add TikTop ID in GCash message',
  },
  maya: {
    channel: 'Maya (PayMaya)',
    name: 'Maya Philippines',
    accountNumber: '+63 9863991384',
    displayAccount: '+63 9863991384',
    accountHolder: 'TikTop Philippines Official',
    remarksNote: 'Add TikTop ID in Maya remarks',
  },
  bank_ph: {
    channel: 'Philippines Bank',
    name: 'BDO / BPI InstaPay Transfer',
    bankName: 'BDO Unibank (InstaPay)',
    accountNumber: '04110017507343',
    displayAccount: '04110017507343',
    accountHolder: 'TikTop Media PH',
    branch: 'Manila Branch',
    remarksNote: 'Add TikTop ID in reference',
  },
};
