import { ClipboardCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { obat } from "@/lib/mock-data";

interface Row {
  nama: string;
  stokSistem: number;
  stokFisik: string;
  selisih: string;
}

const rows: Row[] = obat.map((item) => ({
  nama: item.nama,
  stokSistem: item.stokTersedia,
  stokFisik: "",
  selisih: "-"
}));

export default function StokOpnamePage() {
  const columns: Column<Row>[] = [
    { key: "nama", header: "Obat", cell: (row) => row.nama },
    { key: "stokSistem", header: "Stok Sistem", cell: (row) => row.stokSistem },
    { key: "stokFisik", header: "Stok Fisik", cell: () => "Input saat proses opname" },
    { key: "selisih", header: "Selisih", cell: (row) => row.selisih }
  ];

  return (
    <>
      <Header
        title="Stok Opname"
        description="Cocokkan stok sistem dengan jumlah fisik di rak."
        action={
          <Button>
            <ClipboardCheck className="h-4 w-4" />
            Konfirmasi Opname
          </Button>
        }
      />
      <Card>
        <CardContent>
          <Table columns={columns} data={rows} />
        </CardContent>
      </Card>
    </>
  );
}
