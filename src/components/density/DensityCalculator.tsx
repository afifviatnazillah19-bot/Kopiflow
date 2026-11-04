import React, { useState, useEffect, useMemo } from 'react';
import {
  Gauge,
  Scale,
  Wheat,
  Coffee,
  Flame,
  Package,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  HelpCircle,
  TrendingUp,
  Droplets,
  Mountain,
  Sliders,
  Sparkles
} from 'lucide-react';
import { CoffeeBean, Batch, DensityTestLog } from '../../types/erp';
import { saveBean, saveBatch } from '../../services/dbService';

interface DensityCalculatorProps {
  beans: CoffeeBean[];
  batches: Batch[];
  onRefresh: () => void;
}

const STORAGE_KEY_TESTS = 'kopiflow_erp_density_tests';

export const DensityCalculator: React.FC<DensityCalculatorProps> = ({
  beans,
  batches,
  onRefresh
}) => {
  // Mode: Green Bean vs. Roasted Bean
  const [sampleType, setSampleType] = useState<'green' | 'roasted'>('green');
  
  // Method: Volumetric Beaker / Cylinder vs Archimedes Water Displacement
  const [method, setMethod] = useState<'volumetric' | 'displacement'>('volumetric');

  // Link to existing Master Bean or Batch
  const [selectedBeanId, setSelectedBeanId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Sample Info
  const [sampleName, setSampleName] = useState('Arabika Gayo Specialty Pantan Musara');
  const [lotNumber, setLotNumber] = useState('LOT-2026-001');
  const [variety, setVariety] = useState('Timtim & Ateng Super');
  const [process, setProcess] = useState('Semi Wash (Giling Basah)');
  const [moisturePercent, setMoisturePercent] = useState<number | ''>(11.5);
  const [elevationMdpl, setElevationMdpl] = useState<number | ''>(1550);
  const [testedBy, setTestedBy] = useState('QC Lab Kofiara');
  const [notes, setNotes] = useState('');

  // Inputs for Volumetric Method
  const [containerPresetMl, setContainerPresetMl] = useState<number>(250);
  const [customContainerMl, setCustomContainerMl] = useState<string>('250');
  const [tareWeightG, setTareWeightG] = useState<number | ''>(0); // If scale tared with beaker, set to 0
  const [grossWeightG, setGrossWeightG] = useState<number | ''>(203.8); // Total weight on scale
  const [isDirectNetInput, setIsDirectNetInput] = useState<boolean>(false);
  const [directNetWeightG, setDirectNetWeightG] = useState<number | ''>(203.8);

  // Inputs for Archimedes Displacement Method
  const [initialWaterMl, setInitialWaterMl] = useState<number | ''>(150);
  const [finalWaterMl, setFinalWaterMl] = useState<number | ''>(250);
  const [displacementNetWeightG, setDisplacementNetWeightG] = useState<number | ''>(120);

  // Warehouse Space Estimator Input
  const [estimatorTotalKg, setEstimatorTotalKg] = useState<number | ''>(1000);


  // Test History Logs
  const [testLogs, setTestLogs] = useState<DensityTestLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TESTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isApplyingToMaster, setIsApplyingToMaster] = useState(false);
  const [showSopGuide, setShowSopGuide] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync selected bean to form inputs
  useEffect(() => {
    if (selectedBeanId) {
      const b = beans.find((item) => item.id === selectedBeanId);
      if (b) {
        setSampleName(b.name);
        setVariety(b.variety || '');
        setProcess(b.process || '');
        if (b.moistureAvgPercent) setMoisturePercent(b.moistureAvgPercent);
        if (b.densityGramsPerLiter && b.densityGramsPerLiter > 0) {
          // prefill weights based on 250mL container
          const targetVol = containerPresetMl || 250;
          const targetNet = (b.densityGramsPerLiter * targetVol) / 1000;
          setGrossWeightG(Number((targetNet + (Number(tareWeightG) || 0)).toFixed(1)));
          setDirectNetWeightG(Number(targetNet.toFixed(1)));
        }
      }
    }
  }, [selectedBeanId, beans, containerPresetMl, tareWeightG]);

  // Sync selected batch to form inputs
  useEffect(() => {
    if (selectedBatchId) {
      const bt = batches.find((item) => item.id === selectedBatchId);
      if (bt) {
        setSampleName(bt.beanName);
        setLotNumber(bt.lotNumber);
        setProcess(bt.process || '');
        if (bt.moistureContent) setMoisturePercent(bt.moistureContent);
        if (bt.densityGramsPerLiter && bt.densityGramsPerLiter > 0) {
          const targetVol = containerPresetMl || 250;
          const targetNet = (bt.densityGramsPerLiter * targetVol) / 1000;
          setGrossWeightG(Number((targetNet + (Number(tareWeightG) || 0)).toFixed(1)));
          setDirectNetWeightG(Number(targetNet.toFixed(1)));
        }
      }
    }
  }, [selectedBatchId, batches, containerPresetMl, tareWeightG]);

  // Save logs to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(testLogs));
    } catch {
      // storage quota or disabled
    }
  }, [testLogs]);

  // Calculations
  const activeVolumeMl = useMemo(() => {
    if (method === 'displacement') {
      const f = Number(finalWaterMl) || 0;
      const i = Number(initialWaterMl) || 0;
      return Math.max(1, f - i);
    }
    return containerPresetMl > 0 ? containerPresetMl : Math.max(1, Number(customContainerMl) || 250);
  }, [method, containerPresetMl, customContainerMl, finalWaterMl, initialWaterMl]);

  const activeNetWeightG = useMemo(() => {
    if (method === 'displacement') {
      return Math.max(0, Number(displacementNetWeightG) || 0);
    }
    if (isDirectNetInput) {
      return Math.max(0, Number(directNetWeightG) || 0);
    }
    const g = Number(grossWeightG) || 0;
    const t = Number(tareWeightG) || 0;
    return Math.max(0, g - t);
  }, [method, isDirectNetInput, directNetWeightG, grossWeightG, tareWeightG]);

  // Primary Metrics
  const densityGPerL = useMemo(() => {
    if (activeVolumeMl <= 0 || activeNetWeightG <= 0) return 0;
    return Number(((activeNetWeightG / activeVolumeMl) * 1000).toFixed(1));
  }, [activeNetWeightG, activeVolumeMl]);

  const densityGPerMl = useMemo(() => {
    if (densityGPerL <= 0) return 0;
    return Number((densityGPerL / 1000).toFixed(3));
  }, [densityGPerL]);

  const densityKgPerM3 = useMemo(() => {
    return densityGPerL; // 1 g/L = 1 kg/m³
  }, [densityGPerL]);

  // SCA Classification & Roasting Profile Recommendation
  const analysis = useMemo(() => {
    if (sampleType === 'green') {
      if (densityGPerL >= 800) {
        return {
          code: 'SHB',
          name: 'Sangat Tinggi (Strictly Hard Bean / SHB)',
          elevationRange: '1.600 - 2.200+ mdpl',
          badgeClass: 'bg-emerald-500 text-white',
          borderClass: 'border-emerald-500',
          bgClass: 'bg-emerald-50 text-emerald-950',
          textColor: 'text-emerald-700',
          summary: 'Biji kopi berkepadatan sel luar biasa tinggi dengan ruang pori sangat rapat. Khas daerah dataran sangat tinggi Gayo (Pantan Musara, Pegasing, Atu Lintang). Sangat kaya kandungan asam organik kompleks dan gula.',
          chargeTemp: '204°C - 212°C (High Charge)',
          initialHeat: 'Energi termal awal tinggi (85% - 95%) agar panas merambat menembus inti sel padat.',
          airflow: 'Aliran udara menengah-tinggi pasca Yellowing untuk transfer panas konveksi merata.',
          dtrTarget: '13% - 15% (Light/Filter) atau 15% - 17% (Espresso Medium).',
          risks: 'Risiko inti biji kurang matang (underdeveloped) jika suhu masuk terlalu rendah atau api terlalu kecil di awal sangrai.'
        };
      }
      if (densityGPerL >= 750) {
        return {
          code: 'HB',
          name: 'Tinggi (Hard Bean / HB)',
          elevationRange: '1.300 - 1.600 mdpl',
          badgeClass: 'bg-blue-600 text-white',
          borderClass: 'border-blue-500',
          bgClass: 'bg-blue-50 text-blue-950',
          textColor: 'text-blue-700',
          summary: 'Kepadatan tinggi khas dataran tinggi ideal (Bener Meriah, Takengon). Struktur sel kuat dan tahan terhadap panas yang mantap.',
          chargeTemp: '198°C - 204°C (Moderate-High Charge)',
          initialHeat: 'Energi termal menengah-tinggi (75% - 85%), stabilkan saat transisi fase pengeringan (Drying phase).',
          airflow: 'Aliran udara standar terkalibrasi.',
          dtrTarget: '14% - 16% (Filter) atau 16% - 18% (Omni/Espresso).',
          risks: 'Profil mudah dikendalikan. Jaga RoR (Rate of Rise) agar tidak crash menjelang First Crack.'
        };
      }
      if (densityGPerL >= 700) {
        return {
          code: 'MEDIUM',
          name: 'Sedang (Medium Density)',
          elevationRange: '1.000 - 1.300 mdpl',
          badgeClass: 'bg-amber-600 text-white',
          borderClass: 'border-amber-500',
          bgClass: 'bg-amber-50 text-amber-950',
          textColor: 'text-amber-700',
          summary: 'Kepadatan standar komersial hingga specialty mid-elevation. Dinding sel memiliki ketahanan panas rata-rata.',
          chargeTemp: '190°C - 198°C (Moderate Charge)',
          initialHeat: 'Gunakan daya panas sedang (60% - 75%). Hindari kejutan panas berlebih di awal.',
          airflow: 'Tingkatkan airflow perlahan saat memasuki fase Maillard.',
          dtrTarget: '15% - 17% (Medium Roast standard).',
          risks: 'Dinding sel lebih rentan terhadap tipping (gosong di ujung mata biji) jika drum terlalu panas.'
        };
      }
      if (densityGPerL >= 650) {
        return {
          code: 'SOFT',
          name: 'Rendah (Soft Bean / SB)',
          elevationRange: '800 - 1.000 mdpl',
          badgeClass: 'bg-orange-500 text-white',
          borderClass: 'border-orange-500',
          bgClass: 'bg-orange-50 text-orange-950',
          textColor: 'text-orange-700',
          summary: 'Kepadatan rendah, sel berpori longgar. Biasanya berasal dari perkebunan dataran rendah atau varietas tertentu yang berbuah cepat.',
          chargeTemp: '182°C - 190°C (Low / Gentle Charge)',
          initialHeat: 'Gunakan metode soaking (api kecil 30 detik pertama) dan pemanasan lembut bertahap (50% - 65%).',
          airflow: 'Aliran udara lembut agar tidak memanggang permukaan luar terlalu cepat.',
          dtrTarget: '16% - 19% (Perpanjang sedikit dengan panas rendah).',
          risks: 'PERINGATAN TINGGI: Sangat mudah gosong di permukaan (scorching / face burning) karena sel lunak menyerap panas terlalu cepat.'
        };
      }
      return {
        code: 'VERY_LOW',
        name: 'Sangat Rendah / Past Crop',
        elevationRange: '< 800 mdpl / Biji Tua / Floaters',
        badgeClass: 'bg-rose-600 text-white',
        borderClass: 'border-rose-500',
        bgClass: 'bg-rose-50 text-rose-950',
        textColor: 'text-rose-700',
        summary: 'Kepadatan di bawah ambang normal. Biji kemungkinan merupakan stok lama (past crop), porous, atau terdapat proporsi biji hampa/cacat serangga.',
        chargeTemp: '175°C - 182°C (Very Gentle Charge)',
        initialHeat: 'Pemberian panas sangat berhati-hati, roast perlahan.',
        airflow: 'Aliran udara cukup untuk menarik serpihan kulit ari (chaff) yang rapuh.',
        dtrTarget: '17% - 20%.',
        risks: 'Kualitas rasa rentan woody/kering. Disarankan lakukan penyortiran ulang atau gunakan untuk blend komersial.'
      };
    } else {
      // Roasted Bean Classification
      if (densityGPerL >= 390) {
        return {
          code: 'LIGHT_ROAST',
          name: 'Light Roast / Filter Profile',
          elevationRange: 'Agtron 75 - 90',
          badgeClass: 'bg-amber-500 text-zinc-950 font-extrabold',
          borderClass: 'border-amber-400',
          bgClass: 'bg-amber-50/70 text-amber-950',
          textColor: 'text-amber-800',
          summary: 'Biji matang dengan ekspansi sel minimal. Menyimpan keasaman buah (acidity) cerah, floral, dan karakter terroir varietas asli.',
          chargeTemp: 'Selesai tepat di akhir First Crack',
          initialHeat: 'Penurunan bobot tipikal: 11% - 13.5%',
          airflow: 'Kepadatan tinggi pada biji matang menghasilkan body yang ringan dan kejelasan rasa tinggi.',
          dtrTarget: 'DTR 12% - 15%',
          risks: 'Membutuhkan gilingan lebih halus saat seduh manual (V60/Kalita) untuk ekstraksi optimal.'
        };
      }
      if (densityGPerL >= 350) {
        return {
          code: 'MEDIUM_ROAST',
          name: 'Medium Roast / Omni Profile',
          elevationRange: 'Agtron 55 - 75',
          badgeClass: 'bg-amber-700 text-white',
          borderClass: 'border-amber-700',
          bgClass: 'bg-amber-50 text-amber-950',
          textColor: 'text-amber-900',
          summary: 'Tingkat ekspansi optimal. Keseimbangan manis karamel, cokelat, dan asam yang harmonis. Sangat fleksibel untuk espresso maupun filter.',
          chargeTemp: 'Selesai di tengah fase pengembangan (development)',
          initialHeat: 'Penurunan bobot tipikal: 13.5% - 16%',
          airflow: 'Densitas ideal untuk mesin espresso komersial dan kopi susu kekinian.',
          dtrTarget: 'DTR 15% - 18%',
          risks: 'Standar emas roastery specialty. Pastikan waktu degassing 5-7 hari sebelum disajikan.'
        };
      }
      if (densityGPerL >= 310) {
        return {
          code: 'DARK_ROAST',
          name: 'Medium-Dark / Dark Roast',
          elevationRange: 'Agtron 35 - 55',
          badgeClass: 'bg-zinc-800 text-white',
          borderClass: 'border-zinc-700',
          bgClass: 'bg-zinc-100 text-zinc-900',
          textColor: 'text-zinc-800',
          summary: 'Ekspansi sel besar, dinding sel sangat berpori dan rapuh. Karakter rasa dominan dark chocolate, smoky, dan body sangat tebal.',
          chargeTemp: 'Selesai mendekati atau pada Second Crack',
          initialHeat: 'Penurunan bobot tipikal: 16% - 19%',
          airflow: 'Minyak kopi (coffee oils) mulai keluar ke permukaan biji.',
          dtrTarget: 'DTR 18% - 22%',
          risks: 'Biji sangat rapuh saat digiling. Sangat cepat menyerap kelembapan dan bau udara sekitar.'
        };
      }
      return {
        code: 'OVER_ROASTED',
        name: 'Very Dark / French Roast',
        elevationRange: 'Agtron < 35',
        badgeClass: 'bg-zinc-950 text-rose-300',
        borderClass: 'border-zinc-900',
        bgClass: 'bg-zinc-200 text-zinc-950',
        textColor: 'text-zinc-950',
        summary: 'Ekspansi maksimum dengan kerusakan struktur sel internal yang luas. Rasa dominan abu dan kepahitan karbon.',
        chargeTemp: 'Second Crack aktif mendalam',
        initialHeat: 'Penurunan bobot tipikal: > 19%',
        airflow: 'Densitas sangat rendah, bobot per butir biji sangat enteng.',
        dtrTarget: 'DTR > 22%',
        risks: 'Cepat tengik karena oksidasi lipid yang masif.'
      };
    }
  }, [densityGPerL, sampleType]);

  // Warehouse Space / Bag Estimator
  const estimator = useMemo(() => {
    const totalKg = Number(estimatorTotalKg) || 0;
    if (densityGPerL <= 0 || totalKg <= 0) {
      return {
        totalVolumeLiters: 0,
        totalVolumeM3: 0,
        grainPro60KgBags: 0,
        grainPro30KgBags: 0,
        pouch1KgCount: 0,
        palletsNeeded: 0
      };
    }
    // Volume (L) = (Total Kg * 1000) / Density (g/L)
    const totalVolumeLiters = (totalKg * 1000) / densityGPerL;
    const totalVolumeM3 = totalVolumeLiters / 1000;
    const grainPro60KgBags = Math.ceil(totalKg / 60);
    const grainPro30KgBags = Math.ceil(totalKg / 30);
    const pouch1KgCount = Math.ceil(totalKg / 1);
    // 1 Euro/Standard pallet (~1.2m x 1.0m) can safely hold ~10-12 bags of 60kg (600-720kg)
    const palletsNeeded = Math.ceil(totalKg / 600);

    return {
      totalVolumeLiters: Number(totalVolumeLiters.toFixed(1)),
      totalVolumeM3: Number(totalVolumeM3.toFixed(2)),
      grainPro60KgBags,
      grainPro30KgBags,
      pouch1KgCount,
      palletsNeeded
    };
  }, [densityGPerL, estimatorTotalKg]);

  // Handle Apply Density to Master Bean / Batch in Database
  const handleApplyToDatabase = async () => {
    if (densityGPerL <= 0) {
      showToast('Hasil pengukuran densitas belum valid.');
      return;
    }

    setIsApplyingToMaster(true);
    try {
      let appliedCount = 0;

      // 1. Update Master Bean if selected
      if (selectedBeanId) {
        const bean = beans.find((b) => b.id === selectedBeanId);
        if (bean) {
          const updatedBean: CoffeeBean = {
            ...bean,
            densityGramsPerLiter: densityGPerL,
            moistureAvgPercent: moisturePercent || bean.moistureAvgPercent,
            updatedAt: new Date().toISOString()
          };
          await saveBean(updatedBean);
          appliedCount++;
        }
      }

      // 2. Update Batch if selected
      if (selectedBatchId) {
        const batch = batches.find((bt) => bt.id === selectedBatchId);
        if (batch) {
          const updatedBatch: Batch = {
            ...batch,
            densityGramsPerLiter: densityGPerL,
            moistureContent: moisturePercent || batch.moistureContent,
            updatedAt: new Date().toISOString()
          };
          await saveBatch(updatedBatch, beans, false);
          appliedCount++;
        }
      }

      if (appliedCount > 0) {
        showToast(
          `Densitas ${densityGPerL} g/L (${analysis.code}) berhasil diperbarui ke database inventaris!`
        );
        onRefresh();
      } else {
        showToast(
          'Pilih Master Biji Kopi atau Batch Lot terlebih dahulu untuk menerapkan densitas ke database.'
        );
      }
    } catch (err: any) {
      showToast(`Gagal menyimpan ke database: ${err?.message || 'Error koneksi'}`);
    } finally {
      setIsApplyingToMaster(false);
    }
  };

  // Save to Local Test History
  const handleSaveToHistory = () => {
    if (densityGPerL <= 0) {
      showToast('Hasil pengukuran belum valid untuk dicatat.');
      return;
    }

    const newLog: DensityTestLog = {
      id: `DENS-${Date.now()}`,
      sampleType,
      beanId: selectedBeanId || undefined,
      beanName: sampleName || 'Sampel Tanpa Nama',
      lotNumber: lotNumber || '-',
      variety: variety || '-',
      process: process || '-',
      method,
      tareWeightG: Number(tareWeightG) || 0,
      grossWeightG: Number(grossWeightG) || 0,
      netWeightG: activeNetWeightG,
      volumeMl: activeVolumeMl,
      densityGPerL,
      densityGPerMl,
      densityKgPerM3,
      moisturePercent: moisturePercent ? Number(moisturePercent) : undefined,
      elevationMdpl: elevationMdpl ? Number(elevationMdpl) : undefined,
      scaClassification: `${analysis.code} - ${analysis.name}`,
      recommendedChargeTemp: analysis.chargeTemp,
      recommendedAirflow: analysis.airflow,
      recommendedHeat: analysis.initialHeat,
      recommendedDtr: analysis.dtrTarget,
      notes: notes || undefined,
      testedBy: testedBy || 'Operator QC',
      testedAt: new Date().toISOString()
    };

    setTestLogs((prev) => [newLog, ...prev]);
    showToast(`Data uji densitas "${sampleName}" (${densityGPerL} g/L) berhasil dicatat ke riwayat lab.`);
  };

  const handleDeleteTestLog = (id: string) => {
    setTestLogs((prev) => prev.filter((item) => item.id !== id));
    showToast('Log uji berhasil dihapus.');
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Hapus semua riwayat uji densitas laboratorium?')) {
      setTestLogs([]);
      showToast('Semua riwayat uji lab berhasil dikosongkan.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-950 via-zinc-900 to-zinc-950 p-4 sm:p-6 text-white shadow-lg relative overflow-hidden">
        {/* Background glow & coffee graphics */}
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-2 opacity-10 hidden lg:block pointer-events-none">
          <Gauge className="h-48 w-48 text-teal-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 px-2.5 py-0.5 text-[11px] font-bold text-teal-300">
                <Gauge className="h-3.5 w-3.5" />
                QC LAB SPECIALTY
              </span>
              <span className="rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                SCA Cell Density Standard
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-zinc-300">
                Lhokseumawe Hub
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Kalkulator Densitas Kopi</span>
              <span className="text-xs font-mono font-normal text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                g/L • g/mL • kg/m³
              </span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Alat ukur presisi laboratorium untuk menghitung kepadatan sel biji kopi mentah (Green Bean) maupun sangrai (Roast Bean). Dilengkapi rekomendasi profil roasting, estimasi volume silo/karung gudang, dan sinkronisasi instan ke inventaris ERP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSopGuide(!showSopGuide)}
              className="flex items-center gap-1.5 rounded-xl border border-teal-400/40 bg-teal-900/40 px-3 py-2 text-xs font-bold text-teal-200 hover:bg-teal-800/50 transition-colors shadow-2xs"
            >
              <HelpCircle className="h-4 w-4" />
              <span>{showSopGuide ? 'Tutup Panduan' : 'Panduan SOP Pengukuran'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Cetak QC</span>
            </button>
          </div>
        </div>

        {/* SOP Guide Accordion */}
        {showSopGuide && (
          <div className="mt-4 pt-4 border-t border-teal-800/60 text-xs text-zinc-300 space-y-2 animate-in fade-in duration-150">
            <h4 className="font-bold text-teal-300 flex items-center gap-1.5 text-sm">
              <Info className="h-4 w-4" />
              Prosedur Standar Operasional (SOP) Pengukuran Densitas SCA:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300 pl-1 leading-relaxed">
              <li>
                <strong>Siapkan Tabung Volumetrik:</strong> Gunakan gelas ukur silindris (beaker 250 mL atau 500 mL) yang telah dibersihkan dan dikeringkan.
              </li>
              <li>
                <strong>Atur Tare Timbangan:</strong> Letakkan wadah kosong di atas timbangan digital (ketelitian 0.1 g) lalu tekan tombol <em>Tare</em> hingga bernilai 0.0 g.
              </li>
              <li>
                <strong>Tuang Biji Kopi Bebas Tekanan:</strong> Tuang biji kopi mentah atau sangrai secara perlahan dari ketinggian ~5 cm hingga biji menggunung di atas bibir wadah.
              </li>
              <li>
                <strong>Ratakan Permukaan (Leveling):</strong> Sapukan penggaris lurus atau bilah pisau di atas bibir wadah <em>dalam 1 gerakan mendatar</em>. <strong>JANGAN mengetuk atau mengguncang wadah</strong> agar kerapatan pori alami tidak berubah.
              </li>
              <li>
                <strong>Catat Massa Bersih:</strong> Timbang bobot bersih biji kopi, lalu masukkan nilai massa dan volume wadah ke kalkulator di bawah ini.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Main Grid: Input Controller & Result Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Setup & Input Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Sample Mode Selector (Green vs Roasted) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                1. Jenis Sampel & Metode
              </span>
              <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                QC PARAMETER
              </span>
            </div>

            {/* Toggle Green vs Roasted */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSampleType('green')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  sampleType === 'green'
                    ? 'bg-emerald-700 text-white shadow-xs scale-[1.01]'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <Wheat className="h-4 w-4" />
                <span>Green Bean (Mentah)</span>
              </button>
              <button
                type="button"
                onClick={() => setSampleType('roasted')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  sampleType === 'roasted'
                    ? 'bg-amber-800 text-white shadow-xs scale-[1.01]'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <Coffee className="h-4 w-4" />
                <span>Roasted Bean (Matang)</span>
              </button>
            </div>

            {/* Method Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">Metode Pengukuran Lab:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMethod('volumetric')}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    method === 'volumetric'
                      ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-1 ring-teal-600 font-bold'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Scale className="h-3.5 w-3.5 text-teal-700" />
                    <span>Silinder / Gelas Ukur</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-normal">Standar SCA industri (g/L)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('displacement')}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    method === 'displacement'
                      ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-1 ring-teal-600 font-bold'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Droplets className="h-3.5 w-3.5 text-blue-600" />
                    <span>Archimedes (Air)</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-normal">Displacement / Densitas sejati</p>
                </button>
              </div>
            </div>

            {/* Link to Inventory Data (Master Bean or Batch) */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-600" />
                  Hubungkan ke Data Inventaris Gudang
                </span>
                <span className="text-[10px] text-zinc-500">Opsional Autofill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-zinc-600 mb-1">Pilih Master Biji Kopi:</label>
                  <select
                    value={selectedBeanId}
                    onChange={(e) => {
                      setSelectedBeanId(e.target.value);
                      setSelectedBatchId('');
                    }}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-teal-600 focus:outline-hidden"
                  >
                    <option value="">-- Manual / Luar Master --</option>
                    {beans.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.variety})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-600 mb-1">Pilih Batch / Lot Panen:</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => {
                      setSelectedBatchId(e.target.value);
                      setSelectedBeanId('');
                    }}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-teal-600 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Batch Lot --</option>
                    {batches.map((bt) => (
                      <option key={bt.id} value={bt.id}>
                        {bt.lotNumber} - {bt.beanName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sample Identification Inputs */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block pb-2 border-b border-zinc-100">
              2. Data Identitas Sampel
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-zinc-700 mb-1">Nama Sampel Kopi / Label</label>
                <input
                  type="text"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  placeholder="cth: Arabika Gayo Pantan Musara Natural"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs font-medium text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nomor Lot / Batch</label>
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="cth: LOT-GAYO-2026/01"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 font-mono text-xs text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Varietas</label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="cth: Timtim, Ateng Super, Typica"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Proses Pascapanen</label>
                <input
                  type="text"
                  value={process}
                  onChange={(e) => setProcess(e.target.value)}
                  placeholder="cth: Semi Wash, Natural, Anaerobic"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-blue-500" />
                  Kadar Air / Moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={moisturePercent === 0 || moisturePercent === '' ? '' : moisturePercent}
                  onChange={(e) => setMoisturePercent(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 font-mono text-xs text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <Mountain className="h-3 w-3 text-emerald-600" />
                  Ketinggian Kebun (mdpl)
                </label>
                <input
                  type="number"
                  value={elevationMdpl === 0 || elevationMdpl === '' ? '' : elevationMdpl}
                  onChange={(e) => setElevationMdpl(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 font-mono text-xs text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Petugas Uji / Roaster</label>
                <input
                  type="text"
                  value={testedBy}
                  onChange={(e) => setTestedBy(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Measurement Form (Volumetric or Archimedes) */}
          <div className="rounded-2xl border border-teal-200/90 bg-white p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-teal-600" />
                3. Input Angka Pengukuran Timbangan
              </span>
              <button
                type="button"
                onClick={() => {
                  setGrossWeightG(sampleType === 'green' ? 203.8 : 95.0);
                  setDirectNetWeightG(sampleType === 'green' ? 203.8 : 95.0);
                  setTareWeightG(0);
                }}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Sample
              </button>
            </div>

            {method === 'volumetric' ? (
              <div className="space-y-4 text-xs">
                {/* Volume Presets */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1.5">
                    Kapasitas Volume Wadah / Silinder (mL):
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                    {[100, 250, 500, 1000].map((vol) => (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => {
                          setContainerPresetMl(vol);
                          setCustomContainerMl(String(vol));
                        }}
                        className={`rounded-xl border py-1.5 text-center font-mono font-bold transition-all ${
                          containerPresetMl === vol
                            ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {vol >= 1000 ? '1.000 mL (1L)' : `${vol} mL`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setContainerPresetMl(0)}
                      className={`rounded-xl border py-1.5 text-center font-bold text-xs transition-all ${
                        containerPresetMl === 0
                          ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      Kustom
                    </button>
                  </div>

                  {containerPresetMl === 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        value={customContainerMl}
                        onChange={(e) => setCustomContainerMl(e.target.value)}
                        placeholder="Ketik volume kustom dalam mL"
                        className="w-full rounded-xl border border-teal-300 bg-teal-50/30 px-3 py-1.5 font-mono text-xs focus:border-teal-600 focus:outline-hidden"
                      />
                      <span className="font-bold text-zinc-600">mL</span>
                    </div>
                  )}
                </div>

                {/* Weight Input Mode (Direct Net vs Gross - Tare) */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-zinc-700">Mode Pembacaan Timbangan:</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isDirectNetInput}
                        onChange={() => setIsDirectNetInput(false)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span>Wadah + Kopi (Gross - Tare)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={isDirectNetInput}
                        onChange={() => setIsDirectNetInput(true)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span>Tare 0 (Bersih Langsung)</span>
                    </label>
                  </div>
                </div>

                {!isDirectNetInput ? (
                  <div className="grid grid-cols-2 gap-3 bg-zinc-50/80 p-3 rounded-xl border border-zinc-200">
                    <div>
                      <label className="block font-semibold text-zinc-600 mb-1">
                        Bobot Wadah Kosong (Tare) (g):
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={tareWeightG === 0 || tareWeightG === '' ? '' : tareWeightG}
                        onChange={(e) => setTareWeightG(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 focus:border-teal-600 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-zinc-400">Kosongkan jika timbangan di-tare</span>
                    </div>

                    <div>
                      <label className="block font-bold text-teal-950 mb-1">
                        Bobot Total (Wadah + Biji) (g):
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={grossWeightG === 0 || grossWeightG === '' ? '' : grossWeightG}
                        onChange={(e) => setGrossWeightG(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full rounded-lg border border-teal-300 bg-white px-3 py-1.5 font-mono font-bold text-xs text-teal-950 focus:border-teal-600 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-teal-700 font-semibold">
                        Bersih: {activeNetWeightG.toFixed(1)} g
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-teal-950 mb-1">
                      Bobot Bersih Biji Kopi (Net Weight) (gram):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={directNetWeightG === 0 || directNetWeightG === '' ? '' : directNetWeightG}
                      onChange={(e) => setDirectNetWeightG(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-xl border border-teal-300 bg-white px-3 py-2 font-mono font-bold text-sm text-teal-950 focus:border-teal-600 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Timbangan digital telah di-tare (dinolkan) sebelum biji kopi dituangkan.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Archimedes Displacement Inputs */
              <div className="space-y-3 text-xs bg-blue-50/50 p-3 rounded-xl border border-blue-200">
                <div>
                  <label className="block font-semibold text-blue-950 mb-1">
                    Bobot Bersih Sampel Biji Kopi (gram):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={displacementNetWeightG === 0 || displacementNetWeightG === '' ? '' : displacementNetWeightG}
                    onChange={(e) => setDisplacementNetWeightG(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 font-mono font-bold text-xs text-blue-950 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      Volume Awal Air (mL):
                    </label>
                    <input
                      type="number"
                      value={initialWaterMl === 0 || initialWaterMl === '' ? '' : initialWaterMl}
                      onChange={(e) => setInitialWaterMl(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-blue-950 mb-1">
                      Volume Akhir Air + Biji (mL):
                    </label>
                    <input
                      type="number"
                      value={finalWaterMl === 0 || finalWaterMl === '' ? '' : finalWaterMl}
                      onChange={(e) => setFinalWaterMl(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 font-mono font-bold text-xs text-blue-950 focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-2 bg-blue-100/60 rounded-lg text-blue-900 text-[11px] font-mono">
                  Volume Terdislokasi = {activeVolumeMl} mL (Archimedes Net Volume)
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Catatan Pengujian & Fisik Biji:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="cth: Biji seragam, defect floaters 0%, aroma manis fresh crop..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 text-xs text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Actions: Save to Log & Apply to Inventory */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSaveToHistory}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 active:scale-95 transition-all"
              >
                <Save className="h-4 w-4 text-teal-400" />
                <span>Catat ke Riwayat Lab</span>
              </button>

              <button
                type="button"
                disabled={isApplyingToMaster || (!selectedBeanId && !selectedBatchId)}
                onClick={handleApplyToDatabase}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-xs ${
                  selectedBeanId || selectedBatchId
                    ? 'bg-teal-700 text-white hover:bg-teal-800 active:scale-95'
                    : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                }`}
                title={
                  selectedBeanId || selectedBatchId
                    ? 'Terapkan densitas ini ke Master Biji / Lot Gudang di Firebase'
                    : 'Pilih Master Biji atau Batch terlebih dahulu di atas'
                }
              >
                <Sparkles className="h-4 w-4" />
                <span>{isApplyingToMaster ? 'Menyimpan...' : 'Terapkan ke Stok Gudang'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Scientific Metrics, Meter & Roaster Strategy (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Density Results Display Card */}
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-white via-teal-50/20 to-white p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Hasil Pengukuran Kepadatan Sel (Density QC)
                </span>
                <h3 className="text-lg font-black text-zinc-900 mt-0.5">
                  {sampleName || 'Sampel Biji Kopi'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black shadow-2xs ${analysis.badgeClass}`}
                >
                  {analysis.code}
                </span>
                <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
                  {sampleType === 'green' ? 'Green Bean' : 'Roast Bean'}
                </span>
              </div>
            </div>

            {/* Huge Metrics Triple Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Primary: g/L */}
              <div className="rounded-xl border border-teal-300 bg-teal-50/70 p-4 text-center shadow-xs relative overflow-hidden">
                <div className="absolute top-1 right-2 text-[10px] font-mono text-teal-800 font-bold uppercase">
                  Standar SCA
                </div>
                <span className="text-xs font-semibold text-teal-900 block mb-1">
                  Densitas Kopi (g/L)
                </span>
                <div className="text-3xl sm:text-4xl font-black text-teal-950 font-mono tracking-tight">
                  {densityGPerL > 0 ? densityGPerL.toLocaleString('id-ID') : '0'}
                </div>
                <span className="text-[11px] text-teal-700 font-medium mt-1 block">
                  Gram per 1.000 mL (Liter)
                </span>
              </div>

              {/* Secondary: g/mL */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-center shadow-xs">
                <span className="text-xs font-semibold text-zinc-600 block mb-1">
                  Massa Jenis (g/mL)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">
                  {densityGPerMl > 0 ? densityGPerMl.toFixed(3) : '0.000'}
                </div>
                <span className="text-[11px] text-zinc-500 font-medium mt-1 block">
                  Gram per Milliliter
                </span>
              </div>

              {/* Secondary: kg/m3 */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-center shadow-xs">
                <span className="text-xs font-semibold text-zinc-600 block mb-1">
                  Volume Industri (kg/m³)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono tracking-tight">
                  {densityKgPerM3 > 0 ? densityKgPerM3.toLocaleString('id-ID') : '0'}
                </div>
                <span className="text-[11px] text-zinc-500 font-medium mt-1 block">
                  Kilogram per Meter Kubik
                </span>
              </div>
            </div>

            {/* Visual Density Gauge Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-teal-700" />
                  Grafik Klasifikasi Spektrum Densitas:
                </span>
                <span className="font-bold text-teal-900">{analysis.name}</span>
              </div>

              {sampleType === 'green' ? (
                /* Green Bean Spectrum */
                <div className="space-y-1">
                  <div className="relative h-6 w-full rounded-xl bg-zinc-100 overflow-hidden flex border border-zinc-300">
                    {/* Zones: <650 (15%), 650-700 (15%), 700-750 (20%), 750-800 (25%), >800 (25%) */}
                    <div
                      className="h-full bg-rose-400 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ width: '15%' }}
                      title="Sangat Rendah / Past Crop (<650 g/L)"
                    >
                      &lt;650
                    </div>
                    <div
                      className="h-full bg-orange-400 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ width: '20%' }}
                      title="Soft Bean (650-700 g/L)"
                    >
                      Soft (650-700)
                    </div>
                    <div
                      className="h-full bg-amber-400 flex items-center justify-center text-[9px] font-bold text-zinc-950"
                      style={{ width: '20%' }}
                      title="Medium (700-750 g/L)"
                    >
                      Medium (700-750)
                    </div>
                    <div
                      className="h-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ width: '22%' }}
                      title="Hard Bean / HB (750-800 g/L)"
                    >
                      HB (750-800)
                    </div>
                    <div
                      className="h-full bg-emerald-600 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ width: '23%' }}
                      title="Strictly Hard Bean / SHB (>800 g/L)"
                    >
                      SHB (&gt;800)
                    </div>

                    {/* Indicator needle */}
                    {densityGPerL > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-zinc-950 shadow-md transform -translate-x-1/2 ring-2 ring-white"
                        style={{
                          left: `${Math.min(
                            98,
                            Math.max(2, ((densityGPerL - 600) / (850 - 600)) * 100)
                          )}%`
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 px-1 font-mono">
                    <span>600 g/L</span>
                    <span>650</span>
                    <span>700</span>
                    <span>750</span>
                    <span>800</span>
                    <span>850+ g/L</span>
                  </div>
                </div>
              ) : (
                /* Roasted Bean Spectrum */
                <div className="space-y-1">
                  <div className="relative h-6 w-full rounded-xl bg-zinc-100 overflow-hidden flex border border-zinc-300">
                    <div
                      className="h-full bg-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-300"
                      style={{ width: '25%' }}
                      title="Very Dark (<310 g/L)"
                    >
                      Very Dark (&lt;310)
                    </div>
                    <div
                      className="h-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ width: '25%' }}
                      title="Dark Roast (310-350 g/L)"
                    >
                      Dark (310-350)
                    </div>
                    <div
                      className="h-full bg-amber-700 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ width: '25%' }}
                      title="Medium Roast (350-390 g/L)"
                    >
                      Medium (350-390)
                    </div>
                    <div
                      className="h-full bg-amber-500 flex items-center justify-center text-[9px] font-bold text-zinc-950"
                      style={{ width: '25%' }}
                      title="Light Roast (>390 g/L)"
                    >
                      Light (&gt;390)
                    </div>

                    {densityGPerL > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-zinc-950 shadow-md transform -translate-x-1/2 ring-2 ring-white"
                        style={{
                          left: `${Math.min(
                            98,
                            Math.max(2, ((densityGPerL - 280) / (440 - 280)) * 100)
                          )}%`
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 px-1 font-mono">
                    <span>280 g/L</span>
                    <span>310</span>
                    <span>350</span>
                    <span>390</span>
                    <span>440+ g/L</span>
                  </div>
                </div>
              )}
            </div>

            {/* Classification Summary Box */}
            <div className={`rounded-xl p-4 border ${analysis.borderClass} ${analysis.bgClass}`}>
              <div className="flex items-start gap-2.5">
                <Info className={`h-5 w-5 ${analysis.textColor} shrink-0 mt-0.5`} />
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">
                    Klasifikasi: {analysis.name}
                  </h4>
                  <p className="text-xs text-zinc-700 mt-1 leading-relaxed">
                    {analysis.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-zinc-600">
                    <span className="rounded bg-white/80 px-2 py-0.5 border border-zinc-200">
                      Ketinggian: <strong>{analysis.elevationRange}</strong>
                    </span>
                    {Number(moisturePercent) > 0 && (
                      <span className="rounded bg-white/80 px-2 py-0.5 border border-zinc-200">
                        Kadar Air: <strong>{moisturePercent}%</strong>
                      </span>
                    )}
                    {variety && (
                      <span className="rounded bg-white/80 px-2 py-0.5 border border-zinc-200">
                        Varietas: <strong>{variety}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Roasting Strategy Advisor Card (Crucial for Roast Master) */}
          <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    Rekomendasi Profil Roasting Berdasarkan Densitas Sel
                  </h3>
                  <span className="text-[11px] text-amber-800">
                    Panduan mesin sangrai (Diedrich / Probat / Toper / Artisan)
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded-full">
                SCA ROAST PROFILE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Charge Temp */}
              <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1">
                <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-600" />
                  Suhu Masuk Biji (Charge Temp):
                </span>
                <div className="font-mono font-black text-base text-zinc-900">
                  {analysis.chargeTemp}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Suhu drum saat biji dijatuhkan ke dalam roaster.
                </p>
              </div>

              {/* Target DTR */}
              <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1">
                <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                  Target DTR (Development Time Ratio):
                </span>
                <div className="font-mono font-black text-base text-zinc-900">
                  {analysis.dtrTarget}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Persentase waktu pasca First Crack hingga drop.
                </p>
              </div>

              {/* Initial Heat */}
              <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1">
                <span className="font-bold text-amber-900 block">Pemberian Daya Panas (Heat Input):</span>
                <p className="text-zinc-700 leading-relaxed">{analysis.initialHeat}</p>
              </div>

              {/* Airflow */}
              <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1">
                <span className="font-bold text-amber-900 block">Strategi Aliran Udara (Airflow):</span>
                <p className="text-zinc-700 leading-relaxed">{analysis.airflow}</p>
              </div>
            </div>

            {/* Risk Warnings */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs flex items-start gap-2 text-rose-900">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Perhatian Khusus Roaster: </strong>
                <span>{analysis.risks}</span>
              </div>
            </div>
          </div>

          {/* Warehouse Logistics & Silo Volume Estimator */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Estimator Volume Gudang, Silo & Karung GrainPro
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500">Gudang & Logistik</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex-1">
                <label className="block font-semibold text-zinc-700 mb-1">
                  Masukkan Total Stok Biji (kg):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={estimatorTotalKg === 0 || estimatorTotalKg === '' ? '' : estimatorTotalKg}
                    onChange={(e) => setEstimatorTotalKg(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full sm:w-48 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-1.5 font-mono font-bold text-sm text-zinc-900 focus:border-teal-600 focus:bg-white focus:outline-hidden"
                  />
                  <span className="font-bold text-zinc-600">Kilogram (kg)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[100, 500, 1000, 5000].map((quickKg) => (
                  <button
                    key={quickKg}
                    type="button"
                    onClick={() => setEstimatorTotalKg(quickKg)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                  >
                    {quickKg.toLocaleString('id-ID')} kg
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <span className="text-[11px] text-zinc-500 block mb-0.5">Volume Ruang</span>
                <span className="font-mono font-black text-base text-zinc-900">
                  {estimator.totalVolumeLiters.toLocaleString('id-ID')} L
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  ({estimator.totalVolumeM3} m³)
                </span>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <span className="text-[11px] text-emerald-800 block mb-0.5">Karung 60kg</span>
                <span className="font-mono font-black text-base text-emerald-950">
                  {estimator.grainPro60KgBags} karung
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">GrainPro 60 kg</span>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <span className="text-[11px] text-zinc-500 block mb-0.5">Karung 30kg</span>
                <span className="font-mono font-black text-base text-zinc-900">
                  {estimator.grainPro30KgBags} karung
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Pouch / Box 30 kg</span>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <span className="text-[11px] text-amber-800 block mb-0.5">Kebutuhan Palet</span>
                <span className="font-mono font-black text-base text-amber-950">
                  {estimator.palletsNeeded} palet
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Palet 1.2 x 1.0 m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test History Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-teal-700" />
              <span>Riwayat Pengujian Densitas Laboratorium ({testLogs.length})</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daftar sertifikat dan log pengukuran kepadatan biji kopi yang tersimpan di sistem
            </p>
          </div>

          {testLogs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Kosongkan Riwayat</span>
              </button>
            </div>
          )}
        </div>

        {testLogs.length === 0 ? (
          <div className="text-center py-10 bg-zinc-50/80 rounded-xl border border-dashed border-zinc-200">
            <Scale className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-600">Belum ada data pengujian yang dicatat.</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Gunakan formulir kalkulator di atas lalu klik tombol "Catat ke Riwayat Lab".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100/80 text-zinc-700 font-bold border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Waktu & Kode</th>
                  <th className="p-3">Nama Sampel & Lot</th>
                  <th className="p-3">Jenis & Varietas</th>
                  <th className="p-3">Volume & Massa</th>
                  <th className="p-3">Densitas (g/L)</th>
                  <th className="p-3">Klasifikasi SCA</th>
                  <th className="p-3">Petugas</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {testLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3 font-mono">
                      <div className="font-bold text-zinc-900">{log.id}</div>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(log.testedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-zinc-900">{log.beanName}</div>
                      <div className="font-mono text-[11px] text-amber-800">
                        Lot: {log.lotNumber || '-'}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          log.sampleType === 'green'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.sampleType === 'green' ? 'Green Bean' : 'Roast Bean'}
                      </span>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {log.variety || '-'} • {log.process || '-'}
                      </div>
                    </td>
                    <td className="p-3 font-mono">
                      <div>Net: {log.netWeightG.toFixed(1)} g</div>
                      <div className="text-[11px] text-zinc-500">Vol: {log.volumeMl} mL</div>
                    </td>
                    <td className="p-3 font-mono">
                      <span className="font-black text-sm text-teal-950">
                        {log.densityGPerL.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">g/L ({log.densityGPerMl} g/mL)</span>
                    </td>
                    <td className="p-3">
                      <span className="inline-block rounded-md bg-zinc-100 border border-zinc-200 px-2 py-1 font-semibold text-[11px] text-zinc-800">
                        {log.scaClassification}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-600">{log.testedBy}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteTestLog(log.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Log Uji Ini"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
