import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Penjualan } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";

export function RecentTransactions({ items }: { items: Penjualan[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/penjualan/${item.id}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
        >
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {item.nomorInvoice}
            </p>
            <p className="text-xs text-slate-500">
              {item.namaPelanggan} - {formatDateTime(item.tanggal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-950">
              {formatCurrency(item.grandTotal)}
            </p>
            <Badge variant="success">{item.status}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
