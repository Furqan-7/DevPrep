"use client";

/**
 * DevPrep — Sign In
 *
 * Rebuilt to match sign-up's "Tidiane DevOps Portfolio System" design:
 *   bg #F5F5F7 · primary #1A1A1A · accent #EB3A14
 *   Inter + JetBrains Mono · pill buttons · 12px cards · 8px inputs
 *
 * Layout mirrors sign-up exactly (terminal panel left, form right).
 * All shared primitives imported from AuthShared — no style duplication.
 *
 * Functionality unchanged: same axios call, same localStorage keys,
 * same redirect target.
 *
 * Responsive: 375 / 390 / 428 / 768 / 834 / 1024px+.
 * Magnetic effect disabled on pointer:coarse (touch) devices.
 */

import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "motion/react";

import {
  monoStyle,
  NoiseOverlay,
  Logo,
  Eyebrow,
  InputField,
  OAuthButton,
  GoogleIcon,
  GitHubIcon,
  OrDivider,
  MagneticButton,
  TerminalPanel,
  type TerminalLineData,
} from "@/components/auth/AuthShared";

/* ─────────────────────────────────────────────
   Terminal lines — sign-in context
───────────────────────────────────────────── */
const SIGNIN_TERMINAL_LINES: TerminalLineData[] = [
  { text: "$ devprep resume --session", tone: "cmd" },
  { text: "✓ profile found", tone: "ok" },
  { text: "✓ 3 practice sessions logged", tone: "ok" },
  { text: "✓ interview streak: 7 days", tone: "ok" },
  { text: "$ devprep auth --verify", tone: "cmd" },
  { text: "> waiting for credentials...", tone: "muted" },
];

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ── Validation ─────────────────────────── */
  const validate = () => {
    const newErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email address";
    if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Submit ─────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:3001/api/auth/signin", {
        email,
        password,
      });

      console.log(res);
      if (res.status === 200 && res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.username ?? "");
        router.push("/dashboard/ai-interview");
      } else {
        setServerError(res.data.message || "Sign in failed. Please try again.");
      }
    } catch (err: any) {
      if (err.response) {
        // Server responded with a non-2xx status — show its message
        setServerError(
          err.response.data?.message ??
            "Sign in failed. Please check your credentials and try again."
        );
      } else if (err.request) {
        // Request made but no response (server down / network issue)
        setServerError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /*
     * Mirrors sign-up layout exactly:
     *  - overflow-x-hidden prevents horizontal scroll at any breakpoint
     *  - flex-col on mobile → flex-row on lg
     */
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#eb3a14]/20">
      <NoiseOverlay />

      {/* Left: terminal panel (desktop only) */}
      <TerminalPanel
        heading="Pick up right where you left off."
        subheading="Your sessions, your progress, your AI coach — all waiting. Sign in and keep the momentum."
        lines={SIGNIN_TERMINAL_LINES}
        windowTitle="zsh — devprep-session"
      />

      {/* Right: form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 relative">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#eb3a14]/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
          className="w-full max-w-[420px] relative"
        >
          {/* Logo — only on mobile (desktop shows it inside terminal panel) */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          {/* Eyebrow badge */}
          <div className="mb-6 flex justify-center lg:justify-start">
            <Eyebrow>Welcome back</Eyebrow>
          </div>

          {/* Heading — fluid font size */}
          <div className="mb-8 text-center lg:text-left">
            <h1
              className="font-bold text-[#1a1a1a] tracking-[-0.02em] mb-2"
              style={{ fontSize: "clamp(22px, 5vw, 32px)" }}
            >
              Sign in to DevPrep
            </h1>
            <p className="text-[14px] text-[#666] leading-relaxed">
              Continue your placement prep — your progress is waiting.
            </p>
          </div>

          {/* Server-side error banner */}
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-5 px-4 py-3 rounded-[8px] bg-rose-50 border border-rose-200 text-[13px] text-rose-600 font-medium"
            >
              {serverError}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <InputField
              label="Email"
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />

            <div className="space-y-1">
              <InputField
                label="Password"
                id="signin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                error={errors.password}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </InputField>

              {/* Forgot password — right-aligned, below the field */}
              <div className="flex justify-end pt-1">
                <Link
                  href="/auth/forgot-password"
                  style={monoStyle}
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#999] hover:text-[#eb3a14] transition-colors underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit — magnetic on mouse, standard on touch */}
            <MagneticButton
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[13px] tracking-[0.04em] font-bold transition-colors duration-200 mt-2 ${
                isLoading
                  ? "bg-[#e5e5e5] text-[#bbb] cursor-not-allowed"
                  : "bg-[#eb3a14] hover:bg-[#d63410] text-white cursor-pointer"
              }`}
            >
              <span style={monoStyle} className="flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    SIGNING IN...
                  </>
                ) : (
                  <>
                    SIGN IN
                    <ArrowRight size={14} />
                  </>
                )}
              </span>
            </MagneticButton>
          </form>

          {/* OAuth section */}
          <div className="mt-6 space-y-3">
            <OrDivider />
            <div className="space-y-2.5 pt-1">
              <OAuthButton
                icon={<GoogleIcon />}
                label="Continue with Google"
                onClick={() => {}}
              />
              <OAuthButton
                icon={<GitHubIcon />}
                label="Continue with GitHub"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* Sign-up link */}
          <p className="text-center lg:text-left text-[13px] text-[#666] mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-[#1a1a1a] font-semibold hover:text-[#eb3a14] underline underline-offset-4 transition-colors"
            >
              Sign up →
            </Link>
          </p>

          {/* Free-tier badge — mobile only */}
          <p
            style={monoStyle}
            className="text-center lg:text-left text-[10px] text-[#bbb] font-medium mt-6 uppercase tracking-[0.1em] lg:hidden"
          >
            Free forever for students · No credit card required
          </p>
        </motion.div>
      </div>
    </div>
  );
}