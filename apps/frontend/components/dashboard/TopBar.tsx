"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { User, ChevronDown, LogOut, Settings } from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Jobs",         href: "/dashboard/jobs" },
  { label: "DSA",          href: "/dashboard/dsa" },
  { label: "AI Interview", href: "/dashboard/ai-interview" },
  { label: "CS Core",      href: "/dashboard/cs-core" },
];

interface TopBarProps {
  username?: string;
}

export default function TopBar({ username = "Furqan" }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#profile-menu")) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard/jobs") {
      return pathname === "/dashboard" || pathname === "/dashboard/jobs";
    }
    return pathname === href;
  };

  return (
    <nav
      id="dashboard-top-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-2" : "bg-brand-bg/90 backdrop-blur-md border-b border-brand-border py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-10 flex items-center justify-between">

        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div
            id="dashboard-logo"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 font-display text-base font-bold tracking-tighter cursor-pointer select-none"
          >
            <Image
              src="/devprep-logo.png"
              alt="DevPrep logo"
              width={28}
              height={28}
              className="rounded-sm"
              style={{ mixBlendMode: "lighten" }}
            />
            DevPrep
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-5 text-xs text-brand-muted">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <a
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`transition-colors hover:cursor-pointer hover:text-white ${
                    active ? "text-white font-semibold" : ""
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right: Profile */}
        <div id="profile-menu" className="relative">
          <button
            id="profile-toggle"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 cursor-pointer text-white font-medium transition-all duration-200 hover:bg-white/10 text-xs"
          >
            {/* Avatar */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              {username[0].toUpperCase()}
            </div>
            <span>{username}</span>
            <ChevronDown
              size={12}
              className={`text-white/40 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-44 bg-[#0d0e10] border border-white/10 rounded-xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)] z-[200]">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-white/[0.07]">
                <p className="text-xs font-semibold text-white m-0">{username}</p>
                <p className="text-[10px] text-brand-muted mt-0.5">Free plan</p>
              </div>

              {/* Menu items */}
              {[
                { icon: User, label: "Profile" },
                { icon: Settings, label: "Settings" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-2 bg-transparent border-none text-brand-muted text-xs px-3 py-2 cursor-pointer text-left font-[inherit] transition-all duration-100 hover:bg-white/5 hover:text-white"
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}

              {/* Sign out */}
              <div className="border-t border-white/[0.07]">
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-2 bg-transparent border-none text-red-400 text-xs px-3 py-2 cursor-pointer text-left font-[inherit] transition-all duration-100 hover:bg-red-400/10"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
