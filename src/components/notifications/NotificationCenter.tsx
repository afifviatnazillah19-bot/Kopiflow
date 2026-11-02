import React, { useState, useEffect } from 'react';
import {
  BellRing,
  MessageCircle,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  Truck,
  Copy,
  ExternalLink,
  Filter,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Server,
  Radio,
  HelpCircle,
  CheckCircle,
  XCircle,
  Terminal,
  Zap,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import {
  NotificationLog,
  NotificationChannel,
  NotificationType,
  CoffeeBean,
  Order,
  Shipment,
  RoastLog,
  BusinessNotificationConfig,
  OpenWaConfig,
  WhatsAppProvider
} from '../../types/erp';
import {
  formatIDR,
  buildWhatsAppLink,
  buildEmailLink,
  saveNotificationLog,
  subscribeToNotificationConfig,
  saveNotificationConfig,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_OPENWA_CONFIG,
  buildLowStockAlertMessage,
  buildSingleBeanLowStockMessage,
  testOpenWaConnection,
  dispatchWhatsAppNotification
} from '../../services/dbService';

interface NotificationCenterProps {
  notifications: NotificationLog[];
  beans: CoffeeBean[];
  orders: Order[];
  shipments: Shipment[];
  roasts: RoastLog[];
  onRefresh: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  beans,
  orders,
  shipments,
  roasts,
  onRefresh
}) => {
  const [activeChannel, setActiveChannel] = useState<'All' | 'WhatsApp' | 'Email'>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationType>('Stock Alert');

  // Business Notification Config State
  const [notifConfig, setNotifConfig] = useState<BusinessNotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<BusinessNotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const unsub = subscribeToNotificationConfig((cfg) => {
      if (cfg) {
        setNotifConfig(cfg);
        setTempConfig(cfg);
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Composer fields (initialized with business contact)
  const [recipient, setRecipient] = useState<string>('6281269008899');
  const [recipientEmail, setRecipientEmail] = useState<string>('afifviatnazillah19@gmail.com');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(shipments[0]?.id || '');
  const [selectedRoastId, setSelectedRoastId] = useState<string>(roasts[0]?.id || '');
  const [selectedLowBeanId, setSelectedLowBeanId] = useState<string>('all');
  const [customNote, setCustomNote] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  // OpenWA (@open-wa/wa-automate) States
  const [isTestingOpenWa, setIsTestingOpenWa] = useState(false);
  const [openWaTestResult, setOpenWaTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    statusText: string;
  } | null>(null);
  const [showOpenWaGuideModal, setShowOpenWaGuideModal] = useState(false);
  const [isSendingWA, setIsSendingWA] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'contact' | 'openwa'>('contact');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleTestOpenWa = async () => {
    setIsTestingOpenWa(true);
    setOpenWaTestResult(null);
    try {
      const res = await testOpenWaConnection(
        tempConfig.openWa?.serverUrl || 'http://localhost:8080',
        tempConfig.openWa?.apiKey
      );
      setOpenWaTestResult({
        tested: true,
        ok: res.ok,
        statusText: res.statusText
      });
      if (res.ok) {
        showToast('🟢 Server OpenWA terhubung & siap digunakan!');
      } else {
        showToast(`🔴 ${res.statusText}`);
      }
    } catch (err: any) {
      setOpenWaTestResult({
        tested: true,
        ok: false,
        statusText: err?.message || 'Gagal tersambung ke server OpenWA'
      });
    } finally {
      setIsTestingOpenWa(false);
    }
  };

  // Sync recipient when template changes
  useEffect(() => {
    if (selectedTemplate === 'Stock Alert') {
      setRecipient(notifConfig.businessWhatsApp);
      setRecipientEmail(notifConfig.businessEmail);
    }
  }, [selectedTemplate, notifConfig]);

  // Dynamic preview text generator based on selected template
  const generateMessageText = (): { subject: string; body: string } => {
    switch (selectedTemplate) {
      case 'Order Invoice': {
        const ord = orders.find((o) => o.id === selectedOrderId) || orders[0];
        const invoiceNo = ord ? ord.invoiceNumber : 'INV/2026/X/088';
        const custName = ord ? ord.customerName : 'Pelanggan Terhormat';
        const total = ord ? formatIDR(ord.grandTotal) : 'Rp 8.610.000';
        const tier = ord ? ord.customerType : 'UMKM';

        return {
          subject: `Faktur & Konfirmasi Pesanan ${invoiceNo} - KopiFlow ERP`,
          body:
            `*FAKTUR PENJUALAN KOPIFLOW WAREHOUSE*\n\n` +
            `Halo Bapak/Ibu *${custName}*,\n` +
            `Terima kasih atas pesanan kopi Anda pada tier *${tier}*.\n\n` +
            `No. Faktur: *${invoiceNo}*\n` +
            `Total Tagihan: *${total}*\n` +
            `Status Pembayaran: *Lunas / Terverifikasi*\n\n` +
            `Pesanan saat ini sedang disiapkan oleh tim gudang untuk proses packing kemasan hermetic.\n` +
            `Rekening Pembayaran: BCA 872-0091-233 a.n PT KopiFlow Nusantara.\n\n` +
            (customNote ? `Catatan Tambahan: ${customNote}\n\n` : '') +
            `Salam hangat,\nTim KopiFlow Warehouse & Roast Lab`
        };
      }

      case 'Shipment Dispatched': {
        const shp = shipments.find((s) => s.id === selectedShipmentId) || shipments[0];
        const resi = shp ? shp.trackingNumber : 'IND-KRGO-78921004-BPN';
        const courier = shp ? shp.courierName : 'Indah Logistik Kargo';
        const dest = shp ? `${shp.destinationRegion} (${shp.destinationIsland})` : 'Balikpapan';
        const est = shp ? shp.estimatedDelivery : '31 Okt 2026';

        return {
          subject: `Update Pengiriman & No. Resi Kargo ${resi}`,
          body:
            `*UPDATE PENGIRIMAN KARGO KOPIFLOW*\n\n` +
            `Halo *${shp ? shp.customerName : 'Pelanggan'}*,\n` +
            `Pesanan kopi Anda telah diserahkan kepada armada kargo logistik antarpulau.\n\n` +
            `No. Resi Kargo: *${resi}*\n` +
            `Ekspedisi: *${courier}*\n` +
            `Tujuan: *${dest}*\n` +
            `Estimasi Tiba di Pelabuhan/Hub: *${est}*\n\n` +
            `Kemasan terlindungi GrainPro barrier moisture ganda.\n` +
            (customNote ? `Catatan Logistik: ${customNote}\n\n` : '') +
            `Terima kasih atas kerja samanya!`
        };
      }

      case 'Stock Alert': {
        if (selectedLowBeanId !== 'all') {
          const target = beans.find((b) => b.id === selectedLowBeanId);
          if (target) {
            const { subject, body } = buildSingleBeanLowStockMessage(target, notifConfig);
            return {
              subject,
              body: customNote ? `${body}\n\n*Catatan Khusus:* ${customNote}` : body
            };
          }
        }
        const { subject, body } = buildLowStockAlertMessage(beans, notifConfig);
        return {
          subject,
          body: customNote ? `${body}\n\n*Catatan Tambahan:* ${customNote}` : body
        };
      }

      case 'Roast QC Alert': {
        const r = roasts.find((rst) => rst.id === selectedRoastId) || roasts[0];
        const roastNo = r ? r.roastNumber : 'RST-2026-052';
        const beanName = r ? r.beanName : 'Aceh Gayo Pantan Musara';
        const score = r ? r.cuppingScore : 86.75;
        const notes = r ? r.cuppingNotes : 'Jasmine blossom, brown sugar, crisp malic acidity';

        return {
          subject: `Laporan Hasil Sangrai & QC Cupping ${roastNo}`,
          body:
            `*LAPORAN HASIL SANGRAI & QC SENSORI*\n\n` +
            `No. Sangrai: *${roastNo}*\n` +
            `Biji Kopi: *${beanName}*\n` +
            `Skor Cupping SCA: *${score} PTS (Passed QC)*\n` +
            `Tasting Notes: "${notes}"\n` +
            `Penyusutan Bobot: ${r ? r.weightLossPercent.toFixed(1) : 13.6}%\n` +
            `Development Time Ratio (DTR): ${r ? r.dtrPercent.toFixed(1) : 19.3}%\n\n` +
            `Batch ini telah disetujui dan dimasukkan ke stok Roasted Bean siap kirim.\n` +
            (customNote ? `Catatan Roaster: ${customNote}\n\n` : '') +
            `Roast Lab KopiFlow Nusantara`
        };
      }

      case 'Delivery Confirmed': {
        const shp = shipments.find((s) => s.id === selectedShipmentId) || shipments[0];
        const resi = shp ? shp.trackingNumber : 'IND-KRGO-78921004-BPN';
        return {
          subject: `Konfirmasi Penerimaan Kargo ${resi} Selesai`,
          body:
            `*KONFIRMASI PENERIMAAN KARGO SELESAI*\n\n` +
            `Kargo dengan No. Resi *${resi}* telah berhasil diterima dalam kondisi baik.\n` +
            `Terima kasih telah mempercayakan pasokan kopi Anda kepada KopiFlow Warehouse.\n\n` +
            `Salam hangat,\nCustomer Success KopiFlow`
        };
      }

      case 'Surat Jalan Loket':
      default: {
        return {
          subject: `Surat Jalan Pengiriman via Loket Aceh - KopiFlow`,
          body:
            `*SURAT JALAN LOKET ANGKUTAN ACEH*\n\n` +
            `Paket kopi telah dititipkan di loket angkutan Aceh.\n` +
            `Silakan ambil di loket tujuan dengan menunjukkan bukti identitas / no. resi.\n\n` +
            `Tim Logistik KopiFlow`
        };
      }
    }
  };

  const { subject, body } = generateMessageText();

  // Handle WhatsApp launch (OpenWA REST API or wa.me direct fallback)
  const handleLaunchWhatsApp = async () => {
    setIsSendingWA(true);
    try {
      const res = await dispatchWhatsAppNotification(recipient, body, notifConfig);

      // Save log to Firestore
      await saveNotificationLog({
        id: `notif-${Date.now().toString(36)}`,
        channel: 'WhatsApp',
        recipient: recipient,
        subject,
        messagePreview: body.slice(0, 200) + '...',
        type: selectedTemplate,
        status: res.success ? 'Sent' : 'Failed',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdAt: new Date().toISOString()
      });

      onRefresh();

      if (res.channel === 'openwa' && res.success) {
        showToast(res.message);
      } else if (res.url) {
        showToast(res.message);
        window.open(res.url, '_blank');
      } else {
        showToast(`⚠️ ${res.error || res.message}`);
      }
    } catch (err: any) {
      showToast(`Error kirim WhatsApp: ${err?.message || 'Gagal'}`);
    } finally {
      setIsSendingWA(false);
    }
  };

  // Handle Copy message
  const handleCopyText = () => {
    navigator.clipboard.writeText(body);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Handle Email Launch & Log
  const handleSendEmail = async () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Save log to Firestore
    await saveNotificationLog({
      id: `notif-${Date.now().toString(36)}`,
      channel: 'Email',
      recipient: recipientEmail,
      subject,
      messagePreview: body.slice(0, 200) + '...',
      type: selectedTemplate,
      status: 'Sent',
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdAt: new Date().toISOString()
    });

    onRefresh();
    window.location.href = mailtoUrl;
  };

  const lowStockBeans = beans.filter(
    (b) => (b.stockGreenKg || 0) <= (b.minAlertKg || notifConfig.defaultMinThresholdKg)
  );

  const handleQuickSendAllWA = async () => {
    setIsSendingWA(true);
    try {
      const { subject, body } = buildLowStockAlertMessage(beans, notifConfig);
      const res = await dispatchWhatsAppNotification(
        notifConfig.businessWhatsApp,
        body,
        notifConfig
      );

      await saveNotificationLog({
        id: `notif-wa-bulk-${Date.now().toString(36)}`,
        channel: 'WhatsApp',
        recipient: notifConfig.businessWhatsApp,
        subject,
        messagePreview: body.slice(0, 200) + '...',
        type: 'Stock Alert',
        status: res.success ? 'Sent' : 'Failed',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdAt: new Date().toISOString()
      });

      onRefresh();

      if (res.channel === 'openwa' && res.success) {
        showToast(res.message);
      } else if (res.url) {
        showToast(res.message);
        window.open(res.url, '_blank');
      } else {
        showToast(`⚠️ ${res.error || res.message}`);
      }
    } catch (err: any) {
      showToast(`Error kirim WhatsApp: ${err?.message || 'Gagal'}`);
    } finally {
      setIsSendingWA(false);
    }
  };

  const handleQuickSendAllEmail = async () => {
    const { subject, body } = buildLowStockAlertMessage(beans, notifConfig);
    const mailtoUrl = buildEmailLink(notifConfig.businessEmail, subject, body);

    await saveNotificationLog({
      id: `notif-email-bulk-${Date.now().toString(36)}`,
      channel: 'Email',
      recipient: notifConfig.businessEmail,
      subject,
      messagePreview: body.slice(0, 200) + '...',
      type: 'Stock Alert',
      status: 'Sent',
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdAt: new Date().toISOString()
    });

    onRefresh();
    showToast(`Peringatan Email Bisnis dikirim ke ${notifConfig.businessEmail}`);
    window.location.href = mailtoUrl;
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveNotificationConfig(tempConfig);
    setNotifConfig(tempConfig);
    setIsEditingConfig(false);
    showToast('Pengaturan kontak bisnis & ambang batas minimal berhasil diperbarui!');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeChannel === 'All') return true;
    return n.channel === activeChannel;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="rounded-xl bg-emerald-600 text-white p-3.5 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
          {toastMsg}
        </div>
      )}

      {/* Top Banner & Quick Explanation */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Pusat Otomatisasi Notifikasi WhatsApp & Email
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Kirim langsung pesan ke pelanggan dan tim gudang dengan template resmi ERP KopiFlow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {notifConfig.openWa?.enabled && notifConfig.openWa?.provider === 'openwa' ? (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Zap className="h-3.5 w-3.5 text-emerald-600" />
                <span>OpenWA Gateway Aktif ({notifConfig.openWa.serverUrl})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mode WhatsApp Direct (wa.me)</span>
              </div>
            )}

            <button
              onClick={() => setShowOpenWaGuideModal(true)}
              className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Panduan OpenWA</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: OTOMATISASI PERINGATAN STOK MENIPIS GUDANG */}
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-zinc-900">
                  Mesin Peringatan Otomatis Stok Menipis Gudang
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    lowStockBeans.length > 0
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {lowStockBeans.length > 0
                    ? `⚠️ ${lowStockBeans.length} SKU Di Bawah Batas Minimal`
                    : '✓ Semua Stok Aman'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">
                Sistem memantau saldo green beans dan memicu notifikasi otomatis ke nomor WhatsApp & Email bisnis di bawah.
              </p>
            </div>
          </div>

          {/* Settings Toggle & Quick Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleQuickSendAllWA}
              disabled={lowStockBeans.length === 0 || isSendingWA}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                lowStockBeans.length > 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isSendingWA ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : notifConfig.openWa?.enabled && notifConfig.openWa?.provider === 'openwa' ? (
                <Zap className="h-4 w-4 text-amber-200" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              <span>
                {isSendingWA
                  ? 'Mengirim...'
                  : notifConfig.openWa?.enabled && notifConfig.openWa?.provider === 'openwa'
                  ? `Kirim via OpenWA (${notifConfig.businessWhatsApp})`
                  : `Kirim via WhatsApp (${notifConfig.businessWhatsApp})`}
              </span>
            </button>

            <button
              onClick={handleQuickSendAllEmail}
              disabled={lowStockBeans.length === 0}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                lowStockBeans.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Kirim Email Bisnis</span>
            </button>

            <button
              onClick={() => setIsEditingConfig(!isEditingConfig)}
              className="flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
              <span>{isEditingConfig ? 'Tutup Pengaturan' : 'Atur Kontak & OpenWA'}</span>
            </button>
          </div>
        </div>

        {/* Current Target Contact Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-zinc-200">
            <span className="text-zinc-400 font-medium">WhatsApp Tujuan:</span>
            <span className="font-mono font-bold text-emerald-800">
              {notifConfig.businessWhatsApp}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-zinc-200">
            <span className="text-zinc-400 font-medium">Email Bisnis:</span>
            <span className="font-mono font-bold text-blue-800">
              {notifConfig.businessEmail}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-zinc-200">
            <span className="text-zinc-400 font-medium">Penerima:</span>
            <span className="font-semibold text-zinc-800">
              {notifConfig.managerName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-zinc-200">
            <span className="text-zinc-400 font-medium">Batas Minimal:</span>
            <span className="font-mono font-bold text-amber-800">
              {notifConfig.defaultMinThresholdKg} kg
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-zinc-200">
            <span className="text-zinc-400 font-medium">Engine WhatsApp:</span>
            {notifConfig.openWa?.enabled && notifConfig.openWa?.provider === 'openwa' ? (
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <Server className="h-3.5 w-3.5 text-emerald-600" />
                <span>OpenWA REST Gateway</span>
              </span>
            ) : (
              <span className="font-semibold text-zinc-700 flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Direct Link (wa.me)</span>
              </span>
            )}
          </div>
        </div>

        {/* Expandable Settings Form with Sub-Tabs */}
        {isEditingConfig && (
          <form
            onSubmit={handleSaveConfig}
            className="rounded-xl border border-amber-200 bg-white p-4 space-y-4 text-xs animate-in fade-in duration-150"
          >
            {/* Sub-tab selection */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('contact')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    settingsSubTab === 'contact'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Kontak & Batas Minimal Stok</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsSubTab('openwa')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    settingsSubTab === 'openwa'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Server className="h-3.5 w-3.5" />
                  <span>OpenWA WhatsApp API Gateway</span>
                  {tempConfig.openWa?.enabled && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowOpenWaGuideModal(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Panduan Setup OpenWA</span>
              </button>
            </div>

            {/* TAB 1: KONTAK & AMBANG BATAS */}
            {settingsSubTab === 'contact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-100">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Nomor WhatsApp Bisnis
                  </label>
                  <input
                    type="text"
                    value={tempConfig.businessWhatsApp}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, businessWhatsApp: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-amber-600 focus:outline-hidden"
                    placeholder="081269008899"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Email Bisnis Resmi
                  </label>
                  <input
                    type="email"
                    value={tempConfig.businessEmail}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, businessEmail: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-blue-600 focus:outline-hidden"
                    placeholder="afifviatnazillah19@gmail.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Nama Penerima / Jabatan
                  </label>
                  <input
                    type="text"
                    value={tempConfig.managerName}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, managerName: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-600 focus:outline-hidden"
                    placeholder="Kepala Gudang KopiFlow"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Batas Minimal Stok Standar (kg)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={tempConfig.defaultMinThresholdKg}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        defaultMinThresholdKg: Number(e.target.value)
                      })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: OPENWA API CONFIGURATION */}
            {settingsSubTab === 'openwa' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5 mb-1">
                    <Cpu className="h-4 w-4 text-emerald-700" />
                    <span>Mode Pengiriman Pesan WhatsApp</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mb-3">
                    Pilih antara mode tautan langsung (wa.me) atau server otomasi OpenWA (@open-wa/wa-automate)
                    yang mengirim pesan di latar belakang tanpa membuka tab browser.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        tempConfig.openWa?.provider === 'direct'
                          ? 'border-emerald-600 bg-white shadow-xs'
                          : 'border-zinc-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="waProvider"
                        value="direct"
                        checked={tempConfig.openWa?.provider === 'direct' || !tempConfig.openWa?.enabled}
                        onChange={() =>
                          setTempConfig({
                            ...tempConfig,
                            openWa: {
                              ...(tempConfig.openWa || DEFAULT_OPENWA_CONFIG),
                              enabled: false,
                              provider: 'direct'
                            }
                          })
                        }
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <div className="font-bold text-zinc-900 text-xs">
                          Mode 1: WhatsApp Direct Link (wa.me)
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          Gratis, tanpa instalasi server. Mengarahkan ke WhatsApp Web/App di browser.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        tempConfig.openWa?.provider === 'openwa' && tempConfig.openWa?.enabled
                          ? 'border-emerald-600 bg-white shadow-xs ring-1 ring-emerald-500'
                          : 'border-zinc-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="waProvider"
                        value="openwa"
                        checked={tempConfig.openWa?.provider === 'openwa' && tempConfig.openWa?.enabled}
                        onChange={() =>
                          setTempConfig({
                            ...tempConfig,
                            openWa: {
                              ...(tempConfig.openWa || DEFAULT_OPENWA_CONFIG),
                              enabled: true,
                              provider: 'openwa'
                            }
                          })
                        }
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                          <span>Mode 2: OpenWA REST API Gateway</span>
                          <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                            Auto-Send
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          Kirim otomatis di latar belakang via HTTP POST ke daemon OpenWA tanpa buka tab.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* OpenWA Server Inputs */}
                {tempConfig.openWa?.provider === 'openwa' && (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-3">
                    <div className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                      <Server className="h-4 w-4 text-zinc-700" />
                      <span>Parameter Server OpenWA</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-zinc-700 mb-1">
                          URL Server OpenWA REST API
                        </label>
                        <input
                          type="text"
                          value={tempConfig.openWa?.serverUrl || 'http://localhost:8080'}
                          onChange={(e) =>
                            setTempConfig({
                              ...tempConfig,
                              openWa: {
                                ...(tempConfig.openWa || DEFAULT_OPENWA_CONFIG),
                                serverUrl: e.target.value
                              }
                            })
                          }
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono focus:border-emerald-600 focus:outline-hidden"
                          placeholder="http://localhost:8080"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Port standar OpenWA REST: 8080 (contoh: http://localhost:8080 atau IP VPS Anda)
                        </p>
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">
                          Session ID
                        </label>
                        <input
                          type="text"
                          value={tempConfig.openWa?.sessionId || 'kopiflow'}
                          onChange={(e) =>
                            setTempConfig({
                              ...tempConfig,
                              openWa: {
                                ...(tempConfig.openWa || DEFAULT_OPENWA_CONFIG),
                                sessionId: e.target.value
                              }
                            })
                          }
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono focus:border-emerald-600 focus:outline-hidden"
                          placeholder="kopiflow"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block font-semibold text-zinc-700 mb-1">
                          API Key / Bearer Secret (Opsional)
                        </label>
                        <input
                          type="password"
                          value={tempConfig.openWa?.apiKey || ''}
                          onChange={(e) =>
                            setTempConfig({
                              ...tempConfig,
                              openWa: {
                                ...(tempConfig.openWa || DEFAULT_OPENWA_CONFIG),
                                apiKey: e.target.value
                              }
                            })
                          }
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono focus:border-emerald-600 focus:outline-hidden"
                          placeholder="Kosongkan jika server OpenWA dijalankan tanpa password"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempConfig.openWa?.autoFallbackToDirect ?? true}
                          onChange={(e) =>
                            setTempConfig({
                              ...tempConfig,
                              openWa: {
                                ...(tempConfig.openWa || DEFAULT_OPENWA_CONFIG),
                                autoFallbackToDirect: e.target.checked
                              }
                            })
                          }
                          className="rounded text-emerald-600"
                        />
                        <span className="text-zinc-700 font-medium text-[11px]">
                          Auto-fallback ke WhatsApp Direct (wa.me) jika server OpenWA mati/offline
                        </span>
                      </label>

                      {/* Ping Test Button */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTestOpenWa}
                          disabled={isTestingOpenWa}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${isTestingOpenWa ? 'animate-spin' : ''}`}
                          />
                          <span>{isTestingOpenWa ? 'Menguji Koneksi...' : 'Test Ping Server'}</span>
                        </button>

                        {openWaTestResult && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              openWaTestResult.ok
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {openWaTestResult.ok ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {openWaTestResult.statusText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsEditingConfig(false)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-700 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-800"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </form>
        )}

        {/* Low Stock Items List if Any */}
        {lowStockBeans.length > 0 && (
          <div className="pt-2">
            <span className="block text-[11px] font-bold text-rose-800 mb-1.5 uppercase tracking-wide">
              Daftar Biji Kopi di Bawah Batas Minimal Saat Ini:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockBeans.map((b) => {
                const min = b.minAlertKg || notifConfig.defaultMinThresholdKg;
                const deficit = Math.max(0, min - b.stockGreenKg);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-rose-200 bg-white p-3 shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 text-xs">{b.name}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Sisa: <span className="font-bold text-rose-700 font-mono">{b.stockGreenKg} kg</span> / Min: {min} kg
                      </div>
                      <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                        Defisit: -{deficit} kg ({b.storageLocation || 'Silo Utama'})
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setSelectedTemplate('Stock Alert');
                          setSelectedLowBeanId(b.id);
                        }}
                        className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-200"
                      >
                        Pilih di Composer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Composer on Left / Top, Log History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Template Composer (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="font-bold text-sm text-zinc-900">Pengirim Pesan Terformat</h3>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Live Preview
            </span>
          </div>

          {/* Template Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Pilih Jenis Template Notifikasi
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as NotificationType)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-hidden"
            >
              <option value="Order Invoice">1. Faktur & Konfirmasi Pesanan (Invoice)</option>
              <option value="Shipment Dispatched">2. Update Pengiriman & Resi Kargo</option>
              <option value="Stock Alert">3. Peringatan Stok Menipis (Gudang)</option>
              <option value="Roast QC Alert">4. Laporan Hasil Sangrai & Cupping QC</option>
              <option value="Delivery Confirmed">5. Konfirmasi Kargo Diterima</option>
            </select>
          </div>

          {/* Dynamic selector for linked order / shipment / roast */}
          {selectedTemplate === 'Order Invoice' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Tautkan Faktur Pesanan
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  const ord = orders.find((o) => o.id === e.target.value);
                  if (ord) {
                    setRecipient(ord.customerPhone);
                    setRecipientEmail(ord.customerEmail);
                  }
                }}
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.invoiceNumber} - {o.customerName} ({formatIDR(o.grandTotal)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTemplate === 'Shipment Dispatched' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Tautkan Pengiriman Kargo
              </label>
              <select
                value={selectedShipmentId}
                onChange={(e) => {
                  setSelectedShipmentId(e.target.value);
                  const shp = shipments.find((s) => s.id === e.target.value);
                  if (shp) setRecipient(shp.customerPhone);
                }}
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
              >
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.trackingNumber} - {s.customerName} ({s.destinationIsland})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTemplate === 'Stock Alert' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Tautkan Data Stok Menipis Gudang
              </label>
              <select
                value={selectedLowBeanId}
                onChange={(e) => setSelectedLowBeanId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
              >
                <option value="all">
                  Semua Biji Di Bawah Batas Minimal ({beans.filter((b) => b.stockGreenKg <= b.minAlertKg).length} jenis)
                </option>
                {beans.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} - Sisa {b.stockGreenKg} kg (Batas Min: {b.minAlertKg} kg)
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTemplate === 'Roast QC Alert' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Tautkan Sesi Sangrai Roast Lab
              </label>
              <select
                value={selectedRoastId}
                onChange={(e) => setSelectedRoastId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
              >
                {roasts.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roastNumber} - {r.beanName} ({r.cuppingScore} SCA)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contact Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                No. WhatsApp Tujuan
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="6281234567890"
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Email Tujuan
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="customer@roastery.com"
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Catatan Kustom (Opsional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="cth: Mohon konfirmasi saat kurir tiba di lokasi..."
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Formatted Text Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-600">Pratinjau Pesan:</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                <span>{copySuccess ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
            <div className="rounded-xl bg-zinc-900 p-3 font-mono text-[11px] text-zinc-200 whitespace-pre-wrap max-h-52 overflow-y-auto border border-zinc-800">
              {body}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleLaunchWhatsApp}
                disabled={isSendingWA}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-60"
              >
                {isSendingWA ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : notifConfig.openWa?.enabled && notifConfig.openWa?.provider === 'openwa' ? (
                  <Zap className="h-4 w-4 text-amber-200" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                <span>
                  {isSendingWA
                    ? 'Memproses Kirim...'
                    : notifConfig.openWa?.enabled && notifConfig.openWa?.provider === 'openwa'
                    ? 'Kirim via OpenWA API (Background)'
                    : 'Buka di WhatsApp (wa.me)'}
                </span>
              </button>

              <button
                onClick={handleSendEmail}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 px-4 text-xs font-bold text-white hover:bg-zinc-800 shadow-sm transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Kirim Email & Log</span>
              </button>
            </div>

            {/* Provider indicator */}
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Engine Aktif:</span>
                {notifConfig.openWa?.enabled && notifConfig.openWa?.provider === 'openwa' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    OpenWA REST ({notifConfig.openWa.serverUrl})
                  </span>
                ) : (
                  <span className="text-zinc-600 flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-emerald-600" />
                    Direct Link (wa.me)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingConfig(true);
                  setSettingsSubTab('openwa');
                }}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
              >
                Konfigurasi OpenWA
              </button>
            </div>
          </div>
        </div>

        {/* Right: Notification Dispatch History Logs (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-100 gap-2">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Riwayat Log Notifikasi Terkirim</h3>
              <p className="text-xs text-zinc-500">
                Pencatatan sinkron Firestore untuk audit trail pesan WhatsApp dan Email
              </p>
            </div>

            {/* Filter buttons */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs">
              {(['All', 'WhatsApp', 'Email'] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setActiveChannel(ch)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    activeChannel === ch
                      ? 'bg-white text-zinc-900 shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Logs List */}
          <div className="divide-y divide-zinc-100 max-h-[580px] overflow-y-auto pr-1">
            {filteredNotifications.map((n) => {
              const isWA = n.channel === 'WhatsApp';

              return (
                <div key={n.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isWA
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isWA ? <MessageCircle className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                        <span>{n.channel}</span>
                      </span>

                      <span className="font-bold text-xs text-zinc-900 truncate">{n.subject}</span>
                    </div>

                    <span className="text-[10px] text-zinc-400 font-mono shrink-0">{n.sentAt}</span>
                  </div>

                  <p className="text-xs text-zinc-600 line-clamp-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                    {n.messagePreview}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>
                      Penerima: <strong className="text-zinc-700">{n.recipient}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{n.status}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: PANDUAN LENGKAP OPENWA (@open-wa/wa-automate) */}
      {showOpenWaGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Panduan Integrasi OpenWA API WhatsApp</h3>
                  <p className="text-xs text-emerald-100">
                    Kirim pesan otomatis di latar belakang tanpa membuka tab browser (Headless REST API)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOpenWaGuideModal(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-zinc-700">
              {/* Penjelasan Konsep */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span>Bagaimana Cara Kerja OpenWA di KopiFlow ERP?</span>
                </div>
                <p className="leading-relaxed text-zinc-700">
                  Secara default, tombol WhatsApp di web menggunakan <strong>Direct Link (wa.me)</strong> yang membuka
                  aplikasi WhatsApp dan mengharuskan Anda mengklik tombol "Kirim" secara manual.
                </p>
                <p className="leading-relaxed text-zinc-700">
                  Dengan <strong>OpenWA (@open-wa/wa-automate)</strong>, Anda menjalankan server kecil di komputer/VPS.
                  Aplikasi KopiFlow akan langsung mengirimkan perintah HTTP POST (<code>/sendText</code>) ke server OpenWA,
                  sehingga pesan peringatan stok menipis, faktur, atau resi <strong>langsung terkirim secara otomatis di latar belakang</strong> tanpa popup!
                </p>
              </div>

              {/* Langkah-langkah Setup */}
              <div className="space-y-4">
                <div className="font-extrabold text-sm text-zinc-900 border-b border-zinc-200 pb-1.5">
                  3 Langkah Menjalankan OpenWA:
                </div>

                {/* Step 1 */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-extrabold">
                        1
                      </span>
                      Jalankan Server OpenWA (Pilih Docker atau Node.js)
                    </span>
                  </div>

                  {/* Opsi A: Docker */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-600 text-[11px]">
                        Opsi A: Menggunakan Docker (Direkomendasikan)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            'docker run -d --name openwa -p 8080:8080 openwa/wa-automate',
                            'docker'
                          )
                        }
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedSnippet === 'docker' ? 'Tersalin!' : 'Salin Perintah'}</span>
                      </button>
                    </div>
                    <pre className="rounded-lg bg-zinc-900 p-2.5 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                      docker run -d --name openwa -p 8080:8080 openwa/wa-automate
                    </pre>
                  </div>

                  {/* Opsi B: NPX */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-600 text-[11px]">
                        Opsi B: Menggunakan Node.js / NPX Langsung di Terminal
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            'npx @open-wa/wa-automate-cli --port=8080 --session-id=kopiflow',
                            'npx'
                          )
                        }
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedSnippet === 'npx' ? 'Tersalin!' : 'Salin Perintah'}</span>
                      </button>
                    </div>
                    <pre className="rounded-lg bg-zinc-900 p-2.5 font-mono text-[11px] text-amber-300 overflow-x-auto">
                      npx @open-wa/wa-automate-cli --port=8080 --session-id=kopiflow
                    </pre>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                  <div className="font-bold text-amber-950 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white text-[11px] font-extrabold">
                      2
                    </span>
                    <span>Di Mana Lokasi Scan QR Code-nya?</span>
                  </div>
                  <ul className="space-y-1.5 text-zinc-700 leading-relaxed pl-7 list-disc">
                    <li>
                      <strong>Di Terminal / Konsol:</strong> QR Code gambar dari karakter ASCII akan tercetak langsung di dalam jendela Terminal tempat Anda menjalankan perintah di atas.
                    </li>
                    <li>
                      <strong>Di Browser Web:</strong> Buka tab baru di browser dan akses{' '}
                      <code className="bg-white border border-amber-300 px-1.5 py-0.5 rounded text-amber-900 font-mono font-bold">
                        http://localhost:8080
                      </code>{' '}
                      (atau port yang Anda pilih). QR Code akan tampil di layar.
                    </li>
                    <li>
                      Buka aplikasi WhatsApp di HP &rarr; masuk ke <strong>Perangkat Tertaut (Linked Devices)</strong> &rarr; scan QR Code tersebut. Cukup 1x scan saja!
                    </li>
                  </ul>
                </div>

                {/* FAQ / Port Custom */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
                  <div className="font-bold text-zinc-900 flex items-center gap-2">
                    <Server className="h-4 w-4 text-emerald-700" />
                    <span>Bagaimana Jika Port 8080 Bentrok atau Tidak Bisa Digunakan?</span>
                  </div>
                  <p className="leading-relaxed text-zinc-600">
                    Anda bebas menggunakan port berapa saja (misalnya <strong>8081, 3000, 5000, 8888, dll</strong>). Cukup ganti angka port di terminal dan sesuaikan URL di KopiFlow ERP.
                  </p>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-700 text-[11px]">
                        Contoh Perintah Menggunakan Port 8081:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            'npx @open-wa/wa-automate-cli --port=8081 --session-id=kopiflow',
                            'port8081'
                          )
                        }
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedSnippet === 'port8081' ? 'Tersalin!' : 'Salin Port 8081'}</span>
                      </button>
                    </div>
                    <pre className="rounded-lg bg-zinc-900 p-2 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                      npx @open-wa/wa-automate-cli --port=8081 --session-id=kopiflow
                    </pre>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-1.5">
                  <div className="font-bold text-zinc-900 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-extrabold">
                      3
                    </span>
                    Aktifkan & Hubungkan di KopiFlow ERP
                  </div>
                  <p className="leading-relaxed text-zinc-600">
                    Di KopiFlow ERP, buka <strong>Atur Kontak & OpenWA</strong> &rarr; pilih tab <strong>OpenWA WhatsApp API Gateway</strong> &rarr;
                    masukkan URL server (<code className="font-mono bg-zinc-200 px-1 rounded">http://localhost:8080</code> atau <code className="font-mono bg-zinc-200 px-1 rounded">http://localhost:8081</code>) &rarr;
                    tekan <strong>Test Ping Server</strong> hingga muncul tanda 🟢 Online &rarr; lalu tekan <strong>Simpan Konfigurasi</strong>.
                  </p>
                </div>
              </div>

              {/* Fitur Keamanan Auto-Fallback */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-blue-950">Fitur Keamanan Auto-Fallback Aktif</div>
                  <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                    Jika server OpenWA Anda sedang offline, mati listrik, atau tidak merespons, sistem KopiFlow
                    secara cerdas akan langsung mengalihkan pengiriman ke WhatsApp Direct (wa.me) sehingga
                    peringatan stok gudang dan pesan pelanggan tidak akan pernah terlewat.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-3.5">
              <span className="text-[11px] text-zinc-500">
                Pustaka resmi: <code className="font-mono text-zinc-700">@open-wa/wa-automate</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowOpenWaGuideModal(false);
                  setIsEditingConfig(true);
                  setSettingsSubTab('openwa');
                }}
                className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
              >
                Buka Pengaturan OpenWA Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

