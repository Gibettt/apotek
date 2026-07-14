import { ModuleListPage } from "@/components/pages/ModuleListPage";
import { moduleConfigs } from "@/constants/modules";

export default function UsersPage() {
  return <ModuleListPage config={moduleConfigs.users} />;
}
