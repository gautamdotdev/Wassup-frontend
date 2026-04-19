import React, { useState, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { BubbleContent } from "./BubbleContent";
import { StatusIcon } from "./StatusIcon";
import { Msg, GroupedReaction, MsgReaction } from "@/types/chat";

const SWIPE_THRESHOLD = 45;
const LONG_PRESS_MS = 500;

/** Group raw reactions into display-ready format for a given userId */
function groupReactions(reactions: MsgReaction[] | undefined, myUserId: string): GroupedReaction[] {
  if (!reactions || reactions.length === 0) return [];
  const map = new Map<string, { count: number; reacted: boolean }>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      if (r.user === myUserId) existing.reacted = true;
    } else {
      map.set(r.emoji, { count: 1, reacted: r.user === myUserId });
    }
  }
  return Array.from(map.entries()).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted }));
}

export function SwipeRow({
  msg, isMe, isLast, isLastMyMsg, onReply, chatUser,
  playingVoice, setPlayingVoice, onImageTap, onReact, myUserId = "",
  themeBubbleBg, themeBubbleText,
}: {
  msg: Msg; isMe: boolean; isLast: boolean; isLastMyMsg: boolean;
  onReply: (m: Msg) => void; chatUser: any;
  playingVoice: string | null; setPlayingVoice: (id: string | null) => void;
  onImageTap: (images: string[], startIndex: number) => void;
  onReact?: (msgId: string, emoji: string) => void;
  myUserId?: string;
  themeBubbleBg?: string;
  themeBubbleText?: string;
}) {
  // ── Swipe for reply ──────────────────────────────────────────────────────
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const fired = useRef(false);
  const swipeActive = useRef(false);

  const grouped = groupReactions(msg.reactions, myUserId);


  // ── Long-press (mobile) ──────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
    fired.current = false;
    swipeActive.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const raw = isMe ? -dx : dx;

    if (Math.abs(dx) > 8) {
      swipeActive.current = true;
    }

    if (raw > 0 && swipeActive.current) {
      const c = Math.min(raw, SWIPE_THRESHOLD + 16);
      setOffsetX(c);
      if (c >= SWIPE_THRESHOLD && !fired.current) {
        fired.current = true;
        onReply(msg);
      }
    }
  };

  const onTouchEnd = () => {
    setDragging(false);
    setOffsetX(0);
  };



  const handleReact = useCallback((emoji: string) => {
    // Guard: do nothing if parent didn't wire up onReact yet
    if (typeof onReact === "function") onReact(msg.id, emoji);
  }, [msg.id, onReact]);

  const progress = Math.min(offsetX / SWIPE_THRESHOLD, 1);

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe-to-reply arrow indicator */}
      <div
        className={`absolute top-1/2 ${isMe ? "right-1" : "left-1"} w-7 h-7 rounded-full
          bg-secondary border border-border/40 flex items-center justify-center
          pointer-events-none z-10`}
        style={{ opacity: progress, transform: `translateY(-50%) scale(${0.5 + progress * 0.5})` }}
      >
        <ArrowLeft size={12} className={`text-muted-foreground ${isMe ? "rotate-180" : ""}`} />
      </div>

      {/* Message bubble + reaction bar + badges wrapper */}
      <div
        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
        style={{
          transform: `translateX(${isMe ? -offsetX : offsetX}px)`,
          transition: dragging ? "none" : "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="max-w-[78%]">
          {/* Bubble + overlaid reaction badges */}
          <div className="relative">
            <div style={{ paddingBottom: grouped.length > 0 ? "16px" : undefined }}>
              <BubbleContent
                msg={msg} isMe={isMe} isLast={isLast}
                chatUser={chatUser}
                playingVoice={playingVoice} setPlayingVoice={setPlayingVoice}
                onImageTap={onImageTap}
                themeBubbleBg={themeBubbleBg}
                themeBubbleText={themeBubbleText}
              />
            </div>

            {/* Reaction badges — single-row pill overlaid at bubble bottom */}
            {grouped.length > 0 && (
              <div
                className={`absolute bottom-0 ${isMe ? "right-0" : "left-0"} translate-y-1/2 z-10`}
              >
                <div
                  className="flex items-center"
                  style={{
                    background: "rgba(30,30,30,0.92)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.45)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderRadius: 999,
                    padding: "2px 6px",
                    gap: 2,
                  }}
                >
                  {grouped.map(({ emoji, count, reacted }, idx) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 transition-all duration-150 active:scale-90"
                      style={{ borderRight: idx < grouped.length - 1 ? "1px solid rgba(255,255,255,0.08)" : undefined }}
                      aria-label={`${emoji} ${count} reaction${count !== 1 ? "s" : ""}`}
                    >
                      <span className="text-[13px] leading-none">{emoji}</span>
                      {count >= 2 && (
                        <span className={`text-[10px] leading-none ml-0.5 font-medium ${reacted ? "text-blue-400" : "text-white/70"}`}>{count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timestamp + tick */}
          <div className={`flex items-center justify-end gap-1 ${grouped.length > 0 ? "mt-4" : "mt-1"}`}>
            {msg.timestamp && <p className="text-[11px] text-muted-foreground/55 pr-0.5">{msg.timestamp}</p>}
            {isMe && <StatusIcon status={msg.status} />}
          </div>

          {/* Seen label */}
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
