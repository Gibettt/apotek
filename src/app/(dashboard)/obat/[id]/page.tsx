import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import type { ModuleConfig, ModuleRecord } from "@/constants/modules";
import { obatService, type ObatListItem } from "@/services/obatService";

const obatDetailConfig: ModuleConfig = {
  key: "obat",
  title: "Obat",
  description: "Daftar obat dengan harga, stok, kategori, supplier, dan status resep.",
  basePath: "/obat",
  rows: [],
  columns: [],
  fields: [],
  detailTitleKey: "namaObat",
  allowDetail: true,
  allowEdit: true
};

function toDetailRecord(item: ObatListItem): ModuleRecord {
  return {
    id: item.id,
    kodeObat: item.kodeObat,
    namaObat: item.namaObat,
    kategori: item.kategoriNama ?? "-",
    supplier: item.supplierNama ?? "-",
    satuan: item.satuan,
    stokTersedia: item.stokTersedia,
    stokMinimum: item.stokMinimum,
    hargaBeli: item.hargaBeli,
    hargaJual: item.hargaJual,
    golongan: item.golongan,
    membutuhkanResep: item.membutuhkanResep,
    status: item.status,
    deskripsi: item.deskripsi,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export default async function DetailObatPage({
  params
}: {
  params: { id: string };
}) {
  const obat = await obatService.getById(Number(params.id)).catch(() => null);
  const record = obat ? toDetailRecord(obat) : undefined;

  return <ModuleDetailPage config={obatDetailConfig} record={record} />;
}
