import React from 'react';
import {
  LayoutDashboard,
  Wheat,
  Wallet,
  ShoppingCart,
  Menu,
  FileText
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMenuDrawer: () => void;
  lowStockCount?: number;
  activeShipmentsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMenuDrawer,
  lowStockCount = 0
}) => {
  const isGudangActive =
    currentTab === 'green-beans' ||
    currentTab === 'roasted-beans' ||
    currentTab === 'inventory' ||
    currentTab === 'batches';

  const isPesananActive = currentTab === 'orders' || currentTab === 'invoice';

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around select-none">
      {/* 1. Beranda / Dashboard */}
      <button
        type="button"
        onClick={() => onSelectTab('dashboard')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
          currentTab === 'dashboard'
            ? 'text-amber-700 font-bold scale-105'
            : 'text-zinc-500 hover:text-zinc-800 font-medium'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 mb-0.5 ${currentTab === 'dashboard' ? 'text-amber-600' : 'text-zinc-400'}`} />
        <span className="text-[10px] leading-tight">Beranda</span>
      </button>

      {/* 2. Gudang Kopi */}
      <button
        type="button"
        onClick={() => onSelectTab('green-beans')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl relative transition-all ${
          isGudangActive
            ? 'text-amber-700 font-bold scale-105'
            : 'text-zinc-500 hover:text-zinc-800 font-medium'
        }`}
      >
        <Wheat className={`w-5 h-5 mb-0.5 ${isGudangActive ? 'text-amber-600' : 'text-zinc-400'}`} />
        <span className="text-[10px] leading-tight">Gudang</span>
        {lowStockCount > 0 && (
          <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {/* 3. Perbankan 3 Kantong (Highlight Center Action) */}
      <button
        type="button"
        onClick={() => onSelectTab('banking')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
          currentTab === 'banking'
            ? 'text-indigo-600 font-bold scale-105'
            : 'text-zinc-600 hover:text-indigo-600 font-medium'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center -mt-3 shadow-md transition-all ${
            currentTab === 'banking'
              ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white ring-2 ring-indigo-200'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-200/80'
          }`}
        >
          <Wallet className="w-4 h-4" />
        </div>
        <span className="text-[10px] leading-tight font-semibold mt-0.5">Kantong</span>
      </button>

      {/* 4. Pesanan & Faktur */}
      <button
        type="button"
        onClick={() => onSelectTab('orders')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
          isPesananActive
            ? 'text-amber-700 font-bold scale-105'
            : 'text-zinc-500 hover:text-zinc-800 font-medium'
        }`}
      >
        <ShoppingCart className={`w-5 h-5 mb-0.5 ${isPesananActive ? 'text-amber-600' : 'text-zinc-400'}`} />
        <span className="text-[10px] leading-tight">Pesanan</span>
      </button>

      {/* 5. Semua Menu Drawer */}
      <button
        type="button"
        onClick={onOpenMenuDrawer}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all font-medium"
      >
        <Menu className="w-5 h-5 mb-0.5 text-zinc-500" />
        <span className="text-[10px] leading-tight">Menu</span>
      </button>
    </div>
  );
};
