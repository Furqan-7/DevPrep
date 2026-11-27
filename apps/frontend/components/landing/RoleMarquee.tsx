"use client";

/** Two rows of interview roles drifting in opposite directions, under the hero. */

import Link from "next/link";
import { ROLES, ROLE_CATEGORIES, roleSlug } from "@/data/roles";
import { Reveal } from "./primitives";

const DOT: Record<string, string> = {
  Engineering: "#8fb0ff",
  Data: "#5eead4",
  Design: "#f9a8d4",
  Product: "#fcd34d",
  Behavioral: "#c4b5fd",
};

function Row({ roles, reverse }: { roles: readonly (typeof ROLES)[number][]; reverse?: boolean }) {
  // the list is doubled so the -50% translate loops seamlessly
  const items = [...roles, ...roles];
  return (
    <div className="fx-fade-x flex overflow-hidden">
      <ul
        className="m-0 flex w-max shrink-0 list-none gap-2.5 p-0 motion-safe:animate-[fx-marquee_60s_linear_infinite] hover:[animation-play-state:paused]"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {items.map((r, i) => (
          <li key={`${r.title}-${i}`} aria-hidden={i >= roles.length}>
            <Link
              href={`/dashboard/ai-interview/${roleSlug(r.title)}`}
              tabIndex={i >= roles.length ? -1 : undefined}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-[13.5px] tracking-[-0.01em] text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              <span className="size-1.5 rounded-full" style={{ background: DOT[r.category] ?? "#fff" }} />
              {r.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoleMarquee() {
  const half = Math.ceil(ROLES.length / 2);
  return (
    <section className="relative bg-[#050506] pb-20 pt-4">
      <Reveal>
        <p className="mb-7 text-center text-[13.5px] tracking-[-0.01em] text-white/45">
          Practise for {ROLES.length} roles across {ROLE_CATEGORIES.slice(0, -1).join(", ")} and {ROLE_CATEGORIES.at(-1)}
        </p>
      </Reveal>
      <div className="grid gap-2.5">
        <Row roles={ROLES.slice(0, half)} />
        <Row roles={ROLES.slice(half)} reverse />
      </div>
    </section>
  );
}
