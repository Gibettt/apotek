import type { ReactNode } from "react";
import { Breadcrumb } from "./Breadcrumb";
import { PageTitle } from "./PageTitle";

export function Header({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="space-y-4">
      <Breadcrumb />
      <PageTitle title={title} description={description} action={action} />
    </header>
  );
}
