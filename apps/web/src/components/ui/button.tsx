import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-signal px-4 py-2.5 text-ink hover:bg-emerald-200",
        secondary:
          "border border-line bg-white/5 px-4 py-2.5 text-white hover:bg-white/10",
        ghost: "px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white",
        danger:
          "px-3 py-2 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}
