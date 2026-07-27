"use client";

import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs, type ModuleConfig } from "@/constants/modules";
import { stokService } from "@/services/stokService";

const config: ModuleConfig = {
  ...moduleConfigs.stok,
  key: "stok-expired",
  title: "Obat Mendekati Expired",
  description: "Batch obat yang expired dalam 60 hari ke depan atau sudah lewat.",
  load: async () => {
    const rows = await stokService.expiredSoon(60);
    return rows.map((item) => ({
      id: item.id,
      namaBarang: item.namaBarang,
      nomorBatch: item.nomorBatch,
      tanggalExpired: item.tanggalExpired,
      qty: item.qty,
      lokasiNama: "-"
    }));
  }
};

export default function StokExpiredPage() {
  return <ModuleListPage config={config} />;
}
