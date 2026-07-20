import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Pencil,
  Phone,
  Receipt,
  Truck,
  UserRound
} from "lucide-react";
import { supplierService } from "@/services/supplierService";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { Supplier } from "@/types";

function InfoRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Truck;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-stone-400 shadow-sm">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-slate-900">{value || "-"}</p>
      </div>
    </div>
  );
}

export default async function DetailSupplierPage({
  params
}: {
  params: { id: string };
}) {
  const supplier: Supplier | null = await supplierService
    .getById(params.id)
    .catch(() => null);

  if (!supplier) {
    return (
      <>
        <Header title="Distributor tidak ditemukan" description="Data distributor tidak tersedia." />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              Data yang diminta tidak tersedia. Pastikan ID distributor benar.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header
        title={supplier.nama}
        description="Detail informasi distributor/supplier."
        action={
          <div className="flex gap-2">
            <Link href="/supplier">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <Link href={`/supplier/${supplier.id}/edit`}>
              <Button>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent>
          {/* Status Banner */}
          <div className="mb-6 flex items-center gap-4 rounded-lg bg-[#f8f7f3] p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <Truck className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-lg font-black text-[#20201d]">{supplier.nama}</p>
              <p className="mt-0.5 text-xs font-semibold text-stone-400">
                Kode: {supplier.kode || "-"}
              </p>
            </div>
            <Badge variant={supplier.aktif ? "success" : "muted"}>
              {supplier.aktif ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>

          {/* Detail Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow icon={UserRound} label="Kontak Person" value={supplier.kontakPerson} />
            <InfoRow icon={Phone} label="Telepon" value={supplier.telepon} />
            <InfoRow icon={Mail} label="Email" value={supplier.email} />
            <InfoRow icon={Receipt} label="NPWP" value={supplier.npwp} />
            <div className="md:col-span-2">
              <InfoRow icon={Building2} label="Alamat" value={supplier.alamat} />
            </div>
          </div>

          {/* Timestamps */}
          {(supplier.createdAt || supplier.updatedAt) && (
            <div className="mt-4 flex flex-wrap gap-4 rounded-lg border border-dashed border-slate-200 p-3">
              {supplier.createdAt && (
                <p className="text-xs font-semibold text-stone-400">
                  Dibuat:{" "}
                  <span className="text-stone-600">
                    {new Date(supplier.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </p>
              )}
              {supplier.updatedAt && (
                <p className="text-xs font-semibold text-stone-400">
                  Diperbarui:{" "}
                  <span className="text-stone-600">
                    {new Date(supplier.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
