import { cn } from "@/lib/cn";

export default function IconButton({ className, active, label, children, ...props }) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-150",
        "hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        active && "text-accent hover:text-accent",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
