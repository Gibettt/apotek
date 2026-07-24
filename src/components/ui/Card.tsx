import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border-none bg-white shadow-[0_20px_60px_rgba(31,41,35,0.06)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  action,
  children
}: {
  title?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        {title ? <h2 className="text-base font-semibold text-slate-950">{title}</h2> : null}
        {children}
      </div>
      {action}
    </div>
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
