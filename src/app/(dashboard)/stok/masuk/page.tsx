"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs, type ModuleConfig, type OptionConfig } from "@/constants/modules";
import { obatService } from "@/services/obatService";
import { stokService } from "@/services/stokService";

export default function StokMasukPage() {
  const searchParams = useSearchParams();
  const prefillBarangId = searchParams.get("barangId") ?? "";
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
    key: "stok-masuk",
    title: "Stok Masuk",
    description: "Tambah stok obat dari luar pembelian resmi: retur pelanggan, hibah, atau koreksi.",
    basePath: "/stok",
    fields: [
      { name: "barangId", label: "Obat", type: "select", options: obatOptions, defaultValue: prefillBarangId },
      { name: "qty", label: "Jumlah Masuk", type: "number" },
      { name: "nomorBatch", label: "Nomor Batch", type: "text", placeholder: "Kosongkan jika tidak ada" },
      { name: "tanggalExpired", label: "Tanggal Expired", type: "date" },
      { name: "hargaBeli", label: "Harga Beli / Satuan", type: "number" },
      {
        name: "keterangan",
        label: "Keterangan",
        type: "textarea",
        placeholder: "Contoh: retur pelanggan, hibah, koreksi stok"
      }
    ],
    create: async (payload) => {
      await stokService.masuk({
        barangId: String(payload.barangId ?? ""),
        qty: Number(payload.qty ?? 0),
        nomorBatch: String(payload.nomorBatch ?? "").trim() || undefined,
        tanggalExpired: String(payload.tanggalExpired ?? "").trim() || undefined,
        hargaBeli: payload.hargaBeli ? Number(payload.hargaBeli) : undefined,
        keterangan: String(payload.keterangan ?? "").trim() || undefined
      });
    }
  };

  return <ModuleFormPage config={config} title="Stok Masuk" />;
}
