"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Logo ---
const Logo = () => (
  <div className="flex items-center justify-center gap-2 font-display text-lg font-bold tracking-tighter mb-8">
    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
      <div className="w-3.5 h-3.5 bg-black rounded-sm" />
    </div>
    TechPrep
  </div>
);

// --- Input ---
const InputField = ({
  label, id, type = "text", placeholder, value, onChange, error, children
}: {
  label: string; id: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; error?: string; children?: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-semibold text-white/60 uppercase tracking-widest">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all duration-200
          ${error
            ? "border-rose-500/50 focus:border-rose-500/80 focus:bg-rose-500/[0.03]"
            : "border-white/10 focus:border-white/30 focus:bg-white/[0.06]"
          }`}
      />
      {children}
    </div>
    {error && (
      <p className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-1">
        {error}
      </p>
    )}
  </div>
);

// --- OAuth Button ---
const OAuthButton = ({
  icon, label, onClick
}: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-white/70 hover:bg-white/[0.07] hover:border-white/20 hover:text-white transition-all duration-200 group"
  >
    {icon}
    {label}
  </button>
);

// --- Google Icon ---
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// --- GitHub Icon ---
const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

// --- Divider ---
const OrDivider = () => (
  <div className="relative flex items-center gap-4">
    <div className="flex-1 h-px bg-white/[0.07]" />
    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/20">or continue with</span>
    <div className="flex-1 h-px bg-white/[0.07]" />
  </div>
);

// --- Main Page ---
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:3001/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username ?? "");
        router.push("/dsa");
      } else {
        setServerError(data.message || "Sign in failed. Please try again.");
      }
    } catch {
      setServerError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white dot-background flex items-center justify-center px-4 py-16 selection:bg-white selection:text-black">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <Logo />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold tracking-tight mb-1.5">Welcome back</h1>
            <p className="text-sm text-white/40">Sign in to continue your placement prep</p>
          </div>

          <div className="h-px bg-white/[0.07] mb-8" />

          {/* Form */}
          {serverError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 font-medium">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <InputField
              label="Email"
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />

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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </InputField>

            {/* Forgot password */}
            <div className="flex justify-end -mt-2">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-white/40 hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-white/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* OAuth */}
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

          {/* Footer link */}
          <p className="text-center text-xs text-white/30 font-medium mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-white font-semibold hover:underline underline-offset-4 transition-colors"
            >
              Sign up →
            </Link>
          </p>
        </div>

        {/* Bottom badge */}
        <p className="text-center text-[10px] text-white/15 font-medium mt-6 uppercase tracking-widest">
          Free forever for students · No credit card required
        </p>
      </div>
    </div>
  );
}