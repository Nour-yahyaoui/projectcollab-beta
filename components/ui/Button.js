import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-dark disabled:hover:bg-accent",
  secondary:
    "bg-surface text-ink border border-border hover:border-border-strong hover:bg-canvas disabled:hover:bg-surface",
  ghost: "bg-transparent text-ink-soft hover:bg-canvas hover:text-ink",
  danger: "bg-transparent text-danger hover:bg-danger-light",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <Component
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Component>
  );
}
