import React from "react";
import { Play, Pause } from "lucide-react";
import { ImageGrid } from "./ImageGrid";
import { Msg } from "@/types/chat";

export function BubbleContent({
  msg, isMe, isLast, chatUser, playingVoice, setPlayingVoice, onImageTap,
}: {
  msg: Msg; isMe: boolean; isLast: boolean; chatUser?: any;
  playingVoice: string | null; setPlayingVoice: (id: string | null) => void;
  onImageTap: (images: string[], startIndex: number) => void;
}) {
  const bubbleBg = "bg-[#f0f0f0] dark:bg-[#2a2a2a] border border-black/[0.06] dark:border-white/[0.08]";
  const radiusClass = isLast
    ? (isMe ? "rounded-[22px] rounded-br-[5px]" : "rounded-[22px] rounded-bl-[5px]")
    : "rounded-[22px]";

  /* ── Reply label helper ── */
  const replyLabel = (senderId: string) => {
    if (senderId === "me") return "You";
    return chatUser?.name?.split(" ")[0] || "Them";
  };

  /* voice */
  if (msg.voiceNote) {
    const bars = [8, 12, 16, 20, 16, 12, 18, 22, 26, 22, 18, 14, 10, 14, 20, 24, 20, 16, 12, 10, 8, 14, 18, 14, 10, 6];
    return (
      <div className={`${radiusClass} px-4 py-3 ${bubbleBg}`} style={{ minWidth: 200 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setPlayingVoice(playingVoice === msg.id ? null : msg.id)}>
            {playingVoice === msg.id
              ? <Pause size={18} className="text-foreground" />
              : <Play size={18} className="text-foreground" />}
          </button>
          <div className="flex-1 flex items-center justify-center gap-[3px]">
            {bars.map((h, i) => (
              <div key={i} className="w-[2px] bg-foreground/40 rounded-full shrink-0" style={{ height: h }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground shrink-0 mt-0.5">1X</span>
        </div>
      </div>
    );
  }

  /* multi-image */
  if (msg.images && msg.images.length > 0) {
    return (
      <div
        className={`${radiusClass} overflow-hidden border border-black/[0.06] dark:border-white/[0.08]`}
        style={{ minWidth: 200, maxWidth: 260 }}
      >
        <ImageGrid images={msg.images} onTap={i => onImageTap(msg.images!, i)} />
        {msg.text && (
          <div className={`px-3 py-2 ${bubbleBg}`}>
            <p className="text-[14px] text-foreground leading-[1.55]">{msg.text}</p>
          </div>
        )}
      </div>
    );
  }

  /* text + optional reply quote */
  return (
    <div className={`${radiusClass} overflow-hidden ${bubbleBg}`} style={{ minWidth: 80 }}>
      {msg.replyTo && (
        <button
          className="px-3 pt-3 pb-2 w-full text-left"
          onClick={() =>
            document.getElementById(`msg-${msg.replyTo!.id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        >
          {/* "Replying to NAME" header */}
          <p className="text-[11px] font-semibold mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Replying to{" "}
            <span className="text-foreground">{replyLabel(msg.replyTo.senderId)}</span>
          </p>
          <div className="flex items-stretch gap-2">
            <div className="w-[3px] bg-foreground/50 rounded-full shrink-0" />
            <p className="text-[13px] text-foreground/60 leading-snug line-clamp-2 flex-1">
              {msg.replyTo.text}
            </p>
          </div>
          <div className="mt-2 border-t border-black/[0.06] dark:border-white/[0.06]" />
        </button>
      )}
      <div className={`flex items-end gap-2 ${msg.replyTo ? "px-3 pb-3" : "px-4 py-2.5"}`}>
        <p className="text-[14px] text-foreground leading-[1.55] flex-1">{msg.text}</p>
        {msg.image && (
          <button onClick={() => onImageTap([msg.image!], 0)}>
            <img src={msg.image} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-black/[0.08]" alt="" />
          </button>
        )}
      </div>
    </div>
  );
}
