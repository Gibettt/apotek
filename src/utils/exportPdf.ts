import type { ReportRow } from "@/types";
import { formatCurrency } from "./formatCurrency";

export function buildPrintableReport(title: string, rows: ReportRow[]) {
  const total = rows.reduce((sum, row) => sum + row.nilai, 0);

  return {
    title,
    total,
    rows,
    summary: `${title}: ${formatCurrency(total)} dari ${rows.length} baris`
  };
}
