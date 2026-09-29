"use client";

import Image from "next/image";

export interface FooterLink {
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}

export interface FooterLinkGroup {
  heading: string;
  links: FooterLink[];
}

export interface FooterProps {
  linkGroups: FooterLinkGroup[];
  brand?: {
    logoAlt?: string;
    logoSrc?: string;
    name?: string;
    tagline?: string;
    terminalBadge?: string;
  };
  copyrightText?: string;
  attributionText?: string;
}

const monoStyle = {
  fontFamily: "var(--font-jbmono, 'JetBrains Mono', ui-monospace, monospace)",
};

function resolveExternal(href: string | undefined, explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  return typeof href === "string" && href.startsWith("http");
}

function FooterNavLink({ link }: { link: FooterLink }) {
  const cls = "hover:text-[#eb3a14] transition-colors";
  if (link.onClick) {
    return (
      <button type="button" onClick={link.onClick} className={`${cls} cursor-pointer`}>
        {link.label}
      </button>
    );
  }
  const external = resolveExternal(link.href, link.external);
  return (
    <a
      href={link.href ?? "#"}
      className={cls}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {link.label}
    </a>
  );
}

export function Footer({
  linkGroups,
  brand,
  copyrightText = "\u00a9 2026 DevPrep. All rights reserved.",
  attributionText = "Built by Furqan",
}: FooterProps) {
  const logoSrc = brand?.logoSrc ?? "/devprep-logo.png";
  const logoAlt = brand?.logoAlt ?? "DevPrep logo";
  const brandName = brand?.name ?? "DevPrep";
  const tagline =
    brand?.tagline ??
    "AI-powered mock interviews for the roles that matter. Practice with Zara, get real feedback, walk in confident.";
  const terminalBadge =
    brand?.terminalBadge !== undefined ? brand.terminalBadge : "devprep --start";

  return (
    <footer className="bg-white pt-16 sm:pt-20 pb-10 px-6 border-t border-[#e5e5e5]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row gap-12 pb-12">
          <div className="md:max-w-[300px]">
            <div
              style={monoStyle}
              className="flex items-center gap-2.5 text-[15px] font-bold text-[#1a1a1a] mb-4"
            >
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={26}
                height={26}
                unoptimized
                className="rounded-sm shrink-0"
              />
              <span>{brandName}</span>
            </div>
            <p className="text-[14px] text-[#666] leading-relaxed mb-5">{tagline}</p>
            {terminalBadge && (
              <div
                style={monoStyle}
                className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white text-[12px] font-medium px-4 py-2.5 rounded-md"
              >
                <span className="text-[#eb3a14]">&#x27A4;</span>
                {terminalBadge}
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col sm:flex-row gap-10 sm:gap-16">
            {linkGroups.map((group) => (
              <div key={group.heading}>
                <div
                  style={monoStyle}
                  className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-4"
                >
                  {group.heading}
                </div>
                <ul className="space-y-3 text-[14px] text-[#1a1a1a]/75">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <FooterNavLink link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#999]">
          <span>{copyrightText}</span>
          <span style={monoStyle}>{attributionText}</span>
        </div>
      </div>
    </footer>
  );
}