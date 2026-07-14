"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { FieldConfig, ModuleConfig, ModuleRecord } from "@/constants/modules";
import { cn } from "@/utils/cn";

function defaultValues(fields: FieldConfig[], record?: ModuleRecord) {
  return fields.reduce<Record<string, string | number | boolean>>((values, field) => {
    values[field.name] =
      record?.[field.name] ?? field.defaultValue ?? (field.type === "checkbox" ? false : "");
    return values;
  }, {});
}

function FieldRenderer({
  field,
  register
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
}) {
  if (field.type === "select") {
    return (
      <Select
        label={field.label}
        options={field.options?.map((option) => ({
          label: option.label,
          value: String(option.value)
        })) ?? []}
        {...register(field.name)}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
        <span>{field.label}</span>
        <textarea
          rows={4}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          placeholder={field.placeholder}
          {...register(field.name)}
        />
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
          {...register(field.name)}
        />
        {field.label}
      </label>
    );
  }

  return (
    <Input
      label={field.label}
      type={field.type}
      placeholder={field.placeholder}
      {...register(field.name)}
    />
  );
}

export function ModuleFormPage({
  config,
  record,
  mode = "create",
  title
}: {
  config: ModuleConfig;
  record?: ModuleRecord;
  mode?: "create" | "edit" | "process";
  title?: string;
}) {
  const router = useRouter();
  const values = useMemo(() => defaultValues(config.fields, record), [config.fields, record]);
  const { register, handleSubmit } = useForm({ values });

  function onSubmit() {
    toast.success(
      mode === "edit"
        ? `${config.title} berhasil diperbarui`
        : `${config.title} berhasil disimpan`
    );
    router.push(config.basePath);
  }

  return (
    <>
      <Header
        title={
          title ??
          (mode === "edit" ? `Edit ${config.title}` : `Tambah ${config.title}`)
        }
        description={config.description}
      />
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {config.fields.map((field) => (
                <div
                  key={field.name}
                  className={cn(field.type === "textarea" && "md:col-span-2")}
                >
                  <FieldRenderer field={field} register={register} />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
