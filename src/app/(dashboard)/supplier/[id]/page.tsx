import { ModuleDetailPage } from "@/components/pages/ModuleDetailPage";
import { moduleConfigs } from "@/constants/modules";
import { supplierService } from "@/services/supplierService";
import type { Supplier } from "@/types";

function supplierToRecord(supplier: Supplier) {
  return {
    id: supplier.id,
    nama: supplier.nama,
    kontakPerson: supplier.kontakPerson,
    telepon: supplier.telepon,
    email: supplier.email,
    npwp: supplier.npwp,
    alamat: supplier.alamat,
    aktif: supplier.aktif,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt
  };
}

export default async function DetailSupplierPage({
  params
}: {
  params: { id: string };
}) {
  const supplier = await supplierService
    .getById(params.id)
    .catch(() => null);
  const record = supplier ? supplierToRecord(supplier) : undefined;

  return <ModuleDetailPage config={moduleConfigs.supplier} record={record} />;
}
