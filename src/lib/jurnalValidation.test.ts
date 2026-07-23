import { describe, expect, it } from "vitest";
import { computeJurnalTotals, validateJurnalLines } from "./jurnalValidation";

describe("computeJurnalTotals", () => {
  it("menghitung total debit, kredit, selisih, dan status seimbang", () => {
    const totals = computeJurnalTotals([
      { debit: 100000, kredit: 0 },
      { debit: 0, kredit: 100000 }
    ]);

    expect(totals).toEqual({
      totalDebit: 100000,
      totalKredit: 100000,
      selisih: 0,
      seimbang: true
    });
  });

  it("menandai tidak seimbang saat debit dan kredit berbeda", () => {
    const totals = computeJurnalTotals([
      { debit: 150000, kredit: 0 },
      { debit: 0, kredit: 100000 }
    ]);

    expect(totals.seimbang).toBe(false);
    expect(totals.selisih).toBe(50000);
  });
});

describe("validateJurnalLines", () => {
  const balancedLines = [
    { akunId: "akun-kas", debit: 100000, kredit: 0, akunAktif: true },
    { akunId: "akun-penjualan", debit: 0, kredit: 100000, akunAktif: true }
  ];

  it("lolos untuk jurnal seimbang dengan minimal dua baris", () => {
    expect(validateJurnalLines(balancedLines, true)).toEqual([]);
  });

  it("menolak kurang dari dua baris akun", () => {
    const errors = validateJurnalLines([balancedLines[0]], false);
    expect(errors).toContain("Jurnal minimal harus mempunyai dua baris akun.");
  });

  it("menolak baris yang mengisi debit dan kredit sekaligus", () => {
    const errors = validateJurnalLines(
      [
        { akunId: "akun-kas", debit: 100000, kredit: 100000, akunAktif: true },
        balancedLines[1]
      ],
      false
    );
    expect(errors).toContain("Baris 1: hanya boleh isi debit atau kredit, tidak keduanya.");
  });

  it("menolak baris yang debit dan kreditnya sama-sama nol", () => {
    const errors = validateJurnalLines(
      [{ akunId: "akun-kas", debit: 0, kredit: 0, akunAktif: true }, balancedLines[1]],
      false
    );
    expect(errors).toContain("Baris 1: debit dan kredit tidak boleh sama-sama kosong/nol.");
  });

  it("menolak nilai negatif", () => {
    const errors = validateJurnalLines(
      [{ akunId: "akun-kas", debit: -1000, kredit: 0, akunAktif: true }, balancedLines[1]],
      false
    );
    expect(errors).toContain("Baris 1: nilai debit/kredit tidak boleh negatif.");
  });

  it("menolak akun yang tidak aktif", () => {
    const errors = validateJurnalLines(
      [{ akunId: "akun-lama", debit: 100000, kredit: 0, akunAktif: false }, balancedLines[1]],
      false
    );
    expect(errors).toContain("Baris 1: akun yang dipilih sudah tidak aktif.");
  });

  it("mewajibkan seimbang hanya saat requireBalanced=true", () => {
    const unbalanced = [
      { akunId: "akun-kas", debit: 150000, kredit: 0, akunAktif: true },
      { akunId: "akun-penjualan", debit: 0, kredit: 100000, akunAktif: true }
    ];

    expect(validateJurnalLines(unbalanced, false)).toEqual([]);
    expect(validateJurnalLines(unbalanced, true)).toContain(
      "Jurnal belum seimbang, total debit harus sama dengan total kredit untuk diposting."
    );
  });

  it("menolak total transaksi nol", () => {
    const errors = validateJurnalLines(
      [
        { akunId: "akun-kas", debit: 0, kredit: 0, akunAktif: true },
        { akunId: "akun-penjualan", debit: 0, kredit: 0, akunAktif: true }
      ],
      false
    );
    expect(errors).toContain("Total transaksi jurnal harus lebih besar dari nol.");
  });
});
