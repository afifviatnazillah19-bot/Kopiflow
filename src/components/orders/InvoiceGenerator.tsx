import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Eye,
  Layers,
  QrCode,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Order, OrderItem, CoffeeBean, PricingTier, IslandRegion, QrisPaymentConfig } from '../../types/erp';
import { formatIDR, saveOrder, getPriceByTier, subscribeToQrisConfig, DEFAULT_QRIS_CONFIG } from '../../services/dbService';
import { exportElementToA4Pdf } from '../../utils/pdfExport';

interface InvoiceGeneratorProps {
  orders: Order[];
  beans: CoffeeBean[];
  onRefresh: () => void;
  preselectedOrder?: Order | null;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  orders,
  beans,
  onRefresh,
  preselectedOrder
}) => {
  // Selected Order from database
  const [selectedOrderId, setSelectedOrderId] = useState<string>(preselectedOrder?.id || '');

  // Real-time QRIS & Bank Config
  const [qrisConfig, setQrisConfig] = useState<QrisPaymentConfig>(DEFAULT_QRIS_CONFIG);
  useEffect(() => {
    const unsub = subscribeToQrisConfig(setQrisConfig);
    return () => unsub();
  }, []);

  // Roastery / Seller Identity
  const [isEditingCompany, setIsEditingCompany] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState('KOFIARA ROASTERY & COFFEE LAB');
  const [companyTagline, setCompanyTagline] = useState('Specialty Coffee Roaster, Gayo Green Beans & Espresso Bar');
  const [companyAddress, setCompanyAddress] = useState('Jl. Merdeka No. 88, Mon Geudong, Kota Lhokseumawe, Aceh 24352');
  const [companyPhone, setCompanyPhone] = useState('+62 811-689-2233');
  const [companyEmail, setCompanyEmail] = useState('billing@kofiara.id');
  const [companyNpwp, setCompanyNpwp] = useState('09.432.189.4-102.000');

  // Invoice Metadata
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    const d = new Date();
    return `INV/KF/${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;
  });
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [paymentStatus, setPaymentStatus] = useState<Order['paymentStatus']>('Paid in Full');

  // Customer Information
  const [customerName, setCustomerName] = useState<string>('Kedai Kopi Rangkang');
  const [customerType, setCustomerType] = useState<PricingTier>('Lokal');
  const [customerPhone, setCustomerPhone] = useState<string>('0812-3456-7890');
  const [customerEmail, setCustomerEmail] = useState<string>('owner@rangkangcoffee.id');
  const [customerAddress, setCustomerAddress] = useState<string>('Jl. Samudera No. 12, Banda Sakti, Lhokseumawe');
  const [destinationIsland, setDestinationIsland] = useState<IslandRegion>('Aceh (Lokal Loket)');

  // Items
  const [items, setItems] = useState<OrderItem[]>([
    {
      beanId: beans[0]?.id || 'b1',
      beanName: beans[0]?.name || 'Arabika Gayo Pantan Musara Washed',
      type: 'Roasted Bean',
      quantityKg: 5,
      tierUsed: 'Lokal',
      unitPrice: beans[0]?.priceLocalPerKg || 165000,
      subtotal: (beans[0]?.priceLocalPerKg || 165000) * 5
    }
  ]);

  // Financials
  const [shippingCost, setShippingCost] = useState<number>(25000);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState<string>(
    'Terima kasih atas pesanan biji kopi Anda! Biji sangrai telah di-resting sempurna siap diseduh.'
  );

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const invoicePrintRef = useRef<HTMLDivElement | null>(null);

  // Sync when user selects an existing order from dropdown
  useEffect(() => {
    if (selectedOrderId) {
      const ord = orders.find((o) => o.id === selectedOrderId);
      if (ord) {
        setInvoiceNumber(ord.invoiceNumber);
        setInvoiceDate(ord.orderDate || new Date().toISOString().split('T')[0]);
        setCustomerName(ord.customerName);
        setCustomerType(ord.customerType);
        setCustomerPhone(ord.customerPhone);
        setCustomerEmail(ord.customerEmail);
        setCustomerAddress(ord.customerAddress);
        if (ord.destinationIsland) setDestinationIsland(ord.destinationIsland);
        if (ord.items && ord.items.length > 0) {
          const sanitizedItems = ord.items.map((it) => ({
            ...it,
            quantityKg: Number(it.quantityKg) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            subtotal: Number(it.subtotal) || (Number(it.quantityKg) || 0) * (Number(it.unitPrice) || 0)
          }));
          setItems(sanitizedItems);
        }
        setShippingCost(Number(ord.shippingCost) || 0);
        setDiscountAmount(Number(ord.discount) || 0);
        setPaymentStatus(ord.paymentStatus || 'Paid in Full');
        if (ord.notes) setNotes(ord.notes);
      }
    }
  }, [selectedOrderId, orders]);

  // Item management
  const handleItemChange = (index: number, field: keyof OrderItem, val: any) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const updated = {
          ...it,
          [field]: field === 'quantityKg' || field === 'unitPrice' ? (val === '' ? 0 : Number(val) || 0) : val
        };
        if (field === 'beanId') {
          const b = beans.find((bean) => bean.id === val);
          if (b) {
            updated.beanName = b.name;
            updated.unitPrice = getPriceByTier(b, customerType);
          }
        }
        if (field === 'quantityKg' || field === 'unitPrice' || field === 'beanId') {
          const qty = Number(field === 'quantityKg' ? (val === '' ? 0 : Number(val) || 0) : updated.quantityKg) || 0;
          const price = Number(field === 'unitPrice' ? (val === '' ? 0 : Number(val) || 0) : updated.unitPrice) || 0;
          updated.quantityKg = qty;
          updated.unitPrice = price;
          updated.subtotal = Number((qty * price).toFixed(0));
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    const firstBean = beans[0];
    const unitPrice = firstBean ? getPriceByTier(firstBean, customerType) : 150000;
    setItems((prev) => [
      ...prev,
      {
        beanId: firstBean?.id || `custom-${Date.now()}`,
        beanName: firstBean?.name || 'Arabika Gayo Specialty',
        type: 'Roasted Bean',
        quantityKg: 1,
        tierUsed: customerType,
        unitPrice,
        subtotal: unitPrice
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Tier change recalculation
  const handleTierChange = (newTier: PricingTier) => {
    setCustomerType(newTier);
    setItems((prev) =>
      prev.map((it) => {
        const b = beans.find((bean) => bean.id === it.beanId);
        const price = b ? getPriceByTier(b, newTier) : it.unitPrice;
        return {
          ...it,
          tierUsed: newTier,
          unitPrice: price,
          subtotal: Number(((Number(it.quantityKg) || 0) * price).toFixed(0))
        };
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  const totalWeightKg = items.reduce((acc, it) => acc + (Number(it.quantityKg) || 0), 0);
  const taxAmount = Number(((subtotal * (Number(taxPercent) || 0)) / 100).toFixed(0));
  const grandTotal = Math.max(0, subtotal + (Number(shippingCost) || 0) + taxAmount - (Number(discountAmount) || 0));

  // PDF Export
  const handleExportPDF = async () => {
    if (!invoicePrintRef.current) return;
    setIsExporting(true);
    setToastMessage('Sedang memproses dan merender PDF Faktur Polos A4...');

    try {
      const element = invoicePrintRef.current;
      const safeInvoiceName = invoiceNumber.replace(/[\/\\:]/g, '_');
      const filename = `FAKTUR_${safeInvoiceName}_${customerName.replace(/\s+/g, '_')}.pdf`;

      await exportElementToA4Pdf(element, filename, 2.5);

      setToastMessage(`Faktur ${invoiceNumber} berhasil diunduh dalam format PDF!`);
      setTimeout(() => setToastMessage(''), 4500);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // Quick save to ERP Orders database
  const handleSaveAsOrder = async () => {
    const newOrd: Order = {
      id: selectedOrderId || `ord-${Date.now().toString(36)}`,
      invoiceNumber,
      customerName,
      customerType,
      customerPhone,
      customerEmail,
      customerAddress,
      destinationIsland,
      shippingMethod: 'Loket Bus / L300 Aceh (Faktur Langsung)',
      items,
      totalWeightKg,
      subtotal,
      discount: Number(discountAmount) || 0,
      tax: taxAmount,
      shippingCost: Number(shippingCost) || 0,
      grandTotal,
      status: 'Confirmed',
      paymentStatus,
      orderDate: invoiceDate,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveOrder(newOrd, beans);
    onRefresh();
    setSelectedOrderId(newOrd.id);
    setToastMessage(`Faktur ${invoiceNumber} berhasil disimpan ke database pesanan!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="rounded-xl bg-zinc-900 text-white p-3.5 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-150 border border-zinc-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-zinc-400 hover:text-white font-mono">
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="rounded-2xl border border-zinc-300 bg-white p-5 sm:p-6 text-zinc-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-100 border border-zinc-300 px-2 py-0.5 text-[11px] font-bold text-zinc-800">
              Dokumen Faktur Resmi A4
            </span>
            <span className="text-xs text-zinc-500">Format Polos Standard ERP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 mt-1">
            Menu Cetak Faktur Penjualan (Ekspor PDF)
          </h2>
          <p className="text-xs text-zinc-600 mt-1 max-w-xl">
            Isi formulir data penjualan di kolom kiri, lalu unduh dokumen PDF polos bersih dengan rincian data lengkap, QRIS, dan legalitas roastery.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSaveAsOrder}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-colors shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Simpan ke Database</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-colors shadow-2xs"
          >
            <Printer className="h-4 w-4 text-zinc-700" />
            <span>Cetak (Print)</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 px-4 py-2 text-xs font-extrabold text-white shadow-md active:scale-95 transition-all"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-white" />
                <span>Ekspor PDF (A4 Polos)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left = Form Inputs, Right = Clean Formal A4 Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Forms (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Quick Load From Existing Database Orders */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <Layers className="h-4 w-4 text-zinc-700" />
                <span>Pilih Pesanan dari Database</span>
              </div>
              <button
                onClick={() => {
                  setSelectedOrderId('');
                  setInvoiceNumber(`INV/KF/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`);
                  setCustomerName('');
                  setItems([
                    {
                      beanId: beans[0]?.id || 'b1',
                      beanName: beans[0]?.name || 'Arabika Gayo Specialty',
                      type: 'Roasted Bean',
                      quantityKg: 2,
                      tierUsed: 'Lokal',
                      unitPrice: beans[0]?.priceLocalPerKg || 150000,
                      subtotal: (beans[0]?.priceLocalPerKg || 150000) * 2
                    }
                  ]);
                }}
                className="text-[11px] text-zinc-700 hover:text-zinc-950 font-bold underline"
              >
                + Buat Faktur Baru
              </button>
            </div>

            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-zinc-800 focus:bg-white focus:outline-hidden"
            >
              <option value="">-- Mode Faktur Mandiri / Custom --</option>
              {orders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.invoiceNumber} - {ord.customerName} ({formatIDR(ord.grandTotal)})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Roastery / Company Identity (Editable) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3 text-xs">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsEditingCompany(!isEditingCompany)}
            >
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <Building2 className="h-4 w-4 text-zinc-600" />
                <span>Identitas Roastery & Pengirim</span>
              </div>
              <button type="button" className="text-zinc-500 hover:text-zinc-900">
                {isEditingCompany ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {isEditingCompany && (
              <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-0.5">Nama Perusahaan / Roastery</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 font-bold text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-0.5">Sub-judul / Tagline</label>
                  <input
                    type="text"
                    value={companyTagline}
                    onChange={(e) => setCompanyTagline(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-800 focus:border-zinc-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-0.5">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-800 focus:border-zinc-800 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-0.5">No. Telepon / WA</label>
                    <input
                      type="text"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-800 focus:border-zinc-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-0.5">Email Billing</label>
                    <input
                      type="text"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-800 focus:border-zinc-800 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-0.5">Nomor NPWP</label>
                  <input
                    type="text"
                    value={companyNpwp}
                    onChange={(e) => setCompanyNpwp(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-800 focus:border-zinc-800 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Form Input: Metadata Faktur & Customer */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
              <Edit3 className="h-4 w-4 text-zinc-600" />
              <span>Data Faktur & Pelanggan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nomor Faktur</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Status Pembayaran</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as Order['paymentStatus'])}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-semibold text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                >
                  <option value="Paid in Full">Lunas (Paid in Full)</option>
                  <option value="Down Payment">DP / Uang Muka (Down Payment)</option>
                  <option value="Unpaid">Belum Dibayar (Unpaid)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Tanggal Faktur</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Jatuh Tempo (Due Date)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Customer Details */}
            <div className="pt-2 border-t border-zinc-100 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama Customer / Kedai</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="cth: Kedai Kopi Rangkang"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 font-bold focus:border-zinc-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Tier Harga</label>
                  <select
                    value={customerType}
                    onChange={(e) => handleTierChange(e.target.value as PricingTier)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-semibold text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                  >
                    <option value="Lokal">Tier 1: Lokal (Walk-in / Roastery)</option>
                    <option value="UMKM">Tier 2: Mitra UMKM (Diskon Kedai)</option>
                    <option value="Luar Pulau">Tier 3: Luar Pulau (+ Packaging)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Email Customer</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Alamat Pengiriman Lengkap</label>
                <textarea
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 4. Item List Editor */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-xs font-bold text-zinc-900">Rincian Item Kopi & Jasa</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 border border-zinc-300 px-2.5 py-1 text-xs font-bold text-zinc-800 hover:bg-zinc-200 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Baris Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-800 text-[11px]">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-600 hover:text-rose-800"
                        title="Hapus baris"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Pilih Biji Kopi</label>
                      <select
                        value={it.beanId}
                        onChange={(e) => handleItemChange(idx, 'beanId', e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs focus:border-zinc-800 focus:outline-hidden"
                      >
                        {beans.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Bentuk / Tipe</label>
                      <select
                        value={it.type}
                        onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs focus:border-zinc-800 focus:outline-hidden"
                      >
                        <option value="Roasted Bean">Roasted Bean (Biji Sangrai)</option>
                        <option value="Green Bean">Green Bean (Biji Mentah)</option>
                        <option value="Ground">Ground (Kopi Bubuk Halus/Kasar)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Berat (kg)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={it.quantityKg === 0 ? '' : it.quantityKg}
                        onChange={(e) => handleItemChange(idx, 'quantityKg', e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono font-bold text-xs focus:border-zinc-800 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Harga / kg</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={it.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs focus:border-zinc-800 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Subtotal</label>
                      <div className="rounded-lg bg-zinc-200/70 px-2 py-1 font-mono font-bold text-zinc-900 text-xs truncate">
                        {formatIDR(it.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Additional Charges & Notes */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3 text-xs">
            <span className="block font-bold text-zinc-900 border-b border-zinc-100 pb-2">
              Ongkir, Diskon & Catatan Pembayaran
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Ongkir / Kargo (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={shippingCost === 0 ? '' : shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Diskon Khusus (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={discountAmount === 0 ? '' : discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-emerald-700 font-bold focus:border-zinc-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">PPN (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Catatan Pembayaran & Roastery</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Formal Clean Printable A4 Document Preview (lg:col-span-7) */}
        <div className="lg:col-span-7 sticky top-4">
          <div className="rounded-2xl border border-zinc-300 bg-zinc-200/50 p-3 sm:p-5 shadow-inner">
            <div className="flex items-center justify-between pb-3 text-xs text-zinc-600">
              <div className="flex items-center gap-1.5 font-bold">
                <Eye className="h-4 w-4 text-zinc-800" />
                <span>Pratinjau Dokumen A4 Resmi Polos (Siap Ekspor PDF)</span>
              </div>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-zinc-300 text-zinc-700">
                A4 Standard (210mm x 297mm)
              </span>
            </div>

            {/* THE PLAIN FORMAL INVOICE CONTAINER (Zero themes, pure data completeness) */}
            <div
              ref={invoicePrintRef}
              className="w-full bg-white rounded-none shadow-md p-6 sm:p-8 text-zinc-900 font-sans border border-zinc-300"
              style={{ minHeight: '840px' }}
            >
              {/* HEADER: COMPANY IDENTITY & INVOICE METADATA */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-zinc-900">
                {/* Left: Roastery Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 bg-zinc-900 text-white font-black text-xs flex items-center justify-center rounded">
                      KF
                    </div>
                    <div>
                      <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-950 uppercase">
                        {companyName}
                      </h1>
                      <p className="text-[10px] text-zinc-600 font-medium">{companyTagline}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-700 mt-2 space-y-0.5 leading-snug">
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span>{companyAddress}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span>Telp/WA: <strong>{companyPhone}</strong></span>
                      <span>|</span>
                      <span>Email: {companyEmail}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500">NPWP: {companyNpwp}</p>
                  </div>
                </div>

                {/* Right: Invoice Number & Dates */}
                <div className="text-left sm:text-right shrink-0">
                  <h2 className="text-xl sm:text-2xl font-black tracking-wider text-zinc-950 uppercase">
                    FAKTUR PENJUALAN
                  </h2>
                  <div className="font-mono text-sm font-black text-zinc-900 mt-0.5">
                    {invoiceNumber}
                  </div>
                  <div className="text-xs text-zinc-700 mt-1 space-y-0.5">
                    <p>Tanggal Faktur: <strong className="font-mono">{invoiceDate}</strong></p>
                    <p>Jatuh Tempo: <strong className="font-mono">{dueDate}</strong></p>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        paymentStatus === 'Paid in Full'
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : paymentStatus === 'Down Payment'
                          ? 'bg-zinc-100 text-zinc-900 border-zinc-400'
                          : 'bg-zinc-50 text-zinc-800 border-zinc-300'
                      }`}
                    >
                      {paymentStatus === 'Paid in Full' ? '✓ LUNAS' : paymentStatus === 'Down Payment' ? 'DIBAYAR SEBAGIAN (DP)' : 'BELUM DIBAYAR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2-COLUMN DETAILS BOX: BUYER & SHIPPING */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 p-3.5 bg-zinc-50 rounded border border-zinc-300 text-xs">
                {/* Column 1: Customer */}
                <div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                    PEMBELI / PELANGGAN:
                  </span>
                  <div className="font-black text-sm text-zinc-950">{customerName || 'Nama Pelanggan'}</div>
                  <p className="text-zinc-700 mt-0.5 leading-snug">{customerAddress || 'Alamat Belum Diatur'}</p>
                  <p className="text-zinc-600 mt-1 font-mono">
                    Kontak: <strong>{customerPhone}</strong>
                    {customerEmail && <span className="ml-1 text-zinc-500">({customerEmail})</span>}
                  </p>
                </div>

                {/* Column 2: Shipping & Tier */}
                <div className="border-t sm:border-t-0 sm:border-l border-zinc-300 sm:pl-3.5 pt-2.5 sm:pt-0">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-1">
                    DETAIL PENGIRIMAN & HARGA:
                  </span>
                  <div className="space-y-1 text-zinc-800">
                    <div>
                      Kategori Tier Harga: <strong className="font-bold text-zinc-950">Tier {customerType}</strong>
                    </div>
                    <div>
                      Wilayah Destinasi: <strong className="font-bold text-zinc-950">{destinationIsland}</strong>
                    </div>
                    <div>
                      Ekspedisi / Courier: <span className="font-medium text-zinc-700">Loket Bus / L300 Aceh & Kargo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMIZED PRODUCTS TABLE */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-y-2 border-zinc-900 text-zinc-950 font-black uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-2 text-center w-8">NO</th>
                      <th className="py-2 px-3">DESKRIPSI PRODUK BIJI KOPI</th>
                      <th className="py-2 px-2 text-center">BENTUK</th>
                      <th className="py-2 px-3 text-right">QTY (KG)</th>
                      <th className="py-2 px-3 text-right">HARGA / KG</th>
                      <th className="py-2 px-3 text-right">TOTAL (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="py-2 px-2 text-center font-mono text-zinc-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-zinc-950">{it.beanName}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="font-semibold text-zinc-700 text-[10px]">
                            {it.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">
                          {(Number(it.quantityKg) || 0).toLocaleString('id-ID', {
                            maximumFractionDigits: 2
                          })}{' '}
                          kg
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-zinc-800">
                          {formatIDR(it.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-zinc-950">
                          {formatIDR(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS & SUMMARY BREAKDOWN */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2 border-t-2 border-zinc-900 text-xs">
                {/* Notes & Total Weight */}
                <div className="text-zinc-600 max-w-xs space-y-1">
                  <p>
                    Total Bobot Biji Kopi:{' '}
                    <strong className="font-mono text-zinc-950 font-black">
                      {(Number(totalWeightKg) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg
                    </strong>
                  </p>
                  {notes && (
                    <div className="text-[11px] text-zinc-600 pt-1 border-t border-zinc-200 italic">
                      Catatan: "{notes}"
                    </div>
                  )}
                </div>

                {/* Calculation Summary Box */}
                <div className="w-full sm:w-64 space-y-1 text-zinc-800 bg-zinc-50 p-3 rounded border border-zinc-300">
                  <div className="flex justify-between">
                    <span>Subtotal Produk:</span>
                    <span className="font-mono text-zinc-950 font-bold">{formatIDR(subtotal)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Ongkos Kirim:</span>
                      <span className="font-mono text-zinc-900">{formatIDR(shippingCost)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-zinc-900">
                      <span>Diskon Kemitraan:</span>
                      <span className="font-mono font-bold">-{formatIDR(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span>PPN ({taxPercent}%):</span>
                      <span className="font-mono text-zinc-900">{formatIDR(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-zinc-900 pt-1.5 text-sm font-black text-zinc-950">
                    <span>TOTAL PEMBAYARAN:</span>
                    <span className="font-mono text-base">{formatIDR(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT INFORMATION (QRIS & BANK ACCOUNTS) */}
              <div className="mt-5 pt-3 border-t border-zinc-300 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-50 p-3 rounded border border-zinc-300">
                  {/* QRIS Image */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 bg-white rounded border border-zinc-300 text-center">
                    <span className="font-black text-[10px] tracking-wider text-zinc-900 mb-1 uppercase">
                      QRIS GOPAY OFFICIAL
                    </span>
                    {qrisConfig.qrisImageUrl ? (
                      <img
                        src={qrisConfig.qrisImageUrl}
                        alt="QRIS GoPay"
                        className="w-24 h-24 object-contain rounded"
                      />
                    ) : (
                      <div className="w-24 h-24 flex flex-col items-center justify-center bg-zinc-100 border border-dashed border-zinc-400 rounded">
                        <QrCode className="h-10 w-10 text-zinc-700" />
                        <span className="text-[8px] text-zinc-600 mt-0.5 font-bold">Scan QRIS</span>
                      </div>
                    )}
                    <span className="text-[9px] text-zinc-600 mt-1 font-mono">Scan via E-Wallet / All Bank</span>
                  </div>

                  {/* Bank Accounts & Signature */}
                  <div className="sm:col-span-8 flex flex-col justify-between">
                    <div>
                      <strong className="text-[10px] uppercase font-black text-zinc-800 block mb-1">
                        REKENING BANK PEMBAYARAN RESMI:
                      </strong>
                      <div className="text-[11px] text-zinc-800 space-y-0.5 leading-snug">
                        <p>
                          Bank Mandiri: <strong className="font-mono text-zinc-950 font-extrabold">137-00-19283-009</strong> (a.n PT Kofiara Nusantara)
                        </p>
                        <p>
                          Bank BCA: <strong className="font-mono text-zinc-950 font-extrabold">872-0091-233</strong> (a.n PT Kofiara Nusantara)
                        </p>
                        <p>
                          GoPay/QRIS: <strong className="font-mono text-zinc-950 font-bold">{qrisConfig.gopayNumber}</strong> ({qrisConfig.merchantName})
                        </p>
                      </div>
                    </div>

                    {/* Signature Block */}
                    <div className="flex justify-between items-end pt-3 border-t border-zinc-300 mt-2">
                      <div className="text-[9px] text-zinc-500 italic">
                        *Dokumen ini diterbitkan secara sah melalui KopiFlow ERP.
                      </div>
                      <div className="text-center shrink-0">
                        <div className="text-[10px] text-zinc-600">Hormat Kami,</div>
                        <div className="font-black text-xs text-zinc-950 mt-6 underline uppercase">
                          Kofiara Finance
                        </div>
                        <div className="text-[9px] text-zinc-500">Lhokseumawe Central Hub</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
