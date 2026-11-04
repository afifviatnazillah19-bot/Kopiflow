import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Thermometer,
  Layers,
  Search,
  MessageCircle,
  Share2,
  Activity,
  ArrowRight,
  Wrench,
  Cpu,
  Gauge,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';
import { RoastLog, CoffeeBean, Batch, RoastLevel, RoastStatus, RoasterStaff } from '../../types/erp';
import { RoastCurveChart } from './RoastCurveChart';
import { saveRoastLog, buildWhatsAppLink, getRoasterStaff, subscribeToRoasterStaff } from '../../services/dbService';

interface RoastLabProps {
  roasts: RoastLog[];
  beans: CoffeeBean[];
  batches: Batch[];
  onRefresh: () => void;
  isNewModalOpenExternally?: boolean;
  onCloseExternalModal?: () => void;
}

export const RoastLab: React.FC<RoastLabProps> = ({
  roasts,
  beans,
  batches,
  onRefresh,
  isNewModalOpenExternally,
  onCloseExternalModal
}) => {
  const [selectedRoast, setSelectedRoast] = useState<RoastLog>(roasts[0] || null);
  const [isNewRoastModalOpen, setIsNewRoastModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [machineFilter, setMachineFilter] = useState<string>('all');

  // Real-time Database Staf Roaster List
  const [roasterStaffList, setRoasterStaffList] = useState<RoasterStaff[]>(getRoasterStaff);

  React.useEffect(() => {
    const unsub = subscribeToRoasterStaff((staff) => {
      setRoasterStaffList(staff);
    });
    return () => unsub();
  }, []);

  // Handle external trigger from Header
  React.useEffect(() => {
    if (isNewModalOpenExternally) {
      setIsNewRoastModalOpen(true);
      if (onCloseExternalModal) onCloseExternalModal();
    }
  }, [isNewModalOpenExternally]);

  // New Roast Form
  const [selectedBeanId, setSelectedBeanId] = useState<string>(beans[0]?.id || '');
  const [batchLotNumber, setBatchLotNumber] = useState<string>(batches[0]?.lotNumber || '');
  const [roasterMachine, setRoasterMachine] = useState<string>('Mesin Roasting Rakitan (Drum 1-5 kg)');
  const [customMachineName, setCustomMachineName] = useState<string>('');
  const [roastProfileLevel, setRoastProfileLevel] = useState<RoastLevel>('Medium-Light');
  const [greenWeightGrams, setGreenWeightGrams] = useState<number | ''>(5000);
  const [roastedWeightGrams, setRoastedWeightGrams] = useState<number | ''>(4320);
  const [chargeTempC, setChargeTempC] = useState<number | ''>(198);
  const [turningPointTempC, setTurningPointTempC] = useState<number | ''>(92);
  const [turningPointTimeSec, setTurningPointTimeSec] = useState<number | ''>(85);
  const [dryEndTempC, setDryEndTempC] = useState<number | ''>(154);
  const [dryEndTimeSec, setDryEndTimeSec] = useState<number | ''>(295);
  const [firstCrackTempC, setFirstCrackTempC] = useState<number | ''>(196);
  const [firstCrackTimeSec, setFirstCrackTimeSec] = useState<number | ''>(520);
  const [dropTempC, setDropTempC] = useState<number | ''>(208);
  const [totalTimeSec, setTotalTimeSec] = useState<number | ''>(640);
  const [cuppingScore, setCuppingScore] = useState<number | ''>(87.5);
  const [cuppingNotes, setCuppingNotes] = useState<string>('Bergamot, orange blossom, brown sugar sweetness, crisp malic acidity');
  const [roasterOperator, setRoasterOperator] = useState<string>(() => {
    const defaultStaff = getRoasterStaff();
    return defaultStaff[0]?.name ? `${defaultStaff[0].name} (${defaultStaff[0].role})` : 'Hendra Setiawan (Head Roaster)';
  });
  const [roastDate, setRoastDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [roastStatus, setRoastStatus] = useState<RoastStatus>('Passed QC');

  // Calculations
  const gWeight = Number(greenWeightGrams) || 0;
  const rWeight = Number(roastedWeightGrams) || 0;
  const weightLossPct =
    gWeight > 0
      ? Number((((gWeight - rWeight) / gWeight) * 100).toFixed(2))
      : 0;

  const tTime = Number(totalTimeSec) || 0;
  const fcTime = Number(firstCrackTimeSec) || 0;
  const dtrPct =
    tTime > fcTime
      ? Number((((tTime - fcTime) / tTime) * 100).toFixed(2))
      : 0;

  const handleCreateRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    const bean = beans.find((b) => b.id === selectedBeanId);
    if (!bean) return;

    const finalMachineName =
      roasterMachine === 'Mesin Roasting Rakitan (Kustom)' && customMachineName.trim()
        ? `Mesin Roasting Rakitan (${customMachineName.trim()})`
        : roasterMachine;

    const roastNumber = `RST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRoast: RoastLog = {
      id: `roast-${Date.now().toString(36)}`,
      roastNumber,
      beanId: bean.id,
      beanName: bean.name,
      batchLotNumber,
      roasterMachine: finalMachineName,
      roastProfileLevel,
      greenWeightGrams: gWeight,
      roastedWeightGrams: rWeight,
      weightLossPercent: weightLossPct,
      chargeTempC: Number(chargeTempC) || 0,
      turningPointTempC: Number(turningPointTempC) || 0,
      turningPointTimeSec: Number(turningPointTimeSec) || 0,
      dryEndTempC: Number(dryEndTempC) || 0,
      dryEndTimeSec: Number(dryEndTimeSec) || 0,
      firstCrackTempC: Number(firstCrackTempC) || 0,
      firstCrackTimeSec: fcTime,
      dropTempC: Number(dropTempC) || 0,
      totalTimeSec: tTime,
      dtrPercent: dtrPct,
      cuppingScore: Number(cuppingScore) || 0,
      cuppingNotes,
      roasterOperator,
      roastDate: roastDate || new Date().toISOString().split('T')[0],
      status: roastStatus,
      createdAt: new Date().toISOString()
    };

    // Tutup menu modal seketika
    setIsNewRoastModalOpen(false);
    setSelectedRoast(newRoast);

    await saveRoastLog(newRoast, beans, batches);
    onRefresh();
  };

  const handleShareRoastReport = (roast: RoastLog) => {
    const text = `*LAPORAN ROAST LAB & CUPPING QC KOPIFLOW*\n\n` +
      `No. Batch Sangrai: *${roast.roastNumber}*\n` +
      `Biji Kopi: *${roast.beanName}*\n` +
      `Lot Asal: ${roast.batchLotNumber}\n` +
      `Profil: *${roast.roastProfileLevel}*\n` +
      `Mesin: ${roast.roasterMachine}\n` +
      `Roaster: ${roast.roasterOperator}\n\n` +
      `*PARAMETER SANGRAI:*\n` +
      `• Berat Masuk (Green): ${roast.greenWeightGrams} g\n` +
      `• Berat Keluar (Roasted): ${roast.roastedWeightGrams} g\n` +
      `• Penyusutan (Weight Loss): *${roast.weightLossPercent.toFixed(1)}%*\n` +
      `• First Crack: ${Math.floor(roast.firstCrackTimeSec / 60)}m ${roast.firstCrackTimeSec % 60}s @ ${roast.firstCrackTempC}°C\n` +
      `• Drop Temp: ${roast.dropTempC}°C (Total: ${Math.floor(roast.totalTimeSec / 60)}m ${roast.totalTimeSec % 60}s)\n` +
      `• DTR (Dev Ratio): *${roast.dtrPercent.toFixed(1)}%*\n\n` +
      `*HASIL SENSORI CUPPING SCA:*\n` +
      `• Skor Cupping: *${roast.cuppingScore} / 100*\n` +
      `• Tasting Notes: "${roast.cuppingNotes}"\n` +
      `• Status QC: *${roast.status}*`;

    const url = buildWhatsAppLink('6281122334455', text);
    window.open(url, '_blank');
  };

  const filteredRoasts = roasts.filter((r) => {
    const matchSearch =
      r.roastNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.beanName.toLowerCase().includes(search.toLowerCase()) ||
      r.batchLotNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.roasterMachine.toLowerCase().includes(search.toLowerCase()) ||
      r.roasterOperator.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchMachine =
      machineFilter === 'all'
        ? true
        : machineFilter === 'rakitan'
        ? r.roasterMachine.toLowerCase().includes('rakitan')
        : r.roasterMachine.toLowerCase().includes(machineFilter.toLowerCase());
    return matchSearch && matchStatus && matchMachine;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar with Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari profil sangrai, lot, roaster..."
              className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* QC Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">Semua Status QC</option>
            <option value="Passed QC">Passed QC</option>
            <option value="Failed QC">Failed QC</option>
            <option value="Cupping Pending">Cupping Pending</option>
          </select>

          {/* Roasting Machine Filter */}
          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-xs font-semibold text-amber-900 focus:border-amber-600 focus:outline-hidden"
          >
            <option value="all">Semua Mesin Roasting</option>
            <option value="rakitan">🛠️ Mesin Roasting Rakitan (Lokal)</option>
            <option value="Giesen">Giesen W6A</option>
            <option value="Probat">Probat UG22</option>
            <option value="Berto">Berto Type One</option>
            <option value="Diedrich">Diedrich IR-12</option>
          </select>
        </div>

        <button
          onClick={() => {
            setRoasterMachine('Mesin Roasting Rakitan (Drum 1-5 kg)');
            setIsNewRoastModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-orange-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-800 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>+ Catat Sesi Sangrai Baru</span>
        </button>
      </div>

      {/* SECTION: ARMADA MESIN ROASTING (Termasuk Mesin Roasting Rakitan) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <Flame className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">
                Armada Mesin Roasting & Lab Kalibrasi
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daftar mesin sangrai aktif: Tersedia mesin roasting rakitan pengrajin lokal untuk UMKM & micro-lot serta mesin industri berkapasitas besar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
              ● 5 Mesin Terdaftar Siap Pakai
            </span>
          </div>
        </div>

        {/* Machine Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Mesin Roasting Rakitan (Featured) */}
          <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-orange-50/60 p-3.5 space-y-2 relative shadow-xs hover:border-amber-500 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded bg-amber-600 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                🛠️ Rakitan Lokal
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700">Aktif</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-zinc-900 leading-tight">
                  Mesin Roasting Rakitan
                </h4>
                <span className="text-[10px] text-amber-800 font-medium">
                  Drum Kustom 1 - 5 kg
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-600 leading-snug">
              Drum stainless steel/cast iron rakitan pengrajin lokal, burner gas LPG needle valve, & dual probe digital thermocouple.
            </p>

            <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-900 text-[10px]">Profil Micro-lot</span>
              <button
                onClick={() => {
                  setRoasterMachine('Mesin Roasting Rakitan (Drum 1-5 kg)');
                  setIsNewRoastModalOpen(true);
                }}
                className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 hover:text-amber-900 underline"
              >
                Pakai Mesin <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Mesin Rakitan Artisan 10 kg */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-3.5 space-y-2 shadow-2xs hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 text-[9px] font-bold">
                🛠️ Rakitan Artisan
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700">Aktif</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-700 text-white shadow-xs">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-900 leading-tight">
                  Rakitan Artisan 10 kg
                </h4>
                <span className="text-[10px] text-zinc-500 font-medium">
                  Semi-Hot Air Gayo
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-600 leading-snug">
              Kapasitas produksi sedang untuk pesanan kedai lokal & UMKM dengan pengaturan blower airflow manual.
            </p>

            <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 text-[10px]">Batch 10 kg</span>
              <button
                onClick={() => {
                  setRoasterMachine('Mesin Roasting Rakitan Artisan (Dual Probe 10 kg)');
                  setIsNewRoastModalOpen(true);
                }}
                className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 hover:text-amber-900 underline"
              >
                Pakai Mesin <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Card 3: Giesen W6A */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-2 shadow-2xs hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded bg-zinc-100 text-zinc-700 px-1.5 py-0.2 text-[9px] font-semibold">
                🏭 Komersial
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700">Aktif</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-white shadow-xs">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-900 leading-tight">
                  Giesen W6A
                </h4>
                <span className="text-[10px] text-zinc-500 font-medium">
                  Cast Iron Drum 6 kg
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-600 leading-snug">
              Mesin profil presisi tinggi Belanda untuk sangrai Specialty Grade 1 dan evaluasi sensori cupping SCA.
            </p>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 text-[10px]">Batch 6 kg</span>
              <button
                onClick={() => {
                  setRoasterMachine('Giesen W6A (Drum Roaster)');
                  setIsNewRoastModalOpen(true);
                }}
                className="font-bold text-xs text-zinc-700 hover:text-zinc-900 underline"
              >
                Pakai Mesin
              </button>
            </div>
          </div>

          {/* Card 4: Probat & Berto */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-2 shadow-2xs hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded bg-zinc-100 text-zinc-700 px-1.5 py-0.2 text-[9px] font-semibold">
                🏭 Industri
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700">Aktif</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-white shadow-xs">
                <Cpu className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-900 leading-tight">
                  Probat UG22 & Berto 5kg
                </h4>
                <span className="text-[10px] text-zinc-500 font-medium">
                  Kapasitas Besar
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-600 leading-snug">
              Mesin roaster kapasitas besar untuk pemenuhan pesanan partai luar pulau (Jawa, Kalimantan, Sulawesi).
            </p>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 text-[10px]">Batch 5-22 kg</span>
              <button
                onClick={() => {
                  setRoasterMachine('Probat UG22 (Industrial Roaster)');
                  setIsNewRoastModalOpen(true);
                }}
                className="font-bold text-xs text-zinc-700 hover:text-zinc-900 underline"
              >
                Pakai Mesin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main View: Curve Chart on Top / Right, Roast List on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Roast Profile List (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Daftar Profil Penyangraian ({filteredRoasts.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredRoasts.map((roast) => {
              const isSelected = selectedRoast?.id === roast.id;
              return (
                <div
                  key={roast.id}
                  onClick={() => setSelectedRoast(roast)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-1 ring-orange-500/30'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-100">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-900">
                          {roast.roastNumber}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600">
                          {roast.roastProfileLevel}
                        </span>
                        {roast.roasterMachine.toLowerCase().includes('rakitan') ? (
                          <span className="rounded bg-amber-100 border border-amber-300 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-900">
                            🛠️ Rakitan
                          </span>
                        ) : (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[9px] font-medium text-zinc-500">
                            {roast.roasterMachine.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-zinc-900 mt-1 truncate">
                        {roast.beanName}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                        <Sparkles className="h-3 w-3 text-emerald-600" />
                        {roast.cuppingScore}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-600 italic mt-2 line-clamp-2">
                    "{roast.cuppingNotes}"
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] text-zinc-500 pt-2 border-t border-zinc-100">
                    <div>
                      Loss: <strong className="text-zinc-800">{roast.weightLossPercent.toFixed(1)}%</strong>
                    </div>
                    <div>
                      DTR: <strong className="text-emerald-700">{roast.dtrPercent.toFixed(1)}%</strong>
                    </div>
                    <div>
                      Drop: <strong className="text-red-700">{roast.dropTempC}°C</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Roast Deep Dive & Thermodynamic Curve (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedRoast ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-amber-900">
                      {selectedRoast.roastNumber}
                    </span>
                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
                      Level: {selectedRoast.roastProfileLevel}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      {selectedRoast.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mt-1">
                    {selectedRoast.beanName} (Batch: {selectedRoast.batchLotNumber})
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Mesin: {selectedRoast.roasterMachine} • Roaster: {selectedRoast.roasterOperator} • Tgl:{' '}
                    {selectedRoast.roastDate}
                  </p>
                </div>

                <button
                  onClick={() => handleShareRoastReport(selectedRoast)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shrink-0 shadow-2xs"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Kirim Laporan WA</span>
                </button>
              </div>

              {/* Thermodynamic Roast Curve Chart */}
              <div>
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-orange-600" />
                  <span>Kurva Termodinamika Penyangraian (BT vs ET)</span>
                </h4>
                <RoastCurveChart roast={selectedRoast} height={250} />
              </div>

              {/* Precision Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                    Green In / Roasted Out
                  </span>
                  <div className="font-mono font-bold text-zinc-900 mt-0.5">
                    {selectedRoast.greenWeightGrams}g / {selectedRoast.roastedWeightGrams}g
                  </div>
                  <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                    Loss: {selectedRoast.weightLossPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                    Charge & Turning Point
                  </span>
                  <div className="font-mono font-bold text-zinc-900 mt-0.5">
                    {selectedRoast.chargeTempC}°C / {selectedRoast.turningPointTempC}°C
                  </div>
                  <span className="text-[11px] text-blue-600 font-medium block mt-0.5">
                    TP Time: {selectedRoast.turningPointTimeSec}s
                  </span>
                </div>

                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                    First Crack (FC)
                  </span>
                  <div className="font-mono font-bold text-orange-700 mt-0.5">
                    {selectedRoast.firstCrackTempC}°C
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium block mt-0.5">
                    {Math.floor(selectedRoast.firstCrackTimeSec / 60)}m{' '}
                    {selectedRoast.firstCrackTimeSec % 60}s
                  </span>
                </div>

                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                    Dev Time Ratio (DTR)
                  </span>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">
                    {selectedRoast.dtrPercent.toFixed(1)}%
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium block mt-0.5">
                    Total: {Math.floor(selectedRoast.totalTimeSec / 60)}m{' '}
                    {selectedRoast.totalTimeSec % 60}s
                  </span>
                </div>
              </div>

              {/* SCA Cupping Sensory Notes Card */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-700" />
                    <span className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                      Evaluasi Sensori & Skor Cupping SCA
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-emerald-900">
                    {selectedRoast.cuppingScore} / 100 PTS
                  </span>
                </div>
                <p className="text-xs text-emerald-900 font-medium leading-relaxed italic">
                  "{selectedRoast.cuppingNotes}"
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedRoast.cuppingNotes.split(',').map((note, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-white/80 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                    >
                      {note.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400">
              Pilih salah satu profil sangrai dari daftar untuk melihat kurva termodinamika
            </div>
          )}
        </div>
      </div>

      {/* New Roast Session Modal */}
      {isNewRoastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Catat Sesi Sangrai Baru (Roast Lab)</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Input parameter presisi waktu & suhu untuk kalkulasi otomatis penyusutan dan DTR
                </p>
              </div>
              <button
                onClick={() => setIsNewRoastModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoast} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Pilih Biji Kopi</label>
                  <select
                    value={selectedBeanId}
                    onChange={(e) => setSelectedBeanId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    {beans.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.variety} • {b.process})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nomor Lot Asal</label>
                  <select
                    value={batchLotNumber}
                    onChange={(e) => setBatchLotNumber(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.lotNumber}>
                        {b.lotNumber} ({b.beanName}) - Sisa {b.quantityRemainingKg} kg
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanggal Roasting Picker (Bisa Diatur) */}
              <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-700">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <label className="block font-bold text-orange-950 text-xs">
                      Tanggal Sesi Roasting / Sangrai (Bisa Diatur):
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Tentukan tanggal pengerjaan batch sangrai (hari ini / tanggal sebelumnya)
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-56">
                  <input
                    type="date"
                    required
                    value={roastDate}
                    onChange={(e) => setRoastDate(e.target.value)}
                    className="w-full rounded-lg border border-orange-300 bg-white px-3 py-1.5 font-mono font-bold text-xs text-zinc-900 focus:border-orange-600 focus:outline-hidden shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Mesin Roasting
                  </label>
                  <select
                    value={roasterMachine}
                    onChange={(e) => setRoasterMachine(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    <optgroup label="🛠️ Mesin Roasting Rakitan (Lokal / Kustom)">
                      <option value="Mesin Roasting Rakitan (Drum 1-5 kg)">
                        Mesin Roasting Rakitan (Drum 1-5 kg)
                      </option>
                      <option value="Mesin Roasting Rakitan Lokal (Drum 3 kg Semi-Hot Air)">
                        Mesin Roasting Rakitan Lokal (Drum 3 kg Semi-Hot Air)
                      </option>
                      <option value="Mesin Roasting Rakitan Artisan (Dual Probe 10 kg)">
                        Mesin Roasting Rakitan Artisan (Dual Probe 10 kg)
                      </option>
                      <option value="Mesin Roasting Rakitan Bengkel Gayo Takengon">
                        Mesin Roasting Rakitan Bengkel Gayo Takengon
                      </option>
                      <option value="Mesin Roasting Rakitan (Kustom)">
                        Mesin Roasting Rakitan (Kustom / Input Nama Sendiri...)
                      </option>
                    </optgroup>
                    <optgroup label="🏭 Mesin Komersial & Industri">
                      <option value="Giesen W6A (Drum Roaster)">Giesen W6A (Drum)</option>
                      <option value="Probat UG22 (Industrial Roaster)">Probat UG22 (Industri)</option>
                      <option value="Berto Type One 5kg">Berto Type One 5kg</option>
                      <option value="Diedrich IR-12 (Infrared)">Diedrich IR-12 (Infrared)</option>
                    </optgroup>
                  </select>
                  {roasterMachine === 'Mesin Roasting Rakitan (Kustom)' && (
                    <div className="mt-1.5">
                      <input
                        type="text"
                        placeholder="Ketik spesifikasi/nama mesin rakitan kustom..."
                        value={customMachineName}
                        onChange={(e) => setCustomMachineName(e.target.value)}
                        className="w-full rounded-lg border border-amber-300 bg-amber-50/50 px-2.5 py-1 text-xs focus:border-amber-600 focus:outline-hidden"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Level Sangrai</label>
                  <select
                    value={roastProfileLevel}
                    onChange={(e) => setRoastProfileLevel(e.target.value as RoastLevel)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Light">Light (Cinnamon)</option>
                    <option value="Medium-Light">Medium-Light (City)</option>
                    <option value="Medium">Medium (City+)</option>
                    <option value="Medium-Dark">Medium-Dark (Full City)</option>
                    <option value="Dark">Dark (French)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-zinc-700">Roaster Operator / Petugas</label>
                    <span className="text-[10px] font-semibold text-amber-800">Firestore DB Sync</span>
                  </div>
                  <input
                    type="text"
                    required
                    list="roaster-staff-datalist"
                    value={roasterOperator}
                    onChange={(e) => setRoasterOperator(e.target.value)}
                    placeholder="Pilih atau ketik nama roaster..."
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden font-medium text-xs text-zinc-900"
                  />
                  <datalist id="roaster-staff-datalist">
                    {roasterStaffList.map((staf) => (
                      <option key={staf.id} value={`${staf.name} (${staf.role})`}>
                        {staf.name} - {staf.role} ({staf.shift})
                      </option>
                    ))}
                  </datalist>

                  {/* Quick pills from Database */}
                  {roasterStaffList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[10px] font-semibold text-zinc-500">Pilih Staf:</span>
                      {roasterStaffList.map((staf) => {
                        const valStr = `${staf.name} (${staf.role})`;
                        return (
                          <button
                            key={staf.id}
                            type="button"
                            onClick={() => setRoasterOperator(valStr)}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium border transition-colors ${
                              roasterOperator === valStr || roasterOperator === staf.name
                                ? 'bg-amber-800 text-white border-amber-800'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                            }`}
                          >
                            {staf.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Weight In vs Out & Auto Loss % */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-2">
                <span className="font-bold text-zinc-800 block">Bobot & Penyusutan (Weight Loss)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-600 mb-0.5">Berat Biji Masuk (g)</label>
                    <input
                      type="number"
                      required
                      value={greenWeightGrams === 0 || greenWeightGrams === '' ? '' : greenWeightGrams}
                      onChange={(e) => setGreenWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-600 mb-0.5">Berat Matang Keluar (g)</label>
                    <input
                      type="number"
                      required
                      value={roastedWeightGrams === 0 || roastedWeightGrams === '' ? '' : roastedWeightGrams}
                      onChange={(e) => setRoastedWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-600 mb-0.5">Kalkulasi Penyusutan</label>
                    <div className="rounded-lg bg-amber-100/70 border border-amber-200 px-2.5 py-1.5 font-bold text-amber-900 font-mono">
                      {weightLossPct}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Thermodynamic Temperatures & Milestones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Charge Temp (°C)</label>
                  <input
                    type="number"
                    value={chargeTempC === 0 || chargeTempC === '' ? '' : chargeTempC}
                    onChange={(e) => setChargeTempC(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Turning Point (°C)</label>
                  <input
                    type="number"
                    value={turningPointTempC === 0 || turningPointTempC === '' ? '' : turningPointTempC}
                    onChange={(e) => setTurningPointTempC(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">First Crack Temp (°C)</label>
                  <input
                    type="number"
                    value={firstCrackTempC === 0 || firstCrackTempC === '' ? '' : firstCrackTempC}
                    onChange={(e) => setFirstCrackTempC(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Drop Temp (°C)</label>
                  <input
                    type="number"
                    value={dropTempC === 0 || dropTempC === '' ? '' : dropTempC}
                    onChange={(e) => setDropTempC(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
              </div>

              {/* Time Milestones in Seconds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">TP Waktu (detik)</label>
                  <input
                    type="number"
                    value={turningPointTimeSec === 0 || turningPointTimeSec === '' ? '' : turningPointTimeSec}
                    onChange={(e) => setTurningPointTimeSec(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Dry End Waktu (detik)</label>
                  <input
                    type="number"
                    value={dryEndTimeSec === 0 || dryEndTimeSec === '' ? '' : dryEndTimeSec}
                    onChange={(e) => setDryEndTimeSec(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">FC Start Waktu (detik)</label>
                  <input
                    type="number"
                    value={firstCrackTimeSec === 0 || firstCrackTimeSec === '' ? '' : firstCrackTimeSec}
                    onChange={(e) => setFirstCrackTimeSec(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Total Waktu (detik)</label>
                  <input
                    type="number"
                    value={totalTimeSec === 0 || totalTimeSec === '' ? '' : totalTimeSec}
                    onChange={(e) => setTotalTimeSec(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
              </div>

              {/* Cupping Notes and QC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Skor Cupping (0-100)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={cuppingScore === 0 || cuppingScore === '' ? '' : cuppingScore}
                    onChange={(e) => setCuppingScore(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-bold text-emerald-800 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Status Keputusan QC</label>
                  <select
                    value={roastStatus}
                    onChange={(e) => setRoastStatus(e.target.value as RoastStatus)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Passed QC">Passed QC (Masuk Stok Sangrai)</option>
                    <option value="Failed QC">Failed QC (Reject/Quarantine)</option>
                    <option value="Cupping Pending">Cupping Pending</option>
                    <option value="Sample Only">Sample Only (Uji Rasa)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Hasil DTR</label>
                  <div className="rounded-lg bg-zinc-100 px-3 py-1.5 font-bold font-mono text-zinc-800">
                    {dtrPct}% DTR
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Deskripsi Sensori Cupping</label>
                <textarea
                  rows={2}
                  value={cuppingNotes}
                  onChange={(e) => setCuppingNotes(e.target.value)}
                  placeholder="Aroma, acidity, sweetness, aftertaste..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsNewRoastModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-700 px-4 py-1.5 font-bold text-white hover:bg-orange-800"
                >
                  Simpan Sesi & Update Stok Otomatis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
