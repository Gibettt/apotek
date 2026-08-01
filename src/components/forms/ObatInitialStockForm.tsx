"use client";

import { ArrowLeft, Check, ClipboardList, PackagePlus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  obatService,
  type MasterOption,
  type ObatListItem
} from "@/services/obatService";
import { useCabangStore } from "@/store/cabangStore";
import { generateAutoKode } from "@/utils/autoKode";
import { formatCurrency } from "@/utils/formatCurrency";

interface InitialStockDraft {
  kode: string;
  nama: string;
  kategoriId: string;
  golonganId: string;
  pabrikId: string;
  satuanDefaultId: string;
  stokAwal: string;
  hargaBeli: string;
  hargaJual: string;
  batchNumber: string;
  tanggalExpired: string;
  eceranEnabled: boolean;
  satuanEceranId: string;
  isiPerSatuan: string;
  hargaJualEceran: string;
}

type InitialStockRow = InitialStockDraft & {
  kode: string;
  nama: string;
};

const emptyDraft: InitialStockDraft = {
  kode: "",
  nama: "",
  kategoriId: "",
  golonganId: "",
  pabrikId: "",
  satuanDefaultId: "",
  stokAwal: "0",
  hargaBeli: "0",
  hargaJual: "0",
  batchNumber: "",
  tanggalExpired: "",
  eceranEnabled: false,
  satuanEceranId: "",
  isiPerSatuan: "10",
  hargaJualEceran: "0"
};

function parseNumberInput(value: string) {
  if (value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasDraftContent(draft: InitialStockDraft) {
  return Boolean(
    draft.nama.trim() ||
      draft.kode.trim() ||
      parseNumberInput(draft.stokAwal) > 0 ||
      parseNumberInput(draft.hargaBeli) > 0 ||
      parseNumberInput(draft.hargaJual) > 0
  );
}

function optionLabel(options: MasterOption[], id: string) {
  return options.find((option) => option.id === id)?.label ?? "-";
}

function validateDraft(
  draft: InitialStockDraft,
  existingCodes: Set<string>,
  pendingCodes: Set<string>
) {
  const nama = draft.nama.trim();
  const kode = draft.kode.trim() || generateAutoKode(nama, { unique: true });
  const stokAwal = parseNumberInput(draft.stokAwal);
  const hargaBeli = parseNumberInput(draft.hargaBeli);
  const hargaJual = parseNumberInput(draft.hargaJual);
  const isiPerSatuan = parseNumberInput(draft.isiPerSatuan);
  const hargaJualEceran = parseNumberInput(draft.hargaJualEceran);

  if (!nama) {
    return { error: "Nama barang wajib diisi." };
  }

  if (!draft.satuanDefaultId) {
    return { error: `Satuan utama ${nama} wajib dipilih.` };
  }

  if (existingCodes.has(kode.toLowerCase()) || pendingCodes.has(kode.toLowerCase())) {
    return { error: `Kode ${kode} sudah dipakai. Ganti kode barangnya dulu.` };
  }

  if (stokAwal < 0 || hargaBeli < 0 || hargaJual < 0) {
    return { error: `Stok dan harga ${nama} tidak boleh minus.` };
  }

  if (hargaJual <= 0) {
    return { error: `Harga jual utama ${nama} wajib lebih dari 0.` };
  }

  if (draft.eceranEnabled) {
    if (!draft.satuanEceranId) {
      return { error: `Satuan eceran ${nama} wajib dipilih.` };
    }

    if (draft.satuanEceranId === draft.satuanDefaultId) {
      return { error: `Satuan eceran ${nama} harus berbeda dari satuan utama.` };
    }

    if (isiPerSatuan <= 1) {
      return { error: `Isi per satuan ${nama} harus lebih dari 1.` };
    }

    if (hargaJualEceran <= 0) {
      return { error: `Harga jual eceran ${nama} wajib lebih dari 0.` };
    }
  }

  return {
    row: {
      ...draft,
      kode,
      nama
    }
  };
}

export function ObatInitialStockForm() {
  const router = useRouter();
  const { activeCabangId } = useCabangStore();
  const [draft, setDraft] = useState<InitialStockDraft>(emptyDraft);
  const [rows, setRows] = useState<InitialStockRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [kategoriOptions, setKategoriOptions] = useState<MasterOption[]>([]);
  const [golonganOptions, setGolonganOptions] = useState<MasterOption[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<MasterOption[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<MasterOption[]>([]);
  const [pabrikOptions, setPabrikOptions] = useState<MasterOption[]>([]);
  const [lokasiOptions, setLokasiOptions] = useState<MasterOption[]>([]);
  const [existingObat, setExistingObat] = useState<ObatListItem[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [lokasiDefaultId, setLokasiDefaultId] = useState("");
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [
          kategoriResult,
          golonganResult,
          satuanResult,
          supplierResult,
          pabrikResult,
          lokasiResult,
          obatResult
        ] = await Promise.all([
          obatService.listKategoriOptions(),
          obatService.listGolonganOptions(),
          obatService.listSatuanOptions(),
          obatService.listSupplierOptions(),
          obatService.listPabrikOptions(),
          obatService.listLokasiOptions(),
          obatService.list({ perPage: 5000 })
        ]);

        if (!active) {
          return;
        }

        setKategoriOptions(kategoriResult);
        setGolonganOptions(golonganResult);
        setSatuanOptions(satuanResult);
        setSupplierOptions(supplierResult);
        setPabrikOptions(pabrikResult);
        setLokasiOptions(lokasiResult);
        setExistingObat(obatResult.data);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat data master"
          );
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

  const existingCodes = useMemo(
    () => new Set(existingObat.map((item) => item.kode.toLowerCase())),
    [existingObat]
  );

  const pendingCodes = useMemo(
    () =>
      new Set(
        rows
          .filter((_, index) => index !== editingIndex)
          .map((item) => item.kode.toLowerCase())
      ),
    [editingIndex, rows]
  );

  const totalStokAwal = useMemo(
    () => rows.reduce((sum, row) => sum + parseNumberInput(row.stokAwal), 0),
    [rows]
  );

  const totalNilaiBeli = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum + parseNumberInput(row.stokAwal) * parseNumberInput(row.hargaBeli),
        0
      ),
    [rows]
  );

  function updateDraft(partial: Partial<InitialStockDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function resetDraft() {
    setDraft(emptyDraft);
    setEditingIndex(null);
  }

  function addOrUpdateRow() {
    const result = validateDraft(draft, existingCodes, pendingCodes);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    if (editingIndex === null) {
      setRows((currentRows) => [...currentRows, result.row]);
    } else {
      setRows((currentRows) =>
        currentRows.map((row, index) => (index === editingIndex ? result.row : row))
      );
    }

    resetDraft();
  }

  function editRow(index: number) {
    const row = rows[index];
    if (!row) return;
    setDraft(row);
    setEditingIndex(index);
  }

  function removeRow(index: number) {
    setRows((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index));
    if (editingIndex === index) {
      resetDraft();
    }
  }

  function buildRowsForSubmit() {
    if (!hasDraftContent(draft)) {
      return rows;
    }

    const result = validateDraft(draft, existingCodes, pendingCodes);
    if ("error" in result) {
      toast.error(result.error);
      return null;
    }

    return editingIndex === null
      ? [...rows, result.row]
      : rows.map((row, index) => (index === editingIndex ? result.row : row));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rowsToSave = buildRowsForSubmit();

    if (!rowsToSave) {
      return;
    }

    if (!rowsToSave.length) {
      toast.error("Tambahkan minimal satu barang dulu.");
      return;
    }

    setIsSubmitting(true);

    try {
      for (const row of rowsToSave) {
        await obatService.create({
          kode: row.kode,
          nama: row.nama,
          kategoriId: row.kategoriId || undefined,
          golonganId: row.golonganId || undefined,
          pabrikId: row.pabrikId || undefined,
          satuanDefaultId: row.satuanDefaultId,
          satuanBeliId: row.satuanDefaultId,
          satuanJualId: row.satuanDefaultId,
          lokasiDefaultId: lokasiDefaultId || undefined,
          supplierId: supplierId || undefined,
          hargaBeli: parseNumberInput(row.hargaBeli),
          hargaJual: parseNumberInput(row.hargaJual),
          stokAwal: parseNumberInput(row.stokAwal),
          batchNumber: row.batchNumber || undefined,
          tanggalExpired: row.tanggalExpired || undefined,
          cabangId: activeCabangId ?? undefined,
          perluBatch: true,
          perluExpired: Boolean(row.tanggalExpired),
          status: true,
          eceran: row.eceranEnabled
            ? {
                enabled: true,
                satuanEceranId: row.satuanEceranId,
                isiPerSatuan: parseNumberInput(row.isiPerSatuan),
                hargaJual: parseNumberInput(row.hargaJualEceran)
              }
            : { enabled: false }
        });
      }

      toast.success(`${rowsToSave.length} barang berhasil dimasukkan ke master barang`);
      router.push("/obat");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan barang awal"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Tambah Barang Awal"
        description="Input sementara untuk memasukkan barang yang sudah ada di apotek beserta stok dan harga jualnya."
        action={
          <Link
            href="/obat"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 dashboard-surface">
          <div className="mb-5 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <PackagePlus className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Barang Masuk Awal</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
                Isi data barang, tekan Tambah ke Daftar, lalu simpan setelah semua barang siap.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select
              label="Supplier Awal"
              value={supplierId}
              disabled={isLoadingOptions}
              onChange={(event) => setSupplierId(event.target.value)}
              options={[
                { label: "Tanpa supplier", value: "" },
                ...supplierOptions.map((supplier) => ({
                  label: supplier.label,
                  value: supplier.id
                }))
              ]}
            />
            <Select
              label="Lokasi Simpan"
              value={lokasiDefaultId}
              disabled={isLoadingOptions}
              onChange={(event) => setLokasiDefaultId(event.target.value)}
              options={[
                { label: "Pilih lokasi", value: "" },
                ...lokasiOptions.map((lokasi) => ({
                  label: lokasi.label,
                  value: lokasi.id
                }))
              ]}
            />
          </div>

          <div className="mt-5 rounded-lg border border-stone-200 bg-[#f8f7f3] p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input
                label="Nama Barang"
                value={draft.nama}
                disabled={isLoadingOptions}
                onChange={(event) => updateDraft({ nama: event.target.value })}
                placeholder="Contoh: Paracetamol 500 mg"
              />
              <Input
                label="Kode Barang"
                value={draft.kode}
                onChange={(event) => updateDraft({ kode: event.target.value })}
                placeholder="Otomatis jika kosong"
              />
              <Select
                label="Kategori"
                value={draft.kategoriId}
                disabled={isLoadingOptions}
                onChange={(event) => updateDraft({ kategoriId: event.target.value })}
                options={[
                  { label: "Pilih kategori", value: "" },
                  ...kategoriOptions.map((kategori) => ({
                    label: kategori.label,
                    value: kategori.id
                  }))
                ]}
              />
              <Select
                label="Golongan"
                value={draft.golonganId}
                disabled={isLoadingOptions}
                onChange={(event) => updateDraft({ golonganId: event.target.value })}
                options={[
                  { label: "Pilih golongan", value: "" },
                  ...golonganOptions.map((golongan) => ({
                    label: golongan.label,
                    value: golongan.id
                  }))
                ]}
              />
              <Select
                label="Pabrik"
                value={draft.pabrikId}
                disabled={isLoadingOptions}
                onChange={(event) => updateDraft({ pabrikId: event.target.value })}
                options={[
                  { label: "Tanpa pabrik", value: "" },
                  ...pabrikOptions.map((pabrik) => ({
                    label: pabrik.label,
                    value: pabrik.id
                  }))
                ]}
              />
              <Select
                label="Satuan Utama"
                value={draft.satuanDefaultId}
                disabled={isLoadingOptions}
                onChange={(event) => updateDraft({ satuanDefaultId: event.target.value })}
                options={[
                  { label: "Pilih satuan", value: "" },
                  ...satuanOptions.map((satuan) => ({
                    label: satuan.label,
                    value: satuan.id
                  }))
                ]}
              />
              <Input
                label="Stok Awal"
                type="number"
                min={0}
                value={draft.stokAwal}
                onChange={(event) => updateDraft({ stokAwal: event.target.value })}
              />
              <Input
                label="Harga Beli per Satuan"
                type="number"
                min={0}
                value={draft.hargaBeli}
                onChange={(event) => updateDraft({ hargaBeli: event.target.value })}
              />
              <Input
                label="Harga Jual per Satuan"
                type="number"
                min={0}
                value={draft.hargaJual}
                onChange={(event) => updateDraft({ hargaJual: event.target.value })}
              />
              <Input
                label="Nomor Batch"
                value={draft.batchNumber}
                onChange={(event) => updateDraft({ batchNumber: event.target.value })}
                placeholder="Otomatis jika kosong"
              />
              <Input
                label="Kedaluwarsa"
                type="date"
                value={draft.tanggalExpired}
                onChange={(event) => updateDraft({ tanggalExpired: event.target.value })}
              />
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700">
              <input
                type="checkbox"
                checked={draft.eceranEnabled}
                onChange={(event) => updateDraft({ eceranEnabled: event.target.checked })}
                className="h-4 w-4 rounded border-stone-300 text-[#0f766e] focus:ring-[#0f766e]"
              />
              Ada harga eceran atau satuan lain
            </label>

            {draft.eceranEnabled ? (
              <div className="mt-4 grid gap-4 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-3">
                <Select
                  label="Satuan Eceran"
                  value={draft.satuanEceranId}
                  disabled={isLoadingOptions}
                  onChange={(event) => updateDraft({ satuanEceranId: event.target.value })}
                  options={[
                    { label: "Pilih satuan eceran", value: "" },
                    ...satuanOptions.map((satuan) => ({
                      label: satuan.label,
                      value: satuan.id
                    }))
                  ]}
                />
                <Input
                  label="Isi per Satuan Utama"
                  type="number"
                  min={2}
                  value={draft.isiPerSatuan}
                  onChange={(event) => updateDraft({ isiPerSatuan: event.target.value })}
                />
                <Input
                  label="Harga Jual Eceran"
                  type="number"
                  min={0}
                  value={draft.hargaJualEceran}
                  onChange={(event) => updateDraft({ hargaJualEceran: event.target.value })}
                />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {editingIndex !== null ? (
                <Button type="button" variant="secondary" onClick={resetDraft}>
                  Batal Edit
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={addOrUpdateRow}
                className="h-10 rounded-lg bg-[#20201d] px-4 font-bold hover:bg-[#33312d]"
              >
                <Check className="h-4 w-4" />
                {editingIndex === null ? "Tambah ke Daftar" : "Update Daftar"}
              </Button>
            </div>
          </div>
        </section>

        <aside className="h-max dashboard-surface">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e8f4ef] text-[#267d6b]">
              <ClipboardList className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Ringkasan</h2>
              <p className="text-xs font-semibold text-stone-400">
                Daftar yang akan disimpan
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3 rounded-lg bg-[#f8f7f3] p-4 text-sm font-semibold text-stone-600">
            <div className="flex justify-between gap-4">
              <span>Total barang</span>
              <strong className="text-[#20201d]">{rows.length}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Total stok awal</span>
              <strong className="text-[#20201d]">{totalStokAwal}</strong>
            </div>
            <div className="flex justify-between gap-4 border-t border-stone-200 pt-3">
              <span>Nilai beli</span>
              <strong className="text-[#20201d]">{formatCurrency(totalNilaiBeli)}</strong>
            </div>
          </div>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="mt-4 h-11 w-full rounded-lg bg-[#0f766e] font-black hover:bg-[#115e59]"
          >
            <Save className="h-4 w-4" />
            Simpan Semua Barang
          </Button>
        </aside>

        <section className="min-w-0 dashboard-surface xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#20201d]">Daftar Barang</h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                Barang yang belum disimpan masih bisa diedit atau dihapus.
              </p>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border border-stone-200 bg-white">
            <table className="min-w-[1100px] w-full table-fixed text-sm">
              <thead className="bg-[#20201d] text-white">
                <tr>
                  <th className="w-12 px-3 py-3 text-center text-[10px] font-black uppercase leading-tight tracking-wide">No</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Barang</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Kategori</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Satuan</th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase leading-tight tracking-wide">Stok</th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase leading-tight tracking-wide">Harga Beli</th>
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase leading-tight tracking-wide">Harga Jual</th>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase leading-tight tracking-wide">Eceran</th>
                  <th className="w-28 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row, index) => (
                    <tr key={`${row.kode}-${index}`} className="border-t border-stone-100 even:bg-[#faf9f6]">
                      <td className="px-3 py-3 text-center text-xs font-bold text-stone-600">{index + 1}</td>
                      <td className="px-3 py-3">
                        <p className="truncate font-black text-[#20201d]">{row.nama}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-stone-400">{row.kode}</p>
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-stone-600">
                        {optionLabel(kategoriOptions, row.kategoriId)}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-stone-600">
                        {optionLabel(satuanOptions, row.satuanDefaultId)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-bold text-stone-700">
                        {parseNumberInput(row.stokAwal)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-bold text-stone-700">
                        {formatCurrency(parseNumberInput(row.hargaBeli))}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-black text-[#20201d]">
                        {formatCurrency(parseNumberInput(row.hargaJual))}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-stone-600">
                        {row.eceranEnabled
                          ? `${formatCurrency(parseNumberInput(row.hargaJualEceran))} / ${optionLabel(satuanOptions, row.satuanEceranId)}`
                          : "-"}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${row.nama}`}
                            onClick={() => editRow(index)}
                            className="h-8 rounded-md bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus ${row.nama}`}
                            onClick={() => removeRow(index)}
                            className="grid h-8 w-8 place-items-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm font-semibold text-stone-500">
                      Belum ada barang di daftar sementara.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </form>
    </>
  );
}
