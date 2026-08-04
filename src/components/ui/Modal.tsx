"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

export function Modal({
  open,
  title,
  children,
  panelClassName,
  onClose
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  panelClassName?: string;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div
        className={cn(
          "w-full max-w-lg rounded-lg bg-white shadow-soft",
          panelClassName
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Tutup modal"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
