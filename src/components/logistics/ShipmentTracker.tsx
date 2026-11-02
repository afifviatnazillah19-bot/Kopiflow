import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Ship,
  MapPin,
  Calendar,
  MessageCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Anchor,
  Navigation,
  Printer
} from 'lucide-react';
import { Shipment, Order, IslandRegion, ShipmentStatus } from '../../types/erp';
import { formatIDR, saveShipment, updateShipmentStatus, buildWhatsAppLink, saveNotificationLog } from '../../services/dbService';
import { ShippingLabelModal } from './ShippingLabelModal';
import { SPECIFIC_DESTINATION_PRESETS, DestinationPreset } from '../../data/indonesiaRegions';

interface ShipmentTrackerProps {
  shipments: Shipment[];
  orders: Order[];
  onRefresh: () => void;
}

export const ShipmentTracker: React.FC<ShipmentTrackerProps> = ({
  shipments,
  orders,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [islandFilter, setIslandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
  const [selectedShipmentForUpdate, setSelectedShipmentForUpdate] = useState<Shipment | null>(null);
  const [selectedShipmentForLabel, setSelectedShipmentForLabel] = useState<Shipment | null>(null);

  // New Shipment form
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [trackingNumber, setTrackingNumber] = useState<string>(
    `LOKET-AC-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [courierName, setCourierName] = useState<string>('Loket CV. Mentari Kargo L300 Gayo');
  const [serviceType, setServiceType] = useState<string>('Mobil L300 Angkutan Barang Antar Kota Aceh');
  const [destinationRegion, setDestinationRegion] = useState<string>('Banda Aceh (Loket Batoh)');
  const [destinationIsland, setDestinationIsland] = useState<IslandRegion>('Aceh (Lokal Loket)');
  const [weightKg, setWeightKg] = useState<number>(60);
  const [shippingCost, setShippingCost] = useState<number>(45000);
  const [driverName, setDriverName] = useState<string>('Bang Irwan');
  const [driverPhone, setDriverPhone] = useState<string>('0812-6900-1122');
  const [vehiclePlate, setVehiclePlate] = useState<string>('BL 1482 AB (L300 Putih)');
  const [loketOrigin, setLoketOrigin] = useState<string>('Loket Terminal Paya Ilang Takengon');
  const [loketDestination, setLoketDestination] = useState<string>('Loket Batoh Banda Aceh');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('aceh-banda-aceh');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('Titip di loket tujuan, pengambilan dengan menunjukkan nomor resi.');

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setDestinationIsland(ord.destinationIsland);
      setWeightKg(ord.totalWeightKg);
      setShippingCost(ord.shippingCost);
      setDestinationRegion(`${ord.customerAddress} (${ord.destinationIsland})`);

      if (ord.destinationIsland === 'Aceh (Lokal Loket)' || ord.customerAddress.toLowerCase().includes('aceh')) {
        setCourierName('Loket CV. Mentari Kargo L300 Gayo');
        setServiceType('L300 Antar Kota Aceh');
        setTrackingNumber(`LOKET-AC-${Math.floor(10000 + Math.random() * 90000)}`);
      } else if (ord.destinationIsland !== 'Jawa') {
        setCourierName('Indah Logistik Kargo Antar Pulau');
        setServiceType('Sea Freight Kontainer Port-to-Door');
      } else {
        setCourierName('JNE Trucking (JTR)');
        setServiceType('Land Freight Express');
      }
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const ord = orders.find((o) => o.id === selectedOrderId);

    const isAceh = destinationIsland === 'Aceh (Lokal Loket)' || courierName.includes('Loket');
    const initialStatus: ShipmentStatus = isAceh ? 'In Transit (Loket Aceh)' : 'In Transit (Laut/Udara)';

    const newShipment: Shipment = {
      id: `shp-${Date.now().toString(36)}`,
      trackingNumber,
      orderId: selectedOrderId,
      invoiceNumber: ord ? ord.invoiceNumber : 'INV/DIRECT',
      customerName: ord ? ord.customerName : 'Pelanggan KopiFlow',
      customerPhone: ord ? ord.customerPhone : '6281234567890',
      courierName,
      serviceType,
      destinationRegion,
      destinationIsland,
      weightKg: Number(weightKg),
      shippingCost: Number(shippingCost),
      status: initialStatus,
      driverName,
      driverPhone,
      vehiclePlate,
      loketOrigin,
      loketDestination,
      dispatchedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      estimatedDelivery,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Tutup menu modal seketika
    setIsNewShipmentModalOpen(false);

    await saveShipment(newShipment);

    // Save notification
    if (ord) {
      const msg = isAceh
        ? `Halo ${ord.customerName}, kopi pesanan Anda telah dititipkan di ${courierName} (Supir: ${driverName} / ${driverPhone}, Plat: ${vehiclePlate}). Siap diambil di ${loketDestination}. Resi: ${trackingNumber}.`
        : `Halo ${ord.customerName}, kargo kopi pesanan Anda (${ord.invoiceNumber}) telah diberangkatkan via ${courierName} dengan No. Resi: ${trackingNumber}. Estimasi tiba: ${estimatedDelivery}.`;

      await saveNotificationLog({
        id: `notif-${Date.now().toString(36)}`,
        channel: 'WhatsApp',
        recipient: ord.customerPhone,
        subject: `Update Pengiriman & No. Resi ${trackingNumber}`,
        messagePreview: msg,
        type: 'Shipment Dispatched',
        status: 'Sent',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdAt: new Date().toISOString()
      });
    }

    onRefresh();
  };

  const handleStatusUpdate = async (status: ShipmentStatus) => {
    if (!selectedShipmentForUpdate) return;
    const shipmentToUpdate = selectedShipmentForUpdate;
    // Tutup menu modal seketika
    setSelectedShipmentForUpdate(null);

    const deliveredAt =
      status === 'Delivered'
        ? new Date().toISOString().replace('T', ' ').slice(0, 16)
        : undefined;
    await updateShipmentStatus(shipmentToUpdate.id, status, deliveredAt);

    if (status === 'Delivered') {
      await saveNotificationLog({
        id: `notif-${Date.now().toString(36)}`,
        channel: 'WhatsApp',
        recipient: shipmentToUpdate.customerPhone,
        subject: `Konfirmasi Paket Diterima (${shipmentToUpdate.trackingNumber})`,
        messagePreview: `Paket kopi ${shipmentToUpdate.invoiceNumber} telah berhasil diterima di tujuan ${shipmentToUpdate.destinationRegion}. Terima kasih atas pesanan Anda.`,
        type: 'Delivery Confirmed',
        status: 'Sent',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdAt: new Date().toISOString()
      });
    }

    onRefresh();
  };

  const handleSendWhatsAppTracking = (s: Shipment) => {
    const isLoket = s.courierName.includes('Loket') || s.destinationIsland === 'Aceh (Lokal Loket)';

    const text = isLoket
      ? `*SURAT JALAN & RESI LOKET ACEH - KOPIFLOW*\n\n` +
        `No. Resi Loket: *${s.trackingNumber}*\n` +
        `Penerima: *${s.customerName}*\n` +
        `Ekspedisi: *${s.courierName}*\n` +
        `Loket Asal: ${s.loketOrigin || 'Loket Takengon'}\n` +
        `Loket Tujuan: *${s.loketDestination || s.destinationRegion}*\n` +
        `Mobil Angkutan: *${s.vehiclePlate || 'L300'}*\n` +
        `Supir / No. HP: *${s.driverName || '-'} (${s.driverPhone || '-'})*\n` +
        `Berat Muatan: *${s.weightKg} kg*\n` +
        `Ongkos Titip: ${formatIDR(s.shippingCost)}\n` +
        `Status: *${s.status}*\n\n` +
        `Catatan: ${s.notes || 'Pengambilan di loket tujuan dengan menunjukkan nomor resi ini.'}\n\n` +
        `Terima kasih telah mempercayakan pengiriman pada kami!`
      : `*UPDATE PELACAKAN KARGO KOPIFLOW*\n\n` +
        `No. Resi: *${s.trackingNumber}*\n` +
        `Faktur: *${s.invoiceNumber}*\n` +
        `Penerima: *${s.customerName}*\n` +
        `Ekspedisi: *${s.courierName}*\n` +
        `Destinasi: *${s.destinationRegion}* (${s.destinationIsland})\n` +
        `Berat Total: *${s.weightKg} kg*\n` +
        `Status: *${s.status}*\n` +
        `Estimasi Tiba: *${s.estimatedDelivery}*\n\n` +
        `Terima kasih!`;

    const url = buildWhatsAppLink(s.customerPhone, text);
    window.open(url, '_blank');
  };

  const filteredShipments = shipments.filter((s) => {
    const matchSearch =
      s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.courierName.toLowerCase().includes(search.toLowerCase()) ||
      s.destinationRegion.toLowerCase().includes(search.toLowerCase());
    const matchIsland = islandFilter === 'all' || s.destinationIsland === islandFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchIsland && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Dispatch Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. resi, tujuan, loket..."
              className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Island / Loket Filter */}
          <select
            value={islandFilter}
            onChange={(e) => setIslandFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">Semua Destinasi & Loket</option>
            <option value="Aceh (Lokal Loket)">Aceh (Lokal Loket L300/HiAce)</option>
            <option value="Jawa">Pulau Jawa</option>
            <option value="Sumatera">Pulau Sumatera</option>
            <option value="Kalimantan">Pulau Kalimantan</option>
            <option value="Sulawesi">Pulau Sulawesi</option>
            <option value="Bali & Nusa Tenggara">Bali & Nusa Tenggara</option>
            <option value="Maluku & Papua">Maluku & Papua</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="In Transit (Loket Aceh)">In Transit (Loket Aceh)</option>
            <option value="In Transit (Laut/Udara)">In Transit (Laut/Udara)</option>
            <option value="Manifested">Manifested</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered (Selesai)</option>
          </select>
        </div>

        <button
          onClick={() => {
            setTrackingNumber(`LOKET-AC-${Math.floor(10000 + Math.random() * 90000)}`);
            setIsNewShipmentModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-orange-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>+ Dispatch Loket / Kargo Baru</span>
        </button>
      </div>

      {/* Shipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShipments.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400">
            Belum ada pengiriman kargo atau loket yang dicatat. Klik "+ Dispatch Loket / Kargo Baru" untuk menguji pengiriman lokal via loket Aceh.
          </div>
        ) : (
          filteredShipments.map((s) => {
            const isAcehLoket =
              s.courierName.includes('Loket') || s.destinationIsland === 'Aceh (Lokal Loket)';

            return (
              <div
                key={s.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-blue-900">
                        {s.trackingNumber}
                      </span>
                      {isAcehLoket ? (
                        <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-800">
                          <Truck className="h-3 w-3" />
                          <span>Loket Angkutan Aceh</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          <Anchor className="h-3 w-3" />
                          <span>Kargo Antarpulau</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-zinc-900 mt-1">
                      {s.customerName} ({s.invoiceNumber})
                    </h4>
                  </div>

                  <button
                    onClick={() => setSelectedShipmentForUpdate(s)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      s.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : s.status === 'In Transit (Loket Aceh)' ||
                          s.status === 'In Transit (Laut/Udara)'
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                    title="Klik untuk ubah status pengiriman"
                  >
                    {s.status} ✎
                  </button>
                </div>

                {/* Transit Details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                      Ekspedisi / Loket
                    </span>
                    <span className="font-bold text-zinc-900 block mt-0.5 truncate">
                      {s.courierName}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate block">
                      {s.serviceType}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                      Tujuan Pengambilan
                    </span>
                    <span className="font-bold text-zinc-900 block mt-0.5 truncate">
                      {s.loketDestination || s.destinationRegion}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate block">
                      {s.destinationIsland}
                    </span>
                  </div>

                  {s.vehiclePlate && (
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                        Mobil & Supir
                      </span>
                      <span className="font-mono font-bold text-zinc-900">{s.vehiclePlate}</span>
                      <div className="text-[10px] text-zinc-500">
                        {s.driverName} {s.driverPhone ? `(${s.driverPhone})` : ''}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                      Bobot & Ongkir
                    </span>
                    <span className="font-mono font-bold text-zinc-900">
                      {s.weightKg} kg • {formatIDR(s.shippingCost)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">Tgl: {s.estimatedDelivery}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-zinc-500 truncate italic">
                    {s.notes || 'Titip di loket tujuan'}
                  </p>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedShipmentForLabel(s)}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-900 shadow-2xs"
                      title="Cetak Label Tempel Karung / Kardus atau Surat Jalan Resmi"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak Label</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppTracking(s)}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-2xs"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Kirim WA</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Update Status Modal */}
      {selectedShipmentForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-900 mb-1">
              Perbarui Status: {selectedShipmentForUpdate.trackingNumber}
            </h3>
            <p className="text-xs text-zinc-500 mb-4">Pilih tahapan logistik saat ini:</p>

            <div className="space-y-2">
              {(
                [
                  'Manifested',
                  'Cargo Drop',
                  'In Transit (Loket Aceh)',
                  'In Transit (Laut/Udara)',
                  'Out for Delivery',
                  'Delivered'
                ] as ShipmentStatus[]
              ).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusUpdate(st)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold border transition-colors ${
                    selectedShipmentForUpdate.status === st
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <span>{st}</span>
                  {selectedShipmentForUpdate.status === st && <CheckCircle2 className="h-4 w-4" />}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedShipmentForUpdate(null)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Shipment Modal */}
      {isNewShipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Dispatch Pengiriman (Loket Aceh & Kargo)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Daftarkan nomor resi loket lokal Aceh atau kargo antarpulau
                </p>
              </div>
              <button
                onClick={() => setIsNewShipmentModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Pilih Faktur / Pesanan
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                >
                  {orders.length === 0 ? (
                    <option value="">(Belum ada order - bisa langsung input data di bawah)</option>
                  ) : (
                    orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.invoiceNumber} - {o.customerName} ({o.destinationIsland}) -{' '}
                        {o.totalWeightKg} kg
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Ekspedisi & Loket Aceh Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Pilihan Loket Aceh / Ekspedisi
                  </label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-bold text-orange-950 focus:border-amber-500 focus:outline-hidden"
                  >
                    <optgroup label="Kurir Instan, Antar Sendiri & Pickup Gudang">
                      <option value="GrabExpress / GoSend Instan">GrabExpress / GoSend Instan (Lhokseumawe & Sekitar)</option>
                      <option value="Antar Sendiri (Kurir Roastery Kofiara)">Antar Sendiri (Kurir Roastery Kofiara Hub)</option>
                      <option value="Ambil di Gudang (Pickup Direct Lhokseumawe)">Ambil di Gudang (Pickup Direct Lhokseumawe)</option>
                    </optgroup>
                    <optgroup label="Loket Angkutan Aceh (L300 / HiAce / Bus)">
                      <option value="Loket Simpati Star Kargo Takengon-Banda Aceh">
                        Loket Simpati Star Kargo (Takengon - B.Aceh / Medan)
                      </option>
                      <option value="Loket CV. Mentari Kargo L300 Gayo">
                        Loket CV. Mentari Kargo L300 Gayo (Takengon)
                      </option>
                      <option value="Loket Harapan Indah Express Banda Aceh">
                        Loket Harapan Indah Express (Banda Aceh)
                      </option>
                      <option value="Loket Putra Pelangi Perkasa Kargo">
                        Loket Putra Pelangi Perkasa Kargo (Aceh - Medan)
                      </option>
                      <option value="Loket Jasa Bunda L300 Bener Meriah">
                        Loket Jasa Bunda L300 (Bener Meriah)
                      </option>
                      <option value="Loket Sinar L300 Gayo Express">
                        Loket Sinar L300 Gayo Express
                      </option>
                      <option value="Loket PMTOH Kargo Aceh">Loket PMTOH Kargo Aceh</option>
                    </optgroup>
                    <optgroup label="Ekspedisi Nasional & Kargo (JNT, JNE, Lion, Indah)">
                      <option value="JNT Express (Kargo / Reguler)">JNT Express (Kargo & Reguler)</option>
                      <option value="JNE Express (YES / REG / JTR)">JNE Express (YES, REG, JTR)</option>
                      <option value="Lion Parcel (Bagan Kargo Udara)">Lion Parcel (Kargo Udara)</option>
                      <option value="Indah Logistic Cargo">Indah Logistic Cargo (Darat & Laut)</option>
                      <option value="Pelni Logistics (Kapal Laut Kargo)">Pelni Logistics (Kapal Laut)</option>
                      <option value="SiCepat Cargo Express">SiCepat Cargo Express</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nomor Resi Loket</label>
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Specific Regional Preset Quick Select */}
              <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-orange-950">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-orange-700" />
                    <span>Pilih Preset Region / Alamat Tujuan Spesifik</span>
                  </span>
                  <span className="text-[10px] text-orange-800 font-medium bg-orange-200 px-1.5 py-0.5 rounded">
                    Otomatisasi Loket & Island
                  </span>
                </div>
                <select
                  value={selectedPresetId}
                  onChange={(e) => {
                    const presetId = e.target.value;
                    setSelectedPresetId(presetId);
                    const found = SPECIFIC_DESTINATION_PRESETS.find((p) => p.id === presetId);
                    if (found) {
                      setDestinationIsland(found.island);
                      const dist = found.districtList?.[0] || '';
                      setDestinationRegion(`${dist ? dist + ', ' : ''}${found.cityRegency}, ${found.province}`);
                      setLoketDestination(found.defaultHubLoket);
                      setShippingCost(found.estimatedShippingFee);
                    }
                  }}
                  className="w-full rounded-lg border border-orange-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-amber-600 focus:outline-hidden"
                >
                  {SPECIFIC_DESTINATION_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.province}] {p.cityRegency} - {p.districtList?.[0] || ''} ({p.island})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loket Asal & Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Loket Asal Titip</label>
                  <input
                    type="text"
                    value={loketOrigin}
                    onChange={(e) => setLoketOrigin(e.target.value)}
                    placeholder="Loket Terminal Paya Ilang Takengon"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Loket Tujuan Pengambilan
                  </label>
                  <input
                    type="text"
                    required
                    value={loketDestination}
                    onChange={(e) => setLoketDestination(e.target.value)}
                    placeholder="Loket Batoh Banda Aceh"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Driver & Plate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">No. Plat Mobil</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="BL 1482 AB"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama Supir</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Bang Irwan"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">No. HP Supir</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="0812-6900-1122"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Berat Total (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Ongkos Titip Loket (Rp)
                  </label>
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Estimasi Tiba</label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsNewShipmentModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-700 px-4 py-1.5 font-bold text-white hover:bg-orange-800"
                >
                  Dispatch Kargo / Loket & Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Label & Surat Jalan Printable Modal */}
      {selectedShipmentForLabel && (
        <ShippingLabelModal
          shipment={selectedShipmentForLabel}
          order={orders.find(
            (o) =>
              o.id === selectedShipmentForLabel.orderId ||
              o.invoiceNumber === selectedShipmentForLabel.invoiceNumber
          )}
          isOpen={!!selectedShipmentForLabel}
          onClose={() => setSelectedShipmentForLabel(null)}
        />
      )}
    </div>
  );
};
