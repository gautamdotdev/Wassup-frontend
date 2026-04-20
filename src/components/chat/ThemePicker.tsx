import { X } from "lucide-react";
import { useIsDark } from "@/hooks/useIsDark";

export type ChatTheme = "default" | "ocean" | "forest" | "sunset" | "lavender" | "midnight" | "rose";

export const THEMES: {
  id: ChatTheme;
  label: string;
  bg: string;
  bubble: string;
  text: string;
  otherBubble: string;
  otherText: string;
  hex?: string;
}[] = [
    {
      id: "default",
      label: "Default",
      bg: "bg-background",
      bubble: "bg-[#f0f0f0] dark:bg-[#2a2a2a]",
      text: "text-foreground",
      otherBubble: "bg-[#f0f0f0] dark:bg-[#2a2a2a]",
      otherText: "text-foreground",
      hex: "",
    },
    {
      id: "ocean",
      label: "Ocean",
      bg: "bg-[#0a1628]",
      bubble: "bg-[#0066cc]",
      text: "text-white",
      otherBubble: "bg-[#0a2a4a]",
      otherText: "text-blue-200",
      hex: "#0a1628",
    },
    {
      id: "forest",
      label: "Forest",
      bg: "bg-[#0d1f0d]",
      bubble: "bg-[#2d7a2d]",
      text: "text-white",
      otherBubble: "bg-[#1a3a1a]",
      otherText: "text-green-200",
      hex: "#0d1f0d",
    },
    {
      id: "sunset",
      label: "Sunset",
      bg: "bg-[#1a0a00]",
      bubble: "bg-[#e85d04]",
      text: "text-white",
      otherBubble: "bg-[#2a1200]",
      otherText: "text-orange-200",
      hex: "#1a0a00",
    },
    {
      id: "lavender",
      label: "Lavender",
      bg: "bg-[#13001f]",
      bubble: "bg-[#8b5cf6]",
      text: "text-white",
      otherBubble: "bg-[#220033]",
      otherText: "text-purple-200",
      hex: "#13001f",
    },
    {
      id: "midnight",
      label: "Midnight",
      bg: "bg-[#020c1b]",
      bubble: "bg-[#1d4ed8]",
      text: "text-white",
      otherBubble: "bg-[#060f2e]",
      otherText: "text-blue-200",
      hex: "#020c1b",
    },
    {
      id: "rose",
      label: "Rose",
      bg: "bg-[#1f0010]",
      bubble: "bg-[#e11d48]",
      text: "text-white",
      otherBubble: "bg-[#280010]",
      otherText: "text-pink-200",
      hex: "#1f0010",
    },
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
              className="flex flex-col items-center gap-2 group"
            >
              {console.log(t)}
              {/* Improved preview — header strip + received + sent bubbles */}
              <div
                className={`w-full rounded-2xl overflow-hidden border-2 transition-all ${currentTheme === t.id ? "border-primary scale-105" : "border-transparent"
                  } ${t.bg}`}
                style={{ aspectRatio: "4/3" }}
              >
                {/* Header strip */}
                <div className="flex items-center gap-1 px-2 pt-2 pb-1">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="h-1.5 w-8 rounded-full bg-white/20" />
                </div>
                {/* Received bubble */}
                <div className="px-2 mb-1.5">
                  <div className={`h-3 w-[55%] rounded-full ${t.otherBubble} opacity-80 rounded-bl-sm`} />
                </div>
                {/* Sent bubbles */}
                <div className="flex justify-end px-2 mb-1">
                  <div className={`h-3 w-[65%] rounded-full ${t.bubble} opacity-90 rounded-br-sm`} />
                </div>
                <div className="flex justify-end px-2">
                  <div className={`h-3 w-[40%] rounded-full ${t.bubble} opacity-90 rounded-br-sm`} />
                </div>
              </div>
              <span
                className={`text-[11px] font-medium ${currentTheme === t.id ? "text-primary" : "text-muted-foreground"
                  }`}
              >
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
    otherBubbleBg: t.otherBubble,
    otherBubbleText: t.otherText,
    msgBg: t.bg,
  };
}