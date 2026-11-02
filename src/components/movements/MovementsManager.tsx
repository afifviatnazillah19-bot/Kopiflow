import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Truck,
  Building,
  Store,
  Calendar,
  Package,
  Droplets,
  MapPin,
  MessageCircle,
  CheckCircle2,
  Clock,
  Printer,
  FileText
} from 'lucide-react';
import {
  InboundMovement,
  OutboundMovement,
  Partner,
  CoffeeBean,
  Batch
} from '../../types/erp';
import {
  saveInboundMovement,
  saveOutboundMovement,
  formatIDR,
  buildWhatsAppLink,
  saveNotificationLog
} from '../../services/dbService';

interface MovementsManagerProps {
  inbound: InboundMovement[];
  outbound: OutboundMovement[];
  partners: Partner[];
  beans: CoffeeBean[];
  batches: Batch[];
  onRefresh: () => void;
}

export const MovementsManager: React.FC<MovementsManagerProps> = ({
  inbound,
  outbound,
  partners,
  beans,
  batches,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [search, setSearch] = useState('');
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);

  // Inbound Form State
  const suppliers = partners.filter((p) => p.type === 'Pemasok / Petani');
  const customers = partners.filter((p) => p.type === 'Pelanggan / Kedai');
  const acehLokets = partners.filter((p) => p.type === 'Mitra Loket Aceh');

  const [inbPartnerId, setInbPartnerId] = useState(suppliers[0]?.id || '');
  const [inbBeanId, setInbBeanId] = useState(beans[0]?.id || '');
  const [inbLotNumber, setInbLotNumber] = useState(
    `LOT-${new Date().getFullYear()}-GY-${Math.floor(100 + Math.random() * 900)}`
  );
  const [inbBagCount, setInbBagCount] = useState<number>(20);
  const [inbWeightKg, setInbWeightKg] = useState<number>(1200);
  const [inbMoisture, setInbMoisture] = useState<number>(11.2);
  const [inbLocation, setInbLocation] = useState('Silo A - Bay 1 Takengon');
  const [inbDeliveryNote, setInbDeliveryNote] = useState('SJ/PETANI/X/2026/01');
  const [inbReceivedBy, setInbReceivedBy] = useState('Tgk. Mansur (QC Gudang)');
  const [inbNotes, setInbNotes] = useState('Kopi beras kering giling, kadar air stabil, kemasan karung bersih.');

  // Outbound Form State
  const [outPartnerId, setOutPartnerId] = useState(customers[0]?.id || '');
  const [outBeanId, setOutBeanId] = useState(beans[0]?.id || '');
  const [outItemType, setOutItemType] = useState<'Green Bean' | 'Roasted Bean' | 'Ground'>('Green Bean');
  const [outQuantityKg, setOutQuantityKg] = useState<number>(60);
  const [outLoketName, setOutLoketName] = useState(
    acehLokets[0]?.name || 'Loket CV. Mentari Kargo L300 Gayo'
  );
  const [outDestinationCity, setOutDestinationCity] = useState('Banda Aceh (Loket Batoh)');
  const [outDriverPhone, setOutDriverPhone] = useState('Bang Irwan (0812-6900-1122)');
  const [outVehiclePlate, setOutVehiclePlate] = useState('BL 1482 AB (L300 Putih)');
  const [outReceiptNo, setOutReceiptNo] = useState(`RESI-LOKET-${Math.floor(1000 + Math.random() * 9000)}`);
  const [outShippingFee, setOutShippingFee] = useState<number>(45000);
  const [outDispatchedBy, setOutDispatchedBy] = useState('Hendra Setiawan');
  const [outNotes, setOutNotes] = useState('Titip di Loket Batoh Banda Aceh, penerima langsung ambil saat tiba.');

  // Filtered lists
  const filteredInbound = inbound.filter((item) => {
    return (
      item.docNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.partnerName.toLowerCase().includes(search.toLowerCase()) ||
      item.beanName.toLowerCase().includes(search.toLowerCase()) ||
      item.lotNumber.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredOutbound = outbound.filter((item) => {
    return (
      item.docNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.partnerName.toLowerCase().includes(search.toLowerCase()) ||
      item.beanName.toLowerCase().includes(search.toLowerCase()) ||
      item.loketOrCourier.toLowerCase().includes(search.toLowerCase()) ||
      item.destinationCity.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = partners.find((p) => p.id === inbPartnerId);
    const bean = beans.find((b) => b.id === inbBeanId);

    const docNumber = `INB/${new Date().getFullYear()}/${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

    const newMovement: InboundMovement = {
      id: `inb-${Date.now().toString(36)}`,
      docNumber,
      date: new Date().toISOString().split('T')[0],
      partnerId: inbPartnerId,
      partnerName: supplier ? supplier.name : 'Petani Kopi Mitra',
      beanId: inbBeanId,
      beanName: bean ? bean.name : 'Aceh Gayo Specialty',
      lotNumber: inbLotNumber,
      bagCount: Number(inbBagCount),
      weightKg: Number(inbWeightKg),
      moisturePercent: Number(inbMoisture),
      warehouseLocation: inbLocation,
      supplierDeliveryNote: inbDeliveryNote,
      receivedBy: inbReceivedBy,
      notes: inbNotes,
      createdAt: new Date().toISOString()
    };

    // Tutup menu modal seketika
    setIsInboundModalOpen(false);

    await saveInboundMovement(newMovement, beans);
    onRefresh();
  };

  const handleCreateOutbound = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = partners.find((p) => p.id === outPartnerId);
    const bean = beans.find((b) => b.id === outBeanId);

    const docNumber = `OUT/${new Date().getFullYear()}/${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

    const newMovement: OutboundMovement = {
      id: `out-${Date.now().toString(36)}`,
      docNumber,
      date: new Date().toISOString().split('T')[0],
      partnerId: outPartnerId,
      partnerName: customer ? customer.name : 'Pelanggan Kedai',
      beanId: outBeanId,
      beanName: bean ? bean.name : 'Aceh Gayo Specialty',
      itemType: outItemType,
      quantityKg: Number(outQuantityKg),
      loketOrCourier: outLoketName,
      destinationCity: outDestinationCity,
      driverNameOrPhone: outDriverPhone,
      vehiclePlate: outVehiclePlate,
      receiptNumber: outReceiptNo,
      shippingFeeIdr: Number(outShippingFee),
      status: 'In Transit',
      dispatchedBy: outDispatchedBy,
      notes: outNotes,
      createdAt: new Date().toISOString()
    };

    // Tutup menu modal seketika
    setIsOutboundModalOpen(false);

    await saveOutboundMovement(newMovement, beans);

    // Save notification
    if (customer) {
      await saveNotificationLog({
        id: `notif-${Date.now().toString(36)}`,
        channel: 'WhatsApp',
        recipient: customer.phone,
        subject: `Surat Jalan Pengiriman via Loket Aceh (${outReceiptNo})`,
        messagePreview: `Halo ${customer.name}, pesanan ${bean?.name} (${outQuantityKg} kg) telah diserahkan ke ${outLoketName} (Mobil: ${outVehiclePlate}, Supir: ${outDriverPhone}). Silakan ambil di ${outDestinationCity}.`,
        type: 'Surat Jalan Loket',
        status: 'Sent',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdAt: new Date().toISOString()
      });
    }

    onRefresh();
  };

  const handleSendWALoketSuratJalan = (out: OutboundMovement) => {
    const customer = partners.find((p) => p.id === out.partnerId);
    const phone = customer ? customer.phone : '6281234567890';

    const text =
      `*SURAT JALAN & PENGIRIMAN LOKET ACEH - KOPIFLOW*\n\n` +
      `No. Dokumen: *${out.docNumber}*\n` +
      `Penerima: *${out.partnerName}*\n` +
      `Tanggal: ${out.date}\n\n` +
      `*DETAIL BARANG KELUAR:*\n` +
      `• Produk: *${out.beanName}* (${out.itemType})\n` +
      `• Jumlah: *${out.quantityKg} kg*\n\n` +
      `*LOKET ANGKUTAN ACEH TERPILIH:*\n` +
      `• Ekspedisi/Loket: *${out.loketOrCourier}*\n` +
      `• Tujuan Pengambilan: *${out.destinationCity}*\n` +
      `• Mobil Angkutan: *${out.vehiclePlate || 'L300 / HiAce'}*\n` +
      `• Supir / Kontak: *${out.driverNameOrPhone || '-'}*\n` +
      `• No. Resi Loket: *${out.receiptNumber || '-'}*\n` +
      `• Ongkos Titip: ${formatIDR(out.shippingFeeIdr || 0)}\n\n` +
      `Mohon bawa KTP / Bukti Resi saat pengambilan di loket tujuan. Terima kasih!`;

    window.open(buildWhatsAppLink(phone, text), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Inbound / Outbound Tabs */}
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-xs text-xs">
            <button
              onClick={() => setActiveTab('inbound')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 font-bold transition-colors ${
                activeTab === 'inbound'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>Barang Masuk / Inbound ({inbound.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('outbound')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 font-bold transition-colors ${
                activeTab === 'outbound'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Barang Keluar / Outbound ({outbound.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. dokumen, petani, loket..."
              className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Action Button */}
        {activeTab === 'inbound' ? (
          <button
            onClick={() => {
              setInbLotNumber(
                `LOT-${new Date().getFullYear()}-GY-${Math.floor(100 + Math.random() * 900)}`
              );
              setIsInboundModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>+ Catat Barang Masuk (Inbound)</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setOutReceiptNo(`RESI-LOKET-${Math.floor(1000 + Math.random() * 9000)}`);
              setIsOutboundModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>+ Catat Barang Keluar (Outbound)</span>
          </button>
        )}
      </div>

      {/* TAB 1: BARANG MASUK TABLE */}
      {activeTab === 'inbound' && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                Penerimaan Biji Kopi Masuk (Inbound Receipts)
              </h3>
              <p className="text-xs text-zinc-500">
                Data penerimaan langsung dari petani/koperasi mitra yang otomatis menambah stok gudang
              </p>
            </div>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Auto-Add Stock
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/60 text-zinc-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">No. Dokumen & Tanggal</th>
                  <th className="py-3 px-3">Petani / Pemasok</th>
                  <th className="py-3 px-3">Biji Kopi & No. Lot</th>
                  <th className="py-3 px-3">Karung & Bobot (kg)</th>
                  <th className="py-3 px-3">Kadar Air & Lokasi</th>
                  <th className="py-3 px-3">Penerima & QC</th>
                  <th className="py-3 px-4 text-right">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredInbound.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Belum ada data barang masuk. Klik "+ Catat Barang Masuk" untuk menguji input data dari nol.
                    </td>
                  </tr>
                ) : (
                  filteredInbound.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Doc & Date */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-emerald-900 text-xs">{item.docNumber}</div>
                        <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{item.date}</div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-zinc-900 text-xs">{item.partnerName}</div>
                        <div className="text-[10px] text-zinc-500">SJ: {item.supplierDeliveryNote || '-'}</div>
                      </td>

                      {/* Bean & Lot */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-900">{item.beanName}</div>
                        <div className="font-mono text-[10px] text-amber-800 font-bold">
                          {item.lotNumber}
                        </div>
                      </td>

                      {/* Weight */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-sm text-zinc-900">
                          {item.weightKg.toLocaleString('id-ID')} kg
                        </div>
                        <div className="text-[10px] text-zinc-500">{item.bagCount} Karung GrainPro</div>
                      </td>

                      {/* MC & Location */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 font-semibold text-blue-700">
                          <Droplets className="h-3 w-3" />
                          <span>{item.moisturePercent}% MC</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[140px]">
                          {item.warehouseLocation}
                        </div>
                      </td>

                      {/* Receiver */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-zinc-800 text-[11px]">{item.receivedBy}</div>
                        <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                          Passed QC
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 text-right text-zinc-500 text-[11px] max-w-[180px] truncate">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BARANG KELUAR TABLE (DENGAN LOKET ACEH) */}
      {activeTab === 'outbound' && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                Pengeluaran Barang Keluar & Pengiriman Loket Aceh
              </h3>
              <p className="text-xs text-zinc-500">
                Integrasi surat jalan angkutan L300 & loket bus Aceh (Simpati Star, Mentari Kargo, Harapan Indah)
              </p>
            </div>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Auto-Deduct Stock
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/60 text-zinc-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">No. Dokumen & Tgl</th>
                  <th className="py-3 px-3">Pelanggan / Kedai</th>
                  <th className="py-3 px-3">Produk & Jumlah</th>
                  <th className="py-3 px-3">Loket Aceh / Armada</th>
                  <th className="py-3 px-3">Supir & No. Plat Mobil</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Surat Jalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOutbound.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Belum ada data barang keluar. Klik "+ Catat Barang Keluar" untuk menguji alur pengiriman loket Aceh dari nol.
                    </td>
                  </tr>
                ) : (
                  filteredOutbound.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Doc */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-amber-900 text-xs">{item.docNumber}</div>
                        <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{item.date}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-zinc-900 text-xs">{item.partnerName}</div>
                        <div className="text-[11px] text-zinc-500">{item.destinationCity}</div>
                      </td>

                      {/* Item */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-900">{item.beanName}</div>
                        <div className="font-extrabold text-amber-800 text-xs">
                          {item.quantityKg} kg ({item.itemType})
                        </div>
                      </td>

                      {/* Loket Aceh */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-zinc-800 flex items-center gap-1">
                          <Truck className="h-3 w-3 text-orange-600 shrink-0" />
                          <span>{item.loketOrCourier}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Resi: {item.receiptNumber || '-'} • Ongkos: {formatIDR(item.shippingFeeIdr || 0)}
                        </div>
                      </td>

                      {/* Driver & Plate */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-zinc-900">
                          {item.vehiclePlate || 'L300'}
                        </div>
                        <div className="text-[11px] text-zinc-500">{item.driverNameOrPhone || '-'}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* WA Share Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSendWALoketSuratJalan(item)}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
                          title="Kirim Surat Jalan ke WhatsApp Pelanggan"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>Surat Jalan WA</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CATAT BARANG MASUK (INBOUND) */}
      {isInboundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Penerimaan Barang Masuk (Inbound Biji Kopi)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Hubungkan dengan data petani/pemasok untuk menambah stok gudang secara otomatis
                </p>
              </div>
              <button
                onClick={() => setIsInboundModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInbound} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Pilih Petani / Pemasok
                  </label>
                  <select
                    value={inbPartnerId}
                    onChange={(e) => setInbPartnerId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    {suppliers.length === 0 ? (
                      <option value="">(Belum ada pemasok - Tambah di Data Relasi)</option>
                    ) : (
                      suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Pilih Master Biji</label>
                  <select
                    value={inbBeanId}
                    onChange={(e) => setInbBeanId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    {beans.length === 0 ? (
                      <option value="">(Belum ada master biji - Tambah di Inventaris)</option>
                    ) : (
                      beans.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.process})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nomor Lot Panen</label>
                  <input
                    type="text"
                    required
                    value={inbLotNumber}
                    onChange={(e) => setInbLotNumber(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    No. Surat Jalan Pemasok
                  </label>
                  <input
                    type="text"
                    value={inbDeliveryNote}
                    onChange={(e) => setInbDeliveryNote(e.target.value)}
                    placeholder="SJ/PETANI/X/01"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Total Bobot (kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={inbWeightKg}
                    onChange={(e) => setInbWeightKg(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono font-bold text-zinc-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Jumlah Karung</label>
                  <input
                    type="number"
                    min="1"
                    value={inbBagCount}
                    onChange={(e) => setInbBagCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Kadar Air (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inbMoisture}
                    onChange={(e) => setInbMoisture(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Penempatan Lokasi Gudang
                  </label>
                  <input
                    type="text"
                    value={inbLocation}
                    onChange={(e) => setInbLocation(e.target.value)}
                    placeholder="Silo A / Rak Khusus Gayo"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Penerima & Staff QC</label>
                  <input
                    type="text"
                    value={inbReceivedBy}
                    onChange={(e) => setInbReceivedBy(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Catatan Hasil Uji Fisik</label>
                <textarea
                  rows={2}
                  value={inbNotes}
                  onChange={(e) => setInbNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsInboundModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 font-bold text-white hover:bg-emerald-800"
                >
                  Simpan Penerimaan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT BARANG KELUAR (OUTBOUND - LOKET ACEH) */}
      {isOutboundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Pengeluaran Barang Keluar (Via Loket Aceh / Ekspedisi)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Potong stok gudang dan terbitkan surat jalan untuk supir L300 / HiAce
                </p>
              </div>
              <button
                onClick={() => setIsOutboundModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOutbound} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Pilih Pelanggan / Kedai
                  </label>
                  <select
                    value={outPartnerId}
                    onChange={(e) => {
                      setOutPartnerId(e.target.value);
                      const c = customers.find((cust) => cust.id === e.target.value);
                      if (c) setOutDestinationCity(`${c.city} (${c.name})`);
                    }}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    {customers.length === 0 ? (
                      <option value="">(Belum ada pelanggan - Tambah di Data Relasi)</option>
                    ) : (
                      customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.city})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Pilih Biji Kopi</label>
                  <select
                    value={outBeanId}
                    onChange={(e) => setOutBeanId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    {beans.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (Stok: {b.stockGreenKg}kg Green / {b.stockRoastedKg}kg Roasted)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Bentuk Kopi</label>
                  <select
                    value={outItemType}
                    onChange={(e) => setOutItemType(e.target.value as OutboundMovement['itemType'])}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Green Bean">Green Bean (Kopi Beras)</option>
                    <option value="Roasted Bean">Roasted Bean (Biji Sangrai)</option>
                    <option value="Ground">Ground (Kopi Bubuk)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Jumlah Keluar (kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={outQuantityKg}
                    onChange={(e) => setOutQuantityKg(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono font-bold text-zinc-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Loket Aceh Section */}
              <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-orange-950">
                  <Truck className="h-4 w-4 text-orange-700" />
                  <span>Pilihan Loket Angkutan Aceh (Lokal / Regional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                      Pilih Loket / Bus Aceh
                    </label>
                    <select
                      value={outLoketName}
                      onChange={(e) => setOutLoketName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 focus:border-amber-500 focus:outline-hidden"
                    >
                      {acehLokets.map((loket) => (
                        <option key={loket.id} value={loket.name}>
                          {loket.name} ({loket.city})
                        </option>
                      ))}
                      <option value="Loket Sinar L300 Gayo Express">Loket Sinar L300 Gayo Express</option>
                      <option value="Loket PMTOH Kargo Aceh">Loket PMTOH Kargo Aceh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                      Loket Tujuan Pengambilan
                    </label>
                    <input
                      type="text"
                      required
                      value={outDestinationCity}
                      onChange={(e) => setOutDestinationCity(e.target.value)}
                      placeholder="Loket Batoh Banda Aceh"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                      No. Plat Mobil
                    </label>
                    <input
                      type="text"
                      value={outVehiclePlate}
                      onChange={(e) => setOutVehiclePlate(e.target.value)}
                      placeholder="BL 1482 AB"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                      Supir / No. HP
                    </label>
                    <input
                      type="text"
                      value={outDriverPhone}
                      onChange={(e) => setOutDriverPhone(e.target.value)}
                      placeholder="Bang Irwan (0812...)"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-0.5">
                      No. Resi Loket
                    </label>
                    <input
                      type="text"
                      value={outReceiptNo}
                      onChange={(e) => setOutReceiptNo(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Catatan Pengambilan & Penerima
                </label>
                <textarea
                  rows={2}
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                  placeholder="Titip di loket tujuan, penerima wajib bawa resi..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsOutboundModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 px-4 py-1.5 font-bold text-white hover:bg-amber-800"
                >
                  Terbitkan Surat Jalan & Potong Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
