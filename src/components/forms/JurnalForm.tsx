"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2, NotebookPen, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { akunService, type Akun } from "@/services/akunService";
import { jurnalService } from "@/services/jurnalService";
import { computeJurnalTotals, validateJurnalLines } from "@/lib/jurnalValidation";
import { useCabangStore } from "@/store/cabangStore";
import { formatCurrency } from "@/utils/formatCurrency";

interface JurnalFormRow {
  key: string;
  akunId: string;
  akunQuery: string;
  debit: string;
  kredit: string;
  keterangan: string;
}

function emptyRow(): JurnalFormRow {
  return {
    key: crypto.randomUUID(),
    akunId: "",
    akunQuery: "",
    debit: "",
    kredit: "",
    keterangan: ""
  };
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function parseNumberInput(value: string) {
  if (value === "") {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function akunLabel(akun: Pick<Akun, "kode" | "nama">) {
  return `${akun.kode} — ${akun.nama}`;
}

export function JurnalForm({ jurnalId }: { jurnalId?: string }) {
  const router = useRouter();
  const { activeCabangId } = useCabangStore();
  const isEdit = Boolean(jurnalId);

  const [akunOptions, setAkunOptions] = useState<Akun[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingJurnal, setIsLoadingJurnal] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState<"draft" | "posting" | null>(null);

  const [tanggal, setTanggal] = useState(todayInputValue());
  const [nomorReferensi, setNomorReferensi] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [rows, setRows] = useState<JurnalFormRow[]>([emptyRow(), emptyRow()]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);
      try {
        const result = await akunService.list({ perPage: 1000 });
        if (active) {
          setAkunOptions(result.data.filter((akun) => akun.aktif));
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Gagal memuat daftar akun");
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

  useEffect(() => {
    if (!jurnalId) {
      return;
    }

    let active = true;

    async function loadJurnal() {
      setIsLoadingJurnal(true);
      try {
        const jurnal = await jurnalService.getById(jurnalId!);
        if (!active) {
          return;
        }
        if (!jurnal) {
          toast.error("Jurnal tidak ditemukan");
          router.push("/jurnal");
          return;
        }
        if (jurnal.status !== "draft") {
          toast.error("Hanya jurnal berstatus draft yang dapat diedit");
          router.push(`/jurnal/${jurnalId}`);
          return;
        }

        setTanggal(jurnal.tanggal.slice(0, 10));
        setNomorReferensi(jurnal.nomorReferensi ?? "");
        setDeskripsi(jurnal.deskripsi);
        setRows(
          jurnal.details.map((detail) => ({
            key: crypto.randomUUID(),
            akunId: detail.akunId,
            akunQuery: akunLabel({ kode: detail.kodeAkun, nama: detail.namaAkun }),
            debit: detail.debit ? String(detail.debit) : "",
            kredit: detail.kredit ? String(detail.kredit) : "",
            keterangan: detail.keterangan ?? ""
          }))
        );
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Gagal memuat jurnal");
        }
      } finally {
        if (active) {
          setIsLoadingJurnal(false);
        }
      }
    }

    void loadJurnal();
    return () => {
      active = false;
    };
  }, [jurnalId, router]);

  const akunByLabel = useMemo(() => {
    const map = new Map<string, Akun>();
    akunOptions.forEach((akun) => map.set(akunLabel(akun).toLowerCase(), akun));
    return map;
  }, [akunOptions]);

  const akunById = useMemo(() => {
    const map = new Map<string, Akun>();
    akunOptions.forEach((akun) => map.set(akun.id, akun));
    return map;
  }, [akunOptions]);

  function updateRow(key: string, updater: (row: JurnalFormRow) => JurnalFormRow) {
    setRows((current) => current.map((row) => (row.key === key ? updater(row) : row)));
  }

  function handleAkunQueryChange(key: string, value: string) {
    const match = akunByLabel.get(value.trim().toLowerCase());
    updateRow(key, (row) => ({
      ...row,
      akunQuery: value,
      akunId: match ? match.id : ""
    }));
  }

  function handleAkunBlur(key: string, value: string) {
    const trimmed = value.trim().toLowerCase();
    const exact = akunByLabel.get(trimmed);
    if (exact) {
      updateRow(key, (row) => ({ ...row, akunId: exact.id, akunQuery: akunLabel(exact) }));
      return;
    }

    const byKode = akunOptions.find((akun) => akun.kode.toLowerCase() === trimmed);
    if (byKode) {
      updateRow(key, (row) => ({ ...row, akunId: byKode.id, akunQuery: akunLabel(byKode) }));
      return;
    }

    if (!value.trim()) {
      updateRow(key, (row) => ({ ...row, akunId: "", akunQuery: "" }));
    }
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((current) => (current.length <= 2 ? current : current.filter((row) => row.key !== key)));
  }

  const totals = useMemo(
    () =>
      computeJurnalTotals(
        rows.map((row) => ({ debit: parseNumberInput(row.debit), kredit: parseNumberInput(row.kredit) }))
      ),
    [rows]
  );

  function buildDetails() {
    return rows
      .filter((row) => row.akunId || parseNumberInput(row.debit) > 0 || parseNumberInput(row.kredit) > 0)
      .map((row) => ({
        akunId: row.akunId,
        debit: parseNumberInput(row.debit),
        kredit: parseNumberInput(row.kredit),
        keterangan: row.keterangan || undefined
      }));
  }

  async function handleSubmit(status: "draft" | "diposting") {
    if (!tanggal) {
      toast.error("Tanggal transaksi wajib diisi");
      return;
    }
    if (!deskripsi.trim()) {
      toast.error("Keterangan transaksi wajib diisi");
      return;
    }

    const details = buildDetails();
    const errors = validateJurnalLines(
      details.map((detail) => ({
        ...detail,
        akunAktif: detail.akunId ? akunById.get(detail.akunId)?.aktif ?? false : undefined
      })),
      status === "diposting"
    );

    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    setIsSubmitting(status === "draft" ? "draft" : "posting");

    try {
      const payload = {
        tanggal,
        nomorReferensi: nomorReferensi || undefined,
        deskripsi: deskripsi.trim(),
        cabangId: activeCabangId ?? undefined,
        status,
        details
      };

      if (isEdit && jurnalId) {
        await jurnalService.updateDraft(jurnalId, payload);
        if (status === "diposting") {
          await jurnalService.post(jurnalId);
        }
        toast.success(
          status === "diposting" ? "Jurnal berhasil diposting" : "Perubahan draft berhasil disimpan"
        );
      } else {
        await jurnalService.create(payload);
        toast.success(
          status === "diposting" ? "Jurnal berhasil disimpan dan diposting" : "Draft jurnal berhasil disimpan"
        );
      }

      router.push("/jurnal");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan jurnal");
    } finally {
      setIsSubmitting(null);
    }
  }

  if (isLoadingJurnal) {
    return (
      <div className="dashboard-surface text-center text-sm font-semibold text-stone-500">
        Memuat data jurnal...
      </div>
    );
  }

  return (
    <>
      <Header
        title={isEdit ? "Edit Jurnal" : "Tambah Jurnal"}
        description="Catat transaksi keuangan berdasarkan debit dan kredit. Minimal dua baris akun dan total harus seimbang sebelum diposting."
        action={
          <Link
            href="/jurnal"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 overflow-hidden dashboard-surface">
          <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#e6f4f2] text-[#0f766e]">
              <NotebookPen className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Informasi Jurnal</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
                Nomor jurnal dibuat otomatis oleh sistem saat disimpan (format JU-YYYYMM-0001).
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Tanggal Transaksi"
              type="date"
              value={tanggal}
              onChange={(event) => setTanggal(event.target.value)}
            />
            <Input
              label="Nomor Referensi (opsional)"
              value={nomorReferensi}
              onChange={(event) => setNomorReferensi(event.target.value)}
              placeholder="Nomor invoice/dokumen sumber"
            />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Keterangan Transaksi</span>
              <textarea
                rows={2}
                value={deskripsi}
                onChange={(event) => setDeskripsi(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Contoh: Penjualan tunai harian"
              />
            </label>
          </div>

          <div className="mt-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Detail Akun</h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                Minimal dua baris akun. Isi debit atau kredit saja per baris.
              </p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#20201d] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              Baris Akun
            </button>
          </div>

          <datalist id="akun-datalist">
            {akunOptions.map((akun) => (
              <option key={akun.id} value={akunLabel(akun)} />
            ))}
          </datalist>

          <div className="mt-4 space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.key}
                className="rounded-lg border border-stone-200 bg-white p-4 shadow-[0_12px_32px_rgba(25,24,21,.04)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                  <p className="text-xs font-black uppercase text-stone-400">Baris #{index + 1}</p>
                  <button
                    type="button"
                    aria-label="Hapus baris"
                    disabled={rows.length <= 2}
                    onClick={() => removeRow(row.key)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                  </button>
                </div>

                <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-12">
                  <div className="min-w-0 2xl:col-span-4">
                    <Input
                      label="Akun (cari kode/nama)"
                      list="akun-datalist"
                      disabled={isLoadingOptions}
                      value={row.akunQuery}
                      onChange={(event) => handleAkunQueryChange(row.key, event.target.value)}
                      onBlur={(event) => handleAkunBlur(row.key, event.target.value)}
                      placeholder="Ketik kode atau nama akun"
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-3">
                    <Input
                      label="Debit"
                      type="number"
                      min={0}
                      value={row.debit}
                      disabled={parseNumberInput(row.kredit) > 0}
                      onChange={(event) =>
                        updateRow(row.key, (current) => ({ ...current, debit: event.target.value }))
                      }
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-3">
                    <Input
                      label="Kredit"
                      type="number"
                      min={0}
                      value={row.kredit}
                      disabled={parseNumberInput(row.debit) > 0}
                      onChange={(event) =>
                        updateRow(row.key, (current) => ({ ...current, kredit: event.target.value }))
                      }
                    />
                  </div>
                  <div className="min-w-0 2xl:col-span-2">
                    <Input
                      label="Keterangan Baris"
                      value={row.keterangan}
                      onChange={(event) =>
                        updateRow(row.key, (current) => ({ ...current, keterangan: event.target.value }))
                      }
                      placeholder="Opsional"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="h-max dashboard-surface xl:sticky xl:top-24">
          <h2 className="text-lg font-black text-[#20201d]">Ringkasan</h2>
          <div className="mt-4 space-y-3 rounded-lg bg-[#f8f7f3] p-4 text-sm font-semibold text-stone-600">
            <div className="flex justify-between gap-4">
              <span>Total Debit</span>
              <strong className="text-[#20201d]">{formatCurrency(totals.totalDebit)}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Total Kredit</span>
              <strong className="text-[#20201d]">{formatCurrency(totals.totalKredit)}</strong>
            </div>
            <div className="border-t border-stone-200 pt-3">
              <div className="flex justify-between gap-4">
                <span>Selisih</span>
                <strong className={totals.seimbang ? "text-emerald-700" : "text-red-600"}>
                  {formatCurrency(Math.abs(totals.selisih))}
                </strong>
              </div>
            </div>
          </div>

          <div
            className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-xs font-black ${
              totals.seimbang ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {totals.seimbang ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
            )}
            {totals.seimbang ? "Seimbang" : "Belum Seimbang"}
          </div>

          <div className="mt-5 space-y-2">
            <Button
              type="button"
              variant="secondary"
              isLoading={isSubmitting === "draft"}
              disabled={isSubmitting !== null}
              onClick={() => handleSubmit("draft")}
              className="h-11 w-full rounded-lg font-black"
            >
              <Save className="h-4 w-4" />
              Simpan sebagai Draft
            </Button>
            <Button
              type="button"
              isLoading={isSubmitting === "posting"}
              disabled={isSubmitting !== null || !totals.seimbang}
              onClick={() => handleSubmit("diposting")}
              className="h-11 w-full rounded-lg bg-[#0f766e] font-black hover:bg-[#115e59]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Simpan dan Posting
            </Button>
            <Link
              href="/jurnal"
              className="flex h-11 w-full items-center justify-center rounded-lg border border-stone-200 text-sm font-bold text-stone-600 transition hover:bg-stone-50"
            >
              Batal
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
