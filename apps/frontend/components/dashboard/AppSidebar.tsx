"use client";

/**
 * Left sidebar of the signed-in app: workspace header, the "New interview" button, the
 * section nav, recent roles, the streak card and the account menu. Collapses to an icon
 * rail on desktop; the same content fills the mobile sheet.
 */

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ChevronsUpDown, CircleHelp, Flame, LogIn, LogOut, PanelLeft, Plus } from "lucide-react";
import { LogoTile } from "@/components/brand/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Account } from "@/hooks/useAccount";
import type { Insights } from "@/lib/insights";
import { roleTitle } from "@/lib/interview/report";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, activeItem, roleColor, type NavItem } from "./nav";

function Tip({ show, label, children }: { show: boolean; label: string; children: ReactElement }) {
  if (!show) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <Tip show={collapsed} label={item.label}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium tracking-[-0.01em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
          collapsed && "justify-center px-0",
          active ? "text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white",
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="absolute inset-0 -z-10 rounded-lg bg-white/[0.07] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
          />
        )}
        <item.icon className={cn("size-4 shrink-0", active ? "text-white" : "text-white/45 group-hover:text-white/80")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    </Tip>
  );
}

export function AppSidebar({
  collapsed = false,
  onToggle,
  onNavigate,
  account,
  insights,
  onSignOut,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  account: Account | null;
  insights: Insights | null;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const active = activeItem(pathname);
  const recent = insights?.readiness.slice(0, 4) ?? [];
  const streak = insights?.stats.currentStreak ?? 0;

  return (
    <div className="flex h-full flex-col gap-4 px-3 py-3">
      {/* workspace header */}
      <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between pl-1")}>
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5" aria-label="DevPrep overview">
          <LogoTile />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold leading-tight tracking-[-0.02em] text-white">DevPrep</span>
              <span className="block text-[11.5px] leading-tight text-white/40">Early access</span>
            </span>
          )}
        </Link>
        {onToggle && (
          <Tip show={collapsed} label="Expand sidebar">
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="grid size-7 cursor-pointer place-items-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <PanelLeft className="size-4" />
            </button>
          </Tip>
        )}
      </div>

      <Tip show={collapsed} label="New interview">
        <Link
          href="/dashboard/ai-interview"
          onClick={onNavigate}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[13.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-white/[0.14] hover:bg-white/[0.06]",
            collapsed ? "justify-center" : "px-3",
          )}
        >
          <Plus className="size-4 text-white/70" />
          {!collapsed && "New interview"}
        </Link>
      </Tip>

      <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && <div className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">{group.label}</div>}
            <div className="grid gap-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={active?.href === item.href} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}

        {!collapsed && recent.length > 0 && (
          <div>
            <div className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">Recent roles</div>
            <div className="grid gap-0.5">
              {recent.map((r) => (
                <Link
                  key={r.role}
                  href={`/dashboard/ai-interview/${r.role}`}
                  onClick={onNavigate}
                  className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  <span className="size-2 shrink-0 rounded-[3px]" style={{ background: roleColor(r.role) }} />
                  <span className="truncate">{roleTitle(r.role)}</span>
                  <span className="ml-auto text-[11.5px] tabular-nums text-white/35">{r.score}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="grid gap-2">
        {!collapsed && account?.signedIn && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-white">
              <Flame className={cn("size-3.5", streak > 0 ? "text-[#fbbf24]" : "text-white/40")} />
              {streak > 0 ? `${streak}-day streak` : "Start a streak"}
            </div>
            <p className="m-0 mt-1 text-[11.5px] leading-[1.45] text-white/40">
              {streak > 0 ? "Practise today to keep it going." : "One interview or coding problem a day builds it."}
            </p>
            <div className="mt-2.5 flex gap-[3px]">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className={cn("h-1 flex-1 rounded-full", i < Math.min(streak, 7) ? "bg-[#fbbf24]" : "bg-white/[0.08]")} />
              ))}
            </div>
          </div>
        )}

        <Tip show={collapsed} label="How it works">
          <Link
            href="/dashboard/ai-interview/how-it-works"
            onClick={onNavigate}
            className={cn("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white", collapsed && "justify-center px-0")}
          >
            <CircleHelp className="size-4 shrink-0" />
            {!collapsed && "How it works"}
          </Link>
        </Tip>

        {account?.signedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-left outline-none transition-colors hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-ring/60 data-[state=open]:bg-white/[0.05]",
                  collapsed && "justify-center",
                )}
                aria-label="Account menu"
              >
                <Avatar className="size-7 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-[linear-gradient(135deg,#4d7cff,#a78bfa)] text-[11px] font-semibold text-white">{account.initials}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-white">{account.name || "Your account"}</span>
                      <span className="flex items-center gap-1.5 text-[11.5px] text-white/40">
                        <span className="size-1.5 rounded-full bg-[#34d399]" /> Signed in
                      </span>
                    </span>
                    <ChevronsUpDown className="size-3.5 text-white/35" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-[220px] border-white/10">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate text-sm font-medium">{account.name || "Your account"}</span>
                <span className="block text-xs text-muted-foreground">Free · Early access</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/ai-interview/how-it-works" onClick={onNavigate}>
                  <CircleHelp /> How it works
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : account ? (
          <Link
            href={`/auth/signin?next=${encodeURIComponent(pathname)}`}
            className={cn("flex h-9 items-center justify-center gap-2 rounded-lg bg-white text-[13px] font-semibold text-black", collapsed && "px-0")}
          >
            <LogIn className="size-4" />
            {!collapsed && "Sign in"}
          </Link>
        ) : (
          <div className="h-10" />
        )}
      </div>
    </div>
  );
}
