"use client";

import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { FieldConfig, ModuleConfig, ModuleRecord } from "@/constants/modules";
import { auditLogService } from "@/services/auditLogService";
import { generateAutoKode } from "@/utils/autoKode";
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
      <label className="grid gap-2 text-sm font-bold text-stone-700 md:col-span-2">
        <span>{field.label}</span>
        <textarea
          rows={5}
          className="min-h-[132px] rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
          placeholder={field.placeholder}
          {...register(field.name)}
        />
      </label>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-stone-200 bg-[#f8f7f3] px-4 text-sm font-bold text-stone-700 transition hover:border-[#0f766e]/40 hover:bg-emerald-50">
        <input
          type="checkbox"
          className="peer h-4 w-4 rounded border-stone-300 text-[#0f766e] focus:ring-[#0f766e]"
          {...register(field.name)}
        />
        <span className="peer-checked:text-[#0f766e]">{field.label}</span>
      </label>
    );
  }

  return (
    <Input
      label={field.label}
      type={field.type}
      placeholder={field.placeholder}
      readOnly={field.readOnly}
      className={cn(
        "h-11 rounded-lg border-stone-200 px-4 font-semibold focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10",
        field.readOnly && "cursor-default bg-stone-50 text-stone-500"
      )}
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
  const visibleFields = useMemo(
    () => config.fields.filter((field) => !(mode === "create" && field.hiddenOnCreate)),
    [config.fields, mode]
  );
  const values = useMemo(() => defaultValues(visibleFields, record), [visibleFields, record]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting }
  } = useForm({ values });
  const watchedValues = watch();

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    visibleFields.forEach((field) => {
      if (!field.autoFillFrom) {
        return;
      }

      const sourceValue = String(watchedValues[field.autoFillFrom] ?? "");
      const nextValue = generateAutoKode(sourceValue, {
        prefix: field.autoFillPrefix ?? "KAT"
      });
      if (String(watchedValues[field.name] ?? "") !== nextValue) {
        setValue(field.name, nextValue);
      }
    });
  }, [mode, setValue, visibleFields, watchedValues]);

  async function onSubmit(values: Record<string, string | number | boolean>) {
    try {
      let result: ModuleRecord | null | void = undefined;

      if (mode === "edit" && record?.id && config.update) {
        result = await config.update(String(record.id), values, record);
      } else if (mode !== "edit" && config.create) {
        result = await config.create(values);
      }

      const changedRecord = (result && typeof result === "object" ? result : record) as
        | ModuleRecord
        | undefined;
      await auditLogService.record({
        aksi: mode === "edit" ? "UPDATE" : "INSERT",
        namaTabel: config.key,
        recordId: changedRecord?.id ? String(changedRecord.id) : undefined,
        deskripsi: `${mode === "edit" ? "Update" : "Tambah"} ${config.title}`
      });

      toast.success(
        mode === "edit"
          ? `${config.title} berhasil diperbarui`
          : `${config.title} berhasil disimpan`
      );
      router.push(config.basePath);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Gagal menyimpan ${config.title.toLowerCase()}`
      );
    }
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
      <Card className="overflow-hidden rounded-lg">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="border-b border-stone-100 bg-[#f8f7f3] px-5 py-4">
              <h2 className="text-base font-black text-[#20201d]">
                Data {config.title}
              </h2>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                {mode === "edit" ? "Perbarui informasi utama." : "Masukkan informasi utama."}
              </p>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              {visibleFields.map((field) => (
                <div
                  key={field.name}
                  className={cn(field.type === "textarea" && "md:col-span-2")}
                >
                  <FieldRenderer field={field} register={register} />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 bg-white px-5 py-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(config.basePath)}
                className="rounded-lg font-black"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="rounded-lg bg-[#0f766e] px-5 font-black hover:bg-[#115e59]"
              >
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
