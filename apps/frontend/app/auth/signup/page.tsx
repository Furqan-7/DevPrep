"use client";

/**
 * DevPrep — Sign Up
 *
 * Redesigned to match the "Tidiane DevOps Portfolio System":
 *   bg #F5F5F7 · primary #1A1A1A · accent #EB3A14
 *   Inter + JetBrains Mono · pill buttons · 12px cards · 8px inputs
 *
 * Functionality unchanged: same axios call, same localStorage keys,
 * same redirect target, same validation rules.
 *
 * Responsive: tested at 375 / 390 / 428 / 768 / 834 / 1024px+.
 * Magnetic effect disabled on pointer:coarse (touch) devices.
 */

import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
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
   Password strength meter
   Accent (#EB3A14) for weak/fair/good, success (#22C55E) for strong.
   ("Don't introduce multiple accent colors")
───────────────────────────────────────────── */
function getStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { score, label: password.length > 0 ? labels[score] : "" };
}

function StrengthMeter({ password }: { password: string }) {
  const { score, label } = getStrength(password);
  if (!password) return null;

  const barColor = (i: number) => {
    if (i > score) return "bg-[#e5e5e5]";
    if (score >= 4) return "bg-[#22c55e]";
    const opacities = ["", "opacity-40", "opacity-65", "opacity-100"];
    return `bg-[#eb3a14] ${opacities[score]}`;
  };

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${barColor(i)}`}
          />
        ))}
      </div>
      <p
        style={monoStyle}
        className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
          score >= 4 ? "text-[#22c55e]" : "text-[#999]"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Terminal lines for sign-up context
───────────────────────────────────────────── */
const SIGNUP_TERMINAL_LINES: TerminalLineData[] = [
  { text: "$ devprep init --candidate", tone: "cmd" },
  { text: "✓ workspace created", tone: "ok" },
  { text: "✓ 24+ interview roles loaded", tone: "ok" },
  { text: "✓ AI interviewer \"Zara\" ready", tone: "ok" },
  { text: "$ devprep whoami", tone: "cmd" },
  { text: "> waiting for you to sign up...", tone: "muted" },
];

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  /* ── Validation ─────────────────────────── */
  const validate = () => {
    const newErrors: typeof errors = {};
    if (fullName.trim().length < 2)
      newErrors.fullName = "Full name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email address";
    if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Submit ─────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !termsAccepted) return;
    setServerError("");
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:3001/api/auth/signup", {
        username: fullName,
        email,
        password,
      });
      const data = res.data;
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username ?? "");
        router.push("/dashboard/ai-interview");
      } else {
        setServerError(data.message || "Sign up failed. Please try again.");
      }
    } catch (err: any) {
      if (err.response) {
        setServerError(
          err.response.data?.message ?? "Sign up failed. Please try again."
        );
      } else if (err.request) {
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

  const isSubmitDisabled = !termsAccepted || isLoading;

  return (
    /*
     * Root: overflow-x-hidden prevents any element from causing horizontal
     * scroll. flex-col on mobile → flex-row on lg so the terminal panel
     * sits beside the form only on desktop.
     */
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#eb3a14]/20">
      <NoiseOverlay />

      {/* Left: terminal panel (desktop only — hidden below lg) */}
      <TerminalPanel
        heading="Walk in already knowing what's coming."
        subheading="Practice with Zara, your AI interviewer. Real voice conversations, live code execution, instant feedback."
        lines={SIGNUP_TERMINAL_LINES}
        windowTitle="zsh — devprep-onboarding"
      />

      {/* Right: form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 relative">
        {/* Ambient glow — decorative, pointer-events-none */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#eb3a14]/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
          /* max-w keeps the form readable on wide screens while w-full
             + proper px on the parent ensures no overflow on narrow ones */
          className="w-full max-w-[420px] relative"
        >
          {/* Logo — only visible below lg (desktop shows it in terminal panel) */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          {/* Eyebrow badge */}
          <div className="mb-6 flex justify-center lg:justify-start">
            <Eyebrow>Free for students</Eyebrow>
          </div>

          {/* Heading — fluid font size via clamp so it never overflows */}
          <div className="mb-8 text-center lg:text-left">
            <h1
              className="font-bold text-[#1a1a1a] tracking-[-0.02em] mb-2"
              style={{ fontSize: "clamp(22px, 5vw, 32px)" }}
            >
              Create your account
            </h1>
            <p className="text-[14px] text-[#666] leading-relaxed">
              Start preparing for your dream placement — free forever.
            </p>
          </div>

          {/* Server-side error banner */}
          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-[8px] bg-rose-50 border border-rose-200 text-[13px] text-rose-600 font-medium">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <InputField
              label="Full Name"
              id="signup-name"
              placeholder="Rahul Sharma"
              value={fullName}
              onChange={setFullName}
              error={errors.fullName}
            />

            <InputField
              label="Email"
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />

            <div className="space-y-1">
              <InputField
                label="Password"
                id="signup-password"
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
              <StrengthMeter password={password} />
            </div>

            <InputField
              label="Confirm Password"
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] transition-colors cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff size={15} />
                ) : (
                  <Eye size={15} />
                )}
              </button>
            </InputField>

            {/*
             * Terms checkbox.
             * The visible checkbox is 16×16 px; to meet the 44px tap-target
             * requirement we wrap it in a 44×44 flex container and let the
             * inner element sit centred.
             */}
            <label className="flex items-start gap-3 cursor-pointer group mt-1">
              <span className="flex-shrink-0 flex items-center justify-center w-[44px] h-[44px] -ml-[14px] -mt-[12px]">
                <button
                  type="button"
                  onClick={() => setTermsAccepted((v) => !v)}
                  aria-checked={termsAccepted}
                  role="checkbox"
                  className={`w-4 h-4 rounded-[4px] border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                    termsAccepted
                      ? "bg-[#eb3a14] border-[#eb3a14] text-white"
                      : "bg-white border-[#e5e5e5] group-hover:border-[#1a1a1a]/30"
                  }`}
                >
                  {termsAccepted && <Check size={11} strokeWidth={3} />}
                </button>
              </span>
              <span className="text-[12px] text-[#666] leading-relaxed group-hover:text-[#1a1a1a] transition-colors">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-[#1a1a1a] font-medium underline underline-offset-4 decoration-[#e5e5e5] hover:decoration-[#eb3a14] transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-[#1a1a1a] font-medium underline underline-offset-4 decoration-[#e5e5e5] hover:decoration-[#eb3a14] transition-colors"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit — magnetic on mouse, standard on touch */}
            <MagneticButton
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[13px] tracking-[0.04em] font-bold transition-colors duration-200 mt-2 ${
                isSubmitDisabled
                  ? "bg-[#e5e5e5] text-[#bbb] cursor-not-allowed"
                  : "bg-[#eb3a14] hover:bg-[#d63410] text-white cursor-pointer"
              }`}
            >
              <span style={monoStyle} className="flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  <>
                    CREATE ACCOUNT
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

          {/* Sign-in link */}
          <p className="text-center lg:text-left text-[13px] text-[#666] mt-8">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-[#1a1a1a] font-semibold hover:text-[#eb3a14] underline underline-offset-4 transition-colors"
            >
              Sign in →
            </Link>
          </p>

          {/* Free-tier badge — mobile only (desktop shows in terminal panel) */}
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