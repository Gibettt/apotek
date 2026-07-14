"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Penjualan } from "@/types";
import { buildReceiptText } from "@/utils/printReceipt";

export function KasirReceipt({ penjualan }: { penjualan: Penjualan | null }) {
  if (!penjualan) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3 no-print">
        <p className="text-sm font-semibold text-slate-950">Struk Terakhir</p>
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
      <pre className="whitespace-pre-wrap rounded-md bg-white font-mono text-xs leading-5 text-slate-950">
        {buildReceiptText(penjualan)}
      </pre>
    </div>
  );
}
