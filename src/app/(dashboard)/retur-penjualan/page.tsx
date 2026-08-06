"use client";

import { KasirReturPenjualanPage } from "@/components/kasir/KasirReturPenjualanPage";
import { ReturPenjualanPage } from "@/components/pages/ReturPenjualanPage";
import { useAuthStore } from "@/store/authStore";

export default function ReturPenjualanRoute() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === "kasir") {
    return <KasirReturPenjualanPage />;
  }

  return <ReturPenjualanPage />;
}
