import type {
  AuthUser,
  ChartPoint,
  DashboardSummary,
  KategoriObat,
  Notifikasi,
  Obat,
  Pelanggan,
  Pembelian,
  Penjualan,
  ReportRow,
  Resep,
  Setting,
  StokBatch,
  StokMutasi,
  Supplier,
  User
} from "@/types";

export const currentUser: AuthUser = {
  id: "4e3f8e46-6c48-4b6e-9f30-1b87dbb71b11",
  name: "Nadia Putri",
  email: "owner@apotek.local",
  role: "owner",
  status: true
};

export const kategoriObat: KategoriObat[] = [
  {
    id: 1,
    nama: "Analgesik",
    deskripsi: "Obat pereda nyeri dan demam",
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  },
  {
    id: 2,
    nama: "Antibiotik",
    deskripsi: "Obat keras untuk infeksi bakteri",
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  },
  {
    id: 3,
    nama: "Vitamin",
    deskripsi: "Suplemen dan vitamin harian",
    createdAt: "2026-06-02T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  }
];

export const suppliers: Supplier[] = [
  {
    id: 1,
    namaSupplier: "PT Sehat Farma",
    telepon: "02177889900",
    email: "sales@sehatfarma.co.id",
    alamat: "Jl. Industri Farmasi No. 7, Jakarta",
    kontakPerson: "Riko Pratama",
    npwp: "01.234.567.8-901.000",
    status: true,
    createdAt: "2026-05-10T09:00:00+07:00",
    updatedAt: "2026-07-01T09:00:00+07:00"
  },
  {
    id: 2,
    namaSupplier: "CV Medika Nusantara",
    telepon: "02288997766",
    email: "admin@medikanusantara.id",
    alamat: "Jl. Pajajaran No. 22, Bandung",
    kontakPerson: "Maya Lestari",
    npwp: "02.345.678.9-012.000",
    status: true,
    createdAt: "2026-05-11T09:00:00+07:00",
    updatedAt: "2026-07-01T09:00:00+07:00"
  }
];

export const obat: Obat[] = [
  {
    id: 1,
    kodeObat: "OBT-0001",
    namaObat: "Paracetamol 500mg",
    kategoriId: 1,
    supplierId: 1,
    satuan: "tablet",
    hargaBeli: 300,
    hargaJual: 650,
    stokMinimum: 120,
    stokTersedia: 340,
    gambarUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    deskripsi: "Pereda demam dan nyeri ringan",
    golongan: "bebas",
    membutuhkanResep: false,
    status: true,
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: 2,
    kodeObat: "OBT-0002",
    namaObat: "Amoxicillin 500mg",
    kategoriId: 2,
    supplierId: 1,
    satuan: "kapsul",
    hargaBeli: 850,
    hargaJual: 1500,
    stokMinimum: 80,
    stokTersedia: 52,
    gambarUrl:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80",
    deskripsi: "Antibiotik golongan penisilin",
    golongan: "keras",
    membutuhkanResep: true,
    status: true,
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: 3,
    kodeObat: "OBT-0003",
    namaObat: "Vitamin C 500mg",
    kategoriId: 3,
    supplierId: 2,
    satuan: "tablet",
    hargaBeli: 600,
    hargaJual: 1200,
    stokMinimum: 100,
    stokTersedia: 210,
    gambarUrl:
      "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=800&q=80",
    deskripsi: "Suplemen daya tahan tubuh",
    golongan: "bebas",
    membutuhkanResep: false,
    status: true,
    createdAt: "2026-06-02T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: 4,
    kodeObat: "OBT-0004",
    namaObat: "Ibuprofen 400mg",
    kategoriId: 1,
    supplierId: 2,
    satuan: "tablet",
    hargaBeli: 500,
    hargaJual: 1000,
    stokMinimum: 90,
    stokTersedia: 18,
    gambarUrl:
      "https://images.unsplash.com/photo-1576602975754-efdf313b9342?auto=format&fit=crop&w=800&q=80",
    deskripsi: "Antiinflamasi non-steroid",
    golongan: "bebas terbatas",
    membutuhkanResep: false,
    status: true,
    createdAt: "2026-06-03T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  }
];

export const pelanggan: Pelanggan[] = [
  {
    id: 1,
    nama: "Siti Rahma",
    telepon: "081234567890",
    alamat: "Jl. Melati No. 3",
    tanggalLahir: "1992-03-14",
    jenisKelamin: "P",
    noBpjs: "0001234567890",
    noKtp: "3273015403920001",
    alergi: "Penisilin",
    createdAt: "2026-06-10T10:00:00+07:00",
    updatedAt: "2026-07-01T10:00:00+07:00"
  },
  {
    id: 2,
    nama: "Budi Santoso",
    telepon: "081298765432",
    alamat: "Jl. Kenanga No. 8",
    tanggalLahir: "1987-11-20",
    jenisKelamin: "L",
    createdAt: "2026-06-11T10:00:00+07:00",
    updatedAt: "2026-07-01T10:00:00+07:00"
  }
];

export const stokBatches: StokBatch[] = [
  {
    id: 1,
    obatId: 1,
    namaObat: "Paracetamol 500mg",
    batchNumber: "B-PCT-0726",
    tanggalExpired: "2027-07-01",
    jumlah: 340,
    lokasi: "Rak A1",
    createdAt: "2026-07-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: 2,
    obatId: 2,
    namaObat: "Amoxicillin 500mg",
    batchNumber: "B-AMX-0127",
    tanggalExpired: "2027-01-20",
    jumlah: 52,
    lokasi: "Rak B2",
    createdAt: "2026-07-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: 3,
    obatId: 4,
    namaObat: "Ibuprofen 400mg",
    batchNumber: "B-IBU-0826",
    tanggalExpired: "2026-08-18",
    jumlah: 18,
    lokasi: "Rak A2",
    createdAt: "2026-07-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  }
];

export const stokMutasi: StokMutasi[] = [
  {
    id: 1,
    obatId: 1,
    namaObat: "Paracetamol 500mg",
    tipeMutasi: "masuk",
    jumlah: 200,
    sumber: "pembelian",
    referensiId: 1,
    stokSebelum: 140,
    stokSesudah: 340,
    keterangan: "Penerimaan PO Juli",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T08:35:00+07:00"
  },
  {
    id: 2,
    obatId: 4,
    namaObat: "Ibuprofen 400mg",
    tipeMutasi: "keluar",
    jumlah: 12,
    sumber: "penjualan",
    referensiId: 1,
    stokSebelum: 30,
    stokSesudah: 18,
    keterangan: "Transaksi kasir",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T10:12:00+07:00"
  }
];

export const pembelian: Pembelian[] = [
  {
    id: 1,
    nomorPembelian: "PBL-20260707-0001",
    supplierId: 1,
    namaSupplier: "PT Sehat Farma",
    tanggalPembelian: "2026-07-07",
    subtotal: 230000,
    diskon: 0,
    pajak: 25300,
    total: 255300,
    status: "diterima",
    catatan: "Restock awal bulan",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T08:00:00+07:00",
    updatedAt: "2026-07-07T09:00:00+07:00",
    details: [
      {
        id: 1,
        pembelianId: 1,
        obatId: 1,
        namaObat: "Paracetamol 500mg",
        batchNumber: "B-PCT-0726",
        tanggalExpired: "2027-07-01",
        jumlah: 200,
        hargaBeli: 300,
        diskon: 0,
        subtotal: 60000
      },
      {
        id: 2,
        pembelianId: 1,
        obatId: 2,
        namaObat: "Amoxicillin 500mg",
        batchNumber: "B-AMX-0127",
        tanggalExpired: "2027-01-20",
        jumlah: 200,
        hargaBeli: 850,
        diskon: 0,
        subtotal: 170000
      }
    ]
  }
];

export const penjualan: Penjualan[] = [
  {
    id: 1,
    nomorPenjualan: "PJL-20260707-0001",
    pelangganId: 2,
    namaPelanggan: "Budi Santoso",
    tanggalPenjualan: "2026-07-07T10:12:00+07:00",
    subtotal: 19200,
    diskon: 0,
    pajak: 0,
    total: 19200,
    metodePembayaran: "tunai",
    bayar: 20000,
    kembalian: 800,
    status: "selesai",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T10:12:00+07:00",
    details: [
      {
        id: 1,
        penjualanId: 1,
        obatId: 1,
        namaObat: "Paracetamol 500mg",
        jumlah: 12,
        hargaJual: 650,
        diskon: 0,
        subtotal: 7800
      },
      {
        id: 2,
        penjualanId: 1,
        obatId: 4,
        namaObat: "Ibuprofen 400mg",
        jumlah: 12,
        hargaJual: 950,
        diskon: 0,
        subtotal: 11400
      }
    ]
  }
];

export const resep: Resep[] = [
  {
    id: 1,
    nomorResep: "RSP-20260707-0001",
    pelangganId: 1,
    namaPelanggan: "Siti Rahma",
    namaDokter: "dr. Andika Wijaya",
    noSipDokter: "SIP.445/2024",
    asalPuskesmas: "Klinik Melati",
    tanggalResep: "2026-07-07",
    catatan: "Pasien alergi penisilin",
    status: "menunggu",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T11:00:00+07:00",
    updatedAt: "2026-07-07T11:00:00+07:00",
    details: [
      {
        id: 1,
        resepId: 1,
        obatId: 3,
        namaObat: "Vitamin C 500mg",
        aturanPakai: "1x1 setelah makan",
        jumlah: 10
      }
    ]
  }
];

export const users: User[] = [
  {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: "owner",
    status: true,
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  },
  {
    id: "21bb6e22-2c0f-44ec-9b0e-931dbe64275b",
    name: "Dimas Kasir",
    email: "kasir@apotek.local",
    role: "kasir",
    status: true,
    createdAt: "2026-06-15T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  }
];

export const notifikasi: Notifikasi[] = [
  {
    id: 1,
    tipe: "stok_menipis",
    judul: "Stok Amoxicillin menipis",
    pesan: "Sisa 52 kapsul, di bawah minimum 80.",
    referensiId: 2,
    isRead: false,
    targetRole: "admin",
    createdAt: "2026-07-07T08:45:00+07:00"
  },
  {
    id: 2,
    tipe: "obat_expired",
    judul: "Ibuprofen mendekati expired",
    pesan: "Batch B-IBU-0826 expired pada 18 Agustus 2026.",
    referensiId: 3,
    isRead: false,
    targetRole: "apoteker",
    createdAt: "2026-07-07T08:50:00+07:00"
  }
];

export const settings: Setting[] = [
  {
    id: 1,
    key: "apotek_nama",
    value: "Apotek Ananda",
    group: "apotek",
    label: "Nama Apotek"
  },
  {
    id: 2,
    key: "apotek_alamat",
    value: "Jl. Kesehatan No. 12, Jakarta",
    group: "apotek",
    label: "Alamat"
  },
  {
    id: 3,
    key: "struk_footer",
    value: "Terima kasih, semoga lekas sehat.",
    group: "struk",
    label: "Footer Struk"
  },
  {
    id: 4,
    key: "stok_minimum_default",
    value: "50",
    group: "stok",
    label: "Stok Minimum Default"
  },
  {
    id: 5,
    key: "notifikasi_expired_hari",
    value: "60",
    group: "notifikasi",
    label: "Peringatan Expired"
  }
];

export const dashboardSummary: DashboardSummary = {
  totalPenjualanHariIni: 19200,
  jumlahTransaksiHariIni: 1,
  stokMenipis: obat.filter((item) => item.stokTersedia < item.stokMinimum)
    .length,
  obatExpired: stokBatches.filter(
    (item) => new Date(item.tanggalExpired) < new Date("2026-09-07")
  ).length,
  pembelianTerbaru: pembelian.length
};

export const salesChart: ChartPoint[] = [
  { label: "Sen", penjualan: 125000, pembelian: 0, laba: 52000 },
  { label: "Sel", penjualan: 19200, pembelian: 255300, laba: 7400 },
  { label: "Rab", penjualan: 88000, pembelian: 0, laba: 33000 },
  { label: "Kam", penjualan: 132000, pembelian: 110000, laba: 59000 },
  { label: "Jum", penjualan: 97500, pembelian: 0, laba: 41000 },
  { label: "Sab", penjualan: 151000, pembelian: 0, laba: 68000 },
  { label: "Min", penjualan: 73000, pembelian: 0, laba: 27000 }
];

export const reportRows: Record<string, ReportRow[]> = {
  penjualan: penjualan.map((item) => ({
    id: item.id,
    tanggal: item.tanggalPenjualan,
    referensi: item.nomorPenjualan,
    kategori: item.metodePembayaran,
    nilai: item.total,
    status: item.status
  })),
  pembelian: pembelian.map((item) => ({
    id: item.id,
    tanggal: item.tanggalPembelian,
    referensi: item.nomorPembelian,
    kategori: item.namaSupplier,
    nilai: item.total,
    status: item.status
  })),
  stok: stokBatches.map((item) => ({
    id: item.id,
    tanggal: item.tanggalExpired,
    referensi: item.batchNumber,
    kategori: item.namaObat,
    nilai: item.jumlah,
    status: item.lokasi
  })),
  "laba-rugi": salesChart.map((item, index) => ({
    id: index + 1,
    tanggal: `2026-07-0${index + 1}`,
    referensi: item.label,
    kategori: "Laba kotor",
    nilai: item.laba ?? 0,
    status: "selesai"
  }))
};
