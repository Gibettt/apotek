"use client";

import { ArrowLeft, Check, ChevronDown, Lock, Maximize2, Minimize2, PackagePlus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  pembelianService,
  type PembelianInput,
  type SatuanKonversi
} from "@/services/pembelianService";
import {
  obatService,
  type MasterOption,
  type ObatListItem
} from "@/services/obatService";
import { supplierService } from "@/services/supplierService";
import { useAuthStore } from "@/store/authStore";
import { useCabangStore } from "@/store/cabangStore";
import type { StatusPembelian, Supplier } from "@/types";
import { generateAutoKode } from "@/utils/autoKode";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatCurrency";

type DiskonMode = "rp" | "persen";

interface PembelianFormItem {
  kategoriId: string;
  barangId: string;
  barangNama: string;
  autoKode: string;
  satuanId: string;
  konversi: string;
  konversiLocked: boolean;
  jumlahDikirim: string;
  jumlahDiterima: string;
  jumlahDitolak: string;
  batchNumber: string;
  tanggalExpired: string;
  hargaBeli: string;
  diskon: string;
  diskonMode: DiskonMode;
}

const emptyItem: PembelianFormItem = {
  kategoriId: "",
  barangId: "",
  barangNama: "",
  autoKode: "",
  satuanId: "",
  konversi: "",
  konversiLocked: false,
  jumlahDikirim: "1",
  jumlahDiterima: "1",
  jumlahDitolak: "0",
  batchNumber: "",
  tanggalExpired: "",
  hargaBeli: "0",
  diskon: "0",
  diskonMode: "rp"
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function generateAutoBatchNumber(rowIndex: number, tanggalPembelian: string) {
  const datePart = (tanggalPembelian || todayInputValue()).replace(/-/g, "");
  return `BATCH-${datePart}-${String(rowIndex + 1).padStart(3, "0")}`;
}

const cellFieldClass =
  "h-9 w-full min-w-0 rounded-none border-0 bg-transparent px-2 text-xs shadow-none outline-none focus:relative focus:z-10 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500";

interface InlineTableSelectProps {
  ariaLabel: string;
  row: number;
  col: number;
  value: string;
  disabled?: boolean;
  options: Array<{ label: string; value: string | number }>;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

function InlineTableSelect({
  ariaLabel,
  row,
  col,
  value,
  disabled,
  options,
  onChange,
  onKeyDown
}: InlineTableSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => String(option.value) === value);
  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setMenuPosition({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 224)
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }

    updatePosition();
    setOpen(true);
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        data-row={row}
        data-col={col}
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleOpen();
            return;
          }

          onKeyDown(event);
        }}
        className={cn(
          cellFieldClass,
          "flex items-center justify-between gap-2 text-left hover:bg-[#f8f7f3]",
          disabled && "cursor-not-allowed text-stone-400"
        )}
      >
        <span className={cn("truncate", !value && "text-stone-500")}>
          {selected?.label ?? options[0]?.label ?? "Pilih"}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-stone-400 transition", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open && menuPosition && typeof document !== "undefined" ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
            width: menuPosition.width
          }}
          className="fixed z-[100] max-h-64 overflow-auto rounded-lg border border-stone-200 bg-white p-1 text-xs shadow-[0_18px_44px_rgba(25,24,21,.16)]"
        >
          {options.map((option) => {
            const optionValue = String(option.value);
            const active = optionValue === value;

            return (
              <button
                key={optionValue || option.label}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(optionValue);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left font-semibold transition",
                  active ? "bg-[#0f766e] text-white" : "text-stone-600 hover:bg-[#eef7f2] hover:text-[#0f766e]"
                )}
              >
                <span className="truncate">{option.label}</span>
                {active ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} /> : null}
              </button>
            );
          })}
        </div>,
        document.body
      ) : null}
    </div>
  );
}

function parseNumberInput(value: string) {
  if (value === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function konversiValue(item: PembelianFormItem) {
  const parsed = parseNumberInput(item.konversi);
  return parsed > 0 ? parsed : 1;
}

function konversiKey(barangId: string, satuanDariId: string, satuanKeId: string) {
  return `${barangId}:${satuanDariId}:${satuanKeId}`;
}

function resolveKonversi(
  barangId: string,
  satuanId: string,
  obatById: Record<string, ObatListItem>,
  konversiByKey: Record<string, SatuanKonversi>
) {
  const satuanDasarId = barangId ? obatById[barangId]?.satuanDefaultId : undefined;

  if (!barangId || !satuanId || !satuanDasarId) {
    return { konversi: "", konversiLocked: false };
  }

  if (satuanId === satuanDasarId) {
    return { konversi: "1", konversiLocked: true };
  }

  const saved = konversiByKey[konversiKey(barangId, satuanId, satuanDasarId)];

  return saved
    ? { konversi: String(saved.nilaiKonversi), konversiLocked: true }
    : { konversi: "", konversiLocked: false };
}

function stokBertambah(item: PembelianFormItem) {
  return parseNumberInput(item.jumlahDiterima) * konversiValue(item);
}

function lineGross(item: PembelianFormItem) {
  return parseNumberInput(item.jumlahDiterima) * parseNumberInput(item.hargaBeli);
}

function lineDiskonNominal(item: PembelianFormItem) {
  return item.diskonMode === "persen"
    ? lineGross(item) * (parseNumberInput(item.diskon) / 100)
    : parseNumberInput(item.diskon);
}

function lineSubtotal(item: PembelianFormItem) {
  return Math.max(0, lineGross(item) - lineDiskonNominal(item));
}

type ItemUpdater = (item: PembelianFormItem) => PembelianFormItem;

interface PembelianItemRowProps {
  item: PembelianFormItem;
  index: number;
  tanggalPembelian: string;
  isLoadingOptions: boolean;
  kategoriOptions: MasterOption[];
  satuanOptions: MasterOption[];
  obatById: Record<string, ObatListItem>;
  onUpdateItem: (index: number, updater: ItemUpdater) => void;
  onBarangNameChange: (index: number, value: string) => void;
  onSatuanChange: (index: number, satuanId: string) => void;
  onRemoveItem: (index: number) => void;
  onCellKeyDown: (
    event: React.KeyboardEvent,
    row: number,
    col: number,
    isSelect?: boolean
  ) => void;
}

const PembelianItemRow = memo(function PembelianItemRow({
  item,
  index,
  tanggalPembelian,
  isLoadingOptions,
  kategoriOptions,
  satuanOptions,
  obatById,
  onUpdateItem,
  onBarangNameChange,
  onSatuanChange,
  onRemoveItem,
  onCellKeyDown
}: PembelianItemRowProps) {
  return (
    <tr className="bg-white align-top even:bg-[#faf9f6]">
      <td className="border-b border-r border-stone-100 bg-[#f8f7f3] px-2 text-center">
        <span className="text-xs font-bold text-stone-600">{index + 1}</span>
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <InlineTableSelect
          ariaLabel="Kategori"
          row={index}
          col={1}
          onKeyDown={(event) => onCellKeyDown(event, index, 1, true)}
          value={item.kategoriId}
          disabled={isLoadingOptions}
          onChange={(value) =>
            onUpdateItem(index, (current) => ({
              ...current,
              kategoriId: value
            }))
          }
          options={[
            { label: "Pilih kategori", value: "" },
            ...kategoriOptions.map((kategori) => ({
              label: kategori.label,
              value: kategori.id
            }))
          ]}
        />
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <Input
          aria-label="Barang"
          data-row={index}
          data-col={2}
          onKeyDown={(event) => onCellKeyDown(event, index, 2)}
          list="pembelian-barang-options"
          value={item.barangNama}
          disabled={isLoadingOptions}
          onChange={(event) => onBarangNameChange(index, event.target.value)}
          placeholder="Ketik nama obat"
          title={
            item.barangNama.trim() && !item.barangId
              ? "Obat baru, akan otomatis dibuat di fitur Barang saat disimpan"
              : undefined
          }
          className={`${cellFieldClass} truncate ${
            item.barangNama.trim() && !item.barangId ? "text-sky-700" : ""
          }`}
        />
      </td>
      <td className="border-b border-r border-stone-100 bg-[#f8f7f3] p-0">
        <div
          title={item.autoKode ? "Preview kode obat baru" : undefined}
          className={`flex h-9 items-center truncate px-2 text-xs font-bold ${
            item.autoKode ? "text-sky-700" : "text-stone-500"
          }`}
        >
          {item.barangId ? obatById[item.barangId]?.kode ?? "-" : item.autoKode || "-"}
        </div>
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <InlineTableSelect
          ariaLabel="Satuan Pembelian"
          row={index}
          col={3}
          onKeyDown={(event) => onCellKeyDown(event, index, 3, true)}
          value={item.satuanId}
          onChange={(value) => onSatuanChange(index, value)}
          options={[
            { label: "Pilih satuan", value: "" },
            ...satuanOptions.map((satuan) => ({
              label: satuan.label,
              value: satuan.id
            }))
          ]}
        />
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <Input
          aria-label="Konversi"
          data-row={index}
          data-col={4}
          onKeyDown={(event) => onCellKeyDown(event, index, 4)}
          type="number"
          min={1}
          value={item.konversi}
          disabled={item.konversiLocked}
          onChange={(event) =>
            onUpdateItem(index, (current) => ({
              ...current,
              konversi: event.target.value
            }))
          }
          className={`${cellFieldClass} ${item.konversiLocked ? "bg-[#f8f7f3] font-bold text-stone-500" : ""}`}
        />
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <Input
          aria-label="Jumlah Dikirim"
          data-row={index}
          data-col={5}
          onKeyDown={(event) => onCellKeyDown(event, index, 5)}
          type="number"
          min={0}
          value={item.jumlahDikirim}
          onChange={(event) =>
            onUpdateItem(index, (current) => ({
              ...current,
              jumlahDikirim: event.target.value
            }))
          }
          className={cellFieldClass}
        />
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <Input
          aria-label="Jumlah Diterima"
          data-row={index}
          data-col={6}
          onKeyDown={(event) => onCellKeyDown(event, index, 6)}
          type="number"
          min={0}
          value={item.jumlahDiterima}
          onChange={(event) =>
            onUpdateItem(index, (current) => ({
              ...current,
              jumlahDiterima: event.target.value
            }))
          }
          className={`${cellFieldClass} font-bold`}
        />
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <Input
          aria-label="Jumlah Ditolak"
          data-row={index}
          data-col={7}
          onKeyDown={(event) => onCellKeyDown(event, index, 7)}
          type="number"
          min={0}
          value={item.jumlahDitolak}
          onChange={(event) =>
            onUpdateItem(index, (current) => ({
              ...current,
              jumlahDitolak: event.target.value
            }))
          }
          className={cellFieldClass}
        />
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <div className="flex h-9 items-center truncate bg-[#f8f7f3] px-2 text-xs font-bold text-stone-600">
          {generateAutoBatchNumber(index, tanggalPembelian)}
        </div>
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <Input
          aria-label="Kedaluwarsa"
          data-row={index}
          data-col={9}
          onKeyDown={(event) => onCellKeyDown(event, index, 9)}
          type="date"
          value={item.tanggalExpired}
          onChange={(event) =>
            onUpdateItem(index, (current) => ({
              ...current,
              tanggalExpired: event.target.value
            }))
          }
          className={cellFieldClass}
        />
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <Input
          aria-label="Harga Beli"
          data-row={index}
          data-col={10}
          onKeyDown={(event) => onCellKeyDown(event, index, 10)}
          type="number"
          min={0}
          value={item.hargaBeli}
          onChange={(event) =>
            onUpdateItem(index, (current) => ({
              ...current,
              hargaBeli: event.target.value
            }))
          }
          className={cellFieldClass}
        />
      </td>
      <td className="border-b border-r border-stone-100 p-0">
        <div className="flex h-9 items-stretch">
          <Input
            aria-label="Diskon Item"
            data-row={index}
            data-col={11}
            onKeyDown={(event) => onCellKeyDown(event, index, 11)}
            type="number"
            min={0}
            value={item.diskon}
            onChange={(event) =>
              onUpdateItem(index, (current) => ({
                ...current,
                diskon: event.target.value
              }))
            }
            className={`${cellFieldClass} flex-1`}
          />
          <select
            aria-label="Mode Diskon Item"
            value={item.diskonMode}
            onChange={(event) =>
              onUpdateItem(index, (current) => ({
                ...current,
                diskonMode: event.target.value as DiskonMode
              }))
            }
            className="w-11 shrink-0 border-0 border-l border-stone-200 bg-transparent px-1 text-[10px] font-bold text-stone-500 outline-none focus:relative focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <option value="rp">Rp</option>
            <option value="persen">%</option>
          </select>
        </div>
      </td>
      <td className="overflow-hidden border-b border-r border-stone-100 px-2 text-right">
        <span className="block truncate text-xs font-black text-[#20201d]">
          {formatCurrency(lineSubtotal(item))}
        </span>
      </td>
      <td className="overflow-hidden border-b border-r border-stone-100 px-2 text-right">
        <span className="block truncate text-xs font-black text-emerald-700">
          +{stokBertambah(item)}
        </span>
      </td>
      <td className="border-b border-stone-100 p-1 text-center">
        <button
          type="button"
          aria-label="Hapus item"
          onClick={() => onRemoveItem(index)}
          className="grid h-9 w-9 place-items-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.9} />
        </button>
      </td>
    </tr>
  );
});

export function PembelianForm() {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== "owner") {
    return (
      <>
        <Header
          title="Pembelian terkunci"
          description="Pembelian supplier hanya bisa diakses akun owner."
          action={
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          }
        />
        <section className="dashboard-surface grid min-h-[360px] place-items-center">
          <div className="grid max-w-sm place-items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f4ef] text-[#267d6b]">
              <Lock className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <h2 className="text-xl font-black text-[#20201d]">Khusus Owner</h2>
            <p className="text-sm font-semibold leading-6 text-stone-500">
              Form pembelian hanya bisa dipakai akun owner.
            </p>
          </div>
        </section>
      </>
    );
  }

  return <PembelianFormContent />;
}

function PembelianFormContent() {
  const router = useRouter();
  const { activeCabangId } = useCabangStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [obatOptions, setObatOptions] = useState<ObatListItem[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<MasterOption[]>([]);
  const [kategoriOptions, setKategoriOptions] = useState<MasterOption[]>([]);
  const [konversiSatuan, setKonversiSatuan] = useState<SatuanKonversi[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [tanggalPembelian, setTanggalPembelian] = useState(todayInputValue());
  const [status, setStatus] = useState<StatusPembelian>("draft");
  const [catatan, setCatatan] = useState("");
  const [diskon, setDiskon] = useState("0");
  const [pajak, setPajak] = useState("0");
  const [items, setItems] = useState<PembelianFormItem[]>(() => [{ ...emptyItem }]);
  const [rowsToAdd, setRowsToAdd] = useState("1");
  const [isItemsFullscreen, setIsItemsFullscreen] = useState(false);
  const itemsTableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [supplierResult, obatResult, satuanResult, kategoriResult, konversiResult] =
          await Promise.all([
            supplierService.list({ perPage: 1000 }),
            obatService.list({ perPage: 1000 }),
            obatService.listSatuanOptions(),
            obatService.listKategoriOptions(),
            pembelianService.listKonversiSatuan()
          ]);

        if (!active) {
          return;
        }

        setSuppliers(supplierResult.data.filter((supplier) => supplier.aktif));
        setObatOptions(obatResult.data.filter((obat) => obat.status));
        setSatuanOptions(satuanResult);
        setKategoriOptions(kategoriResult);
        setKonversiSatuan(konversiResult);
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal memuat supplier dan obat"
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

  const obatById = useMemo(
    () =>
      Object.fromEntries(
        obatOptions.map((obat) => [String(obat.id), obat])
      ) as Record<string, ObatListItem>,
    [obatOptions]
  );

  const obatByNama = useMemo(
    () =>
      Object.fromEntries(
        obatOptions.map((obat) => [obat.nama.trim().toLowerCase(), obat])
      ) as Record<string, ObatListItem>,
    [obatOptions]
  );

  const konversiByKey = useMemo(
    () =>
      Object.fromEntries(
        konversiSatuan.map((item) => [
          konversiKey(item.barangId, item.satuanDariId, item.satuanKeId),
          item
        ])
      ) as Record<string, SatuanKonversi>,
    [konversiSatuan]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + lineSubtotal(item), 0),
    [items]
  );
  const diskonValue = parseNumberInput(diskon);
  const pajakPersen = parseNumberInput(pajak);
  const pajakValue = Math.max(0, subtotal - diskonValue) * (pajakPersen / 100);
  const total = Math.max(0, subtotal - diskonValue + pajakValue);

  const updateItem = useCallback((
    index: number,
    updater: (item: PembelianFormItem) => PembelianFormItem
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? updater(item) : item
      )
    );
  }, []);

  const handleBarangNameChange = useCallback((index: number, value: string) => {
    const trimmed = value.trim();
    const matchedObat = obatByNama[trimmed.toLowerCase()];

    updateItem(index, (item) => ({
      ...item,
      barangNama: value,
      barangId: matchedObat?.id ?? "",
      // belum ada di data Barang -> siapin preview kode yang bakal beneran dipakai pas disimpan
      autoKode: matchedObat || !trimmed ? "" : generateAutoKode(trimmed, { unique: true }),
      satuanId: matchedObat?.satuanBeliId ?? item.satuanId,
      ...(matchedObat
        ? resolveKonversi(
            matchedObat.id,
            matchedObat.satuanBeliId ?? item.satuanId,
            obatById,
            konversiByKey
          )
        : { konversi: item.satuanId ? "1" : item.konversi, konversiLocked: Boolean(item.satuanId) }),
      kategoriId: matchedObat?.kategoriId ?? item.kategoriId,
      hargaBeli: matchedObat
        ? String(matchedObat.hargaAktif?.hargaBeli ?? 0)
        : item.hargaBeli
    }));
  }, [konversiByKey, obatById, obatByNama, updateItem]);

  const handleSatuanChange = useCallback((index: number, satuanId: string) => {
    updateItem(index, (item) => ({
      ...item,
      satuanId,
      ...(item.barangId
        ? resolveKonversi(item.barangId, satuanId, obatById, konversiByKey)
        : { konversi: satuanId ? "1" : "", konversiLocked: Boolean(satuanId) })
    }));
  }, [konversiByKey, obatById, updateItem]);

  const removeItem = useCallback((index: number) => {
    setItems((currentItems) =>
      currentItems.length === 1
        ? [{ ...emptyItem }]
        : currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  }, []);

  function addRows() {
    const count = Math.max(1, Math.floor(parseNumberInput(rowsToAdd)));
    setItems((currentItems) => [
      ...currentItems,
      ...Array.from({ length: count }, () => ({ ...emptyItem }))
    ]);
    setRowsToAdd("1");
  }

  const focusCell = useCallback((row: number, col: number) => {
    const target = itemsTableRef.current?.querySelector<HTMLElement>(
      `[data-row="${row}"][data-col="${col}"]`
    );
    target?.focus();
  }, []);

  /** Excel-style keyboard nav: Enter/ArrowDown-Up move a row, Arrow Left-Right on selects moves a column (Tab already handles it natively for text/number/date cells). */
  const handleCellKeyDown = useCallback((
    event: React.KeyboardEvent,
    row: number,
    col: number,
    isSelect = false
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      focusCell(row + (event.shiftKey ? -1 : 1), col);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusCell(row + 1, col);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusCell(row - 1, col);
    } else if (isSelect && event.key === "ArrowRight") {
      event.preventDefault();
      focusCell(row, col + 1);
    } else if (isSelect && event.key === "ArrowLeft") {
      event.preventDefault();
      focusCell(row, col - 1);
    }
  }, [focusCell]);

  /** Baris yang nama obatnya belum cocok data master otomatis dibuatkan barang baru, jadi apapun yang diketik di sini pasti nongol di fitur Barang. */
  async function resolveBarangId(
    item: PembelianFormItem,
    createdIdByNama: Map<string, string>
  ) {
    if (item.barangId) {
      return item.barangId;
    }

    const namaKey = item.barangNama.trim().toLowerCase();
    const cached = createdIdByNama.get(namaKey);

    if (cached) {
      return cached;
    }

    const konversi = konversiValue(item);
    const createdObat = await obatService.create({
      kode: item.autoKode || generateAutoKode(item.barangNama, { unique: true }),
      nama: item.barangNama.trim(),
      kategoriId: item.kategoriId || undefined,
      satuanDefaultId: item.satuanId || undefined,
      satuanBeliId: item.satuanId || undefined,
      satuanJualId: item.satuanId || undefined,
      hargaBeli: parseNumberInput(item.hargaBeli) / konversi,
      supplierId,
      status: true
    });

    createdIdByNama.set(namaKey, createdObat.id);
    return createdObat.id;
  }

  async function buildPayload(): Promise<PembelianInput | null> {
    if (!supplierId) {
      toast.error("Supplier wajib dipilih");
      return null;
    }

    if (!tanggalPembelian) {
      toast.error("Tanggal pembelian wajib diisi");
      return null;
    }

    const rowsToSubmit = items.filter(
      (item) =>
        (item.barangId || item.barangNama.trim()) &&
        parseNumberInput(item.jumlahDiterima) > 0
    );

    if (!rowsToSubmit.length) {
      toast.error("Minimal satu item obat wajib diisi");
      return null;
    }

    const createdIdByNama = new Map<string, string>();
    const validItems = [];

    for (const item of rowsToSubmit) {
      if (!item.satuanId) {
        toast.error(`Satuan pembelian ${item.barangNama.trim() || "item"} wajib dipilih`);
        return null;
      }

      const jumlahDikirim = parseNumberInput(item.jumlahDikirim);
      const jumlahDiterima = parseNumberInput(item.jumlahDiterima);
      const jumlahDitolak = parseNumberInput(item.jumlahDitolak);
      const konversi = parseNumberInput(item.konversi);

      if (konversi <= 0) {
        toast.error(`Konversi ${item.barangNama.trim() || "item"} wajib diisi lebih dari nol`);
        return null;
      }

      if (item.barangId && !obatById[item.barangId]?.satuanDefaultId) {
        toast.error(`Satuan dasar ${item.barangNama.trim() || "item"} belum diatur di master barang`);
        return null;
      }

      if (jumlahDikirim > 0 && jumlahDiterima + jumlahDitolak > jumlahDikirim) {
        toast.error(`Jumlah diterima + ditolak ${item.barangNama.trim() || "item"} melebihi jumlah dikirim`);
        return null;
      }

      const barangId = await resolveBarangId(item, createdIdByNama);
      const satuanDasarId = obatById[barangId]?.satuanDefaultId ?? item.satuanId;
      const hargaBeliInput = parseNumberInput(item.hargaBeli);

      validItems.push({
        barangId,
        satuanId: item.satuanId || undefined,
        satuanDasarId,
        konversi,
        jumlahDikirim,
        jumlahDiterima,
        jumlahDitolak,
        batchNumber: generateAutoBatchNumber(validItems.length, tanggalPembelian),
        tanggalExpired: item.tanggalExpired,
        // qty diterima dinormalisasi ke satuan stok (base unit) memakai konversi
        jumlah: jumlahDiterima * konversi,
        // harga beli dinormalisasi per satuan stok agar subtotal tetap konsisten
        hargaBeli: hargaBeliInput / konversi,
        diskonPersen:
          item.diskonMode === "persen" ? parseNumberInput(item.diskon) : 0,
        diskonNominal:
          item.diskonMode === "rp" ? parseNumberInput(item.diskon) : 0
      });
    }

    return {
      supplierId,
      cabangId: activeCabangId ?? undefined,
      tanggalFaktur: tanggalPembelian,
      status,
      catatan,
      diskonTotal: diskonValue,
      pajakTotal: pajakValue,
      items: validItems
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = await buildPayload();

      if (!payload) {
        return;
      }

      await pembelianService.create(payload);
      toast.success(
        status === "diterima"
          ? "Pembelian tersimpan dan stok berhasil ditambahkan"
          : "Draft pembelian berhasil disimpan"
      );
      router.push("/pembelian");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan pembelian"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header
        title="Tambah Pembelian"
        description="Buat purchase order dari supplier. Status diterima akan langsung menambah stok obat."
        action={
          <Link
            href="/pembelian"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <section className="min-w-0 overflow-hidden dashboard-surface xl:col-start-1 xl:row-start-1">
          <div className="mb-6 flex items-start gap-4 rounded-lg bg-[#f8f7f3] p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#fff0ea] text-[#ff6a3d]">
              <PackagePlus className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#20201d]">
                Informasi Pembelian
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">
                Pilih supplier dan item obat. Batch akan masuk ke stok hanya
                saat status pembelian diterima.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Supplier"
              value={supplierId}
              disabled={isLoadingOptions}
              onChange={(event) => setSupplierId(event.target.value)}
              options={[
                { label: "Pilih supplier", value: "" },
                ...suppliers.map((supplier) => ({
                  label: supplier.nama,
                  value: supplier.id
                }))
              ]}
            />
            <Input
              label="Tanggal Pembelian"
              type="date"
              value={tanggalPembelian}
              onChange={(event) => setTanggalPembelian(event.target.value)}
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusPembelian)
              }
              options={[
                { label: "Draft - belum masuk stok", value: "draft" },
                { label: "Diterima - langsung masuk stok", value: "diterima" },
                { label: "Dibatalkan", value: "dibatalkan" }
              ]}
            />
            <Input
              label="Diskon Transaksi"
              type="number"
              min={0}
              value={diskon}
              onChange={(event) => setDiskon(event.target.value)}
            />
            <Input
              label="Pajak (%)"
              type="number"
              min={0}
              max={100}
              value={pajak}
              onChange={(event) => setPajak(event.target.value)}
            />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Catatan</span>
              <textarea
                rows={3}
                value={catatan}
                onChange={(event) => setCatatan(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                placeholder="Catatan pembelian"
              />
            </label>
          </div>
        </section>

        <section className={`min-w-0 overflow-hidden dashboard-surface xl:col-start-1 xl:col-span-2 xl:row-start-2 ${
          isItemsFullscreen ? "fixed inset-3 z-50 overflow-auto" : ""
        }`}>
          <div>
            <h2 className="text-lg font-black text-[#20201d]">
              Item Pembelian
            </h2>
            <p className="mt-1 text-sm font-semibold text-stone-500">
              Mulai dari 1 baris. Tambah baris manual sesuai jumlah yang Anda butuhkan. Nama yang belum ada di
              data Barang akan otomatis dibuatkan barang baru saat pembelian disimpan.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Input
              label="Tambah Baris"
              type="number"
              min={1}
              value={rowsToAdd}
              onChange={(event) => setRowsToAdd(event.target.value)}
              className="w-32"
            />
            <Button
              type="button"
              onClick={addRows}
              className="h-10 rounded-lg bg-[#20201d] px-4 font-bold hover:bg-[#33312d]"
            >
              Tambah Baris
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsItemsFullscreen((current) => !current)}
              className="h-10"
            >
              {isItemsFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              {isItemsFullscreen ? "Kecilkan" : "Perbesar"}
            </Button>
          </div>

          <div className={`mt-4 overflow-auto rounded-lg border border-stone-200 ${
            isItemsFullscreen ? "max-h-[calc(100vh-210px)]" : ""
          }`}>
            <datalist id="pembelian-barang-options">
              {obatOptions.map((obat) => (
                <option key={obat.id} value={obat.nama} />
              ))}
            </datalist>
            <table
              ref={itemsTableRef}
              className="min-w-[1800px] table-fixed border-collapse text-sm"
            >
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-[#20201d] text-white">
                <tr>
                  <th className="border-r border-stone-700 px-2 py-2 text-center text-[10px] font-black uppercase leading-tight tracking-wide">
                    No
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Kategori
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Barang
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Kode Barang
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Satuan Pembelian
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Konversi
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Jumlah Dikirim
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Jumlah Diterima
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Jumlah Ditolak
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Nomor Batch
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Kedaluwarsa
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Harga Beli
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-left text-[10px] font-black uppercase leading-tight tracking-wide">
                    Diskon Item
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-right text-[10px] font-black uppercase leading-tight tracking-wide">
                    Subtotal
                  </th>
                  <th className="border-r border-stone-700 px-2 py-2 text-right text-[10px] font-black uppercase leading-tight tracking-wide">
                    Stok Bertambah
                  </th>
                  <th className="px-1 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <PembelianItemRow
                    key={index}
                    item={item}
                    index={index}
                    tanggalPembelian={tanggalPembelian}
                    isLoadingOptions={isLoadingOptions}
                    kategoriOptions={kategoriOptions}
                    satuanOptions={satuanOptions}
                    obatById={obatById}
                    onUpdateItem={updateItem}
                    onBarangNameChange={handleBarangNameChange}
                    onSatuanChange={handleSatuanChange}
                    onRemoveItem={removeItem}
                    onCellKeyDown={handleCellKeyDown}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="h-11 rounded-lg bg-[#0f766e] px-5 font-black hover:bg-[#115e59]"
            >
              <Save className="h-4 w-4" />
              Simpan Pembelian
            </Button>
          </div>
        </section>

        <aside className="h-max dashboard-surface xl:col-start-2 xl:row-start-1">
          <h2 className="text-lg font-black text-[#20201d]">
            Ringkasan
          </h2>
          <div className="mt-4 space-y-3 rounded-lg bg-[#f8f7f3] p-4 text-sm font-semibold text-stone-600">
            <div className="flex justify-between gap-4">
              <span>Subtotal</span>
              <strong className="text-[#20201d]">
                {formatCurrency(subtotal)}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Diskon</span>
              <strong className="text-[#20201d]">
                {formatCurrency(diskonValue)}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Pajak ({pajakPersen}%)</span>
              <strong className="text-[#20201d]">
                {formatCurrency(pajakValue)}
              </strong>
            </div>
            <div className="border-t border-stone-200 pt-3">
              <div className="flex justify-between gap-4">
                <span>Total</span>
                <strong className="text-xl text-[#20201d]">
                  {formatCurrency(total)}
                </strong>
              </div>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-[#fff0ea] p-3 text-xs font-bold leading-5 text-[#b04420]">
            Jika status dibuat diterima, sistem langsung membuat stok masuk
            untuk semua item pembelian.
          </p>
        </aside>
      </form>
    </>
  );
}
