import type { ReportRow } from "@/types";

export function buildCsv(rows: ReportRow[]) {
  const header = ["Tanggal", "Referensi", "Kategori", "Nilai", "Status"];
  const body = rows.map((row) => [
    row.tanggal,
    row.referensi,
    row.kategori,
    String(row.nilai),
    row.status
  ]);

  return [header, ...body]
    .map((columns) => columns.map((column) => `"${column}"`).join(","))
    .join("\n");
}
