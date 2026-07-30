"use client";

import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table } from "@/components/ui/Table";
import { Header } from "@/components/layout/Header";
import type { ColumnConfig, ModuleConfig, ModuleRecord } from "@/constants/modules";
import { statusLabel } from "@/constants/status";
import { usePagination } from "@/hooks/usePagination";
import { auditLogService } from "@/services/auditLogService";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime } from "@/utils/formatDate";

function formatCell(value: unknown, column: ColumnConfig) {
  if (column.type === "currency") {
    return (
      <span className="font-black text-[#20201d]">
        {formatCurrency(Number(value ?? 0))}
      </span>
    );
  }

  if (column.type === "date" && value) {
    return (
      <span className="font-bold text-stone-600">
        {formatDate(String(value))}
      </span>
    );
  }

  if (column.type === "datetime" && value) {
    return (
      <span className="font-bold text-stone-600">
        {formatDateTime(String(value))}
      </span>
    );
  }

  if (column.type === "boolean") {
    return (
      <Badge variant={value ? "success" : "muted"}>
        {statusLabel(Boolean(value))}
      </Badge>
    );
  }

  if (column.type === "status") {
    return <Badge variant="info">{statusLabel(String(value))}</Badge>;
  }

  if (column.key.toLowerCase().includes("kode")) {
    return (
      <span className="inline-flex max-w-[160px] items-center rounded-md bg-[#f8f7f3] px-2.5 py-1 font-black text-stone-700">
        <span className="truncate">{String(value ?? "-")}</span>
      </span>
    );
  }

  if (column.key.toLowerCase().includes("deskripsi")) {
    return (
      <span className="block max-w-[560px] leading-6 text-stone-600">
        {String(value ?? "-")}
      </span>
    );
  }

  if (column.key.toLowerCase().includes("nama")) {
    return <span className="font-black text-[#20201d]">{String(value ?? "-")}</span>;
  }

  return <span className="font-semibold text-stone-600">{String(value ?? "-")}</span>;
}

function BooleanCell({
  checked,
  disabled,
  onChange
}: {
  checked: boolean;
  disabled: boolean;
  onChange?: (nextValue: boolean) => void;
}) {
  if (!onChange) {
    return <Badge variant={checked ? "success" : "muted"}>{statusLabel(checked)}</Badge>;
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <Badge variant={checked ? "success" : "muted"}>{statusLabel(checked)}</Badge>
    </label>
  );
}

export function ModuleListPage({ config }: { config: ModuleConfig }) {
  const [search, setSearch] = useState("");
  const [rowsData, setRowsData] = useState<ModuleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    config
      .load()
      .then((loaded) => {
        if (active) {
          setRowsData(loaded);
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
  }, [config]);

  async function handleDelete(row: ModuleRecord) {
    if (!config.remove) {
      return;
    }

    const id = String(row.id);
    const label = config.detailTitleKey ? String(row[config.detailTitleKey] ?? "") : "";

    if (
      !window.confirm(
        `Hapus ${config.title.toLowerCase()}${label ? ` "${label}"` : ""}? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    setDeletingId(id);

    try {
      await config.remove(id);
      await auditLogService.record({
        aksi: "DELETE",
        namaTabel: config.key,
        recordId: id,
        deskripsi: `Hapus ${config.title}${label ? `: ${label}` : ""}`
      });
      setRowsData((current) => current.filter((item) => String(item.id) !== id));
      toast.success(`${config.title} berhasil dihapus`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Gagal menghapus ${config.title.toLowerCase()}`
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBooleanToggle(row: ModuleRecord, key: string, nextValue: boolean) {
    if (!config.update) {
      return;
    }

    const id = String(row.id);
    setTogglingId(id);

    try {
      const updated = await config.update(id, { ...row, [key]: nextValue }, row);
      await auditLogService.record({
        aksi: "UPDATE",
        namaTabel: config.key,
        recordId: id,
        deskripsi: `Update ${config.title}`
      });
      setRowsData((current) =>
        current.map((item) =>
          String(item.id) === id ? { ...item, ...(updated ?? row), [key]: nextValue } : item
        )
      );
      toast.success(`${config.title} berhasil diperbarui`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Gagal memperbarui ${config.title.toLowerCase()}`
      );
    } finally {
      setTogglingId(null);
    }
  }

  const filteredRows = useMemo(() => {
    const normalized = search.toLowerCase();
    if (!normalized) {
      return rowsData;
    }

    return rowsData.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalized)
      )
    );
  }, [rowsData, search]);
  const pagination = usePagination(filteredRows.length, 8);
  const rows = filteredRows.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage
  );

  const columns: Column<ModuleRecord>[] = [
    ...config.columns.map((column) => ({
      key: column.key,
      header: column.header,
      cell: (row: ModuleRecord) =>
        column.type === "boolean" && config.toggleBooleanKey === column.key ? (
          <BooleanCell
            checked={Boolean(row[column.key])}
            disabled={togglingId === String(row.id)}
            onChange={(nextValue) => handleBooleanToggle(row, column.key, nextValue)}
          />
        ) : (
          formatCell(row[column.key], column)
        )
    })),
    {
      key: "actions",
      header: "",
      className: "w-32 text-right",
      cell: (row: ModuleRecord) => (
        <div className="flex justify-end gap-1">
          {config.allowDetail ? (
            <Link href={`${config.basePath}/${row.id}`} aria-label="Detail">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Detail"
                className="h-9 w-9 rounded-lg text-stone-500 hover:bg-emerald-50 hover:text-[#0f766e]"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
          {config.allowEdit ? (
            <Link href={`${config.basePath}/${row.id}/edit`} aria-label="Edit">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Edit"
                className="h-9 w-9 rounded-lg text-stone-500 hover:bg-emerald-50 hover:text-[#0f766e]"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
          {config.allowDelete && config.remove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Hapus"
              disabled={deletingId === String(row.id)}
              onClick={() => handleDelete(row)}
              title="Hapus"
              className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <>
      <Header
        title={config.title}
        description={config.description}
        action={
          config.addPath ? (
            <Link href={config.addPath}>
              <Button className="rounded-lg bg-[#0f766e] px-5 font-black hover:bg-[#115e59]">
                <Plus className="h-4 w-4" />
                Tambah
              </Button>
            </Link>
          ) : null
        }
      />

      <Card className="rounded-lg">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[260px] flex-1">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  pagination.setPage(1);
                }}
                placeholder={`Cari ${config.title.toLowerCase()}...`}
              />
            </div>
            <div className="rounded-lg bg-[#f8f7f3] px-3 py-2 text-sm font-black text-[#0f766e]">
              {filteredRows.length} data
            </div>
          </div>
          <Table
            columns={columns}
            data={rows}
            emptyText={isLoading ? "Memuat data..." : undefined}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </CardContent>
      </Card>
    </>
  );
}
