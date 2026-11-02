import React, { useState, useEffect, useRef } from 'react';
import {
  Coins,
  Calculator,
  QrCode,
  Upload,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  Truck,
  Ship,
  Store,
  Building2,
  Save,
  Printer,
  Download,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  CreditCard,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Maximize2,
  Minimize2,
  ArrowRight,
  Clock,
  Layers,
  ShoppingBag,
  FileText,
  BadgeAlert,
  Wallet,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { CoffeeBean, PricingTier, QrisPaymentConfig, Order, PaymentStatus, BankAccountItem } from '../../types/erp';
import {
  formatIDR,
  saveBean,
  getQrisConfig,
  saveQrisConfig,
  subscribeToQrisConfig,
  DEFAULT_QRIS_CONFIG,
  updateOrderPaymentStatus,
  buildWhatsAppLink,
  saveNotificationLog
} from '../../services/dbService';

interface FinanceAndPricingProps {
  beans: CoffeeBean[];
  orders?: Order[];
  onRefresh: () => void;
  onNavigateToShipping?: () => void;
  onNavigateToOrders?: () => void;
}

export const FinanceAndPricing: React.FC<FinanceAndPricingProps> = ({
  beans,
  orders = [],
  onRefresh,
  onNavigateToShipping,
  onNavigateToOrders
}) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'pricing' | 'qris' | 'shipping-buffer'>('tracker');
  const [selectedBeanId, setSelectedBeanId] = useState<string>(beans[0]?.id || '');

  // QRIS GoPay Config State
  const [qrisConfig, setQrisConfig] = useState<QrisPaymentConfig>(DEFAULT_QRIS_CONFIG);
  const [isSavingQris, setIsSavingQris] = useState(false);
  const [qrisSaveSuccess, setQrisSaveSuccess] = useState(false);
  const [qrisSuccessToast, setQrisSuccessToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Customer Display Modal State
  const [isCustomerDisplayOpen, setIsCustomerDisplayOpen] = useState(false);
  const [copiedGopay, setCopiedGopay] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // Selected Order for Quick Pay / QRIS Scan Modal
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<Order | null>(null);

  // Alternative Bank Accounts state & modal
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankNameInput, setBankNameInput] = useState('Bank Mandiri');
  const [bankAccNumberInput, setBankAccNumberInput] = useState('');
  const [bankAccHolderInput, setBankAccHolderInput] = useState('');
  const [bankIsPrimaryInput, setBankIsPrimaryInput] = useState(false);

  // Payment Tracker Filter & Search State
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [paymentIslandFilter, setPaymentIslandFilter] = useState<string>('all');
  const [paymentSaveToast, setPaymentSaveToast] = useState('');

  // Subscribe to real-time QRIS updates
  useEffect(() => {
    const unsub = subscribeToQrisConfig(setQrisConfig);
    return () => unsub();
  }, []);

  // Ensure selectedBeanId is valid when beans list loads or changes
  useEffect(() => {
    if (beans.length > 0 && (!selectedBeanId || !beans.some((b) => b.id === selectedBeanId))) {
      setSelectedBeanId(beans[0].id);
    }
  }, [beans, selectedBeanId]);

  // Selected bean state for HPP & Pricing
  const currentBean = beans.find((b) => b.id === selectedBeanId) || beans[0];

  // Editable HPP & 3-Tier Prices
  const [costGreen, setCostGreen] = useState<number>(currentBean?.costGreenPerKg || 90000);
  const [costRoast, setCostRoast] = useState<number>(currentBean?.costRoastingPerKg || 15000);
  const [costPack, setCostPack] = useState<number>(currentBean?.costPackagingPerKg || 8000);
  const [costOverhead, setCostOverhead] = useState<number>(currentBean?.costOverheadPerKg || 7000);

  const [priceLocal, setPriceLocal] = useState<number>(currentBean?.priceLocalPerKg || 145000);
  const [priceUmkm, setPriceUmkm] = useState<number>(currentBean?.priceUmkmPerKg || 135000);
  const [priceLuarPulau, setPriceLuarPulau] = useState<number>(currentBean?.priceLuarPulauPerKg || 165000);

  const [isSavingHpp, setIsSavingHpp] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Sync state when selected bean changes
  useEffect(() => {
    if (currentBean) {
      setCostGreen(currentBean.costGreenPerKg || 90000);
      setCostRoast(currentBean.costRoastingPerKg || 15000);
      setCostPack(currentBean.costPackagingPerKg || 8000);
      setCostOverhead(currentBean.costOverheadPerKg || 7000);
      setPriceLocal(currentBean.priceLocalPerKg || 145000);
      setPriceUmkm(currentBean.priceUmkmPerKg || 135000);
      setPriceLuarPulau(currentBean.priceLuarPulauPerKg || 165000);
    }
  }, [selectedBeanId, currentBean]);

  // Total HPP / kg
  const totalHpp = costGreen + costRoast + costPack + costOverhead;

  // Margin Calculations
  const calcMargin = (price: number) => {
    const grossProfit = price - totalHpp;
    const marginPct = price > 0 ? (grossProfit / price) * 100 : 0;
    return { grossProfit, marginPct };
  };

  const marginLocal = calcMargin(priceLocal);
  const marginUmkm = calcMargin(priceUmkm);
  const marginLuarPulau = calcMargin(priceLuarPulau);

  const handleSaveBeanPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHpp(true);
    try {
      let targetBean = currentBean;
      if (!targetBean) {
        // Otomatis daftarkan produk kopi baru jika database sedang kosong
        targetBean = {
          id: `bean-${Date.now().toString(36)}`,
          name: 'Arabika Gayo Specialty Grade 1',
          origin: 'Takengon, Aceh Tengah (1,500 mdpl)',
          variety: 'Tim-tim & Bourbon',
          process: 'Washed',
          grade: 'Specialty',
          stockGreenKg: 0,
          stockRoastedKg: 0,
          minAlertKg: 50,
          costGreenPerKg: Number(costGreen),
          costRoastingPerKg: Number(costRoast),
          costPackagingPerKg: Number(costPack),
          costOverheadPerKg: Number(costOverhead),
          hppPerKg: Number(totalHpp),
          priceLocalPerKg: Number(priceLocal),
          priceUmkmPerKg: Number(priceUmkm),
          priceLuarPulauPerKg: Number(priceLuarPulau),
          storageLocation: 'Silo A-01 (Gudang Gayo)',
          moistureAvgPercent: 11.2,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await saveBean(targetBean);
        setSelectedBeanId(targetBean.id);
        setSaveSuccessMsg(`Berhasil membuat produk kopi baru & menyimpan HPP untuk ${targetBean.name}!`);
      } else {
        const updated: CoffeeBean = {
          ...targetBean,
          costGreenPerKg: Number(costGreen),
          costRoastingPerKg: Number(costRoast),
          costPackagingPerKg: Number(costPack),
          costOverheadPerKg: Number(costOverhead),
          hppPerKg: Number(totalHpp),
          priceLocalPerKg: Number(priceLocal),
          priceUmkmPerKg: Number(priceUmkm),
          priceLuarPulauPerKg: Number(priceLuarPulau),
          updatedAt: new Date().toISOString()
        };
        await saveBean(updated);
        setSaveSuccessMsg(`Berhasil menyimpan HPP dan harga untuk ${targetBean.name}!`);
      }
      setTimeout(() => setSaveSuccessMsg(''), 4500);
      onRefresh();
    } catch (err) {
      console.error('Error saving HPP:', err);
      setSaveSuccessMsg('Data HPP berhasil disimpan di memori lokal.');
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    } finally {
      setIsSavingHpp(false);
    }
  };

  // Kompresi gambar canvas otomatis agar file kecil (<60KB) dan muat di localStorage & Firestore tanpa error kuota
  const compressImageFile = (file: File, maxDim = 640, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
          } else {
            resolve(evt.target?.result as string || '');
          }
        };
        img.onerror = () => resolve(evt.target?.result as string || '');
        img.src = evt.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // QRIS Image File Upload Handler with Auto-Compress & Auto-Save
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (.png, .jpg, .jpeg, .webp)');
      return;
    }

    try {
      setIsSavingQris(true);
      const compressedBase64 = await compressImageFile(file);
      if (!compressedBase64) {
        alert('Gagal memproses gambar. Silakan coba kembali.');
        return;
      }

      const updated: QrisPaymentConfig = {
        ...qrisConfig,
        qrisImageUrl: compressedBase64,
        updatedAt: new Date().toISOString()
      };

      setQrisConfig(updated);
      // Auto-save immediately to localStorage and Firestore
      await saveQrisConfig(updated);
      setQrisSaveSuccess(true);
      setQrisSuccessToast('Gambar QRIS GoPay berhasil diunggah & langsung disimpan!');
      setTimeout(() => {
        setQrisSaveSuccess(false);
        setQrisSuccessToast('');
      }, 4500);
    } catch (err) {
      console.error('Error saving uploaded QRIS image:', err);
      alert('Gagal menyimpan gambar QRIS. Silakan coba lagi.');
    } finally {
      setIsSavingQris(false);
    }
  };

  const handleSaveQrisSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQris(true);
    try {
      await saveQrisConfig(qrisConfig);
      setQrisSaveSuccess(true);
      setQrisSuccessToast('Pengaturan QRIS GoPay & petunjuk transfer berhasil disimpan!');
      setTimeout(() => {
        setQrisSaveSuccess(false);
        setQrisSuccessToast('');
      }, 4500);
    } catch (err) {
      console.error('Error saving QRIS settings:', err);
      alert('Gagal menyimpan pengaturan QRIS ke server. Pengaturan tetap disimpan di cache perangkat Anda.');
    } finally {
      setIsSavingQris(false);
    }
  };

  const handleCopyGopay = () => {
    navigator.clipboard.writeText(qrisConfig.gopayNumber);
    setCopiedGopay(true);
    setTimeout(() => setCopiedGopay(false), 2000);
  };

  const handleCopyBank = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Bank Account Handlers (Add, Edit, Delete, Toggle Primary)
  const handleOpenAddBank = () => {
    setEditingBankId(null);
    setBankNameInput('Bank Mandiri');
    setBankAccNumberInput('');
    setBankAccHolderInput(qrisConfig.accountHolder || 'PT Kofiara Nusantara Berjaya');
    setBankIsPrimaryInput(false);
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (b: BankAccountItem) => {
    setEditingBankId(b.id);
    setBankNameInput(b.bankName);
    setBankAccNumberInput(b.accountNumber);
    setBankAccHolderInput(b.accountHolder);
    setBankIsPrimaryInput(!!b.isPrimary);
    setIsBankModalOpen(true);
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNameInput || !bankAccNumberInput) return;

    let currentList = qrisConfig.alternativeBankAccounts || [];

    if (editingBankId) {
      currentList = currentList.map((item) => {
        if (item.id === editingBankId) {
          return {
            ...item,
            bankName: bankNameInput,
            accountNumber: bankAccNumberInput,
            accountHolder: bankAccHolderInput || qrisConfig.accountHolder,
            isPrimary: bankIsPrimaryInput
          };
        }
        return bankIsPrimaryInput ? { ...item, isPrimary: false } : item;
      });
    } else {
      const newAcc: BankAccountItem = {
        id: `bank-${Date.now()}`,
        bankName: bankNameInput,
        accountNumber: bankAccNumberInput,
        accountHolder: bankAccHolderInput || qrisConfig.accountHolder,
        isPrimary: bankIsPrimaryInput
      };
      if (bankIsPrimaryInput) {
        currentList = currentList.map((item) => ({ ...item, isPrimary: false }));
      }
      currentList = [...currentList, newAcc];
    }

    const updatedConfig: QrisPaymentConfig = {
      ...qrisConfig,
      alternativeBankAccounts: currentList,
      updatedAt: new Date().toISOString()
    };

    setQrisConfig(updatedConfig);
    await saveQrisConfig(updatedConfig);
    setIsBankModalOpen(false);
    setQrisSuccessToast(editingBankId ? 'Data rekening bank berhasil diperbarui!' : 'Rekening bank baru berhasil ditambahkan!');
    setQrisSaveSuccess(true);
    setTimeout(() => {
      setQrisSaveSuccess(false);
      setQrisSuccessToast('');
    }, 4000);
  };

  const handleDeleteBankAccount = async (id: string) => {
    const currentList = (qrisConfig.alternativeBankAccounts || []).filter((b) => b.id !== id);
    const updatedConfig: QrisPaymentConfig = {
      ...qrisConfig,
      alternativeBankAccounts: currentList,
      updatedAt: new Date().toISOString()
    };
    setQrisConfig(updatedConfig);
    await saveQrisConfig(updatedConfig);
    setQrisSuccessToast('Rekening bank berhasil dihapus.');
    setQrisSaveSuccess(true);
    setTimeout(() => {
      setQrisSaveSuccess(false);
      setQrisSuccessToast('');
    }, 3500);
  };

  // Handle direct payment status change
  const handleUpdatePaymentStatus = async (orderId: string, newStatus: PaymentStatus) => {
    try {
      await updateOrderPaymentStatus(orderId, newStatus);
      if (selectedOrderForPay && selectedOrderForPay.id === orderId) {
        setSelectedOrderForPay((prev) => (prev ? { ...prev, paymentStatus: newStatus } : null));
      }
      setPaymentSaveToast(`Status faktur berhasil diubah menjadi: "${newStatus}"`);
      setTimeout(() => setPaymentSaveToast(''), 3500);
      onRefresh();
    } catch (err) {
      console.error('Error updating order payment status:', err);
    }
  };

  // WhatsApp Payment Reminder / Receipt
  const handleSendPaymentWhatsApp = (order: Order) => {
    const isLunas = order.paymentStatus === 'Paid in Full';
    const isDP = order.paymentStatus === 'Down Payment';

    const bankListStr = (qrisConfig.alternativeBankAccounts && qrisConfig.alternativeBankAccounts.length > 0)
      ? qrisConfig.alternativeBankAccounts.map((b) => `• ${b.bankName}: ${b.accountNumber} a.n ${b.accountHolder}${b.isPrimary ? ' (Utama)' : ''}`).join('\n')
      : `• Bank Mandiri: 137-00-19283-009 / BCA: 872-0091-233\nA/N: ${qrisConfig.accountHolder || 'PT Kofiara Nusantara Berjaya'}`;

    let text = '';
    if (isLunas) {
      text = `*BUKTI PEMBAYARAN LUNAS KOFIARA ROASTERY*\n\nYth. ${order.customerName},\nTerima kasih! Pembayaran untuk Faktur *${order.invoiceNumber}* sebesar *${formatIDR(order.grandTotal)}* telah kami terima LUNAS.\n\nPesanan sedang dipersiapkan untuk pengiriman ke ${order.destinationIsland}.\nSalam hangat,\n*Kofiara Hub Lhokseumawe*`;
    } else if (isDP) {
      text = `*INFORMASI PEMBAYARAN DP KOFIARA ROASTERY*\n\nYth. ${order.customerName},\nPembayaran Uang Muka (DP) untuk Faktur *${order.invoiceNumber}* telah kami catat. Total tagihan: *${formatIDR(order.grandTotal)}*.\n\nSisa tagihan dapat diselesaikan via scan QRIS GoPay saat barang tiba atau transfer sebelum dispatch.\nTerima kasih!`;
    } else {
      text = `*TAGIHAN PEMBAYARAN FAKTUR KOFIARA ROASTERY*\n\nYth. ${order.customerName},\nBerikut rincian tagihan pesanan kopi Anda:\n• No. Faktur: *${order.invoiceNumber}*\n• Total Tagihan: *${formatIDR(order.grandTotal)}*\n• Tujuan: ${order.customerAddress} (${order.destinationIsland})\n\nSilakan lakukan pembayaran cepat via QRIS GoPay dengan scan barcode QRIS kami atau transfer ke rekening resmi kami:\n${bankListStr}\n\nKonfirmasikan bukti bayar setelah transfer. Terima kasih!`;
    }

    saveNotificationLog({
      id: `notif-${Date.now().toString(36)}`,
      channel: 'WhatsApp',
      recipient: `${order.customerName} (${order.customerPhone})`,
      subject: `Konfirmasi Pembayaran ${order.invoiceNumber}`,
      messagePreview: text.substring(0, 100) + '...',
      type: 'Order Invoice',
      status: 'Sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    window.open(buildWhatsAppLink(order.customerPhone, text), '_blank');
  };

  // Payment Tracking Calculations
  const totalOrdersCount = orders.length;
  const unpaidOrders = orders.filter((o) => o.paymentStatus === 'Unpaid');
  const dpOrders = orders.filter((o) => o.paymentStatus === 'Down Payment');
  const paidOrders = orders.filter((o) => o.paymentStatus === 'Paid in Full');

  const totalUnpaidNominal = unpaidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalDpNominal = dpOrders.reduce((sum, o) => sum + (o.grandTotal * 0.5), 0); // Estimated 50% collected
  const totalPaidNominal = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalReceivables = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const collectionRate = totalReceivables > 0 ? ((totalPaidNominal + totalDpNominal) / totalReceivables) * 100 : 0;

  // Filtered Orders for the Payment Tracker
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.invoiceNumber.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      o.customerPhone.includes(paymentSearch) ||
      o.destinationIsland.toLowerCase().includes(paymentSearch.toLowerCase());

    const matchesStatus =
      paymentStatusFilter === 'all' || o.paymentStatus === paymentStatusFilter;

    const matchesIsland =
      paymentIslandFilter === 'all' || o.destinationIsland === paymentIslandFilter;

    return matchesSearch && matchesStatus && matchesIsland;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-950 via-zinc-900 to-amber-950 p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
              <Coins className="h-3.5 w-3.5 text-emerald-300" />
              Keuangan, HPP & Pembayaran QRIS
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-2 text-white">
              Pelacak Status Pembayaran, Display QRIS GoPay, & Manajemen HPP
            </h2>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
              Pantau status pelunasan faktur pesanan (Lunas / DP / Belum Bayar), tampilkan barcode <strong>QRIS GoPay</strong> untuk pelanggan di kasir, dan atur struktur modal HPP 3-tier harga kopi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCustomerDisplayOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-sm hover:bg-amber-400 transition-all active:scale-95"
            >
              <Maximize2 className="h-4 w-4" />
              Tampilkan QRIS Kasir Pelanggan
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-700/60 pt-4 text-xs">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
              activeTab === 'tracker'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Wallet className="h-3.5 w-3.5 text-emerald-600" />
            Pelacak Pembayaran Pesanan ({unpaidOrders.length} Belum Lunas)
          </button>

          <button
            onClick={() => setActiveTab('qris')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
              activeTab === 'qris'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-blue-600" />
            Display & Upload QRIS GoPay
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
              activeTab === 'pricing'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Calculator className="h-3.5 w-3.5 text-amber-500" />
            Hitung HPP & 3-Tier Harga
          </button>

          <button
            onClick={() => setActiveTab('shipping-buffer')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
              activeTab === 'shipping-buffer'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Truck className="h-3.5 w-3.5 text-amber-400" />
            Koneksi Pengiriman Antar Pulau
          </button>
        </div>
      </div>

      {/* SECTION: CUSTOMER-FACING QRIS SHOWCASE CARD (Always visible or toggleable across views) */}
      <div className="rounded-2xl border-2 border-emerald-500/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xs">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-zinc-900 text-base">Display QRIS Pembayaran Pelanggan</span>
                <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  {qrisConfig.qrisImageUrl ? 'Gambar QRIS Siap' : 'Siap Upload'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Barcode pembayaran resmi yang dilihat oleh pelanggan saat scan di meja kasir roastery atau di dalam faktur penjualan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setIsCustomerDisplayOpen(true)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 text-white px-3.5 py-2 text-xs font-bold hover:bg-zinc-800 transition-all shadow-xs"
            >
              <Maximize2 className="h-3.5 w-3.5 text-amber-400" />
              Layar Penuh Standee Kasir
            </button>
            <button
              onClick={() => {
                setActiveTab('qris');
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-emerald-700" />
              Upload / Ganti Gambar
            </button>
          </div>
        </div>

        {/* QRIS Quick Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 items-center">
          {/* QRIS Code Preview Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 shadow-inner">
            <div className="w-48 h-48 rounded-xl bg-white p-2.5 border border-zinc-200 flex flex-col items-center justify-center relative shadow-xs overflow-hidden">
              {qrisConfig.qrisImageUrl ? (
                <img
                  src={qrisConfig.qrisImageUrl}
                  alt="QRIS GoPay KopiFlow"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-2">
                  <QrCode className="h-16 w-16 text-emerald-700 mx-auto mb-1.5 opacity-80" />
                  <span className="rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold block mb-1">
                    Slot QRIS GoPay
                  </span>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    Unggah gambar barcode dari GoPay / GoBiz untuk mengaktifkan scanner.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <span className="font-extrabold text-xs text-zinc-900 block">{qrisConfig.merchantName}</span>
              <span className="text-[10px] text-zinc-500 font-mono">No. GoPay: {qrisConfig.gopayNumber}</span>
            </div>
          </div>

          {/* Quick Info & Payment Instructions */}
          <div className="md:col-span-8 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Akun Merchant GoPay:</span>
                <div className="font-bold text-zinc-900 text-sm flex items-center justify-between">
                  <span className="font-mono">{qrisConfig.gopayNumber}</span>
                  <button
                    onClick={handleCopyGopay}
                    className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold flex items-center gap-1"
                  >
                    {copiedGopay ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedGopay ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <span className="text-[11px] text-zinc-600 block">A/N: {qrisConfig.accountHolder || 'KopiFlow Roastery'}</span>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Rekening Bank Alternatif:</span>
                <div className="font-bold text-zinc-900 text-xs flex items-center justify-between">
                  <span>Mandiri: <strong>137-00-19283-009</strong></span>
                  <button
                    onClick={() => handleCopyBank('1370019283009')}
                    className="text-emerald-700 hover:text-emerald-900 text-[10px] font-semibold"
                  >
                    Salin
                  </button>
                </div>
                <div className="font-bold text-zinc-900 text-xs flex items-center justify-between">
                  <span>BCA: <strong>872-0091-233</strong></span>
                  <button
                    onClick={() => handleCopyBank('8720091233')}
                    className="text-emerald-700 hover:text-emerald-900 text-[10px] font-semibold"
                  >
                    Salin
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Dukungan Aplikasi Pembayaran:
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                Pelanggan dapat melakukan scan QRIS ini menggunakan aplikasi <strong>GoPay, BCA Mobile, Livin' Mandiri, BRImo, BSI Mobile, DANA, OVO, ShopeePay</strong>, atau m-Banking bank manapun di seluruh Indonesia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: PAYMENT TRACKER TOOL (PELACAK STATUS PEMBAYARAN PESANAN) */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          {paymentSaveToast && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              {paymentSaveToast}
            </div>
          )}

          {/* Summary KPI Cards for Orders Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Unpaid */}
            <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Belum Dibayar (Unpaid)</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <BadgeAlert className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {formatIDR(totalUnpaidNominal)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 font-semibold">
                {unpaidOrders.length} faktur menunggu pelunasan
              </p>
            </div>

            {/* Total DP / Uang Muka */}
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Uang Muka (DP 50%)</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-800 font-mono">
                ~{formatIDR(totalDpNominal)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 font-semibold">
                {dpOrders.length} pesanan dengan status DP
              </p>
            </div>

            {/* Total Paid in Full */}
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Sudah Lunas (Paid)</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {formatIDR(totalPaidNominal)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 font-semibold">
                {paidOrders.length} pesanan telah lunas
              </p>
            </div>

            {/* Collection Rate */}
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Tingkat Pelunasan</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-zinc-900 font-mono">
                {collectionRate.toFixed(1)}%
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, collectionRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Payment Tracker Search, Filters & Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-700" />
                  Daftar & Kontrol Status Pembayaran Pesanan
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Klik tombol status pembayaran untuk mengubah status faktur (Unpaid, DP, Lunas) secara langsung.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Cari faktur, pelanggan, HP..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="w-48 sm:w-60 rounded-xl border border-zinc-200 pl-8 pr-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 bg-white focus:border-emerald-600 focus:outline-hidden font-semibold"
                >
                  <option value="all">Semua Status Bayar</option>
                  <option value="Unpaid">Belum Dibayar (Unpaid)</option>
                  <option value="Down Payment">Uang Muka (Down Payment)</option>
                  <option value="Paid in Full">Lunas (Paid in Full)</option>
                </select>

                <select
                  value={paymentIslandFilter}
                  onChange={(e) => setPaymentIslandFilter(e.target.value)}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 bg-white focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="all">Semua Wilayah</option>
                  <option value="Aceh (Lokal Loket)">Aceh (Lokal Loket)</option>
                  <option value="Sumatera">Sumatera</option>
                  <option value="Jawa">Jawa</option>
                  <option value="Kalimantan">Kalimantan</option>
                  <option value="Sulawesi">Sulawesi</option>
                  <option value="Bali & Nusa Tenggara">Bali & Nusa Tenggara</option>
                  <option value="Maluku & Papua">Maluku & Papua</option>
                </select>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <FileText className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-700">Tidak ada data faktur pesanan ditemukan</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  Belum ada pesanan yang sesuai dengan filter pencarian Anda. Buat pesanan baru di tab Pesanan & Kasir.
                </p>
                {onNavigateToOrders && (
                  <button
                    onClick={onNavigateToOrders}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800"
                  >
                    Buka Kasir Pesanan
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    <tr>
                      <th className="py-3 px-4">No. Faktur & Tanggal</th>
                      <th className="py-3 px-4">Pelanggan & Tujuan</th>
                      <th className="py-3 px-4">Muatan Biji Kopi</th>
                      <th className="py-3 px-4 text-right">Total Tagihan (IDR)</th>
                      <th className="py-3 px-4 text-center">Status Pembayaran Saat Ini</th>
                      <th className="py-3 px-4 text-center">Ubah Status Bayar</th>
                      <th className="py-3 px-4 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredOrders.map((ord) => {
                      const isUnpaid = ord.paymentStatus === 'Unpaid';
                      const isDP = ord.paymentStatus === 'Down Payment';
                      const isPaid = ord.paymentStatus === 'Paid in Full';

                      return (
                        <tr key={ord.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-zinc-900 text-xs">
                              {ord.invoiceNumber}
                            </div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-zinc-400" />
                              <span>{ord.orderDate || ord.createdAt.split('T')[0]}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-zinc-900">{ord.customerName}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              <span>{ord.customerPhone}</span>
                              <span className="mx-1">•</span>
                              <span className="font-semibold text-zinc-700">{ord.destinationIsland}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-zinc-800 font-medium truncate max-w-xs">
                              {ord.items.map((i) => `${i.beanName} (${i.quantityKg}kg)`).join(', ')}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">
                              Total: <strong>{ord.totalWeightKg} kg</strong> (Tier: {ord.customerType})
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono font-bold text-sm text-zinc-900">
                              {formatIDR(ord.grandTotal)}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Termasuk ongkir: {formatIDR(ord.shippingCost)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="h-3 w-3" /> Lunas (Paid)
                              </span>
                            )}
                            {isDP && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="h-3 w-3" /> Uang Muka (DP)
                              </span>
                            )}
                            {isUnpaid && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertCircle className="h-3 w-3" /> Belum Dibayar
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 gap-0.5">
                              <button
                                onClick={() => handleUpdatePaymentStatus(ord.id, 'Unpaid')}
                                title="Set ke Belum Dibayar"
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                  isUnpaid
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-zinc-600 hover:text-rose-700 hover:bg-white'
                                }`}
                              >
                                Unpaid
                              </button>
                              <button
                                onClick={() => handleUpdatePaymentStatus(ord.id, 'Down Payment')}
                                title="Set ke Uang Muka (DP)"
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                  isDP
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-zinc-600 hover:text-amber-700 hover:bg-white'
                                }`}
                              >
                                DP
                              </button>
                              <button
                                onClick={() => handleUpdatePaymentStatus(ord.id, 'Paid in Full')}
                                title="Set ke Lunas"
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                  isPaid
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-zinc-600 hover:text-emerald-700 hover:bg-white'
                                }`}
                              >
                                Lunas
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedOrderForPay(ord)}
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 shadow-2xs"
                                title="Tampilkan barcode QRIS dan rincian kasir untuk faktur ini"
                              >
                                <QrCode className="h-3.5 w-3.5 text-emerald-700" />
                                <span>Kasir QRIS</span>
                              </button>

                              <button
                                onClick={() => handleSendPaymentWhatsApp(ord)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800 shadow-2xs"
                                title="Kirim reminder tagihan atau bukti lunas via WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>WA</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRICING & HPP */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {saveSuccessMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {saveSuccessMsg}
            </div>
          )}

          {/* Bean Selector */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Pilih Produk Kopi untuk Dikonfigurasi HPP & Harganya:
              </label>
              <p className="text-xs text-zinc-500 mt-0.5">
                Setiap jenis kopi memiliki biaya beli mentah dan HPP yang berbeda.
              </p>
            </div>

            <select
              value={selectedBeanId}
              onChange={(e) => setSelectedBeanId(e.target.value)}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-900 bg-zinc-50 focus:border-emerald-600 focus:outline-hidden min-w-[260px]"
            >
              {beans.length === 0 ? (
                <option value="">Arabika Gayo Specialty Grade 1 (Kopi Standar)</option>
              ) : (
                beans.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.process})
                  </option>
                ))
              )}
            </select>
          </div>

          <form onSubmit={handleSaveBeanPricing} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: HPP Cost Structure */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-emerald-600" />
                      Komponen HPP (Harga Pokok Produksi per kg)
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Rincian modal produksi dasar per kilogram biji sangrai.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    Modal Dasar
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      1. Biaya Green Beans Mentah (Rp / kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={costGreen}
                      onChange={(e) => setCostGreen(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold text-zinc-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Harga beli dari petani / pabrik ditambah susut roasting (~15-18%).
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      2. Biaya Sangrai / Gas & Listrik Mesin (Rp / kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={costRoast}
                      onChange={(e) => setCostRoast(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold text-zinc-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Konsumsi gas LPG drum roaster, depresiasi mesin, dan operator.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      3. Kemasan Foil Pouch Valve + Zipper + Stiker (Rp / kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={costPack}
                      onChange={(e) => setCostPack(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold text-zinc-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Pouch one-way degassing valve, zipper, dan label printing.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      4. Biaya Overhead & Quality Control (Rp / kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={costOverhead}
                      onChange={(e) => setCostOverhead(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold text-zinc-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Tenaga kerja gudang, cupping QA, dan sewa fasilitas.
                    </p>
                  </div>

                  {/* Total HPP Summary Card */}
                  <div className="rounded-xl bg-zinc-900 p-4 text-white mt-4">
                    <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                      <span>Total HPP Dasar Produksi:</span>
                      <span className="font-mono">Modal Pokok / kg</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {formatIDR(totalHpp)}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Setiap penjualan di atas nominal ini menghasilkan laba kotor positif.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: 3-Tier Selling Price Matrix */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-600" />
                      Penentuan 3-Tingkat Harga Jual (Pricing Matrix)
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Harga jual disesuaikan target pasar dan kebutuhan pengiriman.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    Multi-Tier
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Tier 1: Harga Regular / Lokal */}
                  <div className="rounded-xl border border-zinc-200 p-3.5 bg-zinc-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                        <Store className="h-4 w-4 text-zinc-700" />
                        1. Harga Regular / Lokal
                      </span>
                      <span className="text-[10px] text-zinc-500">Retail / Kedai Lokal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-500">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={priceLocal}
                        onChange={(e) => setPriceLocal(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 font-mono font-bold text-sm bg-white focus:border-amber-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-zinc-600">
                        Laba Kotor: <strong>{formatIDR(marginLocal.grossProfit)}/kg</strong>
                      </span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                          marginLocal.marginPct >= 20
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Margin: {marginLocal.marginPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Tier 2: Harga Khusus Mitra UMKM */}
                  <div className="rounded-xl border border-emerald-200 p-3.5 bg-emerald-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-emerald-700" />
                        2. Harga Khusus Mitra UMKM
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Grosir / Kedai Langganan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-900">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={priceUmkm}
                        onChange={(e) => setPriceUmkm(Number(e.target.value))}
                        className="w-full rounded-lg border border-emerald-300 px-3 py-1.5 font-mono font-bold text-sm bg-white focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-zinc-600">
                        Laba Kotor: <strong>{formatIDR(marginUmkm.grossProfit)}/kg</strong>
                      </span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                          marginUmkm.marginPct >= 15
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Margin: {marginUmkm.marginPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Tier 3: Harga Luar Pulau */}
                  <div className="rounded-xl border border-blue-200 p-3.5 bg-blue-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 flex items-center gap-1.5">
                        <Ship className="h-4 w-4 text-blue-700" />
                        3. Harga Luar Pulau (Buffer Ongkir & Proteksi)
                      </span>
                      <span className="text-[10px] text-blue-700 font-semibold">Jawa, Kalimantan, Sulawesi, Papua</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-900">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={priceLuarPulau}
                        onChange={(e) => setPriceLuarPulau(Number(e.target.value))}
                        className="w-full rounded-lg border border-blue-300 px-3 py-1.5 font-mono font-bold text-sm bg-white focus:border-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-zinc-600">
                        Laba Kotor: <strong>{formatIDR(marginLuarPulau.grossProfit)}/kg</strong>
                      </span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                          marginLuarPulau.marginPct >= 20
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Margin: {marginLuarPulau.marginPct.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-800 mt-1">
                      💡 Harga ini mencakup margin aman untuk subsidi kargo kapal/pesawat dan bubble wrap packing tebal.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingHpp}
                    className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition-colors disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingHpp ? 'Menyimpan...' : 'Simpan HPP & Matriks Harga Kopi'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: QRIS GOPAY PAYMENT CONFIGURATION & CUSTOMER DISPLAY */}
      {activeTab === 'qris' && (
        <div className="space-y-6">
          {qrisSaveSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              {qrisSuccessToast || 'Pengaturan QRIS GoPay berhasil disimpan! Barcode QRIS langsung tampil pada setiap invoice/faktur pesanan pelanggan.'}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: QRIS Live Display & Preview Card (Col 5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border-2 border-emerald-500 bg-white p-6 shadow-md text-center">
                {/* QRIS Indonesia Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-zinc-900 tracking-wider">QRIS</span>
                    <span className="text-[10px] font-semibold text-zinc-400">|</span>
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-widest">
                      GOPAY
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">Pembayaran Digital Cepat</span>
                </div>

                <div className="font-extrabold text-base text-zinc-900 mb-1">
                  {qrisConfig.merchantName || 'KopiFlow Roastery Gayo'}
                </div>
                <div className="text-xs text-zinc-500 mb-4 font-mono">
                  NMID / No. GoPay: {qrisConfig.gopayNumber || '0812-6900-8899'}
                </div>

                {/* QR Code Container */}
                <div className="mx-auto w-64 h-64 rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-inner group">
                  {qrisConfig.qrisImageUrl ? (
                    <img
                      src={qrisConfig.qrisImageUrl}
                      alt="QRIS GoPay KopiFlow"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    /* Default Placeholder SVG when user hasn't uploaded yet */
                    <div className="text-center p-3">
                      <QrCode className="h-28 w-28 text-emerald-700 mx-auto mb-2 opacity-80" />
                      <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 mb-1">
                        Slot QRIS GoPay Siap Dipakai
                      </span>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        Klik tombol <strong>"Upload Gambar QRIS GoPay"</strong> di samping untuk memasukkan foto QRIS toko Anda.
                      </p>
                    </div>
                  )}
                </div>

                {/* Supported Payment Logos */}
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">
                    Dapat Di-scan Melalui:
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-semibold text-zinc-700">
                    <span className="rounded bg-zinc-100 px-2 py-0.5">GoPay</span>
                    <span className="rounded bg-zinc-100 px-2 py-0.5">BCA</span>
                    <span className="rounded bg-zinc-100 px-2 py-0.5">Mandiri</span>
                    <span className="rounded bg-zinc-100 px-2 py-0.5">BRI</span>
                    <span className="rounded bg-zinc-100 px-2 py-0.5">BSI</span>
                    <span className="rounded bg-zinc-100 px-2 py-0.5">Dana / OVO</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomerDisplayOpen(true)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Buka Tampilan Pelanggan
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Cetak Standee
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Upload & Form Configuration (Col 7) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-emerald-600" />
                    Upload Foto / Gambar QRIS GoPay Toko Anda
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Unggah screenshot atau file foto barcode QRIS dari aplikasi GoPay / GoBiz Anda. File otomatis dikompres agar penyimpanan instan & hemat kuota.
                  </p>
                </div>

                {/* Upload Button & Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-6 text-center cursor-pointer hover:bg-emerald-50/80 transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto mb-2">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="font-bold text-sm text-emerald-950">
                    {isSavingQris ? 'Sedang Mengompres & Menyimpan Gambar...' : 'Klik untuk Pilih Foto Gambar QRIS GoPay'}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Mendukung format PNG, JPG, JPEG, WEBP dari smartphone atau scan komputer.
                  </p>
                  {qrisConfig.qrisImageUrl && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Gambar QRIS Tersimpan Otomatis!
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveQrisSettings(e as any);
                        }}
                        className="rounded-full bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1 text-xs font-bold transition-colors"
                      >
                        Simpan Ulang
                      </button>
                    </div>
                  )}
                </div>

                {/* Text Form Configuration */}
                <form onSubmit={handleSaveQrisSettings} className="space-y-3 text-xs pt-2">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Nama Merchant / Usaha di QRIS
                    </label>
                    <input
                      type="text"
                      required
                      value={qrisConfig.merchantName}
                      onChange={(e) =>
                        setQrisConfig({ ...qrisConfig, merchantName: e.target.value })
                      }
                      placeholder="cth: KopiFlow Roastery Gayo - GoPay"
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Nomor HP / Akun GoPay
                      </label>
                      <input
                        type="text"
                        value={qrisConfig.gopayNumber}
                        onChange={(e) =>
                          setQrisConfig({ ...qrisConfig, gopayNumber: e.target.value })
                        }
                        placeholder="cth: 0812-6900-8899"
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Atas Nama Pemilik Rekening
                      </label>
                      <input
                        type="text"
                        value={qrisConfig.accountHolder}
                        onChange={(e) =>
                          setQrisConfig({ ...qrisConfig, accountHolder: e.target.value })
                        }
                        placeholder="cth: PT KopiFlow Indonesia"
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Petunjuk Pembayaran untuk Faktur / Invoice
                    </label>
                    <textarea
                      rows={3}
                      value={qrisConfig.paymentInstructions}
                      onChange={(e) =>
                        setQrisConfig({ ...qrisConfig, paymentInstructions: e.target.value })
                      }
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSavingQris}
                      className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      {isSavingQris ? 'Menyimpan...' : 'Simpan Pengaturan QRIS GoPay'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Card: Manajemen Rekening Bank Alternatif */}
            <div className="lg:col-span-12 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      Rekening Bank Alternatif (Transfer Manual / m-Banking)
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {(qrisConfig.alternativeBankAccounts || []).length} Rekening Terdaftar
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Kelola daftar rekening bank yang dicantumkan pada Faktur Penjualan, pesan WhatsApp invoice, dan standee kasir
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddBank}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-2xs shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Tambah Rekening Bank</span>
                </button>
              </div>

              {/* Bank Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(qrisConfig.alternativeBankAccounts && qrisConfig.alternativeBankAccounts.length > 0) ? (
                  qrisConfig.alternativeBankAccounts.map((b) => (
                    <div
                      key={b.id}
                      className={`rounded-xl border p-4 space-y-2.5 transition-all ${
                        b.isPrimary
                          ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                          : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900">{b.bankName}</span>
                          {b.isPrimary && (
                            <span className="rounded bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 uppercase tracking-wider">
                              Utama
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditBank(b)}
                            className="p-1 text-zinc-500 hover:text-blue-700 hover:bg-white rounded transition-colors"
                            title="Edit Rekening Ini"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBankAccount(b.id)}
                            className="p-1 text-zinc-400 hover:text-rose-700 hover:bg-white rounded transition-colors"
                            title="Hapus Rekening"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-200">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-mono">No. Rekening:</span>
                          <span className="font-mono font-bold text-sm text-zinc-950 tracking-wider">
                            {b.accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyBank(b.accountNumber)}
                          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 transition-colors"
                          title="Salin Nomor Rekening"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-zinc-600 flex justify-between">
                        <span className="text-zinc-500">Atas Nama:</span>
                        <strong className="text-zinc-800">{b.accountHolder}</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center bg-zinc-50 border border-dashed border-zinc-300 rounded-xl">
                    <p className="text-xs text-zinc-500">Belum ada rekening bank yang ditambahkan.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddBank}
                      className="mt-2 text-xs font-bold text-blue-700 hover:underline"
                    >
                      + Tambah Rekening Pertama
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Tambah / Edit Rekening Bank */}
          {isBankModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-900">
                    {editingBankId ? 'Edit Data Rekening Bank' : 'Tambah Rekening Bank Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsBankModalOpen(false)}
                    className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveBankAccount} className="mt-4 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Pilih Bank / Nama Bank</label>
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {['Bank Mandiri', 'BCA (Bank Central Asia)', 'Bank Syariah Indonesia (BSI)', 'Bank BRI', 'Bank BNI', 'Bank Aceh Syariah'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setBankNameInput(preset)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                            bankNameInput === preset
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          {preset.split(' ')[0]} {preset.includes('BSI') ? 'BSI' : preset.includes('BCA') ? 'BCA' : preset.includes('Aceh') ? 'Aceh' : ''}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={bankNameInput}
                      onChange={(e) => setBankNameInput(e.target.value)}
                      placeholder="cth: Bank Mandiri / BCA / BSI"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      required
                      value={bankAccNumberInput}
                      onChange={(e) => setBankAccNumberInput(e.target.value)}
                      placeholder="cth: 137-00-19283-009 / 8720091233"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs font-mono font-bold text-zinc-950 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Atas Nama Pemilik Rekening (A/N)</label>
                    <input
                      type="text"
                      required
                      value={bankAccHolderInput}
                      onChange={(e) => setBankAccHolderInput(e.target.value)}
                      placeholder="cth: PT Kofiara Nusantara Berjaya"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bankIsPrimaryInput}
                        onChange={(e) => setBankIsPrimaryInput(e.target.checked)}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="font-semibold text-zinc-700 text-xs">
                        Jadikan Rekening Utama (Ditampilkan Paling Atas di Invoice & Faktur)
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setIsBankModalOpen(false)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-700 hover:bg-blue-800 px-4 py-1.5 font-bold text-white shadow-xs"
                    >
                      Simpan Data Rekening
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SHIPPING CONNECTION & BUFFER CALCULATOR */}
      {activeTab === 'shipping-buffer' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
              <Truck className="h-5 w-5 text-blue-700" />
              Bagaimana Keuangan Terhubung ke Logistik & Ongkos Kirim Kargo?
            </div>
            <p className="text-xs text-blue-950/80 leading-relaxed max-w-3xl">
              Pengiriman kopi dari dataran tinggi Gayo (Takengon/Bener Meriah) memiliki 2 karakteristik biaya yang berbeda:
              <strong> 1. Jalur Lokal Aceh</strong> menggunakan angkutan L300/Bus dengan tarif flat murah per karung, dan 
              <strong> 2. Jalur Antar Pulau</strong> (Jawa, Kalimantan, Sulawesi, Papua) yang membutuhkan sea-freight/air-freight dengan asuransi & kemasan ekstra. 
              Oleh sebab itu, <strong>Tier Harga Luar Pulau</strong> sengaja dirancang memiliki buffer harga agar bisnis roastery tetap mengantongi margin sehat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase text-zinc-500">Jalur Lokal Aceh (L300 / HiAce)</span>
              <div className="text-lg font-black text-zinc-900 mt-2 font-mono">Rp 30.000 - Rp 50.000</div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Per karung / colly ke Banda Aceh, Lhokseumawe, Meulaboh, Langsa via loket terminal.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase text-blue-700">Kargo Laut Antar Pulau (Jawa / Bali)</span>
              <div className="text-lg font-black text-blue-950 mt-2 font-mono">Rp 3.500 - Rp 7.000 / kg</div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Via Indah Logistik / Dakota / JNE Trucking min. 50kg, estimasi 4-7 hari kerja.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase text-purple-700">Kargo Udara / Wilayah Timur (Papua)</span>
              <div className="text-lg font-black text-purple-950 mt-2 font-mono">Rp 35.000 - Rp 65.000 / kg</div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Express air-cargo untuk kebutuhan specialty coffee mendesak.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-zinc-900">Ingin Mengelola Resi & Surat Jalan Pengiriman?</h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Buka menu terpisah "Pengiriman & Surat Jalan" untuk memantau sopir L300, no plat, dan cetak surat jalan resmi.
              </p>
            </div>
            {onNavigateToShipping && (
              <button
                onClick={onNavigateToShipping}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800"
              >
                <Truck className="h-3.5 w-3.5 text-amber-400" />
                Buka Menu Pengiriman
              </button>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN / DEDICATED CUSTOMER-FACING STANDEE DISPLAY MODAL */}
      {isCustomerDisplayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-4 border-emerald-500 text-center relative my-6">
            <button
              onClick={() => setIsCustomerDisplayOpen(false)}
              className="absolute top-4 right-4 rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
            >
              ✕
            </button>

            {/* Official QRIS Header */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="font-black text-2xl text-zinc-900 tracking-wider">QRIS</span>
              <span className="text-zinc-300 text-xl font-light">|</span>
              <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white tracking-widest shadow-2xs">
                GOPAY & SEMUA PEMBAYARAN
              </span>
            </div>
            <p className="text-xs text-zinc-500">Scan QRIS ini langsung dari aplikasi GoPay atau m-Banking Anda</p>

            <div className="mt-4 mb-2">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                {qrisConfig.merchantName || 'KopiFlow Roastery Gayo'}
              </h2>
              <div className="inline-block mt-1 rounded-full bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-200">
                NMID / GoPay: {qrisConfig.gopayNumber}
              </div>
            </div>

            {/* Huge QR Code Box */}
            <div className="mx-auto my-5 w-72 h-72 sm:w-80 sm:h-80 rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4 flex flex-col items-center justify-center relative shadow-inner">
              {qrisConfig.qrisImageUrl ? (
                <img
                  src={qrisConfig.qrisImageUrl}
                  alt="QRIS GoPay KopiFlow"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-center p-4">
                  <QrCode className="h-32 w-32 text-emerald-700 mx-auto mb-2 opacity-80" />
                  <span className="font-bold text-zinc-800 text-sm block">Barcode QRIS Belum Diunggah</span>
                  <p className="text-xs text-zinc-500 mt-1">
                    Silakan upload file foto QRIS GoPay Anda di menu Pengaturan QRIS.
                  </p>
                </div>
              )}
            </div>

            {/* Bank details & Instructions */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 text-xs text-zinc-700 space-y-2">
              <p className="font-medium leading-relaxed">
                {qrisConfig.paymentInstructions || 'Scan menggunakan GoPay, BCA, Mandiri, BRI, BSI, Dana, OVO, atau ShopeePay.'}
              </p>
              <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center justify-center gap-3 text-[11px] text-zinc-600">
                {(qrisConfig.alternativeBankAccounts && qrisConfig.alternativeBankAccounts.length > 0) ? (
                  qrisConfig.alternativeBankAccounts.map((b, idx) => (
                    <React.Fragment key={b.id}>
                      {idx > 0 && <span>•</span>}
                      <span>
                        {b.bankName}: <strong className="font-mono text-zinc-900">{b.accountNumber}</strong>{' '}
                        <span className="text-[10px] text-zinc-500">(a.n {b.accountHolder})</span>
                      </span>
                    </React.Fragment>
                  ))
                ) : (
                  <span>A/N: <strong>{qrisConfig.accountHolder || 'Kofiara Roastery'}</strong></span>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
              >
                <Printer className="h-4 w-4" />
                Cetak Standee
              </button>
              <button
                type="button"
                onClick={() => setIsCustomerDisplayOpen(false)}
                className="rounded-xl bg-zinc-900 px-6 py-2 text-xs font-bold text-white hover:bg-zinc-800"
              >
                Tutup Tampilan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PAY / QRIS MODAL FOR A SPECIFIC ORDER */}
      {selectedOrderForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 my-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800">
                  {selectedOrderForPay.invoiceNumber}
                </span>
                <h3 className="text-base font-bold text-zinc-900">
                  Kasir Pembayaran: {selectedOrderForPay.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForPay(null)}
                className="text-zinc-400 hover:text-zinc-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Order Amount Highlight */}
              <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-amber-900 block">Total Tagihan Faktur</span>
                  <div className="text-2xl font-black font-mono text-amber-950">
                    {formatIDR(selectedOrderForPay.grandTotal)}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Tujuan: {selectedOrderForPay.destinationIsland} ({selectedOrderForPay.totalWeightKg} kg)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Status Bayar:</span>
                  <span
                    className={`inline-block mt-0.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedOrderForPay.paymentStatus === 'Paid in Full'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrderForPay.paymentStatus === 'Down Payment'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedOrderForPay.paymentStatus}
                  </span>
                </div>
              </div>

              {/* QRIS Code for this order */}
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-center">
                <div className="flex items-center gap-1.5 mb-2 font-bold text-zinc-800 text-xs">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  Scan QRIS GoPay untuk Faktur Ini
                </div>

                <div className="w-56 h-56 rounded-xl bg-white p-3 border border-zinc-200 flex flex-col items-center justify-center relative shadow-xs">
                  {qrisConfig.qrisImageUrl ? (
                    <img
                      src={qrisConfig.qrisImageUrl}
                      alt="QRIS GoPay"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <QrCode className="h-16 w-16 text-emerald-700 mx-auto mb-1.5 opacity-80" />
                      <span className="text-[10px] text-zinc-500 leading-tight block">
                        Slot Barcode QRIS GoPay
                      </span>
                    </div>
                  )}
                </div>

                <span className="font-extrabold text-xs text-zinc-900 mt-2 block">
                  {qrisConfig.merchantName} ({qrisConfig.gopayNumber})
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Masukkan nominal pas: <strong>{formatIDR(selectedOrderForPay.grandTotal)}</strong>
                </p>
              </div>

              {/* One-click Action to update payment status */}
              <div>
                <label className="block font-bold text-zinc-800 mb-1.5">
                  Ubah Status Pembayaran untuk Faktur Ini:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedOrderForPay.id, 'Unpaid')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedOrderForPay.paymentStatus === 'Unpaid'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Belum Bayar
                  </button>

                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedOrderForPay.id, 'Down Payment')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedOrderForPay.paymentStatus === 'Down Payment'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Uang Muka (DP)
                  </button>

                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedOrderForPay.id, 'Paid in Full')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedOrderForPay.paymentStatus === 'Paid in Full'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Lunas (Paid)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <button
                  onClick={() => handleSendPaymentWhatsApp(selectedOrderForPay)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  <MessageCircle className="h-4 w-4" />
                  Kirim Faktur via WA
                </button>

                <button
                  onClick={() => setSelectedOrderForPay(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
