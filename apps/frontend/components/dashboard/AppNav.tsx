"use client";

/**
 * Dark top bar for the signed-in app. The account menu has the user's name, How it works
 * and Sign out. Below the large breakpoint the links move into the menu.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CircleHelp, LogIn, LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOGO_PATH =
  "M440 142H814A338.5 338.5 0 0 1 814 819H632Q597 819 597 784V672H814A190.5 190.5 0 0 0 814 291H452Q415 291 415 254V167Q415 142 440 142ZM440 502H557Q597 502 597 542V672H452Q415 672 415 635V527Q415 502 440 502Z";

const LINKS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Interviews", href: "/dashboard/ai-interview" },
  { label: "Reports", href: "/dashboard/ai-interview/feedback" },
  { label: "Coding", href: "/dashboard/coding" },
  { label: "DSA", href: "/dashboard/dsa" },
  { label: "Jobs", href: "/dashboard/jobs" },
  { label: "Applications", href: "/dashboard/applications" },
  { label: "Resume", href: "/dashboard/resume" },
];

/** The nav link for a path: the longest matching prefix; reports count as Reports. */
function activeHref(pathname: string): string | null {
  if (pathname.startsWith("/dashboard/ai-interview/report")) return "/dashboard/ai-interview/feedback";
  const match = LINKS.filter((l) => pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(`${l.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? null;
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ signedIn: boolean; name: string } | null>(null);
  const active = activeHref(pathname);

  // read after mount so server and client render the same HTML
  useEffect(() => {
    setUser({ signedIn: !!localStorage.getItem("token"), name: localStorage.getItem("username") ?? "" });
  }, []);

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/");
  };

  const initials =
    (user?.name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "·";

  const signInHref = `/auth/signin?next=${encodeURIComponent(pathname)}`;

  return (
    <header data-theme="dark" className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/75 text-foreground backdrop-blur-[14px]">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-[9px] text-[15.5px] font-semibold tracking-[-0.04em] text-[#f0f0f0]" aria-label="DevPrep overview">
          <svg viewBox="415 142 738 677" aria-hidden="true" className="h-[15px] w-[17px]" fill="currentColor">
            <path d={LOGO_PATH} />
          </svg>
          DevPrep
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active === l.href ? "page" : undefined}
              className={`relative isolate rounded-md px-2.5 py-1.5 text-[13.5px] tracking-[-0.01em] transition-colors ${active === l.href ? "text-[#f0f0f0]" : "text-white/50 hover:bg-white/[0.04] hover:text-[#f0f0f0]"}`}
            >
              {active === l.href && <motion.span layoutId="app-nav-active" className="absolute inset-0 -z-10 rounded-md bg-white/[0.07]" />}
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && !user.signedIn ? (
            <Button asChild variant="outline" size="sm" className="hidden border-white/14 bg-transparent lg:inline-flex">
              <Link href={signInHref}>Sign in</Link>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {user?.signedIn ? (
                <button
                  type="button"
                  aria-label="Account menu"
                  className="cursor-pointer rounded-full outline-none ring-offset-2 ring-offset-[#0a0a0a] transition-shadow hover:ring-1 hover:ring-white/25 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-1 data-[state=open]:ring-white/30"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-[#232326] text-[12px] font-medium text-white/90">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <Button variant="ghost" size="icon" aria-label="Menu" className={`rounded-full ${user && !user.signedIn ? "lg:hidden" : ""}`}>
                  <Menu />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent data-theme="dark" align="end" className="w-[230px] border-white/10 font-sans">
              {user?.signedIn && user.name ? (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2.5 font-normal">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-[#232326] text-[12px] font-medium text-white/90">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{user.name}</span>
                      <span className="block text-xs text-muted-foreground">Signed in</span>
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <div className="lg:hidden">
                {LINKS.map((l) => (
                  <DropdownMenuItem key={l.href} asChild>
                    <Link href={l.href}>{l.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/ai-interview/how-it-works">
                  <CircleHelp /> How it works
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user?.signedIn ? (
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={signInHref}>
                    <LogIn /> Sign in
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
