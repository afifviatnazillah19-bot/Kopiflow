import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import {
  NotificationLog,
  NotificationChannel,
  NotificationType,
  CoffeeBean,
  Order,
  Shipment,
  RoastLog
} from '../../types/erp';
import {
  formatIDR,
  buildWhatsAppLink,
  saveNotificationLog
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
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationType>('Order Invoice');

  // Composer fields
  const [recipient, setRecipient] = useState<string>('6281234567890');
  const [recipientEmail, setRecipientEmail] = useState<string>('customer@kopiflow-client.com');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(shipments[0]?.id || '');
  const [selectedRoastId, setSelectedRoastId] = useState<string>(roasts[0]?.id || '');
  const [customNote, setCustomNote] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

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
        const lowBeans = beans.filter((b) => b.stockGreenKg <= b.minAlertKg);
        const listStr = lowBeans
          .map((b) => `• *${b.name}*: Sisa ${b.stockGreenKg} kg (Batas Minimum: ${b.minAlertKg} kg)`)
          .join('\n');

        return {
          subject: `PERINGATAN GUDANG: Stok Biji Kopi Menipis`,
          body:
            `*PERINGATAN STOK GUDANG KOPIFLOW*\n\n` +
            `Kepada: Kepala Gudang & Tim Procurement,\n` +
            `Terdeteksi stok beberapa jenis biji kopi mentah telah menyentuh batas kritis threshold:\n\n` +
            `${listStr || '• Bali Kintamani Ulian: Sisa 380 kg\n• Sumatra Lintong: Sisa 310 kg'}\n\n` +
            `Harap segera lakukan pemesanan intake panen baru ke koperasi mitra.\n` +
            (customNote ? `Catatan: ${customNote}\n\n` : '') +
            `Sistem Real-Time KopiFlow ERP`
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

  // Handle WhatsApp launch
  const handleLaunchWhatsApp = async () => {
    const url = buildWhatsAppLink(recipient, body);

    // Save log to Firestore
    await saveNotificationLog({
      id: `notif-${Date.now().toString(36)}`,
      channel: 'WhatsApp',
      recipient: recipient,
      subject,
      messagePreview: body.slice(0, 200) + '...',
      type: selectedTemplate,
      status: 'Sent',
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdAt: new Date().toISOString()
    });

    onRefresh();
    window.open(url, '_blank');
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

  const filteredNotifications = notifications.filter((n) => {
    if (activeChannel === 'All') return true;
    return n.channel === activeChannel;
  });

  return (
    <div className="space-y-6">
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

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-800">
              WhatsApp Direct API & Mail Service Siap
            </span>
          </div>
        </div>
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
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleLaunchWhatsApp}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Buka WhatsApp Sekarang</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 px-4 text-xs font-bold text-white hover:bg-zinc-800 shadow-sm transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Kirim Email & Log</span>
            </button>
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
    </div>
  );
};
