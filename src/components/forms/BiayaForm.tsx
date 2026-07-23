"use client";

import { ArrowLeft, Info, Receipt, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { akunService, type Akun } from "@/services/akunService";
import { biayaService } from "@/services/biayaService";
import { useCabangStore } from "@/store/cabangStore";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function akunLabel(akun: Pick<Akun, "kode" | "nama">) {
  return `${akun.kode} — ${akun.nama}`;
}

export function BiayaForm() {
  const router = useRouter();
  const { activeCabangId } = useCabangStore();

  const [akunOptions, setAkunOptions] = useState<Akun[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tanggal, setTanggal] = useState(todayInputValue());
  const [akunQuery, setAkunQuery] = useState("");
  const [akunId, setAkunId] = useState("");
  const [namaBiaya, setNamaBiaya] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [metodeBayar, setMetodeBayar] = useState<"tunai" | "transfer">("tunai");
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);
      try {
        const result = await akunService.list({ perPage: 1000 });
        if (active) {
          setAkunOptions(result.data.filter((akun) => akun.aktif && akun.tipe === "Beban"));
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Gagal memuat daftar akun beban");
        }
      } finally {
        if (active) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const akunByLabel = useMemo(() => {
    const map = new Map<string, Akun>();
    akunOptions.forEach((akun) => map.set(akunLabel(akun).toLowerCase(), akun));
    return map;
  }, [akunOptions]);

  function handleAkunChange(value: string) {
    const match = akunByLabel.get(value.trim().toLowerCase());
    setAkunQuery(value);
    setAkunId(match ? match.id : "");
  }

  function handleAkunBlur(value: string) {
    const trimmed = value.trim().toLowerCase();
    const exact = akunByLabel.get(trimmed);
    if (exact) {
      setAkunId(exact.id);
      setAkunQuery(akunLabel(exact));
      return;
    }

    const byKode = akunOptions.find((akun) => akun.kode.toLowerCase() === trimmed);
    if (byKode) {
      setAkunId(byKode.id);
      setAkunQuery(akunLabel(byKode));
      return;
    }

    if (!value.trim()) {
      setAkunId("");
      setAkunQuery("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tanggal) {
      toast.error("Tanggal wajib diisi");
      return;
    }
    if (!akunId) {
      toast.error("Akun beban wajib dipilih dari daftar");
      return;
    }
    if (!namaBiaya.trim()) {
      toast.error("Nama biaya wajib diisi");
      return;
    }
    const jumlahValue = Number(jumlah);
    if (!Number.isFinite(jumlahValue) || jumlahValue <= 0) {
      toast.error("Jumlah biaya harus lebih besar dari nol");
      return;
    }

    setIsSubmitting(true);

    try {
      await biayaService.create({
        tanggal,
        akunId,
        namaBiaya: namaBiaya.trim(),
        jumlah: jumlahValue,
        metodeBayar,
        catatan: catatan || undefined,
        cabangId: activeCabangId ?? undefined
      });
      toast.success("Biaya operasional berhasil dicatat dan jurnal otomatis dibuat");
      router.push("/biaya");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan biaya operasional");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Tambah Biaya Operasional"
        description="Catat pengeluaran operasional apotek. Jurnal umum akan dibuat otomatis (Debit akun beban, Kredit Kas/Bank)."
        action={
          <Link
            href="/biaya"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(25,24,21,.08)]"
      >
        <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#e6f4f2] text-[#0f766e]">
            <Receipt className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#20201d]">Informasi Biaya</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
              Nomor dibuat otomatis (format BOP-YYYYMM-0001).
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tanggal" type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} />
          <Input
            label="Akun Beban (cari kode/nama)"
            list="akun-beban-datalist"
            disabled={isLoadingOptions}
            value={akunQuery}
            onChange={(event) => handleAkunChange(event.target.value)}
            onBlur={(event) => handleAkunBlur(event.target.value)}
            placeholder="Ketik kode atau nama akun beban"
          />
          <datalist id="akun-beban-datalist">
            {akunOptions.map((akun) => (
              <option key={akun.id} value={akunLabel(akun)} />
            ))}
          </datalist>
          <Input
            label="Nama Biaya"
            value={namaBiaya}
            onChange={(event) => setNamaBiaya(event.target.value)}
            placeholder="Contoh: Tagihan listrik Juli"
          />
          <Input
            label="Jumlah"
            type="number"
            min={0}
            value={jumlah}
            onChange={(event) => setJumlah(event.target.value)}
          />
          <Select
            label="Metode Bayar"
            value={metodeBayar}
            onChange={(event) => setMetodeBayar(event.target.value as "tunai" | "transfer")}
            options={[
              { label: "Tunai (Kas)", value: "tunai" },
              { label: "Transfer (Bank)", value: "transfer" }
            ]}
          />
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
            <span>Catatan (opsional)</span>
            <textarea
              rows={3}
              value={catatan}
              onChange={(event) => setCatatan(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Biaya akan langsung berstatus diposting dan tidak bisa diedit. Kalau salah catat,
          batalkan lewat jurnal pembalik dari halaman detail.
        </p>

        <div className="mt-5 flex justify-end">
          <Button type="submit" isLoading={isSubmitting} className="h-11 rounded-lg bg-[#0f766e] font-black hover:bg-[#115e59]">
            <Save className="h-4 w-4" />
            Simpan Biaya
          </Button>
        </div>
      </form>
    </>
  );
}
