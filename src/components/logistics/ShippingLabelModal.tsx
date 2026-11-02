import React, { useState } from 'react';
import {
  Printer,
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  Calendar,
  AlertTriangle,
  X,
  FileText,
  Building2,
  Copy,
  Check,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Edit2
} from 'lucide-react';
import { Shipment, Order } from '../../types/erp';
import { formatIDR } from '../../services/dbService';
import { SPECIFIC_DESTINATION_PRESETS, DestinationPreset } from '../../data/indonesiaRegions';

interface ShippingLabelModalProps {
  shipment?: Shipment | null;
  order?: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  shipment,
  order,
  isOpen,
  onClose
}) => {
  const [templateType, setTemplateType] = useState<'label' | 'suratJalan'>('label');
  const [copied, setCopied] = useState(false);
  const [isCustomizingDetails, setIsCustomizingDetails] = useState(true);

  // Default Sender (Pengirim)
  const [senderName, setSenderName] = useState('KOFIARA HUB LHOKSEUMAWE');
  const [senderContact, setSenderContact] = useState('Tgk. Mansur (Kepala Gudang)');
  const [senderPhone, setSenderPhone] = useState('0812-6900-3344');
  const [senderAddress, setSenderAddress] = useState(
    'Jl. Merdeka No. 88, Mon Geudong, Kota Lhokseumawe, Aceh (Kode Pos 24352)'
  );

  // Recipient (Penerima)
  const defaultRecipientName = shipment?.customerName || order?.customerName || 'Pelanggan Kopi';
  const defaultRecipientPhone = shipment?.customerPhone || order?.customerPhone || '0812-XXXX-XXXX';
  const defaultRecipientAddress =
    order?.customerAddress ||
    shipment?.destinationRegion ||
    'Jl. Merdeka No. 45, Banda Aceh';
  const defaultIsland = shipment?.destinationIsland || order?.destinationIsland || 'Aceh (Lokal Loket)';

  const [recipientName, setRecipientName] = useState(defaultRecipientName);
  const [recipientPhone, setRecipientPhone] = useState(defaultRecipientPhone);
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipientAddress);
  const [recipientNotes, setRecipientNotes] = useState(
    shipment?.notes || order?.notes || 'Titip di loket tujuan, pengambilan dengan membawa KTP / resi.'
  );

  // Logistics & Expedisi Helper to avoid hardcoded L300 when order is Grab or internal
  const getInitialLogistics = () => {
    const rawMethod = shipment?.courierName || order?.shippingMethod || '';
    let vPlate = shipment?.vehiclePlate || '';
    let dInfo = shipment?.driverName
      ? `${shipment.driverName} (${shipment.driverPhone || '-'})`
      : '';
    let cName = shipment?.courierName || order?.shippingMethod || 'Loket Bus / L300 Aceh';
    let sType = shipment?.serviceType || 'Angkutan Antar Kota / Kargo';
    let lDest = shipment?.loketDestination || order?.customerAddress || 'Loket Terminal Batoh Banda Aceh';

    if (rawMethod.includes('GrabExpress') || rawMethod.includes('Grab')) {
      const match = rawMethod.match(/GrabExpress:\s*(.*?)\s*\((.*?)\s*-\s*(.*?)\)/i);
      vPlate = match ? match[2].trim() : 'Motor Driver Grab';
      dInfo = match ? `${match[1].trim()} (${match[3].trim()})` : 'Driver GrabExpress';
      cName = 'GrabExpress Instan (Lhokseumawe)';
      sType = 'Kurir Instan GrabExpress';
      lDest = order?.customerAddress || 'Pengantaran Langsung ke Alamat Pelanggan';
    } else if (
      rawMethod.includes('Antar Sendiri') ||
      rawMethod.includes('Kurir Roastery') ||
      rawMethod.includes('krew')
    ) {
      vPlate = 'BL 1024 LF (Armada Roastery Kofiara)';
      dInfo = 'Krew Gudang Kofiara (PIC: Tgk. Mansur)';
      cName = 'Kurir Roastery Kofiara Hub Lhokseumawe';
      sType = 'Pengantaran Internal Krew Gudang';
      lDest = order?.customerAddress || 'Pengantaran Langsung ke Alamat Pelanggan';
    } else if (rawMethod.includes('Ambil di Gudang') || rawMethod.includes('Pickup')) {
      vPlate = 'Diambil Sendiri oleh Pembeli';
      dInfo = 'Pembeli / Customer';
      cName = 'Ambil Sendiri di Gudang (Pickup Direct)';
      sType = 'Pickup Mandiri di Gudang';
      lDest = 'Kofiara Hub Lhokseumawe (Gudang Mon Geudong)';
    } else if (!vPlate) {
      vPlate = 'BL 1482 AB (L300 Aceh)';
      dInfo = 'Bang Irwan (0812-6900-1122)';
    }

    return { vPlate, dInfo, cName, sType, lDest };
  };

  const initialLogistics = getInitialLogistics();

  const defaultTracking =
    shipment?.trackingNumber ||
    `RESI-${order?.invoiceNumber?.replace('/', '-') || Math.floor(100000 + Math.random() * 900000)}`;

  const [trackingNumber, setTrackingNumber] = useState(defaultTracking);
  const [courierName, setCourierName] = useState(initialLogistics.cName);
  const [serviceType, setServiceType] = useState(initialLogistics.sType);
  const [loketDestination, setLoketDestination] = useState(initialLogistics.lDest);
  const [vehiclePlate, setVehiclePlate] = useState(initialLogistics.vPlate);
  const [driverInfo, setDriverInfo] = useState(initialLogistics.dInfo);

  // Cargo Info
  const defaultWeight = shipment?.weightKg || order?.totalWeightKg || 25;
  const [weightKg, setWeightKg] = useState<number>(defaultWeight);
  const [packageCount, setPackageCount] = useState<number>(1);
  const [contentsDesc, setContentsDesc] = useState<string>(
    order?.items
      ? order.items.map((i) => `${i.beanName} (${i.quantityKg}kg)`).join(', ')
      : 'Biji Kopi Sangrai & Biji Kopi Mentah Specialty'
  );

  // Sync when prop updates & read warehouse head from local cache
  React.useEffect(() => {
    let currentWhContact = 'Tgk. Mansur (Kepala Gudang)';
    let currentWhPhone = '0812-6900-3344';
    try {
      const whCached = localStorage.getItem('kopiflow_erp_warehouse_head');
      if (whCached) {
        const whList = JSON.parse(whCached);
        if (whList && whList.length > 0) {
          currentWhContact = `${whList[0].name} (Kepala Gudang)`;
          currentWhPhone = whList[0].phone;
          setSenderContact(currentWhContact);
          setSenderPhone(currentWhPhone);
        }
      }
    } catch {
      // fallback
    }

    if (shipment) {
      setRecipientName(shipment.customerName);
      setRecipientPhone(shipment.customerPhone);
      setRecipientAddress(shipment.destinationRegion);
      setTrackingNumber(shipment.trackingNumber);
      setCourierName(shipment.courierName);
      setServiceType(shipment.serviceType);
      setLoketDestination(shipment.loketDestination || shipment.destinationRegion);
      setVehiclePlate(shipment.vehiclePlate || 'BL 1482 AB');
      setDriverInfo(
        shipment.driverName
          ? `${shipment.driverName} (${shipment.driverPhone || '-'})`
          : 'Bang Irwan (0812-6900-1122)'
      );
      setWeightKg(shipment.weightKg);
      if (shipment.notes) setRecipientNotes(shipment.notes);
    } else if (order) {
      setRecipientName(order.customerName);
      setRecipientPhone(order.customerPhone);
      setRecipientAddress(order.customerAddress);
      setTrackingNumber(`RESI-${order.invoiceNumber.replace('/', '-')}`);
      setWeightKg(order.totalWeightKg);

      const rawMethod = order.shippingMethod || '';
      if (rawMethod.includes('GrabExpress') || rawMethod.includes('Grab')) {
        setCourierName('GrabExpress Instan (Lhokseumawe)');
        setServiceType('Kurir Instan GrabExpress');
        setLoketDestination(order.customerAddress || 'Pengantaran Langsung ke Alamat Pelanggan');

        // Regex to extract driver name, vehicle plate, and phone:
        // Format: "GrabExpress: Rudi Kurniawan (BL 4920 LA - 0822-7711-9988)"
        const match = rawMethod.match(/GrabExpress:\s*(.*?)\s*\((.*?)\s*-\s*(.*?)\)/i);
        if (match) {
          const dName = match[1].trim();
          const vPlate = match[2].trim();
          const dPhone = match[3].trim();
          setDriverInfo(`${dName} (${dPhone})`);
          setVehiclePlate(vPlate || 'Motor Driver Grab');
        } else {
          setDriverInfo(rawMethod);
          setVehiclePlate('Motor Driver Grab');
        }
      } else if (
        rawMethod.includes('Antar Sendiri') ||
        rawMethod.includes('Kurir Roastery') ||
        rawMethod.includes('krew')
      ) {
        setCourierName('Kurir Roastery Kofiara Hub Lhokseumawe');
        setServiceType('Pengantaran Internal Krew Gudang');
        setLoketDestination(order.customerAddress || 'Pengantaran Langsung ke Alamat Pelanggan');
        setVehiclePlate('BL 1024 LF (Armada Roastery Kofiara)');
        setDriverInfo(`Krew Gudang Kofiara (PIC: ${currentWhContact})`);
      } else if (rawMethod.includes('Ambil di Gudang') || rawMethod.includes('Pickup')) {
        setCourierName('Ambil Sendiri di Gudang (Pickup Direct)');
        setServiceType('Pickup Mandiri di Gudang');
        setLoketDestination('Kofiara Hub Lhokseumawe (Gudang Mon Geudong)');
        setVehiclePlate('Diambil Sendiri oleh Pembeli');
        setDriverInfo('Pembeli / Customer');
      } else if (rawMethod.includes('Loket Bus / L300') || rawMethod.includes('Loket')) {
        setCourierName(rawMethod);
        setServiceType('Angkutan Antar Kota Loket Bus / L300');
        setLoketDestination(order.customerAddress || 'Loket Terminal Batoh Banda Aceh');
        setVehiclePlate('BL 1482 AB (L300 Putih Sinar Gayo)');
        setDriverInfo('Supir Loket Bus / L300');
      } else {
        // Ekspedisi kargo / JNT / JNE / Lion / Indah Cargo
        setCourierName(rawMethod || 'Ekspedisi Kargo Antarpulau');
        setServiceType('Ekspedisi Kargo');
        setLoketDestination(order.customerAddress || 'Alamat Tujuan');
        setVehiclePlate('Armada Ekspedisi Kargo');
        setDriverInfo('Kurir Ekspedisi');
      }

      if (order.items && order.items.length > 0) {
        setContentsDesc(order.items.map((i) => `${i.beanName} (${i.quantityKg}kg)`).join(', '));
      }
      if (order.notes) setRecipientNotes(order.notes);
    }
  }, [shipment, order]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyAddressText = () => {
    const text = `*PENGIRIM:*\n${senderName}\nTelp: ${senderPhone}\nAlamat: ${senderAddress}\n\n*PENERIMA:*\n${recipientName} (${recipientPhone})\nAlamat: ${recipientAddress}\nDestinasi/Loket: ${loketDestination}\n\n*EKSPEDISI & RESI:*\n${courierName} - ${trackingNumber}\nSupir/Plat: ${driverInfo} / ${vehiclePlate}\nBerat: ${weightKg} kg (${packageCount} Koli)\nIsi: ${contentsDesc}\nCatatan: ${recipientNotes}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-2xl my-auto print:border-none print:shadow-none print:my-0 print:w-full print:max-w-none">
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 print:hidden bg-zinc-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-900">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Template Cetak Pengiriman & Surat Jalan
              </h3>
              <p className="text-xs text-zinc-500">
                Format siap tempel di karung / kardus kargo dan arsip surat jalan ekspedisi loket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Template Tabs - Hidden on Print */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-zinc-200 bg-white print:hidden">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTemplateType('label')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                templateType === 'label'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Label Tempel Paket / Karung (A5 / Thermal)</span>
            </button>
            <button
              onClick={() => setTemplateType('suratJalan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                templateType === 'suratJalan'
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Surat Jalan Resmi & Bukti Serah Terima (A4)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={copyAddressText}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
              title="Salin rincian alamat lengkap ke clipboard untuk dikirim lewat chat WhatsApp"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks Alamat (WA)'}</span>
            </button>
          </div>
        </div>

        {/* Region Destination Quick-Apply Toolbar - Hidden on Print */}
        <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-200/80 flex flex-wrap items-center gap-3 text-xs print:hidden">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <MapPin className="h-4 w-4 text-amber-700" />
            <span>Preset Daerah Tujuan:</span>
          </div>

          <select
            onChange={(e) => {
              const preset = SPECIFIC_DESTINATION_PRESETS.find((p) => p.id === e.target.value);
              if (preset) {
                const dist = preset.districtList?.[0] || '';
                const fullAdd = `${dist ? dist + ', ' : ''}${preset.cityRegency}, Prov. ${preset.province}`;
                setRecipientAddress(fullAdd);
                setLoketDestination(preset.defaultHubLoket);
              }
            }}
            defaultValue=""
            className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs text-zinc-900 font-medium focus:border-amber-600 focus:outline-hidden"
          >
            <option value="" disabled>
              -- Ubah Alamat Tujuan ke Daerah Spesifik --
            </option>
            {SPECIFIC_DESTINATION_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.province}] {p.cityRegency} ({p.districtList?.[0] || 'Umum'})
              </option>
            ))}
          </select>
          <span className="text-[11px] text-amber-800 italic">
            (Pilih daerah di atas untuk mengisi alamat & loket tujuan secara otomatis)
          </span>
        </div>

        {/* Quick Edit Bar for Delivery Details & Notes - Hidden on Print */}
        <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 print:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-700" />
              <span className="font-bold text-xs text-zinc-900">
                Sesuaikan Rincian Label, Catatan, Armada & Driver
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                Live Edit (Otomatis Update ke Label & Surat Jalan)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizingDetails(!isCustomizingDetails)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
            >
              <span>{isCustomizingDetails ? 'Sembunyikan Form Edit' : 'Buka Form Edit'}</span>
              {isCustomizingDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {isCustomizingDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
              {/* Field 1: Catatan Pengiriman (Bisa Diubah) */}
              <div className="lg:col-span-2 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="font-bold text-zinc-700 text-[11px] flex items-center gap-1">
                    <Edit2 className="h-3 w-3 text-amber-700" />
                    <span>Catatan Khusus Pengiriman (Bisa Diubah Langsung):</span>
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRecipientNotes('Titip di loket tujuan, pengambilan dengan membawa KTP & resi.')}
                      className="text-[9px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600 hover:bg-zinc-100 font-medium"
                    >
                      + Titip Loket
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientNotes('Hubungi penerima via WA/telepon saat driver sudah dekat / di lokasi.')}
                      className="text-[9px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600 hover:bg-zinc-100 font-medium"
                    >
                      + Hubungi Penerima
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientNotes('Kopi fresh roast, jangan dibanting & jauhkan dari air hujan.')}
                      className="text-[9px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600 hover:bg-zinc-100 font-medium"
                    >
                      + Fragile Kopi
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={recipientNotes}
                  onChange={(e) => setRecipientNotes(e.target.value)}
                  placeholder="Ketik catatan pengiriman di sini..."
                  className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 font-medium focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              {/* Field 2: Armada / Plat Kendaraan */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-700 text-[11px]">Mobil / Plat Armada:</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setVehiclePlate('Motor Driver Grab')}
                      className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold"
                    >
                      Grab
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehiclePlate('BL 1024 LF (Kofiara Roastery)')}
                      className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold"
                    >
                      Krew Kofiara
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="cth: BL 4920 LA / BL 1024 LF"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              {/* Field 3: Supir / Driver / Kurir */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-700 text-[11px]">Supir / Driver / Kurir:</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDriverInfo(`Krew Gudang Kofiara (PIC: ${senderContact})`)}
                      className="text-[9px] bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-bold"
                    >
                      Krew Gudang
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={driverInfo}
                  onChange={(e) => setDriverInfo(e.target.value)}
                  placeholder="cth: Rudi Kurniawan (0822-...) / Krew Gudang"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 font-medium focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              {/* Field 4: Loket / Titik Pengambilan */}
              <div className="lg:col-span-2 space-y-1">
                <label className="font-bold text-zinc-700 text-[11px]">
                  Loket / Pool / Titik Pengambilan:
                </label>
                <input
                  type="text"
                  value={loketDestination}
                  onChange={(e) => setLoketDestination(e.target.value)}
                  placeholder="cth: Loket Terminal Batoh / Diantar Langsung ke Alamat"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 font-medium focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              {/* Field 5: No Resi / Manifest */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 text-[11px]">No. Resi / Manifest:</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="RESI-12345"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                />
              </div>

              {/* Field 6: Nama Ekspedisi / Kurir */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 text-[11px]">Nama Ekspedisi / Kurir:</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="GrabExpress / Loket Sinar Gayo"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 font-medium focus:border-amber-600 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-6 bg-zinc-100/60 print:bg-white print:p-0">
          {/* ===================== TEMPLATE 1: LABEL TEMPEL PAKET (STICKER / KARDUS) ===================== */}
          {templateType === 'label' && (
            <div className="max-w-2xl mx-auto bg-white border-2 border-zinc-900 rounded-xl p-5 shadow-sm print:border-2 print:border-black print:rounded-none print:shadow-none print:max-w-full text-zinc-900 font-sans">
              {/* Header Box: Courier & Barcode */}
              <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-900 text-white font-black text-xs px-2 py-0.5 rounded uppercase tracking-wider print:bg-black print:text-white">
                      LABEL PENGIRIMAN
                    </span>
                    <span className="font-extrabold text-sm text-amber-900">
                      {courierName}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5 font-medium">
                    Layanan: <strong>{serviceType}</strong> • Wilayah: <strong>{defaultIsland}</strong>
                  </p>
                </div>

                {/* Tracking & Resi Barcode */}
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">
                    Nomor Resi / Bukti Titip
                  </span>
                  <div className="font-mono text-base font-black tracking-widest text-zinc-950">
                    {trackingNumber}
                  </div>
                  {/* CSS Barcode Mock */}
                  <div className="flex items-center justify-end gap-[2px] h-6 mt-1">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3].map(
                      (w, i) => (
                        <div
                          key={i}
                          className="bg-black h-full"
                          style={{ width: `${w}px` }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Grid: Pengirim & Penerima */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b-2 border-zinc-900">
                {/* Penerima Box */}
                <div className="bg-zinc-50 print:bg-transparent p-3 rounded-lg border border-zinc-300 print:border-black">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-700 mb-1">
                    <User className="h-3 w-3" />
                    <span>KEPADA (PENERIMA):</span>
                  </div>
                  <div className="text-sm font-extrabold text-zinc-950">
                    {recipientName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 mt-0.5">
                    <Phone className="h-3 w-3 text-zinc-600" />
                    <span>{recipientPhone}</span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-800 leading-snug">
                    <span className="font-bold text-zinc-500 text-[10px] uppercase block">
                      Alamat Lengkap Tujuan:
                    </span>
                    <p className="font-medium whitespace-pre-wrap">{recipientAddress}</p>
                  </div>
                  {loketDestination && (
                    <div className="mt-2 pt-1.5 border-t border-dashed border-zinc-300 print:border-black text-xs">
                      <span className="text-[10px] font-bold text-amber-800 block uppercase">
                        Loket / Pool Pengambilan:
                      </span>
                      <strong className="text-zinc-950 block">{loketDestination}</strong>
                    </div>
                  )}
                </div>

                {/* Pengirim Box */}
                <div className="p-3 rounded-lg border border-zinc-200 print:border-black text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                      <Building2 className="h-3 w-3" />
                      <span>DARI (PENGIRIM):</span>
                    </div>
                    <div className="font-extrabold text-xs text-zinc-950">
                      {senderName}
                    </div>
                    <div className="text-[11px] font-bold text-zinc-700 mt-0.5">
                      PIC: {senderContact} • WA: {senderPhone}
                    </div>
                    <p className="mt-1.5 text-[11px] text-zinc-600 leading-tight">
                      {senderAddress}
                    </p>
                  </div>

                  {/* Supir & Kendaraan (Khusus Loket) */}
                  <div className="mt-3 pt-2 border-t border-zinc-200 print:border-black text-[11px] bg-zinc-50/50 print:bg-transparent p-1.5 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-semibold">Mobil / Armada:</span>
                      <strong className="font-mono">{vehiclePlate}</strong>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-zinc-500 font-semibold">Supir / Driver:</span>
                      <span>{driverInfo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Muatan & Berat */}
              <div className="grid grid-cols-3 gap-2 py-2.5 border-b-2 border-zinc-900 text-center text-xs">
                <div className="border-r border-zinc-200 print:border-black pr-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total Berat</span>
                  <strong className="text-sm font-black font-mono text-zinc-950">{weightKg} Kg</strong>
                </div>
                <div className="border-r border-zinc-200 print:border-black px-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Jumlah Koli/Karung</span>
                  <strong className="text-sm font-black font-mono text-zinc-950">{packageCount} Koli</strong>
                </div>
                <div className="pl-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Ref. Faktur</span>
                  <strong className="text-xs font-bold font-mono text-amber-900">
                    {order?.invoiceNumber || shipment?.invoiceNumber || 'INV-DIRECT'}
                  </strong>
                </div>
              </div>

              {/* Isi Paket & Catatan */}
              <div className="py-2.5 border-b-2 border-zinc-900 text-xs">
                <div className="flex items-start gap-1">
                  <span className="font-bold text-zinc-500 text-[10px] uppercase shrink-0 w-20">
                    Isi Kiriman:
                  </span>
                  <span className="font-medium text-zinc-900">{contentsDesc}</span>
                </div>
                {recipientNotes && (
                  <div className="flex items-start gap-1 mt-1">
                    <span className="font-bold text-zinc-500 text-[10px] uppercase shrink-0 w-20">
                      Catatan:
                    </span>
                    <span className="italic text-zinc-700">{recipientNotes}</span>
                  </div>
                )}
              </div>

              {/* Warning Box Banner */}
              <div className="mt-3 bg-amber-50 print:bg-transparent border border-amber-300 print:border-black rounded-lg p-2.5 flex items-center justify-between gap-3 text-zinc-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 print:text-black" />
                  <div className="text-[11px] leading-tight">
                    <strong className="font-extrabold uppercase tracking-wide block text-amber-950 print:text-black">
                      PERHATIAN: BIJI KOPI SEGAR (FRAGILE)
                    </strong>
                    <span className="text-zinc-600 print:text-black">
                      Hindarkan dari air/hujan & benda berbau tajam. Jangan dibanting!
                    </span>
                  </div>
                </div>
                <div className="text-[9px] text-right font-mono text-zinc-400 print:text-black shrink-0">
                  Tgl Cetak: {new Date().toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>
          )}

          {/* ===================== TEMPLATE 2: SURAT JALAN & BUKTI SERAH TERIMA (A4 RESMI) ===================== */}
          {templateType === 'suratJalan' && (
            <div className="max-w-3xl mx-auto bg-white border border-zinc-300 p-8 rounded-xl shadow-sm print:border-none print:shadow-none print:p-0 text-zinc-900 font-sans">
              {/* Header Surat Jalan */}
              <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-wider text-amber-950 uppercase">
                    {senderName}
                  </h2>
                  <p className="text-xs text-zinc-600 max-w-md mt-0.5 leading-snug">
                    {senderAddress}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Telp / WhatsApp: <strong>{senderPhone}</strong> | PIC: <strong>{senderContact}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-zinc-900 text-white font-extrabold px-3 py-1 rounded text-xs uppercase tracking-wider print:bg-black">
                    SURAT JALAN KARGO
                  </div>
                  <div className="font-mono text-sm font-black text-zinc-950 mt-1">
                    NO: SJ-{trackingNumber}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Tanggal: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Data Pengiriman & Penerima */}
              <div className="grid grid-cols-2 gap-6 my-5 text-xs">
                {/* Kolom Tujuan */}
                <div className="border border-zinc-300 rounded-lg p-3.5 bg-zinc-50 print:bg-transparent">
                  <span className="font-black text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                    Tujuan Pengiriman / Penerima:
                  </span>
                  <div className="font-black text-sm text-zinc-950">{recipientName}</div>
                  <div className="text-zinc-700 font-semibold mt-0.5">No. Telepon: {recipientPhone}</div>
                  <div className="mt-2 text-zinc-700">
                    <span className="font-bold text-zinc-500 text-[10px] uppercase block">Alamat Tujuan:</span>
                    <p className="mt-0.5 leading-relaxed">{recipientAddress}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-200 text-zinc-800">
                    <span className="font-bold text-zinc-500 text-[10px] uppercase block">Loket / Terminal Tujuan:</span>
                    <strong>{loketDestination}</strong> ({defaultIsland})
                  </div>
                </div>

                {/* Kolom Armada / Loket */}
                <div className="border border-zinc-300 rounded-lg p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="font-black text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                      Informasi Ekspedisi / Loket:
                    </span>
                    <div className="font-bold text-xs text-zinc-950">{courierName}</div>
                    <div className="text-zinc-600 mt-0.5">Layanan: {serviceType}</div>
                    <div className="text-zinc-600">No. Resi / Manifest: <strong className="font-mono text-zinc-950">{trackingNumber}</strong></div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-200">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Armada / Plat Mobil</span>
                        <strong className="font-mono text-zinc-950">{vehiclePlate}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Nama Supir / Kontak</span>
                        <strong className="text-zinc-950">{driverInfo}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabel Barang yang Dikirim */}
              <div className="my-4">
                <table className="w-full text-left text-xs border border-zinc-300 border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 print:bg-zinc-200 border-b border-zinc-300 font-bold text-zinc-700 uppercase text-[10px]">
                      <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-10">No</th>
                      <th className="py-2.5 px-3 border-r border-zinc-300">Deskripsi Barang & Varietas Kopi</th>
                      <th className="py-2.5 px-3 border-r border-zinc-300 text-center w-28">Kemasan / Koli</th>
                      <th className="py-2.5 px-3 text-right w-28">Berat Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {order?.items && order.items.length > 0 ? (
                      order.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">{idx + 1}</td>
                          <td className="py-2.5 px-3 border-r border-zinc-200">
                            <span className="font-bold text-zinc-950">{it.beanName}</span>
                            <span className="text-zinc-500 block text-[11px]">Kategori: {it.type} ({it.tierUsed})</span>
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-zinc-200">
                            {packageCount} Karung / Box
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">
                            {it.quantityKg} Kg
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">1</td>
                        <td className="py-2.5 px-3 border-r border-zinc-200">
                          <span className="font-bold text-zinc-950">{contentsDesc}</span>
                          <span className="text-zinc-500 block text-[11px]">Batch Kopi Standar Quality Control</span>
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-zinc-200">
                          {packageCount} Karung / Box
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">
                          {weightKg} Kg
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-zinc-900 font-extrabold bg-zinc-50 print:bg-transparent">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[10px] tracking-wider text-zinc-600">
                        Total Berat Keseluruhan:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-zinc-950">
                        {weightKg} Kg
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Catatan Penting */}
              <div className="text-[11px] text-zinc-600 bg-zinc-50 print:bg-transparent p-3 rounded-lg border border-zinc-200 my-4 leading-relaxed">
                <strong>Catatan Pengiriman:</strong> {recipientNotes}
                <br />
                <em>Barang telah diperiksa dalam kondisi baik, tersegel rapi, dan bebas dari cacat saat diserahkan ke pihak ekspedisi / pengemudi.</em>
              </div>

              {/* Tanda Tangan 3 Pihak */}
              <div className="grid grid-cols-3 gap-4 pt-4 mt-6 text-center text-xs">
                <div>
                  <span className="text-zinc-500 block uppercase text-[10px] font-bold">Diserahkan Oleh (Gudang):</span>
                  <div className="h-16 flex items-end justify-center">
                    <span className="border-b border-zinc-900 w-36 pb-0.5 font-bold text-zinc-950">{senderContact}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1">Stempel & Tanda Tangan</span>
                </div>

                <div>
                  <span className="text-zinc-500 block uppercase text-[10px] font-bold">Yang Membawa (Supir / Kurir):</span>
                  <div className="h-16 flex items-end justify-center">
                    <span className="border-b border-zinc-900 w-36 pb-0.5 font-bold text-zinc-950">
                      {driverInfo.split(' ')[0] || 'Pengemudi'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1">Tanda Tangan & No. HP</span>
                </div>

                <div>
                  <span className="text-zinc-500 block uppercase text-[10px] font-bold">Diterima Oleh (Pemesan / Loket):</span>
                  <div className="h-16 flex items-end justify-center">
                    <span className="border-b border-zinc-900 w-36 pb-0.5 font-bold text-zinc-950">
                      {recipientName.split(' ')[0] || 'Penerima'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1">Nama Jelas & Tgl Terima</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Form edit helper - Hidden on Print */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 rounded-b-2xl print:hidden flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Format telah disesuaikan otomatis dengan standar printer thermal / kertas A4.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
