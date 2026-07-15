import type {
  AuthUser,
  Cabang,
  ChartPoint,
  DashboardSummary,
  Dokter,
  GolonganObat,
  KategoriBarang,
  Notifikasi,
  Obat,
  Pelanggan,
  Pembelian,
  Pengaturan,
  Penjualan,
  ReportRow,
  Resep,
  StokBatch,
  StokMutasi,
  Supplier,
  User
} from "@/types";

export const defaultCabangId = "00000000-0000-0000-0000-0000000000c1";

export const currentUser: AuthUser = {
  id: "4e3f8e46-6c48-4b6e-9f30-1b87dbb71b11",
  name: "Nadia Putri",
  email: "owner@apotek.local",
  role: "owner",
  status: true,
  cabangIds: [defaultCabangId],
  activeCabangId: defaultCabangId
};

export const cabangList: Cabang[] = [
  {
    id: defaultCabangId,
    kode: "PST",
    nama: "Apotek Pusat",
    telepon: "0217700100",
    email: "pusat@apotek.local",
    alamat: "Jl. Kesehatan No. 12, Jakarta",
    kota: "Jakarta",
    provinsi: "DKI Jakarta",
    aktif: true
  }
];

export const golonganObat: GolonganObat[] = [
  { id: "g-bebas", kode: "bebas", nama: "Obat Bebas", butuhResep: false, butuhSuratPesanan: false, aktif: true },
  { id: "g-bebas-terbatas", kode: "bebas_terbatas", nama: "Obat Bebas Terbatas", butuhResep: false, butuhSuratPesanan: false, aktif: true },
  { id: "g-keras", kode: "keras", nama: "Obat Keras", butuhResep: true, butuhSuratPesanan: true, aktif: true }
];

export const kategoriBarang: KategoriBarang[] = [
  {
    id: "k-1",
    kode: "analgesik",
    nama: "Analgesik",
    deskripsi: "Obat pereda nyeri dan demam",
    aktif: true,
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  },
  {
    id: "k-2",
    kode: "antibiotik",
    nama: "Antibiotik",
    deskripsi: "Obat keras untuk infeksi bakteri",
    aktif: true,
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  },
  {
    id: "k-3",
    kode: "vitamin",
    nama: "Vitamin",
    deskripsi: "Suplemen dan vitamin harian",
    aktif: true,
    createdAt: "2026-06-02T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  }
];

export const suppliers: Supplier[] = [
  {
    id: "s-1",
    kode: "SUP-001",
    nama: "PT Sehat Farma",
    telepon: "02177889900",
    email: "sales@sehatfarma.co.id",
    alamat: "Jl. Industri Farmasi No. 7, Jakarta",
    kontakPerson: "Riko Pratama",
    npwp: "01.234.567.8-901.000",
    tempoBayarHari: 30,
    aktif: true,
    createdAt: "2026-05-10T09:00:00+07:00",
    updatedAt: "2026-07-01T09:00:00+07:00"
  },
  {
    id: "s-2",
    kode: "SUP-002",
    nama: "CV Medika Nusantara",
    telepon: "02288997766",
    email: "admin@medikanusantara.id",
    alamat: "Jl. Pajajaran No. 22, Bandung",
    kontakPerson: "Maya Lestari",
    npwp: "02.345.678.9-012.000",
    tempoBayarHari: 14,
    aktif: true,
    createdAt: "2026-05-11T09:00:00+07:00",
    updatedAt: "2026-07-01T09:00:00+07:00"
  }
];

export const obat: Obat[] = [
  {
    id: "o-1",
    kode: "OBT-0001",
    nama: "Paracetamol 500mg",
    kategoriId: "k-1",
    kategoriNama: "Analgesik",
    golonganId: "g-bebas",
    golonganNama: "Obat Bebas",
    satuanNama: "tablet",
    stokMinimum: 120,
    stokMaksimum: 500,
    stokTersedia: 340,
    gambarUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    indikasi: "Pereda demam dan nyeri ringan",
    perluBatch: true,
    perluExpired: true,
    membutuhkanResep: false,
    hargaAktif: { hargaBeli: 300, hargaJual: 650 },
    status: true,
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: "o-2",
    kode: "OBT-0002",
    nama: "Amoxicillin 500mg",
    kategoriId: "k-2",
    kategoriNama: "Antibiotik",
    golonganId: "g-keras",
    golonganNama: "Obat Keras",
    satuanNama: "kapsul",
    stokMinimum: 80,
    stokMaksimum: 400,
    stokTersedia: 52,
    gambarUrl:
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80",
    indikasi: "Antibiotik golongan penisilin",
    perluBatch: true,
    perluExpired: true,
    membutuhkanResep: true,
    hargaAktif: { hargaBeli: 850, hargaJual: 1500 },
    status: true,
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: "o-3",
    kode: "OBT-0003",
    nama: "Vitamin C 500mg",
    kategoriId: "k-3",
    kategoriNama: "Vitamin",
    golonganId: "g-bebas",
    golonganNama: "Obat Bebas",
    satuanNama: "tablet",
    stokMinimum: 100,
    stokMaksimum: 500,
    stokTersedia: 210,
    gambarUrl:
      "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=800&q=80",
    indikasi: "Suplemen daya tahan tubuh",
    perluBatch: true,
    perluExpired: true,
    membutuhkanResep: false,
    hargaAktif: { hargaBeli: 600, hargaJual: 1200 },
    status: true,
    createdAt: "2026-06-02T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: "o-4",
    kode: "OBT-0004",
    nama: "Ibuprofen 400mg",
    kategoriId: "k-1",
    kategoriNama: "Analgesik",
    golonganId: "g-bebas-terbatas",
    golonganNama: "Obat Bebas Terbatas",
    satuanNama: "tablet",
    stokMinimum: 90,
    stokMaksimum: 400,
    stokTersedia: 18,
    gambarUrl:
      "https://images.unsplash.com/photo-1576602975754-efdf313b9342?auto=format&fit=crop&w=800&q=80",
    indikasi: "Antiinflamasi non-steroid",
    perluBatch: true,
    perluExpired: true,
    membutuhkanResep: false,
    hargaAktif: { hargaBeli: 500, hargaJual: 1000 },
    status: true,
    createdAt: "2026-06-03T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  }
];

export const pelanggan: Pelanggan[] = [
  {
    id: "p-1",
    kode: "PLG-0001",
    nama: "Siti Rahma",
    telepon: "081234567890",
    alamat: "Jl. Melati No. 3",
    tanggalLahir: "1992-03-14",
    jenisKelamin: "P",
    catatanAlergi: "Penisilin",
    member: true,
    aktif: true,
    createdAt: "2026-06-10T10:00:00+07:00",
    updatedAt: "2026-07-01T10:00:00+07:00"
  },
  {
    id: "p-2",
    kode: "PLG-0002",
    nama: "Budi Santoso",
    telepon: "081298765432",
    alamat: "Jl. Kenanga No. 8",
    tanggalLahir: "1987-11-20",
    jenisKelamin: "L",
    member: false,
    aktif: true,
    createdAt: "2026-06-11T10:00:00+07:00",
    updatedAt: "2026-07-01T10:00:00+07:00"
  }
];

export const dokterList: Dokter[] = [
  {
    id: "d-1",
    kode: "DOK-0001",
    nama: "dr. Andika Wijaya",
    nomorSip: "SIP.445/2024",
    aktif: true
  }
];

export const stokBatches: StokBatch[] = [
  {
    id: "sb-1",
    barangId: "o-1",
    namaBarang: "Paracetamol 500mg",
    nomorBatch: "B-PCT-0726",
    tanggalExpired: "2027-07-01",
    qty: 340,
    cabangId: defaultCabangId,
    lokasiNama: "Rak A1",
    createdAt: "2026-07-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: "sb-2",
    barangId: "o-2",
    namaBarang: "Amoxicillin 500mg",
    nomorBatch: "B-AMX-0127",
    tanggalExpired: "2027-01-20",
    qty: 52,
    cabangId: defaultCabangId,
    lokasiNama: "Rak B2",
    createdAt: "2026-07-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  },
  {
    id: "sb-3",
    barangId: "o-4",
    namaBarang: "Ibuprofen 400mg",
    nomorBatch: "B-IBU-0826",
    tanggalExpired: "2026-08-18",
    qty: 18,
    cabangId: defaultCabangId,
    lokasiNama: "Rak A2",
    createdAt: "2026-07-01T08:00:00+07:00",
    updatedAt: "2026-07-07T08:00:00+07:00"
  }
];

export const stokMutasi: StokMutasi[] = [
  {
    id: "km-1",
    cabangId: defaultCabangId,
    barangId: "o-1",
    namaBarang: "Paracetamol 500mg",
    tipeMutasi: "masuk",
    qtyMasuk: 200,
    qtyKeluar: 0,
    saldoAkhir: 340,
    hargaPokok: 300,
    sumberTabel: "faktur_pembelian",
    keterangan: "Penerimaan PO Juli",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T08:35:00+07:00"
  },
  {
    id: "km-2",
    cabangId: defaultCabangId,
    barangId: "o-4",
    namaBarang: "Ibuprofen 400mg",
    tipeMutasi: "keluar",
    qtyMasuk: 0,
    qtyKeluar: 12,
    saldoAkhir: 18,
    hargaPokok: 500,
    sumberTabel: "penjualan",
    keterangan: "Transaksi kasir",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T10:12:00+07:00"
  }
];

export const pembelian: Pembelian[] = [
  {
    id: "pb-1",
    cabangId: defaultCabangId,
    nomorFaktur: "FKT-0001",
    nomorInternal: "PBL-20260707-0001",
    supplierId: "s-1",
    namaSupplier: "PT Sehat Farma",
    tanggalFaktur: "2026-07-07",
    subtotal: 230000,
    diskonTotal: 0,
    pajakTotal: 25300,
    grandTotal: 255300,
    status: "diterima",
    catatan: "Restock awal bulan",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T08:00:00+07:00",
    updatedAt: "2026-07-07T09:00:00+07:00",
    details: [
      {
        id: "pbd-1",
        pembelianId: "pb-1",
        barangId: "o-1",
        namaBarang: "Paracetamol 500mg",
        batchNumber: "B-PCT-0726",
        tanggalExpired: "2027-07-01",
        jumlah: 200,
        hargaBeli: 300,
        diskonPersen: 0,
        diskonNominal: 0,
        subtotal: 60000,
        hargaPokok: 300
      },
      {
        id: "pbd-2",
        pembelianId: "pb-1",
        barangId: "o-2",
        namaBarang: "Amoxicillin 500mg",
        batchNumber: "B-AMX-0127",
        tanggalExpired: "2027-01-20",
        jumlah: 200,
        hargaBeli: 850,
        diskonPersen: 0,
        diskonNominal: 0,
        subtotal: 170000,
        hargaPokok: 850
      }
    ]
  }
];

export const penjualan: Penjualan[] = [
  {
    id: "pj-1",
    cabangId: defaultCabangId,
    nomorInvoice: "PJL-20260707-0001",
    pelangganId: "p-2",
    namaPelanggan: "Budi Santoso",
    tanggal: "2026-07-07T10:12:00+07:00",
    tipePenjualan: "umum",
    subtotal: 19200,
    diskonTotal: 0,
    pajakTotal: 0,
    grandTotal: 19200,
    bayarTotal: 20000,
    kembalian: 800,
    statusBayar: "lunas",
    status: "selesai",
    metodePembayaran: "tunai",
    createdBy: currentUser.id,
    createdAt: "2026-07-07T10:12:00+07:00",
    details: [
      {
        id: "pjd-1",
        penjualanId: "pj-1",
        barangId: "o-1",
        namaBarang: "Paracetamol 500mg",
        jumlah: 12,
        hargaJual: 650,
        diskonPersen: 0,
        diskonNominal: 0,
        subtotal: 7800,
        hargaPokok: 300
      },
      {
        id: "pjd-2",
        penjualanId: "pj-1",
        barangId: "o-4",
        namaBarang: "Ibuprofen 400mg",
        jumlah: 12,
        hargaJual: 950,
        diskonPersen: 0,
        diskonNominal: 0,
        subtotal: 11400,
        hargaPokok: 500
      }
    ]
  }
];

export const resep: Resep[] = [
  {
    id: "r-1",
    nomorResep: "RSP-20260707-0001",
    pelangganId: "p-1",
    namaPelanggan: "Siti Rahma",
    dokterId: "d-1",
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
        id: "rd-1",
        resepId: "r-1",
        barangId: "o-3",
        namaBarang: "Vitamin C 500mg",
        aturanPakai: "1x1 setelah makan",
        jumlah: 10,
        racikan: false
      }
    ]
  }
];

export const users: User[] = [
  {
    id: currentUser.id,
    namaLengkap: currentUser.name,
    email: currentUser.email,
    role: "owner",
    status: true,
    cabangIds: [defaultCabangId],
    defaultCabangId,
    createdAt: "2026-06-01T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  },
  {
    id: "21bb6e22-2c0f-44ec-9b0e-931dbe64275b",
    namaLengkap: "Dimas Kasir",
    email: "kasir@apotek.local",
    role: "kasir",
    status: true,
    cabangIds: [defaultCabangId],
    defaultCabangId,
    createdAt: "2026-06-15T08:00:00+07:00",
    updatedAt: "2026-07-01T08:00:00+07:00"
  }
];

export const notifikasi: Notifikasi[] = [
  {
    id: "n-1",
    cabangId: defaultCabangId,
    tipe: "stok_menipis",
    judul: "Stok Amoxicillin menipis",
    pesan: "Sisa 52 kapsul, di bawah minimum 80.",
    referensiTabel: "barang",
    referensiId: "o-2",
    isRead: false,
    targetRole: "admin",
    createdAt: "2026-07-07T08:45:00+07:00"
  },
  {
    id: "n-2",
    cabangId: defaultCabangId,
    tipe: "obat_expired",
    judul: "Ibuprofen mendekati expired",
    pesan: "Batch B-IBU-0826 expired pada 18 Agustus 2026.",
    referensiTabel: "batch_barang",
    referensiId: "sb-3",
    isRead: false,
    targetRole: "apoteker",
    createdAt: "2026-07-07T08:50:00+07:00"
  }
];

export const settings: Pengaturan[] = [
  {
    id: "st-1",
    cabangId: defaultCabangId,
    key: "apotek_nama",
    value: "Apotek Ananda",
    group: "apotek",
    label: "Nama Apotek"
  },
  {
    id: "st-2",
    cabangId: defaultCabangId,
    key: "apotek_alamat",
    value: "Jl. Kesehatan No. 12, Jakarta",
    group: "apotek",
    label: "Alamat"
  },
  {
    id: "st-3",
    cabangId: defaultCabangId,
    key: "struk_footer",
    value: "Terima kasih, semoga lekas sehat.",
    group: "struk",
    label: "Footer Struk"
  },
  {
    id: "st-4",
    cabangId: defaultCabangId,
    key: "stok_minimum_default",
    value: "50",
    group: "stok",
    label: "Stok Minimum Default"
  },
  {
    id: "st-5",
    cabangId: defaultCabangId,
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
    (item) => item.tanggalExpired && new Date(item.tanggalExpired) < new Date("2026-09-07")
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
    tanggal: item.tanggal,
    referensi: item.nomorInvoice,
    kategori: item.metodePembayaran ?? "tunai",
    nilai: item.grandTotal,
    status: item.status
  })),
  pembelian: pembelian.map((item) => ({
    id: item.id,
    tanggal: item.tanggalFaktur,
    referensi: item.nomorInternal,
    kategori: item.namaSupplier,
    nilai: item.grandTotal,
    status: item.status
  })),
  stok: stokBatches.map((item) => ({
    id: item.id,
    tanggal: item.tanggalExpired ?? "",
    referensi: item.nomorBatch,
    kategori: item.namaBarang,
    nilai: item.qty,
    status: item.lokasiNama ?? ""
  })),
  "laba-rugi": salesChart.map((item, index) => ({
    id: String(index + 1),
    tanggal: `2026-07-0${index + 1}`,
    referensi: item.label,
    kategori: "Laba kotor",
    nilai: item.laba ?? 0,
    status: "selesai"
  }))
};
