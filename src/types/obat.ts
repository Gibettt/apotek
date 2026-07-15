export interface GolonganObat {
  id: string;
  kode: string;
  nama: string;
  butuhResep: boolean;
  butuhSuratPesanan: boolean;
  deskripsi?: string;
  aktif: boolean;
}

export interface KategoriBarang {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  kode: string;
  nama: string;
  tipeSupplier?: string;
  npwp?: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  kota?: string;
  provinsi?: string;
  kontakPerson?: string;
  tempoBayarHari: number;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HargaAktif {
  hargaBeli: number;
  hargaJual: number;
}

export interface Obat {
  id: string;
  kode: string;
  namaGenerik?: string;
  nama: string;
  kategoriId?: string;
  kategoriNama?: string;
  golonganId?: string;
  golonganNama?: string;
  satuanDefaultId?: string;
  satuanNama?: string;
  stokMinimum: number;
  stokMaksimum: number;
  stokTersedia: number;
  gambarUrl?: string;
  komposisi?: string;
  indikasi?: string;
  aturanPakai?: string;
  perluBatch: boolean;
  perluExpired: boolean;
  membutuhkanResep: boolean;
  hargaAktif?: HargaAktif;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pelanggan {
  id: string;
  kode: string;
  nama: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  tanggalLahir?: string;
  jenisKelamin?: "L" | "P";
  catatanAlergi?: string;
  member: boolean;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
}
