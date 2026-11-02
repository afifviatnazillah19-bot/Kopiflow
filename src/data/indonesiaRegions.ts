import { IslandRegion } from '../types/erp';

export interface DestinationPreset {
  id: string;
  island: IslandRegion;
  province: string;
  cityRegency: string; // e.g. "Kota Banda Aceh", "Kab. Aceh Tengah (Takengon)", "Kota Jakarta Selatan", "Kota Surabaya"
  districtList?: string[]; // e.g. ["Kec. Bebesen", "Kec. Pegasing", "Kec. Lut Tawar"]
  defaultHubLoket: string; // e.g. "Loket Terminal Batoh / Lueng Bata"
  estimatedShippingFee: number; // Default shipping fee estimate
}

export const SPECIFIC_DESTINATION_PRESETS: DestinationPreset[] = [
  // --- ACEH (Lokal & Loket Antar Kabupaten) ---
  {
    id: 'aceh-takengon',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kab. Aceh Tengah (Takengon)',
    districtList: ['Kec. Bebesen', 'Kec. Pegasing', 'Kec. Lut Tawar', 'Kec. Kebayakan', 'Kec. Kute Panang', 'Kec. Celala', 'Kec. Silih Nara', 'Kec. Bies'],
    defaultHubLoket: 'Loket Terminal Terpadu Paya Ilang Takengon',
    estimatedShippingFee: 20000
  },
  {
    id: 'aceh-bener-meriah',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kab. Bener Meriah (Simpang Tiga Redelong)',
    districtList: ['Kec. Wih Pesam', 'Kec. Timang Gajah', 'Kec. Bukit', 'Kec. Bandar', 'Kec. Permata'],
    defaultHubLoket: 'Loket Simpang Tiga Redelong / Rembele',
    estimatedShippingFee: 25000
  },
  {
    id: 'aceh-banda-aceh',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kota Banda Aceh',
    districtList: ['Kec. Lueng Bata (Terminal Batoh)', 'Kec. Kuta Alam', 'Kec. Syiah Kuala', 'Kec. Meuraxa', 'Kec. Baiturrahman', 'Kec. Ulee Kareng'],
    defaultHubLoket: 'Loket L300 Terminal Batoh Banda Aceh',
    estimatedShippingFee: 35000
  },
  {
    id: 'aceh-besar',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kab. Aceh Besar (Jantho / Lambaro)',
    districtList: ['Kec. Ingin Jaya (Lambaro)', 'Kec. Kota Jantho', 'Kec. Darul Imarah', 'Kec. Krueng Barona Jaya'],
    defaultHubLoket: 'Loket Lambaro / Terminal Batoh',
    estimatedShippingFee: 40000
  },
  {
    id: 'aceh-lhokseumawe',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kota Lhokseumawe',
    districtList: ['Kec. Banda Sakti (Cunda)', 'Kec. Muara Dua', 'Kec. Muara Satu', 'Kec. Blang Mangat'],
    defaultHubLoket: 'Loket Bus / L300 Cunda Lhokseumawe',
    estimatedShippingFee: 30000
  },
  {
    id: 'aceh-bireuen',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kab. Bireuen',
    districtList: ['Kec. Bireuen Kota', 'Kec. Juli', 'Kec. Peusangan (Matangglumpangdua)', 'Kec. Samalanga'],
    defaultHubLoket: 'Loket Terminal Bireuen Kota',
    estimatedShippingFee: 30000
  },
  {
    id: 'aceh-langsa',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kota Langsa',
    districtList: ['Kec. Langsa Kota', 'Kec. Langsa Barat', 'Kec. Langsa Lama'],
    defaultHubLoket: 'Loket Terminal Langsa',
    estimatedShippingFee: 40000
  },
  {
    id: 'aceh-meulaboh',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kab. Aceh Barat (Meulaboh)',
    districtList: ['Kec. Johan Pahlawan (Meulaboh)', 'Kec. Kaway XVI', 'Kec. Samatiga'],
    defaultHubLoket: 'Loket L300 Meulaboh Rundeng',
    estimatedShippingFee: 45000
  },
  {
    id: 'aceh-sigli',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kab. Pidie (Sigli)',
    districtList: ['Kec. Kota Sigli', 'Kec. Mutiara (Beureunuen)', 'Kec. Pidie'],
    defaultHubLoket: 'Loket Terminal Sigli / Beureunuen',
    estimatedShippingFee: 35000
  },
  {
    id: 'aceh-tapaktuan',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kab. Aceh Selatan (Tapaktuan)',
    districtList: ['Kec. Tapaktuan', 'Kec. Samadua', 'Kec. Meukek'],
    defaultHubLoket: 'Loket L300 Tapaktuan',
    estimatedShippingFee: 50000
  },
  {
    id: 'aceh-subulussalam',
    island: 'Aceh (Lokal Loket)',
    province: 'Aceh',
    cityRegency: 'Kota Subulussalam',
    districtList: ['Kec. Simpang Kiri', 'Kec. Penanggalan'],
    defaultHubLoket: 'Loket Kargo Subulussalam',
    estimatedShippingFee: 55000
  },

  // --- SUMATERA UTARA & SUMATERA LAINNYA ---
  {
    id: 'sumut-medan',
    island: 'Sumatera',
    province: 'Sumatera Utara',
    cityRegency: 'Kota Medan',
    districtList: ['Kec. Medan Kota', 'Kec. Medan Amplas', 'Kec. Medan Sunggal', 'Kec. Medan Helvetia', 'Kec. Medan Petisah', 'Kec. Medan Johor'],
    defaultHubLoket: 'Loket Amplas / Pinang Baris / Jl. Gajah Mada Medan',
    estimatedShippingFee: 65000
  },
  {
    id: 'sumut-deli-serdang',
    island: 'Sumatera',
    province: 'Sumatera Utara',
    cityRegency: 'Kab. Deli Serdang (Kualanamu / Lubuk Pakam)',
    districtList: ['Kec. Lubuk Pakam', 'Kec. Tanjung Morawa', 'Kec. Percut Sei Tuan'],
    defaultHubLoket: 'Kargo Kualanamu / Sub-Agent Medan',
    estimatedShippingFee: 75000
  },
  {
    id: 'sumut-pematangsiantar',
    island: 'Sumatera',
    province: 'Sumatera Utara',
    cityRegency: 'Kota Pematangsiantar / Simalungun',
    districtList: ['Kec. Siantar Barat', 'Kec. Siantar Timur'],
    defaultHubLoket: 'Loket Kargo Siantar',
    estimatedShippingFee: 75000
  },
  {
    id: 'sumbar-padang',
    island: 'Sumatera',
    province: 'Sumatera Barat',
    cityRegency: 'Kota Padang',
    districtList: ['Kec. Padang Barat', 'Kec. Padang Timur', 'Kec. Koto Tangah'],
    defaultHubLoket: 'Ekspedisi Kargo Darat Padang (JNE/JNT/Indah Kargo)',
    estimatedShippingFee: 120000
  },
  {
    id: 'riau-pekanbaru',
    island: 'Sumatera',
    province: 'Riau',
    cityRegency: 'Kota Pekanbaru',
    districtList: ['Kec. Tampan', 'Kec. Marpoyan Damai', 'Kec. Sukajadi'],
    defaultHubLoket: 'Indah Logistik / Dakota Kargo Pekanbaru',
    estimatedShippingFee: 110000
  },
  {
    id: 'kepri-batam',
    island: 'Sumatera',
    province: 'Kepulauan Riau',
    cityRegency: 'Kota Batam',
    districtList: ['Kec. Batam Kota', 'Kec. Lubuk Baja (Nagoya)', 'Kec. Sekupang'],
    defaultHubLoket: 'Kargo Udara / Pelabuhan Logistik Batam',
    estimatedShippingFee: 180000
  },
  {
    id: 'sumsel-palembang',
    island: 'Sumatera',
    province: 'Sumatera Selatan',
    cityRegency: 'Kota Palembang',
    districtList: ['Kec. Ilir Timur', 'Kec. Ilir Barat', 'Kec. Seberang Ulu'],
    defaultHubLoket: 'Indah Logistik Palembang',
    estimatedShippingFee: 140000
  },
  {
    id: 'lampung-bandar-lampung',
    island: 'Sumatera',
    province: 'Lampung',
    cityRegency: 'Kota Bandar Lampung',
    districtList: ['Kec. Tanjung Karang Pusat', 'Kec. Kedaton', 'Kec. Rajabasa'],
    defaultHubLoket: 'Dakota / JNE Trucking Lampung',
    estimatedShippingFee: 150000
  },

  // --- JAKARTA & JAWA BARAT ---
  {
    id: 'jkt-selatan',
    island: 'Jawa',
    province: 'DKI Jakarta',
    cityRegency: 'Kota Jakarta Selatan',
    districtList: ['Kec. Kebayoran Baru (Senopati/SCBD)', 'Kec. Tebet', 'Kec. Setiabudi (Kuningan)', 'Kec. Cilandak', 'Kec. Pasar Minggu'],
    defaultHubLoket: 'Ekspedisi Udara/Darat Jakarta Hub South',
    estimatedShippingFee: 85000
  },
  {
    id: 'jkt-pusat',
    island: 'Jawa',
    province: 'DKI Jakarta',
    cityRegency: 'Kota Jakarta Pusat',
    districtList: ['Kec. Tanah Abang', 'Kec. Menteng', 'Kec. Gambir', 'Kec. Kemayoran'],
    defaultHubLoket: 'Central Jakarta Hub (JTR/Indah Cargo)',
    estimatedShippingFee: 85000
  },
  {
    id: 'jkt-barat',
    island: 'Jawa',
    province: 'DKI Jakarta',
    cityRegency: 'Kota Jakarta Barat',
    districtList: ['Kec. Kembangan', 'Kec. Kebon Jeruk', 'Kec. Grogol Petamburan'],
    defaultHubLoket: 'West Jakarta Hub',
    estimatedShippingFee: 85000
  },
  {
    id: 'jkt-timur',
    island: 'Jawa',
    province: 'DKI Jakarta',
    cityRegency: 'Kota Jakarta Timur',
    districtList: ['Kec. Jatinegara', 'Kec. Duren Sawit', 'Kec. Cakung'],
    defaultHubLoket: 'East Jakarta Hub (Pulogadung Logistik)',
    estimatedShippingFee: 85000
  },
  {
    id: 'jkt-utara',
    island: 'Jawa',
    province: 'DKI Jakarta',
    cityRegency: 'Kota Jakarta Utara',
    districtList: ['Kec. Kelapa Gading', 'Kec. Penjaringan (PIK)', 'Kec. Tanjung Priok'],
    defaultHubLoket: 'North Jakarta Cargo Terminal',
    estimatedShippingFee: 85000
  },
  {
    id: 'jabar-bandung',
    island: 'Jawa',
    province: 'Jawa Barat',
    cityRegency: 'Kota Bandung',
    districtList: ['Kec. Coblong (Dago)', 'Kec. Sumur Bandung', 'Kec. Cicendo', 'Kec. Lengkong', 'Kec. Sukajadi'],
    defaultHubLoket: 'Bandung Central Cargo Depot (JNE/Indah)',
    estimatedShippingFee: 95000
  },
  {
    id: 'jabar-bekasi',
    island: 'Jawa',
    province: 'Jawa Barat',
    cityRegency: 'Kota / Kab. Bekasi',
    districtList: ['Kec. Bekasi Selatan', 'Kec. Bekasi Barat', 'Kec. Cikarang Selatan'],
    defaultHubLoket: 'Bekasi Cargo Hub',
    estimatedShippingFee: 90000
  },
  {
    id: 'jabar-bogor',
    island: 'Jawa',
    province: 'Jawa Barat',
    cityRegency: 'Kota / Kab. Bogor',
    districtList: ['Kec. Bogor Tengah', 'Kec. Bogor Timur', 'Kec. Cibinong'],
    defaultHubLoket: 'Bogor Logistics Depot',
    estimatedShippingFee: 95000
  },
  {
    id: 'jabar-depok',
    island: 'Jawa',
    province: 'Jawa Barat',
    cityRegency: 'Kota Depok',
    districtList: ['Kec. Beji (Margonda)', 'Kec. Cimanggis', 'Kec. Pancoran Mas'],
    defaultHubLoket: 'Depok Cargo Hub',
    estimatedShippingFee: 90000
  },

  // --- JAWA TENGAH & DIY ---
  {
    id: 'jateng-semarang',
    island: 'Jawa',
    province: 'Jawa Tengah',
    cityRegency: 'Kota Semarang',
    districtList: ['Kec. Semarang Selatan', 'Kec. Semarang Tengah', 'Kec. Banyumanik'],
    defaultHubLoket: 'Semarang Cargo Terminal',
    estimatedShippingFee: 100000
  },
  {
    id: 'diy-yogyakarta',
    island: 'Jawa',
    province: 'DI Yogyakarta',
    cityRegency: 'Kota Yogyakarta / Kab. Sleman',
    districtList: ['Kec. Depok Sleman (Gejayan/Kaliurang)', 'Kec. Gondokusuman', 'Kec. Danurejan', 'Kec. Umbulharjo'],
    defaultHubLoket: 'Yogyakarta Express Hub',
    estimatedShippingFee: 105000
  },
  {
    id: 'jateng-surakarta',
    island: 'Jawa',
    province: 'Jawa Tengah',
    cityRegency: 'Kota Surakarta (Solo)',
    districtList: ['Kec. Banjarsari', 'Kec. Jebres', 'Kec. Laweyan'],
    defaultHubLoket: 'Solo Logistics Depot',
    estimatedShippingFee: 105000
  },

  // --- JAWA TIMUR & BALI ---
  {
    id: 'jatim-surabaya',
    island: 'Jawa',
    province: 'Jawa Timur',
    cityRegency: 'Kota Surabaya',
    districtList: ['Kec. Tegalsari', 'Kec. Gubeng', 'Kec. Wonokromo', 'Kec. Sukolilo', 'Kec. Mulyorejo'],
    defaultHubLoket: 'Surabaya Main Cargo Terminal (Tanjung Perak/JTR)',
    estimatedShippingFee: 115000
  },
  {
    id: 'jatim-malang',
    island: 'Jawa',
    province: 'Jawa Timur',
    cityRegency: 'Kota Malang',
    districtList: ['Kec. Klojen', 'Kec. Lowokwaru (Soekarno-Hatta)', 'Kec. Blimbing'],
    defaultHubLoket: 'Malang Cargo Depot',
    estimatedShippingFee: 120000
  },
  {
    id: 'bali-denpasar',
    island: 'Bali & Nusa Tenggara',
    province: 'Bali',
    cityRegency: 'Kota Denpasar / Badung (Kuta/Canggu)',
    districtList: ['Kec. Denpasar Selatan', 'Kec. Kuta Utara (Canggu/Seminyak)', 'Kec. Kuta (Tuban)'],
    defaultHubLoket: 'Bali Cargo Transit Denpasar / Kuta',
    estimatedShippingFee: 180000
  },
  {
    id: 'ntb-mataram',
    island: 'Bali & Nusa Tenggara',
    province: 'Nusa Tenggara Barat',
    cityRegency: 'Kota Mataram (Lombok)',
    districtList: ['Kec. Mataram', 'Kec. Ampenan', 'Kec. Cakranegara'],
    defaultHubLoket: 'Lombok Mataram Cargo Hub',
    estimatedShippingFee: 220000
  },

  // --- KALIMANTAN & SULAWESI ---
  {
    id: 'kalbar-pontianak',
    island: 'Kalimantan',
    province: 'Kalimantan Barat',
    cityRegency: 'Kota Pontianak',
    districtList: ['Kec. Pontianak Selatan', 'Kec. Pontianak Kota'],
    defaultHubLoket: 'Pontianak Air/Sea Cargo Hub',
    estimatedShippingFee: 250000
  },
  {
    id: 'kaltim-balikpapan',
    island: 'Kalimantan',
    province: 'Kalimantan Timur',
    cityRegency: 'Kota Balikpapan / IKN',
    districtList: ['Kec. Balikpapan Kota', 'Kec. Balikpapan Selatan'],
    defaultHubLoket: 'Balikpapan Port & Air Cargo Depot',
    estimatedShippingFee: 280000
  },
  {
    id: 'kaltim-samarinda',
    island: 'Kalimantan',
    province: 'Kalimantan Timur',
    cityRegency: 'Kota Samarinda',
    districtList: ['Kec. Samarinda Ulu', 'Kec. Samarinda Kota'],
    defaultHubLoket: 'Samarinda Cargo Terminal',
    estimatedShippingFee: 290000
  },
  {
    id: 'sulsel-makassar',
    island: 'Sulawesi',
    province: 'Sulawesi Selatan',
    cityRegency: 'Kota Makassar',
    districtList: ['Kec. Ujung Pandang', 'Kec. Panakkukang', 'Kec. Tamalanrea'],
    defaultHubLoket: 'Makassar Port & Air Cargo Hub',
    estimatedShippingFee: 280000
  },
  {
    id: 'sulut-manado',
    island: 'Sulawesi',
    province: 'Sulawesi Utara',
    cityRegency: 'Kota Manado',
    districtList: ['Kec. Wenang', 'Kec. Malalayang'],
    defaultHubLoket: 'Manado Express Cargo Depot',
    estimatedShippingFee: 320000
  },

  // --- PAPUA & MALUKU ---
  {
    id: 'papua-jayapura',
    island: 'Maluku & Papua',
    province: 'Papua',
    cityRegency: 'Kota Jayapura',
    districtList: ['Kec. Jayapura Utara', 'Kec. Jayapura Selatan', 'Kec. Abepura'],
    defaultHubLoket: 'Jayapura Port/Air Logistics Terminal',
    estimatedShippingFee: 450000
  },
  {
    id: 'maluku-ambon',
    island: 'Maluku & Papua',
    province: 'Maluku',
    cityRegency: 'Kota Ambon',
    districtList: ['Kec. Sirimau', 'Kec. Teluk Ambon'],
    defaultHubLoket: 'Ambon Sea Cargo Depot',
    estimatedShippingFee: 420000
  }
];
