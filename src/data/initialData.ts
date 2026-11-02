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
  RoasterStaff,
  WarehouseHead
} from '../types/erp';

// ACEH LOKET LOGISTICS PRESETS (Angkutan L300 & Bus Kargo Aceh)
export const ACEH_LOKET_PRESETS: Partner[] = [
  {
    id: 'loket-simpati-star',
    name: 'Loket Simpati Star Kargo',
    type: 'Mitra Loket Aceh',
    category: 'Bus Kargo & HiAce VIP',
    phone: '6285277112233',
    city: 'Takengon & Banda Aceh',
    address: 'Terminal Terpadu Paya Ilang Takengon / Jl. M. Hasan Batoh Banda Aceh',
    notes: 'Rute harian: Takengon - Bireuen - Banda Aceh & Takengon - Medan',
    createdAt: new Date().toISOString()
  },
  {
    id: 'loket-harapan-indah',
    name: 'Loket Harapan Indah Express',
    type: 'Mitra Loket Aceh',
    category: 'Angkutan Penumpang & Paket Cepat',
    phone: '6281269004455',
    city: 'Banda Aceh',
    address: 'Jl. Dr. Mr. Mohd Hasan No. 88, Lueng Bata, Banda Aceh',
    notes: 'Pengiriman paket karung kopi hari yang sama (same-day) jalur tengah & timur Aceh',
    createdAt: new Date().toISOString()
  },
  {
    id: 'loket-mentari-l300',
    name: 'Loket CV. Mentari Kargo L300 Gayo',
    type: 'Mitra Loket Aceh',
    category: 'Mobil Angkutan L300 Khusus Barang',
    phone: '6281360123987',
    city: 'Takengon (Aceh Tengah)',
    address: 'Jl. Sengeda No. 14, Kemili, Bebesen, Takengon',
    notes: 'Spesialis muatan karung kopi gabah & green bean dari kebun Gayo ke Banda Aceh / Medan',
    createdAt: new Date().toISOString()
  },
  {
    id: 'loket-putra-pelangi',
    name: 'Loket Putra Pelangi Perkasa Kargo',
    type: 'Mitra Loket Aceh',
    category: 'Ekspedisi Bus Malam Aceh-Medan',
    phone: '628116801234',
    city: 'Medan & Takengon',
    address: 'Jl. Gajah Mada No. 12 Medan / Terminal Takengon',
    notes: 'Kapasitas bagasi bus besar muat hingga 2 ton per trip malam',
    createdAt: new Date().toISOString()
  },
  {
    id: 'loket-jasa-bunda',
    name: 'Loket Jasa Bunda L300 Bener Meriah',
    type: 'Mitra Loket Aceh',
    category: 'Angkutan Antar Kabupaten Aceh',
    phone: '6285370998811',
    city: 'Simpang Tiga Redelong (Bener Meriah)',
    address: 'Jl. Bandara Rembele, Bener Meriah',
    notes: 'Trayek rutin Bener Meriah - Takengon - Lhokseumawe',
    createdAt: new Date().toISOString()
  }
];

// SAMPLE PARTNERS (Relasi Pemasok & Pelanggan)
export const SAMPLE_PARTNERS: Partner[] = [
  ...ACEH_LOKET_PRESETS,
  {
    id: 'partner-sup-01',
    name: 'Koperasi Ketiara Gayo Lestari',
    type: 'Pemasok / Petani',
    category: 'Koperasi Petani Organik Gayo',
    phone: '628116890011',
    email: 'ketiara.gayo@mitrakopi.id',
    city: 'Takengon, Aceh Tengah',
    address: 'Jl. Lembaga Pantan Musara, Pegasing, Aceh Tengah',
    contactPerson: 'Ibu Rahmah (Ketua Koperasi)',
    notes: 'Pemasok utama varietas Bourbon & Ateng Super Specialty',
    createdAt: new Date().toISOString()
  },
  {
    id: 'partner-sup-02',
    name: 'Kelompok Tani Bener Meriah Bersatu',
    type: 'Pemasok / Petani',
    category: 'Kelompok Tani Dataran Tinggi',
    phone: '6285260114477',
    email: 'tani.benermeriah@gmail.com',
    city: 'Bener Meriah, Aceh',
    address: 'Desa Bandar Lampahan, Timang Gajah, Bener Meriah',
    contactPerson: 'Pak Aman Rusli',
    notes: 'Ketinggian 1.600 mdpl, proses Washed & Natural Honey',
    createdAt: new Date().toISOString()
  },
  {
    id: 'partner-cust-01',
    name: 'Moorden Coffee Roasters Banda Aceh',
    type: 'Pelanggan / Kedai',
    category: 'Kedai Kopi & Roastery Lokal Aceh',
    phone: '6281269887766',
    email: 'order@moordencoffee.com',
    city: 'Banda Aceh',
    address: 'Jl. Prof. Ali Hasyimi, Lamteh, Ulee Kareng, Banda Aceh',
    defaultPricingTier: 'Lokal',
    contactPerson: 'Agus Salim',
    notes: 'Pemesanan rutin mingguan via Loket L300 Mentari / Simpati Star',
    createdAt: new Date().toISOString()
  },
  {
    id: 'partner-cust-02',
    name: 'Kopi Kenari Nusantara (Yogyakarta)',
    type: 'Pelanggan / Kedai',
    category: 'Mitra UMKM Kedai Kopi',
    phone: '6281234567890',
    email: 'roastery@kopikenari.co.id',
    city: 'Yogyakarta',
    address: 'Jl. Malioboro No. 45, Danurejan, Kota Yogyakarta',
    defaultPricingTier: 'UMKM',
    contactPerson: 'Fajar Hidayat',
    notes: 'Mitra binaan UMKM pasokan 60kg/bulan via kargo darat',
    createdAt: new Date().toISOString()
  },
  {
    id: 'partner-cust-03',
    name: 'Borneo Specialty Coffee Hub',
    type: 'Pelanggan / Kedai',
    category: 'Distributor Luar Pulau',
    phone: '6282198765432',
    email: 'procurement@borneospecialty.id',
    city: 'Balikpapan, Kalimantan Timur',
    address: 'Komp. Ruko Balikpapan Superblock B-12',
    defaultPricingTier: 'Luar Pulau',
    contactPerson: 'Hendrik Wijaya',
    notes: 'Kargo kontainer laut Pelni / Indah Logistik',
    createdAt: new Date().toISOString()
  }
];

// SAMPLE MASTER BEANS (Untuk template pengujian)
export const SAMPLE_BEANS: CoffeeBean[] = [
  {
    id: 'bean-gayo-01',
    name: 'Aceh Gayo Pantan Musara',
    origin: 'Takengon, Aceh Tengah (1.550 mdpl)',
    variety: 'Ateng Super & Bourbon',
    process: 'Washed',
    grade: 'Specialty',
    stockGreenKg: 1850,
    stockRoastedKg: 140,
    minAlertKg: 500,
    priceLocalPerKg: 145000,
    priceUmkmPerKg: 132000,
    priceLuarPulauPerKg: 165000,
    storageLocation: 'Silo A - Gudang Utama',
    moistureAvgPercent: 11.2,
    notes: 'Karakter rasa floral, brown sugar, crisp green apple, silky medium body.',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'bean-benermeriah-02',
    name: 'Aceh Bener Meriah Timang Gajah',
    origin: 'Bener Meriah, Aceh (1.600 mdpl)',
    variety: 'Bourbon & P-88',
    process: 'Natural',
    grade: 'Specialty',
    stockGreenKg: 1100,
    stockRoastedKg: 75,
    minAlertKg: 350,
    priceLocalPerKg: 155000,
    priceUmkmPerKg: 140000,
    priceLuarPulauPerKg: 175000,
    storageLocation: 'Rak Khusus Gayo SP-01',
    moistureAvgPercent: 11.0,
    notes: 'Winey, red cherry, brown sugar candy, citric acidity.',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'bean-toraja-03',
    name: 'Toraja Sapan Enrekang',
    origin: 'Tana Toraja, Sulawesi Selatan (1.650 mdpl)',
    variety: 'Typica & S-795',
    process: 'Honey',
    grade: 'Specialty',
    stockGreenKg: 950,
    stockRoastedKg: 60,
    minAlertKg: 300,
    priceLocalPerKg: 158000,
    priceUmkmPerKg: 142000,
    priceLuarPulauPerKg: 178000,
    storageLocation: 'Rak Khusus SP-02',
    moistureAvgPercent: 10.8,
    notes: 'Sweet orange marmalade, dark chocolate finish.',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_BATCHES: Batch[] = [
  {
    id: 'batch-2026-001',
    lotNumber: 'LOT-2026-GY-084',
    beanId: 'bean-gayo-01',
    beanName: 'Aceh Gayo Pantan Musara',
    origin: 'Takengon, Aceh Tengah',
    process: 'Washed',
    quantityInitialKg: 2000,
    quantityRemainingKg: 1850,
    bagCount: 31,
    bagWeightKg: 60,
    supplierOrFarmer: 'Koperasi Ketiara Gayo Lestari',
    harvestDate: '2026-04-15',
    receivedDate: '2026-05-02',
    moistureContent: 11.2,
    densityGramsPerLiter: 715,
    warehouseLocation: 'Silo A - Bay 1',
    status: 'In Stock',
    qrCodeData: 'LOT:LOT-2026-GY-084|BEAN:Aceh Gayo|KG:1850|MC:11.2%',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SAMPLE_INBOUND: InboundMovement[] = [
  {
    id: 'inb-2026-001',
    docNumber: 'INB/2026/X/001',
    date: '2026-10-24',
    partnerId: 'partner-sup-01',
    partnerName: 'Koperasi Ketiara Gayo Lestari',
    beanId: 'bean-gayo-01',
    beanName: 'Aceh Gayo Pantan Musara',
    lotNumber: 'LOT-2026-GY-084',
    bagCount: 31,
    weightKg: 1860,
    moisturePercent: 11.2,
    warehouseLocation: 'Silo A - Bay 1',
    supplierDeliveryNote: 'SJ/KETIARA/X/2026/041',
    receivedBy: 'Tgk. Mansur (QC Gudang)',
    notes: 'Kondisi karung bersih, bebas kutu & jamur, lolos uji kadar air.',
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_OUTBOUND: OutboundMovement[] = [
  {
    id: 'out-2026-001',
    docNumber: 'OUT/2026/X/001',
    date: '2026-10-26',
    partnerId: 'partner-cust-01',
    partnerName: 'Moorden Coffee Roasters Banda Aceh',
    orderId: 'ord-aceh-01',
    invoiceNumber: 'INV/2026/X/089',
    beanId: 'bean-gayo-01',
    beanName: 'Aceh Gayo Pantan Musara',
    itemType: 'Green Bean',
    quantityKg: 60,
    loketOrCourier: 'Loket CV. Mentari Kargo L300 Gayo',
    destinationCity: 'Banda Aceh (Loket Batoh)',
    driverNameOrPhone: 'Bang Irwan (0812-6900-1122)',
    vehiclePlate: 'BL 1482 AB (L300 Putih)',
    receiptNumber: 'RESI-MENTARI-7821',
    shippingFeeIdr: 45000,
    status: 'In Transit',
    dispatchedBy: 'Hendra Setiawan',
    notes: 'Titip di Loket Batoh Banda Aceh, penerima langsung ambil saat tiba.',
    createdAt: new Date().toISOString()
  }
];

// EMPTY / NEUTRAL INITIAL STATES (Untuk pengujian murni dari nol)
export const NEUTRAL_EMPTY_BEANS: CoffeeBean[] = [];
export const NEUTRAL_EMPTY_BATCHES: Batch[] = [];
export const NEUTRAL_EMPTY_ROASTS: RoastLog[] = [];
export const NEUTRAL_EMPTY_ORDERS: Order[] = [];
export const NEUTRAL_EMPTY_SHIPMENTS: Shipment[] = [];
export const NEUTRAL_EMPTY_NOTIFICATIONS: NotificationLog[] = [];
export const NEUTRAL_EMPTY_PARTNERS: Partner[] = [...ACEH_LOKET_PRESETS];
export const NEUTRAL_EMPTY_INBOUND: InboundMovement[] = [];
export const NEUTRAL_EMPTY_OUTBOUND: OutboundMovement[] = [];

// DATA PENGATURAN STAFF ROASTER & KEPALA GUDANG (KOFIARA HUB LHOKSEUMAWE)
export const DEFAULT_ROASTER_STAFF: RoasterStaff[] = [
  {
    id: 'roaster-01',
    name: 'Bang Malik (Head Roaster)',
    phone: '0811-6890-2233',
    role: 'Head Roaster',
    certification: 'SCA Roaster Certified & Q Grader',
    machineSpecialty: 'Mesin Roasting Rakitan Gayo 15kg & Probat 5kg',
    shift: 'Pagi',
    status: 'Active',
    notes: 'Spesialis profil roasting Specialty & Light Roast Filter Gayo',
    createdAt: new Date().toISOString()
  },
  {
    id: 'roaster-02',
    name: 'Fikri Roaster',
    phone: '0852-9988-1122',
    role: 'Senior Roaster',
    certification: 'SCA Intermediate Roasting',
    machineSpecialty: 'Mesin Roasting Rakitan Gayo 15kg',
    shift: 'Siang',
    status: 'Active',
    notes: 'Penanggung jawab batch Commercial & Espresso Blend',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_WAREHOUSE_HEAD: WarehouseHead[] = [
  {
    id: 'head-wh-01',
    name: 'Tgk. Mansur',
    phone: '0812-6900-3344',
    nikStaff: 'KFH-LHK-2026-001',
    hubLocation: 'Kofiara Hub Lhokseumawe',
    shift: 'Full Time',
    responsibilities: [
      'QC Kadar Air & Berat Green Bean',
      'Manajemen Silo & Rak Degassing',
      'Dispatch Pengiriman Loket & GrabExpress',
      'Stok Opname & Penandatanganan Surat Jalan'
    ],
    status: 'Primary',
    notes: 'Kepala Gudang Utama Kofiara Hub Lhokseumawe',
    createdAt: new Date().toISOString()
  }
];
