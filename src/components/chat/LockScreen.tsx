import { useState, useRef, useEffect } from "react";
import { Lock, Eye, EyeOff, X } from "lucide-react";

interface LockScreenProps {
  /** "verify" = enter password to unlock. "set" = set a new password. */
  mode: "verify" | "set";
  chatUserName: string;
  chatUserAvatar?: string;
  onVerified: () => void;     // called when password correct or new password saved
  onCancel?: () => void;      // for "set" mode the user can cancel
  onSubmit: (password: string) => Promise<boolean>; // returns true if ok
}

export function LockScreen({ mode, chatUserName, chatUserAvatar, onVerified, onCancel, onSubmit }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 350);
  }, []);

  const handleSubmit = async () => {
    if (!password) { setError("Please enter a password"); return; }
    if (mode === "set" && password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters"); return; }

    setLoading(true);
    setError("");
    try {
      const ok = await onSubmit(password);
      if (ok) {
        onVerified();
      } else {
        setError("Incorrect password. Try again.");
        setPassword("");
        inputRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center px-8"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(24px) saturate(180%)",
        animation: "fadeIn 0.2s ease both",
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      {/* Cancel (set mode only) */}
      {mode === "set" && onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X size={18} className="text-white" />
        </button>
      )}

      {/* Avatar */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl">
          <img
            src={chatUserAvatar || "https://i.pravatar.cc/150"}
            alt={chatUserName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-black/50">
          <Lock size={13} className="text-white" />
        </div>
      </div>

      <h2 className="text-[22px] font-bold text-white mb-1">{chatUserName}</h2>
      <p className="text-[13px] text-white/50 mb-8">
        {mode === "verify"
          ? "Enter your chat password to unlock"
          : "Set a password to lock this chat"}
      </p>

      {/* Password field */}
      <div className="w-full max-w-[300px] flex flex-col gap-3">
        <div className="relative">
          <input
            ref={inputRef}
            type={show ? "text" : "password"}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && (mode === "verify" ? handleSubmit() : confirm ? handleSubmit() : document.getElementById("lock-confirm")?.focus())}
            placeholder="Password"
            maxLength={32}
            className="w-full bg-white/10 text-white placeholder:text-white/30 border border-white/15 rounded-[16px] px-4 py-3.5 pr-11 text-[16px] outline-none focus:border-primary/60 transition-colors"
          />
          <button
            onClick={() => setShow(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {mode === "set" && (
          <input
            id="lock-confirm"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Confirm password"
            maxLength={32}
            className="w-full bg-white/10 text-white placeholder:text-white/30 border border-white/15 rounded-[16px] px-4 py-3.5 text-[16px] outline-none focus:border-primary/60 transition-colors"
          />
        )}

        {error && (
          <p className="text-[12px] text-red-400 text-center animate-in slide-in-from-top-1">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-[16px] bg-primary text-primary-foreground text-[15px] font-semibold active:scale-[0.97] transition-all disabled:opacity-60"
        >
          {loading ? "Verifying…" : mode === "verify" ? "Unlock" : "Set Password"}
        </button>

        {mode === "verify" && (
          <p className="text-center text-[12px] text-white/30 mt-1">Forgot password? Ask admin to reset.</p>
        )}
      </div>
    </div>
  );
}
