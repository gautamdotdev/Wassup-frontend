import React, { useState, useRef } from "react";
import { ArrowLeft, Copy, MoreVertical } from "lucide-react";
import { BubbleContent } from "./BubbleContent";
import { StatusIcon } from "./StatusIcon";
import { Msg } from "@/types/chat";

const SWIPE_THRESHOLD = 45;

export function SwipeRow({
  msg, isMe, isLast, isLastMyMsg, onReply, chatUser,
  playingVoice, setPlayingVoice, onImageTap,
}: {
  msg: Msg; isMe: boolean; isLast: boolean; isLastMyMsg: boolean;
  onReply: (m: Msg) => void; chatUser: any;
  playingVoice: string | null; setPlayingVoice: (id: string | null) => void;
  onImageTap: (images: string[], startIndex: number) => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const fired = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; setDragging(true); fired.current = false; };
  const onTouchMove = (e: React.TouchEvent) => {
    const raw = isMe ? -(e.touches[0].clientX - startX.current) : (e.touches[0].clientX - startX.current);
    if (raw > 0) {
      const c = Math.min(raw, SWIPE_THRESHOLD + 16);
      setOffsetX(c);
      if (c >= SWIPE_THRESHOLD && !fired.current) { fired.current = true; onReply(msg); }
    }
  };
  const onTouchEnd = () => { setDragging(false); setOffsetX(0); };
  const progress = Math.min(offsetX / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className={`absolute top-1/2 ${isMe ? "right-1" : "left-1"} w-7 h-7 rounded-full bg-secondary border border-border/40 flex items-center justify-center pointer-events-none z-10`}
        style={{ opacity: progress, transform: `translateY(-50%) scale(${0.5 + progress * 0.5})` }}
      >
        <ArrowLeft size={12} className={`text-muted-foreground ${isMe ? "rotate-180" : ""}`} />
      </div>

      <div
        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
        style={{
          transform: `translateX(${isMe ? -offsetX : offsetX}px)`,
          transition: dragging ? "none" : "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="max-w-[78%]">
          <BubbleContent
            msg={msg} isMe={isMe} isLast={isLast}
            playingVoice={playingVoice} setPlayingVoice={setPlayingVoice}
            onImageTap={onImageTap}
          />

          {msg.reactions && msg.reactions.length > 0 && (
            <div className={`flex mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
              <span className="text-[18px]">{msg.reactions.join(" ")}</span>
            </div>
          )}

          <div className={`flex items-center mt-1 ${isMe ? "justify-end" : "justify-between"} gap-3`}>
            {!isMe && !msg.voiceNote && (
              <div className="flex items-center gap-2.5 ml-0.5">
                <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"><Copy size={13} strokeWidth={1.8} /></button>
                <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"><MoreVertical size={13} strokeWidth={1.8} /></button>
              </div>
            )}
            <div className="flex items-center gap-1">
              {msg.timestamp && <p className="text-[11px] text-muted-foreground/55 pr-0.5">{msg.timestamp}</p>}
              {isMe && <StatusIcon status={msg.status} />}
            </div>
          </div>

          {isMe && isLastMyMsg && msg.status === "seen" && (
            <div className="flex justify-end mt-0.5">
              <span className="text-[10px] text-blue-500 font-medium">Seen just now</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
