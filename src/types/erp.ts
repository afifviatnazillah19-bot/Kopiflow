export type CoffeeProcess =
  | 'Semi Wash'
  | 'Wet Hulled'
  | 'Full Wash'
  | 'Washed'
  | 'Natural'
  | 'Honey'
  | 'Anaerobic'
  | 'Anaerobic Natural'
  | 'Anaerobic Washed'
  | 'Anaerobic Slow Dry'
  | 'Wine Process'
  | 'Carbonic Maceration'
  | string;
export type CoffeeGrade = 'Grade 1' | 'Specialty' | 'Commercial' | 'Micro-lot';

export const COMMON_COFFEE_PROCESSES = [
  'Semi Wash',
  'Wet Hulled',
  'Full Wash',
  'Washed',
  'Natural',
  'Honey',
  'Anaerobic',
  'Anaerobic Natural',
  'Anaerobic Washed',
  'Anaerobic Slow Dry',
  'Wine Process',
  'Carbonic Maceration'
] as const;

export const COMMON_COFFEE_VARIETIES = [
  'Timtim',
  'Ateng Super',
  'Bourbon',
  'Typica',
  'Catimor',
  'Sigarar Utang',
  'Longberry Gayo',
  'Kartika',
  'Gayo 1',
  'Gayo 2',
  'Abisinia',
  'Maragogype',
  'Geisha',
  'P-88',
  'Yellow Caturra',
  'Robusta Dampit',
  'Liberika Riau'
] as const;
export type PricingTier = 'Lokal' | 'UMKM' | 'Luar Pulau';
export type BatchStatus = 'In Stock' | 'Depleted' | 'In Roasting' | 'Quarantine';
export type RoastLevel = 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark';
export type RoastStatus = 'Passed QC' | 'Failed QC' | 'Cupping Pending' | 'Sample Only';
export type OrderStatus = 'Draft' | 'Confirmed' | 'Processing' | 'Ready to Ship' | 'Shipped' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Down Payment' | 'Paid in Full';
export type ShipmentStatus = 'Manifested' | 'Cargo Drop' | 'In Transit (Laut/Udara)' | 'In Transit (Loket Aceh)' | 'Out for Delivery' | 'Delivered' | 'Returned';
export type IslandRegion = 'Aceh (Lokal Loket)' | 'Jawa' | 'Sumatera' | 'Kalimantan' | 'Sulawesi' | 'Bali & Nusa Tenggara' | 'Maluku & Papua';
export type NotificationChannel = 'WhatsApp' | 'Email';
export type NotificationType = 'Order Invoice' | 'Stock Alert' | 'Roast QC Alert' | 'Shipment Dispatched' | 'Delivery Confirmed' | 'Surat Jalan Loket';

export type PartnerType = 'Pemasok / Petani' | 'Pelanggan / Kedai' | 'Mitra Loket Aceh';

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  category: string; // e.g. "Koperasi Kopi Gayo", "Kedai Specialty", "Angkutan L300"
  phone: string;
  email?: string;
  city: string; // e.g. "Takengon", "Bener Meriah", "Banda Aceh", "Medan"
  address: string;
  defaultPricingTier?: PricingTier;
  contactPerson?: string;
  notes?: string;
  createdAt: string;
}

export interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  variety: string;
  process: CoffeeProcess;
  grade: CoffeeGrade;
  stockGreenKg: number;
  stockRoastedKg: number;
  minAlertKg: number;
  priceLocalPerKg: number;
  priceUmkmPerKg: number;
  priceLuarPulauPerKg: number;
  storageLocation: string;
  moistureAvgPercent: number;
  // HPP (Harga Pokok Produksi) & Cost Structure per Kg
  costGreenPerKg?: number;
  costRoastingPerKg?: number;
  costPackagingPerKg?: number;
  costOverheadPerKg?: number;
  hppPerKg?: number;
  minAlertRoastedKg?: number;
  notes?: string;
  updatedAt: string;
  createdAt: string;
}

export type WhatsAppProvider = 'direct' | 'openwa';

export interface OpenWaConfig {
  enabled: boolean;
  provider: WhatsAppProvider;
  serverUrl: string; // e.g. "http://localhost:8080"
  apiKey?: string;
  sessionId?: string; // e.g. "kopiflow"
  autoFallbackToDirect: boolean;
}

export interface BusinessNotificationConfig {
  businessWhatsApp: string;
  businessEmail: string;
  managerName: string;
  autoSendEnabled: boolean;
  defaultMinThresholdKg: number;
  notifyOnGreenLow: boolean;
  notifyOnRoastedLow: boolean;
  openWa?: OpenWaConfig;
  updatedAt: string;
}

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary?: boolean;
}

export interface QrisPaymentConfig {
  merchantName: string;
  qrisImageUrl: string;
  gopayNumber: string;
  accountHolder: string;
  paymentInstructions?: string;
  alternativeBankAccounts?: BankAccountItem[];
  updatedAt: string;
}

export type ShippingMethodCategory =
  | 'Loket Bus / L300'
  | 'Grab / GoSend / Kurir Instan'
  | 'Antar Sendiri (Kurir Roastery)'
  | 'Ambil di Gudang (Pickup Direct)'
  | 'Ekspedisi Kargo Antarpulau';

export interface GrabDriverData {
  driverName: string;
  vehiclePlate: string;
  driverPhone: string;
  orderPinOrRef?: string;
}

export interface RoasterStaff {
  id: string;
  name: string;
  phone: string;
  role: 'Head Roaster' | 'Senior Roaster' | 'Roaster Operator' | 'Cupping Master';
  certification?: string;
  machineSpecialty?: string;
  shift: 'Pagi' | 'Siang' | 'Malam' | 'Flexi';
  status: 'Active' | 'On Leave' | 'Inactive';
  notes?: string;
  createdAt?: string;
}

export interface WarehouseHead {
  id: string;
  name: string;
  phone: string;
  nikStaff: string;
  hubLocation: string;
  shift: 'Pagi' | 'Siang' | 'Malam' | 'Full Time';
  responsibilities: string[];
  status: 'Active' | 'Primary';
  notes?: string;
  createdAt?: string;
}

export interface Batch {
  id: string;
  lotNumber: string;
  beanId: string;
  beanName: string;
  origin: string;
  process: CoffeeProcess;
  quantityInitialKg: number;
  quantityRemainingKg: number;
  bagCount: number;
  bagWeightKg: number;
  supplierOrFarmer: string;
  harvestDate: string;
  receivedDate: string;
  moistureContent: number;
  densityGramsPerLiter: number;
  warehouseLocation: string;
  status: BatchStatus;
  qrCodeData: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboundMovement {
  id: string;
  docNumber: string; // e.g. INB-2026-001
  date: string;
  partnerId: string; // Ref to Partner (Supplier / Petani)
  partnerName: string;
  beanId: string; // Ref to CoffeeBean
  beanName: string;
  lotNumber: string;
  bagCount: number;
  weightKg: number;
  moisturePercent: number;
  warehouseLocation: string;
  supplierDeliveryNote: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface OutboundMovement {
  id: string;
  docNumber: string; // e.g. OUT-2026-001
  date: string;
  partnerId: string; // Ref to Partner (Customer / Kedai)
  partnerName: string;
  orderId?: string;
  invoiceNumber?: string;
  beanId: string;
  beanName: string;
  itemType: 'Green Bean' | 'Roasted Bean' | 'Ground';
  quantityKg: number;
  loketOrCourier: string; // e.g. "Loket Simpati Star Takengon", "Loket Harapan Indah Banda Aceh", "L300 Mentari Kargo"
  destinationCity: string;
  driverNameOrPhone?: string;
  vehiclePlate?: string; // e.g. "BL 1482 AB"
  receiptNumber?: string; // No. Resi Loket
  shippingFeeIdr?: number;
  status: 'Dispatched' | 'In Transit' | 'Delivered';
  dispatchedBy: string;
  notes?: string;
  createdAt: string;
}

export interface RoastCurvePoint {
  timeSec: number;
  timeLabel: string;
  beanTempC: number;
  envTempC: number;
  rateOfRise: number;
  event?: string;
}

export interface RoastLog {
  id: string;
  roastNumber: string;
  beanId: string;
  beanName: string;
  batchLotNumber: string;
  roasterMachine: string;
  roastProfileLevel: RoastLevel;
  greenWeightGrams: number;
  roastedWeightGrams: number;
  weightLossPercent: number;
  chargeTempC: number;
  turningPointTempC: number;
  turningPointTimeSec: number;
  dryEndTempC: number;
  dryEndTimeSec: number;
  firstCrackTempC: number;
  firstCrackTimeSec: number;
  dropTempC: number;
  totalTimeSec: number;
  dtrPercent: number;
  cuppingScore: number;
  cuppingNotes: string;
  roasterOperator: string;
  roastDate: string;
  status: RoastStatus;
  curveData?: RoastCurvePoint[];
  createdAt: string;
}

export interface OrderItem {
  beanId: string;
  beanName: string;
  type: 'Green Bean' | 'Roasted Bean' | 'Ground';
  quantityKg: number;
  tierUsed: PricingTier;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  partnerId?: string;
  customerName: string;
  customerType: PricingTier;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  destinationIsland: IslandRegion;
  shippingMethod?: string;
  items: OrderItem[];
  totalWeightKg: number;
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  orderId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  courierName: string;
  serviceType: string;
  destinationRegion: string;
  destinationIsland: IslandRegion;
  weightKg: number;
  shippingCost: number;
  status: ShipmentStatus;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string; // e.g. "BL 1290 YA"
  loketOrigin?: string; // e.g. "Loket Takengon Kota"
  loketDestination?: string; // e.g. "Loket Batoh Banda Aceh"
  dispatchedAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  messagePreview: string;
  type: NotificationType;
  status: 'Sent' | 'Pending' | 'Failed';
  sentAt: string;
  createdAt: string;
}
