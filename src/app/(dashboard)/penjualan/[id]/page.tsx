"use client";

import { KasirPenjualanDetailPage } from "@/components/kasir/KasirPenjualanDetailPage";
import { PenjualanDetailPage } from "@/components/pages/PenjualanDetailPage";
import { useAuthStore } from "@/store/authStore";

export default function DetailPenjualanRoute({
  params
}: {
  params: { id: string };
}) {
  const user = useAuthStore((state) => state.user);

  if (user?.role === "kasir") {
    return <KasirPenjualanDetailPage id={params.id} />;
  }

  return <PenjualanDetailPage id={params.id} />;
}
