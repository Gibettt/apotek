"use client";

import { UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { pelangganService } from "@/services/pelangganService";
import type { Pelanggan } from "@/types";

export function KasirPelangganPicker({
  pelangganId,
  pelangganNama,
  onNameChange,
  onChange
}: {
  pelangganId?: string;
  pelangganNama?: string;
  onNameChange?: (nama: string) => void;
  onChange: (pelanggan: Pelanggan | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const selected = pelanggan.find((item) => item.id === pelangganId) ?? null;
  const typedName = (pelangganNama ?? query).trim();
  const exactMatch = typedName
    ? pelanggan.find(
        (item) => item.nama.trim().toLowerCase() === typedName.toLowerCase()
      )
    : null;

  useEffect(() => {
    let active = true;

    async function loadPelanggan() {
      try {
        const result = await pelangganService.list({ perPage: 1000 });
        if (active) {
          setPelanggan(result.data.filter((item) => item.aktif));
        }
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Gagal memuat pelanggan"
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadPelanggan();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return pelanggan.slice(0, 6);
    }

    return pelanggan
      .filter((item) =>
        [item.nama, item.kode, item.telepon].some((value) =>
          String(value ?? "").toLowerCase().includes(normalized)
        )
      )
      .slice(0, 6);
  }, [pelanggan, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f8f7f3] text-[#0f766e]">
            <UserRound className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <p className="text-sm font-black text-[#20201d]">Pelanggan</p>
            <p className="mt-1 text-xs font-semibold text-stone-500">
              {selected ? selected.nama : typedName || "Umum"}
            </p>
          </div>
        </div>
        {selected || typedName ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              onNameChange?.("");
              setQuery("");
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-black text-stone-600 transition hover:bg-[#f8f7f3] hover:text-stone-950"
          >
            <X className="h-3.5 w-3.5" />
            Umum
          </button>
        ) : null}
      </div>

      <input
        value={query}
        disabled={isLoading}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange(null);
          onNameChange?.(event.target.value);
        }}
        placeholder={isLoading ? "Memuat pelanggan..." : "Cari nama pelanggan"}
        className="h-11 w-full rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
      />

      {query || !selected ? (
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              onNameChange?.("");
              setQuery("");
            }}
            className={`flex h-10 items-center justify-between rounded-lg px-3 text-left text-sm font-bold transition ${
              !selected
                ? "bg-[#20201d] text-white"
                : "bg-[#f8f7f3] text-stone-600 hover:text-stone-950"
            }`}
          >
            Umum
          </button>
          {typedName && !exactMatch ? (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-700">
              Pelanggan baru akan otomatis dibuat saat pembayaran.
            </div>
          ) : null}
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChange(item);
                onNameChange?.(item.nama);
                setQuery("");
              }}
              className={`flex h-10 items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-bold transition ${
                item.id === pelangganId
                  ? "bg-[#20201d] text-white"
                  : "bg-[#f8f7f3] text-stone-600 hover:text-stone-950"
              }`}
            >
              <span className="min-w-0 truncate">{item.nama}</span>
              <span className="shrink-0 text-xs opacity-70">
                {item.telepon || item.kode}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
