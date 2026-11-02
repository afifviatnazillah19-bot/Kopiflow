import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { ref as rtdbRef, set as rtdbSet, remove as rtdbRemove } from 'firebase/database';
import { db, rtdb, handleFirestoreError, OperationType } from '../firebase/config';
import {
  CoffeeBean,
  Batch,
  RoastLog,
  Order,
  Shipment,
  NotificationLog,
  Partner,
  InboundMovement,
  OutboundMovement,
  PricingTier,
  QrisPaymentConfig,
  BusinessNotificationConfig,
  OpenWaConfig,
  WhatsAppProvider
} from '../types/erp';
import {
  ACEH_LOKET_PRESETS,
  SAMPLE_PARTNERS,
  SAMPLE_BEANS,
  SAMPLE_BATCHES,
  SAMPLE_INBOUND,
  SAMPLE_OUTBOUND
} from '../data/initialData';

export const COLLECTIONS = {
  BEANS: 'coffee_beans',
  BATCHES: 'batches',
  ROAST_LOGS: 'roast_logs',
  ORDERS: 'orders',
  SHIPMENTS: 'shipments',
  NOTIFICATIONS: 'notifications',
  PARTNERS: 'partners',
  INBOUND: 'inbound_movements',
  OUTBOUND: 'outbound_movements',
  SETTINGS: 'system_settings'
} as const;

// Local Reactive Store & Cache Helpers
const LOCAL_STORAGE_PREFIX = 'kopiflow_erp_';
const memoryStore = new Map<string, any>();

export function getLocalCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    let raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    if (!raw) {
      raw = sessionStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryStore.set(key, parsed);
      return parsed;
    }
  } catch (err) {
    console.debug(`Read cache fallback for ${key}:`, err);
  }
  if (memoryStore.has(key)) {
    return memoryStore.get(key) as T;
  }
  return fallback;
}

export function setLocalCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  memoryStore.set(key, data);
  const serialized = JSON.stringify(data);
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, serialized);
  } catch (quotaErr) {
    try {
      sessionStorage.setItem(LOCAL_STORAGE_PREFIX + key, serialized);
    } catch {
      // Memory store is already populated
    }
  }
  try {
    window.dispatchEvent(new CustomEvent(`kopiflow_update_${key}`, { detail: data }));
  } catch {
    // Non-blocking dispatch
  }
}

// Safe Firestore write helper that never hangs if offline or slow
export async function safeFirestoreWrite(promise: Promise<any>, timeoutMs: number = 1200): Promise<void> {
  let timeoutId: any;
  const timeoutPromise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      console.debug(`Firestore write timed out after ${timeoutMs}ms, proceeding with local offline cache.`);
      resolve();
    }, timeoutMs);
  });

  try {
    await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function listenLocalCache<T>(key: string, callback: (data: T) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<T>;
    if (custom && custom.detail !== undefined) {
      callback(custom.detail);
    }
  };
  window.addEventListener(`kopiflow_update_${key}`, handler);
  return () => window.removeEventListener(`kopiflow_update_${key}`, handler);
}

// Real-time Subscriptions with Local Fallback and Firestore Auto-sync
export function subscribeToBeans(
  callback: (beans: CoffeeBean[]) => void,
  fallback: CoffeeBean[]
): () => void {
  const path = COLLECTIONS.BEANS;
  callback(getLocalCache<CoffeeBean[]>(path, fallback));

  const localUnsub = listenLocalCache<CoffeeBean[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as CoffeeBean));
        setLocalCache(path, items);
        callback(items);
      },
      (error) => {
        console.warn('Real-time listener fallback on beans:', error?.message || error);
        callback(getLocalCache<CoffeeBean[]>(path, fallback));
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on beans:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function subscribeToBatches(
  callback: (batches: Batch[]) => void,
  fallback: Batch[]
): () => void {
  const path = COLLECTIONS.BATCHES;
  callback(getLocalCache<Batch[]>(path, fallback));

  const localUnsub = listenLocalCache<Batch[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Batch));
        setLocalCache(path, items);
        callback(items);
      },
      (error) => {
        console.warn('Real-time listener fallback on batches:', error?.message || error);
        callback(getLocalCache<Batch[]>(path, fallback));
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on batches:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function subscribeToRoastLogs(
  callback: (roasts: RoastLog[]) => void,
  fallback: RoastLog[]
): () => void {
  const path = COLLECTIONS.ROAST_LOGS;
  callback(getLocalCache<RoastLog[]>(path, fallback));

  const localUnsub = listenLocalCache<RoastLog[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as RoastLog));
        setLocalCache(path, items);
        callback(items);
      },
      (error) => {
        console.warn('Real-time listener fallback on roast_logs:', error?.message || error);
        callback(getLocalCache<RoastLog[]>(path, fallback));
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on roast_logs:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function subscribeToOrders(
  callback: (orders: Order[]) => void,
  fallback: Order[]
): () => void {
  const path = COLLECTIONS.ORDERS;
  callback(getLocalCache<Order[]>(path, fallback));

  const localUnsub = listenLocalCache<Order[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Order));
        setLocalCache(path, items);
        callback(items);
      },
      (error) => {
        console.warn('Real-time listener fallback on orders:', error?.message || error);
        callback(getLocalCache<Order[]>(path, fallback));
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on orders:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function subscribeToShipments(
  callback: (shipments: Shipment[]) => void,
  fallback: Shipment[]
): () => void {
  const path = COLLECTIONS.SHIPMENTS;
  callback(getLocalCache<Shipment[]>(path, fallback));

  const localUnsub = listenLocalCache<Shipment[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Shipment));
        setLocalCache(path, items);
        callback(items);
      },
      (error) => {
        console.warn('Real-time listener fallback on shipments:', error?.message || error);
        callback(getLocalCache<Shipment[]>(path, fallback));
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on shipments:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function subscribeToPartners(
  callback: (partners: Partner[]) => void,
  fallback: Partner[]
): () => void {
  const path = COLLECTIONS.PARTNERS;
  const initial = getLocalCache<Partner[]>(path, fallback);
  callback(initial.length > 0 ? initial : fallback);

  const localUnsub = listenLocalCache<Partner[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Partner));
        if (items.length > 0) {
          setLocalCache(path, items);
          callback(items);
        }
      },
      (error) => {
        console.warn('Real-time listener fallback on partners:', error?.message || error);
        const current = getLocalCache<Partner[]>(path, fallback);
        callback(current.length > 0 ? current : fallback);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on partners:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function subscribeToInbound(
  callback: (inbound: InboundMovement[]) => void,
  fallback: InboundMovement[]
): () => void {
  const path = COLLECTIONS.INBOUND;
  callback(getLocalCache<InboundMovement[]>(path, fallback));

  const localUnsub = listenLocalCache<InboundMovement[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as InboundMovement));
        setLocalCache(path, items);
        callback(items);
      },
      (error) => {
        console.warn('Real-time listener fallback on inbound:', error?.message || error);
        callback(getLocalCache<InboundMovement[]>(path, fallback));
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on inbound:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function subscribeToOutbound(
  callback: (outbound: OutboundMovement[]) => void,
  fallback: OutboundMovement[]
): () => void {
  const path = COLLECTIONS.OUTBOUND;
  callback(getLocalCache<OutboundMovement[]>(path, fallback));

  const localUnsub = listenLocalCache<OutboundMovement[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as OutboundMovement));
        setLocalCache(path, items);
        callback(items);
      },
      (error) => {
        console.warn('Real-time listener fallback on outbound:', error?.message || error);
        callback(getLocalCache<OutboundMovement[]>(path, fallback));
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on outbound:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function subscribeToNotifications(
  callback: (notifs: NotificationLog[]) => void,
  fallback: NotificationLog[]
): () => void {
  const path = COLLECTIONS.NOTIFICATIONS;
  callback(getLocalCache<NotificationLog[]>(path, fallback));

  const localUnsub = listenLocalCache<NotificationLog[]>(path, (data) => {
    callback(data);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as NotificationLog));
        setLocalCache(path, items);
        callback(items);
      },
      (error) => {
        console.warn('Real-time listener fallback on notifications:', error?.message || error);
        callback(getLocalCache<NotificationLog[]>(path, fallback));
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on notifications:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

// Helper to recursively remove undefined fields so Firestore setDoc / updateDoc never fails
export function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = removeUndefined(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// Auto-sync helper to Firebase Realtime Database
export async function syncToRTDB(collectionName: string, id: string, data: any | null): Promise<void> {
  if (!rtdb) return;
  try {
    const nodeRef = rtdbRef(rtdb, `${collectionName}/${id}`);
    if (data === null) {
      await rtdbRemove(nodeRef);
    } else {
      await rtdbSet(nodeRef, data);
    }
  } catch (err) {
    // Non-blocking RTDB sync attempt
    console.debug('Firebase Realtime Database sync notice:', err);
  }
}

// Data Mutation Operations with Immediate Local Cache & Cloud Firestore Sync
export async function saveBean(bean: CoffeeBean): Promise<void> {
  const path = `${COLLECTIONS.BEANS}/${bean.id}`;
  const current = getLocalCache<CoffeeBean[]>(COLLECTIONS.BEANS, []);
  const idx = current.findIndex((b) => b.id === bean.id);
  const updated = idx >= 0 ? current.map((b) => (b.id === bean.id ? bean : b)) : [...current, bean];
  setLocalCache(COLLECTIONS.BEANS, updated);

  try {
    const payload = removeUndefined({
      ...bean,
      updatedAt: new Date().toISOString()
    });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.BEANS, bean.id), payload));
    await syncToRTDB(COLLECTIONS.BEANS, bean.id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateBeanStock(
  beanId: string,
  stockGreenDelta: number,
  stockRoastedDelta: number,
  beansList: CoffeeBean[]
): Promise<void> {
  const currentBeans = getLocalCache<CoffeeBean[]>(COLLECTIONS.BEANS, beansList);
  const bean = currentBeans.find((b) => b.id === beanId);
  if (!bean) return;

  const newGreen = Math.max(0, bean.stockGreenKg + stockGreenDelta);
  const newRoasted = Math.max(0, bean.stockRoastedKg + stockRoastedDelta);
  const updatedBean = {
    ...bean,
    stockGreenKg: newGreen,
    stockRoastedKg: newRoasted,
    updatedAt: new Date().toISOString()
  };
  setLocalCache(
    COLLECTIONS.BEANS,
    currentBeans.map((b) => (b.id === beanId ? updatedBean : b))
  );

  const path = `${COLLECTIONS.BEANS}/${beanId}`;
  try {
    const updateData = {
      stockGreenKg: newGreen,
      stockRoastedKg: newRoasted,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, COLLECTIONS.BEANS, beanId), updateData);
    await syncToRTDB(COLLECTIONS.BEANS, beanId, { ...bean, ...updateData });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveBatch(
  batch: Batch,
  beansList?: CoffeeBean[],
  autoUpdateBeanStock: boolean = true
): Promise<void> {
  const path = `${COLLECTIONS.BATCHES}/${batch.id}`;
  const currentBatches = getLocalCache<Batch[]>(COLLECTIONS.BATCHES, []);
  const idx = currentBatches.findIndex((b) => b.id === batch.id);
  const updatedBatches = idx >= 0 ? currentBatches.map((b) => (b.id === batch.id ? batch : b)) : [...currentBatches, batch];
  setLocalCache(COLLECTIONS.BATCHES, updatedBatches);

  if (autoUpdateBeanStock && batch.beanId && beansList) {
    updateBeanStock(batch.beanId, batch.quantityRemainingKg, 0, beansList);
  }

  try {
    const payload = removeUndefined({
      ...batch,
      updatedAt: new Date().toISOString()
    });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.BATCHES, batch.id), payload));
    await syncToRTDB(COLLECTIONS.BATCHES, batch.id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateBatchStatus(batchId: string, status: Batch['status']): Promise<void> {
  const path = `${COLLECTIONS.BATCHES}/${batchId}`;
  const current = getLocalCache<Batch[]>(COLLECTIONS.BATCHES, []);
  setLocalCache(
    COLLECTIONS.BATCHES,
    current.map((b) => (b.id === batchId ? { ...b, status, updatedAt: new Date().toISOString() } : b))
  );

  try {
    const data = {
      status,
      updatedAt: new Date().toISOString()
    };
    await safeFirestoreWrite(updateDoc(doc(db, COLLECTIONS.BATCHES, batchId), data));
    await syncToRTDB(COLLECTIONS.BATCHES, batchId, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const path = `${COLLECTIONS.ORDERS}/${orderId}`;
  const current = getLocalCache<Order[]>(COLLECTIONS.ORDERS, []);
  setLocalCache(
    COLLECTIONS.ORDERS,
    current.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
  );

  try {
    const data = {
      status,
      updatedAt: new Date().toISOString()
    };
    await safeFirestoreWrite(updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), data));
    await syncToRTDB(COLLECTIONS.ORDERS, orderId, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: Order['paymentStatus']
): Promise<void> {
  const path = `${COLLECTIONS.ORDERS}/${orderId}`;
  const current = getLocalCache<Order[]>(COLLECTIONS.ORDERS, []);
  setLocalCache(
    COLLECTIONS.ORDERS,
    current.map((o) => (o.id === orderId ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o))
  );

  try {
    const data = {
      paymentStatus,
      updatedAt: new Date().toISOString()
    };
    await safeFirestoreWrite(updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), data));
    await syncToRTDB(COLLECTIONS.ORDERS, orderId, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function savePartner(partner: Partner): Promise<void> {
  const path = `${COLLECTIONS.PARTNERS}/${partner.id}`;
  const current = getLocalCache<Partner[]>(COLLECTIONS.PARTNERS, []);
  const idx = current.findIndex((p) => p.id === partner.id);
  const updated = idx >= 0 ? current.map((p) => (p.id === partner.id ? partner : p)) : [...current, partner];
  setLocalCache(COLLECTIONS.PARTNERS, updated);

  try {
    const payload = removeUndefined({ ...partner });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.PARTNERS, partner.id), payload));
    await syncToRTDB(COLLECTIONS.PARTNERS, partner.id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePartner(partnerId: string): Promise<void> {
  const path = `${COLLECTIONS.PARTNERS}/${partnerId}`;
  const current = getLocalCache<Partner[]>(COLLECTIONS.PARTNERS, []);
  setLocalCache(
    COLLECTIONS.PARTNERS,
    current.filter((p) => p.id !== partnerId)
  );

  try {
    await safeFirestoreWrite(deleteDoc(doc(db, COLLECTIONS.PARTNERS, partnerId)));
    await syncToRTDB(COLLECTIONS.PARTNERS, partnerId, null);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// BARANG MASUK: Record inbound & auto-add warehouse stock
export async function saveInboundMovement(
  movement: InboundMovement,
  beansList: CoffeeBean[]
): Promise<void> {
  const path = `${COLLECTIONS.INBOUND}/${movement.id}`;
  const current = getLocalCache<InboundMovement[]>(COLLECTIONS.INBOUND, []);
  const idx = current.findIndex((m) => m.id === movement.id);
  const updated = idx >= 0 ? current.map((m) => (m.id === movement.id ? movement : m)) : [...current, movement];
  setLocalCache(COLLECTIONS.INBOUND, updated);

  // Otomatis tambah saldo stok biji mentah (Green Bean) di gudang
  if (movement.beanId) {
    updateBeanStock(movement.beanId, movement.weightKg, 0, beansList);
  }

  try {
    const payload = removeUndefined({ ...movement });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.INBOUND, movement.id), payload));
    await syncToRTDB(COLLECTIONS.INBOUND, movement.id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// BARANG KELUAR: Record outbound & auto-deduct warehouse stock
export async function saveOutboundMovement(
  movement: OutboundMovement,
  beansList: CoffeeBean[]
): Promise<void> {
  const path = `${COLLECTIONS.OUTBOUND}/${movement.id}`;
  const current = getLocalCache<OutboundMovement[]>(COLLECTIONS.OUTBOUND, []);
  const idx = current.findIndex((m) => m.id === movement.id);
  const updated = idx >= 0 ? current.map((m) => (m.id === movement.id ? movement : m)) : [...current, movement];
  setLocalCache(COLLECTIONS.OUTBOUND, updated);

  // Otomatis kurangi stok fisik di gudang
  if (movement.beanId) {
    if (movement.itemType === 'Green Bean') {
      updateBeanStock(movement.beanId, -movement.quantityKg, 0, beansList);
    } else {
      updateBeanStock(movement.beanId, 0, -movement.quantityKg, beansList);
    }
  }

  try {
    const payload = removeUndefined({ ...movement });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.OUTBOUND, movement.id), payload));
    await syncToRTDB(COLLECTIONS.OUTBOUND, movement.id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveRoastLog(
  roastLog: RoastLog,
  beansList: CoffeeBean[],
  batchesList: Batch[]
): Promise<void> {
  const path = `${COLLECTIONS.ROAST_LOGS}/${roastLog.id}`;
  const current = getLocalCache<RoastLog[]>(COLLECTIONS.ROAST_LOGS, []);
  const idx = current.findIndex((r) => r.id === roastLog.id);
  const updated = idx >= 0 ? current.map((r) => (r.id === roastLog.id ? roastLog : r)) : [...current, roastLog];
  setLocalCache(COLLECTIONS.ROAST_LOGS, updated);

  if (roastLog.status === 'Passed QC' && roastLog.beanId) {
    const greenKg = roastLog.greenWeightGrams / 1000;
    const roastedKg = roastLog.roastedWeightGrams / 1000;
    updateBeanStock(roastLog.beanId, -greenKg, roastedKg, beansList);

    if (roastLog.batchLotNumber) {
      const batch = batchesList.find((b) => b.lotNumber === roastLog.batchLotNumber);
      if (batch) {
        const newQty = Math.max(0, batch.quantityRemainingKg - greenKg);
        const updatedBatch = {
          ...batch,
          quantityRemainingKg: newQty,
          status: (newQty === 0 ? 'Depleted' : 'In Stock') as Batch['status'],
          updatedAt: new Date().toISOString()
        };
        const currentBatches = getLocalCache<Batch[]>(COLLECTIONS.BATCHES, batchesList);
        setLocalCache(
          COLLECTIONS.BATCHES,
          currentBatches.map((b) => (b.id === batch.id ? updatedBatch : b))
        );
      }
    }
  }

  try {
    const payload = removeUndefined({ ...roastLog });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.ROAST_LOGS, roastLog.id), payload));
    await syncToRTDB(COLLECTIONS.ROAST_LOGS, roastLog.id, payload);

    if (roastLog.status === 'Passed QC' && roastLog.beanId && roastLog.batchLotNumber) {
      const greenKg = roastLog.greenWeightGrams / 1000;
      const batch = batchesList.find((b) => b.lotNumber === roastLog.batchLotNumber);
      if (batch) {
        const newQty = Math.max(0, batch.quantityRemainingKg - greenKg);
        await safeFirestoreWrite(updateDoc(doc(db, COLLECTIONS.BATCHES, batch.id), {
          quantityRemainingKg: newQty,
          status: newQty === 0 ? 'Depleted' : 'In Stock',
          updatedAt: new Date().toISOString()
        }));
        await syncToRTDB(COLLECTIONS.BATCHES, batch.id, {
          quantityRemainingKg: newQty,
          status: newQty === 0 ? 'Depleted' : 'In Stock',
          updatedAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveOrder(order: Order, beansList: CoffeeBean[]): Promise<void> {
  const path = `${COLLECTIONS.ORDERS}/${order.id}`;
  const current = getLocalCache<Order[]>(COLLECTIONS.ORDERS, []);
  const idx = current.findIndex((o) => o.id === order.id);
  const updated = idx >= 0 ? current.map((o) => (o.id === order.id ? order : o)) : [...current, order];
  setLocalCache(COLLECTIONS.ORDERS, updated);

  for (const item of order.items) {
    if (item.type === 'Green Bean') {
      updateBeanStock(item.beanId, -item.quantityKg, 0, beansList);
    } else {
      updateBeanStock(item.beanId, 0, -item.quantityKg, beansList);
    }
  }

  try {
    const payload = removeUndefined({
      ...order,
      updatedAt: new Date().toISOString()
    });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.ORDERS, order.id), payload));
    await syncToRTDB(COLLECTIONS.ORDERS, order.id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveShipment(shipment: Shipment): Promise<void> {
  const path = `${COLLECTIONS.SHIPMENTS}/${shipment.id}`;
  const current = getLocalCache<Shipment[]>(COLLECTIONS.SHIPMENTS, []);
  const idx = current.findIndex((s) => s.id === shipment.id);
  const updated = idx >= 0 ? current.map((s) => (s.id === shipment.id ? shipment : s)) : [...current, shipment];
  setLocalCache(COLLECTIONS.SHIPMENTS, updated);

  try {
    const payload = removeUndefined({
      ...shipment,
      updatedAt: new Date().toISOString()
    });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.SHIPMENTS, shipment.id), payload));
    await syncToRTDB(COLLECTIONS.SHIPMENTS, shipment.id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateShipmentStatus(
  shipmentId: string,
  status: Shipment['status'],
  deliveredAt?: string
): Promise<void> {
  const path = `${COLLECTIONS.SHIPMENTS}/${shipmentId}`;
  const current = getLocalCache<Shipment[]>(COLLECTIONS.SHIPMENTS, []);
  setLocalCache(
    COLLECTIONS.SHIPMENTS,
    current.map((s) =>
      s.id === shipmentId
        ? { ...s, status, deliveredAt: deliveredAt || s.deliveredAt, updatedAt: new Date().toISOString() }
        : s
    )
  );

  try {
    const data: Partial<Shipment> = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (deliveredAt) {
      data.deliveredAt = deliveredAt;
    }
    const cleanData = removeUndefined(data);
    await safeFirestoreWrite(updateDoc(doc(db, COLLECTIONS.SHIPMENTS, shipmentId), cleanData));
    await syncToRTDB(COLLECTIONS.SHIPMENTS, shipmentId, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveNotificationLog(log: NotificationLog): Promise<void> {
  const path = `${COLLECTIONS.NOTIFICATIONS}/${log.id}`;
  const current = getLocalCache<NotificationLog[]>(COLLECTIONS.NOTIFICATIONS, []);
  setLocalCache(COLLECTIONS.NOTIFICATIONS, [log, ...current]);

  try {
    const payload = removeUndefined({ ...log });
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, log.id), payload));
    await syncToRTDB(COLLECTIONS.NOTIFICATIONS, log.id, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// RESET SEMUA DATA UNTUK PENGUJIAN MURNI (Clean / Neutral Mode)
export async function clearAllCollections(): Promise<void> {
  const allColls = [
    COLLECTIONS.BEANS,
    COLLECTIONS.BATCHES,
    COLLECTIONS.ROAST_LOGS,
    COLLECTIONS.ORDERS,
    COLLECTIONS.SHIPMENTS,
    COLLECTIONS.NOTIFICATIONS,
    COLLECTIONS.PARTNERS,
    COLLECTIONS.INBOUND,
    COLLECTIONS.OUTBOUND
  ];

  allColls.forEach((col) => setLocalCache(col, []));

  try {
    for (const collName of allColls) {
      const snap = await getDocs(collection(db, collName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (error) {
    console.warn('Notice while clearing Firestore collections:', error);
  }
}

// Hapus spesifik koleksi tertentu
export async function clearCollection(collKey: keyof typeof COLLECTIONS): Promise<void> {
  const collectionName = COLLECTIONS[collKey];
  setLocalCache(collectionName, []);

  try {
    const snap = await getDocs(collection(db, collectionName));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    console.warn(`Notice while clearing collection ${collectionName}:`, error);
  }
}


// POPULASI TEMPLATE DATA UJI COBA NETRAL DENGAN LOKET ACEH
export async function seedNeutralTestData(): Promise<void> {
  setLocalCache(COLLECTIONS.PARTNERS, SAMPLE_PARTNERS);
  setLocalCache(COLLECTIONS.BEANS, SAMPLE_BEANS);
  setLocalCache(COLLECTIONS.BATCHES, SAMPLE_BATCHES);
  setLocalCache(COLLECTIONS.INBOUND, SAMPLE_INBOUND);
  setLocalCache(COLLECTIONS.OUTBOUND, SAMPLE_OUTBOUND);

  try {
    const batch = writeBatch(db);

    SAMPLE_PARTNERS.forEach((p) => {
      batch.set(doc(db, COLLECTIONS.PARTNERS, p.id), p);
    });

    SAMPLE_BEANS.forEach((b) => {
      batch.set(doc(db, COLLECTIONS.BEANS, b.id), b);
    });

    SAMPLE_BATCHES.forEach((bt) => {
      batch.set(doc(db, COLLECTIONS.BATCHES, bt.id), bt);
    });

    SAMPLE_INBOUND.forEach((inb) => {
      batch.set(doc(db, COLLECTIONS.INBOUND, inb.id), inb);
    });

    SAMPLE_OUTBOUND.forEach((out) => {
      batch.set(doc(db, COLLECTIONS.OUTBOUND, out.id), out);
    });

    await batch.commit();
  } catch (error) {
    console.warn('Notice while seeding neutral test data to Firestore:', error);
  }
}

// Formatters
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export function getPriceByTier(bean: CoffeeBean, tier: PricingTier): number {
  switch (tier) {
    case 'Lokal':
      return bean.priceLocalPerKg;
    case 'UMKM':
      return bean.priceUmkmPerKg;
    case 'Luar Pulau':
      return bean.priceLuarPulauPerKg;
  }
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// QRIS & GoPay Configuration Management
export const DEFAULT_QRIS_CONFIG: QrisPaymentConfig = {
  merchantName: 'Kofiara Roastery Lhokseumawe',
  qrisImageUrl: '', // User will upload their GoPay QRIS image
  gopayNumber: '0812-6900-8899',
  accountHolder: 'Kofiara Roastery - Hub Lhokseumawe',
  paymentInstructions: 'Scan QRIS via aplikasi GoPay atau aplikasi m-Banking apa saja (BCA, Mandiri, BRI, BSI, Dana, OVO, ShopeePay). Masukkan nominal sesuai total tagihan faktur.',
  alternativeBankAccounts: [
    {
      id: 'bank-mandiri',
      bankName: 'Bank Mandiri',
      accountNumber: '137-00-19283-009',
      accountHolder: 'PT Kofiara Nusantara Berjaya',
      isPrimary: true
    },
    {
      id: 'bank-bca',
      bankName: 'BCA (Bank Central Asia)',
      accountNumber: '872-0091-233',
      accountHolder: 'PT Kofiara Nusantara Berjaya',
      isPrimary: false
    },
    {
      id: 'bank-bsi',
      bankName: 'Bank Syariah Indonesia (BSI)',
      accountNumber: '714-8899-012',
      accountHolder: 'Kofiara Roastery Hub Lhokseumawe',
      isPrimary: false
    }
  ],
  updatedAt: new Date().toISOString()
};

export function getQrisConfig(): QrisPaymentConfig {
  return getLocalCache<QrisPaymentConfig>('qris_payment_config', DEFAULT_QRIS_CONFIG);
}

export async function saveQrisConfig(config: QrisPaymentConfig): Promise<void> {
  const updated = {
    ...config,
    updatedAt: new Date().toISOString()
  };
  setLocalCache('qris_payment_config', updated);

  try {
    const payload = removeUndefined(updated);
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.SETTINGS, 'qris_payment'), payload));
    await syncToRTDB(COLLECTIONS.SETTINGS, 'qris_payment', payload);
  } catch (error) {
    console.warn('Notice saving QRIS config to Firestore:', error);
  }
}

export function subscribeToQrisConfig(
  callback: (config: QrisPaymentConfig) => void
): () => void {
  const initial = getQrisConfig();
  callback(initial);

  const localUnsub = listenLocalCache<QrisPaymentConfig>('qris_payment_config', (data) => {
    callback(data || DEFAULT_QRIS_CONFIG);
  });

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      doc(db, COLLECTIONS.SETTINGS, 'qris_payment'),
      (snapshot) => {
        if (snapshot.exists()) {
          const cfg = snapshot.data() as QrisPaymentConfig;
          setLocalCache('qris_payment_config', cfg);
          callback(cfg);
        }
      },
      (error) => {
        console.warn('Real-time listener notice on QRIS config:', error?.message || error);
        callback(getQrisConfig());
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on QRIS config:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

// -------------------------------------------------------------
// KONFIGURASI NOTIFIKASI BISNIS & AUTOMATISASI STOK MENIPIS GUDANG
// -------------------------------------------------------------
export const DEFAULT_OPENWA_CONFIG: OpenWaConfig = {
  enabled: false,
  provider: 'direct',
  serverUrl: 'http://localhost:8080',
  apiKey: '',
  sessionId: 'kopiflow',
  autoFallbackToDirect: true
};

export const DEFAULT_NOTIFICATION_CONFIG: BusinessNotificationConfig = {
  businessWhatsApp: '6281269008899',
  businessEmail: 'afifviatnazillah19@gmail.com',
  managerName: 'Kepala Gudang & Roastery KopiFlow',
  autoSendEnabled: true,
  defaultMinThresholdKg: 100,
  notifyOnGreenLow: true,
  notifyOnRoastedLow: true,
  openWa: DEFAULT_OPENWA_CONFIG,
  updatedAt: new Date().toISOString()
};

export function getNotificationConfig(): BusinessNotificationConfig {
  return getLocalCache<BusinessNotificationConfig>(
    'business_notification_config',
    DEFAULT_NOTIFICATION_CONFIG
  );
}

export async function saveNotificationConfig(config: BusinessNotificationConfig): Promise<void> {
  const updated = {
    ...config,
    updatedAt: new Date().toISOString()
  };
  setLocalCache('business_notification_config', updated);

  try {
    const payload = removeUndefined(updated);
    await safeFirestoreWrite(setDoc(doc(db, COLLECTIONS.SETTINGS, 'notification_config'), payload));
    await syncToRTDB(COLLECTIONS.SETTINGS, 'notification_config', payload);
  } catch (error) {
    console.warn('Notice saving notification config to Firestore:', error);
  }
}

export function subscribeToNotificationConfig(
  callback: (config: BusinessNotificationConfig) => void
): () => void {
  const initial = getNotificationConfig();
  callback(initial);

  const localUnsub = listenLocalCache<BusinessNotificationConfig>(
    'business_notification_config',
    (data) => {
      callback(data || DEFAULT_NOTIFICATION_CONFIG);
    }
  );

  let firestoreUnsub: (() => void) | null = null;
  try {
    firestoreUnsub = onSnapshot(
      doc(db, COLLECTIONS.SETTINGS, 'notification_config'),
      (snapshot) => {
        if (snapshot.exists()) {
          const cfg = snapshot.data() as BusinessNotificationConfig;
          setLocalCache('business_notification_config', cfg);
          callback(cfg);
        }
      },
      (error) => {
        console.warn('Real-time listener notice on notification config:', error?.message || error);
        callback(getNotificationConfig());
      }
    );
  } catch (err) {
    console.warn('Subscription init warning on notification config:', err);
  }

  return () => {
    localUnsub();
    if (firestoreUnsub) firestoreUnsub();
  };
}

export function buildEmailLink(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Generator Pesan Peringatan Stok Menipis Gabungan (Multi-SKU)
export function buildLowStockAlertMessage(
  beans: CoffeeBean[],
  config: BusinessNotificationConfig
): { subject: string; body: string; lowBeans: CoffeeBean[] } {
  const lowBeans = beans.filter(
    (b) =>
      (config.notifyOnGreenLow && (b.stockGreenKg || 0) <= (b.minAlertKg || config.defaultMinThresholdKg)) ||
      (config.notifyOnRoastedLow &&
        (b.stockRoastedKg || 0) <= (b.minAlertRoastedKg || 20) &&
        (b.stockRoastedKg || 0) >= 0)
  );

  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const subject = `⚠️ PERINGATAN GUDANG: ${lowBeans.length} Jenis Stok Kopi Menipis (${dateStr})`;

  const itemsDetail = lowBeans
    .map((b, idx) => {
      const minGreen = b.minAlertKg || config.defaultMinThresholdKg;
      const deficit = Math.max(0, minGreen - (b.stockGreenKg || 0));
      return (
        `[${idx + 1}] *${b.name.toUpperCase()}*\n` +
        `   • Sisa Green Beans : *${(b.stockGreenKg || 0).toLocaleString('id-ID')} kg*\n` +
        `   • Batas Minimal    : ${minGreen.toLocaleString('id-ID')} kg\n` +
        `   • Defisit Stok     : *-${deficit.toLocaleString('id-ID')} kg (KRITIS)*\n` +
        `   • Lokasi Silo/Rak  : ${b.storageLocation || 'Gudang Utama'}\n` +
        `   • Kadar Air Rata   : ${b.moistureAvgPercent || 11.2}%`
      );
    })
    .join('\n\n');

  const body =
    `*🚨 PERINGATAN RESMI: STOK BIJI KOPI MENIPIS DI GUDANG*\n` +
    `Sistem Monitoring Inventaris KopiFlow ERP\n` +
    `Tanggal & Waktu: ${dateStr} WIB\n\n` +
    `Yth. *${config.managerName || 'Kepala Gudang & Tim Procurement'}*,\n\n` +
    `Sistem mendeteksi bahwa stok fisik biji kopi mentah (green beans) di gudang telah berada di bawah *INDIKATOR BATAS MINIMAL STOK*:\n\n` +
    `${itemsDetail || '• Belum ada stok di bawah batas minimal saat ini.'}\n\n` +
    `*Rekomendasi Tindakan Segera:*\n` +
    `1. Hubungi petani rekanan / pabrik pengolahan untuk pengiriman intake lot baru.\n` +
    `2. Verifikasi fisik dengan menekan tombol 'Opname' pada menu Gudang Green Beans.\n` +
    `3. Tunda pemenuhan order partai besar yang melebihi saldo aman.\n\n` +
    `Pesan ini digenerate otomatis oleh KopiFlow Roastery & Warehouse System.\n` +
    `Email Bisnis: ${config.businessEmail} | WA: ${config.businessWhatsApp}`;

  return { subject, body, lowBeans };
}

// Generator Pesan Peringatan Stok Menipis untuk 1 Jenis Biji Kopi
export function buildSingleBeanLowStockMessage(
  bean: CoffeeBean,
  config: BusinessNotificationConfig
): { subject: string; body: string; whatsappUrl: string; mailtoUrl: string } {
  const minThreshold = bean.minAlertKg || config.defaultMinThresholdKg;
  const currentStock = bean.stockGreenKg || 0;
  const deficit = Math.max(0, minThreshold - currentStock);
  const dateStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const subject = `⚠️ STOK MENIPIS: ${bean.name} (${currentStock} kg / Min: ${minThreshold} kg)`;

  const body =
    `*🚨 PERINGATAN GUDANG KOPIFLOW: STOK MENIPIS*\n\n` +
    `Komoditas   : *${bean.name}*\n` +
    `Asal / Var  : ${bean.origin} (${bean.variety})\n` +
    `Proses/Mutu : ${bean.process} - ${bean.grade}\n` +
    `Lokasi Gudang: *${bean.storageLocation || 'Silo Utama'}*\n\n` +
    `📊 *STATUS INDIKATOR STOK GUDANG:*\n` +
    `• Stok Fisik Saat Ini : *${currentStock.toLocaleString('id-ID')} kg*\n` +
    `• Batas Minimal Aman  : *${minThreshold.toLocaleString('id-ID')} kg*\n` +
    `• Kekurangan/Defisit  : *-${deficit.toLocaleString('id-ID')} kg (PERLU RE-ORDER)*\n` +
    `• Kadar Air (MC)      : ${bean.moistureAvgPercent || 11.2}%\n\n` +
    `Waktu Alert: ${dateStr} WIB\n\n` +
    `Mohon segera lakukan koordinasi dengan bagian pembelian / petani mitra agar ketersediaan biji kopi tetap terjaga.\n\n` +
    `KopiFlow Roastery ERP Takengon`;

  const whatsappUrl = buildWhatsAppLink(config.businessWhatsApp, body);
  const mailtoUrl = buildEmailLink(config.businessEmail, subject, body);

  return { subject, body, whatsappUrl, mailtoUrl };
}

// Auto-trigger Pengecekan dan Pencatatan Log Notifikasi ke Database
export async function triggerAutoLowStockCheck(
  beans: CoffeeBean[],
  configOverride?: BusinessNotificationConfig,
  autoLog: boolean = true
): Promise<{
  lowCount: number;
  lowBeans: CoffeeBean[];
  subject: string;
  body: string;
  whatsappUrl: string;
  mailtoUrl: string;
}> {
  const config = configOverride || getNotificationConfig();
  const { subject, body, lowBeans } = buildLowStockAlertMessage(beans, config);

  const whatsappUrl = buildWhatsAppLink(config.businessWhatsApp, body);
  const mailtoUrl = buildEmailLink(config.businessEmail, subject, body);

  if (autoLog && lowBeans.length > 0) {
    const logId = `notif-stock-${Date.now().toString(36)}`;
    const newLog: NotificationLog = {
      id: logId,
      channel: 'WhatsApp',
      recipient: `${config.businessWhatsApp} / ${config.businessEmail}`,
      subject,
      messagePreview: body.slice(0, 220) + '...',
      type: 'Stock Alert',
      status: 'Sent',
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdAt: new Date().toISOString()
    };
    await saveNotificationLog(newLog);
  }

  return {
    lowCount: lowBeans.length,
    lowBeans,
    subject,
    body,
    whatsappUrl,
    mailtoUrl
  };
}

// -------------------------------------------------------------
// OPENWA (@open-wa/wa-automate) REST API INTEGRATION & AUTOMATION
// -------------------------------------------------------------
export interface SendWhatsAppResult {
  success: boolean;
  channel: 'openwa' | 'direct';
  message: string;
  url?: string;
  error?: string;
}

/**
 * Pings OpenWA REST API server to verify if the server daemon is alive and session is active.
 * Standard endpoints on OpenWA servers include /ping, /getMe, or /status
 */
export async function testOpenWaConnection(
  serverUrl: string,
  apiKey?: string
): Promise<{ ok: boolean; statusText: string }> {
  if (!serverUrl || !serverUrl.trim()) {
    return { ok: false, statusText: 'URL Server OpenWA belum diisi' };
  }

  const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiKey?.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    headers['api_key'] = apiKey.trim();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    // Attempt 1: Ping endpoint
    const res = await fetch(`${cleanUrl}/ping`, {
      method: 'GET',
      headers,
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && (res.ok || res.status === 200)) {
      return { ok: true, statusText: 'Online (OpenWA REST API Terhubung)' };
    }

    // Attempt 2: getMe or root healthcheck
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 3500);
    const res2 = await fetch(`${cleanUrl}/getMe`, {
      method: 'GET',
      headers,
      signal: controller2.signal
    }).catch(() => null);
    clearTimeout(timeout2);

    if (res2 && (res2.ok || res2.status === 200)) {
      return { ok: true, statusText: 'Online (Session WhatsApp Terautentikasi)' };
    }

    return {
      ok: false,
      statusText: res
        ? `Server merespon HTTP ${res.status}`
        : 'Server OpenWA tidak merespon (Pastikan server aktif di port target & CORS diizinkan)'
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      statusText: err?.message || 'Gagal tersambung (Koneksi ditolak / Offline)'
    };
  }
}

/**
 * Dispatches a WhatsApp message.
 * If OpenWA is configured and enabled, sends an automated headless HTTP POST request.
 * If OpenWA fails or is disabled, gracefully falls back or opens wa.me.
 */
export async function dispatchWhatsAppNotification(
  phone: string,
  text: string,
  config?: BusinessNotificationConfig
): Promise<SendWhatsAppResult> {
  const currentConfig = config || getNotificationConfig();
  const openWa = currentConfig.openWa;
  const directLink = buildWhatsAppLink(phone, text);

  // If OpenWA is not enabled or user chose direct mode
  if (!openWa || !openWa.enabled || openWa.provider !== 'openwa' || !openWa.serverUrl?.trim()) {
    return {
      success: true,
      channel: 'direct',
      url: directLink,
      message: 'Membuka tautan WhatsApp Direct (wa.me)'
    };
  }

  const cleanServerUrl = openWa.serverUrl.trim().replace(/\/+$/, '');
  const formattedPhone = formatPhoneNumber(phone);
  const chatId = `${formattedPhone}@c.us`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (openWa.apiKey?.trim()) {
    headers['Authorization'] = `Bearer ${openWa.apiKey.trim()}`;
    headers['api_key'] = openWa.apiKey.trim();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    // OpenWA REST standard payload: POST /sendText { chatId: '628xxx@c.us', text: '...' }
    const response = await fetch(`${cleanServerUrl}/sendText`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chatId,
        text
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        success: true,
        channel: 'openwa',
        message: `Pesan otomatis terkirim via OpenWA REST API ke ${chatId} tanpa membuka browser!`
      };
    } else {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenWA HTTP ${response.status}: ${errText || response.statusText}`);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('OpenWA dispatch error:', err?.message || err);

    if (openWa.autoFallbackToDirect) {
      return {
        success: true,
        channel: 'direct',
        url: directLink,
        message: `Server OpenWA offline (${err?.message || 'Unreachable'}), otomatis dialihkan ke WhatsApp Direct (wa.me).`,
        error: err?.message
      };
    }

    return {
      success: false,
      channel: 'openwa',
      error: err?.message || 'Gagal mengirim pesan via OpenWA',
      message: `Gagal mengirim via OpenWA: ${err?.message || 'Periksa server OpenWA Anda'}`
    };
  }
}
