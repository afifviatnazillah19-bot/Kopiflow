import React, { useState } from 'react';
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
  Building
} from 'lucide-react';
import { CoffeeBean, Batch, InboundMovement, Partner } from '../../types/erp';
import { formatIDR, saveBean, saveBatch, saveInboundMovement } from '../../services/dbService';

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
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
      date: new Date().toISOString().split('T')[0],
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
      harvestDate: new Date().toISOString().split('T')[0],
      receivedDate: new Date().toISOString().split('T')[0],
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

      {/* Main Table: Green Beans Inventory */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-emerald-600" />
              Inventaris Gudang Green Beans
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Data stok mentah terkini, kadar air, lokasi silo, dan tombol cepat kirim ke Roast Lab.
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
                  <th className="py-3 px-4">Proses & Mutu</th>
                  <th className="py-3 px-4">Lokasi Silo / Rak</th>
                  <th className="py-3 px-4 text-center">Kadar Air (MC)</th>
                  <th className="py-3 px-4 text-right">Stok Green Beans</th>
                  <th className="py-3 px-4 text-center">Status Gudang</th>
                  <th className="py-3 px-4 text-right">Aksi Alur Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredBeans.map((bean) => {
                  const isLow = bean.stockGreenKg <= bean.minAlertKg;
                  const matchingBatch = batches.find((b) => b.beanId === bean.id && b.quantityRemainingKg > 0);
                  const lotNo = matchingBatch ? matchingBatch.lotNumber : 'LOT-GY-READY';

                  return (
                    <tr key={bean.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 text-sm">{bean.name}</div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span>{bean.origin}</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-800">{bean.variety}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                          {bean.process}
                        </span>
                        <div className="text-[11px] text-zinc-500 mt-1">{bean.grade}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-800">{bean.storageLocation || 'Silo Utama Takengon'}</div>
                        <div className="text-[10px] text-zinc-500">Palet Terlindungi</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            bean.moistureAvgPercent >= 10 && bean.moistureAvgPercent <= 12.5
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <Droplet className="h-3 w-3" />
                          {bean.moistureAvgPercent}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-sm font-bold text-zinc-900">
                          {bean.stockGreenKg.toLocaleString('id-ID')} <span className="text-xs font-normal text-zinc-500">kg</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Min alert: {bean.minAlertKg} kg
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                            <AlertTriangle className="h-3 w-3" /> Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Aman
                          </span>
                        )}
                      </td>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Pemasok / Pabrik / Petani</label>
                  <input
                    type="text"
                    required
                    value={inboundPartnerName}
                    onChange={(e) => setInboundPartnerName(e.target.value)}
                    placeholder="cth: Koperasi Kopi Gayo Takengon"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama Varietas / Jenis Kopi</label>
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
                    min="1"
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
    </div>
  );
};
