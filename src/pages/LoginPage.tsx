import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, User, ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

type Stage = "form" | "otp";

/* ── keyframe styles injected once ───────────────────── */
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!document.getElementById("lp-styles")) {
      const tag = document.createElement("style");
      tag.id = "lp-styles";
      tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => {
    if (stage === "otp") {
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [stage]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/request-otp", { name, email });
      setStage("otp");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

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

  const verifyOtp = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/verify-otp", { email, otp: code });
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

  const isFormValid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

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
      {stage === "form" && (
        <button
          onClick={() => navigate("/welcome")}
          className="lp-fade-in relative z-10 m-5 w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          style={{ animationDelay: "0.05s" }}
        >
          <ArrowLeft size={17} />
        </button>
      )}

      <div className="relative z-10 flex flex-col flex-1 px-6 pt-4 pb-10">

        {/* Title block */}
        <div className="lp-fade-up mb-8" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            {stage === "form" ? "Get started" : "Verify email"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {stage === "form"
              ? "Enter your name & email to continue."
              : "We sent a 6-digit code to your inbox."}
          </p>
        </div>

        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">

          {/* Name field */}
          <div className="lp-fade-up flex flex-col gap-1.5" style={{ animationDelay: "0.14s" }}>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Full Name
            </label>
            <div
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200"
              style={{
                background: "hsl(var(--secondary))",
                borderColor: stage === "otp" ? "transparent" : "hsl(var(--border))",
                opacity: stage === "otp" ? 0.5 : 1,
              }}
            >
              <User size={15} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={stage === "otp"}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email field — editable on form stage, read-only display on otp stage */}
          <div className="lp-fade-up flex flex-col gap-1.5" style={{ animationDelay: "0.20s" }}>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Email
            </label>

            {stage === "otp" ? (
              /* clean read-only row — no input element at all */
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
            ) : (
              /* normal editable input */
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200"
                style={{
                  background: "hsl(var(--secondary))",
                  borderColor: "hsl(var(--border))",
                }}
              >
                <Mail size={15} className="text-muted-foreground shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            )}
          </div>

          {/* OTP section */}
          {stage === "otp" && (
            <div
              className="lp-fade-up flex flex-col gap-3 mt-2"
              style={{ animationDelay: "0.05s" }}
            >
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

              {!success && (
                <button
                  type="button"
                  onClick={() => {
                    setStage("form");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-2 text-center hover:text-foreground transition-colors duration-150"
                >
                  Wrong email? Go back
                </button>
              )}
            </div>
          )}

          {/* Continue button */}
          {stage === "form" && (
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="lp-fade-up mt-4 w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                animationDelay: "0.26s",
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
                "Continue"
              )}
            </button>
          )}

          {stage === "otp" && loading && !success && (
            <div className="lp-fade-in flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm">
              <Loader2 size={15} className="animate-spin" />
              Verifying…
            </div>
          )}
        </form>
      </div>
    </div>
  );
}