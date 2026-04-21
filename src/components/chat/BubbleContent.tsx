import React from "react";
import { Play, Pause } from "lucide-react";
import { ImageGrid } from "./ImageGrid";
import { Msg } from "@/types/chat";
import { MediaRenderer } from "./MediaRenderer";

/**
 * Bubble background logic:
 * - Default theme: BOTH sent & received use neutral bubble (same as before)
 * - Other themes:  my bubbles use theme color, received stays neutral
 */
export function BubbleContent({
  msg, isMe, isLast, chatUser, playingVoice, setPlayingVoice, onImageTap,
  themeBubbleBg, themeBubbleText,
  themeOtherBubbleBg, themeOtherBubbleText,
  MediaRenderer,
  isGroup = false,
}: {
  msg: Msg; isMe: boolean; isLast: boolean; chatUser?: any;
  playingVoice: string | null; setPlayingVoice: (id: string | null) => void;
  onImageTap: (images: string[], startIndex: number) => void;
  themeBubbleBg?: string;
  themeBubbleText?: string;
  themeOtherBubbleBg?: string;
  themeOtherBubbleText?: string;
  MediaRenderer?: any;
  isGroup?: boolean;
}) {
  // Neutral fallback styles
  const neutralBgClass = "bg-[#f0f0f0] dark:bg-[#2a2a2a] border border-black/[0.1] dark:border-white/[0.08]";

  // Decide which theme colors to apply
  const activeBg = isMe ? themeBubbleBg : themeOtherBubbleBg;
  const activeText = isMe ? themeBubbleText : themeOtherBubbleText;
  const hasTheme = !!activeBg;

  const bubbleClass = hasTheme ? "" : neutralBgClass;
  const bubbleStyle = hasTheme ? { backgroundColor: activeBg, color: activeText } : {};
  const textClass = hasTheme ? "" : "text-foreground";
  const textStyle = hasTheme ? { color: activeText } : {};

  const radiusClass = isLast
    ? (isMe ? "rounded-[22px] rounded-br-[5px]" : "rounded-[22px] rounded-bl-[5px]")
    : "rounded-[22px]";

  const replyLabel = (senderId: string) => {
    if (senderId === "me") return "You";
    if (isGroup && msg.replyTo && (msg.replyTo as any).senderId !== "me") {
        return msg.sender?.name || (chatUser?.name?.split(" ")[0] || "Them");
    }
    return (chatUser?.name?.split(" ")[0] || "Them");
  };

  /* ── voice ── */
  if (msg.voiceNote) {
    const bars = [8,12,16,20,16,12,18,22,26,22,18,14,10,14,20,24,20,16,12,10,8,14,18,14,10,6];
    return (
      <div className={`${radiusClass} px-4 py-3 ${bubbleClass}`} style={{ minWidth: 200, ...bubbleStyle }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setPlayingVoice(playingVoice === msg.id ? null : msg.id)}>
            {playingVoice === msg.id
              ? <Pause size={18} style={textStyle} className={textClass} />
              : <Play  size={18} style={textStyle} className={textClass} />}
          </button>
          <div className="flex-1 flex items-center justify-center gap-[3px]">
            {bars.map((h, i) => (
              <div key={i} className={`w-[2px] rounded-full shrink-0 ${hasTheme ? "bg-white/40" : "bg-foreground/40"}`} style={{ height: h }} />
            ))}
          </div>
          <span className={`text-xs shrink-0 mt-0.5 ${hasTheme ? "opacity-70" : "text-muted-foreground"}`}>1X</span>
        </div>
      </div>
    );
  }

  /* ── video ── */
  if (msg.mediaType === "video" && msg.images && msg.images.length > 0) {
    return (
      <div className={`${radiusClass} overflow-hidden border border-black/[0.06] dark:border-white/[0.08]`}
        style={{ minWidth: 180, maxWidth: 260 }}>
        <MediaRenderer src={msg.images[0]} mediaType="video" className="w-full max-h-64 object-cover bg-black" />
        {msg.text && (
          <div className={`px-3 py-2 ${bubbleClass}`} style={bubbleStyle}>
            <p className={`text-[14px] leading-[1.55] ${textClass}`} style={textStyle}>{msg.text}</p>
          </div>
        )}
      </div>
    );
  }

  /* ── image(s) ── */
  if (msg.images && msg.images.length > 0) {
    return (
      <div className={`${radiusClass} overflow-hidden border border-black/[0.06] dark:border-white/[0.08]`}
        style={{ minWidth: 200, maxWidth: 260 }}>
        <ImageGrid images={msg.images} onTap={i => onImageTap(msg.images!, i)} />
        {msg.text && (
          <div className={`px-3 py-2 ${bubbleClass}`} style={bubbleStyle}>
            <p className={`text-[14px] leading-[1.55] ${textClass}`} style={textStyle}>{msg.text}</p>
          </div>
        )}
      </div>
    );
  }

  /* ── text (+ optional reply quote) ── */
  return (
    <div className={`${radiusClass} overflow-hidden ${bubbleClass}`} style={{ minWidth: 80, ...bubbleStyle }}>
      {msg.replyTo && (
        <button
          className={`px-3 pt-3 pb-2 w-full text-left rounded-t-[22px] ${hasTheme ? "bg-black/15" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}
          onClick={() => document.getElementById(`msg-${msg.replyTo!.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
        >
          <p className={`text-[11px] font-semibold mb-1.5`}
            style={{ color: hasTheme ? "rgba(255,255,255,0.65)" : "hsl(var(--muted-foreground))" }}>
            Replying to{" "}
            <span style={{ color: hasTheme ? "#fff" : "hsl(var(--foreground))" }}>{replyLabel(msg.replyTo.senderId)}</span>
          </p>
          <div className="flex items-stretch gap-2">
            <div className={`w-[3px] rounded-full shrink-0 ${hasTheme ? "bg-white/50" : "bg-foreground/50"}`} />
            <p className={`text-[13px] leading-snug line-clamp-2 flex-1`}
              style={{ color: hasTheme ? "rgba(255,255,255,0.65)" : "hsl(var(--muted-foreground))" }}>
              {msg.replyTo.text}
            </p>
          </div>
          <div className={`mt-2 border-t ${hasTheme ? "border-white/10" : "border-black/[0.06] dark:border-white/[0.06]"}`} />
        </button>
      )}
      <div className={`flex items-end gap-2 ${msg.replyTo ? "px-3 pb-3 pt-2" : "px-4 py-2.5"}`}>
        <p className={`text-[14px] leading-[1.55] flex-1 ${textClass}`} style={textStyle}>{msg.text}</p>
        {msg.image && (
          <button onClick={() => onImageTap([msg.image!], 0)}>
            <MediaRenderer src={msg.image} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-black/[0.08]" />
          </button>
        )}
      </div>
    </div>
  );
}
