"use client";

import { ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { obatService } from "@/services/obatService";
import { stokService } from "@/services/stokService";

interface Row {
  id: string;
  nama: string;
  stokSistem: number;
  stokFisik: string;
}

export default function StokOpnamePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadRows() {
    setLoading(true);
    const result = await obatService.list({ perPage: 9999 });
    setRows(result.data.map((item) => ({ id: item.id, nama: item.nama, stokSistem: item.stokTersedia, stokFisik: "" })));
    setLoading(false);
  }

  useEffect(() => {
    void loadRows();
  }, []);

  function updateStokFisik(id: string, value: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, stokFisik: value } : row)));
  }

  const changedRows = rows.filter((row) => row.stokFisik.trim() !== "" && Number(row.stokFisik) !== row.stokSistem);

  async function handleConfirm() {
    if (!changedRows.length) {
      toast.error("Belum ada perubahan stok fisik untuk disimpan");
      return;
    }

    setSubmitting(true);

    try {
      for (const row of changedRows) {
        await stokService.opname({ barangId: row.id, stokFisik: Number(row.stokFisik) });
      }

      toast.success(`Opname tersimpan untuk ${changedRows.length} obat`);
      await loadRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan opname");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<Row>[] = [
    { key: "nama", header: "Obat", cell: (row) => row.nama },
    { key: "stokSistem", header: "Stok Sistem", cell: (row) => row.stokSistem },
    {
      key: "stokFisik",
      header: "Stok Fisik",
      cell: (row) => (
        <input
          aria-label={`Stok fisik ${row.nama}`}
          type="number"
          min={0}
          placeholder={String(row.stokSistem)}
          value={row.stokFisik}
          onChange={(event) => updateStokFisik(row.id, event.target.value)}
          className="h-9 w-24 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      )
    },
    {
      key: "selisih",
      header: "Selisih",
      cell: (row) => {
        if (row.stokFisik.trim() === "") {
          return "-";
        }

        const selisih = Number(row.stokFisik) - row.stokSistem;
        return selisih === 0 ? "0" : selisih > 0 ? `+${selisih}` : String(selisih);
      }
    }
  ];

  return (
    <>
      <Header
        title="Stok Opname"
        description="Cocokkan stok sistem dengan jumlah fisik di rak."
        action={
          <Button onClick={handleConfirm} isLoading={submitting} disabled={loading || !changedRows.length}>
            <ClipboardCheck className="h-4 w-4" />
            Konfirmasi Opname{changedRows.length ? ` (${changedRows.length})` : ""}
          </Button>
        }
      />
      <Card>
        <CardContent>
          <Table columns={columns} data={rows} emptyText={loading ? "Memuat data obat..." : "Belum ada obat"} />
        </CardContent>
      </Card>
    </>
  );
}
