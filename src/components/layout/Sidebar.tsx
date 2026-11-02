import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Coins,
  ShoppingCart,
  Flame,
  Truck,
  BellRing,
  Coffee,
  Users,
  ArrowDownUp,
  ShieldCheck,
  Settings,
  Wheat,
  QrCode
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'green-beans'
  | 'roastlab'
  | 'roasted-beans'
  | 'finance'
  | 'logistics'
  | 'orders'
  | 'relations'
  | 'movements'
  | 'inventory'
  | 'batches'
  | 'pricing'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lowStockCount: number;
  activeShipmentsCount: number;
  partnersCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
  activeShipmentsCount,
  partnersCount,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Ringkasan Utama (Dashboard)',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'green-beans' as NavTab,
      label: 'Gudang Green Beans',
      icon: Wheat,
      badge: lowStockCount > 0 ? `${lowStockCount} menipis` : 'Mentah / Lot',
      badgeColor: lowStockCount > 0 ? 'bg-rose-500 text-white font-extrabold' : 'bg-emerald-500/20 text-emerald-300'
    },
    {
      id: 'roastlab' as NavTab,
      label: 'Roast Lab & Sangrai',
      icon: Flame,
      badge: 'SCA QC',
      badgeColor: 'bg-amber-500/20 text-amber-300'
    },
    {
      id: 'roasted-beans' as NavTab,
      label: 'Gudang Roast Beans',
      icon: Coffee,
      badge: 'Degassing',
      badgeColor: 'bg-amber-600/30 text-amber-200'
    },
    {
      id: 'finance' as NavTab,
      label: 'Keuangan & QRIS GoPay',
      icon: Coins,
      badge: 'HPP & 3-Tier',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 text-[10px]'
    },
    {
      id: 'logistics' as NavTab,
      label: 'Pengiriman & Surat Jalan',
      icon: Truck,
      badge: activeShipmentsCount > 0 ? `${activeShipmentsCount} aktif` : 'Loket Aceh',
      badgeColor: 'bg-blue-500/20 text-blue-300'
    },
    {
      id: 'orders' as NavTab,
      label: 'Pesanan & Faktur (Kasir)',
      icon: ShoppingCart,
      badge: null
    },
    {
      id: 'relations' as NavTab,
      label: 'Data Relasi (Mitra & Loket)',
      icon: Users,
      badge: `${partnersCount} kontak`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      id: 'notifications' as NavTab,
      label: 'Notifikasi WA & Email',
      icon: BellRing,
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : 'Auto Sync',
      badgeColor: lowStockCount > 0 ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-emerald-500/20 text-emerald-300'
    },
    {
      id: 'settings' as NavTab,
      label: 'Pengaturan & Hapus Data',
      icon: Settings,
      badge: 'Database',
      badgeColor: 'bg-rose-500/20 text-rose-300'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-zinc-200 bg-zinc-900 text-zinc-200 transition-all duration-200 ease-in-out md:static ${
          isCollapsed ? 'md:hidden' : 'md:w-72 md:translate-x-0'
        } ${isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between border-b border-zinc-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 shadow-md ring-1 ring-amber-500/30">
              <Coffee className="h-5 w-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base">KopiFlow ERP</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  ACEH & INDO
                </span>
              </div>
              <p className="text-xs text-zinc-400">Warehouse & Roast Lab</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            Menu Operasional Gudang
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-400 group-hover:text-amber-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.badgeColor || 'bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer / System Status */}
        <div className="border-t border-zinc-800 p-3 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600/20 text-amber-400 text-xs font-bold border border-amber-500/30">
              WH
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">Kepala Gudang & QC Lab</p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                <span>Firestore Realtime Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
