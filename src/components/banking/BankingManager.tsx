import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Warehouse,
  Receipt,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Building,
  Coins,
  ChevronRight,
  ShieldCheck,
  Layers,
  ArrowUpDown,
  FileText,
  DollarSign,
  Download,
  Trash2,
  Edit2,
  Info,
  Sliders
} from 'lucide-react';
import {
  BankingPocket,
  BankingTransaction,
  PocketTransferRequest,
  Order,
  CoffeeBean,
  InboundMovement
} from '../../types/erp';
import {
  transferBetweenPockets,
  addPocketFunds,
  withdrawPocketFunds,
  saveBankingPocket,
  deleteBankingPocket,
  adjustPocketBalance,
  syncPocketsWithActualBusinessData
} from '../../services/dbService';

interface BankingManagerProps {
  pockets: BankingPocket[];
  transactions: BankingTransaction[];
  orders?: Order[];
  beans?: CoffeeBean[];
  inbound?: InboundMovement[];
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export const BankingManager: React.FC<BankingManagerProps> = ({
  pockets,
  transactions,
  orders = [],
  beans = [],
  inbound = [],
  onRefresh,
  isSyncing = false
}) => {
  // State for Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPocketModal, setShowPocketModal] = useState(false);

  // Privacy toggle (show/hide exact balance values)
  const [hideBalances, setHideBalances] = useState(false);

  // Filter & Search states
  const [selectedPocketFilter, setSelectedPocketFilter] = useState<string>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [searchTx, setSearchTx] = useState('');

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transfer Form State
  const [transferSource, setTransferSource] = useState<string>(pockets[1]?.id || 'pock-penjualan');
  const [transferTarget, setTransferTarget] = useState<string>(pockets[2]?.id || 'pock-laba');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferCategory, setTransferCategory] = useState('Alokasi Rutin');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Deposit Form State
  const [depositPocketId, setDepositPocketId] = useState<string>(pockets[0]?.id || 'pock-gudang');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositDescription, setDepositDescription] = useState('');
  const [depositCategory, setDepositCategory] = useState('Pemasukan Penjualan');
  const [depositRef, setDepositRef] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  // Withdraw Form State
  const [withdrawPocketId, setWithdrawPocketId] = useState<string>(pockets[0]?.id || 'pock-gudang');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [withdrawCategory, setWithdrawCategory] = useState('Belanja Green Bean');
  const [withdrawRef, setWithdrawRef] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Pocket Form State (Add/Edit)
  const [editingPocketId, setEditingPocketId] = useState<string | null>(null);
  const [pocketName, setPocketName] = useState('');
  const [pocketColor, setPocketColor] = useState('emerald');
  const [pocketIcon, setPocketIcon] = useState('PiggyBank');
  const [pocketTarget, setPocketTarget] = useState<number>(0);
  const [pocketDescription, setPocketDescription] = useState('');
  const [pocketInitialBalance, setPocketInitialBalance] = useState<number>(0);

  // Penyesuaian Saldo Aktual (Opname Kas / Rekening)
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPocketId, setAdjustPocketId] = useState<string>(pockets[0]?.id || 'pock-penjualan');
  const [adjustNewBalance, setAdjustNewBalance] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [isSyncingActual, setIsSyncingActual] = useState(false);

  // Copy indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Perhitungan Data Bisnis Aktual dari Faktur Penjualan & Inventaris Gudang
  const actualPaidSales = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    const paidSum = orders
      .filter((o) => o.paymentStatus === 'Paid in Full')
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const dpSum = orders
      .filter((o) => o.paymentStatus === 'Down Payment')
      .reduce((sum, o) => sum + ((o.grandTotal || 0) * 0.5), 0);
    return paidSum + dpSum;
  }, [orders]);

  const actualUnpaidReceivables = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    return orders
      .filter((o) => o.paymentStatus !== 'Paid in Full')
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  }, [orders]);

  const actualGreenBeanStockValue = useMemo(() => {
    if (!beans || beans.length === 0) return 0;
    return beans.reduce((sum, b) => {
      const price = b.costGreenPerKg || (b.priceLocalPerKg ? Math.round(b.priceLocalPerKg * 0.65) : 90000);
      return sum + (b.stockGreenKg || 0) * price;
    }, 0);
  }, [beans]);

  const actualEstimatedProfit = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    return Math.round(actualPaidSales * 0.25);
  }, [orders, actualPaidSales]);

  // Calculations
  const totalBalance = useMemo(() => {
    return pockets.reduce((acc, p) => acc + (p.balance || 0), 0);
  }, [pockets]);

  const totalInflow = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'deposit')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transactions]);

  const totalOutflow = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'withdrawal' || t.type === 'expense')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transactions]);

  const totalTransfers = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'transfer_out')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transactions]);

  // Selected source pocket object
  const currentSourcePocket = useMemo(() => {
    return pockets.find((p) => p.id === transferSource);
  }, [pockets, transferSource]);

  const currentTargetPocket = useMemo(() => {
    return pockets.find((p) => p.id === transferTarget);
  }, [pockets, transferTarget]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedPocketFilter !== 'all' && t.pocketId !== selectedPocketFilter) {
        return false;
      }
      if (txTypeFilter !== 'all') {
        if (txTypeFilter === 'transfer' && !t.type.startsWith('transfer')) return false;
        if (txTypeFilter === 'deposit' && t.type !== 'deposit') return false;
        if (txTypeFilter === 'withdrawal' && t.type !== 'withdrawal' && t.type !== 'expense') return false;
      }
      if (searchTx.trim()) {
        const q = searchTx.toLowerCase();
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesPocket = t.pocketName?.toLowerCase().includes(q);
        const matchesRef = t.referenceNumber?.toLowerCase().includes(q);
        const matchesCat = t.category?.toLowerCase().includes(q);
        return matchesDesc || matchesPocket || matchesRef || matchesCat;
      }
      return true;
    });
  }, [transactions, selectedPocketFilter, txTypeFilter, searchTx]);

  // Open Transfer modal prefilled with source
  const openTransferFrom = (pocketId: string) => {
    setTransferSource(pocketId);
    // pick a different target
    const other = pockets.find((p) => p.id !== pocketId);
    if (other) setTransferTarget(other.id);
    setTransferAmount(0);
    setTransferNotes('');
    setShowTransferModal(true);
  };

  // Open Top Up modal prefilled
  const openDepositTo = (pocketId: string) => {
    setDepositPocketId(pocketId);
    setDepositAmount(0);
    setDepositDescription('');
    setShowDepositModal(true);
  };

  // Open Withdraw modal prefilled
  const openWithdrawFrom = (pocketId: string) => {
    setWithdrawPocketId(pocketId);
    setWithdrawAmount(0);
    setWithdrawDescription('');
    setShowWithdrawModal(true);
  };

  // Open Adjust / Opname Saldo modal prefilled
  const openAdjustFor = (pocket: BankingPocket) => {
    setAdjustPocketId(pocket.id);
    setAdjustNewBalance(pocket.balance);
    setAdjustNotes(`Penyesuaian saldo riil ${pocket.name}`);
    setShowAdjustModal(true);
  };

  // Handler: Sinkronisasi Saldo Aktual Otomatis dari Faktur Penjualan & Pergudangan
  const handleSyncActualPockets = async () => {
    try {
      setIsSyncingActual(true);
      const res = await syncPocketsWithActualBusinessData(
        actualPaidSales,
        actualGreenBeanStockValue,
        actualEstimatedProfit,
        pockets
      );
      if (res.success) {
        showToast('success', 'Saldo aktual berhasil disinkronkan dari data faktur & gudang!');
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      showToast('error', `Gagal sinkron: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSyncingActual(false);
    }
  };

  // Handler: Penyesuaian Saldo Aktual Opname
  const handleExecuteAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPocketId) return;
    try {
      setIsSubmittingAdjust(true);
      const res = await adjustPocketBalance(
        adjustPocketId,
        adjustNewBalance,
        adjustNotes || 'Penyesuaian Saldo Aktual Opname Kas',
        pockets
      );
      if (res.success) {
        showToast('success', res.message);
        setShowAdjustModal(false);
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      showToast('error', `Gagal sesuaikan saldo: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Handle Transfer Submit
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSource || !transferTarget) {
      showToast('error', 'Pilih kantong asal dan kantong tujuan transfer.');
      return;
    }
    if (transferSource === transferTarget) {
      showToast('error', 'Kantong asal dan kantong tujuan tidak boleh sama.');
      return;
    }
    if (transferAmount <= 0) {
      showToast('error', 'Masukkan nominal transfer yang valid (lebih dari Rp 0).');
      return;
    }
    if (currentSourcePocket && currentSourcePocket.balance < transferAmount) {
      showToast(
        'error',
        `Saldo ${currentSourcePocket.name} tidak mencukupi (Rp ${currentSourcePocket.balance.toLocaleString('id-ID')}).`
      );
      return;
    }

    try {
      setIsSubmittingTransfer(true);
      const req: PocketTransferRequest = {
        sourcePocketId: transferSource,
        targetPocketId: transferTarget,
        amount: transferAmount,
        notes: transferNotes,
        category: transferCategory
      };
      const result = await transferBetweenPockets(req, pockets);
      if (result.success) {
        showToast('success', result.message);
        setShowTransferModal(false);
        setTransferAmount(0);
        setTransferNotes('');
      } else {
        showToast('error', result.message);
      }
    } catch (err: any) {
      showToast('error', `Gagal transfer: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Handle Deposit Submit
  const handleExecuteDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositPocketId || depositAmount <= 0) {
      showToast('error', 'Pilih kantong dan masukkan nominal yang valid.');
      return;
    }

    try {
      setIsSubmittingDeposit(true);
      const result = await addPocketFunds(
        depositPocketId,
        depositAmount,
        depositDescription,
        depositCategory,
        pockets,
        depositRef
      );
      if (result.success) {
        showToast('success', result.message);
        setShowDepositModal(false);
        setDepositAmount(0);
        setDepositDescription('');
        setDepositRef('');
      } else {
        showToast('error', result.message);
      }
    } catch (err: any) {
      showToast('error', `Gagal setor: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Handle Withdraw Submit
  const handleExecuteWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawPocketId || withdrawAmount <= 0) {
      showToast('error', 'Pilih kantong dan masukkan nominal penarikan yang valid.');
      return;
    }

    try {
      setIsSubmittingWithdraw(true);
      const result = await withdrawPocketFunds(
        withdrawPocketId,
        withdrawAmount,
        withdrawDescription,
        withdrawCategory,
        pockets,
        withdrawRef
      );
      if (result.success) {
        showToast('success', result.message);
        setShowWithdrawModal(false);
        setWithdrawAmount(0);
        setWithdrawDescription('');
        setWithdrawRef('');
      } else {
        showToast('error', result.message);
      }
    } catch (err: any) {
      showToast('error', `Gagal tarik dana: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Handle Add / Edit Pocket Submit
  const handleSavePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pocketName.trim()) {
      showToast('error', 'Nama kantong tidak boleh kosong.');
      return;
    }

    try {
      if (editingPocketId) {
        const existing = pockets.find((p) => p.id === editingPocketId);
        if (!existing) return;
        const updated: BankingPocket = {
          ...existing,
          name: pocketName.trim(),
          color: pocketColor,
          iconName: pocketIcon,
          targetBalance: pocketTarget > 0 ? pocketTarget : undefined,
          description: pocketDescription,
          updatedAt: new Date().toISOString()
        };
        await saveBankingPocket(updated);
        showToast('success', `Kantong "${updated.name}" berhasil diperbarui.`);
      } else {
        const newPocket: BankingPocket = {
          id: `pock-${Date.now()}`,
          name: pocketName.trim(),
          slug: pocketName.trim().toLowerCase().replace(/\s+/g, '-'),
          type: 'custom',
          balance: pocketInitialBalance || 0,
          currency: 'IDR',
          color: pocketColor,
          iconName: pocketIcon,
          description: pocketDescription || 'Kantong kas tambahan',
          targetBalance: pocketTarget > 0 ? pocketTarget : undefined,
          accountNumber: `KOF-CUST-${Math.floor(100 + Math.random() * 900)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveBankingPocket(newPocket);
        showToast('success', `Kantong baru "${newPocket.name}" berhasil dibuat dan disimpan di Firestore.`);
      }
      setShowPocketModal(false);
      setEditingPocketId(null);
      setPocketName('');
      setPocketTarget(0);
      setPocketDescription('');
      setPocketInitialBalance(0);
    } catch (err: any) {
      showToast('error', `Gagal menyimpan kantong: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // Handle Delete Pocket
  const handleDeletePocket = async (pocket: BankingPocket) => {
    if (pocket.isPrimary) {
      showToast('error', 'Kantong utama (Gudang, Penjualan, Laba) tidak dapat dihapus.');
      return;
    }
    if (pocket.balance > 0) {
      showToast(
        'error',
        `Kantong ini masih memiliki saldo Rp ${pocket.balance.toLocaleString('id-ID')}. Pindahkan saldo terlebih dahulu sebelum menghapus.`
      );
      return;
    }
    if (confirm(`Yakin ingin menghapus kantong "${pocket.name}"?`)) {
      try {
        await deleteBankingPocket(pocket.id);
        showToast('success', `Kantong "${pocket.name}" berhasil dihapus dari database.`);
      } catch (err: any) {
        showToast('error', `Gagal menghapus kantong: ${err?.message || 'Terjadi kesalahan'}`);
      }
    }
  };

  // Helper to render icon by name
  const renderPocketIcon = (name: string, className = 'w-6 h-6') => {
    switch (name) {
      case 'Warehouse':
        return <Warehouse className={className} />;
      case 'Receipt':
        return <Receipt className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Coins':
        return <Coins className={className} />;
      case 'Building':
        return <Building className={className} />;
      case 'DollarSign':
        return <DollarSign className={className} />;
      case 'Wallet':
        return <Wallet className={className} />;
      case 'PiggyBank':
      default:
        return <PiggyBank className={className} />;
    }
  };

  // Helper styling for pocket themes (Multi-Kantong color palettes)
  const getPocketTheme = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          bgGradient: 'from-emerald-700 via-emerald-800 to-teal-900',
          badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
          accentText: 'text-emerald-300',
          barColor: 'bg-emerald-400',
          buttonPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          buttonSecondary: 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-700/50',
          glow: 'shadow-emerald-900/20'
        };
      case 'amber':
        return {
          bgGradient: 'from-amber-700 via-amber-800 to-orange-950',
          badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
          accentText: 'text-amber-300',
          barColor: 'bg-amber-400',
          buttonPrimary: 'bg-amber-600 hover:bg-amber-500 text-white',
          buttonSecondary: 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border-amber-700/50',
          glow: 'shadow-amber-900/20'
        };
      case 'indigo':
        return {
          bgGradient: 'from-indigo-700 via-indigo-800 to-slate-950',
          badgeBg: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
          accentText: 'text-indigo-300',
          barColor: 'bg-indigo-400',
          buttonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
          buttonSecondary: 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border-indigo-700/50',
          glow: 'shadow-indigo-900/20'
        };
      case 'rose':
        return {
          bgGradient: 'from-rose-700 via-rose-800 to-stone-950',
          badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-500/30',
          accentText: 'text-rose-300',
          barColor: 'bg-rose-400',
          buttonPrimary: 'bg-rose-600 hover:bg-rose-500 text-white',
          buttonSecondary: 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border-rose-700/50',
          glow: 'shadow-rose-900/20'
        };
      case 'blue':
        return {
          bgGradient: 'from-blue-700 via-blue-800 to-slate-950',
          badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
          accentText: 'text-blue-300',
          barColor: 'bg-blue-400',
          buttonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white',
          buttonSecondary: 'bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 border-blue-700/50',
          glow: 'shadow-blue-900/20'
        };
      case 'cyan':
        return {
          bgGradient: 'from-teal-700 via-cyan-800 to-slate-950',
          badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
          accentText: 'text-cyan-300',
          barColor: 'bg-cyan-400',
          buttonPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-white',
          buttonSecondary: 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border-cyan-700/50',
          glow: 'shadow-cyan-900/20'
        };
      default:
        return {
          bgGradient: 'from-zinc-800 via-zinc-850 to-zinc-950',
          badgeBg: 'bg-zinc-700/40 text-zinc-200 border-zinc-600/30',
          accentText: 'text-zinc-300',
          barColor: 'bg-zinc-400',
          buttonPrimary: 'bg-zinc-700 hover:bg-zinc-600 text-white',
          buttonSecondary: 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700/50',
          glow: 'shadow-zinc-900/20'
        };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-600/50 shadow-emerald-950/50'
              : 'bg-rose-950/95 text-rose-200 border-rose-600/50 shadow-rose-950/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner: Multi-Kantong Kas & Rekening Digital */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl p-4 sm:p-6 lg:p-7 text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-300">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Multi-Kantong Kas & Rekening Digital
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-medium bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Firestore Synced
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-100">
                Kas & Perbankan KopiFlow
              </h1>
              <button
                type="button"
                onClick={() => setHideBalances(!hideBalances)}
                title={hideBalances ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {hideBalances ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Alokasikan dan pisahkan dana operasional secara fleksibel. Pindahkan uang antar kantong seketika tanpa potongan biaya dan tercatat rapi di database Firestore.
            </p>
          </div>

          {/* Quick Action Buttons (Optimized 2x2 grid on mobile HP) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => {
                setTransferAmount(0);
                setTransferNotes('');
                setShowTransferModal(true);
              }}
              className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4 shrink-0" />
              <span className="truncate">Pindah Saldo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDepositAmount(0);
                setDepositDescription('');
                setShowDepositModal(true);
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20 transition-all active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0" />
              <span className="truncate">Isi Kas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWithdrawAmount(0);
                setWithdrawDescription('');
                setShowWithdrawModal(true);
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" />
              <span className="truncate">Tarik / Pakai</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingPocketId(null);
                setPocketName('');
                setPocketTarget(0);
                setPocketDescription('');
                setPocketInitialBalance(0);
                setShowPocketModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 transition-all active:scale-95"
              title="Buat Kantong Kustom"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Kantong Baru</span>
            </button>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 rounded-xl p-2.5 sm:p-3.5 border border-zinc-800/60 min-w-0">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium block truncate">Total Saldo Likuid</span>
            <div className="text-sm sm:text-lg lg:text-2xl font-black tracking-tight text-white mt-0.5 truncate">
              {hideBalances ? 'Rp ••••••••' : `Rp ${totalBalance.toLocaleString('id-ID')}`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
              <span className="truncate">{pockets.length} Kantong Aktif</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 rounded-xl p-2.5 sm:p-3.5 border border-zinc-800/60 min-w-0">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium block truncate">Pemasukan Kas</span>
            <div className="text-sm sm:text-base lg:text-xl font-bold tracking-tight text-emerald-400 mt-0.5 truncate">
              {hideBalances ? 'Rp ••••••••' : `+Rp ${totalInflow.toLocaleString('id-ID')}`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-500/80 mt-0.5 truncate">Dari invoice & modal</div>
          </div>

          <div className="bg-zinc-950/60 rounded-xl p-2.5 sm:p-3.5 border border-zinc-800/60 min-w-0">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium block truncate">Pengeluaran Kas</span>
            <div className="text-sm sm:text-base lg:text-xl font-bold tracking-tight text-rose-400 mt-0.5 truncate">
              {hideBalances ? 'Rp ••••••••' : `-Rp ${totalOutflow.toLocaleString('id-ID')}`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-rose-400/80 mt-0.5 truncate">Belanja & operasional</div>
          </div>

          <div className="bg-zinc-950/60 rounded-xl p-2.5 sm:p-3.5 border border-zinc-800/60 min-w-0">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium block truncate">Pergeseran Saldo</span>
            <div className="text-sm sm:text-base lg:text-xl font-bold tracking-tight text-indigo-400 mt-0.5 truncate">
              {hideBalances ? 'Rp ••••••••' : `Rp ${totalTransfers.toLocaleString('id-ID')}`}
            </div>
            <div className="text-[10px] sm:text-[11px] text-indigo-400/80 mt-0.5 truncate">
              {transactions.filter((t) => t.type === 'transfer_out').length}x transfer
            </div>
          </div>
        </div>
      </div>

      {/* Panel Rekonsiliasi & Data Aktual ERP (Faktur & Gudang) */}
      <div className="bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/90 rounded-2xl border border-amber-200/90 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-1.5">
                <span>Nilai Riil ERP: Penjualan & Inventaris Gudang</span>
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                Data Aktual
              </span>
            </div>
            <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">
              Dihitung otomatis dari faktur penjualan lunas & stok biji mentah (green bean) gudang. Anda dapat menyinkronkan saldo kantong ke angka aktual atau menyesuaikannya secara manual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSyncActualPockets}
              disabled={isSyncingActual}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
              title="Perbarui saldo kantong berdasarkan faktur penjualan lunas dan stok gudang riil"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncingActual ? 'animate-spin' : ''}`} />
              <span>{isSyncingActual ? 'Menyinkronkan...' : '⚡ Sinkronkan Saldo Aktual'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (pockets.length > 0) openAdjustFor(pockets[0]);
              }}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-zinc-100 active:scale-95 text-zinc-800 border border-zinc-300 shadow-xs transition-all"
              title="Sesuaikan saldo secara manual (Opname kas atau mutasi bank)"
            >
              <Sliders className="w-4 h-4 text-zinc-600 shrink-0" />
              <span>Opname Saldo</span>
            </button>
          </div>
        </div>

        {/* 3 Live Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-amber-200/60">
          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-emerald-200/80">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span className="font-semibold text-emerald-800">1. Hasil Penjualan (Faktur Lunas/DP)</span>
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-700">
              Rp {actualPaidSales.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Piutang belum lunas: <span className="font-medium text-amber-600">Rp {actualUnpaidReceivables.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-amber-200/80">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span className="font-semibold text-amber-800">2. Nilai Fisik Green Bean Gudang</span>
              <Warehouse className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-amber-700">
              Rp {actualGreenBeanStockValue.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Valuasi stok biji mentah siap sangrai
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-indigo-200/80">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span className="font-semibold text-indigo-800">3. Estimasi Laba Bersih Roastery</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-indigo-700">
              Rp {actualEstimatedProfit.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Estimasi margin laba bersih dari faktur
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Core Pockets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Daftar Kantong Kas Roastery</span>
            </h2>
            <p className="text-xs text-zinc-600">
              3 Kantong utama: Gudang, Penjualan, dan Laba. Anda dapat memindahkan saldo kapan saja.
            </p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium px-2.5 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkron</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pockets.map((pocket) => {
            const theme = getPocketTheme(pocket.color);
            const targetPct = pocket.targetBalance && pocket.targetBalance > 0
              ? Math.min(100, Math.round((pocket.balance / pocket.targetBalance) * 100))
              : null;

            return (
              <div
                key={pocket.id}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.bgGradient} p-5 text-white shadow-xl ${theme.glow} flex flex-col justify-between border border-white/10 transition-transform duration-200 hover:-translate-y-1`}
              >
                {/* Pocket Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md shadow-inner text-white">
                        {renderPocketIcon(pocket.iconName, 'w-6 h-6')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base sm:text-lg tracking-tight text-white leading-tight">
                            {pocket.name}
                          </h3>
                        </div>
                        {pocket.accountNumber && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-white/70 tracking-wider">
                              {pocket.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(pocket.accountNumber!, pocket.id)}
                              className="text-white/60 hover:text-white transition-colors"
                              title="Salin nomor kantong"
                            >
                              {copiedId === pocket.id ? (
                                <Check className="w-3 h-3 text-emerald-300" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pocket Badges / Options */}
                    <div className="flex items-center gap-1">
                      {pocket.isPrimary ? (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                          Kantong Utama
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeletePocket(pocket)}
                          className="p-1 text-white/60 hover:text-rose-300 hover:bg-rose-900/40 rounded transition-colors"
                          title="Hapus kantong kustom"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-white/80 line-clamp-2 min-h-[32px] mb-4">
                    {pocket.description}
                  </p>

                  {/* Current Balance */}
                  <div className="bg-black/25 backdrop-blur-md rounded-xl p-3.5 border border-white/10 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-white/70">Saldo Tersedia</span>
                      <button
                        type="button"
                        onClick={() => openAdjustFor(pocket)}
                        className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-lg transition-colors border border-white/20 active:scale-95"
                        title="Sesuaikan saldo riil (Opname kas atau mutasi bank)"
                      >
                        <Sliders className="w-3 h-3 shrink-0" />
                        <span>Sesuaikan Saldo</span>
                      </button>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                      {hideBalances ? 'Rp ••••••••' : `Rp ${pocket.balance.toLocaleString('id-ID')}`}
                    </div>

                    {/* Target Progress Bar (Optional) */}
                    {pocket.targetBalance && pocket.targetBalance > 0 && targetPct !== null && (
                      <div className="mt-2.5 pt-2 border-t border-white/10">
                        <div className="flex justify-between text-[11px] text-white/80 mb-1">
                          <span>Target: Rp {pocket.targetBalance.toLocaleString('id-ID')}</span>
                          <span className="font-bold">{targetPct}%</span>
                        </div>
                        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${theme.barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${targetPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pocket Quick Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => openTransferFrom(pocket.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-center"
                    title="Pindahkan saldo dari kantong ini"
                  >
                    <ArrowRightLeft className="w-4 h-4 mb-1 text-white" />
                    <span className="text-[11px] font-semibold text-white">Pindah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openDepositTo(pocket.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-center"
                    title="Isi kas ke kantong ini"
                  >
                    <ArrowDownLeft className="w-4 h-4 mb-1 text-emerald-200" />
                    <span className="text-[11px] font-semibold text-white">Isi Kas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openWithdrawFrom(pocket.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-center"
                    title="Pakai atau tarik dana dari kantong ini"
                  >
                    <ArrowUpRight className="w-4 h-4 mb-1 text-rose-200" />
                    <span className="text-[11px] font-semibold text-white">Pakai</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Mutasi Ledger (Riwayat Transaksi Kantong) */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
              <span>Mutasi & Riwayat Transaksi Kantong</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500">
              Audit log real-time perpindahan dana, setoran penjualan, dan pengeluaran operasional
            </p>
          </div>

          {/* Filter Bar (Responsive on Mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              {/* Filter Pocket */}
              <select
                value={selectedPocketFilter}
                onChange={(e) => setSelectedPocketFilter(e.target.value)}
                className="w-full sm:w-auto text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kantong</option>
                {pockets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Filter Transaction Type */}
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="w-full sm:w-auto text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Tipe</option>
                <option value="transfer">Pindah Kantong</option>
                <option value="deposit">Pemasukan / Setor</option>
                <option value="withdrawal">Pengeluaran / Tarik</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-zinc-200">
            <Wallet className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-zinc-700">Belum ada transaksi di filter ini</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Gunakan tombol "Pindah Saldo" di atas untuk mencoba memindahkan dana antar kantong kas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredTransactions.map((tx) => {
              const isTransferIn = tx.type === 'transfer_in';
              const isTransferOut = tx.type === 'transfer_out';
              const isDeposit = tx.type === 'deposit';
              const isWithdraw = tx.type === 'withdrawal' || tx.type === 'expense';

              return (
                <div
                  key={tx.id}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/70 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isTransferIn || isDeposit
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isTransferIn ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      ) : isTransferOut ? (
                        <ArrowUpRight className="w-4 h-4 text-rose-600" />
                      ) : isDeposit ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-600" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900">
                          {tx.description}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {tx.category || 'Kas'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
                        <span className="font-medium text-zinc-700">{tx.pocketName}</span>
                        {tx.counterpartyPocketName && (
                          <span className="text-zinc-400">
                            ↔ {tx.counterpartyPocketName}
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(tx.createdAt || tx.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {tx.referenceNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-zinc-400">
                              Ref: {tx.referenceNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nominal and balance after */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-black tracking-tight ${
                        isTransferIn || isDeposit ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isTransferIn || isDeposit ? '+' : '-'}
                      Rp {tx.amount.toLocaleString('id-ID')}
                    </div>
                    {tx.balanceAfter !== undefined && (
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Sisa: Rp {tx.balanceAfter.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: PINDAH SALDO ANTAR KANTONG                     */}
      {/* ======================================================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <ArrowRightLeft className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Pindah Saldo Antar Kantong</h3>
                  <p className="text-[11px] sm:text-xs text-indigo-200">Pindahkan dana instan antar kantong kas tanpa potongan biaya</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 touch-pan-y">
              {/* Source & Target Pocket Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center relative">
                {/* Source Pocket */}
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 block">
                    Dari Kantong (Asal)
                  </label>
                  <select
                    value={transferSource}
                    onChange={(e) => setTransferSource(e.target.value)}
                    className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    {pockets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {currentSourcePocket && (
                    <div className="text-[11px] text-zinc-500 pt-1">
                      Saldo: <span className="font-bold text-emerald-700">Rp {currentSourcePocket.balance.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                {/* Target Pocket */}
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 block">
                    Ke Kantong (Tujuan)
                  </label>
                  <select
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    {pockets.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.id === transferSource}>
                        {p.name} {p.id === transferSource ? '(Asal)' : ''}
                      </option>
                    ))}
                  </select>
                  {currentTargetPocket && (
                    <div className="text-[11px] text-zinc-500 pt-1">
                      Saldo Saat Ini: <span className="font-bold text-zinc-700">Rp {currentTargetPocket.balance.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 flex items-center justify-between">
                  <span>Nominal Transfer (Rp)</span>
                  {currentSourcePocket && (
                    <span className="text-[11px] text-zinc-500 font-normal">
                      Maks: Rp {currentSourcePocket.balance.toLocaleString('id-ID')}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={currentSourcePocket?.balance || 0}
                    value={transferAmount || ''}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-2.5 text-lg font-black text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Quick Shortcuts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[500000, 1000000, 2500000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferAmount(amt)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-700 border border-zinc-200 transition-colors"
                    >
                      +Rp {(amt / 1000).toLocaleString('id-ID')}rb
                    </button>
                  ))}
                  {currentSourcePocket && currentSourcePocket.balance > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setTransferAmount(Math.floor(currentSourcePocket.balance * 0.5))}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                      >
                        50% Saldo
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransferAmount(currentSourcePocket.balance)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        Semua (100%)
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Simulation Result Preview */}
              {transferAmount > 0 && currentSourcePocket && currentTargetPocket && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1.5 text-xs">
                  <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pratinjau Saldo Setelah Transfer:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-zinc-600 block">{currentSourcePocket.name}:</span>
                      <span className="font-bold text-zinc-900">
                        Rp {(currentSourcePocket.balance - transferAmount).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block">{currentTargetPocket.name}:</span>
                      <span className="font-bold text-emerald-700">
                        Rp {(currentTargetPocket.balance + transferAmount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Category & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Kategori</label>
                  <select
                    value={transferCategory}
                    onChange={(e) => setTransferCategory(e.target.value)}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Alokasi Rutin">Alokasi Rutin</option>
                    <option value="Belanja Bahan Baku">Belanja Green Bean</option>
                    <option value="Bagi Hasil Dividen">Bagi Hasil Dividen</option>
                    <option value="Cadangan Kas">Cadangan Kas</option>
                    <option value="Pindah Kantong">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Catatan Transfer</label>
                  <input
                    type="text"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Contoh: Belanja 100kg Arabica Gayo"
                    className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer || transferAmount <= 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmittingTransfer ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Konfirmasi Pindah Saldo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ISI KAS / SETOR DANA (TOP UP KANTONG)            */}
      {/* ======================================================== */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Isi Kas / Setor Dana</h3>
                  <p className="text-[11px] sm:text-xs text-emerald-200">Pemasukan uang ke kantong kas roastery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteDeposit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 touch-pan-y">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Pilih Kantong Tujuan</label>
                <select
                  value={depositPocketId}
                  onChange={(e) => setDepositPocketId(e.target.value)}
                  className="w-full text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                >
                  {pockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Saldo: Rp {p.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Nominal Setor (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-2 text-base font-black text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[1000000, 5000000, 10000000, 25000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className="px-2 py-0.5 text-xs rounded bg-zinc-100 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700 border border-zinc-200"
                    >
                      +Rp {(amt / 1000000).toLocaleString('id-ID')}jt
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Kategori Pemasukan</label>
                <select
                  value={depositCategory}
                  onChange={(e) => setDepositCategory(e.target.value)}
                  className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Penjualan Kopi">Penjualan Kopi (Invoice / Kasir)</option>
                  <option value="Setoran Modal Owner">Setoran Modal Owner</option>
                  <option value="Pembayaran Mitra">Pelunasan Tagihan Mitra</option>
                  <option value="Pemasukan Lain">Pemasukan Lain</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Keterangan / Sumber Dana</label>
                <input
                  type="text"
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  placeholder="Contoh: Penerimaan pembayaran batch sangrai cafe"
                  className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDeposit || depositAmount <= 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmittingDeposit ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Setoran Kas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: TARIK DANA / PENGELUARAN (WITHDRAWAL)            */}
      {/* ======================================================== */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-rose-700 to-amber-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <ArrowUpRight className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Tarik Dana / Belanja Operasional</h3>
                  <p className="text-[11px] sm:text-xs text-rose-200">Pengeluaran kas dari kantong yang dipilih</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteWithdraw} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 touch-pan-y">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Pilih Kantong Sumber</label>
                <select
                  value={withdrawPocketId}
                  onChange={(e) => setWithdrawPocketId(e.target.value)}
                  className="w-full text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500"
                >
                  {pockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Tersedia: Rp {p.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Nominal Pengeluaran (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={withdrawAmount || ''}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-2 text-base font-black text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Kategori Biaya</label>
                <select
                  value={withdrawCategory}
                  onChange={(e) => setWithdrawCategory(e.target.value)}
                  className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Belanja Green Bean">Belanja Green Bean (Bahan Baku)</option>
                  <option value="Kemasan & Pouch">Kemasan & Karung Goni</option>
                  <option value="Gas & Listrik Roaster">Gas Roaster & Listrik</option>
                  <option value="Ongkos Kirim Loket">Ongkos Kirim Loket L300 / Bus</option>
                  <option value="Gaji & Upah Roaster">Gaji & Upah Roaster</option>
                  <option value="Dividen Owner">Tarik Dividen / Bagi Hasil</option>
                  <option value="Biaya Operasional">Biaya Operasional Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Keterangan Pengeluaran</label>
                <input
                  type="text"
                  value={withdrawDescription}
                  onChange={(e) => setWithdrawDescription(e.target.value)}
                  placeholder="Contoh: Belanja 50kg Arabica Gayo Natural ke Koperasi"
                  className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || withdrawAmount <= 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmittingWithdraw ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  <span>Konfirmasi Pengeluaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: BUAT / EDIT KANTONG BARU                        */}
      {/* ======================================================== */}
      {showPocketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-zinc-800 to-zinc-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <Wallet className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {editingPocketId ? 'Edit Kantong' : 'Buat Kantong Kas Baru'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-300">Tambahkan kantong anggaran terpisah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPocketModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePocket} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 touch-pan-y">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Nama Kantong</label>
                <input
                  type="text"
                  value={pocketName}
                  onChange={(e) => setPocketName(e.target.value)}
                  placeholder="Contoh: Kantong Pajak & Zakat, Kantong THR"
                  className="w-full text-xs font-medium bg-white border border-zinc-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Tema Warna</label>
                  <select
                    value={pocketColor}
                    onChange={(e) => setPocketColor(e.target.value)}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="emerald">Emerald (Hijau Kas)</option>
                    <option value="amber">Amber (Oranye Penjualan)</option>
                    <option value="indigo">Indigo (Ungu Laba)</option>
                    <option value="rose">Rose (Merah Operasional)</option>
                    <option value="blue">Blue (Biru Tabungan)</option>
                    <option value="cyan">Cyan (Teal Logistik)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Ikon Kantong</label>
                  <select
                    value={pocketIcon}
                    onChange={(e) => setPocketIcon(e.target.value)}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PiggyBank">Tabungan (PiggyBank)</option>
                    <option value="Warehouse">Gudang (Warehouse)</option>
                    <option value="Receipt">Struk (Receipt)</option>
                    <option value="TrendingUp">Investasi (TrendingUp)</option>
                    <option value="Coins">Koin (Coins)</option>
                    <option value="Building">Gedung / Cabang</option>
                  </select>
                </div>
              </div>

              {!editingPocketId && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Saldo Awal (Opsional)</label>
                  <input
                    type="number"
                    min="0"
                    value={pocketInitialBalance || ''}
                    onChange={(e) => setPocketInitialBalance(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-medium bg-white border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Target Simpanan (Opsional)</label>
                <input
                  type="number"
                  min="0"
                  value={pocketTarget || ''}
                  onChange={(e) => setPocketTarget(Number(e.target.value))}
                  placeholder="Contoh: 20000000"
                  className="w-full text-xs font-medium bg-white border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Tujuan & Deskripsi Kantong</label>
                <textarea
                  rows={2}
                  value={pocketDescription}
                  onChange={(e) => setPocketDescription(e.target.value)}
                  placeholder="Deskripsikan peruntukan kantong ini..."
                  className="w-full text-xs bg-white border border-zinc-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowPocketModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all"
                >
                  Simpan Kantong
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: SESUAIKAN SALDO AKTUAL (OPNAME KAS / REKENING)  */}
      {/* ======================================================== */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <Sliders className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Sesuaikan Saldo Aktual (Opname Kas)</h3>
                  <p className="text-[11px] sm:text-xs text-amber-200">Rekonsiliasi saldo kantong dengan kas fisik atau mutasi bank</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAdjust} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 touch-pan-y">
              {/* Pocket Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Pilih Kantong Kas yang Ingin Disesuaikan
                </label>
                <select
                  value={adjustPocketId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setAdjustPocketId(newId);
                    const targetPocket = pockets.find((p) => p.id === newId);
                    if (targetPocket) {
                      setAdjustNewBalance(targetPocket.balance);
                      setAdjustNotes(`Penyesuaian saldo riil ${targetPocket.name}`);
                    }
                  }}
                  className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500"
                >
                  {pockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Saldo saat ini: Rp {p.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current vs New Balance */}
              {(() => {
                const currentPocket = pockets.find((p) => p.id === adjustPocketId);
                const curBalance = currentPocket ? currentPocket.balance : 0;
                const diff = (adjustNewBalance || 0) - curBalance;

                return (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                        <span>Saldo Tercatat Saat Ini:</span>
                        <span className="font-mono font-bold text-zinc-700">Rp {curBalance.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Selisih Penyesuaian:</span>
                        <span
                          className={`font-mono font-bold ${
                            diff > 0
                              ? 'text-emerald-600'
                              : diff < 0
                              ? 'text-rose-600'
                              : 'text-zinc-500'
                          }`}
                        >
                          {diff > 0 ? `+Rp ${diff.toLocaleString('id-ID')} (Surplus)` : diff < 0 ? `-Rp ${Math.abs(diff).toLocaleString('id-ID')} (Defisit)` : 'Rp 0 (Sama)'}
                        </span>
                      </div>
                    </div>

                    {/* Quick ERP Value Shortcut for This Pocket */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-zinc-500 w-full font-medium">Isi Cepat Berdasarkan Nilai Riil:</span>
                      {currentPocket?.id === 'pock-penjualan' && (
                        <button
                          type="button"
                          onClick={() => setAdjustNewBalance(actualPaidSales)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          Faktur Lunas: Rp {actualPaidSales.toLocaleString('id-ID')}
                        </button>
                      )}
                      {currentPocket?.id === 'pock-gudang' && (
                        <button
                          type="button"
                          onClick={() => setAdjustNewBalance(actualGreenBeanStockValue)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                        >
                          Valuasi Stok: Rp {actualGreenBeanStockValue.toLocaleString('id-ID')}
                        </button>
                      )}
                      {currentPocket?.id === 'pock-laba' && (
                        <button
                          type="button"
                          onClick={() => setAdjustNewBalance(actualEstimatedProfit)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                        >
                          Margin Laba: Rp {actualEstimatedProfit.toLocaleString('id-ID')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAdjustNewBalance(curBalance + 1000000)}
                        className="px-2 py-1 text-[11px] rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors"
                      >
                        +1 Juta
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustNewBalance(curBalance + 5000000)}
                        className="px-2 py-1 text-[11px] rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors"
                      >
                        +5 Juta
                      </button>
                    </div>

                    {/* New Balance Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700">
                        Saldo Aktual Riil (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                          Rp
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={adjustNewBalance || ''}
                          onChange={(e) => setAdjustNewBalance(Number(e.target.value))}
                          placeholder="0"
                          className="w-full pl-11 pr-4 py-2.5 text-lg font-black text-zinc-900 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Notes Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Alasan / Keterangan Penyesuaian
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Opname fisik laci kasir per akhir pekan, rekonsiliasi mutasi BCA"
                  className="w-full text-xs bg-white border border-zinc-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmittingAdjust && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingAdjust ? 'Menyimpan...' : 'Perbarui Saldo Aktual'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
