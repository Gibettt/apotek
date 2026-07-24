import * as React from "react";
import { cn } from "@/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        {label ? <span>{label}</span> : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100",
            error && "border-red-400 focus:border-red-500 focus:ring-red-100",
            className
          )}
          {...props}
        />
        {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
      </label>
    );
  }
);

Input.displayName = "Input";
