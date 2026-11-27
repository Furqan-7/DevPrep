"use client";

/** Form building blocks for the sign in and sign up pages. */

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

const inputCls =
  "h-11 w-full rounded-[10px] border border-white/[0.08] bg-white/[0.025] px-3.5 text-[14.5px] tracking-[-0.01em] text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-white/30 " +
  "hover:border-white/[0.14] focus:border-[#5b8cff]/70 focus:bg-white/[0.04] focus:shadow-[0_0_0_4px_rgba(91,140,255,0.14)] " +
  "aria-[invalid=true]:border-[#f87171]/60 aria-[invalid=true]:focus:shadow-[0_0_0_4px_rgba(248,113,113,0.12)]";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
};

export function AuthField({ id, label, value, onChange, hint, error, trailing, className = "", ...rest }: FieldProps) {
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium tracking-[-0.01em] text-white/70">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className={`${inputCls} ${trailing ? "pr-[68px]" : ""} ${className}`}
          {...rest}
        />
        {trailing}
      </div>
      {note && (
        <p id={noteId} className={`mt-1.5 text-[12px] ${error ? "text-[#fca5a5]" : "text-white/40"}`}>
          {note}
        </p>
      )}
    </div>
  );
}

/** Password input with a Show/Hide toggle (stands in for a "confirm password" field). */
export function PasswordField(props: Omit<FieldProps, "type" | "trailing">) {
  const [shown, setShown] = useState(false);
  return (
    <AuthField
      {...props}
      type={shown ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-controls={props.id}
          className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 cursor-pointer rounded-[7px] px-2.5 text-[12.5px] font-medium text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#5b8cff]/60"
        >
          {shown ? "Hide" : "Show"}
        </button>
      }
    />
  );
}

export function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-white text-[14.5px] font-semibold tracking-[-0.02em] text-black shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_10px_30px_-12px_rgba(255,255,255,0.5)] transition-[transform,background-color] duration-200 hover:bg-white/90 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b8cff] disabled:cursor-wait disabled:bg-white/70"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-5 rounded-[10px] border border-[#f87171]/25 bg-[#f87171]/[0.07] px-4 py-3 text-[13.5px] text-[#fecaca]">
      {message}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

/** "or" divider plus the Google button, disabled until Google sign-in ships. */
export function GoogleComingSoon() {
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-[12px] text-white/35 before:h-px before:flex-1 before:bg-white/[0.08] after:h-px after:flex-1 after:bg-white/[0.08]">or</div>
      <button
        type="button"
        disabled
        className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.02] text-[14px] font-medium tracking-[-0.01em] text-white/50"
      >
        <GoogleIcon />
        Continue with Google
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-normal text-white/55">Coming soon</span>
      </button>
    </>
  );
}

/** Same-origin path from ?next= / ?returnUrl=, or the default dashboard. */
export function safeNext(params: { get(name: string): string | null } | null): string {
  const next = params?.get("next") || params?.get("returnUrl");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/** Status and server message from an axios error; `network` means no response came back. */
export function readAxiosError(err: unknown): { status?: number; message?: string; network: boolean } {
  const e = err as { response?: { status?: number; data?: { message?: string } }; request?: unknown };
  if (e.response) return { status: e.response.status, message: e.response.data?.message, network: false };
  return { network: Boolean(e.request) };
}
