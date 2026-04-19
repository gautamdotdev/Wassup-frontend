import { X } from "lucide-react";
import { useIsDark } from "@/hooks/useIsDark";

export type ChatTheme = "default" | "ocean" | "forest" | "sunset" | "lavender" | "midnight" | "rose";

export const THEMES: { id: ChatTheme; label: string; bg: string; bubble: string; text: string }[] = [
  { id: "default", label: "Default", bg: "bg-background", bubble: "bg-[#f0f0f0] dark:bg-[#2a2a2a]", text: "text-foreground" },
  { id: "ocean", label: "Ocean", bg: "bg-[#0a1628]", bubble: "bg-[#0066cc]", text: "text-white" },
  { id: "forest", label: "Forest", bg: "bg-[#0d1f0d]", bubble: "bg-[#2d7a2d]", text: "text-white" },
  { id: "sunset", label: "Sunset", bg: "bg-[#1a0a00]", bubble: "bg-[#e85d04]", text: "text-white" },
  { id: "lavender", label: "Lavender", bg: "bg-[#13001f]", bubble: "bg-[#8b5cf6]", text: "text-white" },
  { id: "midnight", label: "Midnight", bg: "bg-[#020c1b]", bubble: "bg-[#1d4ed8]", text: "text-white" },
  { id: "rose", label: "Rose", bg: "bg-[#1f0010]", bubble: "bg-[#e11d48]", text: "text-white" },
];

interface ThemePickerProps {
  currentTheme: ChatTheme;
  onSelect: (theme: ChatTheme) => void;
  onClose: () => void;
}

export function ThemePicker({ currentTheme, onSelect, onClose }: ThemePickerProps) {
  const isDark = useIsDark();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-[28px] overflow-hidden"
        style={{
          background: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.45)",
          animation: "slideUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both",
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 via-violet-500 to-blue-500" />
            <h3 className="text-[17px] font-bold text-foreground">Chat Theme</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <p className="text-[12px] text-muted-foreground px-6 pb-3">Choose a theme for this conversation</p>

        {/* Theme grid */}
        <div className="px-5 pb-8 grid grid-cols-4 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`flex flex-col items-center gap-2 group`}
            >
              <div className={`w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all ${currentTheme === t.id ? "border-primary scale-105" : "border-transparent"} ${t.bg}`}>
                <div className="flex flex-col justify-end h-full p-1.5 gap-1">
                  <div className={`self-end h-3 w-[70%] rounded-full ${t.bubble} opacity-90`} />
                  <div className="self-start h-3 w-[55%] rounded-full bg-muted-foreground/30" />
                  <div className={`self-end h-3 w-[50%] rounded-full ${t.bubble} opacity-90`} />
                </div>
              </div>
              <span className={`text-[11px] font-medium ${currentTheme === t.id ? "text-primary" : "text-muted-foreground"}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getThemeStyles(theme: ChatTheme) {
  const t = THEMES.find(x => x.id === theme) || THEMES[0];
  return {
    myBubbleBg: t.bubble,
    myBubbleText: t.text,
    msgBg: t.bg,
  };
}