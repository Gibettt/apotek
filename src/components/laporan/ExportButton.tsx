"use client";

import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import type { ReportRow } from "@/types";
import { buildCsv } from "@/utils/exportExcel";
import { buildPrintableReport } from "@/utils/exportPdf";

export function ExportButton({
  title,
  rows
}: {
  title: string;
  rows: ReportRow[];
}) {
  function exportCsv() {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replaceAll(" ", "-")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil dibuat");
  }

  function printSummary() {
    const report = buildPrintableReport(title, rows);
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) {
      toast.error("Popup print diblokir browser");
      return;
    }
    win.document.write(`<pre>${report.summary}</pre>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={exportCsv}>
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button type="button" variant="secondary" onClick={printSummary}>
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
}
