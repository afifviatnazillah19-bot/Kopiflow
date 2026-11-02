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
  ArrowRight
} from 'lucide-react';
import { RoastLog, CoffeeBean, Batch, RoastLevel, RoastStatus } from '../../types/erp';
import { RoastCurveChart } from './RoastCurveChart';
import { saveRoastLog, buildWhatsAppLink } from '../../services/dbService';

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
  const [roasterMachine, setRoasterMachine] = useState<string>('Giesen W6A (Drum Roaster)');
  const [roastProfileLevel, setRoastProfileLevel] = useState<RoastLevel>('Medium-Light');
  const [greenWeightGrams, setGreenWeightGrams] = useState<number>(5000);
  const [roastedWeightGrams, setRoastedWeightGrams] = useState<number>(4320);
  const [chargeTempC, setChargeTempC] = useState<number>(198);
  const [turningPointTempC, setTurningPointTempC] = useState<number>(92);
  const [turningPointTimeSec, setTurningPointTimeSec] = useState<number>(85);
  const [dryEndTempC, setDryEndTempC] = useState<number>(154);
  const [dryEndTimeSec, setDryEndTimeSec] = useState<number>(295);
  const [firstCrackTempC, setFirstCrackTempC] = useState<number>(196);
  const [firstCrackTimeSec, setFirstCrackTimeSec] = useState<number>(520);
  const [dropTempC, setDropTempC] = useState<number>(208);
  const [totalTimeSec, setTotalTimeSec] = useState<number>(640);
  const [cuppingScore, setCuppingScore] = useState<number>(87.5);
  const [cuppingNotes, setCuppingNotes] = useState<string>('Bergamot, orange blossom, brown sugar sweetness, crisp malic acidity');
  const [roasterOperator, setRoasterOperator] = useState<string>('Hendra Setiawan (Head Roaster)');
  const [roastStatus, setRoastStatus] = useState<RoastStatus>('Passed QC');

  // Calculations
  const weightLossPct =
    greenWeightGrams > 0
      ? Number((((greenWeightGrams - roastedWeightGrams) / greenWeightGrams) * 100).toFixed(2))
      : 0;

  const dtrPct =
    totalTimeSec > firstCrackTimeSec
      ? Number((((totalTimeSec - firstCrackTimeSec) / totalTimeSec) * 100).toFixed(2))
      : 0;

  const handleCreateRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    const bean = beans.find((b) => b.id === selectedBeanId);
    if (!bean) return;

    const roastNumber = `RST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRoast: RoastLog = {
      id: `roast-${Date.now().toString(36)}`,
      roastNumber,
      beanId: bean.id,
      beanName: bean.name,
      batchLotNumber,
      roasterMachine,
      roastProfileLevel,
      greenWeightGrams,
      roastedWeightGrams,
      weightLossPercent: weightLossPct,
      chargeTempC,
      turningPointTempC,
      turningPointTimeSec,
      dryEndTempC,
      dryEndTimeSec,
      firstCrackTempC,
      firstCrackTimeSec,
      dropTempC,
      totalTimeSec,
      dtrPercent: dtrPct,
      cuppingScore,
      cuppingNotes,
      roasterOperator,
      roastDate: new Date().toISOString().split('T')[0],
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
      r.roasterOperator.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
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
        </div>

        <button
          onClick={() => setIsNewRoastModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>+ Catat Sesi Sangrai Baru</span>
        </button>
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-amber-900">
                          {roast.roastNumber}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600">
                          {roast.roastProfileLevel}
                        </span>
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
                        {b.name} ({b.process})
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Mesin Roasting</label>
                  <select
                    value={roasterMachine}
                    onChange={(e) => setRoasterMachine(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Giesen W6A (Drum Roaster)">Giesen W6A (Drum)</option>
                    <option value="Probat UG22 (Industrial Roaster)">Probat UG22</option>
                    <option value="Berto Type One 5kg">Berto Type One 5kg</option>
                    <option value="Diedrich IR-12 (Infrared)">Diedrich IR-12</option>
                  </select>
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
                  <label className="block font-semibold text-zinc-700 mb-1">Roaster Operator</label>
                  <input
                    type="text"
                    value={roasterOperator}
                    onChange={(e) => setRoasterOperator(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
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
                      value={greenWeightGrams}
                      onChange={(e) => setGreenWeightGrams(Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-600 mb-0.5">Berat Matang Keluar (g)</label>
                    <input
                      type="number"
                      required
                      value={roastedWeightGrams}
                      onChange={(e) => setRoastedWeightGrams(Number(e.target.value))}
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
                    value={chargeTempC}
                    onChange={(e) => setChargeTempC(Number(e.target.value))}
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Turning Point (°C)</label>
                  <input
                    type="number"
                    value={turningPointTempC}
                    onChange={(e) => setTurningPointTempC(Number(e.target.value))}
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">First Crack Temp (°C)</label>
                  <input
                    type="number"
                    value={firstCrackTempC}
                    onChange={(e) => setFirstCrackTempC(Number(e.target.value))}
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Drop Temp (°C)</label>
                  <input
                    type="number"
                    value={dropTempC}
                    onChange={(e) => setDropTempC(Number(e.target.value))}
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
                    value={turningPointTimeSec}
                    onChange={(e) => setTurningPointTimeSec(Number(e.target.value))}
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Dry End Waktu (detik)</label>
                  <input
                    type="number"
                    value={dryEndTimeSec}
                    onChange={(e) => setDryEndTimeSec(Number(e.target.value))}
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">FC Start Waktu (detik)</label>
                  <input
                    type="number"
                    value={firstCrackTimeSec}
                    onChange={(e) => setFirstCrackTimeSec(Number(e.target.value))}
                    className="w-full rounded border border-zinc-200 px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">Total Waktu (detik)</label>
                  <input
                    type="number"
                    value={totalTimeSec}
                    onChange={(e) => setTotalTimeSec(Number(e.target.value))}
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
                    value={cuppingScore}
                    onChange={(e) => setCuppingScore(Number(e.target.value))}
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
