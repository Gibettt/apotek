import Link from "next/link";
import { Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { ModuleConfig, ModuleRecord } from "@/constants/modules";
import { statusLabel } from "@/constants/status";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime } from "@/utils/formatDate";

function formatValue(key: string, value: unknown) {
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "success" : "muted"}>{statusLabel(value)}</Badge>
    );
  }

  if (key.toLowerCase().includes("harga") || key.toLowerCase().includes("total")) {
    return formatCurrency(Number(value ?? 0));
  }

  if (key.toLowerCase().includes("tanggal")) {
    return String(value).includes("T")
      ? formatDateTime(String(value))
      : formatDate(String(value));
  }

  if (key.toLowerCase().includes("status") || key.toLowerCase().includes("tipe")) {
    return <Badge variant="info">{statusLabel(String(value))}</Badge>;
  }

  return String(value ?? "-");
}

export function ModuleDetailPage({
  config,
  record
}: {
  config: ModuleConfig;
  record?: ModuleRecord;
}) {
  if (!record) {
    return (
      <>
        <Header title="Data tidak ditemukan" description={config.description} />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              Data yang diminta tidak tersedia di dataset saat ini.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const title = String(
    (config.detailTitleKey ? record[config.detailTitleKey] : record.id) ?? config.title
  );

  return (
    <>
      <Header
        title={title}
        description={`Detail ${config.title.toLowerCase()}.`}
        action={
          config.allowEdit ? (
            <Link href={`${config.basePath}/${record.id}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          ) : null
        }
      />
      <Card>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            {Object.entries(record).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {key.replace(/([A-Z])/g, " $1")}
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-900">
                  {formatValue(key, value)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
