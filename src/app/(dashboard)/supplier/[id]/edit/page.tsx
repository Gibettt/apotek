import { SupplierForm } from "@/components/forms/SupplierForm";
import { supplierService } from "@/services/supplierService";
import type { Supplier } from "@/types";

function supplierToRecord(supplier: Supplier) {
  return {
    id: supplier.id,
    namaSupplier: supplier.namaSupplier,
    kontakPerson: supplier.kontakPerson,
    telepon: supplier.telepon,
    email: supplier.email,
    npwp: supplier.npwp,
    alamat: supplier.alamat,
    status: supplier.status
  };
}

export default async function EditSupplierPage({
  params
}: {
  params: { id: string };
}) {
  const supplier = await supplierService
    .getById(Number(params.id))
    .catch(() => null);
  const record = supplier ? supplierToRecord(supplier) : undefined;

  return <SupplierForm record={record} />;
}
