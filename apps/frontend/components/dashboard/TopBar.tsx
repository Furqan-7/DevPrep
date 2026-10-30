"use client";

/**
 * DevPrep — Dashboard Top Navigation
 *
 * Visual alignment with landing page navbar:
 * - Logo: Solid black (#1A1A1A), bold, no border/box, no exclusion blend mode.
 * - Nav links: Centered in navbar (Logo left, Links center, Profile right).
 */

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, LogOut, Menu, Settings, User, X as CloseIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DevPrepMark from "@/components/shared/DevPrepMark";
import ThemeToggle from "@/components/shared/ThemeToggle";

/* ─────────────────────────────────────────────
   Design-system mono style helper
───────────────────────────────────────────── */
const monoStyle = {
  fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
} as const;

const EASE = [0.25, 0.8, 0.25, 1] as const;

/* ─────────────────────────────────────────────
   Nav links — AI Interview flow only
───────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "AI INTERVIEW", href: "/dashboard/ai-interview" },
  { label: "HOW IT WORKS", href: "/dashboard/ai-interview/how-it-works" },
  { label: "ALL FEEDBACK", href: "/dashboard/ai-interview/feedback" },
] as const;

interface TopBarProps {
  /**
   * The logged-in user's display name, resolved by useCurrentUser() in
   * DashboardShell. An empty string means the name is still loading (only
   * possible on the Google OAuth path — JWT login resolves synchronously).
   * No default is set here; DashboardShell is always the source of truth.
   */
  username?: string;
  showThemeToggle?: boolean;
}

export default function TopBar({ username = "", showThemeToggle = false }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Scroll shadow trigger ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close profile dropdown on outside click ── */
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#dp-profile-menu")) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard/ai-interview") {
      return pathname === "/dashboard/ai-interview";
    }
    if (href === "/dashboard/ai-interview/feedback") {
      return (
        pathname === href ||
        pathname.startsWith(`${href}/`) ||
        pathname.startsWith("/feedback")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /* ── Sign out ── */
  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/");
  };

  // Derive avatar initials: show "…" while name is loading (empty string).
  // Once resolved, take the first two characters of the name.
  const initials = username ? username.slice(0, 2).toUpperCase() : "…";

  return (
    <nav
      id="dashboard-top-nav"
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-40 h-16 flex items-center transition-colors duration-300 ${scrolled
          ? "bg-dp-bg/90 backdrop-blur-md border-b border-dp-ln"
          : "bg-dp-bg border-b border-transparent"
        }`}
    >
      <div className="max-w-[1200px] w-full mx-auto px-6 sm:px-10 flex items-center justify-between">
        {/* ── Logo (solid black, no box/border/exclusion) ─────── */}
        <button
          onClick={() => router.push("/dashboard/ai-interview")}
          aria-label="Go to AI Interview home"
          style={monoStyle}
          className="flex items-center gap-2.5 text-[15px] font-bold tracking-[0.02em] text-dp-ink cursor-pointer bg-transparent border-0 p-0 shrink-0"
        >
          <DevPrepMark size={24} className="shrink-0" />
          <span>DevPrep</span>
        </button>

        {/* ── Desktop nav links (centered in navbar) ─────── */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                style={monoStyle}
                className={`text-[13px] font-bold tracking-[0.08em] transition-colors cursor-pointer relative bg-transparent border-0 p-0 whitespace-nowrap ${active ? "text-dp-ink" : "text-dp-ink/70 hover:text-dp-ink"
                  }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
                {/* Active underline indicator */}
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: "#EB3A14",
                      borderRadius: 999,
                    }}
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Actions: Profile pill & Mobile menu button ─────── */}
        <div className="flex items-center gap-2">
          {showThemeToggle && <ThemeToggle />}
          <div id="dp-profile-menu" className="relative shrink-0">
            <button
              id="dp-profile-toggle"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Open profile menu"
              className="flex items-center gap-2 rounded-full border border-dp-ln bg-dp-sf px-3 py-1.5 cursor-pointer transition-all hover:border-dp-ink"
            >
              {/* Avatar */}
              <div className="w-6 h-6 rounded-full bg-dp-ink flex items-center justify-center shrink-0">
                <span style={monoStyle} className="text-[10px] font-bold tracking-[0.04em] text-dp-bg">
                  {initials}
                </span>
              </div>

              <span className="text-[13px] font-medium tracking-[-0.02em] text-dp-ink max-w-[100px] truncate sm:max-w-none">
                {username}
              </span>

              <ChevronDown
                size={12}
                className={`text-dp-mu transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile dropdown */}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="absolute top-[calc(100%+8px)] right-0 w-44 bg-dp-sf border border-dp-ln rounded-xl overflow-hidden shadow-2xl z-50"
                >
                  {/* User info */}
                  <div className="px-3 py-2.5 border-b border-dp-ln">
                    <p className="text-[13px] font-semibold text-dp-ink m-0">{username}</p>
                    <p
                      style={monoStyle}
                      className="text-[9px] font-medium tracking-[0.08em] uppercase text-dp-mu mt-0.5 mb-0"
                    >
                      Free plan
                    </p>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: User, label: "Profile" },
                    { icon: Settings, label: "Settings" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-dp-mu hover:bg-dp-bg hover:text-dp-ink transition-colors cursor-pointer border-0 bg-transparent"
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}

                  {/* Sign out */}
                  <div className="border-t border-dp-ln">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-[#eb3a14] hover:bg-[#eb3a14]/[0.06] transition-colors cursor-pointer border-0 bg-transparent"
                    >
                      <LogOut size={13} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            aria-expanded={drawerOpen}
            aria-label="Toggle navigation menu"
            className="md:hidden text-dp-ink p-2 rounded-lg hover:bg-dp-ink/5 transition-colors cursor-pointer"
          >
            {drawerOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="md:hidden absolute top-16 left-0 right-0 bg-dp-bg border-b border-dp-ln shadow-lg overflow-hidden z-40"
          >
            <div className="px-6 py-4 flex flex-col gap-2">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      setDrawerOpen(false);
                      router.push(link.href);
                    }}
                    style={monoStyle}
                    className={`text-left text-[13px] font-bold tracking-[0.08em] py-2 px-3 rounded-lg transition-colors cursor-pointer border-0 ${
                      active ? "bg-dp-ink text-dp-bg" : "bg-transparent text-dp-ink/80 hover:bg-dp-ink/5"
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}