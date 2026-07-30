import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import type { ModuleConfig, ModuleRecord } from "@/constants/modules";
import { obatService, type ObatListItem } from "@/services/obatService";
import { returPenjualanService } from "@/services/returPenjualanService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const obatDetailConfig: ModuleConfig = {
  key: "obat",
  title: "Obat",
  description: "Daftar obat dengan harga, stok, kategori, golongan, dan status resep.",
  basePath: "/obat",
  load: async () => [],
  columns: [],
  fields: [],
  detailTitleKey: "nama",
  allowDetail: true,
  allowEdit: true
};

function toDetailRecord(item: ObatListItem): ModuleRecord {
  return {
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    kategori: item.kategoriNama ?? "-",
    golongan: item.golonganNama ?? "-",
    satuan: item.satuanNama ?? "-",
    stokTersedia: item.stokTersedia,
    stokMinimum: item.stokMinimum,
    hargaBeli: item.hargaAktif?.hargaBeli ?? 0,
    hargaJual: item.hargaAktif?.hargaJual ?? 0,
    membutuhkanResep: item.membutuhkanResep,
    status: item.status,
    komposisi: item.komposisi,
    indikasi: item.indikasi,
    aturanPakai: item.aturanPakai,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export default async function DetailObatPage({
  params
}: {
  params: { id: string };
}) {
  await returPenjualanService.list({ page: 1, perPage: 1000 }).catch(() => null);
  const obat = await obatService.getById(params.id).catch(() => null);
  const record = obat ? toDetailRecord(obat) : undefined;

  return <ModuleDetailPage config={obatDetailConfig} record={record} />;
}
