import type { ReportRow } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";

export function LaporanTable({ rows }: { rows: ReportRow[] }) {
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
      header: "Kategori",
      cell: (row) => row.kategori
    },
    {
      key: "nilai",
      header: "Nilai",
      cell: (row) => formatCurrency(row.nilai)
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant="info">{row.status}</Badge>
    }
  ];

  return <Table columns={columns} data={rows} />;
}
