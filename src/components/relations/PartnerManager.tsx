import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Building,
  Store,
  Truck,
  MessageCircle,
  Mail,
  MapPin,
  Trash2,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { Partner, PartnerType, PricingTier } from '../../types/erp';
import { savePartner, deletePartner, buildWhatsAppLink } from '../../services/dbService';

interface PartnerManagerProps {
  partners: Partner[];
  onRefresh: () => void;
}

export const PartnerManager: React.FC<PartnerManagerProps> = ({ partners, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'all' | PartnerType>('all');
  const [search, setSearch] = useState('');
  const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] = useState(false);

  // New Partner form
  const [partnerName, setPartnerName] = useState('');
  const [partnerType, setPartnerType] = useState<PartnerType>('Pemasok / Petani');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('628');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Takengon (Aceh Tengah)');
  const [address, setAddress] = useState('');
  const [defaultPricingTier, setDefaultPricingTier] = useState<PricingTier>('Lokal');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');

  const filteredPartners = partners.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchType = activeTab === 'all' || p.type === activeTab;
    return matchSearch && matchType;
  });

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName || !phone) return;

    const newPartner: Partner = {
      id: `partner-${Date.now().toString(36)}`,
      name: partnerName.trim(),
      type: partnerType,
      category: category.trim() || (partnerType === 'Mitra Loket Aceh' ? 'Angkutan L300 / HiAce' : 'Mitra Kopi'),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim() || 'Aceh',
      address: address.trim(),
      defaultPricingTier: partnerType === 'Pelanggan / Kedai' ? defaultPricingTier : 'Lokal',
      contactPerson: contactPerson.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    await savePartner(newPartner);
    setIsNewPartnerModalOpen(false);
    // Reset
    setPartnerName('');
    setCategory('');
    setPhone('628');
    setEmail('');
    setAddress('');
    setContactPerson('');
    setNotes('');
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus data relasi ini?')) {
      await deletePartner(id);
      onRefresh();
    }
  };

  const handleChatWA = (partner: Partner) => {
    const msg = `Halo ${partner.name}, kami dari Tim KopiFlow Warehouse & Roast Lab. Kami ingin berkoordinasi mengenai pasokan & logistik kopi.`;
    window.open(buildWhatsAppLink(partner.phone, msg), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Filter */}
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-xs text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua Relasi ({partners.length})
            </button>
            <button
              onClick={() => setActiveTab('Pemasok / Petani')}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                activeTab === 'Pemasok / Petani'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Petani & Pemasok ({partners.filter((p) => p.type === 'Pemasok / Petani').length})
            </button>
            <button
              onClick={() => setActiveTab('Pelanggan / Kedai')}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                activeTab === 'Pelanggan / Kedai'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Pelanggan & Kedai ({partners.filter((p) => p.type === 'Pelanggan / Kedai').length})
            </button>
            <button
              onClick={() => setActiveTab('Mitra Loket Aceh')}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                activeTab === 'Mitra Loket Aceh'
                  ? 'bg-orange-700 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Loket Angkutan Aceh ({partners.filter((p) => p.type === 'Mitra Loket Aceh').length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kota, loket..."
              className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <button
          onClick={() => setIsNewPartnerModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>+ Tambah Data Relasi</span>
        </button>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.map((partner) => {
          const isLoket = partner.type === 'Mitra Loket Aceh';
          const isSupplier = partner.type === 'Pemasok / Petani';
          const isCustomer = partner.type === 'Pelanggan / Kedai';

          return (
            <div
              key={partner.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-100">
                  <div className="flex items-start gap-2 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isLoket
                          ? 'bg-orange-100 text-orange-700'
                          : isSupplier
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isLoket ? <Truck className="h-4 w-4" /> : isSupplier ? <Building className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-zinc-900 truncate">{partner.name}</h4>
                      <p className="text-[11px] text-zinc-500 truncate">{partner.category}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                      isLoket
                        ? 'bg-orange-100 text-orange-800'
                        : isSupplier
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isLoket ? 'Loket Aceh' : isSupplier ? 'Petani/Pemasok' : 'Pelanggan'}
                  </span>
                </div>

                {/* Details */}
                <div className="py-3 text-xs space-y-1.5 text-zinc-600">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-800">{partner.city}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-zinc-400 shrink-0">Alamat:</span>
                    <span className="text-zinc-600 line-clamp-2">{partner.address || '-'}</span>
                  </div>
                  {partner.contactPerson && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-zinc-400 shrink-0">PIC:</span>
                      <span className="font-medium text-zinc-700">{partner.contactPerson}</span>
                    </div>
                  )}
                  {partner.defaultPricingTier && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-zinc-400 shrink-0">Tier Harga:</span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                        Tier {partner.defaultPricingTier}
                      </span>
                    </div>
                  )}
                  {partner.notes && (
                    <p className="text-[10px] text-zinc-400 italic pt-1 border-t border-zinc-100 line-clamp-2">
                      "{partner.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleChatWA(partner)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp ({partner.phone.slice(-4)})</span>
                </button>

                <button
                  onClick={() => handleDelete(partner.id)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                  title="Hapus data relasi"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Partner Modal */}
      {isNewPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Tambah Data Relasi Bisnis Baru</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Daftarkan petani/pemasok, kedai pelanggan, atau mitra loket angkutan Aceh
                </p>
              </div>
              <button
                onClick={() => setIsNewPartnerModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Jenis Relasi</label>
                  <select
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value as PartnerType)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden font-semibold"
                  >
                    <option value="Pemasok / Petani">Pemasok / Petani Kopi</option>
                    <option value="Pelanggan / Kedai">Pelanggan / Kedai Kopi</option>
                    <option value="Mitra Loket Aceh">Mitra Loket Angkutan Aceh (L300/Bus)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama Relasi / Entitas</label>
                  <input
                    type="text"
                    required
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder={
                      partnerType === 'Mitra Loket Aceh'
                        ? 'cth: Loket Simpati Star Takengon'
                        : partnerType === 'Pemasok / Petani'
                        ? 'cth: Koperasi Tani Pantan Musara'
                        : 'cth: Kedai Kopi Ulee Kareng'
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Kategori / Spesialisasi</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="cth: Mobil L300 Barang / Petani Organik"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Takengon / Bener Meriah / Banda Aceh"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="628123456789"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama PIC / Kontak Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="cth: Bang Irwan (Mandor Loket)"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {partnerType === 'Pelanggan / Kedai' && (
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Default Tier Harga Penjualan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Lokal', 'UMKM', 'Luar Pulau'] as PricingTier[]).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setDefaultPricingTier(tier)}
                        className={`rounded-lg py-1.5 text-xs font-bold border transition-colors ${
                          defaultPricingTier === tier
                            ? 'bg-amber-700 text-white border-amber-700'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Alamat Lengkap / Terminal</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Terminal Paya Ilang Takengon / Jl. Lueng Bata..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Catatan Operasional</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jadwal keberangkatan trip malam jam 20.00 WIB..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsNewPartnerModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 px-4 py-1.5 font-bold text-white hover:bg-amber-800"
                >
                  Simpan Data Relasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
