"use client";

import { KasirCart } from "@/components/kasir/KasirCart";
import { KasirSearch } from "@/components/kasir/KasirSearch";

export function PenjualanForm({ onPay }: { onPay: () => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
      <KasirSearch />
      <KasirCart onPay={onPay} />
    </div>
  );
}
