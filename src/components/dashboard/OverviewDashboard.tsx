import React from 'react';
import {
  Package,
  Layers,
  Coins,
  Flame,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { CoffeeBean, Batch, RoastLog, Order, Shipment, PricingTier } from '../../types/erp';
import { formatIDR } from '../../services/dbService';
import { NavTab } from '../layout/Sidebar';

interface OverviewDashboardProps {
  beans: CoffeeBean[];
  batches: Batch[];
  roasts: RoastLog[];
  orders: Order[];
  shipments: Shipment[];
  onNavigate: (tab: NavTab) => void;
  onOpenNewBatchModal: () => void;
  onOpenNewRoastModal: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  beans,
  batches,
  roasts,
  orders,
  shipments,
  onNavigate,
  onOpenNewBatchModal,
  onOpenNewRoastModal
}) => {
  // Aggregate Metrics
  const totalGreenKg = beans.reduce((sum, b) => sum + b.stockGreenKg, 0);
  const totalRoastedKg = beans.reduce((sum, b) => sum + b.stockRoastedKg, 0);
  const activeBatchesCount = batches.filter((b) => b.status === 'In Stock').length;
  const activeShipments = shipments.filter((s) => s.status !== 'Delivered' && s.status !== 'Returned');

  // Warehouse valuation (weighted by local green bean price + roasted 25% premium)
  const totalInventoryValue = beans.reduce((sum, b) => {
    return sum + b.stockGreenKg * b.priceLocalPerKg + b.stockRoastedKg * (b.priceLocalPerKg * 1.35);
  }, 0);

  // Critical items
  const lowStockBeans = beans.filter((b) => b.stockGreenKg <= b.minAlertKg);

  // Revenue from completed/confirmed orders
  const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Recent 3 roasts
  const recentRoasts = [...roasts].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Critical Stock Alert Banner if any */}
      {lowStockBeans.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Perhatian: {lowStockBeans.length} Jenis Kopi Menyentuh Batas Stok Kritis!
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  {lowStockBeans.map((b) => `${b.name} (${b.stockGreenKg} kg / Min: ${b.minAlertKg} kg)`).join(', ')}.
                  Segera jadwalkan intake panen baru ke koperasi mitra.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('notifications')}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shrink-0"
                title="Buka Pusat Notifikasi untuk kirim WA & Email stok kritis"
              >
                <span>Kirim Alert WA/Email</span>
              </button>
              <button
                onClick={onOpenNewBatchModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition-colors shrink-0"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>+ Intake Lot Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Green Bean */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Stok Green Bean</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900">
              {totalGreenKg.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-medium text-zinc-500">kg (Kopi Beras)</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs">
            <span className="text-zinc-500">{activeBatchesCount} Lot Aktif di Gudang</span>
            <button
              onClick={() => onNavigate('green-beans')}
              className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
            >
              Gudang Mentah <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Total Roasted Bean */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Stok Roasted Bean</span>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900">
              {totalRoastedKg.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-medium text-zinc-500">kg Siap Distribusi</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs">
            <span className="text-zinc-500">{roasts.length} Profil Sangrai QC</span>
            <button
              onClick={() => onNavigate('roasted-beans')}
              className="font-semibold text-orange-700 hover:text-orange-800 flex items-center gap-0.5"
            >
              Gudang Matang <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Warehouse Valuation */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Valuasi Stok Gudang</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 truncate block">
              {formatIDR(totalInventoryValue)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs">
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> HPP & 3-Tier
            </span>
            <button
              onClick={() => onNavigate('finance')}
              className="font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-0.5"
            >
              Keuangan <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Active Island Shipments */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Pengiriman Antarpulau</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900">
              {activeShipments.length}
            </span>
            <span className="text-xs font-medium text-zinc-500">Kargo Aktif / Transit</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs">
            <span className="text-zinc-500">Total Revenue: {formatIDR(totalRevenue)}</span>
            <button
              onClick={() => onNavigate('logistics')}
              className="font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-0.5"
            >
              Lacak <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-tier Pricing & Warehouse Inventory Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Inventory Snapshot */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Katalog Biji & Stok Real-Time</h2>
              <p className="text-xs text-zinc-500">
                Pembaruan otomatis dari sensor timbangan dan log roast Firestore
              </p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Lihat Semua Stok
            </button>
          </div>

          <div className="divide-y divide-zinc-100 mt-2">
            {beans.map((bean) => {
              const isLow = bean.stockGreenKg <= bean.minAlertKg;
              const fillPct = Math.min(100, Math.round((bean.stockGreenKg / (bean.minAlertKg * 3)) * 100));

              return (
                <div key={bean.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900 truncate">{bean.name}</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                        {bean.process}
                      </span>
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        {bean.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-zinc-400" /> {bean.storageLocation}
                      </span>
                      <span>MC: {bean.moistureAvgPercent}%</span>
                    </div>
                  </div>

                  {/* Stock Bars */}
                  <div className="sm:text-right shrink-0">
                    <div className="flex items-baseline gap-2 sm:justify-end">
                      <span className="text-sm font-bold text-zinc-900">
                        {bean.stockGreenKg.toLocaleString('id-ID')} kg
                      </span>
                      <span className="text-[11px] text-zinc-500">Green</span>
                      <span className="text-zinc-300">|</span>
                      <span className="text-xs font-semibold text-orange-700">
                        {bean.stockRoastedKg} kg
                      </span>
                      <span className="text-[11px] text-zinc-500">Roasted</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-28 sm:w-36 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLow ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(10, fillPct)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isLow ? 'Kritis' : 'Aman'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-tier Pricing Summary Box */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Struktur 3 Tier Harga</h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                ERP Matrix
              </span>
            </div>

            <p className="text-xs text-zinc-500 mt-2 mb-4 leading-relaxed">
              Diferensiasi harga otomatis disesuaikan dengan volume kedai, kemasan tahan lembab, dan asuransi transit laut.
            </p>

            <div className="space-y-3">
              {/* Tier 1: Lokal */}
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 hover:bg-zinc-100/70 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-800">1. Tier Harga Lokal</span>
                  <span className="text-[10px] font-semibold text-zinc-500">Baseline Standard</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Untuk roastery lokal, walk-in buyer, dan pengiriman dalam kota tanpa kemasan pelindung laut.
                </p>
              </div>

              {/* Tier 2: UMKM */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 hover:bg-emerald-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-900">2. Tier Mitra UMKM</span>
                  <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Diskon ~8-12%
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Khusus kedai kopi rintisan dan kemitraan pasokan mingguan dengan min. order 20 kg.
                </p>
              </div>

              {/* Tier 3: Luar Pulau */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 hover:bg-blue-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-900">3. Tier Luar Pulau</span>
                  <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                    Kargo + Hermetic
                  </span>
                </div>
                <p className="text-[11px] text-blue-700">
                  Termasuk GrainPro vacuum packaging berlapis, fumigasi kargo, dan handling kontainer Pelni/Indah Logistik.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100">
            <button
              onClick={() => onNavigate('pricing')}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>Buka Matriks Harga Lengkap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Roast Lab Recent Sessions & Logistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roast Lab Highlight */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-100 p-1.5 text-orange-700">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Roast Lab & Cupping QC</h2>
                <p className="text-xs text-zinc-500">Penyangraian presisi & evaluasi sensori SCA</p>
              </div>
            </div>
            <button
              onClick={onOpenNewRoastModal}
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:text-orange-800"
            >
              + Sangrai Baru
            </button>
          </div>

          <div className="divide-y divide-zinc-100 mt-2">
            {recentRoasts.map((roast) => (
              <div key={roast.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800">{roast.roastNumber}</span>
                    <span className="font-semibold text-xs text-zinc-900 truncate">{roast.beanName}</span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                      {roast.roastProfileLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1 italic">
                    "{roast.cuppingNotes}"
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                    <span>Batch: {roast.batchLotNumber}</span>
                    <span>Loss: {roast.weightLossPercent.toFixed(1)}%</span>
                    <span>DTR: {roast.dtrPercent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    <span>{roast.cuppingScore} SCA</span>
                  </div>
                  <span className="block text-[10px] text-zinc-400 mt-1">{roast.roastDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Logistics Overview */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Status Kargo Pengiriman</h2>
                <p className="text-xs text-zinc-500">Monitoring pengiriman kontainer & trucking antarpulau</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('logistics')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800"
            >
              Lihat Semua Resi
            </button>
          </div>

          <div className="divide-y divide-zinc-100 mt-2">
            {shipments.map((s) => (
              <div key={s.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-800">{s.trackingNumber}</span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      {s.destinationIsland}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-zinc-800 mt-0.5 truncate">{s.customerName}</p>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                    <span>{s.courierName}</span>
                    <span>•</span>
                    <span>{s.weightKg} kg</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      s.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.status === 'In Transit (Laut/Udara)'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.status}
                  </span>
                  <span className="block text-[10px] text-zinc-400 mt-1">Est: {s.estimatedDelivery}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
