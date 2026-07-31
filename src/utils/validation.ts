import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter")
});

export const registerSchema = z
  .object({
    namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"]
  });

export const obatSchema = z.object({
  kodeObat: z.string().min(3, "Kode obat wajib diisi"),
  namaObat: z.string().min(3, "Nama obat wajib diisi"),
  kategoriId: z.coerce.number().min(1),
  supplierId: z.coerce.number().min(1),
  satuan: z.string().min(2),
  hargaBeli: z.coerce.number().nonnegative(),
  hargaJual: z.coerce.number().positive(),
  stokMinimum: z.coerce.number().int().nonnegative(),
  golongan: z.enum(["bebas", "bebas terbatas", "keras"]),
  membutuhkanResep: z.coerce.boolean(),
  status: z.coerce.boolean()
});

export const pembelianSchema = z.object({
  supplierId: z.coerce.number().min(1),
  tanggalPembelian: z.string().min(8),
  catatan: z.string().optional()
});

export const penjualanSchema = z.object({
  metodePembayaran: z.enum(["tunai", "transfer", "accurate"]),
  bayar: z.coerce.number().nonnegative(),
  pelangganId: z.coerce.number().optional()
});

export const resepSchema = z.object({
  pelangganId: z.coerce.number().min(1),
  namaDokter: z.string().min(3),
  noSipDokter: z.string().min(3),
  tanggalResep: z.string().min(8),
  catatan: z.string().optional()
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ObatFormValues = z.infer<typeof obatSchema>;
export type PembelianFormValues = z.infer<typeof pembelianSchema>;
export type PenjualanFormValues = z.infer<typeof penjualanSchema>;
export type ResepFormValues = z.infer<typeof resepSchema>;
