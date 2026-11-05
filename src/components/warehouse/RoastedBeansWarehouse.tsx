import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Search,
  Coffee,
  Clock,
  Sparkles,
  Package,
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { CoffeeBean, RoastLog, PricingTier } from '../../types/erp';
import { formatIDR, saveBean } from '../../services/dbService';

interface RoastedBeansWarehouseProps {
  beans: CoffeeBean[];
  roasts: RoastLog[];
  onRefresh: () => void;
  onOpenNewOrder: (beanId?: string) => void;
}

export const RoastedBeansWarehouse: React.FC<RoastedBeansWarehouseProps> = ({
  beans,
  roasts,
  onRefresh,
  onOpenNewOrder
}) => {
  const [search, setSearch] = useState('');
  const [degassingFilter, setDegassingFilter] = useState('all');
  const [selectedBeanForOpname, setSelectedBeanForOpname] = useState<CoffeeBean | null>(null);
  const [editRoastedStock, setEditRoastedStock] = useState<number>(0);

  // Total roasted inventory metrics
  const totalRoastedKg = beans.reduce((acc, b) => acc + (b.stockRoastedKg || 0), 0);
  const passedRoasts = roasts.filter((r) => r.status === 'Passed QC');

  // Packaging estimates based on available stock
  const est250gPouch = Math.floor((totalRoastedKg * 1000) / 250);
  const est500gPouch = Math.floor((totalRoastedKg * 1000) / 500);
  const est1kgPouch = Math.floor(totalRoastedKg);

  // Calculate degassing days
  const getDegassingInfo = (roastDateStr: string) => {
    const roastDate = new Date(roastDateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - roastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return {
        days: diffDays,
        status: 'Degassing Aktif (CO2)',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        note: 'Biji melepaskan gas CO2, rasa belum stabil, ideal ditunggu hingga hari ke-7.',
        stage: 'degassing'
      };
    } else if (diffDays <= 6) {
      return {
        days: diffDays,
        status: 'Menuju Peak Flavor',
        badge: 'bg-blue-100 text-blue-900 border-blue-300',
        note: 'Aroma mulai terbuka, siap untuk pengemasan kedap udara.',
        stage: 'stabilizing'
      };
    } else if (diffDays <= 21) {
      return {
        days: diffDays,
        status: '🌟 Peak Flavor Ready',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        note: 'Kualitas rasa seduh & aromatik optimal! Sangat disarankan untuk kirim ke kedai pelanggan.',
        stage: 'peak'
      };
    } else if (diffDays <= 45) {
      return {
        days: diffDays,
        status: 'Siap Jual Normal',
        badge: 'bg-zinc-100 text-zinc-800 border-zinc-300',
        note: 'Kualitas masih baik dalam kemasan one-way valve.',
        stage: 'ready'
      };
    } else {
      return {
        days: diffDays,
        status: 'Waspada: Roast Date Lama',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        note: 'Lebih dari 45 hari sejak sangrai. Prioritaskan dijual dengan diskon atau promo.',
        stage: 'aged'
      };
    }
  };

  const handleOpenOpname = (b: CoffeeBean) => {
    setSelectedBeanForOpname(b);
    setEditRoastedStock(b.stockRoastedKg || 0);
  };

  const [toastMessage, setToastMessage] = useState('');

  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeanForOpname) return;

    const target = selectedBeanForOpname;
    const updated: CoffeeBean = {
      ...target,
      stockRoastedKg: Number(editRoastedStock),
      updatedAt: new Date().toISOString()
    };

    // Tutup menu modal seketika
    setSelectedBeanForOpname(null);
    setToastMessage(`Stok opname roast beans ${target.name} berhasil disesuaikan menjadi ${updated.stockRoastedKg} kg.`);
    setTimeout(() => setToastMessage(''), 4000);

    await saveBean(updated);
    onRefresh();
  };

  const filteredBeans = beans.filter((b) => {
    return (
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.origin.toLowerCase().includes(search.toLowerCase()) ||
      b.variety.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="rounded-xl bg-amber-600 text-white p-3.5 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-200" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner: Gudang Roast Beans */}
      <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-900 p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
              <Coffee className="h-3.5 w-3.5 text-amber-300" />
              Gudang Roast Beans (Biji Matang)
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-2 text-white">
              Stok Biji Sangrai Siap Jual, Degassing Tracker & Alokasi Kemasan
            </h2>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl">
              Stok di gudang ini bertambah otomatis setiap kali proses sangrai di <strong>Roast Lab</strong> berstatus "Passed QC". Dilengkapi pemantau resting/degassing (hari ke-7 s/d 14 peak flavor) dan integrasi langsung ke pembuatan pesanan pelanggan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenNewOrder()}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-500 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Jual / Buat Order Biji Sangrai
            </button>
          </div>
        </div>

        {/* Visual Workflow Steps */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-2 pt-4 border-t border-zinc-700/60 text-xs">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-800/80 p-2.5 text-zinc-400">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 font-bold text-[11px]">1</div>
            <div>
              <span className="font-semibold block text-zinc-300">Pabrik / Petani</span>
              <span className="text-[10px] text-zinc-400">Green beans masuk</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-zinc-800/80 p-2.5 text-zinc-400">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 font-bold text-[11px]">2</div>
            <div>
              <span className="font-semibold block text-zinc-300">Gudang Green Beans</span>
              <span className="text-[10px] text-zinc-400">Stok mentah & MC</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-amber-500/20 p-2.5 ring-1 ring-amber-500/40">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-[11px]">3</div>
            <div>
              <span className="font-bold text-amber-200 block">Roast Lab (QC Passed)</span>
              <span className="text-[10px] text-zinc-300">Sangrai kurva presisi</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-amber-700/40 p-2.5 ring-1 ring-amber-400">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-zinc-950 font-bold text-[11px]">4</div>
            <div>
              <span className="font-bold text-white block">Gudang Roast Beans</span>
              <span className="text-[10px] text-amber-200">Stok matang & degassing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Stok Biji Sangrai</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Coffee className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">
            {Number(totalRoastedKg.toFixed(2)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-xs font-semibold text-zinc-500">kg</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Siap dikemas & dikirim ke kedai</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimasi Pouch 250g</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">
            ~{est250gPouch.toLocaleString('id-ID')} <span className="text-xs font-semibold text-zinc-500">pouch</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Ukuran retail specialty paling populer</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimasi Bag 1kg (Kedai)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">
            ~{est1kgPouch.toLocaleString('id-ID')} <span className="text-xs font-semibold text-zinc-500">bag</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-1">Kemasan reguler barista & espresso bar</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Batch Sangrai Lulus QC</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">{passedRoasts.length} Batch</div>
          <p className="text-[11px] text-purple-700 mt-1">Standar rasa cupping SCA terpenuhi</p>
        </div>
      </div>

      {/* Degassing Information Card */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
          <Sparkles className="h-4 w-4 text-amber-700" />
          Panduan Degassing & Resting Kopi Sangrai KopiFlow
        </div>
        <p className="text-xs text-amber-950/80 max-w-3xl leading-relaxed">
          Setelah disangrai, biji kopi melepaskan gas karbon dioksida (CO2) dalam jumlah besar. Untuk penyeduhan espresso & filter, rasa optimal terjadi di <strong>Hari ke 7 - 14 (Peak Flavor Window)</strong>. Gunakan tracker di bawah untuk memilih batch yang paling siap disajikan ke pelanggan.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-amber-200/80 text-[11px]">
          <div className="rounded-lg bg-white p-2 border border-amber-200">
            <span className="font-bold text-amber-900 block">Hari 1 - 3</span>
            <span className="text-zinc-600">Off-gassing CO2 aktif (seduhan tajam)</span>
          </div>
          <div className="rounded-lg bg-white p-2 border border-blue-200">
            <span className="font-bold text-blue-900 block">Hari 4 - 6</span>
            <span className="text-zinc-600">Aroma & sweetness mulai terbuka</span>
          </div>
          <div className="rounded-lg bg-white p-2 border border-emerald-300 ring-1 ring-emerald-200">
            <span className="font-bold text-emerald-900 block">🌟 Hari 7 - 21</span>
            <span className="text-zinc-600">Peak Flavor Window (Terbaik!)</span>
          </div>
          <div className="rounded-lg bg-white p-2 border border-zinc-200">
            <span className="font-bold text-zinc-800 block">Hari 22 - 45</span>
            <span className="text-zinc-600">Stabil dalam bag one-way valve</span>
          </div>
        </div>
      </div>

      {/* Main Table: Roasted Coffee Beans & Degassing Status */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-700" />
              Katalog Stok Biji Sangrai & Degassing Tracker
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Stok siap jual, umur sangrai (roast age), dan harga per tingkat kemitraan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari biji sangrai..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 sm:w-60 rounded-xl border border-zinc-200 pl-8 pr-3 py-1.5 text-xs focus:border-amber-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {filteredBeans.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Coffee className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-700">Belum ada stok biji sangrai di gudang</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Stok bertambah otomatis saat Anda menyelesaikan sangrai dengan status "Passed QC" di Roast Lab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="py-3 px-4">Nama Biji & Profil Sangrai</th>
                  <th className="py-3 px-4">Terakhir Disangrai</th>
                  <th className="py-3 px-4 text-center">Status Degassing (Resting)</th>
                  <th className="py-3 px-4 text-right">Stok Biji Sangrai</th>
                  <th className="py-3 px-4 text-right">Alokasi Kemasan</th>
                  <th className="py-3 px-4 text-right">Harga Jual (Lokal / UMKM)</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredBeans.map((bean) => {
                  const latestRoast = roasts
                    .filter((r) => r.beanId === bean.id && r.status === 'Passed QC')
                    .sort((a, b) => new Date(b.roastDate).getTime() - new Date(a.roastDate).getTime())[0];

                  const degassing = latestRoast
                    ? getDegassingInfo(latestRoast.roastDate)
                    : {
                        days: 10,
                        status: '🌟 Peak Flavor Ready',
                        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
                        note: 'Siap seduh & jual',
                        stage: 'peak'
                      };

                  const beanStock = bean.stockRoastedKg || 0;
                  const pouch250g = Math.floor((beanStock * 1000) / 250);
                  const bag1kg = Math.floor(beanStock);

                  return (
                    <tr key={bean.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 text-sm">{bean.name}</div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-amber-800">
                            {latestRoast ? latestRoast.roastProfileLevel : 'Medium'} Roast
                          </span>
                          <span>•</span>
                          <span>{bean.process}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {latestRoast ? (
                          <div>
                            <div className="font-semibold text-zinc-800 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-zinc-400" />
                              {latestRoast.roastDate}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Batch: {latestRoast.roastNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Batch Standard</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border shadow-2xs ${degassing.badge}`}
                          title={degassing.note}
                        >
                          <Clock className="h-3 w-3" />
                          <span>Hari ke-{degassing.days}: {degassing.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-sm font-bold text-zinc-900">
                          {Number((beanStock || 0).toFixed(2)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-zinc-500">kg</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {beanStock > 0 ? 'Tersedia Siap Jual' : 'Habis / Perlu Sangrai'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-xs text-zinc-800 font-semibold">
                          ~{pouch250g} pouch (250g)
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          atau ~{bag1kg} bag (1kg)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-zinc-900">{formatIDR(bean.priceLocalPerKg)}/kg</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          UMKM: {formatIDR(bean.priceUmkmPerKg)}/kg
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenOpname(bean)}
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                            title="Koreksi stok fisik sangrai"
                          >
                            Opname
                          </button>

                          <button
                            onClick={() => onOpenNewOrder(bean.id)}
                            disabled={beanStock <= 0}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-xs ${
                              beanStock > 0
                                ? 'bg-amber-700 text-white hover:bg-amber-800'
                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            }`}
                            title="Buat invoice penjualan biji sangrai ini"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            <span>Jual</span>
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

      {/* Modal: Direct Roasted Stock Opname */}
      {selectedBeanForOpname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-900">
              Opname Stok Biji Sangrai: {selectedBeanForOpname.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Sesuaikan hasil hitung fisik stok biji matang siap jual di Takengon.
            </p>

            <form onSubmit={handleSaveOpname} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Stok Fisik Biji Sangrai / Roasted (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={editRoastedStock === 0 || (editRoastedStock as any) === '' ? '' : editRoastedStock}
                  onChange={(e) => setEditRoastedStock(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono font-bold text-sm focus:border-amber-600 focus:outline-hidden"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Catatan: Stok ini bertambah otomatis setiap kali Anda menyimpan sangrai baru yang lulus QC di Roast Lab.
                </p>
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
                  className="rounded-xl bg-amber-700 px-5 py-2 font-bold text-white hover:bg-amber-800"
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
