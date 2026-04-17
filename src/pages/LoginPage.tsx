import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, User, ArrowLeft, CheckCircle2, Loader2, Lock, Sparkles } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

// Stages:
//   "email"  — user enters email, clicks "Send OTP"
//   "setup"  — new user: enter display name (then OTP auto-sent)
//   "otp"    — enter the 6-digit code
type Stage = "email" | "setup" | "otp";

/* ── keyframe styles ─────────────────────────────────────────────────────── */
const STYLES = `
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes lp-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes lp-shake {
    0%,100% { transform: translateX(0);   }
    20%,60% { transform: translateX(-6px);}
    40%,80% { transform: translateX(6px); }
  }
  @keyframes lp-pop {
    0%   { transform: scale(0.92); opacity: 0; }
    60%  { transform: scale(1.03);             }
    100% { transform: scale(1);    opacity: 1; }
  }
  .lp-fade-up  { animation: lp-fade-up  0.38s cubic-bezier(.22,1,.36,1) both; }
  .lp-fade-in  { animation: lp-fade-in  0.28s ease both; }
  .lp-shake    { animation: lp-shake    0.38s ease;      }
  .lp-pop      { animation: lp-pop      0.32s cubic-bezier(.22,1,.36,1) both; }
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!document.getElementById("lp-styles")) {
      const tag = document.createElement("style");
      tag.id = "lp-styles";
      tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
  }, []);

  /* Focus management per stage */
  useEffect(() => {
    if (stage === "email") setTimeout(() => emailRef.current?.focus(), 100);
    if (stage === "setup") setTimeout(() => nameRef.current?.focus(), 100);
    if (stage === "otp") setTimeout(() => inputRefs.current[0]?.focus(), 200);
  }, [stage]);

  /* ── Stage 1: Email → check existence + send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/request-otp", { email });
      const userExists: boolean = res.data?.userExists ?? res.data?.data?.userExists ?? false;

      if (userExists) {
        // Existing user — go straight to OTP
        setStage("otp");
      } else {
        // New user — need name first
        setStage("setup");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Stage 2 (new users): Confirm name, then go to OTP ── */
  const handleSetupContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setError("");
    setStage("otp");
  };

  /* ── OTP input handlers ── */
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    const full = next.join("");
    if (full.length === 6) verifyOtp(full);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...pasted.split(""), ...Array(6 - pasted.length).fill("")].slice(0, 6);
    setOtp(next);
    if (pasted.length === 6) verifyOtp(pasted);
    else inputRefs.current[pasted.length]?.focus();
  };

  /* ── Stage 3: Verify OTP ── */
  const verifyOtp = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, string> = { email, otp: code };
      if (name.trim()) payload.name = name.trim(); // pass name for new users
      const res = await api.post("/auth/verify-otp", payload);
      setSuccess(true);
      setUser(res.data);
      setTimeout(() => navigate("/messengers", { replace: true }), 900);
    } catch (err: any) {
      setError(err.response?.data?.error || "Incorrect OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = /\S+@\S+\.\S+/.test(email);

  /* ── Title + subtitle per stage ── */
  const titles: Record<Stage, { h: string; sub: string }> = {
    email: { h: "Get started", sub: "Enter your email to continue." },
    setup: { h: "Set up profile", sub: "Welcome! Choose a display name to get started." },
    otp:   { h: "Verify email", sub: "We sent a 6-digit code to your inbox." },
  };

  const goBack = () => {
    setError("");
    setOtp(["", "", "", "", "", ""]);
    if (stage === "otp") {
      setStage(name ? "setup" : "email");
    } else if (stage === "setup") {
      setStage("email");
    } else {
      navigate("/welcome");
    }
  };

  return (
    <div className="lp-fade-in relative min-h-screen max-w-[430px] mx-auto flex flex-col overflow-hidden bg-background">
      {/* Ambient blobs */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "-10%", right: "-15%", width: 260, height: 260, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234,179,8,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: 0, left: "-10%", width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)",
          filter: "blur(35px)",
        }}
      />

      {/* Back arrow */}
      <button
        onClick={goBack}
        className="lp-fade-in relative z-10 m-5 w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        style={{ animationDelay: "0.05s" }}
      >
        <ArrowLeft size={17} />
      </button>

      <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-10">

        {/* Title block */}
        <div className="lp-fade-up mb-8" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            {titles[stage].h}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {titles[stage].sub}
          </p>
        </div>

        {/* ── STAGE: EMAIL ── */}
        {stage === "email" && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="lp-fade-up flex flex-col gap-1.5" style={{ animationDelay: "0.14s" }}>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email Address
              </label>
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200"
                style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }}
              >
                <Mail size={15} className="text-muted-foreground shrink-0" />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="lp-fade-in text-xs text-center text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={!isEmailValid || loading}
              className="lp-fade-up mt-4 w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                animationDelay: "0.20s",
                background: "hsl(var(--foreground))",
                color: "hsl(var(--background))",
                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending OTP…
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        )}

        {/* ── STAGE: SETUP (new user — enter name) ── */}
        {stage === "setup" && (
          <form onSubmit={handleSetupContinue} className="flex flex-col gap-4">

            {/* Locked email display */}
            <div className="lp-fade-up flex flex-col gap-1.5" style={{ animationDelay: "0.10s" }}>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{
                  background: "hsl(var(--secondary))",
                  border: "1.5px dashed hsl(var(--border))",
                }}
              >
                <Mail size={15} className="text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm text-foreground truncate">{email}</span>
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: "hsl(var(--border) / 0.3)",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <Lock size={9} />
                  locked
                </span>
              </div>
            </div>

            {/* New account hint */}
            <div
              className="lp-fade-up flex items-center gap-2.5 px-4 py-3 rounded-2xl"
              style={{ animationDelay: "0.14s", background: "hsl(142 70% 45% / 0.10)", border: "1px solid hsl(142 70% 45% / 0.25)" }}
            >
              <Sparkles size={14} className="text-green-500 shrink-0" />
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                No account found — let's create one for you!
              </p>
            </div>

            {/* Name field */}
            <div className="lp-fade-up flex flex-col gap-1.5" style={{ animationDelay: "0.18s" }}>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Display Name
              </label>
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200"
                style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }}
              >
                <User size={15} className="text-muted-foreground shrink-0" />
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Your name"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="lp-fade-in text-xs text-center text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={name.trim().length < 2 || loading}
              className="lp-fade-up mt-2 w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                animationDelay: "0.22s",
                background: "hsl(var(--foreground))",
                color: "hsl(var(--background))",
                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              }}
            >
              Continue
            </button>

            <p className="text-center text-xs text-muted-foreground mt-1">
              OTP was already sent to your email
            </p>
          </form>
        )}

        {/* ── STAGE: OTP ── */}
        {stage === "otp" && (
          <div className="flex flex-col gap-4">

            {/* Locked email display */}
            <div className="lp-fade-up flex flex-col gap-1.5" style={{ animationDelay: "0.10s" }}>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{
                  background: "hsl(var(--secondary))",
                  border: "1.5px dashed hsl(var(--border))",
                }}
              >
                <Mail size={15} className="text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm text-foreground truncate">{email}</span>
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: "hsl(var(--border) / 0.3)",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <Lock size={9} />
                  locked
                </span>
              </div>
            </div>

            {/* OTP inputs */}
            <div className="lp-fade-up flex flex-col gap-3 mt-2" style={{ animationDelay: "0.14s" }}>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                One-Time Password
              </label>

              <div
                className={`flex justify-between w-full ${error ? "lp-shake" : ""}`}
                key={error}
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading || success}
                    className="text-center text-lg font-bold rounded-xl border-2 outline-none transition-all duration-150 disabled:opacity-50"
                    style={{
                      width: "calc((100% - 5 * 10px) / 6)",
                      height: 52,
                      background: "hsl(var(--secondary))",
                      borderColor: error
                        ? "hsl(var(--destructive))"
                        : digit
                          ? "hsl(var(--foreground))"
                          : "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                      caretColor: "hsl(var(--foreground))",
                    }}
                  />
                ))}
              </div>

              {error && (
                <p className="lp-fade-in text-xs text-center text-destructive">{error}</p>
              )}

              {success && (
                <div className="lp-pop flex items-center justify-center gap-2 text-green-500">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold">Verified! Redirecting…</span>
                </div>
              )}

              {loading && !success && (
                <div className="lp-fade-in flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm">
                  <Loader2 size={15} className="animate-spin" />
                  Verifying…
                </div>
              )}

              {!success && (
                <button
                  type="button"
                  onClick={goBack}
                  className="text-xs text-muted-foreground underline underline-offset-2 text-center hover:text-foreground transition-colors duration-150 mt-1"
                >
                  Wrong email? Go back
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}