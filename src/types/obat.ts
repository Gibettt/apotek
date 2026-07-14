export type ObatGolongan = "bebas" | "bebas terbatas" | "keras";

export interface KategoriObat {
  id: number;
  nama: string;
  deskripsi: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  namaSupplier: string;
  telepon: string;
  email: string;
  alamat: string;
  kontakPerson: string;
  npwp: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Obat {
  id: number;
  kodeObat: string;
  namaObat: string;
  kategoriId: number;
  supplierId: number;
  satuan: string;
  hargaBeli: number;
  hargaJual: number;
  stokMinimum: number;
  stokTersedia: number;
  gambarUrl: string;
  deskripsi: string;
  golongan: ObatGolongan;
  membutuhkanResep: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pelanggan {
  id: number;
  nama: string;
  telepon: string;
  alamat: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  noBpjs?: string;
  noKtp?: string;
  alergi?: string;
  createdAt: string;
  updatedAt: string;
}
