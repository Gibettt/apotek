"use client";

import Link from "next/link";
import { Eye, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export function ModuleListPage({ config }: { config: ModuleConfig }) {
  const [search, setSearch] = useState("");
  const [rowsData, setRowsData] = useState<ModuleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      cell: (row: ModuleRecord) => formatCell(row[column.key], column)
    })),
    {
      key: "actions",
      header: "",
      className: "w-28 text-right",
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
