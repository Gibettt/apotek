import { describe, expect, it } from "vitest";
import { loginSchema, obatSchema, penjualanSchema } from "./validation";

describe("validation schemas", () => {
  it("rejects an invalid login email", () => {
    const result = loginSchema.safeParse({
      email: "owner",
      password: "password"
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid medicine payload", () => {
    const result = obatSchema.safeParse({
      kodeObat: "OBT-1000",
      namaObat: "Cetirizine 10mg",
      kategoriId: 1,
      supplierId: 1,
      satuan: "tablet",
      hargaBeli: 500,
      hargaJual: 1000,
      stokMinimum: 20,
      golongan: "bebas terbatas",
      membutuhkanResep: false,
      status: true
    });

    expect(result.success).toBe(true);
  });

  it("requires a supported payment method", () => {
    const result = penjualanSchema.safeParse({
      metodePembayaran: "BPJS",
      bayar: 10000
    });

    expect(result.success).toBe(false);
  });

  it("accepts Accurate e-Payment as a supported method", () => {
    const result = penjualanSchema.safeParse({
      metodePembayaran: "accurate",
      bayar: 0
    });

    expect(result.success).toBe(true);
  });
});
