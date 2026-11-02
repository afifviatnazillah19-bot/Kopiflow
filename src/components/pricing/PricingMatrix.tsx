import React, { useState } from 'react';
import {
  Coins,
  Percent,
  TrendingUp,
  Info,
  Edit2,
  Check,
  Building2,
  Ship,
  Store,
  ArrowRight,
  ShieldAlert,
  Save,
  Download
} from 'lucide-react';
import { CoffeeBean, PricingTier } from '../../types/erp';
import { formatIDR, saveBean } from '../../services/dbService';

interface PricingMatrixProps {
  beans: CoffeeBean[];
  onRefresh: () => void;
}

export const PricingMatrix: React.FC<PricingMatrixProps> = ({ beans, onRefresh }) => {
  const [editingBeanId, setEditingBeanId] = useState<string | null>(null);
  const [editLocal, setEditLocal] = useState<number>(0);
  const [editUmkm, setEditUmkm] = useState<number>(0);
  const [editLuarPulau, setEditLuarPulau] = useState<number>(0);

  const startEdit = (bean: CoffeeBean) => {
    setEditingBeanId(bean.id);
    setEditLocal(bean.priceLocalPerKg);
    setEditUmkm(bean.priceUmkmPerKg);
    setEditLuarPulau(bean.priceLuarPulauPerKg);
  };

  const cancelEdit = () => {
    setEditingBeanId(null);
  };

  const handleSavePrice = async (bean: CoffeeBean) => {
    const updatedBean: CoffeeBean = {
      ...bean,
      priceLocalPerKg: Number(editLocal),
      priceUmkmPerKg: Number(editUmkm),
      priceLuarPulauPerKg: Number(editLuarPulau),
      updatedAt: new Date().toISOString()
    };
    await saveBean(updatedBean);
    setEditingBeanId(null);
    onRefresh();
  };

  const handleApplyPresetFormula = (bean: CoffeeBean) => {
    // Standard rule: UMKM is -9% from Local, Luar Pulau is +13.5% from Local (freight + hermetic packaging)
    const base = Number(editLocal);
    setEditUmkm(Math.round((base * 0.91) / 1000) * 1000);
    setEditLuarPulau(Math.round((base * 1.138) / 1000) * 1000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Nama Biji', 'Origin', 'Proses', 'Harga Lokal (Rp/kg)', 'Harga UMKM (Rp/kg)', 'Harga Luar Pulau (Rp/kg)', 'Selisih UMKM (%)', 'Selisih Luar Pulau (%)'];
    const rows = beans.map((b) => {
      const umkmDiff = (((b.priceUmkmPerKg - b.priceLocalPerKg) / b.priceLocalPerKg) * 100).toFixed(1);
      const luarDiff = (((b.priceLuarPulauPerKg - b.priceLocalPerKg) / b.priceLocalPerKg) * 100).toFixed(1);
      return [
        `"${b.name}"`,
        `"${b.origin}"`,
        `"${b.process}"`,
        b.priceLocalPerKg,
        b.priceUmkmPerKg,
        b.priceLuarPulauPerKg,
        `"${umkmDiff}%"`,
        `"${luarDiff}%"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Harga_MultiTier_KopiFlow_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Tier Architecture Explanation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1 Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-zinc-900">1. Tier Harga Lokal</h3>
              <p className="text-[11px] text-zinc-500">Walk-in, Roastery Lokal, Retail</p>
            </div>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Baseline harga resmi standar gudang. Menggunakan karung goni biasa tanpa lapisan vakum ekstra.
            Pengiriman langsung via armada gudang dalam radius regional.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-zinc-100 pt-2 font-medium text-zinc-500">
            <span>Kebijakan Order:</span>
            <span className="text-zinc-800 font-semibold">Min. 5 kg</span>
          </div>
        </div>

        {/* Tier 2 Card */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-emerald-900">2. Tier Mitra UMKM</h3>
              <p className="text-[11px] text-emerald-700">Kedai Kopi & Micro-Roasters</p>
            </div>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Program kemitraan pasokan berkesinambungan dengan subsidi volume ~8-12%. Membantu operasional
            kedai kopi lokal tetap profitable dengan kontrak pasokan rutin bulanan.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-emerald-200/60 pt-2 font-medium text-emerald-700">
            <span>Kebijakan Order:</span>
            <span className="text-emerald-900 font-bold">Min. 20 kg + Kontrak</span>
          </div>
        </div>

        {/* Tier 3 Card */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Ship className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-blue-900">3. Tier Luar Pulau</h3>
              <p className="text-[11px] text-blue-700">Kargo Laut & Logistik Antarpulau</p>
            </div>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed">
            Disesuaikan dengan proteksi kemasan hermetic ganda (GrainPro/Vakum) untuk mencegah lonjakan
            kadar air saat perjalanan kargo kontainer laut (Pelni/Indah Logistik) + biaya handling pelabuhan.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-blue-200/60 pt-2 font-medium text-blue-700">
            <span>Kemasan Khusus:</span>
            <span className="text-blue-900 font-bold">GrainPro Double Hermetic</span>
          </div>
        </div>
      </div>

      {/* Main Comparison Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/60 gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Matriks Perbandingan Harga per Kilogram (Rp/kg)
            </h3>
            <p className="text-xs text-zinc-500">
              Klik ikon pensil untuk mengubah harga 3-tier secara presisi pada setiap jenis biji kopi
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-zinc-600" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/60 text-zinc-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Biji Kopi & Proses</th>
                <th className="py-3 px-3">1. Harga Lokal (Base)</th>
                <th className="py-3 px-3 text-emerald-900 bg-emerald-50/40">2. Harga Mitra UMKM</th>
                <th className="py-3 px-3 text-blue-900 bg-blue-50/40">3. Harga Luar Pulau</th>
                <th className="py-3 px-3 text-center">Selisih UMKM</th>
                <th className="py-3 px-3 text-center">Selisih Luar Pulau</th>
                <th className="py-3 px-4 text-right">Aksi Penyesuaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {beans.map((bean) => {
                const isEditing = editingBeanId === bean.id;
                const umkmDiff = ((bean.priceUmkmPerKg - bean.priceLocalPerKg) / bean.priceLocalPerKg) * 100;
                const luarDiff = ((bean.priceLuarPulauPerKg - bean.priceLocalPerKg) / bean.priceLocalPerKg) * 100;

                return (
                  <tr key={bean.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* Bean Info */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-zinc-900">{bean.name}</div>
                      <div className="text-[11px] text-zinc-500">
                        {bean.process} • {bean.grade}
                      </div>
                    </td>

                    {/* Harga Lokal */}
                    <td className="py-3 px-3 font-mono">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="number"
                            value={editLocal}
                            onChange={(e) => setEditLocal(Number(e.target.value))}
                            className="w-28 rounded border border-zinc-300 px-2 py-1 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyPresetFormula(bean)}
                            className="block text-[10px] text-amber-700 underline font-sans"
                          >
                            Auto Hitung 3-Tier
                          </button>
                        </div>
                      ) : (
                        <span className="font-extrabold text-zinc-900">
                          {formatIDR(bean.priceLocalPerKg)}
                        </span>
                      )}
                    </td>

                    {/* Harga UMKM */}
                    <td className="py-3 px-3 font-mono bg-emerald-50/20">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editUmkm}
                          onChange={(e) => setEditUmkm(Number(e.target.value))}
                          className="w-28 rounded border border-emerald-300 px-2 py-1 text-xs font-mono text-emerald-900 font-semibold focus:border-emerald-500 focus:outline-hidden"
                        />
                      ) : (
                        <span className="font-bold text-emerald-800">
                          {formatIDR(bean.priceUmkmPerKg)}
                        </span>
                      )}
                    </td>

                    {/* Harga Luar Pulau */}
                    <td className="py-3 px-3 font-mono bg-blue-50/20">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editLuarPulau}
                          onChange={(e) => setEditLuarPulau(Number(e.target.value))}
                          className="w-28 rounded border border-blue-300 px-2 py-1 text-xs font-mono text-blue-900 font-semibold focus:border-blue-500 focus:outline-hidden"
                        />
                      ) : (
                        <span className="font-bold text-blue-800">
                          {formatIDR(bean.priceLuarPulauPerKg)}
                        </span>
                      )}
                    </td>

                    {/* Diff UMKM */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[11px]">
                        {umkmDiff.toFixed(1)}%
                      </span>
                    </td>

                    {/* Diff Luar Pulau */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800 text-[11px]">
                        +{luarDiff.toFixed(1)}%
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSavePrice(bean)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-800 shadow-2xs"
                          >
                            <Save className="h-3 w-3" />
                            <span>Simpan</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(bean)}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs"
                        >
                          <Edit2 className="h-3 w-3 text-amber-600" />
                          <span>Ubah Harga</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
