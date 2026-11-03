import React, { useState, useEffect } from 'react';
import {
  Wheat,
  Plus,
  Search,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Scale,
  Calendar,
  Warehouse,
  Droplet,
  FileText,
  Truck,
  Box,
  Building,
  BellRing,
  MessageCircle,
  Mail,
  Send,
  ExternalLink,
  SlidersHorizontal,
  Settings,
  Edit2,
  Zap,
  Server
} from 'lucide-react';
import { CoffeeBean, Batch, InboundMovement, Partner, BusinessNotificationConfig } from '../../types/erp';
import {
  formatIDR,
  saveBean,
  saveBatch,
  saveInboundMovement,
  subscribeToNotificationConfig,
  saveNotificationConfig,
  DEFAULT_NOTIFICATION_CONFIG,
  buildLowStockAlertMessage,
  buildSingleBeanLowStockMessage,
  saveNotificationLog,
  dispatchWhatsAppNotification
} from '../../services/dbService';

interface GreenBeansWarehouseProps {
  beans: CoffeeBean[];
  batches: Batch[];
  inbound: InboundMovement[];
  partners: Partner[];
  onRefresh: () => void;
  onTransferToRoastLab: (beanId: string, lotNumber: string) => void;
}

export const GreenBeansWarehouse: React.FC<GreenBeansWarehouseProps> = ({
  beans,
  batches,
  inbound,
  partners,
  onRefresh,
  onTransferToRoastLab
}) => {
  const [search, setSearch] = useState('');
  const [varietyFilter, setVarietyFilter] = useState('all');
  const [isNewInboundModalOpen, setIsNewInboundModalOpen] = useState(false);
  const [selectedBeanForOpname, setSelectedBeanForOpname] = useState<CoffeeBean | null>(null);

  // Quick Inbound from Factory/Farmer Form State
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [inboundPartnerName, setInboundPartnerName] = useState(
    partners.find((p) => p.type === 'Pemasok / Petani')?.name || 'Koperasi Petani Gayo Takengon'
  );
  const [inboundBeanName, setInboundBeanName] = useState(beans[0]?.name || 'Arabika Gayo Specialty Grade 1');
  const [inboundOrigin, setInboundOrigin] = useState('Takengon, Aceh Tengah (1,500 mdpl)');
  const [inboundVariety, setInboundVariety] = useState('Tim-tim & Bourbon');
  const [inboundProcess, setInboundProcess] = useState<'Wet Hulled' | 'Washed' | 'Natural' | 'Honey'>('Wet Hulled');
  const [inboundLotNumber, setInboundLotNumber] = useState(
    `LOT-GY-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [inboundWeightKg, setInboundWeightKg] = useState<number>(300);
  const [inboundBagCount, setInboundBagCount] = useState<number>(5);
  const [inboundBagType, setInboundBagType] = useState('GrainPro 60kg + Karung Goni');
  const [inboundMoisture, setInboundMoisture] = useState<number>(11.5);
  const [inboundDensity, setInboundDensity] = useState<number>(710);
  const [inboundStorageLoc, setInboundStorageLoc] = useState('Silo A-01 (Palet Kayu Terlindung)');
  const [inboundSupplierNote, setInboundSupplierNote] = useState('Surat Jalan Pabrik No. SJ-PBR/2026/089');
  const [inboundReceiver, setInboundReceiver] = useState('Aman Fauzi (Staff Gudang Mentah)');
  const [inboundDate, setInboundDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [inboundHarvestDate, setInboundHarvestDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Direct Stock Opname form
  const [editGreenStock, setEditGreenStock] = useState<number>(0);
  const [editMinAlert, setEditMinAlert] = useState<number>(100);
  const [editMoisture, setEditMoisture] = useState<number>(11.2);
  const [editStorageLoc, setEditStorageLoc] = useState('');

  const totalGreenStockKg = beans.reduce((acc, b) => acc + (b.stockGreenKg || 0), 0);
  const lowGreenBeans = beans.filter((b) => b.stockGreenKg <= b.minAlertKg);
  const totalBagsEstimate = Math.round(totalGreenStockKg / 60);

  const filteredBeans = beans.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.origin.toLowerCase().includes(search.toLowerCase()) ||
      b.variety.toLowerCase().includes(search.toLowerCase());
    const matchProcess = varietyFilter === 'all' || b.process === varietyFilter;
    return matchSearch && matchProcess;
  });

  const handleOpenOpname = (b: CoffeeBean) => {
    setSelectedBeanForOpname(b);
    setEditGreenStock(b.stockGreenKg);
    setEditMinAlert(b.minAlertKg);
    setEditMoisture(b.moistureAvgPercent);
    setEditStorageLoc(b.storageLocation);
  };

  const [toastMessage, setToastMessage] = useState('');

  // Notification Config & Live Low-Stock Management
  const [notifConfig, setNotifConfig] = useState<BusinessNotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [beanForThresholdEdit, setBeanForThresholdEdit] = useState<CoffeeBean | null>(null);
  const [tempThresholdKg, setTempThresholdKg] = useState<number>(100);
  const [alertDispatchModalBean, setAlertDispatchModalBean] = useState<CoffeeBean | null>(null);

  useEffect(() => {
    const unsub = subscribeToNotificationConfig((cfg) => {
      if (cfg) setNotifConfig(cfg);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const handleSendAllWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      const { subject, body } = buildLowStockAlertMessage(beans, notifConfig);
      const res = await dispatchWhatsAppNotification(
        notifConfig.businessWhatsApp,
        body,
        notifConfig
      );

      await saveNotificationLog({
        id: `notif-wa-stock-${Date.now().toString(36)}`,
        channel: 'WhatsApp',
        recipient: notifConfig.businessWhatsApp,
        subject,
        messagePreview: body.slice(0, 200) + '...',
        type: 'Stock Alert',
        status: res.success ? 'Sent' : 'Failed',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdAt: new Date().toISOString()
      });

      if (res.channel === 'openwa' && res.success) {
        showToast(res.message);
      } else if (res.url) {
        showToast(res.message);
        window.open(res.url, '_blank');
      } else {
        showToast(`⚠️ ${res.error || res.message}`);
      }
      onRefresh();
    } catch (err: any) {
      showToast(`Error: ${err?.message || 'Gagal mengirim notifikasi'}`);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleSendAllEmail = async () => {
    const { subject, body } = buildLowStockAlertMessage(beans, notifConfig);
    const mailtoUrl = `mailto:${encodeURIComponent(notifConfig.businessEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    await saveNotificationLog({
      id: `notif-email-stock-${Date.now().toString(36)}`,
      channel: 'Email',
      recipient: notifConfig.businessEmail,
      subject,
      messagePreview: body.slice(0, 200) + '...',
      type: 'Stock Alert',
      status: 'Sent',
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdAt: new Date().toISOString()
    });

    showToast(`Peringatan Email Bisnis otomatis dikirim ke ${notifConfig.businessEmail}`);
    window.location.href = mailtoUrl;
    onRefresh();
  };

  const handleSendSingleBeanAlert = async (bean: CoffeeBean, channel: 'WhatsApp' | 'Email') => {
    const { subject, body, whatsappUrl, mailtoUrl } = buildSingleBeanLowStockMessage(bean, notifConfig);

    if (channel === 'WhatsApp') {
      try {
        const res = await dispatchWhatsAppNotification(
          notifConfig.businessWhatsApp,
          body,
          notifConfig
        );

        await saveNotificationLog({
          id: `notif-wa-${bean.id}-${Date.now().toString(36)}`,
          channel: 'WhatsApp',
          recipient: notifConfig.businessWhatsApp,
          subject,
          messagePreview: body.slice(0, 200) + '...',
          type: 'Stock Alert',
          status: res.success ? 'Sent' : 'Failed',
          sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          createdAt: new Date().toISOString()
        });

        if (res.channel === 'openwa' && res.success) {
          showToast(res.message);
        } else if (res.url) {
          showToast(`Peringatan stok ${bean.name} dibuka di WhatsApp`);
          window.open(res.url, '_blank');
        } else {
          showToast(`⚠️ ${res.error || res.message}`);
        }
      } catch (err: any) {
        showToast(`Error: ${err?.message || 'Gagal kirim pesan'}`);
      }
    } else {
      await saveNotificationLog({
        id: `notif-email-${bean.id}-${Date.now().toString(36)}`,
        channel: 'Email',
        recipient: notifConfig.businessEmail,
        subject,
        messagePreview: body.slice(0, 200) + '...',
        type: 'Stock Alert',
        status: 'Sent',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdAt: new Date().toISOString()
      });

      showToast(`Peringatan email stok ${bean.name} disiapkan!`);
      window.location.href = mailtoUrl;
    }

    setAlertDispatchModalBean(null);
    onRefresh();
  };

  const handleSaveThreshold = async (bean: CoffeeBean, newThreshold: number) => {
    const updated = {
      ...bean,
      minAlertKg: Number(newThreshold),
      updatedAt: new Date().toISOString()
    };
    await saveBean(updated);
    setBeanForThresholdEdit(null);
    showToast(`Batas minimal stok ${bean.name} berhasil diubah ke ${newThreshold} kg.`);
    onRefresh();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveNotificationConfig(notifConfig);
    setIsConfigModalOpen(false);
    showToast('Kontak notifikasi bisnis & ambang batas berhasil disimpan!');
  };

  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeanForOpname) return;

    const target = selectedBeanForOpname;
    const updated: CoffeeBean = {
      ...target,
      stockGreenKg: Number(editGreenStock),
      minAlertKg: Number(editMinAlert),
      moistureAvgPercent: Number(editMoisture),
      storageLocation: editStorageLoc,
      updatedAt: new Date().toISOString()
    };

    // Tutup modal langsung seketika
    setSelectedBeanForOpname(null);
    showToast(`Stok opname ${target.name} berhasil diperbarui menjadi ${updated.stockGreenKg} kg.`);

    await saveBean(updated);
    onRefresh();
  };

  const handleCreateInbound = async (e: React.FormEvent) => {
    e.preventDefault();

    // Tutup menu modal langsung seketika agar user tidak menunggu
    setIsNewInboundModalOpen(false);

    // Find or create matching bean
    let targetBean = beans.find(
      (b) => b.name.toLowerCase().trim() === inboundBeanName.toLowerCase().trim()
    );

    if (!targetBean) {
      targetBean = {
        id: `bean-${Date.now().toString(36)}`,
        name: inboundBeanName,
        origin: inboundOrigin,
        variety: inboundVariety,
        process: inboundProcess,
        grade: 'Specialty',
        stockGreenKg: 0,
        stockRoastedKg: 0,
        minAlertKg: 100,
        priceLocalPerKg: 145000,
        priceUmkmPerKg: 135000,
        priceLuarPulauPerKg: 160000,
        storageLocation: inboundStorageLoc,
        moistureAvgPercent: inboundMoisture,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await saveBean(targetBean);
    }

    const inboundId = `inb-${Date.now().toString(36)}`;
    const newInbound: InboundMovement = {
      id: inboundId,
      docNumber: `INB-PABRIK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: inboundDate,
      partnerId: partners.find((p) => p.name === inboundPartnerName)?.id || 'partner-pabrik',
      partnerName: inboundPartnerName,
      beanId: targetBean.id,
      beanName: targetBean.name,
      lotNumber: inboundLotNumber,
      bagCount: Number(inboundBagCount),
      weightKg: Number(inboundWeightKg),
      moisturePercent: Number(inboundMoisture),
      warehouseLocation: inboundStorageLoc,
      supplierDeliveryNote: `${inboundSupplierNote} (${inboundBagType})`,
      receivedBy: inboundReceiver,
      createdAt: new Date().toISOString()
    };

    // Also register new batch lot for tracking
    const newBatch: Batch = {
      id: `batch-${Date.now().toString(36)}`,
      lotNumber: inboundLotNumber,
      beanId: targetBean.id,
      beanName: targetBean.name,
      origin: inboundOrigin,
      process: inboundProcess,
      quantityInitialKg: Number(inboundWeightKg),
      quantityRemainingKg: Number(inboundWeightKg),
      bagCount: Number(inboundBagCount),
      bagWeightKg: Math.round(Number(inboundWeightKg) / Math.max(1, Number(inboundBagCount))),
      supplierOrFarmer: inboundPartnerName,
      harvestDate: inboundHarvestDate,
      receivedDate: inboundDate,
      moistureContent: Number(inboundMoisture),
      densityGramsPerLiter: Number(inboundDensity),
      warehouseLocation: inboundStorageLoc,
      status: 'In Stock',
      qrCodeData: `LOT:${inboundLotNumber}|BEAN:${targetBean.name}|MC:${inboundMoisture}%`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    showToast(`Penerimaan ${newInbound.weightKg} kg ${targetBean.name} berhasil dicatat! Stok gudang langsung bertambah.`);

    // Reset lot number for next entry
    setInboundLotNumber(`LOT-GY-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);

    await Promise.all([
      saveInboundMovement(newInbound, beans),
      saveBatch(newBatch, beans, false)
    ]);

    onRefresh();
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="rounded-xl bg-emerald-600 text-white p-3.5 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
          {toastMessage}
        </div>
      )}

      {/* Workflow Banner: Pabrik -> Gudang Green Beans -> Roast Lab -> Gudang Roast Beans */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-900 via-zinc-900 to-amber-950 p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
              <Wheat className="h-3.5 w-3.5" />
              Gudang Green Beans (Biji Mentah)
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-2 text-white">
              Penerimaan Biji dari Pabrik / Petani & Manajemen Lot
            </h2>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
              Alur Gudang KopiFlow: Green beans masuk dari pabrik/kebun mitra, disimpan dalam karung GrainPro/silo, dipantau kadar air (10-12% ideal), lalu dialihkan ke <strong>Roast Lab</strong> untuk proses sangrai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsNewInboundModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Terima Green Beans dari Pabrik
            </button>
          </div>
        </div>

        {/* Visual Workflow Steps */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-2 pt-4 border-t border-zinc-700/60 text-xs">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 p-2.5 ring-1 ring-emerald-500/40">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-[11px]">1</div>
            <div>
              <span className="font-bold text-emerald-200 block">Pabrik / Petani</span>
              <span className="text-[10px] text-zinc-300">Pengiriman biji mentah</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-emerald-700/40 p-2.5 ring-1 ring-emerald-400">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-zinc-950 font-bold text-[11px]">2</div>
            <div>
              <span className="font-bold text-white block">Gudang Green Beans</span>
              <span className="text-[10px] text-emerald-200">Ukur kadar air, lot, karung</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-zinc-800/80 p-2.5 text-zinc-300">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 font-bold text-[11px]">3</div>
            <div>
              <span className="font-semibold block text-zinc-200">Roast Lab & Sangrai</span>
              <span className="text-[10px] text-zinc-400">Transfer & proses sangrai</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-zinc-800/80 p-2.5 text-zinc-300">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 font-bold text-[11px]">4</div>
            <div>
              <span className="font-semibold block text-zinc-200">Gudang Roast Beans</span>
              <span className="text-[10px] text-zinc-400">Stok matang & degassing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Green Beans</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Wheat className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">
            {totalGreenStockKg.toLocaleString('id-ID')} <span className="text-xs font-semibold text-zinc-500">kg</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <Box className="h-3 w-3 text-emerald-600" />
            Estimasi ~{totalBagsEstimate} karung GrainPro/Jute (60kg)
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Varietas & Jenis Biji</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">{beans.length} SKU</div>
          <p className="text-[11px] text-zinc-500 mt-1">Katalog biji mentah terdaftar</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rata-rata Kadar Air (MC)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Droplet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">
            {beans.length > 0
              ? (beans.reduce((acc, b) => acc + (b.moistureAvgPercent || 11.5), 0) / beans.length).toFixed(1)
              : '11.5'}
            %
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Standar aman SCA (10.0% - 12.0%)
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Peringatan Stok Tipis</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">{lowGreenBeans.length}</div>
          <p className="text-[11px] text-rose-600 mt-1">
            {lowGreenBeans.length > 0 ? 'Perlu order pasokan dari pabrik' : 'Semua stok dalam batas aman'}
          </p>
        </div>
      </div>

      {/* BANNER PERINGATAN OTOMATIS: STOK GUDANG MENIPIS */}
      {lowGreenBeans.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 shadow-md animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm ring-4 ring-rose-100 animate-pulse">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
                    Peringatan Kritis Gudang
                  </span>
                  <span className="text-xs font-semibold text-rose-800">
                    {lowGreenBeans.length} Jenis Biji di Bawah Batas Minimal Stok!
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-zinc-900 mt-1">
                  Stok Green Beans Menipis & Memerlukan Pengadaan Segera
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5 max-w-2xl">
                  Sistem ERP mendeteksi sisa stok biji kopi mentah berada pada level rawan. Tekan tombol di samping untuk otomatis mengirim pesan peringatan resmi ke WhatsApp dan Email Bisnis manajer gudang.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-medium">
                  <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    WA Bisnis: {notifConfig.businessWhatsApp}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-blue-800 font-semibold">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    Email Bisnis: {notifConfig.businessEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Auto-Send Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleSendAllWhatsApp}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95"
                title="Buka WhatsApp dengan pesan peringatan otomatis berisi seluruh daftar stok menipis"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Kirim Peringatan WA</span>
              </button>

              <button
                onClick={handleSendAllEmail}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-all active:scale-95"
                title="Buka Email Bisnis dengan template laporan stok kritis"
              >
                <Mail className="h-4 w-4" />
                <span>Kirim Email Bisnis</span>
              </button>

              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs"
                title="Ubah nomor WA penerima, email, dan ambang batas stok"
              >
                <Settings className="h-3.5 w-3.5 text-zinc-500" />
                <span>Atur Kontak</span>
              </button>
            </div>
          </div>

          {/* Quick List of Deficit SKU Pills */}
          <div className="mt-4 pt-3 border-t border-rose-200/80 flex flex-wrap gap-2">
            {lowGreenBeans.map((b) => {
              const deficit = Math.max(0, b.minAlertKg - b.stockGreenKg);
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 border border-rose-200 text-xs shadow-2xs"
                >
                  <span className="font-bold text-zinc-900">{b.name}</span>
                  <span className="text-zinc-400">|</span>
                  <span className="font-mono text-rose-700 font-bold">
                    Sisa: {b.stockGreenKg} kg
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    (Min: {b.minAlertKg} kg, Defisit: -{deficit} kg)
                  </span>
                  <button
                    onClick={() => setAlertDispatchModalBean(b)}
                    className="ml-1 text-emerald-700 hover:text-emerald-900 font-bold text-[10px] underline"
                  >
                    Kirim Alert
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Table: Green Beans Inventory */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-emerald-600" />
              Inventaris Gudang Green Beans & Indikator Batas Minimal
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pantau batas aman stok per jenis biji, indikator visual kuota, serta pengiriman instan ke WhatsApp / Email.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari biji mentah / varietas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 sm:w-60 rounded-xl border border-zinc-200 pl-8 pr-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <select
              value={varietyFilter}
              onChange={(e) => setVarietyFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 bg-white focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="all">Semua Proses</option>
              <option value="Wet Hulled">Wet Hulled (Giling Basah)</option>
              <option value="Washed">Fully Washed</option>
              <option value="Natural">Natural / Dry</option>
              <option value="Honey">Honey</option>
              <option value="Anaerobic">Anaerobic</option>
            </select>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              title="Atur nomor kontak WhatsApp & Email bisnis untuk penerimaan notifikasi stok"
            >
              <Settings className="h-3.5 w-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Kontak Notifikasi</span>
            </button>
          </div>
        </div>

        {filteredBeans.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Wheat className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-700">Belum ada data Green Beans di gudang</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Silakan klik tombol "Terima Green Beans dari Pabrik" di atas untuk mencatat kedatangan biji kopi mentah pertama Anda.
            </p>
            <button
              onClick={() => setIsNewInboundModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
            >
              <Plus className="h-3.5 w-3.5" /> Terima Biji dari Pabrik
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="py-3 px-4">Nama Biji & Varietas</th>
                  <th className="py-3 px-3">Proses & Mutu</th>
                  <th className="py-3 px-3">Lokasi Silo</th>
                  <th className="py-3 px-3 text-center">Kadar Air</th>
                  <th className="py-3 px-3 text-right">Stok Green Beans</th>
                  <th className="py-3 px-4">Indikator Batas Minimal</th>
                  <th className="py-3 px-3 text-center">Status & Alert</th>
                  <th className="py-3 px-4 text-right">Aksi Alur Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredBeans.map((bean) => {
                  const minThreshold = bean.minAlertKg || notifConfig.defaultMinThresholdKg;
                  const currentStock = bean.stockGreenKg || 0;
                  const isLow = currentStock <= minThreshold;
                  const deficit = Math.max(0, minThreshold - currentStock);
                  const percentOfMin = Math.min(100, Math.round((currentStock / Math.max(1, minThreshold)) * 100));

                  const matchingBatch = batches.find((b) => b.beanId === bean.id && b.quantityRemainingKg > 0);
                  const lotNo = matchingBatch ? matchingBatch.lotNumber : 'LOT-GY-READY';

                  return (
                    <tr
                      key={bean.id}
                      className={`transition-colors ${
                        isLow ? 'bg-rose-50/40 hover:bg-rose-50/80' : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      {/* Name & Origin */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 text-sm">{bean.name}</div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span>{bean.origin}</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-800">{bean.variety}</span>
                        </div>
                      </td>

                      {/* Process & Grade */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                          {bean.process}
                        </span>
                        <div className="text-[11px] text-zinc-500 mt-1">{bean.grade}</div>
                      </td>

                      {/* Storage Location */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-zinc-800">{bean.storageLocation || 'Silo Utama Takengon'}</div>
                        <div className="text-[10px] text-zinc-500">Palet Terlindungi</div>
                      </td>

                      {/* Moisture */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                            bean.moistureAvgPercent >= 10 && bean.moistureAvgPercent <= 12.5
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <Droplet className="h-3 w-3" />
                          {bean.moistureAvgPercent}%
                        </span>
                      </td>

                      {/* Green Stock Current */}
                      <td className="py-3.5 px-3 text-right">
                        <div
                          className={`font-mono text-sm font-extrabold ${
                            isLow ? 'text-rose-700' : 'text-zinc-900'
                          }`}
                        >
                          {currentStock.toLocaleString('id-ID')}{' '}
                          <span className="text-xs font-normal text-zinc-500">kg</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Tersedia di gudang
                        </div>
                      </td>

                      {/* INDIKATOR BATAS MINIMAL STOK GUDANG */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-700">
                                Batas Min: <span className="font-mono font-bold">{minThreshold} kg</span>
                              </span>
                              <button
                                onClick={() => {
                                  setBeanForThresholdEdit(bean);
                                  setTempThresholdKg(minThreshold);
                                }}
                                className="text-zinc-400 hover:text-amber-700 transition-colors"
                                title="Ubah batas minimal stok untuk biji ini"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                            <span
                              className={`font-mono font-bold text-[10px] ${
                                isLow ? 'text-rose-700' : percentOfMin < 130 ? 'text-amber-700' : 'text-emerald-700'
                              }`}
                            >
                              {percentOfMin}% dari batas
                            </span>
                          </div>

                          {/* Visual Progress Bar Indicator */}
                          <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isLow
                                  ? 'bg-rose-500'
                                  : percentOfMin < 130
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(8, percentOfMin))}%` }}
                            />
                          </div>

                          {/* Deficit / Safety Indicator Note */}
                          <div className="text-[10px]">
                            {isLow ? (
                              <span className="font-bold text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                Defisit: -{deficit.toLocaleString('id-ID')} kg di bawah ambang batas!
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">
                                Surplus: +{(currentStock - minThreshold).toLocaleString('id-ID')} kg di atas batas minimal
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* STATUS & QUICK AUTO-SEND BUTTON */}
                      <td className="py-3.5 px-3 text-center">
                        {isLow ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800 border border-rose-200">
                              <AlertTriangle className="h-3 w-3" /> Stok Kritis
                            </span>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSendSingleBeanAlert(bean, 'WhatsApp')}
                                className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700"
                                title="Kirim alert biji ini ke WhatsApp"
                              >
                                <MessageCircle className="h-2.5 w-2.5" /> WA
                              </button>
                              <button
                                onClick={() => handleSendSingleBeanAlert(bean, 'Email')}
                                className="inline-flex items-center gap-0.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-blue-700"
                                title="Kirim alert biji ini ke Email Bisnis"
                              >
                                <Mail className="h-2.5 w-2.5" /> Mail
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Aman
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenOpname(bean)}
                            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                            title="Perbarui stok fisik gudang"
                          >
                            Opname
                          </button>

                          <button
                            onClick={() => onTransferToRoastLab(bean.id, lotNo)}
                            disabled={bean.stockGreenKg <= 0}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-all shadow-xs ${
                              bean.stockGreenKg > 0
                                ? 'bg-amber-700 text-white hover:bg-amber-800'
                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            }`}
                            title="Kirim green beans ke Roast Lab untuk disangrai"
                          >
                            <Flame className="h-3.5 w-3.5 text-amber-200" />
                            <span>Kirim ke Roast Lab</span>
                            <ArrowRight className="h-3 w-3" />
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

      {/* Recent Inbound Movements Log */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600" />
              Riwayat Penerimaan Biji dari Pabrik / Petani (Inbound Log)
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Bukti surat jalan penerimaan biji mentah dan registrasi nomor lot.
            </p>
          </div>
        </div>

        {inbound.length === 0 ? (
          <p className="text-xs text-zinc-500 py-3 text-center">Belum ada riwayat penerimaan masuk.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {inbound.slice(0, 5).map((inb) => (
              <div key={inb.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800">{inb.docNumber}</span>
                    <span className="text-zinc-400">•</span>
                    <span className="font-semibold text-zinc-900">{inb.beanName}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                    <span>Pemasok: {inb.partnerName}</span>
                    <span>•</span>
                    <span className="font-mono font-semibold">Lot: {inb.lotNumber}</span>
                    <span>•</span>
                    <span>MC: {inb.moisturePercent}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-zinc-900 text-sm">+{inb.weightKg} kg</span>
                    <span className="text-[10px] text-zinc-500 block">({inb.bagCount} karung)</span>
                  </div>
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-mono text-zinc-600">
                    {inb.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Inbound from Factory/Farmer */}
      {isNewInboundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 my-8">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Wheat className="h-5 w-5 text-emerald-700" />
                  Penerimaan Green Beans dari Pabrik / Petani
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Catat kedatangan biji kopi mentah, lot panen, dan tambahkan otomatis ke stok gudang.
                </p>
              </div>
              <button
                onClick={() => setIsNewInboundModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInbound} className="mt-4 space-y-4 text-xs">
              {/* Select from Partner Database (Relasi) */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-emerald-950 text-xs">
                    Pilih Pemasok dari Database Relasi / Mitra ({partners.length} Terdaftar)
                  </label>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                    Relasi ERP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Dropdown Relasi Pemasok / Petani
                    </label>
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setSelectedPartnerId(pid);
                        const found = partners.find((p) => p.id === pid);
                        if (found) {
                          setInboundPartnerName(found.name);
                          if (found.address) setInboundOrigin(found.address);
                        }
                      }}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 font-medium text-xs focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="">-- Pilih dari Daftar Relasi Terdaftar --</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.type || p.category || 'Relasi'}] {p.name} - {p.phone || 'No Telp'}
                        </option>
                      ))}
                      <option value="custom">-- Ketik Supplier Baru / Custom --</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Nama Pemasok / Pabrik (Terisi Otomatis / Edit)
                    </label>
                    <input
                      type="text"
                      required
                      value={inboundPartnerName}
                      onChange={(e) => {
                        setInboundPartnerName(e.target.value);
                        setSelectedPartnerId('');
                      }}
                      placeholder="cth: Koperasi Kopi Gayo Takengon"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-bold focus:border-emerald-600 focus:outline-hidden text-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* Bean selection from master beans or custom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Pilih Biji Kopi dari Master ({beans.length} SKU)
                  </label>
                  <select
                    onChange={(e) => {
                      const b = beans.find((item) => item.id === e.target.value);
                      if (b) {
                        setInboundBeanName(b.name);
                        if (b.origin) setInboundOrigin(b.origin);
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Biji Kopi Master --</option>
                    {beans.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.process}) - Sisa {b.stockGreenKg} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama Varietas / Biji</label>
                  <input
                    type="text"
                    required
                    value={inboundBeanName}
                    onChange={(e) => setInboundBeanName(e.target.value)}
                    placeholder="cth: Arabika Gayo Specialty Grade 1"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Tanggal Penerimaan Green Beans & Tanggal Panen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50/80 p-3 rounded-xl border border-zinc-200">
                <div>
                  <label className="block font-bold text-zinc-800 text-[11px] mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Tanggal Penerimaan Green Beans (di Gudang)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={inboundDate}
                    onChange={(e) => setInboundDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Bisa diatur jika mencatat penerimaan kemarin / sesuai surat jalan.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 text-[11px] mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-700" />
                    <span>Tanggal Panen / Masuk Lot (Harvest Date)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={inboundHarvestDate}
                    onChange={(e) => setInboundHarvestDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Estimasi waktu petik buah ceri dari kebun/petani.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nomor Lot / Batch Panen</label>
                  <input
                    type="text"
                    required
                    value={inboundLotNumber}
                    onChange={(e) => setInboundLotNumber(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Proses Pascapanen</label>
                  <select
                    value={inboundProcess}
                    onChange={(e) => setInboundProcess(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="Wet Hulled">Wet Hulled (Giling Basah Gayo)</option>
                    <option value="Washed">Fully Washed</option>
                    <option value="Natural">Natural / Dry</option>
                    <option value="Honey">Honey</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Asal & Elevasi</label>
                  <input
                    type="text"
                    value={inboundOrigin}
                    onChange={(e) => setInboundOrigin(e.target.value)}
                    placeholder="cth: Takengon, 1,500 mdpl"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                <div>
                  <label className="block font-bold text-emerald-950 mb-1">Total Berat (kg)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={inboundWeightKg}
                    onChange={(e) => setInboundWeightKg(Number(e.target.value))}
                    className="w-full rounded-lg border border-emerald-300 px-3 py-1.5 font-mono font-bold text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 mb-1">Jumlah Karung</label>
                  <input
                    type="number"
                    min="1"
                    value={inboundBagCount}
                    onChange={(e) => setInboundBagCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-emerald-300 px-3 py-1.5 font-mono text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 mb-1">Kadar Air (MC %)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inboundMoisture}
                    onChange={(e) => setInboundMoisture(Number(e.target.value))}
                    className="w-full rounded-lg border border-emerald-300 px-3 py-1.5 font-mono text-sm bg-white"
                  />
                  <span className="text-[10px] text-emerald-700">Ideal: 10 - 12%</span>
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 mb-1">Densitas (g/L)</label>
                  <input
                    type="number"
                    value={inboundDensity}
                    onChange={(e) => setInboundDensity(Number(e.target.value))}
                    className="w-full rounded-lg border border-emerald-300 px-3 py-1.5 font-mono text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Kemasan Karung & Proteksi</label>
                  <input
                    type="text"
                    value={inboundBagType}
                    onChange={(e) => setInboundBagType(e.target.value)}
                    placeholder="cth: GrainPro Hermetic 60kg + Karung Goni"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Lokasi Penyimpanan Gudang</label>
                  <input
                    type="text"
                    value={inboundStorageLoc}
                    onChange={(e) => setInboundStorageLoc(e.target.value)}
                    placeholder="cth: Silo A-01 (Palet Kayu)"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">No. Surat Jalan Pabrik / Referensi</label>
                  <input
                    type="text"
                    value={inboundSupplierNote}
                    onChange={(e) => setInboundSupplierNote(e.target.value)}
                    placeholder="cth: SJ-PABRIK-2026/089"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama Petugas Penerima</label>
                  <input
                    type="text"
                    value={inboundReceiver}
                    onChange={(e) => setInboundReceiver(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsNewInboundModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white shadow-sm hover:bg-emerald-800"
                >
                  Simpan Penerimaan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Stock Opname */}
      {selectedBeanForOpname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-900">
              Opname Stok Green Beans: {selectedBeanForOpname.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Sesuaikan hasil hitung fisik di gudang mentah Takengon.
            </p>

            <form onSubmit={handleSaveOpname} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Stok Fisik Green Beans (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={editGreenStock}
                  onChange={(e) => setEditGreenStock(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold text-sm focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Batas Minimum Peringatan (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={editMinAlert}
                  onChange={(e) => setEditMinAlert(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Kadar Air Rata-rata (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editMoisture}
                  onChange={(e) => setEditMoisture(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Lokasi Penyimpanan (Silo / Palet)</label>
                <input
                  type="text"
                  value={editStorageLoc}
                  onChange={(e) => setEditStorageLoc(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setSelectedBeanForOpname(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800"
                >
                  Simpan Hasil Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UBAH BATAS MINIMAL STOK GUDANG */}
      {beanForThresholdEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-zinc-200">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Atur Batas Minimal Stok Gudang</span>
            </div>
            <h4 className="font-extrabold text-zinc-900 text-sm">{beanForThresholdEdit.name}</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Jika stok green beans turun di bawah angka ini, sistem otomatis memicu peringatan WhatsApp & Email bisnis.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Ambang Batas Minimal Stok (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={tempThresholdKg}
                    onChange={(e) => setTempThresholdKg(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono font-bold text-base text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold">
                    kg
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Stok fisik saat ini: <strong>{beanForThresholdEdit.stockGreenKg} kg</strong>
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-[11px] font-semibold text-zinc-600 mb-1">Pilihan Cepat:</span>
                <div className="flex items-center gap-1.5">
                  {[50, 100, 200, 300, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTempThresholdKg(preset)}
                      className={`rounded-lg px-2 py-1 font-mono text-xs font-semibold border ${
                        tempThresholdKg === preset
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {preset} kg
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setBeanForThresholdEdit(null)}
                  className="rounded-xl border border-zinc-200 px-3.5 py-1.5 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveThreshold(beanForThresholdEdit, tempThresholdKg)}
                  className="rounded-xl bg-amber-700 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-amber-800"
                >
                  Simpan Batas Minimal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN KONTAK NOTIFIKASI BISNIS */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <BellRing className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Pengaturan Kontak Notifikasi Bisnis
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Penerima resmi peringatan stok gudang yang menipis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Nomor WhatsApp Bisnis / Manajer Gudang
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <input
                    type="text"
                    value={notifConfig.businessWhatsApp}
                    onChange={(e) =>
                      setNotifConfig({ ...notifConfig, businessWhatsApp: e.target.value })
                    }
                    placeholder="cth: 081269008899 atau 6281269008899"
                    className="w-full rounded-xl border border-zinc-200 pl-9 pr-3 py-2 font-mono font-medium focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Pesan alert WhatsApp akan otomatis diarahkan ke nomor ini saat stok di bawah batas minimal.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Email Bisnis Resmi / Procurement
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                  <input
                    type="email"
                    value={notifConfig.businessEmail}
                    onChange={(e) =>
                      setNotifConfig({ ...notifConfig, businessEmail: e.target.value })
                    }
                    placeholder="cth: afifviatnazillah19@gmail.com"
                    className="w-full rounded-xl border border-zinc-200 pl-9 pr-3 py-2 font-mono font-medium focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Email bisnis tujuan pengiriman template surat peringatan stok gudang KopiFlow.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Nama Jabatan / Penerima
                </label>
                <input
                  type="text"
                  value={notifConfig.managerName}
                  onChange={(e) =>
                    setNotifConfig({ ...notifConfig, managerName: e.target.value })
                  }
                  placeholder="cth: Kepala Gudang & Procurement KopiFlow"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-800">
                    Otomatisasi Peringatan Aktif
                  </span>
                  <input
                    type="checkbox"
                    checked={notifConfig.autoSendEnabled}
                    onChange={(e) =>
                      setNotifConfig({ ...notifConfig, autoSendEnabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Ketika aktif, banner peringatan menyala merah seketika stok mencapai batas kritis dan sistem menyediakan tombol 1-klik untuk auto-send pesan ke WhatsApp dan Email bisnis.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white shadow-xs hover:bg-emerald-800"
                >
                  Simpan Kontak Bisnis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW & DISPATCH PERINGATAN 1 SKU */}
      {alertDispatchModalBean && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">
                    Peringatan Stok Menipis: {alertDispatchModalBean.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Kirim laporan kekurangan stok langsung ke nomor atau email bisnis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAlertDispatchModalBean(null)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Stok Fisik Saat Ini:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {alertDispatchModalBean.stockGreenKg} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Batas Minimal Gudang:</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {alertDispatchModalBean.minAlertKg} kg
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-200 text-rose-800 font-bold">
                  <span>Defisit / Kekurangan:</span>
                  <span className="font-mono">
                    -{Math.max(0, alertDispatchModalBean.minAlertKg - alertDispatchModalBean.stockGreenKg)} kg
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span className="block font-semibold text-zinc-700 mb-2">Pilih Saluran Kirim:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendSingleBeanAlert(alertDispatchModalBean, 'WhatsApp')}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 p-2.5 font-bold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp ({notifConfig.businessWhatsApp})</span>
                  </button>

                  <button
                    onClick={() => handleSendSingleBeanAlert(alertDispatchModalBean, 'Email')}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 p-2.5 font-bold text-white hover:bg-blue-700 shadow-xs"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email Bisnis</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAlertDispatchModalBean(null)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-600 hover:bg-zinc-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
