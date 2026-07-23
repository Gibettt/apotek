import type { JurnalDetailInput } from "@/types";

export interface JurnalLineCheck {
  akunId: string;
  debit: number;
  kredit: number;
  akunAktif?: boolean;
}

export interface JurnalTotals {
  totalDebit: number;
  totalKredit: number;
  selisih: number;
  seimbang: boolean;
}

export function computeJurnalTotals(
  details: Array<Pick<JurnalDetailInput, "debit" | "kredit">>
): JurnalTotals {
  const totalDebit = details.reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalKredit = details.reduce((sum, item) => sum + (item.kredit || 0), 0);
  const selisih = totalDebit - totalKredit;

  return {
    totalDebit,
    totalKredit,
    selisih,
    seimbang: Math.abs(selisih) < 0.005
  };
}

/**
 * Validasi baris akun jurnal. requireBalanced=true dipakai saat "Simpan dan Posting".
 * Ini duplikat sengaja dari validasi di fungsi Postgres (create_jurnal_umum dkk) —
 * validasi di sini hanya untuk UX cepat di frontend, backend tetap sumber kebenaran final.
 */
export function validateJurnalLines(
  details: JurnalLineCheck[],
  requireBalanced: boolean
): string[] {
  const errors: string[] = [];

  if (details.length < 2) {
    errors.push("Jurnal minimal harus mempunyai dua baris akun.");
  }

  details.forEach((line, index) => {
    const rowLabel = `Baris ${index + 1}`;

    if (!line.akunId) {
      errors.push(`${rowLabel}: akun wajib dipilih.`);
      return;
    }

    if (line.debit < 0 || line.kredit < 0) {
      errors.push(`${rowLabel}: nilai debit/kredit tidak boleh negatif.`);
    }

    if (line.debit > 0 && line.kredit > 0) {
      errors.push(`${rowLabel}: hanya boleh isi debit atau kredit, tidak keduanya.`);
    }

    if (line.debit === 0 && line.kredit === 0) {
      errors.push(`${rowLabel}: debit dan kredit tidak boleh sama-sama kosong/nol.`);
    }

    if (line.akunAktif === false) {
      errors.push(`${rowLabel}: akun yang dipilih sudah tidak aktif.`);
    }
  });

  const totals = computeJurnalTotals(details);

  if (totals.totalDebit <= 0) {
    errors.push("Total transaksi jurnal harus lebih besar dari nol.");
  }

  if (requireBalanced && !totals.seimbang) {
    errors.push("Jurnal belum seimbang, total debit harus sama dengan total kredit untuk diposting.");
  }

  return errors;
}
