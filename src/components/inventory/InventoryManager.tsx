import React, { useState } from 'react';
import {
  Package,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Edit,
  MapPin,
  RefreshCw,
  Coins,
  Search,
  Scale
} from 'lucide-react';
import { CoffeeBean, CoffeeProcess, CoffeeGrade, PricingTier } from '../../types/erp';
import { formatIDR, saveBean, updateBeanStock } from '../../services/dbService';

interface InventoryManagerProps {
  beans: CoffeeBean[];
  onRefresh: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ beans, onRefresh }) => {
  const [filterType, setFilterType] = useState<'all' | 'safe' | 'low'>('all');
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'stockGreenKg' | 'stockRoastedKg'>('stockGreenKg');
  const [sortAsc, setSortAsc] = useState(false);

  // Modal states
  const [isNewBeanModalOpen, setIsNewBeanModalOpen] = useState(false);
  const [isStockOpnameModalOpen, setIsStockOpnameModalOpen] = useState(false);
  const [selectedBeanForOpname, setSelectedBeanForOpname] = useState<CoffeeBean | null>(null);
  const [editingBean, setEditingBean] = useState<CoffeeBean | null>(null);

  const defaultBeanForm: Partial<CoffeeBean> = {
    name: '',
    origin: '',
    variety: '',
    process: 'Washed',
    grade: 'Specialty',
    stockGreenKg: 0,
    stockRoastedKg: 0,
    minAlertKg: 200,
    priceLocalPerKg: 140000,
    priceUmkmPerKg: 128000,
    priceLuarPulauPerKg: 160000,
    storageLocation: 'Silo A - Gudang Utama',
    moistureAvgPercent: 11.0,
    notes: ''
  };

  // New Bean Form state (default 0 kg for both green and roasted)
  const [newBean, setNewBean] = useState<Partial<CoffeeBean>>(defaultBeanForm);

  // Stock Opname Form state (support direct actual stock or delta)
  const [opnameMode, setOpnameMode] = useState<'direct' | 'delta'>('direct');
  const [targetActualGreen, setTargetActualGreen] = useState<number>(0);
  const [targetActualRoasted, setTargetActualRoasted] = useState<number>(0);
  const [opnameDeltaGreen, setOpnameDeltaGreen] = useState<number>(0);
  const [opnameDeltaRoasted, setOpnameDeltaRoasted] = useState<number>(0);
  const [opnameReason, setOpnameReason] = useState<string>('Stock Opname Bulanan');

  const openCreateModal = () => {
    setEditingBean(null);
    setNewBean(defaultBeanForm);
    setIsNewBeanModalOpen(true);
  };

  const openEditModal = (bean: CoffeeBean) => {
    setEditingBean(bean);
    setNewBean({ ...bean });
    setIsNewBeanModalOpen(true);
  };

  // Filtered and sorted beans
  const filteredBeans = beans
    .filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.origin.toLowerCase().includes(search.toLowerCase()) ||
        b.process.toLowerCase().includes(search.toLowerCase());
      const matchLocation = selectedLocation === 'all' || b.storageLocation.includes(selectedLocation);
      const isLow = b.stockGreenKg <= b.minAlertKg;
      const matchType =
        filterType === 'all' ? true : filterType === 'low' ? isLow : !isLow;

      return matchSearch && matchLocation && matchType;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

  const handleSaveBean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBean.name || !newBean.origin) return;

    const id = editingBean ? editingBean.id : `bean-${Date.now().toString(36)}`;
    const completeBean: CoffeeBean = {
      id,
      name: newBean.name || 'Biji Kopi Baru',
      origin: newBean.origin || 'Indonesia',
      variety: newBean.variety || 'Arabica Mix',
      process: (newBean.process as CoffeeProcess) || 'Washed',
      grade: (newBean.grade as CoffeeGrade) || 'Specialty',
      stockGreenKg: Number(newBean.stockGreenKg) || 0,
      stockRoastedKg: Number(newBean.stockRoastedKg) || 0,
      minAlertKg: Number(newBean.minAlertKg) || 200,
      priceLocalPerKg: Number(newBean.priceLocalPerKg) || 135000,
      priceUmkmPerKg: Number(newBean.priceUmkmPerKg) || 120000,
      priceLuarPulauPerKg: Number(newBean.priceLuarPulauPerKg) || 155000,
      storageLocation: newBean.storageLocation || 'Silo A - Gudang Utama',
      moistureAvgPercent: Number(newBean.moistureAvgPercent) || 11.2,
      notes: newBean.notes || '',
      updatedAt: new Date().toISOString(),
      createdAt: editingBean ? editingBean.createdAt : new Date().toISOString()
    };

    await saveBean(completeBean);
    setIsNewBeanModalOpen(false);
    setEditingBean(null);
    setNewBean(defaultBeanForm);
    onRefresh();
  };

  const handleStockOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeanForOpname) return;

    let deltaG = opnameDeltaGreen;
    let deltaR = opnameDeltaRoasted;

    if (opnameMode === 'direct') {
      deltaG = targetActualGreen - selectedBeanForOpname.stockGreenKg;
      deltaR = targetActualRoasted - selectedBeanForOpname.stockRoastedKg;
    }

    await updateBeanStock(
      selectedBeanForOpname.id,
      deltaG,
      deltaR,
      beans
    );
    setIsStockOpnameModalOpen(false);
    setSelectedBeanForOpname(null);
    setOpnameDeltaGreen(0);
    setOpnameDeltaRoasted(0);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filter, Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter buttons */}
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua ({beans.length})
            </button>
            <button
              onClick={() => setFilterType('safe')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterType === 'safe'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Stok Aman ({beans.filter((b) => b.stockGreenKg > b.minAlertKg).length})
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterType === 'low'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Stok Kritis ({beans.filter((b) => b.stockGreenKg <= b.minAlertKg).length})
            </button>
          </div>

          {/* Location filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">Semua Lokasi Gudang</option>
            <option value="Silo A">Silo A (Utama)</option>
            <option value="Silo B">Silo B (Barat)</option>
            <option value="Rak Khusus">Rak Khusus Specialty</option>
            <option value="Cold Storage">Cold Storage Room</option>
            <option value="Pallet">Pallet Area</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Master Biji</span>
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Biji Kopi & Asal</th>
                <th className="py-3 px-3">Proses / Grade</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-zinc-900"
                  onClick={() => {
                    setSortField('stockGreenKg');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Stok Green (kg)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-zinc-900"
                  onClick={() => {
                    setSortField('stockRoastedKg');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Stok Sangrai</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Harga 3-Tier (Lokal / UMKM / L.Pulau)</th>
                <th className="py-3 px-3">Lokasi / Kadar Air</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredBeans.map((bean) => {
                const isLow = bean.stockGreenKg <= bean.minAlertKg;
                return (
                  <tr key={bean.id} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Coffee Name & Variety */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 text-sm">{bean.name}</div>
                      <div className="text-zinc-500 text-[11px] mt-0.5">
                        {bean.origin} • Var: {bean.variety}
                      </div>
                    </td>

                    {/* Process & Grade */}
                    <td className="py-3 px-3">
                      <span className="inline-block rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 border border-amber-200">
                        {bean.process}
                      </span>
                      <span className="block text-[10px] text-zinc-500 font-medium mt-1">
                        {bean.grade}
                      </span>
                    </td>

                    {/* Green Bean Stock */}
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-sm text-zinc-900">
                        {bean.stockGreenKg.toLocaleString('id-ID')} kg
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Min. Alert: {bean.minAlertKg} kg
                      </div>
                    </td>

                    {/* Roasted Stock */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-sm text-orange-700">
                        {bean.stockRoastedKg} kg
                      </div>
                      <div className="text-[10px] text-zinc-400">Siap kemas</div>
                    </td>

                    {/* 3-Tier Prices */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5 font-mono text-[11px]">
                        <div className="text-zinc-700">
                          <span className="text-zinc-400 font-sans">Lokal:</span>{' '}
                          {formatIDR(bean.priceLocalPerKg)}
                        </div>
                        <div className="text-emerald-700 font-medium">
                          <span className="text-emerald-500 font-sans">UMKM:</span>{' '}
                          {formatIDR(bean.priceUmkmPerKg)}
                        </div>
                        <div className="text-blue-700">
                          <span className="text-blue-400 font-sans">L.Pulau:</span>{' '}
                          {formatIDR(bean.priceLuarPulauPerKg)}
                        </div>
                      </div>
                    </td>

                    {/* Location & Moisture */}
                    <td className="py-3 px-3 text-zinc-600">
                      <div className="flex items-center gap-1 text-[11px] font-medium">
                        <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{bean.storageLocation}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Kadar Air: <strong>{bean.moistureAvgPercent}%</strong>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isLow
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isLow ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            <span>Kritis / Menipis</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Aman</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(bean)}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs"
                          title="Edit Master Biji & Stok"
                        >
                          <Edit className="h-3 w-3 text-zinc-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBeanForOpname(bean);
                            setOpnameMode('direct');
                            setTargetActualGreen(bean.stockGreenKg);
                            setTargetActualRoasted(bean.stockRoastedKg);
                            setOpnameDeltaGreen(0);
                            setOpnameDeltaRoasted(0);
                            setIsStockOpnameModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 shadow-2xs"
                          title="Penyesuaian Stok Fisik Gudang"
                        >
                          <Scale className="h-3 w-3 text-amber-700" />
                          <span>Opname</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Opname Modal */}
      {isStockOpnameModalOpen && selectedBeanForOpname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Penyesuaian Stok (Stock Opname)</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{selectedBeanForOpname.name}</p>
              </div>
              <button
                onClick={() => setIsStockOpnameModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-lg bg-zinc-100 p-0.5 mt-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setOpnameMode('direct')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  opnameMode === 'direct' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Set Stok Fisik Baru (kg)
              </button>
              <button
                type="button"
                onClick={() => setOpnameMode('delta')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  opnameMode === 'delta' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Input Selisih (+/- kg)
              </button>
            </div>

            <form onSubmit={handleStockOpname} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block">Stok Green Saat Ini</span>
                  <span className="text-base font-bold text-zinc-900">
                    {selectedBeanForOpname.stockGreenKg} kg
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block">Stok Roasted Saat Ini</span>
                  <span className="text-base font-bold text-orange-700">
                    {selectedBeanForOpname.stockRoastedKg} kg
                  </span>
                </div>
              </div>

              {opnameMode === 'direct' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Stok Fisik Aktual Green Bean (kg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={targetActualGreen}
                        onChange={(e) => setTargetActualGreen(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
                      />
                      <span className="text-xs text-zinc-500 shrink-0">kg</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      Selisih:{' '}
                      {targetActualGreen - selectedBeanForOpname.stockGreenKg >= 0 ? '+' : ''}
                      {targetActualGreen - selectedBeanForOpname.stockGreenKg} kg
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Stok Fisik Aktual Roasted Bean / Sangrai (kg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={targetActualRoasted}
                        onChange={(e) => setTargetActualRoasted(Number(e.target.value))}
                        className="w-full rounded-lg border border-orange-200 bg-orange-50/30 px-3 py-1.5 text-xs text-orange-950 font-bold focus:border-orange-500 focus:outline-hidden"
                      />
                      <span className="text-xs text-zinc-500 shrink-0">kg</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      Selisih:{' '}
                      {targetActualRoasted - selectedBeanForOpname.stockRoastedKg >= 0 ? '+' : ''}
                      {targetActualRoasted - selectedBeanForOpname.stockRoastedKg} kg
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Penyesuaian Stok Green Bean (kg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={opnameDeltaGreen}
                        onChange={(e) => setOpnameDeltaGreen(Number(e.target.value))}
                        placeholder="+/- kg (cth: 50 atau -20)"
                        className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
                      />
                      <span className="text-xs text-zinc-500 shrink-0">kg</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Gunakan tanda minus (-) jika terjadi penyusutan/kerusakan fisik karung.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Penyesuaian Stok Roasted Bean (kg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={opnameDeltaRoasted}
                        onChange={(e) => setOpnameDeltaRoasted(Number(e.target.value))}
                        placeholder="+/- kg"
                        className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
                      />
                      <span className="text-xs text-zinc-500 shrink-0">kg</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alasan Penyesuaian
                </label>
                <select
                  value={opnameReason}
                  onChange={(e) => setOpnameReason(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="Stock Opname Bulanan">Stock Opname Bulanan Fisik Gudang</option>
                  <option value="Koreksi Stok Awal (Inisialisasi 0 kg)">Koreksi Stok Awal (Inisialisasi 0 kg)</option>
                  <option value="Penyusutan Kadar Air Alami">Penyusutan Kadar Air Alami</option>
                  <option value="Hasil Roasting Laboratorium">Hasil Roasting Laboratorium Tambahan</option>
                  <option value="Kerusakan Kemasan GrainPro">Kerusakan Kemasan / Cacat Karung</option>
                  <option value="Retur Pesanan Pelanggan">Retur Pengiriman Customer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsStockOpnameModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-800"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Master Bean Modal */}
      {isNewBeanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  {editingBean ? 'Edit Data Master Biji Kopi' : 'Registrasi Master Biji Kopi Baru'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Lengkapi data asal, proses pascapanen, stok awal, dan penetapan 3 tier harga
                </p>
              </div>
              <button
                onClick={() => setIsNewBeanModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBean} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama Biji Kopi</label>
                  <input
                    type="text"
                    required
                    value={newBean.name}
                    onChange={(e) => setNewBean({ ...newBean, name: e.target.value })}
                    placeholder="cth: Sumatra Kerinci Honey"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Origin & Elevasi</label>
                  <input
                    type="text"
                    required
                    value={newBean.origin}
                    onChange={(e) => setNewBean({ ...newBean, origin: e.target.value })}
                    placeholder="cth: Kayu Aro, Jambi (1.600 mdpl)"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Varietas</label>
                  <input
                    type="text"
                    value={newBean.variety}
                    onChange={(e) => setNewBean({ ...newBean, variety: e.target.value })}
                    placeholder="Andung Sari / Sigarar Utang"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Proses Pascapanen</label>
                  <select
                    value={newBean.process}
                    onChange={(e) => setNewBean({ ...newBean, process: e.target.value as CoffeeProcess })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Washed">Washed</option>
                    <option value="Natural">Natural</option>
                    <option value="Honey">Honey</option>
                    <option value="Anaerobic">Anaerobic</option>
                    <option value="Wet Hulled">Wet Hulled (Giling Basah)</option>
                    <option value="Full Wash">Full Wash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Grade Kualitas</label>
                  <select
                    value={newBean.grade}
                    onChange={(e) => setNewBean({ ...newBean, grade: e.target.value as CoffeeGrade })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Specialty">Specialty (SCA 80+)</option>
                    <option value="Micro-lot">Micro-lot (Limited)</option>
                    <option value="Grade 1">Grade 1 Export</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              {/* 3-Tier Price Box */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Coins className="h-4 w-4 text-amber-700" />
                  <span>Penetapan 3 Tier Harga (Per Kg)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                      1. Harga Lokal (Rp/kg)
                    </label>
                    <input
                      type="number"
                      required
                      value={newBean.priceLocalPerKg}
                      onChange={(e) => setNewBean({ ...newBean, priceLocalPerKg: Number(e.target.value) })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 focus:border-amber-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-zinc-500">Walk-in / Roastery lokal</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 mb-0.5">
                      2. Harga Mitra UMKM (Rp/kg)
                    </label>
                    <input
                      type="number"
                      required
                      value={newBean.priceUmkmPerKg}
                      onChange={(e) => setNewBean({ ...newBean, priceUmkmPerKg: Number(e.target.value) })}
                      className="w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 focus:border-emerald-500 focus:outline-hidden text-emerald-900 font-semibold"
                    />
                    <span className="text-[10px] text-emerald-600">Diskon mitra binaan</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-blue-800 mb-0.5">
                      3. Harga Luar Pulau (Rp/kg)
                    </label>
                    <input
                      type="number"
                      required
                      value={newBean.priceLuarPulauPerKg}
                      onChange={(e) => setNewBean({ ...newBean, priceLuarPulauPerKg: Number(e.target.value) })}
                      className="w-full rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 focus:border-blue-500 focus:outline-hidden text-blue-900 font-semibold"
                    />
                    <span className="text-[10px] text-blue-600">+ Buffer packing laut</span>
                  </div>
                </div>
              </div>

              {/* Stock and Storage */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800 text-xs">Stok Awal & Penyimpanan Gudang</span>
                  <span className="text-[11px] text-zinc-500">Stok sangrai bertambah saat lolos QC sangrai</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Stok Green Bean (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={newBean.stockGreenKg ?? 0}
                      onChange={(e) => setNewBean({ ...newBean, stockGreenKg: Number(e.target.value) })}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-zinc-400">Biji mentah siap sangrai</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-orange-900 mb-1">Stok Sangrai (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={newBean.stockRoastedKg ?? 0}
                      onChange={(e) => setNewBean({ ...newBean, stockRoastedKg: Number(e.target.value) })}
                      className="w-full rounded-lg border border-orange-300 bg-orange-50/50 px-3 py-1.5 focus:border-orange-500 focus:outline-hidden font-bold text-orange-950"
                    />
                    <span className="text-[10px] text-orange-700">Default 0 kg (dari sangrai)</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Batas Alert Kritis (kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={newBean.minAlertKg ?? 200}
                      onChange={(e) => setNewBean({ ...newBean, minAlertKg: Number(e.target.value) })}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-zinc-400">Peringatan menipis</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Lokasi Silo / Rak</label>
                    <input
                      type="text"
                      value={newBean.storageLocation || 'Silo A - Gudang Utama'}
                      onChange={(e) => setNewBean({ ...newBean, storageLocation: e.target.value })}
                      placeholder="Silo A / Rak Khusus"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-zinc-400">Posisi fisik gudang</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Catatan Karakter Rasa</label>
                <textarea
                  rows={2}
                  value={newBean.notes}
                  onChange={(e) => setNewBean({ ...newBean, notes: e.target.value })}
                  placeholder="Catatan tasting notes, kelembaban, tanggal cupping kalibrasi..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsNewBeanModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 px-4 py-1.5 font-bold text-white hover:bg-amber-800"
                >
                  {editingBean ? 'Simpan Perubahan' : 'Simpan Master Biji'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
