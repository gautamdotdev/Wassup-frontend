import { useState } from "react";
import { X, ArrowLeft, Check } from "lucide-react";
import { useIsDark } from "@/hooks/useIsDark";

export type ChatTheme =
  | "default"
  | "ocean"
  | "forest"
  | "sunset"
  | "lavender"
  | "midnight"
  | "rose"
  | "love"
  | "flirt"
  | "monochrome"
  | "basketball"
  | "galaxy"
  | "aurora"
  | "cherry";

export interface ThemeDef {
  id: ChatTheme;
  label: string;
  badge?: string;
  chatBg: string;
  hex: string;
  headerBg: string;
  bottomBg: string;
  msgMenuBg: string;
  msgMenuBorder: string;
  myBubble: string;
  myBubbleText: string;
  otherBubble: string;
  otherBubbleText: string;
  mutedText: string;
  thumbBg: string;
  thumbMine: string;
  thumbOther: string;
  animated?: boolean;
}

export const THEMES: ThemeDef[] = [
  {
    id: "default",
    label: "Default",
    chatBg: "",
    hex: "#ffffff",
    headerBg: "",
    bottomBg: "",
    msgMenuBg: "",
    msgMenuBorder: "",
    myBubble: "",
    myBubbleText: "",
    otherBubble: "",
    otherBubbleText: "",
    mutedText: "",
    thumbBg: "#18181b",
    thumbMine: "#3f3f46",
    thumbOther: "#27272a",
  },
  {
    id: "monochrome",
    label: "Monochrome",
    chatBg: "#0d0d0d",
    hex: "#0d0d0d",
    headerBg: "#0d0d0d",
    bottomBg: "#0d0d0d",
    msgMenuBg: "rgba(28,28,28,0.95)",
    msgMenuBorder: "rgba(255,255,255,0.08)",
    myBubble: "#3a3a3a",
    myBubbleText: "#ffffff",
    otherBubble: "#1e1e1e",
    otherBubbleText: "#e5e5e5",
    mutedText: "rgba(255,255,255,0.4)",
    thumbBg: "#0d0d0d",
    thumbMine: "#3a3a3a",
    thumbOther: "#1e1e1e",
  },
  {
    id: "ocean",
    label: "Ocean",
    chatBg: "linear-gradient(160deg, #0a1628 0%, #0a2a4a 50%, #0a1628 100%)",
    hex: "#0a1628",
    headerBg: "#0a1628",
    bottomBg: "#0a1628",
    msgMenuBg: "rgba(10,26,40,0.95)",
    msgMenuBorder: "rgba(147,197,253,0.15)",
    myBubble: "#0066cc",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(10,42,74,0.85)",
    otherBubbleText: "#93c5fd",
    mutedText: "rgba(147,197,253,0.6)",
    thumbBg: "#0a1628",
    thumbMine: "#0066cc",
    thumbOther: "#0a2a4a",
  },
  {
    id: "forest",
    label: "Forest",
    chatBg: "linear-gradient(160deg, #0d1f0d 0%, #1a3a1a 60%, #0d1f0d 100%)",
    hex: "#0d1f0d",
    headerBg: "#0d1f0d",
    bottomBg: "#0d1f0d",
    msgMenuBg: "rgba(13,31,13,0.95)",
    msgMenuBorder: "rgba(134,239,172,0.15)",
    myBubble: "#2d7a2d",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(26,58,26,0.85)",
    otherBubbleText: "#86efac",
    mutedText: "rgba(134,239,172,0.6)",
    thumbBg: "#0d1f0d",
    thumbMine: "#2d7a2d",
    thumbOther: "#1a3a1a",
  },
  {
    id: "sunset",
    label: "Sunset",
    chatBg: "linear-gradient(160deg, #1a0a00 0%, #2d1000 50%, #1a0500 100%)",
    hex: "#1a0a00",
    headerBg: "#1a0a00",
    bottomBg: "#1a0a00",
    msgMenuBg: "rgba(26,10,0,0.95)",
    msgMenuBorder: "rgba(253,186,116,0.15)",
    myBubble: "#e85d04",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(42,18,0,0.85)",
    otherBubbleText: "#fdba74",
    mutedText: "rgba(253,186,116,0.6)",
    thumbBg: "#1a0a00",
    thumbMine: "#e85d04",
    thumbOther: "#2a1200",
  },
  {
    id: "lavender",
    label: "Lavender",
    chatBg: "linear-gradient(160deg, #13001f 0%, #1e0033 60%, #130020 100%)",
    hex: "#13001f",
    headerBg: "#13001f",
    bottomBg: "#13001f",
    msgMenuBg: "rgba(19,0,31,0.95)",
    msgMenuBorder: "rgba(196,181,253,0.15)",
    myBubble: "#8b5cf6",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(34,0,51,0.85)",
    otherBubbleText: "#c4b5fd",
    mutedText: "rgba(196,181,253,0.6)",
    thumbBg: "#13001f",
    thumbMine: "#8b5cf6",
    thumbOther: "#220033",
  },
  {
    id: "midnight",
    label: "Midnight",
    chatBg: "linear-gradient(160deg, #020c1b 0%, #060f2e 60%, #020c1b 100%)",
    hex: "#020c1b",
    headerBg: "#020c1b",
    bottomBg: "#020c1b",
    msgMenuBg: "rgba(2,12,27,0.95)",
    msgMenuBorder: "rgba(147,197,253,0.15)",
    myBubble: "#1d4ed8",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(6,15,46,0.85)",
    otherBubbleText: "#93c5fd",
    mutedText: "rgba(147,197,253,0.6)",
    thumbBg: "#020c1b",
    thumbMine: "#1d4ed8",
    thumbOther: "#060f2e",
  },
  {
    id: "rose",
    label: "Rose",
    chatBg: "linear-gradient(160deg, #1f0010 0%, #280010 60%, #1f0010 100%)",
    hex: "#1f0010",
    headerBg: "#1f0010",
    bottomBg: "#1f0010",
    msgMenuBg: "rgba(31,0,16,0.95)",
    msgMenuBorder: "rgba(253,164,175,0.15)",
    myBubble: "#e11d48",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(40,0,16,0.85)",
    otherBubbleText: "#fda4af",
    mutedText: "rgba(253,164,175,0.6)",
    thumbBg: "#1f0010",
    thumbMine: "#e11d48",
    thumbOther: "#280010",
  },
  {
    id: "love",
    label: "Love",
    badge: "Animated",
    chatBg: "linear-gradient(160deg, #4a0072 0%, #8b0057 50%, #4a0072 100%)",
    hex: "#4a0072",
    headerBg: "linear-gradient(135deg, #3a005a 0%, #6e0044 100%)",
    bottomBg:
      "linear-gradient(to top, #3a005a 0%, #6e004480 60%, transparent 100%)",
    msgMenuBg: "rgba(74,0,114,0.92)",
    msgMenuBorder: "rgba(255,105,180,0.25)",
    myBubble: "#ff1f8e",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(80,0,80,0.7)",
    otherBubbleText: "#f9a8d4",
    mutedText: "rgba(255,255,255,0.5)",
    thumbBg: "#4a0072",
    thumbMine: "#ff1f8e",
    thumbOther: "#700055",
    animated: true,
  },
  {
    id: "flirt",
    label: "Flirt",
    chatBg: "linear-gradient(160deg, #3b0a4f 0%, #5c1040 60%, #3b0a4f 100%)",
    hex: "#3b0a4f",
    headerBg: "#3b0a4f",
    bottomBg: "#3b0a4f",
    msgMenuBg: "rgba(59,10,79,0.95)",
    msgMenuBorder: "rgba(244,114,182,0.2)",
    myBubble: "#f9a8d4",
    myBubbleText: "#3b0a4f",
    otherBubble: "rgba(70,10,90,0.75)",
    otherBubbleText: "#f0abfc",
    mutedText: "rgba(255,255,255,0.5)",
    thumbBg: "#3b0a4f",
    thumbMine: "#f9a8d4",
    thumbOther: "#5c1040",
  },
  {
    id: "basketball",
    label: "Basketball",
    chatBg: "#1a1a1a",
    hex: "#1a1a1a",
    headerBg: "#1a1a1a",
    bottomBg: "#1a1a1a",
    msgMenuBg: "rgba(26,26,26,0.95)",
    msgMenuBorder: "rgba(255,255,255,0.08)",
    myBubble: "#2a3a2a",
    myBubbleText: "#e5e7eb",
    otherBubble: "rgba(31,42,31,0.9)",
    otherBubbleText: "#d1d5db",
    mutedText: "rgba(255,255,255,0.4)",
    thumbBg: "#1a1a1a",
    thumbMine: "#2a3a2a",
    thumbOther: "#1f2a1f",
  },
  {
    id: "galaxy",
    label: "Galaxy",
    badge: "Animated",
    chatBg: "linear-gradient(135deg, #0a0015 0%, #120025 40%, #050010 100%)",
    hex: "#0a0015",
    headerBg: "#0a0015",
    bottomBg: "#0a0015",
    msgMenuBg: "rgba(10,0,21,0.95)",
    msgMenuBorder: "rgba(233,213,255,0.15)",
    myBubble: "#7c3aed",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(20,0,40,0.8)",
    otherBubbleText: "#e9d5ff",
    mutedText: "rgba(233,213,255,0.5)",
    thumbBg: "#0a0015",
    thumbMine: "#7c3aed",
    thumbOther: "#14002a",
    animated: true,
  },
  {
    id: "aurora",
    label: "Aurora",
    badge: "Animated",
    chatBg: "linear-gradient(160deg, #001a1a 0%, #001520 60%, #001a1a 100%)",
    hex: "#001a1a",
    headerBg: "#001a1a",
    bottomBg: "#001a1a",
    msgMenuBg: "rgba(0,26,26,0.95)",
    msgMenuBorder: "rgba(94,234,212,0.15)",
    myBubble: "#0d9488",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(0,30,30,0.8)",
    otherBubbleText: "#5eead4",
    mutedText: "rgba(94,234,212,0.5)",
    thumbBg: "#001a1a",
    thumbMine: "#0d9488",
    thumbOther: "#001e1e",
    animated: true,
  },
  {
    id: "cherry",
    label: "Cherry",
    chatBg: "linear-gradient(160deg, #1a0010 0%, #2a0018 60%, #1a0010 100%)",
    hex: "#1a0010",
    headerBg: "#1a0010",
    bottomBg: "#1a0010",
    msgMenuBg: "rgba(26,0,16,0.95)",
    msgMenuBorder: "rgba(253,164,175,0.15)",
    myBubble: "#be123c",
    myBubbleText: "#ffffff",
    otherBubble: "rgba(42,0,24,0.85)",
    otherBubbleText: "#fda4af",
    mutedText: "rgba(253,164,175,0.5)",
    thumbBg: "#1a0010",
    thumbMine: "#be123c",
    thumbOther: "#2a0018",
  },
];

// ── Animated Background Components ──────────────────────────────────────────

function LoveParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes floatHeart {
          0%   { transform: translateY(0) scale(1) rotate(var(--r)); opacity: 0; }
          10%  { opacity: var(--op); }
          90%  { opacity: var(--op); }
          100% { transform: translateY(-110vh) scale(var(--s)) rotate(calc(var(--r) + 30deg)); opacity: 0; }
        }
        @keyframes lovePulse {
          0%,100% { transform: scale(1); opacity: 0.06; }
          50%      { transform: scale(1.08); opacity: 0.12; }
        }
        .love-heart {
          position: absolute; bottom: -60px;
          animation: floatHeart var(--dur) var(--delay) infinite ease-in-out;
          font-size: var(--fsize); user-select: none;
        }
        .love-glow {
          position: absolute; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,31,142,0.35) 0%, transparent 70%);
          animation: lovePulse var(--dur) var(--delay) infinite ease-in-out;
        }
      `}</style>

      {/* Glow orbs */}
      {[
        { w: 300, h: 300, top: "10%", left: "-10%", dur: "6s", del: "0s" },
        { w: 250, h: 250, top: "50%", right: "-8%", dur: "8s", del: "-3s" },
        { w: 200, h: 200, top: "75%", left: "20%", dur: "7s", del: "-5s" },
      ].map((g, i) => (
        <div
          key={`g${i}`}
          className="love-glow"
          style={
            {
              width: g.w,
              height: g.h,
              top: g.top,
              left: (g as any).left ?? undefined,
              right: (g as any).right ?? undefined,
              "--dur": g.dur,
              "--delay": g.del,
            } as any
          }
        />
      ))}

      {/* Floating hearts */}
      {(() => {
        const emojis = [
          "❤️",
          "💕",
          "💗",
          "💓",
          "🩷",
          "💖",
          "💝",
          "💘",
          "🧡",
          "💛",
          "💚",
          "💙",
          "🩵",
          "💜",
          "🤎",
          "🖤",
          "🩶",
          "🤍",
          "💔",
          "❤️‍🩹",
          "❤️‍🔥",
          "💞",
          "💟",
          "❣️",
          "💌",
          "🫀",
          "♥",
          "♡",
          "❤",
          "❥",
          "❦",
          "❧",
          "☙",
          "ღ",
          "ෆ",
          "😍",
          "🥰",
          "😘",
          "😚",
          "😻",
          "💋",
          "🫶",
          "🤟",
        ];
        return Array.from({ length: emojis.length }).map((_, i) => (
          <span
            key={i}
            className="love-heart"
            style={
              {
                left: `${5 + ((i * 5.5) % 90)}%`,
                "--dur": `${6 + ((i * 1.3) % 8)}s`,
                "--delay": `${-(i * 0.7) % 8}s`,
                "--fsize": `${16 + ((i * 7) % 24)}px`,
                "--r": `${-15 + ((i * 11) % 30)}deg`,
                "--s": `${0.8 + ((i * 0.1) % 0.6)}`,
                "--op": `${0.55 + ((i * 0.06) % 0.35)}`,
              } as any
            }
          >
            {emojis[i]}
          </span>
        ));
      })()}
    </div>
  );
}

function GalaxyStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes twinkle {
          0%,100% { opacity: 0.1; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes shoot {
          0%   { transform: translateX(0) translateY(0) rotate(-30deg); opacity: 1; }
          100% { transform: translateX(180px) translateY(60px) rotate(-30deg); opacity: 0; }
        }
        .g-star { position: absolute; border-radius: 50%; background: white; animation: twinkle var(--d) var(--del) infinite; }
        .g-shoot { position: absolute; width: 50px; height: 1.5px; background: linear-gradient(90deg,white,transparent); border-radius: 9999px; animation: shoot var(--d) var(--del) infinite; }
      `}</style>
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="g-star"
          style={
            {
              left: `${(i * 17.3) % 100}%`,
              top: `${(i * 13.7) % 100}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              "--d": `${1.5 + ((i * 0.4) % 3)}s`,
              "--del": `${-(i * 0.25) % 3}s`,
            } as any
          }
        />
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`s${i}`}
          className="g-shoot"
          style={
            {
              left: `${(i * 30) % 70}%`,
              top: `${(i * 20) % 40}%`,
              "--d": `${4 + i * 2}s`,
              "--del": `${-(i * 3)}s`,
            } as any
          }
        />
      ))}
    </div>
  );
}

function AuroraWaves() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes aw1 { 0%,100%{transform:translateX(-20%) scaleY(1);opacity:.25} 50%{transform:translateX(20%) scaleY(1.3);opacity:.45} }
        @keyframes aw2 { 0%,100%{transform:translateX(15%) scaleY(.9);opacity:.2} 50%{transform:translateX(-15%) scaleY(1.2);opacity:.4} }
        .aurora-band { position:absolute; width:200%; left:-50%; border-radius:9999px; filter:blur(40px); }
      `}</style>
      <div
        className="aurora-band"
        style={{
          height: "35%",
          top: "10%",
          background: "linear-gradient(90deg,#00ffcc,#00bfff,#7fffaa)",
          animation: "aw1 6s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-band"
        style={{
          height: "30%",
          top: "30%",
          background: "linear-gradient(90deg,#00e5ff,#00ff88,#00ccff)",
          animation: "aw2 8s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-band"
        style={{
          height: "25%",
          top: "50%",
          background: "linear-gradient(90deg,#00ffaa,#00e5ff,#00ff99)",
          animation: "aw1 10s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}

function BasketballBg() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.08 }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="50%"
          cy="42%"
          r="90"
          fill="none"
          stroke="#aaa"
          strokeWidth="1.5"
        />
        <circle
          cx="50%"
          cy="42%"
          r="22"
          fill="none"
          stroke="#aaa"
          strokeWidth="1.5"
        />
        <line
          x1="0"
          y1="42%"
          x2="100%"
          y2="42%"
          stroke="#aaa"
          strokeWidth="1"
          strokeDasharray="5 5"
        />
        <path
          d="M 40 75% Q 50% 8%, 60% 75%"
          fill="none"
          stroke="#aaa"
          strokeWidth="1.5"
          transform="scale(2.5) translate(-15,0)"
        />
      </svg>
    </div>
  );
}

function FlirtBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes floatBlob {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-18px) scale(1.06); }
        }
        .flirt-blob { position: absolute; border-radius: 50%; filter: blur(50px); }
      `}</style>
      {[
        {
          w: 160,
          h: 160,
          top: "8%",
          left: "-5%",
          bg: "rgba(244,114,182,0.25)",
          dur: "7s",
          del: "0s",
        },
        {
          w: 120,
          h: 120,
          top: "55%",
          left: "8%",
          bg: "rgba(192,38,211,0.2)",
          dur: "9s",
          del: "-3s",
        },
        {
          w: 200,
          h: 200,
          top: "28%",
          right: "-8%",
          bg: "rgba(244,114,182,0.2)",
          dur: "11s",
          del: "-5s",
        },
        {
          w: 80,
          h: 80,
          top: "72%",
          right: "18%",
          bg: "rgba(250,168,212,0.3)",
          dur: "6s",
          del: "-2s",
        },
      ].map((b, i) => (
        <div
          key={i}
          className="flirt-blob"
          style={{
            width: b.w,
            height: b.h,
            top: b.top,
            left: b.left ?? undefined,
            right: (b as any).right ?? undefined,
            background: b.bg,
            animation: `floatBlob ${b.dur} ${b.del} infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedBg({ themeId }: { themeId: ChatTheme }) {
  if (themeId === "love") return <LoveParticles />;
  if (themeId === "galaxy") return <GalaxyStars />;
  if (themeId === "aurora") return <AuroraWaves />;
  if (themeId === "basketball") return <BasketballBg />;
  if (themeId === "flirt") return <FlirtBlobs />;
  return null;
}

// ── ThemePicker ──────────────────────────────────────────────────────────────

const PREVIEW_MESSAGES = [
  { isMe: false, text: "Every theme creates a unique experience." },
  { isMe: true, text: "You'll see the messages you send in this color." },
  {
    isMe: false,
    text: "And the messages you receive from other people in this color.",
  },
  {
    isMe: true,
    text: "Tap Select to choose this theme or Cancel to preview others.",
  },
];

interface ThemePickerProps {
  currentTheme: ChatTheme;
  chatUser?: { name?: string; avatar?: string };
  onSelect: (theme: ChatTheme) => void;
  onClose: () => void;
}

export function ThemePicker({
  currentTheme,
  chatUser,
  onSelect,
  onClose,
}: ThemePickerProps) {
  const isDark = useIsDark();
  const [previewing, setPreviewing] = useState<ChatTheme | null>(null);

  const previewTheme = previewing
    ? THEMES.find((t) => t.id === previewing)!
    : null;
  const now = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const openPreview = (id: ChatTheme) => setPreviewing(id);
  const closePreview = () => setPreviewing(null);
  const handleSelect = () => {
    if (previewing) onSelect(previewing);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={previewing ? undefined : onClose}
    >
      <style>{`
        @keyframes slideUpPicker   { from{opacity:0;transform:translateY(80px)} to{opacity:1;transform:translateY(0)} }
        @keyframes previewSlideIn  { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes msgPop          { from{opacity:0;transform:translateY(12px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      {/* ── GRID ── */}
      {!previewing && (
        <div
          className="w-full max-w-[430px] rounded-t-[28px] overflow-hidden"
          style={{
            background: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
            animation: "slideUpPicker 0.3s cubic-bezier(0.34,1.2,0.64,1) both",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 via-violet-500 to-blue-500" />
              <h3 className="text-[17px] font-bold text-foreground">
                Chat Theme
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          <p className="text-[12px] text-muted-foreground px-6 pb-4">
            Tap any theme to preview it
          </p>
          <div className="px-4 pb-8 grid grid-cols-4 gap-3">
            {THEMES.map((t) => {
              const isActive = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => openPreview(t.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-full rounded-2xl overflow-hidden border-2 transition-all duration-200 relative ${isActive ? "border-primary scale-105" : "border-transparent group-hover:border-white/20 group-hover:scale-[1.02]"}`}
                    style={{ aspectRatio: "3/4", background: t.thumbBg }}
                  >
                    <div className="absolute inset-0 flex flex-col justify-end p-1.5 gap-1">
                      <div className="flex justify-end">
                        <div
                          className="h-2.5 w-[68%] rounded-full"
                          style={{ background: t.thumbMine, opacity: 0.9 }}
                        />
                      </div>
                      <div className="flex justify-start">
                        <div
                          className="h-2.5 w-[52%] rounded-full"
                          style={{ background: t.thumbOther, opacity: 0.85 }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <div
                          className="h-2.5 w-[45%] rounded-full"
                          style={{ background: t.thumbMine, opacity: 0.9 }}
                        />
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check size={9} className="text-primary-foreground" />
                      </div>
                    )}
                    {t.badge && (
                      <div className="absolute top-1.5 left-0 right-0 flex justify-center">
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
                          style={{
                            background: "rgba(255,255,255,0.22)",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {t.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium truncate w-full text-center ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {previewing && previewTheme && (
        <div
          className="w-full max-w-[430px] flex flex-col overflow-hidden relative"
          style={{
            height: "100vh",
            background:
              previewTheme.id === "default"
                ? isDark
                  ? "#09090b"
                  : "#f4f4f5"
                : previewTheme.chatBg,
            animation: "previewSlideIn 0.25s ease both",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatedBg themeId={previewTheme.id} />

          <div
            className="relative z-10 flex items-center gap-3 px-4 pt-12 pb-4 shrink-0"
            style={{
              background:
                previewTheme.id === "default"
                  ? undefined
                  : `${previewTheme.hex}D0`,
            }}
          >
            <button
              onClick={closePreview}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <ArrowLeft size={22} strokeWidth={1.5} />
            </button>
            <img
              src={chatUser?.avatar || "https://i.pravatar.cc/150?img=12"}
              className="w-10 h-10 rounded-full object-cover shrink-0"
              alt=""
            />
            <div className="flex flex-col">
              <span
                className="font-semibold text-[15px]"
                style={{
                  color: previewTheme.id === "default" ? undefined : "#fff",
                }}
              >
                {chatUser?.name || "Preview Chat"}
              </span>
            </div>
          </div>

          <div className="relative z-10 text-center py-4 shrink-0">
            <p
              className="font-bold text-[18px]"
              style={{
                color: previewTheme.id === "default" ? undefined : "#fff",
              }}
            >
              Previewing {previewTheme.label}
            </p>
            {previewTheme.badge && (
              <p
                className="text-[13px] mt-0.5"
                style={{
                  color: previewTheme.mutedText || "rgba(255,255,255,0.6)",
                }}
              >
                {previewTheme.badge}
              </p>
            )}
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-end px-4 pb-3 gap-3 overflow-hidden">
            {PREVIEW_MESSAGES.map((m, i) => {
              const isDefault = previewTheme.id === "default";
              const bubbleBg = isDefault
                ? m.isMe
                  ? "#3f3f46"
                  : "#e4e4e7"
                : m.isMe
                  ? previewTheme.myBubble
                  : previewTheme.otherBubble;
              const bubbleText = isDefault
                ? m.isMe
                  ? "#fff"
                  : "#18181b"
                : m.isMe
                  ? previewTheme.myBubbleText
                  : previewTheme.otherBubbleText;
              return (
                <div
                  key={i}
                  className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}
                  style={{ animation: `msgPop 0.3s ${i * 0.07}s ease both` }}
                >
                  <div
                    className="max-w-[78%] rounded-2xl px-4 py-2.5"
                    style={{
                      background: bubbleBg,
                      color: bubbleText,
                      backdropFilter:
                        !m.isMe && !isDefault ? "blur(8px)" : undefined,
                      WebkitBackdropFilter:
                        !m.isMe && !isDefault ? "blur(8px)" : undefined,
                    }}
                  >
                    <p className="text-[14px] leading-snug">{m.text}</p>
                    {m.isMe && (
                      <p
                        className="text-[10px] mt-0.5 text-right"
                        style={{
                          color: isDefault
                            ? "rgba(255,255,255,0.45)"
                            : previewTheme.mutedText,
                        }}
                      >
                        {now} ✓✓
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="text-center py-1">
              <span
                className="text-[11px] px-3 py-1 rounded-full"
                style={{
                  color:
                    previewTheme.id === "default"
                      ? "rgba(100,100,100,0.9)"
                      : previewTheme.mutedText || "rgba(255,255,255,0.5)",
                  background:
                    previewTheme.id === "default"
                      ? "rgba(0,0,0,0.06)"
                      : "rgba(0,0,0,0.28)",
                }}
              >
                Today {now}
              </span>
            </div>
          </div>

          <div
            className="relative z-10 flex gap-3 px-4 pb-10 pt-4 shrink-0"
            style={{
              background:
                previewTheme.id === "default"
                  ? "linear-gradient(to top, #09090b 0%, transparent 100%)"
                  : `linear-gradient(to top, ${previewTheme.hex} 0%, transparent 100%)`,
            }}
          >
            <button
              onClick={closePreview}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-[15px] transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                color:
                  previewTheme.id === "default"
                    ? "#a1a1aa"
                    : "rgba(255,255,255,0.8)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95"
              style={{
                background: currentTheme === previewing ? "#16a34a" : "#5b5ef4",
                boxShadow:
                  currentTheme === previewing
                    ? "0 4px 20px rgba(22,163,74,0.5)"
                    : "0 4px 20px rgba(91,94,244,0.5)",
              }}
            >
              {currentTheme === previewing ? "Applied ✓" : "Select"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function getThemeStyles(theme: ChatTheme) {
  const t = THEMES.find((x) => x.id === theme) || THEMES[0];
  return {
    myBubble: t.myBubble,
    myBubbleText: t.myBubbleText,
    otherBubble: t.otherBubble,
    otherBubbleText: t.otherBubbleText,
    chatBg: t.chatBg,
    hex: t.hex,
    headerBg: t.headerBg,
    bottomBg: t.bottomBg,
    msgMenuBg: t.msgMenuBg,
    msgMenuBorder: t.msgMenuBorder,
    mutedText: t.mutedText,
    animated: !!t.animated,
  };
}
