import React, { useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  QrCode,
  Flame,
  LayoutDashboard,
  Wheat,
  Coffee,
  Coins,
  Truck,
  ShoppingCart,
  Users,
  Settings,
  BellRing,
  Command,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  FileText
} from 'lucide-react';


import { NavTab } from './Sidebar';

export interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobile?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenNewBatchModal: () => void;
  onOpenNewRoastModal: () => void;
  onOpenNewOrderModal: () => void;
  onOpenScannerModal: () => void;
  onGoToNotifications: () => void;
  onGoToMovements: () => void;
  onGoToRelations: () => void;
  onGoToSettings?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSyncing: boolean;
  onManualRefresh: () => void;
  lowStockCount?: number;
  activeShipmentsCount?: number;
  partnersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobile,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onOpenNewOrderModal,
  onOpenScannerModal,
  onGoToNotifications,
  onGoToSettings,
  searchQuery,
  onSearchChange,
  isSyncing,
  onManualRefresh,
  lowStockCount = 0,
  activeShipmentsCount = 0,
  partnersCount = 0
}) => {
  // Navigation tabs definition for the modern top bar
  const navTabs = [

    {
      id: 'dashboard' as NavTab,
      label: 'Ringkasan',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'green-beans' as NavTab,
      label: 'Gudang Green Beans',
      icon: Wheat,
      badge: lowStockCount > 0 ? `${lowStockCount} tipis` : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'density' as NavTab,
      label: 'Kalkulator Densitas',
      icon: Gauge,
      badge: 'g/L QC',
      badgeColor: 'bg-teal-600/20 text-teal-800'
    },
    {
      id: 'roastlab' as NavTab,
      label: 'Roast Lab & Sangrai',
      icon: Flame,
      badge: 'SCA QC',
      badgeColor: 'bg-amber-500/20 text-amber-700'
    },
    {
      id: 'roasted-beans' as NavTab,
      label: 'Gudang Roast Beans',
      icon: Coffee,
      badge: 'Degassing',
      badgeColor: 'bg-amber-600/20 text-amber-800'
    },
    {
      id: 'finance' as NavTab,
      label: 'Keuangan & QRIS',
      icon: Coins,
      badge: 'HPP',
      badgeColor: 'bg-emerald-600/20 text-emerald-800'
    },
    {
      id: 'logistics' as NavTab,
      label: 'Pengiriman & Surat Jalan',
      icon: Truck,
      badge: activeShipmentsCount > 0 ? `${activeShipmentsCount} aktif` : null,
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'orders' as NavTab,
      label: 'Pesanan & Kasir',
      icon: ShoppingCart,
      badge: null
    },
    {
      id: 'invoice' as NavTab,
      label: 'Faktur & Cetak PDF',
      icon: FileText,
      badge: 'Template A4',
      badgeColor: 'bg-amber-600/20 text-amber-800'
    },
    {
      id: 'relations' as NavTab,
      label: 'Relasi Mitra',
      icon: Users,
      badge: partnersCount > 0 ? `${partnersCount}` : null,
      badgeColor: 'bg-zinc-200 text-zinc-700'
    },
    {
      id: 'settings' as NavTab,
      label: 'Pengaturan',
      icon: Settings,
      badge: null
    }
  ];

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Dashboard Overview',
          subtitle: 'Monitoring inventaris, barang masuk/keluar, dan pengiriman loket Aceh'
        };
      case 'green-beans':
        return {
          title: 'Gudang Green Beans (Biji Mentah)',
          subtitle: 'Penerimaan biji mentah dari pabrik/kebun, kadar air (MC), manajemen lot, dan transfer sangrai'
        };
      case 'density':
        return {
          title: 'Kalkulator Densitas Kopi (QC Lab)',
          subtitle: 'Kalkulasi g/L & kg/m³, klasifikasi sel SCA (SHB/HB/Soft), profil sangrai presisi, dan estimasi silo'
        };
      case 'roastlab':
        return {
          title: 'Roast Lab & Profil Penyangraian Presisi',
          subtitle: 'Pencatatan kurva suhu (BT/ET/RoR), DTR %, penyusutan bobot, dan skor cupping SCA'
        };

      case 'roasted-beans':
        return {
          title: 'Gudang Roast Beans (Biji Matang)',
          subtitle: 'Stok biji sangrai siap jual, degassing tracker (peak flavor window), dan kemasan pouch'
        };
      case 'finance':
        return {
          title: 'Keuangan, HPP & Pembayaran QRIS GoPay',
          subtitle: 'Hitung HPP per kg, tentukan harga 3-tier (Lokal/UMKM/Luar Pulau), dan upload barcode QRIS'
        };
      case 'logistics':
        return {
          title: 'Pengiriman & Surat Jalan (Logistik)',
          subtitle: 'Jalur loket L300/HiAce/Bus Aceh dan ekspedisi kargo laut/udara antarpulau terpisah rapi'
        };
      case 'orders':
        return {
          title: 'Manajemen Pesanan & Kasir',
          subtitle: 'Pembuatan pesanan berbasis tier harga, faktur resmi, dan barcode pembayaran QRIS GoPay'
        };
      case 'invoice':
        return {
          title: 'Faktur Penjualan & Template PDF Ekspor',
          subtitle: 'Kustomisasi layout faktur, isi item produk kopi, dan unduh dokumen siap cetak A4 instan'
        };
      case 'relations':
        return {
          title: 'Data Relasi (Mitra Petani, Kedai, & Loket Aceh)',
          subtitle: 'Direktori terhubung petani pemasok kopi, kedai pelanggan, dan loket angkutan L300/Bus'
        };
      case 'settings':
        return {
          title: 'Pengaturan & Hapus Data',
          subtitle: 'Pengelolaan penyimpanan database, reset data uji coba, dan sinkronisasi real-time'
        };
      default:
        return {
          title: 'KopiFlow ERP',
          subtitle: 'Sistem manajemen operasional gudang dan roastery kopi'
        };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md shadow-2xs transition-all">
      {/* Upper Navigation Row: Brand, Search, Status & Actions */}
      <div className="px-3 sm:px-6 py-2.5 border-b border-zinc-100 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 shadow-xs ring-1 ring-amber-600/30">
              <Coffee className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-sm text-zinc-900 tracking-tight">KopiFlow</span>
                <span className="rounded bg-amber-500/15 px-1 py-0.2 text-[9px] font-bold text-amber-700">
                  ERP
                </span>
              </div>
              <span className="text-[10px] text-amber-900 font-bold">Kofiara Hub Lhokseumawe</span>
            </div>
          </div>
        </div>

        {/* Center: Quick Command Search */}
        <div className="flex-1 max-w-md mx-1 sm:mx-2 min-w-0">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-amber-600 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari data kopi, lot, faktur, sopir..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 pl-8 pr-3 sm:pr-12 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs truncate"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 shadow-2xs">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right: Live Sync, QR, Quick Order, Notifs */}
        <div className="flex items-center gap-2">
          {/* Realtime Database Sync Badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[10px]">Realtime DB</span>
            <button
              onClick={onManualRefresh}
              className="text-emerald-700 hover:text-emerald-950 transition-colors"
              title="Periksa Sinkronisasi Real-time"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Quick Scanner */}
          <button
            onClick={onOpenScannerModal}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs transition-colors"
            title="Scan QR Code Lot Gudang"
          >
            <QrCode className="h-3.5 w-3.5 text-zinc-600" />
            <span className="hidden xl:inline">Scan QR</span>
          </button>

          {/* + Order Baru CTA */}
          <button
            onClick={onOpenNewOrderModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-amber-800 hover:to-amber-900 transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Order</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onGoToNotifications}
            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 relative transition-colors"
            title="Pusat Notifikasi WA & Email"
          >
            <BellRing className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-600 ring-2 ring-white" />
          </button>

          {/* Settings */}
          {onGoToSettings && (
            <button
              onClick={onGoToSettings}
              className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              title="Pengaturan & Hapus Data"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modern Horizontal Navigation Bar (The Main Request) */}
      <div className="px-3 sm:px-6 py-2 bg-zinc-50/70 border-b border-zinc-200/60 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 sm:gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              currentTab === tab.id ||
              (tab.id === 'green-beans' && currentTab === 'inventory') ||
              (tab.id === 'finance' && currentTab === 'pricing');

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`group relative flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs ring-1 ring-zinc-800 scale-[1.02]'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80 hover:shadow-2xs'
                }`}
              >

                <Icon
                  className={`h-3.5 w-3.5 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-zinc-400 group-hover:text-zinc-700'
                  }`}
                />
                <span className="whitespace-nowrap">{tab.label}</span>

                {tab.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                      tab.badgeColor || (isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-200 text-zinc-700')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Subtle active pill indicator bottom bar */}
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-Header Breadcrumb Context Bar */}
      <div className="px-4 sm:px-6 py-2 bg-white flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-500 truncate">
          <span className="font-semibold text-zinc-800">{title}</span>
          <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
          <span className="text-[11px] text-zinc-500 truncate hidden sm:inline">{subtitle}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-zinc-500 shrink-0">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Lhokseumawe • Kofiara Hub Central</span>
        </div>
      </div>
    </header>
  );
};
