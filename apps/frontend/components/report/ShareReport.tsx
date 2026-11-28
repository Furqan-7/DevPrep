"use client";

/**
 * Share button and dialog for a report: turns a read-only link on or off. The shared page
 * shows scores and feedback only; answers and suggested answers stay private.
 */

import { useState } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { shareSession, unshareSession } from "@/lib/interview/report";

export function ShareReport({ sessionId, initialToken }: { sessionId: number; initialToken: string | null }) {
  const [token, setToken] = useState(initialToken);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const url = token ? `${window.location.origin}/r/${token}` : "";

  const toggle = async () => {
    setBusy(true);
    setError("");
    try {
      if (token) {
        await unshareSession(sessionId);
        setToken(null);
      } else {
        setToken(await shareSession(sessionId));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-lg border-white/[0.1] bg-white/[0.03] text-white/85">
          <Link2 /> {token ? "Shared" : "Share"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-white/10 bg-popover text-foreground sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Share this report</DialogTitle>
          <DialogDescription>
            Anyone with the link sees your scores, feedback and how you sounded. What you said and the suggested answers stay private.
          </DialogDescription>
        </DialogHeader>
        {token ? (
          <div className="flex gap-2">
            <Input readOnly value={url} aria-label="Share link" onFocus={(e) => e.target.select()} className="text-[13px]" />
            <Button onClick={copy} className="shrink-0">
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="m-0 text-[13px] text-[#fecaca]">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button variant={token ? "ghost" : "default"} onClick={toggle} disabled={busy} className={token ? "text-muted-foreground" : undefined}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            {token ? "Turn off link" : "Create link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
