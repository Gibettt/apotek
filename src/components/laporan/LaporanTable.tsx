import type { ReportRow } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";

export function LaporanTable({
  rows,
  categoryHeader = "Kategori",
  valueHeader = "Nilai",
  formatValue = formatCurrency,
  statusHeader = "Status"
}: {
  rows: ReportRow[];
  categoryHeader?: string;
  valueHeader?: string;
  formatValue?: (value: number) => string;
  statusHeader?: string;
}) {
  const columns: Column<ReportRow>[] = [
    {
      key: "tanggal",
      header: "Tanggal",
      cell: (row) => formatDate(row.tanggal)
    },
    {
      key: "referensi",
      header: "Referensi",
      cell: (row) => row.referensi
    },
    {
      key: "kategori",
      header: categoryHeader,
      cell: (row) => row.kategori
    },
    {
      key: "nilai",
      header: valueHeader,
      cell: (row) => formatValue(row.nilai)
    },
    {
      key: "status",
      header: statusHeader,
      cell: (row) => <Badge variant="info">{row.status}</Badge>
    }
  ];

  return <Table columns={columns} data={rows} />;
}
