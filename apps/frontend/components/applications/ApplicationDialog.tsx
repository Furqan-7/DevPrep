"use client";

/** Add or edit one tracked application. Editing also offers delete. */

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STAGE_LABELS, STAGES, type Application, type ApplicationInput, type Stage } from "@/lib/career";

const EMPTY = { company: "", title: "", url: "", location: "", notes: "", stage: "SAVED" as Stage };

export function ApplicationDialog({
  open,
  onOpenChange,
  application,
  defaultStage,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null; // null adds a new one
  defaultStage: Stage;
  onSave: (input: ApplicationInput) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  useEffect(() => {
    if (!open) return;
    setBusy(null);
    setForm(
      application
        ? { company: application.company, title: application.title, url: application.url ?? "", location: application.location ?? "", notes: application.notes ?? "", stage: application.stage }
        : { ...EMPTY, stage: defaultStage },
    );
  }, [open, application, defaultStage]);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("save");
    try {
      await onSave({ ...form, url: form.url.trim() || null, location: form.location.trim() || null, notes: form.notes.trim() || null });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await onDelete();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-white/10 bg-popover text-foreground sm:max-w-[480px]">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{application ? "Edit application" : "Add an application"}</DialogTitle>
            <DialogDescription>{application ? `Added ${new Date(application.createdAt).toLocaleDateString()}` : "Track a job you found anywhere."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company" id="app-company">
              <Input id="app-company" value={form.company} onChange={set("company")} required maxLength={120} />
            </Field>
            <Field label="Role" id="app-title">
              <Input id="app-title" value={form.title} onChange={set("title")} required maxLength={160} />
            </Field>
            <Field
              label="Job link"
              id="app-url"
              aside={
                application?.url ? (
                  <a href={application.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
                    Open <ExternalLink className="size-3" />
                  </a>
                ) : null
              }
            >
              <Input id="app-url" type="url" value={form.url} onChange={set("url")} placeholder="https://" maxLength={500} />
            </Field>
            <Field label="Location" id="app-location">
              <Input id="app-location" value={form.location} onChange={set("location")} maxLength={120} />
            </Field>
          </div>
          <Field label="Stage" id="app-stage">
            <Select value={form.stage} onValueChange={(v) => setForm((f) => ({ ...f, stage: v as Stage }))}>
              <SelectTrigger id="app-stage" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent data-theme="dark" position="popper">
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes" id="app-notes">
            <Textarea id="app-notes" value={form.notes} onChange={set("notes")} rows={4} maxLength={4000} placeholder="Referral, recruiter, interview dates…" />
          </Field>
          <DialogFooter className="items-center sm:justify-between">
            {application ? (
              <Button type="button" variant="ghost" onClick={remove} disabled={!!busy} className="text-[#fca5a5] hover:bg-[#f87171]/10 hover:text-[#fecaca]">
                {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={!!busy}>
              {busy === "save" ? <Loader2 className="animate-spin" /> : null}
              {application ? "Save changes" : "Add application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, aside, children }: { label: string; id: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[12.5px] font-normal text-muted-foreground">
          {label}
        </Label>
        {aside}
      </div>
      {children}
    </div>
  );
}
