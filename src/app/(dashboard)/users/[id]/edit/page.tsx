import { UserForm } from "@/components/forms/UserForm";
import { moduleConfigs } from "@/constants/modules";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const rows = await moduleConfigs.users.load();
  const record = rows.find((item) => String(item.id) === params.id);

  return <UserForm record={record} />;
}
