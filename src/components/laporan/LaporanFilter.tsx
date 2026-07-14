"use client";

import { useState } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

export function LaporanFilter() {
  const [range, setRange] = useState({
    start: "2026-07-01",
    end: "2026-07-07"
  });

  return <DateRangePicker start={range.start} end={range.end} onChange={setRange} />;
}
