"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";
import type { ModuleRecord } from "@/constants/modules";
import { lokasiSimpanService } from "@/services/masterDataService";

export default function EditLokasiSimpanPage() {
  const config = moduleConfigs.lokasiSimpan;
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [record, setRecord] = useState<ModuleRecord | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setIsLoading(true);
    setNotFound(false);

    lokasiSimpanService
      .getById(id)
      .then((item) => {
        if (!active) return;
        if (!item) {
          setNotFound(true);
          return;
        }
        setRecord({
          id: item.id,
          kode: item.kode,
          nama: item.nama,
          tipeLokasi: item.tipeLokasi ?? "",
          deskripsi: item.deskripsi ?? ""
        });
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <p className="rounded-lg bg-white p-6 text-sm font-semibold text-stone-500 shadow-sm">
        Memuat data...
      </p>
    );
  }

  if (notFound || !record) {
    return (
      <p className="rounded-lg bg-white p-6 text-sm font-semibold text-red-600 shadow-sm">
        Data lokasi simpan tidak ditemukan.
      </p>
    );
  }

  return <ModuleFormPage config={config} record={record} mode="edit" />;
}
