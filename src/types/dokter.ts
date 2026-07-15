export interface DokterSpesialis {
  id: string;
  kode: string;
  nama: string;
}

export interface Dokter {
  id: string;
  kode: string;
  nama: string;
  nomorSip?: string;
  spesialisId?: string;
  spesialisNama?: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  aktif: boolean;
}
