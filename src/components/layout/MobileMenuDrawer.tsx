import React from 'react';
import {
  X,
  LayoutDashboard,
  Wheat,
  Gauge,
  Flame,
  Coffee,
  Coins,
  Wallet,
  Truck,
  ShoppingCart,
  FileText,
  Users,
  BellRing,
  Settings,
  ArrowRight,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenScanner?: () => void;
  lowStockCount?: number;
  activeShipmentsCount?: number;
  partnersCount?: number;
}

interface DrawerMenuItem {
  id: NavTab;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
  highlight?: boolean;
}

interface DrawerSection {
  title: string;
  items: DrawerMenuItem[];
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenScanner,
  lowStockCount = 0,
  activeShipmentsCount = 0,
  partnersCount = 0
}) => {
  if (!isOpen) return null;

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  const menuSections: DrawerSection[] = [
    {
      title: 'Keuangan & Perbankan Kas',
      items: [
        {
          id: 'banking' as NavTab,
          label: 'Perbankan Kas (3 Kantong)',
          desc: 'Pos Anggaran: Gudang, Penjualan & Laba',
          icon: Wallet,
          badge: 'Kas Digital',
          badgeColor: 'bg-indigo-100 text-indigo-700 font-bold',
          highlight: true
        },
        {
          id: 'finance' as NavTab,
          label: 'Keuangan & QRIS GoPay',
          desc: 'Kalkulator HPP 3-tier & QRIS barcode',
          icon: Coins,
          badge: 'HPP',
          badgeColor: 'bg-emerald-100 text-emerald-800'
        },
        {
          id: 'orders' as NavTab,
          label: 'Pesanan & Kasir Kedai',
          desc: 'Pencatatan order dan pembayaran',
          icon: ShoppingCart,
          badge: null
        },
        {
          id: 'invoice' as NavTab,
          label: 'Faktur & Template Cetak PDF',
          desc: 'Ekspor invoice A4 lengkap & profesional',
          icon: FileText,
          badge: 'Cetak A4',
          badgeColor: 'bg-amber-100 text-amber-800'
        }
      ]
    },
    {
      title: 'Inventaris & Operasional Gudang',
      items: [
        {
          id: 'green-beans' as NavTab,
          label: 'Gudang Green Beans',
          desc: 'Biji mentah, kadar air MC & lot gudang',
          icon: Wheat,
          badge: lowStockCount > 0 ? `${lowStockCount} menipis` : null,
          badgeColor: 'bg-rose-500 text-white font-bold'
        },
        {
          id: 'density' as NavTab,
          label: 'Kalkulator Densitas Kopi',
          desc: 'Uji g/L, klasifikasi sel SCA & rekomendasi sangrai',
          icon: Gauge,
          badge: 'g/L QC',
          badgeColor: 'bg-teal-100 text-teal-800'
        },
        {
          id: 'roastlab' as NavTab,
          label: 'Roast Lab & Sangrai SCA',
          desc: 'Kurva BT/ET/RoR, DTR % & profil sangrai',
          icon: Flame,
          badge: 'QC Lab',
          badgeColor: 'bg-amber-100 text-amber-800'
        },
        {
          id: 'roasted-beans' as NavTab,
          label: 'Gudang Roast Beans',
          desc: 'Degassing window & stok siap jual',
          icon: Coffee,
          badge: 'Siap Jual',
          badgeColor: 'bg-amber-100 text-amber-800'
        }
      ]
    },
    {
      title: 'Logistik & Mitra Hub',
      items: [
        {
          id: 'logistics' as NavTab,
          label: 'Pengiriman & Surat Jalan',
          desc: 'Loket L300 & Bus Kargo Aceh',
          icon: Truck,
          badge: activeShipmentsCount > 0 ? `${activeShipmentsCount} aktif` : null,
          badgeColor: 'bg-blue-600 text-white'
        },
        {
          id: 'relations' as NavTab,
          label: 'Data Relasi Mitra & Loket',
          desc: 'Kontak kedai, petani, dan sopir angkutan',
          icon: Users,
          badge: partnersCount > 0 ? `${partnersCount}` : null,
          badgeColor: 'bg-zinc-200 text-zinc-700'
        },
        {
          id: 'notifications' as NavTab,
          label: 'Pusat Notifikasi WA & Alert',
          desc: 'Otomasi WhatsApp stok & dispatch',
          icon: BellRing,
          badge: null
        },
        {
          id: 'settings' as NavTab,
          label: 'Pengaturan & Hapus Data',
          desc: 'Koneksi Firestore, cache & reset',
          icon: Settings,
          badge: null
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 sm:hidden">
      <div
        className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-zinc-200 animate-in slide-in-from-bottom duration-300 overflow-hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {/* Handle bar & Header */}
        <div className="pt-3 pb-2 px-5 flex items-center justify-between border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-800">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 leading-tight">Navigasi Seluruh Menu</h3>
              <p className="text-[11px] text-zinc-500">KopiFlow Roastery & Warehouse ERP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable menu items list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Quick Scanner Shortcut */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={() => {
                onOpenScanner();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-md active:scale-98 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <QrCode className="w-5 h-5 text-amber-100" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Scan QR Code Lot Gudang</div>
                  <div className="text-[10px] text-amber-200">Kamera HP langsung buka detail kopi</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-200" />
            </button>
          )}

          {/* Grouped Modules */}
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                {section.title}
              </span>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all active:scale-98 ${
                        isActive
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : item.highlight
                          ? 'bg-indigo-50/80 hover:bg-indigo-100/80 text-zinc-800 border border-indigo-200/60'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.highlight
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-zinc-200 text-zinc-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full shrink-0 ${
                                  item.badgeColor || 'bg-zinc-200 text-zinc-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] truncate ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
