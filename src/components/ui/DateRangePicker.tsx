"use client";

import { Input } from "./Input";

export function DateRangePicker({
  start,
  end,
  onChange
}: {
  start: string;
  end: string;
  onChange: (value: { start: string; end: string }) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        label="Dari"
        type="date"
        value={start}
        onChange={(event) => onChange({ start: event.target.value, end })}
      />
      <Input
        label="Sampai"
        type="date"
        value={end}
        onChange={(event) => onChange({ start, end: event.target.value })}
      />
    </div>
  );
}
