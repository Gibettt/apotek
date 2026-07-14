export const statusVariant = {
  aktif: "success",
  nonaktif: "muted",
  draft: "warning",
  diterima: "success",
  dibatalkan: "danger",
  selesai: "success",
  menunggu: "warning",
  diproses: "info",
  ditolak: "danger",
  stok_menipis: "warning",
  obat_expired: "danger",
  sistem: "info"
} as const;

export function statusLabel(value: string | boolean) {
  if (typeof value === "boolean") {
    return value ? "Aktif" : "Nonaktif";
  }

  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
