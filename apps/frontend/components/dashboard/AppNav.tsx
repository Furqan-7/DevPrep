"use client";

/**
 * Dark top bar for the signed-in app. Only links to pages that exist; the account
 * menu has the user's name and Sign out. On small screens the links move into the menu.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";

const LOGO_PATH =
  "M440 142H814A338.5 338.5 0 0 1 814 819H632Q597 819 597 784V672H814A190.5 190.5 0 0 0 814 291H452Q415 291 415 254V167Q415 142 440 142ZM440 502H557Q597 502 597 542V672H452Q415 672 415 635V527Q415 502 440 502Z";

const LINKS = [
  { label: "Interviews", href: "/dashboard/ai-interview" },
  { label: "Your reports", href: "/dashboard/ai-interview/feedback" },
  { label: "How it works", href: "/dashboard/ai-interview/how-it-works" },
];

function activeHref(pathname: string): string {
  if (pathname.startsWith("/dashboard/ai-interview/feedback") || pathname.startsWith("/dashboard/ai-interview/report")) return LINKS[1]!.href;
  if (pathname.startsWith("/dashboard/ai-interview/how-it-works")) return LINKS[2]!.href;
  return LINKS[0]!.href;
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ signedIn: boolean; name: string } | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = activeHref(pathname);

  // read after mount so server and client render the same HTML
  useEffect(() => {
    setUser({ signedIn: !!localStorage.getItem("token"), name: localStorage.getItem("username") ?? "" });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/75 backdrop-blur-[14px]">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard/ai-interview" className="flex items-center gap-[9px] text-[15.5px] font-semibold tracking-[-0.04em] text-[#f0f0f0]" aria-label="DevPrep interviews">
          <svg viewBox="415 142 738 677" aria-hidden="true" className="h-[15px] w-[17px]" fill="currentColor">
            <path d={LOGO_PATH} />
          </svg>
          DevPrep
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active === l.href ? "page" : undefined}
              className={`relative px-3 py-2 text-[13.5px] tracking-[-0.01em] transition-colors ${active === l.href ? "text-[#f0f0f0]" : "text-white/50 hover:text-[#f0f0f0]"}`}
            >
              {l.label}
              {active === l.href && <motion.span layoutId="app-nav-active" className="absolute inset-x-3 -bottom-[11px] h-px bg-[#bec8ff]" />}
            </Link>
          ))}
        </nav>

        <div ref={menuRef} className="relative">
          {user && !user.signedIn ? (
            <Link href={`/auth/signin?next=${encodeURIComponent(pathname)}`} className="hidden rounded-[8px] px-3 py-2 text-[13.5px] text-[#f0f0f0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] sm:inline-block">
              Sign in
            </Link>
          ) : null}
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={user?.signedIn ? "Account menu" : "Menu"}
            onClick={() => setOpen((o) => !o)}
            className={`grid h-8 w-8 cursor-pointer place-items-center rounded-full text-[11.5px] font-semibold text-[#cfd6ff] shadow-[inset_0_0_0_1px_rgba(190,200,255,0.25)] transition-colors hover:bg-[#1d1f36] ${user && !user.signedIn ? "sm:hidden" : ""} bg-[#16172a]`}
          >
            {user?.signedIn ? initials : (
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            )}
          </button>
          {open && (
            <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-[220px] overflow-hidden rounded-[12px] bg-[#111114] p-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_20px_50px_-20px_rgba(0,0,0,0.8)]">
              {user?.signedIn && user.name ? (
                <div className="border-b border-white/[0.06] px-3 pb-2.5 pt-2 text-[13px]">
                  <div className="text-white/40">Signed in as</div>
                  <div className="truncate text-[#f0f0f0]">{user.name}</div>
                </div>
              ) : null}
              <div className="sm:hidden">
                {LINKS.map((l) => (
                  <Link key={l.href} role="menuitem" href={l.href} onClick={() => setOpen(false)} className="block rounded-[8px] px-3 py-2 text-[13.5px] text-white/75 hover:bg-white/[0.05] hover:text-[#f0f0f0]">
                    {l.label}
                  </Link>
                ))}
              </div>
              {user?.signedIn ? (
                <button type="button" role="menuitem" onClick={signOut} className="block w-full cursor-pointer rounded-[8px] px-3 py-2 text-left text-[13.5px] text-white/75 hover:bg-white/[0.05] hover:text-[#f0f0f0]">
                  Sign out
                </button>
              ) : (
                <Link role="menuitem" href={`/auth/signin?next=${encodeURIComponent(pathname)}`} className="block rounded-[8px] px-3 py-2 text-[13.5px] text-white/75 hover:bg-white/[0.05] hover:text-[#f0f0f0] sm:hidden">
                  Sign in
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
