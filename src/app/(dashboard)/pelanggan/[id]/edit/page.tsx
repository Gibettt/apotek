import { PelangganForm } from "@/components/forms/PelangganForm";
import { pelangganService } from "@/services/pelangganService";
import type { Pelanggan } from "@/types";

function toRecord(p: Pelanggan) {
  return {
    id: p.id,
    kode: p.kode,
    nama: p.nama,
    telepon: p.telepon ?? "",
    email: p.email ?? "",
    tanggalLahir: p.tanggalLahir ?? "",
    jenisKelamin: p.jenisKelamin ?? "",
    alamat: p.alamat ?? "",
    catatanAlergi: p.catatanAlergi ?? "",
    member: p.member,
    aktif: p.aktif
  };
}

export default async function EditPelangganPage({
  params
}: {
  params: { id: string };
}) {
  const pelanggan = await pelangganService.getById(params.id).catch(() => null);
  const record = pelanggan ? toRecord(pelanggan) : undefined;

  return <PelangganForm record={record} />;
}
