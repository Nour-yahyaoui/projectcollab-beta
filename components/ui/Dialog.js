"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({ title, description, className, children, ...props }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-surface shadow-popover focus:outline-none data-[state=open]:animate-content-in data-[state=closed]:animate-content-out",
          className
        )}
        {...props}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-4 backdrop-blur">
          <div>
            <RadixDialog.Title className="font-display text-base font-semibold text-ink">
              {title}
            </RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="mt-0.5 text-sm text-ink-soft">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close asChild>
            <button
              aria-label="Close"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          </RadixDialog.Close>
        </div>
        <div className="px-6 py-5">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
