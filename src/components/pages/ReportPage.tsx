import { Header } from "@/components/layout/Header";
import { ExportButton } from "@/components/laporan/ExportButton";
import { LaporanFilter } from "@/components/laporan/LaporanFilter";
import { LaporanTable } from "@/components/laporan/LaporanTable";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { ReportRow } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";

export function ReportPage({
  title,
  description,
  rows
}: {
  title: string;
  description: string;
  rows: ReportRow[];
}) {
  const total = rows.reduce((sum, row) => sum + row.nilai, 0);

  return (
    <>
      <Header
        title={title}
        description={description}
        action={<ExportButton title={title} rows={rows} />}
      />
      <Card>
        <CardHeader title="Filter Laporan">
          <p className="mt-1 text-sm text-slate-500">
            Periode default mengikuti minggu berjalan.
          </p>
        </CardHeader>
        <CardContent>
          <LaporanFilter />
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Ringkasan">
          <p className="mt-1 text-sm text-slate-500">
            Total nilai:{" "}
            <span className="font-semibold text-slate-950">
              {formatCurrency(total)}
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <LaporanTable rows={rows} />
        </CardContent>
      </Card>
    </>
  );
}
