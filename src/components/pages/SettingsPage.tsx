"use client";

import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { Pengaturan } from "@/types";

const titles = {
  apotek: "Profil Apotek",
  struk: "Pengaturan Struk",
  stok: "Pengaturan Stok",
  notifikasi: "Pengaturan Notifikasi"
};

export function SettingsPage({
  group,
  settings
}: {
  group: keyof typeof titles;
  settings: Pengaturan[];
}) {
  const defaultValues = settings.reduce<Record<string, string>>((values, item) => {
    values[item.key] = item.value;
    return values;
  }, {});
  const { register, handleSubmit } = useForm({ defaultValues });

  function onSubmit() {
    toast.success("Pengaturan berhasil disimpan");
  }

  return (
    <>
      <Header
        title={titles[group]}
        description="Nilai tersimpan lewat service pengaturan dan siap diarahkan ke API."
      />
      <Card>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              {settings.map((item) => (
                <Input
                  key={item.key}
                  label={item.label}
                  {...register(item.key)}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="h-4 w-4" />
                Simpan Pengaturan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
