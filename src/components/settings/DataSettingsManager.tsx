import React, { useState, useEffect } from 'react';
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
  Server,
  Plus,
  UserCheck,
  Building2,
  ShieldCheck,
  Edit2,
  BadgeCheck,
  User,
  Cloud
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
  OutboundMovement,
  RoasterStaff,
  WarehouseHead
} from '../../types/erp';
import {
  clearAllCollections,
  clearCollection,
  seedNeutralTestData,
  COLLECTIONS,
  getLocalCache,
  setLocalCache,
  getWarehouseHeads,
  saveWarehouseHeads,
  subscribeToWarehouseHeads,
  getRoasterStaff,
  saveRoasterStaff,
  subscribeToRoasterStaff
} from '../../services/dbService';
import { DEFAULT_ROASTER_STAFF, DEFAULT_WAREHOUSE_HEAD } from '../../data/initialData';

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
  const [activeSettingTab, setActiveSettingTab] = useState<'staff' | 'database'>('staff');

  // Staff States (Roasters & Kepala Gudang) - Synced with Firestore
  const [roasters, setRoasters] = useState<RoasterStaff[]>(getRoasterStaff);
  const [warehouseHeadList, setWarehouseHeadList] = useState<WarehouseHead[]>(getWarehouseHeads);

  // Real-time Firestore synchronization listeners
  useEffect(() => {
    const unsubWh = subscribeToWarehouseHeads((heads) => {
      setWarehouseHeadList(heads);
    });
    const unsubRst = subscribeToRoasterStaff((staff) => {
      setRoasters(staff);
    });
    return () => {
      unsubWh();
      unsubRst();
    };
  }, []);

  // Roaster Modal
  const [isRoasterModalOpen, setIsRoasterModalOpen] = useState(false);
  const [editingRoaster, setEditingRoaster] = useState<RoasterStaff | null>(null);
  const [rName, setRName] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rRole, setRRole] = useState<RoasterStaff['role']>('Head Roaster');
  const [rCert, setRCert] = useState('SCA Roaster Certified');
  const [rMachine, setRMachine] = useState('Mesin Roasting Rakitan Gayo 15kg');
  const [rShift, setRShift] = useState<RoasterStaff['shift']>('Pagi');
  const [rStatus, setRStatus] = useState<RoasterStaff['status']>('Active');

  // Warehouse Head Modal
  const [isWhHeadModalOpen, setIsWhHeadModalOpen] = useState(false);
  const [editingWhHead, setEditingWhHead] = useState<WarehouseHead | null>(null);
  const [whName, setWhName] = useState('');
  const [whPhone, setWhPhone] = useState('');
  const [whNik, setWhNik] = useState('KFH-LHK-2026-001');
  const [whHub, setWhHub] = useState('Kofiara Hub Lhokseumawe');
  const [whShift, setWhShift] = useState<WarehouseHead['shift']>('Full Time');
  const [whRespStr, setWhRespStr] = useState('QC Kadar Air, Dispatch Grab & Loket, Stok Opname');

  const saveRoastersToDatabase = async (data: RoasterStaff[]) => {
    setRoasters(data);
    await saveRoasterStaff(data);
  };

  const saveWhHeadToDatabase = async (data: WarehouseHead[]) => {
    setWarehouseHeadList(data);
    await saveWarehouseHeads(data);
  };

  const handleDeleteRoaster = async (id: string) => {
    const target = roasters.find((r) => r.id === id);
    if (!target) return;
    const updated = roasters.filter((r) => r.id !== id);
    await saveRoastersToDatabase(updated);
    showNotification(`Roaster "${target.name}" berhasil dihapus dari database Firestore.`);
  };

  const handleDeleteWhHead = async (id: string) => {
    const target = warehouseHeadList.find((w) => w.id === id);
    if (!target) return;
    const updated = warehouseHeadList.filter((w) => w.id !== id);
    await saveWhHeadToDatabase(updated);
    showNotification(`Kepala Gudang "${target.name}" berhasil dihapus dari database Firestore.`);
  };

  const handleSetPrimaryWhHead = async (id: string) => {
    const updated = warehouseHeadList.map((w) => ({
      ...w,
      status: (w.id === id ? 'Primary' : 'Active') as WarehouseHead['status']
    }));
    await saveWhHeadToDatabase(updated);
    const target = updated.find((w) => w.id === id);
    showNotification(`"${target?.name}" dijadikan Kepala Gudang Utama.`);
  };

  const handleSaveRoaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoaster) {
      const updated = roasters.map((item: RoasterStaff) =>
        item.id === editingRoaster.id
          ? {
              ...item,
              name: rName,
              phone: rPhone,
              role: rRole,
              certification: rCert,
              machineSpecialty: rMachine,
              shift: rShift,
              status: rStatus
            }
          : item
      );
      await saveRoastersToDatabase(updated);
      showNotification(`Data Roaster "${rName}" tersimpan di database Firestore.`);
    } else {
      const newRoaster: RoasterStaff = {
        id: `rst-${Date.now()}`,
        name: rName,
        phone: rPhone,
        role: rRole,
        certification: rCert,
        machineSpecialty: rMachine,
        shift: rShift,
        status: rStatus,
        createdAt: new Date().toISOString()
      };
      await saveRoastersToDatabase([...roasters, newRoaster]);
      showNotification(`Roaster baru "${rName}" berhasil tersimpan ke database.`);
    }
    setIsRoasterModalOpen(false);
  };

  const handleSaveWhHead = async (e: React.FormEvent) => {
    e.preventDefault();
    const respArr = whRespStr
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (editingWhHead) {
      const updated = warehouseHeadList.map((item: WarehouseHead) =>
        item.id === editingWhHead.id
          ? {
              ...item,
              name: whName,
              phone: whPhone,
              nikStaff: whNik,
              hubLocation: whHub,
              shift: whShift,
              responsibilities: respArr
            }
          : item
      );
      await saveWhHeadToDatabase(updated);
      showNotification(`Data Kepala Gudang "${whName}" tersimpan di database Firestore.`);
    } else {
      const newHead: WarehouseHead = {
        id: `whh-${Date.now()}`,
        name: whName,
        phone: whPhone,
        nikStaff: whNik,
        hubLocation: whHub,
        shift: whShift,
        responsibilities: respArr,
        status: warehouseHeadList.length === 0 ? 'Primary' : 'Active',
        createdAt: new Date().toISOString()
      };
      await saveWhHeadToDatabase([...warehouseHeadList, newHead]);
      showNotification(`Kepala Gudang baru "${whName}" berhasil disimpan ke database.`);
    }
    setIsWhHeadModalOpen(false);
  };

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

      {/* Setting Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveSettingTab('staff')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeSettingTab === 'staff'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Pengaturan Data Roaster & Kepala Gudang</span>
        </button>
        <button
          onClick={() => setActiveSettingTab('database')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeSettingTab === 'database'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Manajemen Database & Hapus Data</span>
        </button>
      </div>

      {/* TAB 1: DATA ROASTER & KEPALA GUDANG (KOFIARA HUB LHOKSEUMAWE) */}
      {activeSettingTab === 'staff' && (
        <div className="space-y-6">
          {/* SECTION 1: KEPALA GUDANG */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-900 rounded-xl">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900">
                      Data Kepala Gudang & QC (Kofiara Hub Lhokseumawe)
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200">
                      <Cloud className="h-3 w-3" />
                      Tersimpan di Database Firestore
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Penanggung jawab operasional penerimaan green bean, pengiriman loket/Grab, dan QC gudang
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const primary = warehouseHeadList[0];
                  if (primary) {
                    setEditingWhHead(primary);
                    setWhName(primary.name);
                    setWhPhone(primary.phone);
                    setWhNik(primary.nikStaff);
                    setWhHub(primary.hubLocation);
                    setWhShift(primary.shift);
                    setWhRespStr(primary.responsibilities.join(', '));
                  } else {
                    setEditingWhHead(null);
                    setWhName('Tgk. Mansur');
                    setWhPhone('0812-6900-3344');
                    setWhNik('KFH-LHK-2026-001');
                    setWhHub('Kofiara Hub Lhokseumawe');
                    setWhShift('Full Time');
                    setWhRespStr('QC Kadar Air, Dispatch Grab & Loket, Stok Opname');
                  }
                  setIsWhHeadModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-900 transition-colors shadow-2xs shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Edit / Tambah Kepala Gudang</span>
              </button>
            </div>

            {/* Warehouse Head Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouseHeadList.map((wh: WarehouseHead) => (
                <div
                  key={wh.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-zinc-950">{wh.name}</span>
                        <span className={`rounded text-[10px] font-bold px-2 py-0.5 ${
                          wh.status === 'Primary'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          {wh.status === 'Primary' ? '★ Kepala Gudang Utama' : wh.status}
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 font-medium mt-0.5">
                        NIK: <strong className="font-mono">{wh.nikStaff}</strong> • {wh.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {wh.status !== 'Primary' && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryWhHead(wh.id)}
                          className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-md"
                          title="Jadikan sebagai penanggung jawab utama surat jalan & label kirim"
                        >
                          Set Utama
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingWhHead(wh);
                          setWhName(wh.name);
                          setWhPhone(wh.phone);
                          setWhNik(wh.nikStaff);
                          setWhHub(wh.hubLocation);
                          setWhShift(wh.shift);
                          setWhRespStr(wh.responsibilities.join(', '));
                          setIsWhHeadModalOpen(true);
                        }}
                        className="text-amber-800 hover:text-amber-950 p-1 text-xs font-bold flex items-center gap-1 border border-amber-300 rounded-md bg-white hover:bg-amber-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      {warehouseHeadList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWhHead(wh.id)}
                          className="text-rose-700 hover:text-rose-900 p-1 text-xs font-bold flex items-center gap-1 border border-rose-200 rounded-md bg-white hover:bg-rose-50"
                          title="Hapus data kepala gudang ini dari database"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-zinc-700 bg-white p-3 rounded-lg border border-amber-200/80">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Lokasi Hub Gudang:</span>
                      <strong className="text-amber-950">{wh.hubLocation}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Shift Kerja:</span>
                      <strong>{wh.shift}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                      Tanggung Jawab Utama:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {wh.responsibilities.map((r: string, i: number) => (
                        <span
                          key={i}
                          className="rounded bg-white border border-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-900 shadow-2xs"
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: ROASTER STAFF */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 text-orange-900 rounded-xl">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900">
                      Data Staff Roaster & Penyangrai Kopi
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-900 text-[10px] font-bold px-2.5 py-0.5 border border-orange-200">
                      <Cloud className="h-3 w-3" />
                      Tersimpan di Database Firestore
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Profil tim roaster, sertifikasi SCA, dan spesialisasi mesin sangrai rakitan / komersial
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingRoaster(null);
                  setRName('');
                  setRPhone('');
                  setRRole('Senior Roaster');
                  setRCert('SCA Roasting Certified');
                  setRMachine('Mesin Roasting Rakitan Gayo 15kg');
                  setRShift('Pagi');
                  setRStatus('Active');
                  setIsRoasterModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-orange-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-800 transition-colors shadow-2xs shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Tambah Roaster Baru</span>
              </button>
            </div>

            {/* Roasters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roasters.map((r: RoasterStaff) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-orange-200 bg-orange-50/30 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-zinc-950">{r.name}</span>
                        <span className="rounded bg-orange-200 text-orange-900 text-[10px] font-bold px-2 py-0.5">
                          {r.role}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 font-medium">
                        No. WA: <strong>{r.phone}</strong> • Shift: <strong>{r.shift}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingRoaster(r);
                          setRName(r.name);
                          setRPhone(r.phone);
                          setRRole(r.role);
                          setRCert(r.certification || '');
                          setRMachine(r.machineSpecialty || '');
                          setRShift(r.shift);
                          setRStatus(r.status);
                          setIsRoasterModalOpen(true);
                        }}
                        className="text-orange-800 hover:text-orange-950 p-1 text-xs font-bold flex items-center gap-1 border border-orange-300 rounded-md bg-white hover:bg-orange-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      {roasters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRoaster(r.id)}
                          className="text-rose-700 hover:text-rose-900 p-1 text-xs font-bold flex items-center gap-1 border border-rose-200 rounded-md bg-white hover:bg-rose-50"
                          title="Hapus roaster ini dari database"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1 bg-white p-3 rounded-lg border border-orange-200/80">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Sertifikasi & Lisensi:</span>
                      <strong className="text-emerald-800">{r.certification || 'SCA Training'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Spesialisasi Mesin:</span>
                      <strong className="text-orange-950">{r.machineSpecialty || 'Mesin Rakitan 15kg'}</strong>
                    </div>
                  </div>

                  {r.notes && (
                    <p className="text-[11px] text-zinc-600 italic bg-white/60 p-2 rounded border border-orange-100">
                      "{r.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN DATABASE & RESET DATA */}
      {activeSettingTab === 'database' && (
        <div className="space-y-6">
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
      )}

      {/* MODAL 3: TAMBAH / EDIT DATA ROASTER */}
      {isRoasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                {editingRoaster ? 'Edit Data Roaster' : 'Tambah Roaster Staff Baru'}
              </h3>
              <button
                onClick={() => setIsRoasterModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoaster} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nama Lengkap Roaster</label>
                <input
                  type="text"
                  required
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder="Bang Malik / Fikri Roaster"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Peran / Jabatan</label>
                  <select
                    value={rRole}
                    onChange={(e) => setRRole(e.target.value as RoasterStaff['role'])}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="Head Roaster">Head Roaster</option>
                    <option value="Senior Roaster">Senior Roaster</option>
                    <option value="Roaster Operator">Roaster Operator</option>
                    <option value="Cupping Master">Cupping Master / Q Grader</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    required
                    value={rPhone}
                    onChange={(e) => setRPhone(e.target.value)}
                    placeholder="0811-6890-2233"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Sertifikasi & Lisensi SCA</label>
                <input
                  type="text"
                  value={rCert}
                  onChange={(e) => setRCert(e.target.value)}
                  placeholder="SCA Roasting Professional / Q Grader Certified"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Spesialisasi Mesin Roasting</label>
                <input
                  type="text"
                  value={rMachine}
                  onChange={(e) => setRMachine(e.target.value)}
                  placeholder="Mesin Roasting Rakitan Gayo 15kg / Probat"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Shift Kerja</label>
                  <select
                    value={rShift}
                    onChange={(e) => setRShift(e.target.value as RoasterStaff['shift'])}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="Pagi">Shift Pagi</option>
                    <option value="Siang">Shift Siang</option>
                    <option value="Malam">Shift Malam</option>
                    <option value="Flexi">Flexi / Panggilan Batch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Status Keaktifan</label>
                  <select
                    value={rStatus}
                    onChange={(e) => setRStatus(e.target.value as RoasterStaff['status'])}
                    className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="Active">Active (Aktif)</option>
                    <option value="On Leave">On Leave (Cuti)</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsRoasterModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-700 px-4 py-1.5 font-bold text-white hover:bg-orange-800"
                >
                  Simpan Data Roaster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH / EDIT KEPALA GUDANG */}
      {isWhHeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                {editingWhHead ? 'Edit Data Kepala Gudang' : 'Tambah Kepala Gudang Baru'}
              </h3>
              <button
                onClick={() => setIsWhHeadModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWhHead} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nama Kepala Gudang</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="Tgk. Mansur"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">NIK Staff Gudang</label>
                  <input
                    type="text"
                    required
                    value={whNik}
                    onChange={(e) => setWhNik(e.target.value)}
                    placeholder="KFH-LHK-2026-001"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-mono focus:border-amber-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    required
                    value={whPhone}
                    onChange={(e) => setWhPhone(e.target.value)}
                    placeholder="0812-6900-3344"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-mono focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Lokasi Hub Gudang Utama</label>
                <input
                  type="text"
                  required
                  value={whHub}
                  onChange={(e) => setWhHub(e.target.value)}
                  placeholder="Kofiara Hub Lhokseumawe"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-amber-950 focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Daftar Tanggung Jawab (Pisahkan dengan koma)
                </label>
                <textarea
                  rows={2}
                  value={whRespStr}
                  onChange={(e) => setWhRespStr(e.target.value)}
                  placeholder="QC Kadar Air, Dispatch Grab & Loket, Stok Opname"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Shift Kerja</label>
                <select
                  value={whShift}
                  onChange={(e) => setWhShift(e.target.value as WarehouseHead['shift'])}
                  className="w-full rounded-lg border border-zinc-200 px-2.5 py-2 text-xs focus:border-amber-600 focus:outline-hidden font-medium"
                >
                  <option value="Full Time">Full Time (Penanggung Jawab Utama)</option>
                  <option value="Pagi">Shift Pagi</option>
                  <option value="Siang">Shift Siang</option>
                  <option value="Malam">Shift Malam</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsWhHeadModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-800 px-4 py-1.5 font-bold text-white hover:bg-amber-900"
                >
                  Simpan Data Kepala Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
