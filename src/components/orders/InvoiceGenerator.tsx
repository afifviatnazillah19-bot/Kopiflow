import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  Store,
  Ship,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { Order, OrderItem, CoffeeBean, PricingTier, IslandRegion, QrisPaymentConfig } from '../../types/erp';
import { formatIDR, saveOrder, getPriceByTier, subscribeToQrisConfig, DEFAULT_QRIS_CONFIG } from '../../services/dbService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceGeneratorProps {
  orders: Order[];
  beans: CoffeeBean[];
  onRefresh: () => void;
  preselectedOrder?: Order | null;
}

export type InvoiceTemplateTheme = 'classic' | 'modern' | 'minimal' | 'rustic';

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  orders,
  beans,
  onRefresh,
  preselectedOrder
}) => {
  // Mode: 'builder' (custom/new/edit) vs 'browse' (pick from recorded orders)
  const [selectedOrderId, setSelectedOrderId] = useState<string>(preselectedOrder?.id || '');
  const [templateTheme, setTemplateTheme] = useState<InvoiceTemplateTheme>('modern');

  // Real-time QRIS & Bank Config
  const [qrisConfig, setQrisConfig] = useState<QrisPaymentConfig>(DEFAULT_QRIS_CONFIG);
  useEffect(() => {
    const unsub = subscribeToQrisConfig(setQrisConfig);
    return () => unsub();
  }, []);

  // Invoice Company / Roastery Identity (Customizable)
  const [companyName, setCompanyName] = useState('KOFIARA ROASTERY & COFFEE LAB');
  const [companyTagline, setCompanyTagline] = useState('Specialty Coffee Roaster, Gayo Green Beans & Espresso Bar Solutions');
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
  const [paymentMethodName, setPaymentMethodName] = useState<string>('QRIS GoPay / Transfer Bank');

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
  const [taxPercent, setTaxPercent] = useState<number>(0); // PPN %
  const [notes, setNotes] = useState<string>(
    'Terima kasih atas pesanan biji kopi Anda! Biji sangrai telah di-resting sempurna siap diseduh.'
  );

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const invoicePrintRef = useRef<HTMLDivElement | null>(null);

  // Sync when user selects an existing order from the dropdown
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
        setDestinationIsland(ord.destinationIsland);
        setItems(ord.items && ord.items.length > 0 ? ord.items : items);
        setShippingCost(ord.shippingCost || 0);
        setDiscountAmount(ord.discount || 0);
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
        const updated = { ...it, [field]: val };
        if (field === 'beanId') {
          const b = beans.find((bean) => bean.id === val);
          if (b) {
            updated.beanName = b.name;
            updated.unitPrice = getPriceByTier(b, customerType);
          }
        }
        if (field === 'quantityKg' || field === 'unitPrice' || field === 'beanId') {
          const qty = Number(field === 'quantityKg' ? val : updated.quantityKg) || 0;
          const price = Number(field === 'unitPrice' ? val : updated.unitPrice) || 0;
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
          subtotal: Number((it.quantityKg * price).toFixed(0))
        };
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const totalWeightKg = items.reduce((acc, it) => acc + (Number(it.quantityKg) || 0), 0);
  const taxAmount = Number(((subtotal * (Number(taxPercent) || 0)) / 100).toFixed(0));
  const grandTotal = Math.max(0, subtotal + (Number(shippingCost) || 0) + taxAmount - (Number(discountAmount) || 0));

  // PDF Export using html2canvas & jsPDF with high DPI
  const handleExportPDF = async () => {
    if (!invoicePrintRef.current) return;
    setIsExporting(true);
    setToastMessage('Sedang memproses dan merender PDF Faktur...');

    try {
      const element = invoicePrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5, // Crisp rendering for text & QRIS
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeInvoiceName = invoiceNumber.replace(/[\/\\:]/g, '_');
      pdf.save(`FAKTUR_${safeInvoiceName}_${customerName.replace(/\s+/g, '_')}.pdf`);

      setToastMessage(`Faktur ${invoiceNumber} berhasil diunduh dalam format PDF!`);
      setTimeout(() => setToastMessage(''), 4500);
    } catch (err) {
      console.error('PDF export error:', err);
      // Fallback to browser print if canvas fails
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
        <div className="rounded-xl bg-emerald-700 text-white p-3.5 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-200 hover:text-white font-mono">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Quick Controls */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-900 via-zinc-800 to-amber-950 p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-400/40">
              PDF Template Studio
            </span>
            <span className="text-xs text-zinc-400">Kofiara Roastery Invoicing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
            Menu Cetak Faktur & Ekspor PDF
          </h2>
          <p className="text-xs text-zinc-300 mt-1 max-w-xl">
            Pilih pesanan dari database atau isi manual item faktur di formulir sebelah kiri, sesuaikan template visual, dan ekspor langsung menjadi dokumen PDF berkualitas cetak tinggi A4.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSaveAsOrder}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-600 bg-zinc-800/80 px-3.5 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Simpan ke Database</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-600 bg-zinc-800/80 px-3.5 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors shadow-2xs"
          >
            <Printer className="h-4 w-4 text-amber-300" />
            <span>Cetak (Print)</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-4 py-2 text-xs font-extrabold text-white shadow-md active:scale-95 transition-all"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-white" />
                <span>Ekspor PDF (A4)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Interface: Left = Form Inputs, Right = Live Printable Invoice Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Input Data (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Quick Load From Existing Database Orders */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <Layers className="h-4 w-4 text-amber-700" />
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
                className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold underline"
              >
                + Buat Faktur Baru
              </button>
            </div>

            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
            >
              <option value="">-- Mode Faktur Mandiri / Custom --</option>
              {orders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.invoiceNumber} - {ord.customerName} ({formatIDR(ord.grandTotal)})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Visual Template */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
            <span className="block text-xs font-bold text-zinc-900">Tema Desain Template Faktur</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'modern', name: 'Modern Amber', desc: 'Aksen Emas Gayo' },
                  { id: 'classic', name: 'Formal Hitam', desc: 'Standar Korporat' },
                  { id: 'minimal', name: 'Clean Minimal', desc: 'Simpel & Rapi' },
                  { id: 'rustic', name: 'Roastery Lab', desc: 'Karakter Kopi' }
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateTheme(t.id)}
                  className={`rounded-xl p-2.5 text-left border text-xs transition-all ${
                    templateTheme === t.id
                      ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-600/20'
                      : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <span className="font-bold text-zinc-900 block text-[11px]">{t.name}</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Form Input: Metadata Faktur & Customer */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
              <Edit3 className="h-4 w-4 text-zinc-500" />
              <span>Data Faktur & Pelanggan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nomor Faktur</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Status Pembayaran</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as Order['paymentStatus'])}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-semibold text-zinc-900 focus:border-amber-600 focus:outline-hidden"
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
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Jatuh Tempo (Due Date)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-amber-600 focus:outline-hidden"
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
                    placeholder="cth: Rangkang Coffee Roastery"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 font-bold focus:border-amber-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Tier Harga</label>
                  <select
                    value={customerType}
                    onChange={(e) => handleTierChange(e.target.value as PricingTier)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-semibold text-zinc-900 focus:border-amber-600 focus:outline-hidden"
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
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Email Customer</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Alamat Pengiriman Lengkap</label>
                <textarea
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-amber-600 focus:outline-hidden"
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
                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
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
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs focus:border-amber-600 focus:outline-hidden"
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
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs focus:border-amber-600 focus:outline-hidden"
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
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono font-bold text-xs focus:border-amber-600 focus:outline-hidden"
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
                        className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 font-mono text-xs focus:border-amber-600 focus:outline-hidden"
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
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-zinc-900 focus:border-amber-600 focus:outline-hidden"
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
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-emerald-700 font-bold focus:border-amber-600 focus:outline-hidden"
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
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Catatan Pembayaran & Roastery</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:border-amber-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Printable A4 Invoice Template (lg:col-span-7) */}
        <div className="lg:col-span-7 sticky top-4">
          <div className="rounded-2xl border border-zinc-300 bg-zinc-200/50 p-3 sm:p-5 shadow-inner">
            <div className="flex items-center justify-between pb-3 text-xs text-zinc-600">
              <div className="flex items-center gap-1.5 font-bold">
                <Eye className="h-4 w-4 text-amber-700" />
                <span>Pratinjau Live Dokumen A4 (Siap Ekspor PDF)</span>
              </div>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-zinc-300">
                Ukuran: 210mm x 297mm
              </span>
            </div>

            {/* THE RENDERED INVOICE CONTAINER (Will be converted to Canvas & PDF) */}
            <div
              ref={invoicePrintRef}
              className={`w-full bg-white rounded-xl shadow-md p-6 sm:p-8 text-zinc-900 font-sans border transition-all ${
                templateTheme === 'modern'
                  ? 'border-amber-300 ring-1 ring-amber-400/20'
                  : templateTheme === 'rustic'
                  ? 'border-stone-400 bg-stone-50/30'
                  : templateTheme === 'minimal'
                  ? 'border-zinc-200'
                  : 'border-zinc-900 ring-2 ring-zinc-900/10'
              }`}
              style={{ minHeight: '840px' }}
            >
              {/* HEADER ROW */}
              <div
                className={`flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b ${
                  templateTheme === 'modern'
                    ? 'border-amber-500'
                    : templateTheme === 'rustic'
                    ? 'border-amber-900'
                    : 'border-zinc-900'
                }`}
              >
                {/* Roastery Identity */}
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-white ${
                        templateTheme === 'modern'
                          ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                          : templateTheme === 'rustic'
                          ? 'bg-amber-900'
                          : 'bg-zinc-900'
                      }`}
                    >
                      KF
                    </div>
                    <div>
                      <h1
                        className={`text-base sm:text-lg font-black tracking-tight ${
                          templateTheme === 'modern' ? 'text-amber-950' : 'text-zinc-950'
                        }`}
                      >
                        {companyName}
                      </h1>
                      <p className="text-[10px] text-zinc-500 font-medium">{companyTagline}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-600 mt-2.5 space-y-0.5">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span>{companyAddress}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span>{companyPhone}</span>
                      <span className="text-zinc-300">•</span>
                      <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span>{companyEmail}</span>
                    </p>
                    <p className="text-[10px] text-zinc-400">NPWP: {companyNpwp}</p>
                  </div>
                </div>

                {/* Invoice Title & Metadata */}
                <div className="text-left sm:text-right shrink-0">
                  <div
                    className={`text-xl sm:text-2xl font-black tracking-wider uppercase ${
                      templateTheme === 'modern'
                        ? 'text-amber-800'
                        : templateTheme === 'rustic'
                        ? 'text-amber-900'
                        : 'text-zinc-900'
                    }`}
                  >
                    FAKTUR PENJUALAN
                  </div>
                  <div className="font-mono text-sm font-extrabold text-zinc-900 mt-1">
                    {invoiceNumber}
                  </div>
                  <div className="text-xs text-zinc-600 mt-1 space-y-0.5">
                    <p>
                      Tanggal: <strong>{invoiceDate}</strong>
                    </p>
                    <p>
                      Jatuh Tempo: <strong>{dueDate}</strong>
                    </p>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        paymentStatus === 'Paid in Full'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : paymentStatus === 'Down Payment'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {paymentStatus === 'Paid in Full' ? '✓ LUNAS (PAID)' : paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER & DESTINATION SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">
                    Ditujukan Kepada:
                  </span>
                  <div className="font-extrabold text-sm text-zinc-900">{customerName || 'Nama Pelanggan'}</div>
                  <p className="text-zinc-600 mt-1 leading-relaxed">{customerAddress || 'Alamat Belum Diatur'}</p>
                  <p className="text-zinc-500 mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-zinc-400" />
                    <span>{customerPhone}</span>
                    {customerEmail && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span>{customerEmail}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-zinc-200 sm:pl-4 pt-3 sm:pt-0">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">
                    Informasi Pengiriman & Tier:
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-600">Tier Harga:</span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        Tier {customerType}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600">Wilayah Tujuan: </span>
                      <strong className="text-zinc-900">{destinationIsland}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-600">Metode Angkutan: </span>
                      <span className="font-medium text-zinc-800">Loket Bus / L300 Aceh & Kargo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMIZED TABLE */}
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className={`border-b-2 font-bold uppercase text-[10px] tracking-wider ${
                        templateTheme === 'modern'
                          ? 'border-amber-700 text-amber-950 bg-amber-50/50'
                          : templateTheme === 'rustic'
                          ? 'border-amber-900 text-amber-900 bg-stone-100'
                          : 'border-zinc-900 text-zinc-900 bg-zinc-100'
                      }`}
                    >
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Deskripsi Produk Biji Kopi</th>
                      <th className="py-2.5 px-3 text-center">Bentuk</th>
                      <th className="py-2.5 px-3 text-right">Qty (kg)</th>
                      <th className="py-2.5 px-3 text-right">Harga / kg</th>
                      <th className="py-2.5 px-3 text-right">Total (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 font-mono text-zinc-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900">{it.beanName}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                            {it.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-800">
                          {Number((it.quantityKg || 0).toFixed(2)).toLocaleString('id-ID', {
                            maximumFractionDigits: 2
                          })}{' '}
                          kg
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-700">
                          {formatIDR(it.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-zinc-900">
                          {formatIDR(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS & BREAKDOWN */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t border-zinc-200 text-xs">
                <div className="text-zinc-500 max-w-xs space-y-1">
                  <p>
                    Total Berat Biji Kopi:{' '}
                    <strong className="font-mono text-zinc-900">
                      {Number(totalWeightKg.toFixed(2)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg
                    </strong>
                  </p>
                  <p className="text-[11px] text-zinc-600 italic">"{notes}"</p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-zinc-600 bg-zinc-50/80 p-3 rounded-xl border border-zinc-200">
                  <div className="flex justify-between">
                    <span>Subtotal Produk:</span>
                    <span className="font-mono text-zinc-900 font-semibold">{formatIDR(subtotal)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Ongkos Kirim:</span>
                      <span className="font-mono text-zinc-900">{formatIDR(shippingCost)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
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
                  <div
                    className={`flex justify-between border-t pt-2 text-sm font-black ${
                      templateTheme === 'modern'
                        ? 'border-amber-500 text-amber-950'
                        : 'border-zinc-900 text-zinc-950'
                    }`}
                  >
                    <span>Total Pembayaran:</span>
                    <span className="font-mono text-base">{formatIDR(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT SECTION WITH QRIS & BANK */}
              <div className="mt-6 pt-4 border-t border-zinc-200 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                  {/* QRIS Box */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-2.5 bg-white rounded-lg border border-zinc-200 text-center">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="font-black text-[10px] tracking-wider text-zinc-900">QRIS</span>
                      <span className="rounded bg-emerald-600 px-1 py-0.2 text-[8px] font-bold text-white">GOPAY</span>
                    </div>
                    {qrisConfig.qrisImageUrl ? (
                      <img
                        src={qrisConfig.qrisImageUrl}
                        alt="QRIS GoPay"
                        className="w-24 h-24 object-contain rounded"
                      />
                    ) : (
                      <div className="w-24 h-24 flex flex-col items-center justify-center bg-zinc-100 rounded border border-dashed border-zinc-300">
                        <QrCode className="h-10 w-10 text-emerald-700 opacity-80" />
                        <span className="text-[8px] text-zinc-600 mt-0.5 font-bold">Scan QRIS</span>
                      </div>
                    )}
                    <span className="text-[9px] text-zinc-500 mt-1 font-mono">GoPay / BCA / Mandiri</span>
                  </div>

                  {/* Bank & Signature */}
                  <div className="sm:col-span-8 flex flex-col justify-between">
                    <div>
                      <strong className="text-[10px] uppercase font-bold text-zinc-700 block mb-1">
                        Instruksi Transfer Rekening Resmi:
                      </strong>
                      <div className="text-[11px] text-zinc-700 space-y-0.5">
                        <p>
                          Bank Mandiri: <strong className="font-mono text-zinc-950">137-00-19283-009</strong> (a.n PT Kofiara Nusantara)
                        </p>
                        <p>
                          Bank BCA: <strong className="font-mono text-zinc-950">872-0091-233</strong> (a.n PT Kofiara Nusantara)
                        </p>
                        <p>
                          GoPay / QRIS: <strong className="font-mono text-emerald-800">{qrisConfig.gopayNumber}</strong> ({qrisConfig.merchantName})
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-3 border-t border-zinc-200 mt-2">
                      <div className="text-[10px] text-zinc-400">
                        Dokumen dicetak otomatis via KopiFlow ERP
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-zinc-500">Hormat Kami,</div>
                        <div className="font-bold text-xs text-zinc-900 mt-6 underline">Kofiara Finance</div>
                        <div className="text-[9px] text-zinc-400">Lhokseumawe Hub</div>
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
