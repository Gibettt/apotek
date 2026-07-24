import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-brand-700 text-white hover:bg-brand-900",
        secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        ghost: "text-slate-700 hover:bg-slate-100",
        danger: "bg-red-600 text-white hover:bg-red-700"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10 px-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
);

Button.displayName = "Button";
