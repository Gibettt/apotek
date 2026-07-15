import { supabase } from "@/lib/supabase";

export interface ActivePrice {
  hargaBeli: number;
  hargaJual: number;
}

interface HargaBarangAktifRow {
  barang_id: string;
  harga_beli: number | string | null;
  harga_jual: number | string | null;
}

/**
 * Resolves the currently-active price for a single barang from the
 * `v_harga_barang_aktif` view (already filtered to the active row per
 * barang_id/cabang_id/tipe_harga). Returns null when the item has no
 * active price row (or when Supabase isn't configured).
 */
export async function resolveActivePrice(
  barangId: string,
  cabangId?: string,
  tipeHarga = "jual"
): Promise<ActivePrice | null> {
  if (!supabase) {
    return null;
  }

  let query = supabase
    .from("v_harga_barang_aktif")
    .select("harga_beli,harga_jual")
    .eq("barang_id", barangId)
    .eq("tipe_harga", tipeHarga);

  if (cabangId) {
    query = query.eq("cabang_id", cabangId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    hargaBeli: Number(data.harga_beli ?? 0),
    hargaJual: Number(data.harga_jual ?? 0)
  };
}

/**
 * Batch variant of resolveActivePrice for list/getById call sites, so
 * price lookups for N rows cost one query instead of N.
 */
export async function resolveActivePrices(
  barangIds: string[],
  cabangId?: string,
  tipeHarga = "jual"
): Promise<Record<string, ActivePrice>> {
  if (!supabase || !barangIds.length) {
    return {};
  }

  const uniqueIds = [...new Set(barangIds)];

  let query = supabase
    .from("v_harga_barang_aktif")
    .select("barang_id,harga_beli,harga_jual")
    .in("barang_id", uniqueIds)
    .eq("tipe_harga", tipeHarga);

  if (cabangId) {
    query = query.eq("cabang_id", cabangId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as HargaBarangAktifRow[]).reduce<Record<string, ActivePrice>>(
    (acc, row) => {
      acc[row.barang_id] = {
        hargaBeli: Number(row.harga_beli ?? 0),
        hargaJual: Number(row.harga_jual ?? 0)
      };
      return acc;
    },
    {}
  );
}
