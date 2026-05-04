import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useIsDark } from "@/hooks/useIsDark";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const isDark = useIsDark();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setVisible(true);
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleClose = (cb: () => void) => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      cb();
    }, 280);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{
        backdropFilter: closing ? "blur(0px)" : "blur(6px)",
        WebkitBackdropFilter: closing ? "blur(0px)" : "blur(6px)",
        background: closing ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.45)",
        transition:
          "background 0.28s ease, backdrop-filter 0.28s ease, -webkit-backdrop-filter 0.28s ease",
      }}
      onClick={() => handleClose(onCancel)}
    >
      <style>{`
        @keyframes slideUp   { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(100%)} }
      `}</style>
      <div
        className="w-full max-w-[430px] rounded-t-[28px] overflow-hidden"
        style={{
          background: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.06)",
          boxShadow: isDark
            ? "0 -20px 60px rgba(0,0,0,0.45)"
            : "0 -10px 40px rgba(0,0,0,0.08)",
          animation: `${closing ? "slideDown" : "slideUp"} 0.28s cubic-bezier(0.34,1.2,0.64,1) both`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-6 pt-4 pb-2 flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-500/15" : "bg-primary/15"}`}
          >
            <AlertTriangle
              size={20}
              className={danger ? "text-red-500" : "text-primary"}
              strokeWidth={1.8}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-foreground leading-tight">
              {title}
            </h3>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="px-6 pb-8 pt-4 flex flex-col gap-2.5">
          <button
            ref={confirmRef}
            onClick={() => handleClose(onConfirm)}
            className={`w-full py-3.5 rounded-[16px] text-[15px] font-semibold transition-all active:scale-[0.97]
              ${
                danger
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={() => handleClose(onCancel)}
            className="w-full py-3.5 rounded-[16px] text-[15px] font-semibold transition-all active:scale-[0.97]"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.06)",
              color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)",
            }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
