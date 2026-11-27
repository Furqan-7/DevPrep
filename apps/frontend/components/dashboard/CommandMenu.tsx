"use client";

/**
 * ⌘K palette: jump to any page, start an interview for any role, or open a coding
 * problem. Coding problems are fetched the first time the palette opens.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp, Code, LogOut, Mic } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { ROLES, roleSlug } from "@/data/roles";
import { listCodingProblems, type CodingProblem } from "@/lib/practice";
import { NAV_ITEMS } from "./nav";

export function CommandMenu({ open, onOpenChange, onSignOut }: { open: boolean; onOpenChange: (open: boolean) => void; onSignOut?: () => void }) {
  const router = useRouter();
  const [problems, setProblems] = useState<CodingProblem[] | null>(null);

  useEffect(() => {
    if (!open || problems) return;
    let alive = true;
    listCodingProblems()
      .then((p) => alive && setProblems(p))
      .catch(() => alive && setProblems([]));
    return () => {
      alive = false;
    };
  }, [open, problems]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search DevPrep" description="Jump to a page, a role or a coding problem">
      <CommandInput placeholder="Search pages, roles, problems…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        <CommandGroup heading="Go to">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.href} value={`page ${item.label}`} onSelect={() => go(item.href)}>
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
          <CommandItem value="page how it works help" onSelect={() => go("/dashboard/ai-interview/how-it-works")}>
            <CircleHelp />
            How it works
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Start an interview">
          {ROLES.map((r) => (
            <CommandItem key={r.title} value={`interview ${r.title} ${r.category} ${r.skills.join(" ")}`} onSelect={() => go(`/dashboard/ai-interview/${roleSlug(r.title)}`)}>
              <Mic />
              {r.title}
              <CommandShortcut>{r.category}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        {problems && problems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Coding problems">
              {problems.map((p) => (
                <CommandItem key={p.slug} value={`problem ${p.title} ${p.topic} ${p.difficulty}`} onSelect={() => go(`/dashboard/coding/${p.slug}`)}>
                  <Code />
                  {p.title}
                  <CommandShortcut>{p.difficulty}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {onSignOut && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem
                value="sign out log out"
                onSelect={() => {
                  onOpenChange(false);
                  onSignOut();
                }}
              >
                <LogOut />
                Sign out
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
