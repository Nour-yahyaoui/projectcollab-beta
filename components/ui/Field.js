import { cn } from "@/lib/cn";

export function Field({ label, hint, action, htmlFor, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        {label && (
          <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-soft">
            {label}
          </label>
        )}
        {action}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-soft/80">{hint}</p>}
    </div>
  );
}

const fieldClasses =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 transition-colors duration-150 focus:border-accent focus:outline-none";

export function Input({ className, ...props }) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(fieldClasses, "resize-none", className)} {...props} />;
}
