import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  User
} from "lucide-react";
import { pelangganService } from "@/services/pelangganService";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { Pelanggan } from "@/types";

function InfoCard({
  icon: Icon,
  label,
  value,
  span2 = false
}: {
  icon: typeof Phone;
  label: string;
  value?: string | null;
  span2?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4${span2 ? " md:col-span-2" : ""}`}
    >
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#0d9488] shadow-sm">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-900">{value || "–"}</p>
      </div>
    </div>
  );
}

export default async function DetailPelangganPage({
  params
}: {
  params: { id: string };
}) {
  const pelanggan: Pelanggan | null = await pelangganService
    .getById(params.id)
    .catch(() => null);

  if (!pelanggan) {
    return (
      <>
        <Header
          title="Pelanggan tidak ditemukan"
          description="Data pelanggan tidak tersedia."
        />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              Data yang diminta tidak tersedia. Pastikan ID pelanggan benar.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const jenisKelaminLabel =
    pelanggan.jenisKelamin === "L"
      ? "Laki-laki"
      : pelanggan.jenisKelamin === "P"
        ? "Perempuan"
        : null;

  const tanggalLahirFormatted = pelanggan.tanggalLahir
    ? new Date(pelanggan.tanggalLahir).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : null;

  return (
    <>
      <Header
        title={pelanggan.nama}
        description="Detail informasi pelanggan."
        action={
          <div className="flex gap-2">
            <Link href="/pelanggan">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <Link href={`/pelanggan/${pelanggan.id}/edit`}>
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
          {/* Identity Banner */}
          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-gradient-to-r from-[#f0fdf9] to-[#f8f7f3] p-5 ring-1 ring-[#99f6e4]">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#ccfbf1] text-[#0d9488] shadow-sm">
              <User className="h-8 w-8" strokeWidth={1.8} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xl font-black text-[#134e4a]">{pelanggan.nama}</p>
              <p className="mt-0.5 text-xs font-semibold text-stone-400">
                Kode: {pelanggan.kode}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={pelanggan.aktif ? "success" : "muted"}>
                {pelanggan.aktif ? "Aktif" : "Nonaktif"}
              </Badge>
              {pelanggan.member && (
                <Badge variant="info">
                  <Star className="mr-1 h-3 w-3" />
                  Member
                </Badge>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            <InfoCard icon={User} label="Jenis Kelamin" value={jenisKelaminLabel} />
            <InfoCard icon={Calendar} label="Tanggal Lahir" value={tanggalLahirFormatted} />
            <InfoCard icon={Phone} label="Telepon" value={pelanggan.telepon} />
            <InfoCard icon={Mail} label="Email" value={pelanggan.email} />
            {pelanggan.alamat && (
              <InfoCard icon={MapPin} label="Alamat" value={pelanggan.alamat} span2 />
            )}
            {pelanggan.catatanAlergi && (
              <InfoCard
                icon={AlertCircle}
                label="Catatan Alergi"
                value={pelanggan.catatanAlergi}
                span2
              />
            )}
          </div>

          {/* Timestamps */}
          {(pelanggan.createdAt || pelanggan.updatedAt) && (
            <div className="mt-4 flex flex-wrap gap-4 rounded-lg border border-dashed border-slate-200 p-3">
              {pelanggan.createdAt && (
                <p className="text-xs font-semibold text-stone-400">
                  Dibuat:{" "}
                  <span className="text-stone-600">
                    {new Date(pelanggan.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </p>
              )}
              {pelanggan.updatedAt && (
                <p className="text-xs font-semibold text-stone-400">
                  Diperbarui:{" "}
                  <span className="text-stone-600">
                    {new Date(pelanggan.updatedAt).toLocaleDateString("id-ID", {
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
