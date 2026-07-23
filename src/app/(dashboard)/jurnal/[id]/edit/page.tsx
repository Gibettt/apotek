"use client";

import { JurnalForm } from "@/components/forms/JurnalForm";

export default function EditJurnalPage({ params }: { params: { id: string } }) {
  return <JurnalForm jurnalId={params.id} />;
}
