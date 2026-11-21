"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Compact select for list filters; the first option is the "everything" choice. */
export function FilterSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger aria-label={label} className="h-9 min-w-[132px] border-white/10 bg-white/[0.02] text-[13px]">
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      {/* portals render outside the dark page, so the theme is set again here */}
      <SelectContent data-theme="dark" position="popper" className="border-white/10">
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-[13px]">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
