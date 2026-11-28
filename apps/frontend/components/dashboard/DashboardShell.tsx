"use client";

/**
 * Frame for every signed-in page: the sidebar on the dark canvas, and the page itself in
 * an inset panel with a sticky top bar (breadcrumb, ⌘K search, start button). The live
 * interview room is full screen, so it gets no frame at all.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Mic, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAccount } from "@/hooks/useAccount";
import { getInsights, type Insights } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./AppSidebar";
import { CommandMenu } from "./CommandMenu";
import { activeItem } from "./nav";

const COLLAPSE_KEY = "devprep-sidebar-collapsed";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { account, signOut } = useAccount();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  // per-viewer preferences, read after mount so the server render matches
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  }, []);

  // sidebar extras (recent roles, streak); the overview shares this request through the cache
  useEffect(() => {
    if (!account?.signedIn) return;
    let alive = true;
    getInsights()
      .then((i) => alive && setInsights(i))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [account?.signedIn, pathname]);

  // The root layout paints the body white for the landing page; inside the app it should
  // stay dark even when the page overscrolls.
  useEffect(() => {
    const body = document.body;
    const previous = body.style.backgroundColor;
    body.style.backgroundColor = "#050506";
    return () => {
      body.style.backgroundColor = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (pathname.endsWith("/session")) return <>{children}</>;

  const current = activeItem(pathname);
  const sidebarProps = { account, insights, onSignOut: signOut };

  return (
    <TooltipProvider delayDuration={150}>
      <div data-theme="dark" data-app className="min-h-dvh bg-[#050506] font-sans text-foreground lg:flex">
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block",
            collapsed ? "w-[68px]" : "w-[252px]",
          )}
        >
          <AppSidebar {...sidebarProps} collapsed={collapsed} onToggle={toggleCollapsed} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" showCloseButton={false} className="w-[280px] border-white/[0.06] bg-[#08080a] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AppSidebar {...sidebarProps} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1 lg:py-2 lg:pr-2">
          <div className="relative min-h-dvh bg-background lg:min-h-[calc(100dvh-16px)] lg:rounded-2xl lg:border lg:border-white/[0.06] lg:shadow-[0_0_0_1px_rgba(0,0,0,0.6),0_30px_80px_-40px_rgba(0,0,0,0.9)]">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-background/75 px-3 backdrop-blur-xl sm:px-5 lg:rounded-t-2xl">
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
                <Menu />
              </Button>

              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
                <Link href="/dashboard" className="hidden text-white/40 transition-colors hover:text-white sm:inline">
                  DevPrep
                </Link>
                <span aria-hidden className="hidden text-white/20 sm:inline">
                  /
                </span>
                <span className="flex min-w-0 items-center gap-1.5 font-medium text-white">
                  {current ? <current.icon className="size-3.5 text-white/50" /> : null}
                  <span className="truncate">{current?.label ?? "DevPrep"}</span>
                </span>
              </nav>

              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="mx-auto hidden h-8 w-full max-w-[360px] cursor-pointer items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 text-[13px] text-white/40 transition-colors hover:border-white/[0.12] hover:text-white/60 md:flex"
              >
                <Search className="size-3.5" />
                Search pages, roles, problems…
                <span className="ml-auto flex gap-1">
                  <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </button>

              <div className="ml-auto flex items-center gap-2 md:ml-0">
                <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Search" onClick={() => setCommandOpen(true)}>
                  <Search />
                </Button>
                <Button asChild size="sm" className="h-8 rounded-lg px-3 text-[13px] font-semibold">
                  <Link href="/dashboard/ai-interview">
                    <Mic /> <span className="hidden sm:inline">Start interview</span>
                  </Link>
                </Button>
              </div>
            </header>

            {children}
          </div>
        </div>

        <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} onSignOut={account?.signedIn ? signOut : undefined} />
      </div>
    </TooltipProvider>
  );
}
