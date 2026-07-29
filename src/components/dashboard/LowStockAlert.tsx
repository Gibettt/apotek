import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LOW_STOCK_THRESHOLD } from "@/lib/stockRules";
import type { Obat } from "@/types";

export function LowStockAlert({ items }: { items: Obat[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-950">
                {item.nama}
              </p>
              <p className="text-xs text-amber-800">
                Sisa {item.stokTersedia}, batas menipis {LOW_STOCK_THRESHOLD}
              </p>
            </div>
          </div>
          <Badge variant="warning">Restock</Badge>
        </div>
      ))}
      <Link href="/stok/hampir-habis">
        <Button variant="secondary" className="w-full">
          Lihat Stok Menipis
        </Button>
      </Link>
    </div>
  );
}
