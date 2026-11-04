import React, { useState } from 'react';
import {
  Layers,
  Plus,
  QrCode,
  Search,
  Filter,
  Printer,
  Calendar,
  Scale,
  Droplets,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  Batch,
  CoffeeBean,
  BatchStatus,
  CoffeeProcess,
  COMMON_COFFEE_PROCESSES,
  COMMON_COFFEE_VARIETIES
} from '../../types/erp';
import { saveBatch, updateBatchStatus } from '../../services/dbService';

interface BatchManagerProps {
  batches: Batch[];
  beans: CoffeeBean[];
  onRefresh: () => void;
  onOpenScanner: () => void;
}

export const BatchManager: React.FC<BatchManagerProps> = ({
  batches,
  beans,
  onRefresh,
  onOpenScanner
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBatchForLabel, setSelectedBatchForLabel] = useState<Batch | null>(null);
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);

  // New Lot form
  const [selectedBeanId, setSelectedBeanId] = useState<string>(beans[0]?.id || '');
  const [lotNumber, setLotNumber] = useState<string>(`LOT-${new Date().getFullYear()}-NEW-${Math.floor(100 + Math.random() * 900)}`);
  const [lotVariety, setLotVariety] = useState<string>(beans[0]?.variety || 'Timtim & Ateng Super');
  const [lotProcess, setLotProcess] = useState<string>(beans[0]?.process || 'Semi Wash');
  const [isCustomLotProcess, setIsCustomLotProcess] = useState(false);
  const [customLotProcessInput, setCustomLotProcessInput] = useState('');
  const [bagCount, setBagCount] = useState<number | ''>(20);
  const [bagWeightKg, setBagWeightKg] = useState<number | ''>(60);
  const [supplierOrFarmer, setSupplierOrFarmer] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState<string>('2026-05-15');
  const [receivedDate, setReceivedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [moistureContent, setMoistureContent] = useState<number | ''>(11.2);
  const [densityGramsPerLiter, setDensityGramsPerLiter] = useState<number | ''>(710);
  const [warehouseLocation, setWarehouseLocation] = useState<string>('Silo A - Bay 2');

  const filteredBatches = batches.filter((b) => {
    const matchSearch =
      b.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.beanName.toLowerCase().includes(search.toLowerCase()) ||
      b.supplierOrFarmer.toLowerCase().includes(search.toLowerCase()) ||
      b.warehouseLocation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const bean = beans.find((b) => b.id === selectedBeanId);
    if (!bean) return;

    const finalProcess =
      isCustomLotProcess && customLotProcessInput.trim()
        ? customLotProcessInput.trim()
        : lotProcess || bean.process;

    const numericBagCount = Number(bagCount) || 0;
    const numericBagWeightKg = Number(bagWeightKg) || 0;
    const totalKg = numericBagCount * numericBagWeightKg;
    const newLot: Batch = {
      id: `batch-${Date.now().toString(36)}`,
      lotNumber,
      beanId: bean.id,
      beanName: bean.name,
      origin: bean.origin,
      process: finalProcess,
      quantityInitialKg: totalKg,
      quantityRemainingKg: totalKg,
      bagCount: numericBagCount,
      bagWeightKg: numericBagWeightKg,
      supplierOrFarmer: supplierOrFarmer || 'Koperasi Petani Mitra KopiFlow',
      harvestDate,
      receivedDate: receivedDate || new Date().toISOString().split('T')[0],
      moistureContent: Number(moistureContent) || 0,
      densityGramsPerLiter: Number(densityGramsPerLiter) || 0,
      warehouseLocation,
      status: 'In Stock',
      qrCodeData: `LOT:${lotNumber}|BEAN:${bean.name}|VAR:${lotVariety || bean.variety}|PROC:${finalProcess}|KG:${totalKg}|MC:${moistureContent}%`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveBatch(newLot, beans);
    setIsNewLotModalOpen(false);
    onRefresh();
  };

  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls & Scanner button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor lot, petani, lokasi..."
              className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">Semua Status Lot</option>
            <option value="In Stock">In Stock (Tersedia)</option>
            <option value="In Roasting">In Roasting</option>
            <option value="Depleted">Depleted (Habis)</option>
            <option value="Quarantine">Quarantine (Karantina)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs"
          >
            <QrCode className="h-4 w-4 text-amber-600" />
            <span>Scan QR Gudang</span>
          </button>

          <button
            onClick={() => {
              setLotNumber(`LOT-${new Date().getFullYear()}-INT-${Math.floor(100 + Math.random() * 900)}`);
              setIsNewLotModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>+ Intake Panen Baru</span>
          </button>
        </div>
      </div>

      {/* Lot Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.map((batch) => {
          const remainingPct = Math.round(
            (batch.quantityRemainingKg / batch.quantityInitialKg) * 100
          );
          const isDepleted = batch.quantityRemainingKg <= 0;

          return (
            <div
              key={batch.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Lot Number & Status */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-amber-900">
                        {batch.lotNumber}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-zinc-900 mt-0.5 truncate">
                      {batch.beanName}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      batch.status === 'In Stock'
                        ? 'bg-emerald-100 text-emerald-800'
                        : batch.status === 'Depleted'
                        ? 'bg-zinc-100 text-zinc-500'
                        : batch.status === 'In Roasting'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>

                {/* Lot Details */}
                <div className="grid grid-cols-2 gap-2 py-3 text-xs border-b border-zinc-100">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Sisa Stok / Awal</span>
                    <span className="font-bold text-zinc-900">
                      {batch.quantityRemainingKg.toLocaleString('id-ID')} /{' '}
                      {batch.quantityInitialKg.toLocaleString('id-ID')} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Kemasan & Karung</span>
                    <span className="font-medium text-zinc-700">
                      {batch.bagCount} x {batch.bagWeightKg} kg GrainPro
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Kadar Air (MC)</span>
                    <span className="font-semibold text-zinc-800 flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-blue-500" />
                      {batch.moistureContent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Kerapatan (Density)</span>
                    <span className="font-mono text-zinc-700">{batch.densityGramsPerLiter} g/L</span>
                  </div>
                </div>

                {/* Storage & Supplier */}
                <div className="pt-2 text-xs text-zinc-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <MapPin className="h-3 w-3 text-zinc-400" />
                    <span>{batch.warehouseLocation}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] truncate">
                    <Building className="h-3 w-3 text-zinc-400" />
                    <span className="truncate">{batch.supplierOrFarmer}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <Calendar className="h-3 w-3 text-zinc-400" />
                    <span>Panen: {batch.harvestDate} • Masuk: {batch.receivedDate}</span>
                  </div>
                </div>

                {/* Remaining Quantity Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-medium text-zinc-500 mb-1">
                    <span>Ketersediaan Lot</span>
                    <span>{remainingPct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        remainingPct > 40
                          ? 'bg-emerald-500'
                          : remainingPct > 15
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(4, remainingPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action: Label Sticker */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedBatchForLabel(batch)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-zinc-600" />
                  <span>Cetak Label Pallet & QR</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printable QR Pallet Label Modal */}
      {selectedBatchForLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Label Pallet Gudang Kopi</h3>
              <button
                onClick={() => setSelectedBatchForLabel(null)}
                className="text-zinc-400 hover:text-zinc-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Industrial Label Layout (Printable) */}
            <div className="mt-4 rounded-xl border-2 border-dashed border-zinc-300 p-5 bg-zinc-50 font-sans text-zinc-900">
              <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2 mb-3">
                <span className="font-extrabold tracking-widest text-xs uppercase">
                  KOPIFLOW WAREHOUSE LOGISTICS
                </span>
                <span className="text-[10px] font-mono font-bold bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                  LOT PALLET
                </span>
              </div>

              <div className="flex gap-4 items-center">
                {/* Simulated SVG QR Code */}
                <div className="shrink-0 bg-white p-2 rounded-lg border border-zinc-300 shadow-2xs">
                  <svg className="w-24 h-24" viewBox="0 0 100 100" fill="currentColor">
                    <rect width="100" height="100" fill="#ffffff" />
                    {/* Top Left Marker */}
                    <rect x="10" y="10" width="24" height="24" fill="#18181b" />
                    <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                    <rect x="18" y="18" width="8" height="8" fill="#18181b" />

                    {/* Top Right Marker */}
                    <rect x="66" y="10" width="24" height="24" fill="#18181b" />
                    <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                    <rect x="74" y="18" width="8" height="8" fill="#18181b" />

                    {/* Bottom Left Marker */}
                    <rect x="10" y="66" width="24" height="24" fill="#18181b" />
                    <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                    <rect x="18" y="74" width="8" height="8" fill="#18181b" />

                    {/* QR Matrix Bits */}
                    <rect x="42" y="12" width="6" height="6" fill="#18181b" />
                    <rect x="52" y="18" width="6" height="6" fill="#18181b" />
                    <rect x="42" y="30" width="6" height="6" fill="#18181b" />
                    <rect x="60" y="42" width="6" height="6" fill="#18181b" />
                    <rect x="72" y="52" width="6" height="6" fill="#18181b" />
                    <rect x="24" y="42" width="6" height="6" fill="#18181b" />
                    <rect x="36" y="54" width="6" height="6" fill="#18181b" />
                    <rect x="48" y="66" width="6" height="6" fill="#18181b" />
                    <rect x="66" y="78" width="6" height="6" fill="#18181b" />
                    <rect x="78" y="70" width="6" height="6" fill="#18181b" />
                    <rect x="84" y="84" width="6" height="6" fill="#18181b" />
                  </svg>
                  <p className="text-[9px] font-mono text-center text-zinc-500 mt-1">SCAN ME</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">NO. LOT BATCH</div>
                  <div className="font-mono text-base font-extrabold text-amber-900 leading-tight">
                    {selectedBatchForLabel.lotNumber}
                  </div>
                  <div className="font-bold text-xs text-zinc-900 mt-1 truncate">
                    {selectedBatchForLabel.beanName}
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">
                    Proses: <strong>{selectedBatchForLabel.process}</strong>
                  </div>
                  <div className="text-[11px] text-zinc-600">
                    Lokasi: <strong>{selectedBatchForLabel.warehouseLocation}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-200 text-center text-xs">
                <div className="bg-white p-1.5 rounded border border-zinc-200">
                  <span className="text-[9px] text-zinc-400 block uppercase">Net Weight</span>
                  <strong className="text-zinc-900">{selectedBatchForLabel.quantityRemainingKg} kg</strong>
                </div>
                <div className="bg-white p-1.5 rounded border border-zinc-200">
                  <span className="text-[9px] text-zinc-400 block uppercase">Moisture</span>
                  <strong className="text-blue-600">{selectedBatchForLabel.moistureContent}%</strong>
                </div>
                <div className="bg-white p-1.5 rounded border border-zinc-200">
                  <span className="text-[9px] text-zinc-400 block uppercase">Karung</span>
                  <strong className="text-zinc-900">{selectedBatchForLabel.bagCount} bags</strong>
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 mt-2 text-center">
                Petani: {selectedBatchForLabel.supplierOrFarmer}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBatchForLabel(null)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintLabel}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Label Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Lot Intake Modal */}
      {isNewLotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Penerimaan & Intake Panen Baru</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Daftarkan nomor lot panen baru dan perbarui stok gudang secara otomatis
                </p>
              </div>
              <button
                onClick={() => setIsNewLotModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Pilih Master Biji Kopi</label>
                <select
                  value={selectedBeanId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedBeanId(id);
                    const b = beans.find((item) => item.id === id);
                    if (b) {
                      setLotVariety(b.variety);
                      setLotProcess(b.process);
                      setIsCustomLotProcess(!COMMON_COFFEE_PROCESSES.includes(b.process as any));
                      if (!COMMON_COFFEE_PROCESSES.includes(b.process as any)) {
                        setCustomLotProcessInput(b.process);
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden font-medium"
                >
                  {beans.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.variety} • {b.process}) - Lokasi: {b.storageLocation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Varietas (Bebas Ketik Sendiri) */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <label className="block font-bold text-amber-950 text-xs">
                    Nama Varietas Biji Kopi (Bisa Isi / Ketik Bebas)
                  </label>
                  <span className="text-[10px] text-amber-800">Ketik bebas varietas spesifik lot ini</span>
                </div>
                <input
                  type="text"
                  required
                  list="batch-variety-datalist"
                  value={lotVariety}
                  onChange={(e) => setLotVariety(e.target.value)}
                  placeholder="Ketik nama varietas cth: Timtim, Ateng Super, Bourbon, Typica, dll..."
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-xs text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                />
                <datalist id="batch-variety-datalist">
                  {COMMON_COFFEE_VARIETIES.map((v) => (
                    <option key={v} value={v} />
                  ))}
                  <option value="Timtim & Ateng Super" />
                  <option value="Bourbon & P-88" />
                  <option value="Typica & S-795" />
                  <option value="Sigarar Utang Multi-Variety" />
                </datalist>

                {/* Quick variety pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-semibold text-amber-900">Rekomendasi:</span>
                  {['Timtim', 'Ateng Super', 'Bourbon', 'Typica', 'Catimor', 'Sigarar Utang', 'Longberry Gayo', 'Gayo 1'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLotVariety(v)}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium border transition-colors ${
                        lotVariety === v
                          ? 'bg-amber-800 text-white border-amber-800'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Proses Pascapanen Lot */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Proses Pascapanen Lot Ini
                </label>
                <select
                  value={isCustomLotProcess ? '__custom__' : lotProcess}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomLotProcess(true);
                    } else {
                      setIsCustomLotProcess(false);
                      setLotProcess(e.target.value);
                    }
                  }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden font-medium"
                >
                  <option value="Semi Wash">Semi Wash (Giling Basah Gayo)</option>
                  <option value="Wet Hulled">Wet Hulled</option>
                  <option value="Full Wash">Full Wash (Fully Washed)</option>
                  <option value="Washed">Washed</option>
                  <option value="Natural">Natural / Dry</option>
                  <option value="Honey">Honey</option>
                  <option value="Anaerobic">Anaerobic</option>
                  <option value="Anaerobic Natural">Anaerobic Natural</option>
                  <option value="Anaerobic Washed">Anaerobic Washed</option>
                  <option value="Anaerobic Slow Dry">Anaerobic Slow Dry (ASD)</option>
                  <option value="Wine Process">Wine Process</option>
                  <option value="Carbonic Maceration">Carbonic Maceration</option>
                  <option value="__custom__">-- Tulis Proses Kustom Lainnya --</option>
                </select>

                {isCustomLotProcess && (
                  <input
                    type="text"
                    autoFocus
                    required
                    value={customLotProcessInput}
                    onChange={(e) => setCustomLotProcessInput(e.target.value)}
                    placeholder="Ketik nama proses khusus..."
                    className="mt-1.5 w-full rounded-lg border border-amber-400 bg-amber-50/50 px-2.5 py-1 text-xs text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                  />
                )}

                {/* Quick process pills */}
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  {['Semi Wash', 'Anaerobic', 'Anaerobic Natural', 'Full Wash', 'Natural', 'Honey', 'Wine Process'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setIsCustomLotProcess(false);
                        setLotProcess(p);
                      }}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                        lotProcess === p && !isCustomLotProcess
                          ? 'bg-amber-800 text-white border-amber-800'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nomor Lot / Batch</label>
                  <input
                    type="text"
                    required
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono text-zinc-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Koperasi / Petani Pemasok
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierOrFarmer}
                    onChange={(e) => setSupplierOrFarmer(e.target.value)}
                    placeholder="cth: Kelompok Tani Kintamani Catur"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Jumlah Karung</label>
                  <input
                    type="number"
                    min="1"
                    value={bagCount === 0 || bagCount === '' ? '' : bagCount}
                    onChange={(e) => setBagCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Berat Per Karung (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={bagWeightKg === 0 || bagWeightKg === '' ? '' : bagWeightKg}
                    onChange={(e) => setBagWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Total Bobot Intake</label>
                  <div className="rounded-lg bg-zinc-100 px-3 py-1.5 font-bold text-zinc-900">
                    {((Number(bagCount) || 0) * (Number(bagWeightKg) || 0)).toLocaleString('id-ID')} kg
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Tanggal Penerimaan (Inbound)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-800 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-600" />
                    <span>Tanggal Panen / Harvest</span>
                  </label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-medium text-zinc-800 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Kadar Air (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moistureContent === 0 || moistureContent === '' ? '' : moistureContent}
                    onChange={(e) => setMoistureContent(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Kerapatan (g/L)</label>
                  <input
                    type="number"
                    value={densityGramsPerLiter === 0 || densityGramsPerLiter === '' ? '' : densityGramsPerLiter}
                    onChange={(e) => setDensityGramsPerLiter(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Penempatan Pallet / Lokasi Gudang
                </label>
                <input
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="Silo A - Bay 2 / Cold Storage"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsNewLotModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 px-4 py-1.5 font-bold text-white hover:bg-amber-800"
                >
                  Daftarkan Lot & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
