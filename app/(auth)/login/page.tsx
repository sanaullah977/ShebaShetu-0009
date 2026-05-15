"use client"

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  UserRound, ClipboardList, Stethoscope, ArrowRight, Mail, Lock,
  Sparkles, ShieldCheck, Activity, Eye, EyeOff, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Role = "PATIENT" | "RECEPTION" | "DOCTOR" | "ADMIN";

const ROLES: { id: Role; label: string; sub: string; icon: any; tint: string }[] = [
  { id: "PATIENT", label: "Patient", sub: "Book, queue & track visits", icon: UserRound, tint: "from-emerald-500/20 to-emerald-500/5" },
  { id: "RECEPTION", label: "Reception", sub: "Manage queues & schedules", icon: ClipboardList, tint: "from-orange-400/20 to-orange-400/5" },
  { id: "DOCTOR", label: "Doctor", sub: "See patients & reports", icon: Stethoscope, tint: "from-sky-400/20 to-sky-400/5" },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [selected, setSelected] = useState<Role>("PATIENT");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [forgot, setForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const router = useRouter();

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!email) {
      toast.error("Email is required.");
      return;
    }

    if (!emailPattern.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    if (!password) {
      toast.error("Password is required.");
      return;
    }

    if (mode === "register") {
      if (name.length < 2) {
        toast.error("Name must be at least 2 characters.");
        return;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Password and confirmation do not match.");
        return;
      }
    }

    setLoading(true);
    formData.set("email", email);
    formData.set("role", selected);

    try {
      if (mode === "register") {
        const { register } = await import("@/app/actions/auth");
        const result = await register(formData);

        if (!result.success) {
          toast.error(result.error || "Registration failed");
          setLoading(false);
          return;
        }

        toast.success("Account created! Signing you in...");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Authentication failed. Please check your credentials.");
      } else {
        toast.success(mode === "login" ? "Welcome back!" : "Account ready!");
        router.push("/");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (forgotLoading) return;

    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Email is required.");
      return;
    }

    if (!emailPattern.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    const formData = new FormData();
    formData.set("email", email);
    setForgotLoading(true);
    setForgotMessage("");

    try {
      const { requestPasswordReset } = await import("@/app/actions/auth");
      const result = await requestPasswordReset(formData);

      if (result.success) {
        const message = result.message || "Password reset request submitted. Please contact support or check your email if email service is configured.";
        setForgotMessage(message);
        toast.success("Password reset request submitted.");
      } else {
        toast.error(result.error || "Unable to submit password reset request.");
      }
    } catch (error) {
      toast.error("Unable to submit password reset request.");
    } finally {
      setForgotLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden border-r border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-page" />
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-[26rem] h-[26rem] rounded-full bg-sky-500/15 blur-[120px]" />

        <Logo />

        <div className="space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-[11px] font-medium">
            <span className="live-dot" />
            Live in 12 hospitals across Dhaka & Chattogram
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
            Skip the chaos.<br />
            <span className="text-gradient-emerald">Walk in calm.</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            ShebaSetu uses AI to guide you to the right department, gives you a digital
            token, and shows your live position so you only arrive when it is your turn.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Sparkles, label: "AI Guidance" },
              { icon: Activity, label: "Live Queue" },
              { icon: ShieldCheck, label: "Private & secure" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="glass rounded-xl p-3 text-center">
                <Icon className="h-4 w-4 mx-auto text-primary mb-1.5" />
                <div className="text-[11px] font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          (c) {new Date().getFullYear()} ShebaSetu - Made for Bangladesh outpatient care
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center">
            <Logo />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose your role to continue.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const active = selected === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelected(role.id)}
                  className={cn(
                    "relative rounded-2xl p-3 text-left transition-all overflow-hidden",
                    "glass glass-hover",
                    active && "ring-1 ring-primary/60 shadow-glow"
                  )}
                >
                  <div className={cn("absolute inset-0 -z-10 bg-gradient-to-br opacity-60", role.tint)} />
                  <Icon className={cn("h-5 w-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-sm font-semibold">{role.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{role.sub}</div>
                  {active && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary shadow-glow" />}
                </button>
              );
            })}
          </div>

          <GlassCard variant="strong">
            <form onSubmit={handleAuth} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" placeholder="Enter your full name" autoComplete="name" required />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" name="email" type="email" className="pl-9" placeholder="you@example.com" autoComplete="email" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgot(true);
                        setForgotMessage("");
                      }}
                      className="text-[11px] text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-9 pr-11"
                    placeholder="********"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-9 pr-11"
                      placeholder="********"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-pressed={showConfirmPassword}
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-emerald text-primary-foreground font-semibold hover:opacity-95 shadow-glow"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Processing..." : (mode === "login" ? "Sign in" : "Create account")}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                {mode === "login" ? "New to ShebaSetu?" : "Already have an account?"}{" "}
                <button type="button" className="text-primary font-medium hover:underline" onClick={switchMode}>
                  {mode === "login" ? "Create an account" : "Sign in"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>

      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent className="glass-strong border-border/60 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter the email tied to your ShebaSetu account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset">Email address</Label>
              <Input
                id="reset"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(event) => {
                  setForgotEmail(event.target.value);
                  setForgotMessage("");
                }}
                autoComplete="email"
                required
              />
            </div>
            {forgotMessage && (
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                {forgotMessage}
              </div>
            )}
            <Button type="submit" disabled={forgotLoading} className="w-full bg-gradient-emerald text-primary-foreground shadow-glow">
              {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit reset request
            </Button>
            <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => setForgot(false)}>
              Back to login
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
