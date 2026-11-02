import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  Database,
  RefreshCw,
  CheckCircle2,
  Layers,
  Package,
  Users,
  ArrowDownUp,
  Flame,
  ShoppingCart,
  Truck,
  BellRing,
  Copy,
  Check,
  ShieldAlert,
  Server
} from 'lucide-react';
import {
  CoffeeBean,
  Batch,
  RoastLog,
  Order,
  Shipment,
  NotificationLog,
  Partner,
  InboundMovement,
  OutboundMovement
} from '../../types/erp';
import {
  clearAllCollections,
  clearCollection,
  seedNeutralTestData,
  COLLECTIONS
} from '../../services/dbService';

interface DataSettingsManagerProps {
  beans: CoffeeBean[];
  batches: Batch[];
  roasts: RoastLog[];
  orders: Order[];
  shipments: Shipment[];
  notifications: NotificationLog[];
  partners: Partner[];
  inbound: InboundMovement[];
  outbound: OutboundMovement[];
}

export const DataSettingsManager: React.FC<DataSettingsManagerProps> = ({
  beans,
  batches,
  roasts,
  orders,
  shipments,
  notifications,
  partners,
  inbound,
  outbound
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  // Modal State for Total Wipe
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  // Modal State for Single Collection Wipe
  const [singleWipeTarget, setSingleWipeTarget] = useState<{
    key: keyof typeof COLLECTIONS;
    label: string;
    count: number;
  } | null>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  const handleClearAll = async () => {
    if (confirmInput.trim().toUpperCase() !== 'HAPUS') {
      return;
    }
    setIsProcessing(true);
    try {
      await clearAllCollections();
      showNotification('Seluruh data database berhasil dikosongkan!');
      setIsWipeModalOpen(false);
      setConfirmInput('');
    } catch (err) {
      console.warn('Wipe all notice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSingle = async () => {
    if (!singleWipeTarget) return;
    setIsProcessing(true);
    try {
      await clearCollection(singleWipeTarget.key);
      showNotification(`Data ${singleWipeTarget.label} berhasil dihapus.`);
      setSingleWipeTarget(null);
    } catch (err) {
      console.warn('Wipe single notice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeedTemplate = async () => {
    setIsProcessing(true);
    try {
      await seedNeutralTestData();
      showNotification('Template data uji coba (Kopi Gayo & Loket Aceh) berhasil dimuat!');
    } catch (err) {
      console.warn('Seed notice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(firestoreRulesSnippet);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const totalRecords =
    beans.length +
    batches.length +
    roasts.length +
    orders.length +
    shipments.length +
    notifications.length +
    partners.length +
    inbound.length +
    outbound.length;

  const dataModules: {
    key: keyof typeof COLLECTIONS;
    label: string;
    desc: string;
    count: number;
    icon: React.ElementType;
    badgeColor: string;
  }[] = [
    {
      key: 'PARTNERS',
      label: 'Data Relasi (Mitra & Loket)',
      desc: 'Kontak petani pemasok, pelanggan kedai, dan loket angkutan Aceh (L300/Bus).',
      count: partners.length,
      icon: Users,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      key: 'BEANS',
      label: 'Stok Biji Kopi',
      desc: 'Master varietas biji mentah (Green Bean) dan biji sangrai (Roasted Bean).',
      count: beans.length,
      icon: Package,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      key: 'BATCHES',
      label: 'Manajemen Batch & Lot',
      desc: 'Nomor lot panen gudang, kadar air (MC), proses, dan sertifikasi.',
      count: batches.length,
      icon: Layers,
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      key: 'INBOUND',
      label: 'Barang Masuk (Inbound)',
      desc: 'Penerimaan kopi dari petani/suplier beserta pencatatan berat dan supir.',
      count: inbound.length,
      icon: ArrowDownUp,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      key: 'OUTBOUND',
      label: 'Barang Keluar (Outbound)',
      desc: 'Pengeluaran kopi gudang dan surat jalan pengiriman via loket.',
      count: outbound.length,
      icon: ArrowDownUp,
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    {
      key: 'ROAST_LOGS',
      label: 'Roast Lab & Sangrai',
      desc: 'Log kurva suhu profil sangrai, RoR, DTR %, penyusutan, dan skor cupping SCA.',
      count: roasts.length,
      icon: Flame,
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    {
      key: 'ORDERS',
      label: 'Pesanan & Invoice',
      desc: 'Data transaksi penjualan multi-tier (Lokal, UMKM, Luar Pulau).',
      count: orders.length,
      icon: ShoppingCart,
      badgeColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      key: 'SHIPMENTS',
      label: 'Pengiriman & Resi',
      desc: 'Pelacakan ekspedisi dan no resi loket bus/L300 Aceh serta kargo.',
      count: shipments.length,
      icon: Truck,
      badgeColor: 'bg-cyan-100 text-cyan-800'
    },
    {
      key: 'NOTIFICATIONS',
      label: 'Log Notifikasi',
      desc: 'Riwayat pengiriman notifikasi otomatis WhatsApp dan Email.',
      count: notifications.length,
      icon: BellRing,
      badgeColor: 'bg-zinc-100 text-zinc-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-700 shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900">Pengaturan & Manajemen Database</h2>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                  Data Wipe Control
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 max-w-2xl">
                Kelola penghapusan data, reset database uji coba, dan sinkronisasi real-time. Anda
                dapat menghapus data per kategori spesifik atau mengosongkan seluruh database
                secara total.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setConfirmInput('');
                setIsWipeModalOpen(true);
              }}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Kosongkan Seluruh Database</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Info Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-amber-600" /> Firebase Project Target
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Terkoneksi
            </span>
          </div>
          <p className="text-base font-bold text-zinc-900">kopiflowerp</p>
          <p className="text-xs text-zinc-400 mt-1">Cloud Firestore & Realtime DB terintegrasi</p>
        </div>

        {/* Total Records Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-blue-600" /> Total Entri Data Aktif
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                totalRecords === 0 ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {totalRecords === 0 ? 'Database Bersih' : `${totalRecords} Record`}
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{totalRecords}</p>
          <p className="text-xs text-zinc-400 mt-1">Tersebar di 9 modul operasional gudang</p>
        </div>

        {/* Quick Seeding Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span className="font-medium flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-purple-600" /> Template Uji Coba Netral
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Isi otomatis data contoh (Kopi Gayo, Loket Bus Aceh, Petani) jika diperlukan untuk demo.
            </p>
          </div>
          <div className="mt-3">
            <button
              onClick={handleSeedTemplate}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Muat Template Uji Coba</span>
            </button>
          </div>
        </div>
      </div>

      {/* Module-by-Module Selective Data Deletion */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-zinc-200 px-6 py-4 bg-zinc-50/50">
          <h3 className="text-sm font-bold text-zinc-900">Hapus Data Berdasarkan Kategori / Modul</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pilih modul spesifik yang ingin dibersihkan tanpa mengganggu data modul lainnya.
          </p>
        </div>

        <div className="divide-y divide-zinc-200">
          {dataModules.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-zinc-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">{item.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}
                      >
                        {item.count} Record
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() =>
                      setSingleWipeTarget({
                        key: item.key,
                        label: item.label,
                        count: item.count
                      })
                    }
                    disabled={isProcessing || item.count === 0}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Data Ini</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Firestore Security Rules Card & Help */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-900 text-zinc-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Panduan Aturan Firebase Cloud Firestore</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Jika Anda ingin memastikan data yang dimasukkan langsung tersinkronisasi ke Cloud
              Firestore proyek <strong>kopiflowerp</strong> tanpa batasan aturan terkunci default,
              pastikan aturan berikut aktif di Firebase Console.
            </p>
          </div>

          <button
            onClick={copyRulesToClipboard}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors shrink-0 cursor-pointer"
          >
            {copiedRules ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin ke Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin Aturan Firestore</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-950 p-4 font-mono text-xs text-emerald-400 border border-zinc-800 overflow-x-auto">
          <pre>{firestoreRulesSnippet}</pre>
        </div>
      </div>

      {/* MODAL 1: TOTAL WIPE VERIFICATION (DANGER ZONE) */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Konfirmasi Hapus Semua Data</h3>
                <p className="text-xs text-rose-600 font-medium">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed mb-4">
              Seluruh data di database (Data Relasi, Stok Biji Kopi, Batch Gudang, Barang Masuk &
              Keluar, Roast Lab, Order, dan Pengiriman) akan dikosongkan secara permanen untuk
              keperluan pengujian murni.
            </p>

            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 mb-4">
              <label className="block text-xs font-semibold text-rose-900 mb-1.5">
                Ketik <span className="underline font-bold">HAPUS</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Ketik HAPUS di sini..."
                className="w-full rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500 uppercase tracking-wider font-bold"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsWipeModalOpen(false);
                  setConfirmInput('');
                }}
                disabled={isProcessing}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isProcessing || confirmInput.trim().toUpperCase() !== 'HAPUS'}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isProcessing ? 'Mengosongkan...' : 'Hapus Semua Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SINGLE COLLECTION WIPE VERIFICATION */}
      {singleWipeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Hapus {singleWipeTarget.label}?</h3>
                <p className="text-xs text-zinc-500">
                  {singleWipeTarget.count} record akan dihapus permanen
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus seluruh data pada modul{' '}
              <strong className="text-zinc-900">{singleWipeTarget.label}</strong>? Data yang dihapus
              tidak dapat dikembalikan.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSingleWipeTarget(null)}
                disabled={isProcessing}
                className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearSingle}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isProcessing ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
