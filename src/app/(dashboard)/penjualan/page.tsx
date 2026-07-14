import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function PenjualanPage() {
  return (
    <ModuleListPage
      config={{
        ...moduleConfigs.penjualan,
        addPath: undefined
      }}
    />
  );
}
