"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

function segmentLabel(segment: string) {
  return decodeURIComponent(segment)
    .replaceAll("-", " ")
    .replaceAll("[id]", "detail")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-brand-700">
        <Home className="h-3.5 w-3.5" />
        Dashboard
      </Link>
      {segments
        .filter((segment) => segment !== "dashboard")
        .map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          return (
            <span key={`${segment}-${index}`} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={href} className="hover:text-brand-700">
                {segmentLabel(segment)}
              </Link>
            </span>
          );
        })}
    </nav>
  );
}
