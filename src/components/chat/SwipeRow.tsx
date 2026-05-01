import React, { useState, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { BubbleContent } from "./BubbleContent";
import { StatusIcon } from "./StatusIcon";
import { Msg, GroupedReaction, MsgReaction } from "@/types/chat";

const SWIPE_THRESHOLD = 45;

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
  // Theme props — CSS color strings (not Tailwind classes)
  themeBubbleBg,
  themeBubbleText,
  themeOtherBubbleBg,
  themeOtherBubbleText,
  themeMutedTextColor,  // CSS color string for timestamps
  MediaRenderer,
  isGroup = false,
  highlightText = "",
}: {
  msg: Msg; isMe: boolean; isLast: boolean; isLastMyMsg: boolean;
  onReply: (m: Msg) => void; chatUser: any;
  playingVoice: string | null; setPlayingVoice: (id: string | null) => void;
  onImageTap: (images: string[], startIndex: number) => void;
  onReact?: (msgId: string, emoji: string) => void;
  myUserId?: string;
  themeBubbleBg?: string;
  themeBubbleText?: string;
  themeOtherBubbleBg?: string;
  themeOtherBubbleText?: string;
  themeMutedTextColor?: string;
  MediaRenderer?: any;
  isGroup?: boolean;
  highlightText?: string;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const fired = useRef(false);
  const swipeActive = useRef(false);
  const [showNames, setShowNames] = useState(false);

  const grouped = groupReactions(msg.reactions, myUserId);

  const onTouchStart = (e: React.TouchEvent) => {
    if (msg.isUploading) return;
    startX.current = e.touches[0].clientX;
    setDragging(true);
    fired.current = false;
    swipeActive.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (msg.isUploading) return;
    const dx = e.touches[0].clientX - startX.current;
    const raw = isMe ? -dx : dx;
    if (Math.abs(dx) > 8) swipeActive.current = true;
    if (raw > 0 && swipeActive.current) {
      const c = Math.min(raw, SWIPE_THRESHOLD + 16);
      setOffsetX(c);
      if (c >= SWIPE_THRESHOLD && !fired.current) {
        fired.current = true;
        onReply(msg);
      }
    }
  };

  const onTouchEnd = () => { setDragging(false); setOffsetX(0); };

  const handleReact = useCallback((emoji: string) => {
    if (typeof onReact === "function") onReact(msg.id, emoji);
  }, [msg.id, onReact]);

  const progress = Math.min(offsetX / SWIPE_THRESHOLD, 1);

  // Resolve bubble styles — inline CSS colors take priority over Tailwind defaults
  const activeBubbleBg = isMe ? themeBubbleBg : themeOtherBubbleBg;
  const activeBubbleText = isMe ? themeBubbleText : themeOtherBubbleText;
  const hasTheme = !!(isMe ? themeBubbleBg : themeOtherBubbleBg);

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe hint / uploading label */}
      {msg.isUploading ? (
        <div className={`absolute top-1/2 ${isMe ? "right-1" : "left-1"} -translate-y-1/2 z-10 pointer-events-none`}>
          <span className="text-[10px] font-semibold text-muted-foreground/70 animate-pulse whitespace-nowrap">Sending…</span>
        </div>
      ) : (
        <div
          className={`absolute top-1/2 ${isMe ? "right-1" : "left-1"} w-7 h-7 rounded-full
            bg-secondary border border-border/40 flex items-center justify-center pointer-events-none z-10`}
          style={{ opacity: progress, transform: `translateY(-50%) scale(${0.5 + progress * 0.5})` }}
        >
          <ArrowLeft size={12} className={`text-muted-foreground ${isMe ? "rotate-180" : ""}`} />
        </div>
      )}

      {/* Bubble row */}
      <div
        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
        style={{
          transform: `translateX(${isMe ? -offsetX : offsetX}px)`,
          transition: dragging ? "none" : "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="max-w-[82%]">
          {/* Sender label for groups */}
          {!isMe && isGroup && (
            <div className="flex items-center gap-1.5 ml-1 mb-1 animate-in fade-in slide-in-from-left-2 duration-300">
               <img src={msg.sender?.avatar || 'https://i.pravatar.cc/150'} className="w-5 h-5 rounded-full object-cover border border-border/20 shadow-sm" alt="" />
               <span className="text-[10px] font-bold text-primary/80 tracking-tight uppercase">{msg.sender?.name}</span>
            </div>
          )}

          <div className="relative">
            <div style={{ paddingBottom: grouped.length > 0 ? "16px" : undefined }}>
              <BubbleContent
                msg={msg} isMe={isMe} isLast={isLast}
                chatUser={chatUser}
                playingVoice={playingVoice} setPlayingVoice={setPlayingVoice}
                onImageTap={onImageTap}
                themeBubbleBg={themeBubbleBg}
                themeBubbleText={themeBubbleText}
                themeOtherBubbleBg={themeOtherBubbleBg}
                themeOtherBubbleText={themeOtherBubbleText}
                MediaRenderer={MediaRenderer}
                isGroup={isGroup}
                highlightText={highlightText}
              />
            </div>

            {/* Reactions */}
            {grouped.length > 0 && (
              <div className={`absolute bottom-0 ${isMe ? "right-0" : "left-0"} translate-y-1/2 z-10`}>
                <div
                  className="flex items-center"
                  style={{
                    background: "rgba(30,30,30,0.92)", border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.45)", backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)", borderRadius: 999, padding: "2px 6px", gap: 2,
                  }}
                >
                  {grouped.map(({ emoji, count, reacted }, idx) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 transition-all duration-150 active:scale-90"
                      style={{ borderRight: idx < grouped.length - 1 ? "1px solid rgba(255,255,255,0.08)" : undefined }}
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
          <div className={`flex items-center ${isMe ? "justify-end" : "justify-start"} gap-1 ${grouped.length > 0 ? "mt-4" : "mt-1"}`}>
            {msg.isUploading ? (
              <span className="text-[10px] text-primary/70 font-medium animate-pulse">Sending…</span>
            ) : (
              <>
                {msg.isEdited && (
                  <span className="text-[9px] text-muted-foreground/50 font-medium italic mr-1 select-none">Edited</span>
                )}
                {msg.timestamp && (
                  <p
                    className="text-[11px] pr-0.5"
                    style={{ color: themeMutedTextColor || undefined }}
                  >
                    {/* Fallback to Tailwind class when no theme color */}
                    <span className={!themeMutedTextColor ? "text-muted-foreground/55" : undefined}>
                      {msg.timestamp}
                    </span>
                  </p>
                )}
                {isMe && !isGroup && <StatusIcon status={msg.status} />}
              </>
            )}
          </div>

          {/* Seen label or Avatar stack for groups */}
          {isMe && !msg.isUploading && (
            <div className="flex flex-col items-end mt-1 px-1">
              {isGroup && msg.readBy && msg.readBy.length > 0 ? (
                <>
                  <div 
                    className="flex flex-col items-end gap-1.5 py-0.5 cursor-pointer group" 
                    onClick={(e) => { e.stopPropagation(); setShowNames(!showNames); }}
                  >
                    <div className="flex items-center -space-x-1.5 overflow-hidden transition-all group-hover:scale-105 active:scale-95">
                      {msg.readBy.filter(u => (u?._id || u) !== myUserId).slice(0, 5).map((u: any) => (
                        <img 
                          key={u?._id || u} 
                          src={u?.avatar || 'https://i.pravatar.cc/150'} 
                          className="w-3.5 h-3.5 rounded-full border border-background object-cover shadow-sm bg-muted" 
                          alt={u?.name || 'User'} 
                          title={u?.name || 'User'}
                        />
                      ))}
                      {msg.readBy.length > 5 && (
                        <div className="w-3.5 h-3.5 rounded-full bg-secondary/80 border border-background flex items-center justify-center text-[7px] font-bold text-muted-foreground shrink-0 shadow-sm">
                          +{msg.readBy.length - 5}
                        </div>
                      )}
                    </div>
                    
                    {showNames && (
                      <div className="mt-1 flex flex-wrap justify-end gap-1.5 max-w-[200px] animate-in slide-in-from-top-1 fade-in duration-200">
                        {msg.readBy.filter(u => (u?._id || u) !== myUserId).map((u: any) => (
                          <span 
                            key={u?._id || u} 
                            className="bg-primary/5 text-primary/80 border border-primary/20 rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-widest shadow-sm"
                          >
                            {u?.name ? u.name.split(' ')[0] : 'Member'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : !isGroup && msg.status === "seen" && isLastMyMsg ? (
                <span className="text-[10px] text-blue-500 font-medium">Seen</span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
