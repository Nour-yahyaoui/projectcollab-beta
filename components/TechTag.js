import { cn } from "@/lib/cn";

export default function TechTag({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-canvas px-2.5 py-0.5 font-mono text-[11px] text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}
