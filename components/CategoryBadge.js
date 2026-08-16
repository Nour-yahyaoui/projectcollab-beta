import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/cn";

export default function CategoryBadge({ category, className }) {
  const cfg = getCategory(category);
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-xs font-medium",
        cfg.bg,
        cfg.text,
        className
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      {cfg.label}
    </span>
  );
}
