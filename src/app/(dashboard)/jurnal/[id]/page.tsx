"use client";

import { JurnalDetailPage } from "@/components/pages/JurnalDetailPage";

export default function DetailJurnalPage({ params }: { params: { id: string } }) {
  return <JurnalDetailPage id={params.id} />;
}
