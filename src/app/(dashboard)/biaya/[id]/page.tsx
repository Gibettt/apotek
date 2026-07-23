"use client";

import { BiayaDetailPage } from "@/components/pages/BiayaDetailPage";

export default function DetailBiayaPage({ params }: { params: { id: string } }) {
  return <BiayaDetailPage id={params.id} />;
}
