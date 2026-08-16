import { cn } from "@/lib/cn";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border-strong bg-surface/60 px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-canvas text-ink-soft">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
      )}
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
