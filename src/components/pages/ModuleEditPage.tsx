"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ModuleFormPage } from "@/components/pages/ModuleFormPage";
import { moduleConfigs } from "@/constants/modules";
import type { ModuleRecord } from "@/constants/modules";

type ModuleKey = keyof typeof moduleConfigs;

export function ModuleEditPage({ moduleKey }: { moduleKey: ModuleKey }) {
  const config = moduleConfigs[moduleKey];
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [record, setRecord] = useState<ModuleRecord | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    config
      .load()
      .then((rows) => {
        if (active) {
          setRecord(rows.find((item) => String(item.id) === String(id)));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [config, id]);

  if (isLoading) {
    return (
      <p className="rounded-lg bg-white p-6 text-sm font-semibold text-stone-500 shadow-sm">
        Memuat data...
      </p>
    );
  }

  if (!record) {
    return (
      <p className="rounded-lg bg-white p-6 text-sm font-semibold text-red-600 shadow-sm">
        Data {config.title.toLowerCase()} tidak ditemukan.
      </p>
    );
  }

  return <ModuleFormPage config={config} record={record} mode="edit" />;
}
