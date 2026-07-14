import { UserForm } from "@/components/forms/UserForm";
import { moduleConfigs } from "@/constants/modules";

export default function EditUserPage({ params }: { params: { id: string } }) {
  const record = moduleConfigs.users.rows.find((item) => String(item.id) === params.id);

  return <UserForm record={record} />;
}
