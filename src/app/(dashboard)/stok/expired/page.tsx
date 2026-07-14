import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs, type ModuleConfig } from "@/constants/modules";

const limit = new Date("2026-09-07");
const config: ModuleConfig = {
  ...moduleConfigs.stok,
  key: "stok-expired",
  title: "Obat Mendekati Expired",
  description: "Batch obat yang mendekati atau melewati batas expired.",
  rows: moduleConfigs.stok.rows.filter(
    (item) => new Date(String(item.tanggalExpired)) <= limit
  )
};

export default function StokExpiredPage() {
  return <ModuleListPage config={config} />;
}
