import React, { useState } from 'react';
import { QrCode, Search, CheckCircle2, AlertCircle, Package, MapPin, Droplets } from 'lucide-react';
import { Batch } from '../../types/erp';

interface BatchScannerModalProps {
  batches: Batch[];
  isOpen: boolean;
  onClose: () => void;
  onSelectBatch: (batch: Batch) => void;
}

export const BatchScannerModal: React.FC<BatchScannerModalProps> = ({
  batches,
  isOpen,
  onClose,
  onSelectBatch
}) => {
  const [scannedCode, setScannedCode] = useState('');
  const [detectedBatch, setDetectedBatch] = useState<Batch | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = (code: string) => {
    setScannedCode(code);
    const found = batches.find(
      (b) =>
        b.lotNumber.toLowerCase() === code.toLowerCase() ||
        b.qrCodeData.toLowerCase().includes(code.toLowerCase())
    );
    setDetectedBatch(found || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-bold text-zinc-900">Scanner Barcode & QR Gudang</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="mt-4 relative rounded-xl bg-zinc-950 p-6 text-center text-zinc-100 overflow-hidden border border-zinc-800">
          {/* Animated Laser line */}
          <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />

          <div className="mx-auto w-32 h-32 border-2 border-dashed border-amber-500/60 rounded-xl flex items-center justify-center relative">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
              ARAHKAN QR PALLET
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            Arahkan kamera ke label pallet atau pilih lot sampel di bawah untuk simulasi scan instan
          </p>
        </div>

        {/* Quick Sample Scan Buttons */}
        <div className="mt-4 space-y-2">
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider block">
            Uji Coba Cepat Scan Lot:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {batches.slice(0, 4).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSimulateScan(b.lotNumber)}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-mono font-semibold text-zinc-700 hover:bg-amber-50 hover:border-amber-300"
              >
                {b.lotNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Input Search */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => handleSimulateScan(e.target.value)}
              placeholder="Atau ketik nomor lot manual..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Scan Result */}
        {detectedBatch ? (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-amber-900">{detectedBatch.lotNumber}</span>
              <span className="rounded bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                LOT TERVERIFIKASI
              </span>
            </div>
            <div className="font-bold text-sm text-zinc-900">{detectedBatch.beanName}</div>
            <div className="grid grid-cols-2 gap-2 text-zinc-600 pt-1">
              <div>
                Sisa Stok: <strong>{detectedBatch.quantityRemainingKg} kg</strong>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3 text-blue-500" />
                MC: <strong>{detectedBatch.moistureContent}%</strong>
              </div>
              <div className="flex items-center gap-1 col-span-2">
                <MapPin className="h-3 w-3 text-zinc-400" />
                Lokasi: <strong>{detectedBatch.warehouseLocation}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectBatch(detectedBatch);
                onClose();
              }}
              className="mt-2 w-full rounded-lg bg-emerald-700 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Lihat Detail Batch Lengkap
            </button>
          </div>
        ) : scannedCode ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Nomor lot "{scannedCode}" tidak ditemukan di database gudang.</span>
          </div>
        ) : null}

        <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
