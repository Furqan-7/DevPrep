import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Content frame for the signed-in app pages (the nav comes from app/dashboard/layout.tsx),
 * with an optional page header: title, one line of description, actions on the right.
 */
export function AppPage({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main data-theme="dark" className={cn("mx-auto max-w-[1200px] px-4 pb-24 pt-10 text-foreground sm:px-6", className)}>
      {title ? (
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="m-0 text-[28px] font-medium leading-[1.1] tracking-[-0.04em]">{title}</h1>
            {description ? <p className="m-0 mt-2 max-w-[620px] text-[14.5px] leading-[1.5] text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </main>
  );
}

/** Bordered surface used for every panel in the app. */
export const panel = "rounded-xl border border-white/[0.08] bg-[#0f0f11]";

/** Heading row at the top of a panel, with optional text on the right. */
export function PanelTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
      <h2 className="m-0 text-[14px] font-medium tracking-[-0.01em]">{children}</h2>
      {aside ? <div className="text-[12.5px] text-muted-foreground">{aside}</div> : null}
    </div>
  );
}

/** Centred message for empty and signed-out states inside a panel or page. */
export function EmptyState({ title, body, children, className }: { title: ReactNode; body?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      <p className="m-0 text-[16px] font-medium tracking-[-0.02em]">{title}</p>
      {body ? <p className="m-0 mx-auto mt-2 max-w-[420px] text-[13.5px] leading-[1.55] text-muted-foreground">{body}</p> : null}
      {children ? <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}
