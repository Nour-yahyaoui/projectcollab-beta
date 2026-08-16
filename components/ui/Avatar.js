import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/cn";

const SIZES = { xs: 20, sm: 24, md: 32, lg: 44, xl: 64 };

export default function Avatar({ src, alt, size = "md", className }) {
  const px = SIZES[size] ?? size;

  if (!src) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-dark",
          className
        )}
        style={{ width: px, height: px }}
      >
        <User className="h-[55%] w-[55%]" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "User avatar"}
      width={px}
      height={px}
      className={cn("shrink-0 rounded-full ring-1 ring-black/5", className)}
      style={{ width: px, height: px }}
    />
  );
}
