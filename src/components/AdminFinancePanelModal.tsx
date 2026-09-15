import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Coins,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Check,
  AlertTriangle,
  FileText,
  DollarSign,
  UserCheck,
  Settings,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  Trash2,
  ZoomIn,
  ZoomOut,
  Download,
  MapPin,
  Landmark,
  ImageIcon,
} from 'lucide-react';
import { RechargeClaim, UserProfile, AuthUser } from '../types';
import {
  getAllWithdrawalRequests,
  AdminWithdrawalRequest,
  adminProcessWithdrawal,
  deleteWithdrawalRequest,
  clearWithdrawalRequestsHistory,
  ensureInitialRechargeClaims,
  getAllUserBalances,
  UserBalanceRecord,
  adminAdjustUserBalance,
  verifyAdminPin,
  isAdminSessionActive,
  endAdminSession,
  creditCoinsToUserBalance,
} from '../utils/adminFinanceDb';
import {
  getAllRechargeClaims,
  updateRechargeClaimStatus,
  deleteRechargeClaim,
  clearRechargeClaimsHistory,
  getAdminWhatsAppPhone,
  setAdminWhatsAppPhone,
} from '../utils/rechargeVerificationDb';
import { saveInboxNotice } from '../utils/inboxNotices';

interface AdminFinancePanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile?: UserProfile;
  currentUserCoins: number;
  currentUserPoints: number;
  onUpdateCurrentUserCoins?: (coins: number) => void;
  onUpdateCurrentUserPoints?: (points: number) => void;
}

export const AdminFinancePanelModal: React.FC<AdminFinancePanelModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  currentUserCoins,
  currentUserPoints,
  onUpdateCurrentUserCoins,
  onUpdateCurrentUserPoints,
}) => {
  // Security lock state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPinPassword, setShowPinPassword] = useState<boolean>(false);

  // Active view tab in admin panel
  const [adminTab, setAdminTab] = useState<'recharge' | 'withdrawal' | 'balances' | 'settings'>('recharge');

  // Data states
  const [rechargeClaims, setRechargeClaims] = useState<RechargeClaim[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<AdminWithdrawalRequest[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalanceRecord[]>([]);

  // Filter states
  const [rechargeFilter, setRechargeFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Receipt Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [receiptZoomLevel, setReceiptZoomLevel] = useState<number>(1);

  // User Balance Adjust Modal
  const [adjustTargetUser, setAdjustTargetUser] = useState<UserBalanceRecord | null>(null);
  const [adjustType, setAdjustType] = useState<'coins' | 'points'>('coins');
  const [adjustAmount, setAdjustAmount] = useState<number>(500);
  const [adjustAction, setAdjustAction] = useState<'add' | 'deduct'>('add');

  // Admin WhatsApp setting
  const [adminPhone, setAdminPhone] = useState<string>(getAdminWhatsAppPhone());
  const [isPhoneSaved, setIsPhoneSaved] = useState<boolean>(false);

  // Status feedback toast
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Action confirmation / prompt modal state (Replaces blocking window.confirm & window.prompt)
  const [confirmAction, setConfirmAction] = useState<{
    type:
      | 'approve_recharge'
      | 'reject_recharge'
      | 'delete_recharge'
      | 'clear_recharge_history'
      | 'approve_withdrawal'
      | 'reject_withdrawal'
      | 'delete_withdrawal'
      | 'clear_withdrawal_history';
    claim?: RechargeClaim;
    withdrawal?: AdminWithdrawalRequest;
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Sync authentication and load data on open
  useEffect(() => {
    if (isOpen) {
      if (isAdminSessionActive()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setPinInput('');
        setPinError('');
      }
      refreshAllData();
    }
  }, [isOpen]);

  const refreshAllData = () => {
    const claims = ensureInitialRechargeClaims();
    setRechargeClaims([...claims]);

    const withdrawals = getAllWithdrawalRequests();
    setWithdrawalRequests([...withdrawals]);

    const balances = getAllUserBalances(
      currentUserProfile,
      currentUserCoins,
      currentUserPoints
    );
    setUserBalances([...balances]);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pinInput)) {
      setIsAuthenticated(true);
      setPinError('');
      setPinInput('');
      refreshAllData();
      showToast('प्रमाणीकरण सफल! एडमिन प्यानलमा स्वागत छ।');
    } else {
      setPinError('अमान्य एडमिन पिन कोड! कृपया सही पिन प्रविष्ट गर्नुहोस्।');
    }
  };

  const handleLockOut = () => {
    endAdminSession();
    setIsAuthenticated(false);
    setPinInput('');
  };

  // --- ACTION MODAL OPENERS ---
  const handleOpenApproveRecharge = (claim: RechargeClaim) => {
    setConfirmAction({ type: 'approve_recharge', claim });
  };

  const handleOpenRejectRecharge = (claim: RechargeClaim) => {
    setActionReason('खातामा रकम प्राप्त भएन / अमान्य रसिद');
    setConfirmAction({ type: 'reject_recharge', claim });
  };

  const handleOpenDeleteRecharge = (claim: RechargeClaim) => {
    setConfirmAction({ type: 'delete_recharge', claim });
  };

  const handleOpenClearRechargeHistory = () => {
    setConfirmAction({ type: 'clear_recharge_history' });
  };

  const handleOpenApproveWithdrawal = (request: AdminWithdrawalRequest) => {
    setConfirmAction({ type: 'approve_withdrawal', withdrawal: request });
  };

  const handleOpenRejectWithdrawal = (request: AdminWithdrawalRequest) => {
    setActionReason('गलत खाता नम्बर वा नाम नमिलेको');
    setConfirmAction({ type: 'reject_withdrawal', withdrawal: request });
  };

  const handleOpenDeleteWithdrawal = (request: AdminWithdrawalRequest) => {
    setConfirmAction({ type: 'delete_withdrawal', withdrawal: request });
  };

  const handleOpenClearWithdrawalHistory = () => {
    setConfirmAction({ type: 'clear_withdrawal_history' });
  };

  // --- EXECUTE CONFIRMED ACTION ---
  const handleExecuteAction = () => {
    if (!confirmAction) return;
    setIsSubmittingAction(true);

    try {
      if (confirmAction.type === 'approve_recharge' && confirmAction.claim) {
        const claim = confirmAction.claim;
        updateRechargeClaimStatus(claim.id, 'verified');
        creditCoinsToUserBalance(claim.userId, claim.coins);

        const currentActiveId = currentUserProfile?.userId || 'USR-35400';
        if (claim.userId === currentActiveId || claim.userId === 'USR-35400') {
          const nextCoins = currentUserCoins + claim.coins;
          localStorage.setItem('tiktop_coins', nextCoins.toString());
          if (onUpdateCurrentUserCoins) {
            onUpdateCurrentUserCoins(nextCoins);
          }
        }

        saveInboxNotice({
          type: 'recharge',
          title: 'Recharge Approved',
          nepaliTitle: '🎉 रिचार्ज स्वीकृत भयो!',
          message: `Your recharge of ${claim.currencySymbol} ${claim.localAmount} for +${claim.coins.toLocaleString()} Coins has been APPROVED by Admin.`,
          nepaliMessage: `तपाईंको रू ${claim.localAmount} को रिचार्ज अनुरोध एडमिनद्वारा स्वीकृत भयो! +${claim.coins.toLocaleString()} Coins खातामा थपियो।`,
          severity: 'info',
        });

        refreshAllData();
        showToast(`✅ ${claim.userName} को +${claim.coins.toLocaleString()} Coins रिचार्ज स्वीकृत गरियो!`, 'success');
      } else if (confirmAction.type === 'reject_recharge' && confirmAction.claim) {
        const claim = confirmAction.claim;
        const reason = actionReason.trim() || 'खातामा रकम प्राप्त भएन / अमान्य रसिद';
        updateRechargeClaimStatus(claim.id, 'rejected', reason);

        saveInboxNotice({
          type: 'recharge',
          title: 'Recharge Rejected',
          nepaliTitle: '❌ रिचार्ज अस्वीकृत भयो',
          message: `Your recharge request (${claim.id}) was rejected by Admin. Reason: ${reason}`,
          nepaliMessage: `तपाईंको रिचार्ज अनुरोध (${claim.id}) एडमिनद्वारा अस्वीकृत गरियो। कारण: ${reason}`,
          severity: 'warning',
        });

        refreshAllData();
        showToast(`❌ ${claim.userName} को रिचार्ज अस्वीकृत गरियो`, 'error');
      } else if (confirmAction.type === 'delete_recharge' && confirmAction.claim) {
        const claim = confirmAction.claim;
        deleteRechargeClaim(claim.id);
        refreshAllData();
        showToast(`🗑️ ${claim.userName} को रिचार्ज रेकर्ड (${claim.id}) हटाइयो।`, 'success');
      } else if (confirmAction.type === 'clear_recharge_history') {
        const count = clearRechargeClaimsHistory('completed_rejected');
        refreshAllData();
        showToast(`🗑️ कुल ${count} वटा सम्पन्न तथा अस्वीकृत रिचार्ज इतिहास हटाइयो।`, 'success');
      } else if (confirmAction.type === 'approve_withdrawal' && confirmAction.withdrawal) {
        const request = confirmAction.withdrawal;
        adminProcessWithdrawal(request.id, 'completed');
        refreshAllData();
        showToast(`✅ ${request.userName} को निकासी भुक्तानी (${request.amountFormatted}) सम्पन्न भयो!`, 'success');
      } else if (confirmAction.type === 'reject_withdrawal' && confirmAction.withdrawal) {
        const request = confirmAction.withdrawal;
        const reason = actionReason.trim() || 'गलत खाता नम्बर वा नाम नमिलेको';
        adminProcessWithdrawal(
          request.id,
          'rejected',
          reason,
          (refundedPoints) => {
            const currentActiveId = currentUserProfile?.userId || 'USR-35400';
            if (request.userId === currentActiveId) {
              const nextPoints = currentUserPoints + refundedPoints;
              localStorage.setItem('tiktop_points', nextPoints.toString());
              if (onUpdateCurrentUserPoints) {
                onUpdateCurrentUserPoints(nextPoints);
              }
            }
          }
        );
        refreshAllData();
        showToast(`❌ निकासी अस्वीकृत गरियो। ${request.points.toLocaleString()} Points फिर्ता भयो।`, 'error');
      } else if (confirmAction.type === 'delete_withdrawal' && confirmAction.withdrawal) {
        const request = confirmAction.withdrawal;
        deleteWithdrawalRequest(request.id);
        refreshAllData();
        showToast(`🗑️ निकासी रेकर्ड (${request.id}) सफलतापूर्वक हटाइयो।`, 'success');
      } else if (confirmAction.type === 'clear_withdrawal_history') {
        const count = clearWithdrawalRequestsHistory('completed_rejected');
        refreshAllData();
        showToast(`🗑️ कुल ${count} वटा सम्पन्न तथा अस्वीकृत निकासी इतिहास हटाइयो।`, 'success');
      }
    } finally {
      setIsSubmittingAction(false);
      setConfirmAction(null);
      setActionReason('');
    }
  };

  // --- USER BALANCE MANUAL ADJUSTMENT ---
  const handleSaveBalanceAdjustment = () => {
    if (!adjustTargetUser || adjustAmount <= 0) return;

    const delta = adjustAction === 'add' ? adjustAmount : -adjustAmount;
    const isCurrentActive =
      adjustTargetUser.userId === (currentUserProfile?.userId || 'USR-35400');

    adminAdjustUserBalance(
      adjustTargetUser.userId,
      adjustType,
      delta,
      isCurrentActive,
      onUpdateCurrentUserCoins,
      onUpdateCurrentUserPoints
    );

    saveInboxNotice({
      type: 'recharge',
      title: 'Admin Balance Adjustment',
      nepaliTitle: 'एडमिनद्वारा मौज्दात समायोजन',
      message: `Admin ${adjustAction === 'add' ? 'added' : 'deducted'} ${adjustAmount.toLocaleString()} ${adjustType} to your balance.`,
      nepaliMessage: `एडमिनले तपाईंको खातामा ${adjustAmount.toLocaleString()} ${adjustType === 'coins' ? 'Coins' : 'Points'} ${adjustAction === 'add' ? 'थप्नुभयो' : 'घटाउनुभयो'}।`,
      severity: 'info',
    });

    setAdjustTargetUser(null);
    refreshAllData();
    showToast(`✅ ${adjustTargetUser.userName} को मौज्दात समायोजन सम्पन्न भयो!`);
  };

  // --- SAVE ADMIN PHONE ---
  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminWhatsAppPhone(adminPhone);
    setIsPhoneSaved(true);
    setTimeout(() => setIsPhoneSaved(false), 3000);
    showToast('एडमिन WhatsApp नम्बर सफलतापूर्वक अपडेट भयो!');
  };

  if (!isOpen) return null;

  // Filtered lists
  const pendingRechargesCount = rechargeClaims.filter((c) => c.status === 'pending').length;
  const pendingWithdrawalsCount = withdrawalRequests.filter((w) => w.status === 'pending').length;

  const filteredRecharges = rechargeClaims.filter((c) => {
    if (rechargeFilter !== 'all' && c.status !== rechargeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.userName.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q) ||
        c.senderAccount.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredWithdrawals = withdrawalRequests.filter((w) => {
    if (withdrawFilter !== 'all' && w.status !== withdrawFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        w.userName.toLowerCase().includes(q) ||
        w.userId.toLowerCase().includes(q) ||
        w.accountNumber.toLowerCase().includes(q) ||
        w.accountName.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredBalances = userBalances.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.userName.toLowerCase().includes(q) ||
        u.userHandle.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }
    return true;
  });

  return (
    <div
      id="admin-finance-panel-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="admin-finance-panel-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-neutral-950 border border-white/20 rounded-3xl text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <ShieldAlert size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>🔒 TikTop Admin Console</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded-full border border-rose-500/40">
                    गोप्य / सुरक्षित
                  </span>
                </h2>
              </div>
              <p className="text-xs text-neutral-400">
                रिचार्ज स्वीकृति, निकासी व्यवस्थापन र प्रयोगकर्ता मौज्दात नियन्त्रण
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                id="btn-admin-lock-session"
                onClick={handleLockOut}
                className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="एडमिन सत्र बन्द गर्नुहोस्"
              >
                <Lock size={14} className="text-amber-400" />
                <span className="hidden sm:inline">लक गर्नुहोस्</span>
              </button>
            )}
            <button
              type="button"
              id="btn-admin-panel-close"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {feedbackToast && (
          <div
            className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-xs font-bold shadow-xl border flex items-center gap-2 transition-all animate-bounce ${
              feedbackToast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
            }`}
          >
            {feedbackToast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{feedbackToast.message}</span>
          </div>
        )}

        {/* 1. PIN AUTHENTICATION GATE (If not verified yet) */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <Lock size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">
                गोप्य एडमिन प्रमाणीकरण
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                यो प्यानलमा वित्तीय विवरण, रिचार्ज र निकासी अनुरोधहरू रहेकाले साधारण प्रयोगकर्ताहरूले देख्न पाउँदैनन्। अगाडि बढ्न कृपया आफ्नो एडमिन पिन कोड प्रविष्ट गर्नुहोस्।
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="w-full space-y-4">
              <div className="relative">
                <input
                  type={showPinPassword ? 'text' : 'password'}
                  id="input-admin-master-pin"
                  maxLength={32}
                  placeholder="गोप्य एडमिन मास्टर पिन प्रविष्ट गर्नुहोस्..."
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  autoFocus
                  className="w-full py-3.5 pl-11 pr-11 text-center tracking-wider text-base font-mono rounded-2xl bg-neutral-900 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-all"
                />
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <button
                  type="button"
                  onClick={() => setShowPinPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  title={showPinPassword ? 'पिन लुकाउनुहोस्' : 'पिन हेर्नुहोस्'}
                >
                  {showPinPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 justify-center">
                  <AlertTriangle size={14} />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-admin-submit-pin"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                <span>प्रमाणीकरण गरी प्यानल खोल्नुहोस्</span>
              </button>

              <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/5 text-[11px] text-neutral-400 text-left space-y-1">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  आधिकारिक एडमिन पहुँच (Restricted Access)
                </span>
                <div>ईमेल: <span className="text-amber-300 font-mono">tartumling354@gmail.com</span></div>
                <div>व्हाट्सएप/सम्पर्क: <span className="text-amber-300 font-mono">+977 989863991384</span></div>
                <p className="text-[10.5px] text-neutral-500 pt-0.5">
                  🔒 सुरक्षा संवेदनशीलताका कारण मास्टर पिन कोड पूर्ण रूपमा गोप्य राखिएको छ।
                </p>
              </div>
            </form>
          </div>
        ) : (
          /* 2. AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 bg-neutral-900/60 px-4 pt-2 gap-2 text-xs font-bold shrink-0 overflow-x-auto scrollbar-none">
              {/* TAB 1: RECHARGE REQUESTS */}
              <button
                type="button"
                id="tab-admin-recharge"
                onClick={() => {
                  setAdminTab('recharge');
                  setSearchQuery('');
                }}
                className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  adminTab === 'recharge'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Coins size={16} className="text-amber-400" />
                <span>१. सिक्का रिचार्ज अनुरोधहरू</span>
                {pendingRechargesCount > 0 && (
                  <span className="bg-amber-500 text-neutral-950 font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                    {pendingRechargesCount}
                  </span>
                )}
              </button>

              {/* TAB 2: WITHDRAWAL REQUESTS */}
              <button
                type="button"
                id="tab-admin-withdrawal"
                onClick={() => {
                  setAdminTab('withdrawal');
                  setSearchQuery('');
                }}
                className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  adminTab === 'withdrawal'
                    ? 'border-rose-500 text-rose-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Award size={16} className="text-rose-400" />
                <span>२. निकासी अनुरोधहरू (Withdrawal)</span>
                {pendingWithdrawalsCount > 0 && (
                  <span className="bg-rose-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                    {pendingWithdrawalsCount}
                  </span>
                )}
              </button>

              {/* TAB 3: USER BALANCES */}
              <button
                type="button"
                id="tab-admin-balances"
                onClick={() => {
                  setAdminTab('balances');
                  setSearchQuery('');
                }}
                className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  adminTab === 'balances'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Users size={16} className="text-indigo-400" />
                <span>३. प्रयोगकर्ता मौज्दात (Who Has How Many)</span>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-neutral-300 font-mono">
                  {userBalances.length}
                </span>
              </button>

              {/* TAB 4: SETTINGS */}
              <button
                type="button"
                id="tab-admin-settings"
                onClick={() => setAdminTab('settings')}
                className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ml-auto cursor-pointer ${
                  adminTab === 'settings'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Settings size={15} />
                <span>एडमिन सेटिङ</span>
              </button>
            </div>

            {/* Quick Filter & Search Bar (For Tab 1, 2, 3) */}
            {adminTab !== 'settings' && (
              <div className="p-3 bg-neutral-900/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                {/* Status Filters */}
                {adminTab === 'recharge' && (
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="text-neutral-500 text-[11px] font-semibold flex items-center gap-1">
                      <Filter size={12} /> स्थिति:
                    </span>
                    {(['pending', 'verified', 'rejected', 'all'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setRechargeFilter(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          rechargeFilter === st
                            ? 'bg-amber-500 text-neutral-950 shadow-md'
                            : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                        }`}
                      >
                        {st === 'pending'
                          ? `विचाराधीन (${pendingRechargesCount})`
                          : st === 'verified'
                          ? 'स्वीकृत'
                          : st === 'rejected'
                          ? 'अस्वीकृत'
                          : 'सबै'}
                      </button>
                    ))}

                    {rechargeClaims.some((c) => c.status === 'verified' || c.status === 'rejected') && (
                      <button
                        type="button"
                        onClick={handleOpenClearRechargeHistory}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="सम्पन्न तथा अस्वीकृत रिचार्ज इतिहास खाली गर्नुहोस्"
                      >
                        <Trash2 size={12} />
                        <span>इतिहास खाली</span>
                      </button>
                    )}
                  </div>
                )}

                {adminTab === 'withdrawal' && (
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="text-neutral-500 text-[11px] font-semibold flex items-center gap-1">
                      <Filter size={12} /> स्थिति:
                    </span>
                    {(['pending', 'completed', 'rejected', 'all'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setWithdrawFilter(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          withdrawFilter === st
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                        }`}
                      >
                        {st === 'pending'
                          ? `विचाराधीन (${pendingWithdrawalsCount})`
                          : st === 'completed'
                          ? 'सम्पन्न'
                          : st === 'rejected'
                          ? 'अस्वीकृत'
                          : 'सबै'}
                      </button>
                    ))}

                    {withdrawalRequests.some((r) => r.status === 'completed' || r.status === 'rejected') && (
                      <button
                        type="button"
                        onClick={handleOpenClearWithdrawalHistory}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="सम्पन्न तथा अस्वीकृत निकासी इतिहास खाली गर्नुहोस्"
                      >
                        <Trash2 size={12} />
                        <span>इतिहास खाली</span>
                      </button>
                    )}
                  </div>
                )}

                {adminTab === 'balances' && (
                  <div className="text-xs text-neutral-400 font-semibold">
                    सबै प्रयोगकर्ताहरूको हालको Coins र Points सूची:
                  </div>
                )}

                {/* Search & Refresh */}
                <div className="flex items-center gap-2 ml-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="नाम, ID वा खाता नम्बर..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="py-1 px-2.5 pl-7 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 w-44 sm:w-56"
                    />
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>

                  <button
                    type="button"
                    onClick={refreshAllData}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs flex items-center gap-1 cursor-pointer"
                    title="डेटा ताजा गर्नुहोस्"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT BODY */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* TAB 1: RECHARGE REQUESTS (कसले कति Coins रिचार्ज गर्न अनुरोध गर्दैछ) */}
              {adminTab === 'recharge' && (
                <div className="space-y-3">
                  {filteredRecharges.length === 0 ? (
                    <div className="p-12 text-center bg-neutral-900/40 rounded-3xl border border-white/10 space-y-2">
                      <Clock size={36} className="text-neutral-600 mx-auto" />
                      <h4 className="text-sm font-bold text-neutral-300">कुनै रिचार्ज अनुरोध फेला परेन</h4>
                      <p className="text-xs text-neutral-500">
                        {rechargeFilter === 'pending'
                          ? 'हाल कुनै पनि नयाँ रिचार्ज स्वीकृति पर्खिरहेको छैन।'
                          : 'चयन गरिएको फिल्टरमा कुनै रेकर्ड छैन।'}
                      </p>
                    </div>
                  ) : (
                    filteredRecharges.map((claim) => (
                      <div
                        key={claim.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          claim.status === 'pending'
                            ? 'bg-neutral-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                            : claim.status === 'verified'
                            ? 'bg-neutral-950/60 border-emerald-500/30'
                            : 'bg-neutral-950/60 border-rose-500/20 opacity-75'
                        }`}
                      >
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                claim.userAvatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={claim.userName}
                              className="w-10 h-10 rounded-full object-cover border border-white/20"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{claim.userName}</span>
                                <span className="text-[10px] font-mono text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded">
                                  {claim.userId}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-400">
                                माध्यम: <strong className="text-white">{claim.methodName}</strong> •{' '}
                                {new Date(claim.submittedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Coins & Status */}
                          <div className="flex items-center gap-2.5">
                            <div className="text-right">
                              <span className="text-sm font-black text-amber-400 flex items-center justify-end gap-1 font-mono">
                                <Coins size={14} /> +{claim.coins.toLocaleString()} Coins
                              </span>
                              <span className="text-xs text-neutral-300 font-semibold block">
                                {claim.currencySymbol} {claim.localAmount.toLocaleString()} (${claim.usdAmount} USD)
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                claim.status === 'verified'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : claim.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {claim.status === 'verified'
                                ? '✓ स्वीकृत (Credited)'
                                : claim.status === 'pending'
                                ? '⏳ स्वीकृति बाँकी'
                                : '✕ अस्वीकृत'}
                            </span>
                          </div>
                        </div>

                        {/* Comprehensive Payer & Payment Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-black/50 p-3 rounded-2xl border border-white/10 font-mono">
                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">👤 भुक्तानी गर्नेको नाम:</span>
                            <span className="text-white font-bold font-sans text-xs">{claim.payerName || claim.userName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">🏠 ठेगाना (Address):</span>
                            <span className="text-neutral-300 font-sans text-xs truncate block">{claim.payerAddress || 'नेपाल'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">🪙 मागेको सिक्का (Coins):</span>
                            <span className="text-amber-300 font-bold text-xs">+{claim.coins.toLocaleString()} Coins</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">💵 भुक्तानी रकम (USD):</span>
                            <span className="text-emerald-400 font-bold text-xs">${claim.usdAmount.toFixed(2)} USD ({claim.currencySymbol} {claim.localAmount.toLocaleString()})</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">🏦 कुन बैंक / वालेट:</span>
                            <span className="text-amber-200 font-bold text-xs">{claim.senderBankOrWallet || claim.methodName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">📱 पठाउने खाता / नम्बर:</span>
                            <span className="text-neutral-200 font-bold text-xs">{claim.senderAccount || 'उल्लेख छैन'}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">🏢 गन्तव्य खाता:</span>
                            <span className="text-neutral-300 text-[11px] truncate block">{claim.targetAccount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">📅 मिति र समय:</span>
                            <span className="text-neutral-300 text-[11px] block">{claim.paymentDate} • {new Date(claim.submittedAt).toLocaleTimeString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block font-sans">🆔 अर्डर Ref ID:</span>
                            <span className="text-amber-300 font-bold text-[11px] block truncate">{claim.id}</span>
                          </div>
                        </div>

                        {/* Prominent Payment Receipt Screenshot Box */}
                        {claim.receiptImage ? (
                          <div className="p-3 bg-neutral-900 border border-amber-400/30 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="relative group cursor-pointer shrink-0"
                                onClick={() => {
                                  setReceiptZoomLevel(1);
                                  setPreviewImage(claim.receiptImage!);
                                }}
                              >
                                <img
                                  src={claim.receiptImage}
                                  alt="Receipt"
                                  className="w-16 h-16 object-cover rounded-xl border border-white/20 shadow-md group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ZoomIn size={16} className="text-white" />
                                </div>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-amber-300 block flex items-center gap-1">
                                  <ImageIcon size={13} className="text-amber-400" />
                                  भुक्तानी रसिदको स्क्रिनसट (Payment Receipt)
                                </span>
                                <span className="text-[10px] text-neutral-400 block mt-0.5">
                                  स्क्रिनसट अपलोड गरिएको छ। रुजु गर्न ठूलो बनाएर हेर्नुहोस्।
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setReceiptZoomLevel(1);
                                setPreviewImage(claim.receiptImage!);
                              }}
                              className="py-1.5 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow shadow-amber-400/20 active:scale-95 shrink-0"
                            >
                              <Eye size={14} />
                              <span>रसिद प्रस्ट हेर्नुहोस् (Zoom)</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-neutral-900/60 border border-dashed border-white/10 rounded-xl text-neutral-500 text-xs italic">
                            ⚠️ प्रयोगकर्ताद्वारा कुनै रसिद स्क्रिनसट संलग्न गरिएको छैन
                          </div>
                        )}

                        {/* Rejection reason if any */}
                        {claim.rejectionReason && (
                          <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300">
                            <strong>अस्वीकारको कारण:</strong> {claim.rejectionReason}
                          </div>
                        )}

                        {/* Actions & Screenshot */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div />

                          {/* Approval / Rejection / Delete Buttons */}
                          {claim.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteRecharge(claim)}
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 border border-white/10 text-xs transition-all cursor-pointer"
                                title="यो अनुरोध मेटाउनुहोस्"
                              >
                                <Trash2 size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenRejectRecharge(claim)}
                                className="py-1.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <XCircle size={14} />
                                <span>अस्वीकार गर्नुहोस्</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenApproveRecharge(claim)}
                                className="py-1.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
                              >
                                <CheckCircle2 size={14} />
                                <span>स्वीकृत गर्नुहोस् (+{claim.coins.toLocaleString()} Coins)</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] text-neutral-400 font-mono">
                                {claim.status === 'verified'
                                  ? `प्रमाणित मिति: ${claim.verifiedAt ? new Date(claim.verifiedAt).toLocaleDateString() : 'सम्पन्न'}`
                                  : 'अस्वीकृत गरिएको अनुरोध'}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteRecharge(claim)}
                                className="py-1 px-2.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                title="यो इतिहास रेकर्ड मेटाउनुहोस्"
                              >
                                <Trash2 size={12} />
                                <span>हटाउनुहोस् (Delete)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: WITHDRAWAL REQUESTS (कसले कति रकम/Points निकासी गर्न अनुरोध गर्दैछ) */}
              {adminTab === 'withdrawal' && (
                <div className="space-y-3">
                  {filteredWithdrawals.length === 0 ? (
                    <div className="p-12 text-center bg-neutral-900/40 rounded-3xl border border-white/10 space-y-2">
                      <Clock size={36} className="text-neutral-600 mx-auto" />
                      <h4 className="text-sm font-bold text-neutral-300">कुनै निकासी अनुरोध फेला परेन</h4>
                      <p className="text-xs text-neutral-500">
                        {withdrawFilter === 'pending'
                          ? 'हाल कुनै नयाँ निकासी भुक्तानी बाँकी छैन।'
                          : 'चयन गरिएको फिल्टरमा कुनै निकासी रेकर्ड छैन।'}
                      </p>
                    </div>
                  ) : (
                    filteredWithdrawals.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          req.status === 'pending'
                            ? 'bg-neutral-900 border-rose-500/40 shadow-lg shadow-rose-500/5'
                            : req.status === 'completed'
                            ? 'bg-neutral-950/60 border-emerald-500/30'
                            : 'bg-neutral-950/60 border-rose-500/20 opacity-75'
                        }`}
                      >
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                req.userAvatar ||
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={req.userName}
                              className="w-10 h-10 rounded-full object-cover border border-white/20"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{req.userName}</span>
                                <span className="text-[10px] font-mono text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded">
                                  {req.userId}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-400">
                                निकासी अनुरोध मिति: {req.timestamp}
                              </span>
                            </div>
                          </div>

                          {/* Points & Net USD */}
                          <div className="flex items-center gap-2.5">
                            <div className="text-right">
                              <span className="text-sm font-black text-rose-400 flex items-center justify-end gap-1 font-mono">
                                <Award size={14} /> {req.points.toLocaleString()} Points
                              </span>
                              <span className="text-xs text-emerald-400 font-bold block font-mono">
                                खुद भुक्तानी: {req.amountFormatted}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                req.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : req.status === 'pending'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                              }`}
                            >
                              {req.status === 'completed'
                                ? '✓ भुक्तानी सम्पन्न'
                                : req.status === 'pending'
                                ? '⏳ भुक्तानी बाँकी'
                                : '✕ अस्वीकृत र फिर्ता'}
                            </span>
                          </div>
                        </div>

                        {/* Account Details Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs bg-black/40 p-3 rounded-xl border border-white/5 font-mono">
                          <div>
                            <span className="text-[10px] text-neutral-500 block">भुक्तानी माध्यम:</span>
                            <span className="text-white font-bold">{req.paymentMethod}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block">खाता / वालेट नम्बर:</span>
                            <span className="text-amber-300 font-black text-sm">{req.accountNumber}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block">खातावालाको नाम:</span>
                            <span className="text-neutral-200 font-bold">{req.accountName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block">बैंक / शाखा:</span>
                            <span className="text-neutral-300">{req.bankName || 'वालेट'}</span>
                          </div>
                        </div>

                        {/* Rejection reason if any */}
                        {req.rejectionReason && (
                          <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300">
                            <strong>अस्वीकारको कारण:</strong> {req.rejectionReason} (Points प्रयोगकर्तालाई फिर्ता भयो)
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-neutral-400 font-mono">
                            Ref: {req.id} • देश: {req.country}
                          </span>

                          {req.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteWithdrawal(req)}
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 border border-white/10 text-xs transition-all cursor-pointer"
                                title="यो अनुरोध मेटाउनुहोस्"
                              >
                                <Trash2 size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenRejectWithdrawal(req)}
                                className="py-1.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <XCircle size={14} />
                                <span>अस्वीकार गरी Points फिर्ता</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenApproveWithdrawal(req)}
                                className="py-1.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
                              >
                                <CheckCircle2 size={14} />
                                <span>भुक्तानी सम्पन्न / स्वीकृत गर्नुहोस्</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] text-neutral-400 font-mono">
                                {req.status === 'completed'
                                  ? `भुक्तानी मिति: ${req.processedAt || 'सम्पन्न'}`
                                  : 'अस्वीकृत रेकर्ड'}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteWithdrawal(req)}
                                className="py-1 px-2.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                title="यो इतिहास रेकर्ड मेटाउनुहोस्"
                              >
                                <Trash2 size={12} />
                                <span>हटाउनुहोस् (Delete)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: USER BALANCES (को सँग कति Coins र Points छ) */}
              {adminTab === 'balances' && (
                <div className="space-y-3">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-neutral-900 border border-white/10 rounded-2xl">
                      <span className="text-[10px] text-neutral-400 block font-semibold">कुल प्रयोगकर्ता:</span>
                      <span className="text-lg font-black text-white font-mono">
                        {userBalances.length} Users
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-900 border border-amber-500/30 rounded-2xl">
                      <span className="text-[10px] text-amber-400 block font-semibold">प्लेटफर्म कुल Coins:</span>
                      <span className="text-lg font-black text-amber-300 font-mono flex items-center gap-1">
                        <Coins size={16} />
                        {userBalances.reduce((acc, u) => acc + u.coins, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-900 border border-rose-500/30 rounded-2xl">
                      <span className="text-[10px] text-rose-400 block font-semibold">प्लेटफर्म कुल Points:</span>
                      <span className="text-lg font-black text-rose-400 font-mono flex items-center gap-1">
                        <Award size={16} />
                        {userBalances.reduce((acc, u) => acc + u.points, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-900 border border-emerald-500/30 rounded-2xl">
                      <span className="text-[10px] text-emerald-400 block font-semibold">Points को डलर मूल्य:</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        ${(userBalances.reduce((acc, u) => acc + u.points, 0) / 100000).toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-neutral-900/50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-900 text-[11px] text-neutral-400 border-b border-white/10 uppercase tracking-wider font-mono">
                          <tr>
                            <th className="py-3 px-4">प्रयोगकर्ता</th>
                            <th className="py-3 px-4">भूमिका / सम्पर्क</th>
                            <th className="py-3 px-4 text-right">सिक्का (Coins)</th>
                            <th className="py-3 px-4 text-right">पोइन्ट (Points)</th>
                            <th className="py-3 px-4 text-right">अनुमानित USD</th>
                            <th className="py-3 px-4 text-center">कार्य (Action)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredBalances.map((user) => (
                            <tr key={user.userId} className="hover:bg-white/5 transition-colors">
                              {/* User Info */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={
                                      user.userAvatar ||
                                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                                    }
                                    alt={user.userName}
                                    className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <span className="font-bold text-white block truncate max-w-[140px]">
                                      {user.userName}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-mono block">
                                      {user.userHandle} ({user.userId})
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Role & Contact */}
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block mb-1 ${
                                    user.role === 'admin'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : user.role === 'host'
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                      : user.role === 'creator'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-white/10 text-neutral-300'
                                  }`}
                                >
                                  {user.role}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono block">
                                  {user.phone || user.email || 'सम्पर्क उपलब्ध छैन'}
                                </span>
                              </td>

                              {/* Coins */}
                              <td className="py-3 px-4 text-right">
                                <span className="font-black text-amber-400 font-mono text-sm block">
                                  {user.coins.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-neutral-500">Coins</span>
                              </td>

                              {/* Points */}
                              <td className="py-3 px-4 text-right">
                                <span className="font-black text-rose-400 font-mono text-sm block">
                                  {user.points.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-neutral-500">Points</span>
                              </td>

                              {/* Approx USD */}
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-emerald-400 font-mono block">
                                  ${(user.points / 100000).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-neutral-500">
                                  ≈ रू {Math.round((user.points / 100000) * 133).toLocaleString()}
                                </span>
                              </td>

                              {/* Action Adjust */}
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => setAdjustTargetUser(user)}
                                  className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span>समायोजन</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS (Admin WhatsApp & Security PIN) */}
              {adminTab === 'settings' && (
                <div className="max-w-xl mx-auto space-y-5">
                  {/* WhatsApp SMS Notice Configuration */}
                  <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <MessageCircle size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          एडमिन WhatsApp अलर्ट नम्बर (SMS / Notification)
                        </h4>
                        <p className="text-xs text-neutral-400">
                          कुनै प्रयोगकर्ताले रिचार्ज वा निकासी अनुरोध पेश गर्दा यसै नम्बरमा तत्काल मेसेज आउनेछ।
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSavePhone} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-neutral-300 block mb-1">
                          WhatsApp नम्बर (कन्ट्री कोड सहित):
                        </label>
                        <input
                          type="text"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="+977 989863991384"
                          className="w-full py-2.5 px-3.5 rounded-xl bg-neutral-950 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>नम्बर सुरक्षित गर्नुहोस्</span>
                      </button>

                      {isPhoneSaved && (
                        <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={14} /> सुरक्षित भयो!
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Security PIN Details */}
                  <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <KeyRound size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          एडमिन सुरक्षा पिन कोड (Security Master PIN)
                        </h4>
                        <p className="text-xs text-neutral-400">
                          साधारण प्रयोगकर्ताहरूलाई एडमिन प्यानल खोल्नबाट रोक्न यो गोप्य पिन प्रयोग गरिन्छ।
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-950 rounded-xl border border-white/5 space-y-1.5 text-xs text-neutral-300">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <ShieldCheck size={15} />
                        मास्टर पिन स्थिति: <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded text-[11px]">सुरक्षित तथा अति गोप्य (••••••••••)</span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        🔒 सुरक्षा नीतिका कारण यो पिन कोड स्क्रिनमा कतै पनि देखाइँदैन। केवल आधिकारिक प्रशासक (Admin) लाई मात्र थाहा हुन्छ।
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUB-MODAL 1: FULL-SIZE PAYMENT SCREENSHOT RECEIPT VIEWER WITH ZOOM CONTROLS */}
        {previewImage && (
          <div
            className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
            onClick={() => {
              setPreviewImage(null);
              setReceiptZoomLevel(1);
            }}
          >
            <div
              className="max-w-2xl w-full bg-neutral-900 border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl relative flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      भुक्तानी रसिद / भौचर प्रमाण (Payment Receipt Screenshot)
                    </h4>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Zoom: {Math.round(receiptZoomLevel * 100)}% • रसिदको मिति, रकम र ट्रान्ज्याक्सन कोड रुजु गर्नुहोस्
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Zoom Controls */}
                  <div className="flex items-center bg-black/60 rounded-xl border border-white/10 p-0.5">
                    <button
                      type="button"
                      title="Zoom In"
                      onClick={() => setReceiptZoomLevel((prev) => Math.min(prev + 0.25, 2.5))}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      type="button"
                      title="Zoom Out"
                      onClick={() => setReceiptZoomLevel((prev) => Math.max(prev - 0.25, 0.75))}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <button
                      type="button"
                      title="Reset Zoom"
                      onClick={() => setReceiptZoomLevel(1)}
                      className="px-2 py-1 text-[10px] rounded-lg hover:bg-white/10 text-amber-300 font-bold cursor-pointer"
                    >
                      100%
                    </button>
                  </div>

                  <a
                    href={previewImage}
                    download="payment-receipt-admin-verification.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download Receipt"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <Download size={15} />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setReceiptZoomLevel(1);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 cursor-pointer transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl my-2.5 text-[10px] text-amber-200 flex items-center justify-between shrink-0">
                <span>🔍 रसिदमा कारोबार रकम, मिति र बैंक/वालेट खाता प्रस्ट रुजु गरेर मात्र स्वीकृत गर्नुहोस्।</span>
                <span className="font-mono text-neutral-400 hidden sm:inline">Scroll to Pan</span>
              </div>

              {/* Scrollable & Zoomable Image Area */}
              <div className="flex-1 overflow-auto p-2 bg-black/80 rounded-2xl border border-white/10 flex items-center justify-center min-h-[320px]">
                <div
                  className="transition-transform duration-200 ease-out origin-center"
                  style={{ transform: `scale(${receiptZoomLevel})` }}
                >
                  <img
                    src={previewImage}
                    alt="Payment Receipt Proof"
                    className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/20"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setReceiptZoomLevel(1);
                  }}
                  className="py-2 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                >
                  बन्द गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 2: USER BALANCE MANUAL ADJUSTMENT MODAL */}
        {adjustTargetUser && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setAdjustTargetUser(null)}
          >
            <div
              className="max-w-sm w-full bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck size={16} className="text-indigo-400" />
                  <span>मौज्दात समायोजन ({adjustTargetUser.userName})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setAdjustTargetUser(null)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1 font-semibold">समायोजन प्रकार:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('coins')}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                        adjustType === 'coins'
                          ? 'bg-amber-500 text-neutral-950 border-amber-400'
                          : 'bg-neutral-800 text-neutral-300 border-white/10'
                      }`}
                    >
                      <Coins size={14} />
                      <span>Coins (सिक्का)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('points')}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                        adjustType === 'points'
                          ? 'bg-rose-500 text-white border-rose-400'
                          : 'bg-neutral-800 text-neutral-300 border-white/10'
                      }`}
                    >
                      <Award size={14} />
                      <span>Points (पोइन्ट)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-semibold">कार्य:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustAction('add')}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                        adjustAction === 'add'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-neutral-800 text-neutral-300 border-white/10'
                      }`}
                    >
                      <PlusCircle size={14} />
                      <span>थप्नुहोस् (+)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAction('deduct')}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                        adjustAction === 'deduct'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-neutral-800 text-neutral-300 border-white/10'
                      }`}
                    >
                      <MinusCircle size={14} />
                      <span>घटाउनुहोस् (-)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-semibold">रकम (Amount):</label>
                  <input
                    type="number"
                    min={1}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-white/15 text-white font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustTargetUser(null)}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-bold cursor-pointer"
                >
                  रद्द
                </button>
                <button
                  type="button"
                  onClick={handleSaveBalanceAdjustment}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  लागू गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTION / CONFIRMATION / REJECTION / DELETION MODAL */}
        {confirmAction && (
          <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-white/20 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  {confirmAction.type.startsWith('approve') && (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                  {confirmAction.type.startsWith('reject') && (
                    <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                      <XCircle size={20} />
                    </div>
                  )}
                  {(confirmAction.type.startsWith('delete') || confirmAction.type.startsWith('clear')) && (
                    <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                      <Trash2 size={18} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {confirmAction.type === 'approve_recharge' && 'रिचार्ज स्वीकृति पुष्टि'}
                      {confirmAction.type === 'reject_recharge' && 'रिचार्ज अस्वीकार पुष्टि'}
                      {confirmAction.type === 'delete_recharge' && 'रिचार्ज रेकर्ड हटाउने पुष्टि'}
                      {confirmAction.type === 'clear_recharge_history' && 'रिचार्ज इतिहास खाली गर्ने पुष्टि'}
                      {confirmAction.type === 'approve_withdrawal' && 'निकासी भुक्तानी सम्पन्न पुष्टि'}
                      {confirmAction.type === 'reject_withdrawal' && 'निकासी अस्वीकार पुष्टि'}
                      {confirmAction.type === 'delete_withdrawal' && 'निकासी रेकर्ड हटाउने पुष्टि'}
                      {confirmAction.type === 'clear_withdrawal_history' && 'निकासी इतिहास खाली गर्ने पुष्टि'}
                    </h3>
                    <span className="text-[11px] text-neutral-400">
                      {confirmAction.type.includes('recharge') ? 'Recharge Verification Action' : 'Withdrawal Action'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isSubmittingAction && setConfirmAction(null)}
                  disabled={isSubmittingAction}
                  className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body Details */}
              <div className="space-y-3 text-xs">
                {/* For recharge claim actions */}
                {confirmAction.claim && (
                  <div className="p-3 bg-black/50 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">प्रयोगकर्ता:</span>
                      <span className="text-white font-bold">{confirmAction.claim.userName} ({confirmAction.claim.userId})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">रकम / Coins:</span>
                      <span className="text-amber-300 font-bold font-mono">
                        {confirmAction.claim.currencySymbol} {confirmAction.claim.localAmount} (+{confirmAction.claim.coins.toLocaleString()} Coins)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500">माध्यम / Ref:</span>
                      <span className="text-neutral-300 font-mono">{confirmAction.claim.methodName} • {confirmAction.claim.id}</span>
                    </div>
                  </div>
                )}

                {/* For withdrawal request actions */}
                {confirmAction.withdrawal && (
                  <div className="p-3 bg-black/50 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">प्रयोगकर्ता:</span>
                      <span className="text-white font-bold">{confirmAction.withdrawal.userName} ({confirmAction.withdrawal.userId})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">भुक्तानी रकम:</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {confirmAction.withdrawal.amountFormatted} ({confirmAction.withdrawal.points.toLocaleString()} Points)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500">खाता / वालेट:</span>
                      <span className="text-amber-300 font-mono font-bold">
                        {confirmAction.withdrawal.paymentMethod}: {confirmAction.withdrawal.accountNumber} ({confirmAction.withdrawal.accountName})
                      </span>
                    </div>
                  </div>
                )}

                {/* Specific descriptions */}
                {confirmAction.type === 'approve_recharge' && (
                  <p className="text-neutral-300 text-xs leading-relaxed bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                    💡 <strong>स्वीकृत गर्दा:</strong> प्रयोगकर्ताको खातामा तत्काल <strong>+{confirmAction.claim?.coins.toLocaleString()} Coins</strong> जम्मा हुनेछ र इनबक्स सूचना पठाइनेछ।
                  </p>
                )}

                {confirmAction.type === 'approve_withdrawal' && (
                  <p className="text-neutral-300 text-xs leading-relaxed bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                    💡 <strong>भुक्तानी सम्पन्न गर्दा:</strong> स्थिति <strong>'सम्पन्न' (Paid)</strong> मा परिवर्तन हुनेछ र प्रयोगकर्तालाई भुक्तानी पठाइएको जानकारी सूचना जानेछ।
                  </p>
                )}

                {/* Rejection Reasons Box */}
                {(confirmAction.type === 'reject_recharge' || confirmAction.type === 'reject_withdrawal') && (
                  <div className="space-y-2">
                    <label className="text-neutral-300 font-semibold block">
                      अस्वीकार गर्नुको कारण (प्रयोगकर्ताले सूचनामा देख्नेछन्):
                    </label>

                    {/* Quick reason suggestions */}
                    <div className="flex flex-wrap gap-1.5">
                      {confirmAction.type === 'reject_recharge' ? (
                        [
                          'खातामा रकम प्राप्त भएन / अमान्य रसिद',
                          'नक्कली वा दोहोरिएको स्क्रिनसट',
                          'रकम अपुग वा नमिलेको',
                          'अन्य कारण',
                        ].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setActionReason(r)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer transition-all ${
                              actionReason === r
                                ? 'bg-rose-500/30 text-rose-200 border-rose-400'
                                : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {r}
                          </button>
                        ))
                      ) : (
                        [
                          'गलत खाता नम्बर वा नाम नमिलेको',
                          'बैंक खाता सक्रिय नभएको',
                          'वालेट भुक्तानी सीमा नाघेको',
                          'अन्य कारण',
                        ].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setActionReason(r)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer transition-all ${
                              actionReason === r
                                ? 'bg-rose-500/30 text-rose-200 border-rose-400'
                                : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {r}
                          </button>
                        ))
                      )}
                    </div>

                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="अस्वीकारको कारण लेख्नुहोस्..."
                      className="w-full bg-neutral-950 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />

                    {confirmAction.type === 'reject_withdrawal' && (
                      <p className="text-[11px] text-amber-300">
                        * अस्वीकार गर्दा प्रयोगकर्ताको <strong>{confirmAction.withdrawal?.points.toLocaleString()} Points</strong> स्वतः फिर्ता हुनेछ।
                      </p>
                    )}
                  </div>
                )}

                {/* Deletion warnings */}
                {(confirmAction.type === 'delete_recharge' || confirmAction.type === 'delete_withdrawal') && (
                  <p className="text-rose-300 text-xs leading-relaxed bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">
                    ⚠️ के तपाईं यो रेकर्ड इतिहास सूचीबाट स्थायी रूपमा हटाउन निश्चित हुनुहुन्छ? यो कार्य उल्टाउन सकिँदैन।
                  </p>
                )}

                {(confirmAction.type === 'clear_recharge_history' || confirmAction.type === 'clear_withdrawal_history') && (
                  <p className="text-rose-300 text-xs leading-relaxed bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">
                    ⚠️ सबै पूरा भइसकेका (Completed/Verified) र अस्वीकृत (Rejected) पुराना रेकर्डहरू मेटिनेछन्। <strong>विचाराधीन (Pending) रेकर्डहरू सुरक्षित रहनेछन्।</strong>
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={isSubmittingAction}
                  onClick={() => setConfirmAction(null)}
                  className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-bold cursor-pointer transition-all"
                >
                  रद्द (Cancel)
                </button>

                <button
                  type="button"
                  disabled={isSubmittingAction}
                  onClick={handleExecuteAction}
                  className={`py-2 px-4 rounded-xl text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 ${
                    confirmAction.type.startsWith('approve')
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  }`}
                >
                  {isSubmittingAction ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : confirmAction.type.startsWith('approve') ? (
                    <CheckCircle2 size={14} />
                  ) : confirmAction.type.startsWith('delete') || confirmAction.type.startsWith('clear') ? (
                    <Trash2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  <span>
                    {isSubmittingAction
                      ? 'प्रशोधन हुँदैछ...'
                      : confirmAction.type === 'approve_recharge'
                      ? 'हो, स्वीकृत गर्नुहोस्'
                      : confirmAction.type === 'reject_recharge'
                      ? 'अस्वीकार पुष्टि गर्नुहोस्'
                      : confirmAction.type === 'delete_recharge'
                      ? 'हटाउनुहोस् (Delete)'
                      : confirmAction.type === 'clear_recharge_history'
                      ? 'इतिहास खाली गर्नुहोस्'
                      : confirmAction.type === 'approve_withdrawal'
                      ? 'हो, भुक्तानी सम्पन्न भयो'
                      : confirmAction.type === 'reject_withdrawal'
                      ? 'अस्वीकार गरी फिर्ता गर्नुहोस्'
                      : confirmAction.type === 'delete_withdrawal'
                      ? 'हटाउनुहोस् (Delete)'
                      : 'इतिहास खाली गर्नुहोस्'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
