"use client";

import { useEffect, useState } from "react";
import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs, type ModuleConfig, type OptionConfig } from "@/constants/modules";
import { obatService } from "@/services/obatService";
import { stokService } from "@/services/stokService";

const alasanOptions: OptionConfig[] = [
  { label: "Rusak", value: "Rusak" },
  { label: "Hilang", value: "Hilang" },
  { label: "Kadaluarsa", value: "Kadaluarsa" },
  { label: "Pemakaian Internal", value: "Pemakaian Internal" },
  { label: "Lainnya", value: "Lainnya" }
];

export default function StokKeluarPage() {
  const [obatOptions, setObatOptions] = useState<OptionConfig[]>([]);

  useEffect(() => {
    let active = true;

    obatService.list({ perPage: 9999 }).then((result) => {
      if (!active) return;
      setObatOptions(result.data.map((item) => ({ label: `${item.kode} - ${item.nama}`, value: item.id })));
    });

    return () => {
      active = false;
    };
  }, []);

  const config: ModuleConfig = {
    ...moduleConfigs.stok,
    key: "stok-keluar",
    title: "Stok Keluar",
    description: "Kurangi stok obat di luar transaksi penjualan: rusak, hilang, kadaluarsa, atau pemakaian internal.",
    basePath: "/stok",
    fields: [
      { name: "barangId", label: "Obat", type: "select", options: obatOptions },
      { name: "qty", label: "Jumlah Keluar", type: "number" },
      { name: "keterangan", label: "Alasan", type: "select", options: alasanOptions }
    ],
    create: async (payload) => {
      await stokService.keluar({
        barangId: String(payload.barangId ?? ""),
        qty: Number(payload.qty ?? 0),
        keterangan: String(payload.keterangan ?? "").trim()
      });
    }
  };

  return <ModuleFormPage config={config} title="Stok Keluar" />;
}
