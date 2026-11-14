"use client";

/**
 * Sign in. Email + password against /api/auth/signin; stores the token and username
 * in localStorage and returns to ?next= (same-origin paths only) or the dashboard.
 */

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import api from "@/lib/api";
import { serif } from "@/lib/fonts";
import { AuthLogo, AuthShell, useReveal } from "@/components/auth/AuthShell";
import { AuthField, ErrorBanner, GoogleComingSoon, PasswordField, SubmitButton, readAxiosError, safeNext } from "@/components/auth/AuthFields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// One message for unknown email and wrong password, so the form doesn't reveal which
// addresses have accounts.
const BAD_CREDENTIALS = "Email or password is incorrect.";

function Panel() {
  const reveal = useReveal();
  return (
    <>
      <motion.h2 {...reveal(0.25)} className="m-0 text-[52px] font-medium leading-[1.04] tracking-[-0.05em]">
        Pick up right
        <br />
        where you{" "}
        <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>
          left off.
        </em>
      </motion.h2>
      <motion.p {...reveal(0.35)} className="mt-4 max-w-[380px] text-[15.5px] leading-[1.5] tracking-[-0.03em] text-white/56">
        Zara and all 24 interview roles are waiting. Sign in and keep practicing.
      </motion.p>
    </>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reveal = useReveal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    // No length rule here: older accounts may have shorter passwords than sign-up now requires.
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/signin", { email: email.trim(), password });
      if (res.data?.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.username ?? "");
        router.push(safeNext(searchParams));
        return;
      }
      setServerError(BAD_CREDENTIALS);
    } catch (err) {
      const { status, network } = readAxiosError(err);
      if (network) setServerError("Can't reach the server. Check your connection and try again.");
      else if (status && status >= 500) setServerError("Something went wrong on our side. Please try again.");
      else setServerError(BAD_CREDENTIALS);
    }
    setLoading(false);
  };

  return (
    <AuthShell panel={<Panel />}>
      <motion.div {...reveal(0)} className="mb-7 lg:hidden">
        <AuthLogo />
      </motion.div>
      <motion.h1 {...reveal(0.05)} className="m-0 text-[32px] font-medium leading-[1.05] tracking-[-0.05em] sm:text-[34px]">
        Welcome{" "}
        <em className={`${serif.className} font-normal tracking-normal`} style={{ fontStyle: "italic" }}>
          back
        </em>
      </motion.h1>
      <motion.p {...reveal(0.11)} className="mb-[30px] mt-2.5 text-[15px] leading-[1.5] tracking-[-0.03em] text-white/56">
        Sign in to continue your interview prep.
      </motion.p>

      {serverError && <ErrorBanner message={serverError} />}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <motion.div {...reveal(0.17)}>
          <AuthField
            id="signin-email"
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
        <motion.div {...reveal(0.23)}>
          <PasswordField
            id="signin-password"
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            required
          />
        </motion.div>
        <motion.div {...reveal(0.29)} className="pt-1.5">
          <SubmitButton loading={loading} label="Sign in" loadingLabel="Signing in…" />
        </motion.div>
      </form>

      <motion.div {...reveal(0.35)}>
        <GoogleComingSoon />
      </motion.div>

      <motion.p {...reveal(0.41)} className="mt-[22px] text-[13.5px] tracking-[-0.02em] text-white/50">
        New to DevPrep?{" "}
        <Link
          href={searchParams.get("next") ? `/auth/signup?next=${encodeURIComponent(safeNext(searchParams))}` : "/auth/signup"}
          className="text-[#f0f0f0] underline decoration-[#bec8ff]/40 underline-offset-4 transition-colors hover:decoration-[#bec8ff]"
        >
          Create an account
        </Link>
      </motion.p>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0a0a0a]" />}>
      <SignInForm />
    </Suspense>
  );
}
