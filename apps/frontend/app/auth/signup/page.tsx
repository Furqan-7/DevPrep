"use client";

/**
 * Sign up. Name + email + password against /api/auth/signup (rules mirror the
 * backend's signupSchema: name 3–20 characters, valid email; we ask for 8+ character
 * passwords). Stores the token and username in localStorage, then goes to ?next= or
 * the dashboard.
 */

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import api from "@/lib/api";
import { serif } from "@/lib/fonts";
import { ROLES, ROLE_CATEGORIES, ROLE_DURATION_RANGE } from "@/data/roles";
import { AuthLogo, AuthShell, useReveal } from "@/components/auth/AuthShell";
import { AuthField, ErrorBanner, GoogleComingSoon, PasswordField, SubmitButton, readAxiosError, safeNext } from "@/components/auth/AuthFields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Facts shown in the panel, derived from data/roles.ts so they stay true.
const FACTS = [
  { value: String(ROLES.length), label: "interview roles" },
  { value: String(ROLE_CATEGORIES.length), label: "categories" },
  { value: `${ROLE_DURATION_RANGE.min}–${ROLE_DURATION_RANGE.max}`, label: "min sessions" },
];

function Panel() {
  const reveal = useReveal();
  return (
    <>
      <motion.h2 {...reveal(0.25)} className="m-0 text-[52px] font-medium leading-[1.04] tracking-[-0.05em]">
        Practice out loud.
        <br />
        Walk in{" "}
        <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>
          ready.
        </em>
      </motion.h2>
      <motion.p {...reveal(0.35)} className="mt-4 max-w-[380px] text-[15.5px] leading-[1.5] tracking-[-0.03em] text-white/56">
        Zara asks real interview questions by voice and follows up on what you say.
      </motion.p>
      <motion.dl {...reveal(0.45)} className="mt-7 flex gap-7">
        {FACTS.map((f) => (
          <div key={f.label} className="flex flex-col-reverse">
            <dt className="text-[12.5px] text-white/45">{f.label}</dt>
            <dd className="m-0 text-[22px] font-medium tracking-[-0.04em]">{f.value}</dd>
          </div>
        ))}
      </motion.dl>
    </>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reveal = useReveal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    const n = name.trim().length;
    if (n < 3 || n > 20) next.name = "Use 3–20 characters.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/signup", { username: name.trim(), email: email.trim(), password });
      if (res.data?.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.username ?? "");
        router.push(safeNext(searchParams));
        return;
      }
      setServerError(res.data?.message || "Sign up failed. Please try again.");
    } catch (err) {
      const { status, message, network } = readAxiosError(err);
      if (network) setServerError("Can't reach the server. Check your connection and try again.");
      else if (status === 400 && message) setServerError(`${message}. Try signing in instead.`);
      else if (status === 411) setServerError("Check your details: name 3–20 characters, a valid email and an 8+ character password.");
      else setServerError("Something went wrong on our side. Please try again.");
    }
    setLoading(false);
  };

  return (
    <AuthShell panel={<Panel />}>
      <motion.div {...reveal(0)} className="mb-7 lg:hidden">
        <AuthLogo />
      </motion.div>
      <motion.h1 {...reveal(0.05)} className="m-0 text-[32px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[34px]">
        Create your{" "}
        <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>
          account
        </em>
      </motion.h1>
      <motion.p {...reveal(0.11)} className="mb-[30px] mt-2.5 text-[15px] leading-[1.5] tracking-[-0.03em] text-white/56">
        Free during early access. No card required.
      </motion.p>

      {serverError && <ErrorBanner message={serverError} />}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <motion.div {...reveal(0.17)}>
          <AuthField
            id="signup-name"
            label="Name"
            autoComplete="name"
            placeholder="Your name"
            maxLength={20}
            hint="3–20 characters"
            value={name}
            onChange={setName}
            error={errors.name}
            required
          />
        </motion.div>
        <motion.div {...reveal(0.23)}>
          <AuthField
            id="signup-email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            error={errors.email}
            required
          />
        </motion.div>
        <motion.div {...reveal(0.29)}>
          <PasswordField
            id="signup-password"
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            value={password}
            onChange={setPassword}
            error={errors.password}
            required
          />
        </motion.div>
        <motion.div {...reveal(0.35)} className="pt-1.5">
          <SubmitButton loading={loading} label="Create account" loadingLabel="Creating account…" />
        </motion.div>
      </form>

      <motion.div {...reveal(0.41)}>
        <GoogleComingSoon />
      </motion.div>

      <motion.p {...reveal(0.47)} className="mt-[18px] text-[12px] leading-[1.5] text-white/40">
        By creating an account you agree to our{" "}
        <Link href="/privacy" className="text-white/70 underline underline-offset-2 transition-colors hover:text-[#f0f0f0]">
          Privacy Policy
        </Link>
        .
      </motion.p>
      <motion.p {...reveal(0.53)} className="mt-[22px] text-[13.5px] tracking-[-0.02em] text-white/50">
        Already have an account?{" "}
        <Link
          href={searchParams.get("next") ? `/auth/signin?next=${encodeURIComponent(safeNext(searchParams))}` : "/auth/signin"}
          className="text-[#f0f0f0] underline decoration-[#bec8ff]/40 underline-offset-4 transition-colors hover:decoration-[#bec8ff]"
        >
          Sign in
        </Link>
      </motion.p>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0a]" />}>
      <SignUpForm />
    </Suspense>
  );
}
