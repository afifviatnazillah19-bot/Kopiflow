/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { InventoryManager } from './components/inventory/InventoryManager';
import { GreenBeansWarehouse } from './components/warehouse/GreenBeansWarehouse';
import { RoastedBeansWarehouse } from './components/warehouse/RoastedBeansWarehouse';
import { FinanceAndPricing } from './components/finance/FinanceAndPricing';
import { BatchManager } from './components/batches/BatchManager';
import { PartnerManager } from './components/relations/PartnerManager';
import { MovementsManager } from './components/movements/MovementsManager';
import { PricingMatrix } from './components/pricing/PricingMatrix';
import { OrderManager } from './components/orders/OrderManager';
import { InvoiceGenerator } from './components/orders/InvoiceGenerator';
import { RoastLab } from './components/roastlab/RoastLab';
import { ShipmentTracker } from './components/logistics/ShipmentTracker';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { DensityCalculator } from './components/density/DensityCalculator';
import { BatchScannerModal } from './components/scanner/BatchScannerModal';

import { DataSettingsManager } from './components/settings/DataSettingsManager';
import {
  CoffeeBean,
  Batch,
  RoastLog,
  Order,
  Shipment,
  NotificationLog,
  Partner,
  InboundMovement,
  OutboundMovement
} from './types/erp';
import {
  NEUTRAL_EMPTY_BEANS,
  NEUTRAL_EMPTY_BATCHES,
  NEUTRAL_EMPTY_ROASTS,
  NEUTRAL_EMPTY_ORDERS,
  NEUTRAL_EMPTY_SHIPMENTS,
  NEUTRAL_EMPTY_NOTIFICATIONS,
  NEUTRAL_EMPTY_PARTNERS,
  NEUTRAL_EMPTY_INBOUND,
  NEUTRAL_EMPTY_OUTBOUND
} from './data/initialData';
import {
  subscribeToBeans,
  subscribeToBatches,
  subscribeToRoastLogs,
  subscribeToOrders,
  subscribeToShipments,
  subscribeToNotifications,
  subscribeToPartners,
  subscribeToInbound,
  subscribeToOutbound,
  subscribeToRoasterStaff,
  subscribeToWarehouseHeads
} from './services/dbService';
import { testFirestoreConnection } from './firebase/config';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [triggerNewRoastModal, setTriggerNewRoastModal] = useState(false);

  // Real-time Database State (Initialized to neutral empty state)
  const [beans, setBeans] = useState<CoffeeBean[]>(NEUTRAL_EMPTY_BEANS);
  const [batches, setBatches] = useState<Batch[]>(NEUTRAL_EMPTY_BATCHES);
  const [roasts, setRoasts] = useState<RoastLog[]>(NEUTRAL_EMPTY_ROASTS);
  const [orders, setOrders] = useState<Order[]>(NEUTRAL_EMPTY_ORDERS);
  const [shipments, setShipments] = useState<Shipment[]>(NEUTRAL_EMPTY_SHIPMENTS);
  const [notifications, setNotifications] = useState<NotificationLog[]>(NEUTRAL_EMPTY_NOTIFICATIONS);
  const [partners, setPartners] = useState<Partner[]>(NEUTRAL_EMPTY_PARTNERS);
  const [inbound, setInbound] = useState<InboundMovement[]>(NEUTRAL_EMPTY_INBOUND);
  const [outbound, setOutbound] = useState<OutboundMovement[]>(NEUTRAL_EMPTY_OUTBOUND);

  // Initialize Firestore listeners on mount
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initialize = async () => {
      setIsSyncing(true);
      await testFirestoreConnection();

      // Attach real-time listeners for all collections
      const unsubBeans = subscribeToBeans(setBeans, NEUTRAL_EMPTY_BEANS);
      const unsubBatches = subscribeToBatches(setBatches, NEUTRAL_EMPTY_BATCHES);
      const unsubRoasts = subscribeToRoastLogs(setRoasts, NEUTRAL_EMPTY_ROASTS);
      const unsubOrders = subscribeToOrders(setOrders, NEUTRAL_EMPTY_ORDERS);
      const unsubShipments = subscribeToShipments(setShipments, NEUTRAL_EMPTY_SHIPMENTS);
      const unsubNotifs = subscribeToNotifications(setNotifications, NEUTRAL_EMPTY_NOTIFICATIONS);
      const unsubPartners = subscribeToPartners(setPartners, NEUTRAL_EMPTY_PARTNERS);
      const unsubInb = subscribeToInbound(setInbound, NEUTRAL_EMPTY_INBOUND);
      const unsubOut = subscribeToOutbound(setOutbound, NEUTRAL_EMPTY_OUTBOUND);
      const unsubRst = subscribeToRoasterStaff(() => {});
      const unsubWh = subscribeToWarehouseHeads(() => {});

      unsubs = [
        unsubBeans,
        unsubBatches,
        unsubRoasts,
        unsubOrders,
        unsubShipments,
        unsubNotifs,
        unsubPartners,
        unsubInb,
        unsubOut,
        unsubRst,
        unsubWh
      ];
      setIsSyncing(false);
    };

    initialize();

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    await testFirestoreConnection();
    setTimeout(() => setIsSyncing(false), 500);
  };

  // Metrics for badges
  const lowStockCount = beans.filter((b) => b.stockGreenKg <= b.minAlertKg).length;
  const activeShipmentsCount = shipments.filter(
    (s) => s.status !== 'Delivered' && s.status !== 'Returned'
  ).length;

  return (
    <div className="flex flex-col h-full h-screen w-full bg-zinc-100 font-sans text-zinc-900 antialiased overflow-hidden overscroll-none">
      {/* Top Header with Modern Top Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewBatchModal={() => setCurrentTab('batches')}
        onOpenNewRoastModal={() => {
          setCurrentTab('roastlab');
          setTriggerNewRoastModal(true);
        }}
        onOpenNewOrderModal={() => setCurrentTab('orders')}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onGoToNotifications={() => setCurrentTab('notifications')}
        onGoToMovements={() => setCurrentTab('movements')}
        onGoToRelations={() => setCurrentTab('relations')}
        onGoToSettings={() => setCurrentTab('settings')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSyncing={isSyncing}
        onManualRefresh={handleManualRefresh}
        lowStockCount={lowStockCount}
        activeShipmentsCount={activeShipmentsCount}
        partnersCount={partners.length}
      />

      {/* Scrollable Viewport Container with overscroll containment */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-4 md:p-6 lg:p-8 touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && (
              <OverviewDashboard
                beans={beans}
                batches={batches}
                roasts={roasts}
                orders={orders}
                shipments={shipments}
                onNavigate={setCurrentTab}
                onOpenNewBatchModal={() => setCurrentTab('batches')}
                onOpenNewRoastModal={() => {
                  setCurrentTab('roastlab');
                  setTriggerNewRoastModal(true);
                }}
              />
            )}

            {currentTab === 'green-beans' && (
              <GreenBeansWarehouse
                beans={beans}
                batches={batches}
                inbound={inbound}
                partners={partners}
                onRefresh={handleManualRefresh}
                onTransferToRoastLab={(beanId, lotNumber) => {
                  setCurrentTab('roastlab');
                  setTriggerNewRoastModal(true);
                }}
              />
            )}

            {currentTab === 'density' && (
              <DensityCalculator
                beans={beans}
                batches={batches}
                onRefresh={handleManualRefresh}
              />
            )}

            {currentTab === 'roasted-beans' && (
              <RoastedBeansWarehouse
                beans={beans}
                roasts={roasts}
                onRefresh={handleManualRefresh}
                onOpenNewOrder={(beanId) => {
                  setCurrentTab('orders');
                }}
              />
            )}


            {(currentTab === 'finance' || currentTab === 'pricing') && (
              <FinanceAndPricing
                beans={beans}
                orders={orders}
                onRefresh={handleManualRefresh}
                onNavigateToShipping={() => setCurrentTab('logistics')}
                onNavigateToOrders={() => setCurrentTab('orders')}
              />
            )}

            {currentTab === 'relations' && (
              <PartnerManager partners={partners} onRefresh={handleManualRefresh} />
            )}

            {currentTab === 'movements' && (
              <MovementsManager
                inbound={inbound}
                outbound={outbound}
                partners={partners}
                beans={beans}
                batches={batches}
                onRefresh={handleManualRefresh}
              />
            )}

            {currentTab === 'inventory' && (
              <GreenBeansWarehouse
                beans={beans}
                batches={batches}
                inbound={inbound}
                partners={partners}
                onRefresh={handleManualRefresh}
                onTransferToRoastLab={(beanId, lotNumber) => {
                  setCurrentTab('roastlab');
                  setTriggerNewRoastModal(true);
                }}
              />
            )}

            {currentTab === 'batches' && (
              <BatchManager
                batches={batches}
                beans={beans}
                onRefresh={handleManualRefresh}
                onOpenScanner={() => setIsScannerModalOpen(true)}
              />
            )}

            {currentTab === 'orders' && (
              <OrderManager orders={orders} beans={beans} partners={partners} onRefresh={handleManualRefresh} />
            )}

            {currentTab === 'invoice' && (
              <InvoiceGenerator
                orders={orders}
                beans={beans}
                onRefresh={handleManualRefresh}
              />
            )}

            {currentTab === 'roastlab' && (
              <RoastLab
                roasts={roasts}
                beans={beans}
                batches={batches}
                onRefresh={handleManualRefresh}
                isNewModalOpenExternally={triggerNewRoastModal}
                onCloseExternalModal={() => setTriggerNewRoastModal(false)}
              />
            )}

            {currentTab === 'logistics' && (
              <ShipmentTracker
                shipments={shipments}
                orders={orders}
                onRefresh={handleManualRefresh}
              />
            )}

            {currentTab === 'notifications' && (
              <NotificationCenter
                notifications={notifications}
                beans={beans}
                orders={orders}
                shipments={shipments}
                roasts={roasts}
                onRefresh={handleManualRefresh}
              />
            )}

            {currentTab === 'settings' && (
              <DataSettingsManager
                beans={beans}
                batches={batches}
                roasts={roasts}
                orders={orders}
                shipments={shipments}
                notifications={notifications}
                partners={partners}
                inbound={inbound}
                outbound={outbound}
              />
            )}
          </div>
        </main>

      {/* Global Quick QR / Barcode Scanner Modal */}
      <BatchScannerModal
        batches={batches}
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onSelectBatch={(batch) => {
          setCurrentTab('batches');
        }}
      />
    </div>
  );
}
