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
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime } from "@/utils/formatDate";

function formatCell(value: unknown, column: ColumnConfig) {
  if (column.type === "currency") {
    return formatCurrency(Number(value ?? 0));
  }

  if (column.type === "date" && value) {
    return formatDate(String(value));
  }

  if (column.type === "datetime" && value) {
    return formatDateTime(String(value));
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

  return String(value ?? "-");
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
      className: "w-36 text-right",
      cell: (row: ModuleRecord) => (
        <div className="flex justify-end gap-1">
          {config.allowDetail ? (
            <Link href={`${config.basePath}/${row.id}`} aria-label="Detail">
              <Button type="button" variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
          {config.allowEdit ? (
            <Link href={`${config.basePath}/${row.id}/edit`} aria-label="Edit">
              <Button type="button" variant="ghost" size="icon">
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
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
              <Button>
                <Plus className="h-4 w-4" />
                Tambah
              </Button>
            </Link>
          ) : null
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              pagination.setPage(1);
            }}
            placeholder={`Cari ${config.title.toLowerCase()}...`}
          />
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
