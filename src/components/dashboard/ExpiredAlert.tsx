import { CalendarClock } from "lucide-react";
import type { StokBatch } from "@/types";
import { formatDate } from "@/utils/formatDate";

export function ExpiredAlert({ items }: { items: StokBatch[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <CalendarClock className="mt-0.5 h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-950">{item.namaBarang}</p>
            <p className="text-xs text-red-800">
              Batch {item.nomorBatch}, expired{" "}
              {item.tanggalExpired ? formatDate(item.tanggalExpired) : "-"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
