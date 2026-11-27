import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_PATH =
  "M440 142H814A338.5 338.5 0 0 1 814 819H632Q597 819 597 784V672H814A190.5 190.5 0 0 0 814 291H452Q415 291 415 254V167Q415 142 440 142ZM440 502H557Q597 502 597 542V672H452Q415 672 415 635V527Q415 502 440 502Z";

/** The DevPrep "D" mark on its own. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="415 142 738 677" aria-hidden="true" className={cn("h-[15px] w-[17px] shrink-0", className)} fill="currentColor">
      <path d={LOGO_PATH} />
    </svg>
  );
}

/** Mark in a small glossy tile, used in the app sidebar and the auth pages. */
export function LogoTile({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-[8px] bg-[linear-gradient(180deg,#fff,#d4d4d8)] text-[#09090b] shadow-[inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      <LogoMark className="h-[12px] w-[13.5px]" />
    </span>
  );
}

/** Mark plus wordmark, linking home. */
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} aria-label="DevPrep home" className={cn("inline-flex items-center gap-2 text-[16px] font-semibold tracking-[-0.04em] text-white", className)}>
      <LogoMark />
      DevPrep
    </Link>
  );
}
