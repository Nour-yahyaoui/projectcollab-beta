"use client";

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({ className, children, align = "end", ...props }) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={8}
        className={cn(
          "z-50 min-w-[200px] rounded-xl border border-border bg-surface p-1.5 shadow-popover animate-menu-in focus:outline-none",
          className
        )}
        {...props}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({ className, danger, children, ...props }) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors",
        "data-[highlighted]:bg-canvas",
        danger && "text-danger data-[highlighted]:bg-danger-light",
        className
      )}
      {...props}
    >
      {children}
    </RadixDropdown.Item>
  );
}

export function DropdownMenuSeparator({ className }) {
  return <RadixDropdown.Separator className={cn("my-1.5 h-px bg-border", className)} />;
}

export function DropdownMenuLabel({ className, children }) {
  return (
    <div className={cn("px-3 py-2 text-xs font-medium text-ink-soft/70", className)}>{children}</div>
  );
}
