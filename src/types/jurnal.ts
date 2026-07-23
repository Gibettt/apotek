export type StatusJurnal = "draft" | "diposting" | "dibatalkan";

export interface JurnalDetail {
  id: string;
  akunId: string;
  kodeAkun: string;
  namaAkun: string;
  tipeAkun: string;
  debit: number;
  kredit: number;
  keterangan?: string;
}

export interface JurnalUmum {
  id: string;
  cabangId?: string;
  nomor: string;
  tanggal: string;
  nomorReferensi?: string;
  sumber: string;
  sumberTabel?: string;
  sumberId?: string;
  deskripsi: string;
  status: StatusJurnal;
  dibuatOleh?: string;
  namaDibuatOleh?: string;
  postedAt?: string;
  postedBy?: string;
  namaPostedBy?: string;
  createdAt: string;
  updatedAt: string;
  details: JurnalDetail[];
  totalDebit: number;
  totalKredit: number;
}

export interface JurnalDetailInput {
  akunId: string;
  debit: number;
  kredit: number;
  keterangan?: string;
}

export interface JurnalInput {
  tanggal: string;
  nomorReferensi?: string;
  deskripsi: string;
  cabangId?: string;
  status?: "draft" | "diposting";
  details: JurnalDetailInput[];
}
