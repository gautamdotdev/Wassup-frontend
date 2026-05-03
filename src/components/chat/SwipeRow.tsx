import React, { useState, useRef, useCallback, useEffect } from "react";
import { Reply } from "lucide-react";
import { BubbleContent } from "./BubbleContent";
import { StatusIcon } from "./StatusIcon";
import { Msg, GroupedReaction, MsgReaction } from "@/types/chat";

const SWIPE_THRESHOLD = 50;

/** 
 * Modular Swipe Indicator Component 
 * Displays an arrow and a progress ring that fills up as the user swipes.
 */
const SwipeIndicator = ({ progress, fired }: { progress: number; isMe: boolean; fired: boolean }) => {
  const size = 32;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);

  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-foreground/[0.08]"
        />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-75 ${fired ? "text-primary" : "text-primary/40"}`}
        />
      </svg>
      <Reply 
        size={14} 
        className={`transition-all duration-200 ${fired ? "scale-125 text-primary" : "text-muted-foreground/60"}`} 
      />
    </div>
  );
};

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
  msg, isMe, isLast, isFirst, isLastMyMsg, onReply, chatUser,
  playingVoice, setPlayingVoice, onImageTap, onReact, myUserId = "",
  themeBubbleBg, themeBubbleText, themeOtherBubbleBg, themeOtherBubbleText, themeMutedTextColor,
  MediaRenderer, isGroup = false, highlightText = "",
}: {
  msg: Msg; isMe: boolean; isLast: boolean; isFirst: boolean; isLastMyMsg: boolean;
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
  const [fired, setFired] = useState(false);
  const startX = useRef(0);
  const isDraggingRef = useRef(false);
  const [showNames, setShowNames] = useState(false);

  const grouped = groupReactions(msg.reactions, myUserId);

  const handleStart = (clientX: number) => {
    if (msg.isUploading) return;
    startX.current = clientX;
    isDraggingRef.current = true;
    setDragging(true);
    setFired(false);
  };

  const handleMove = (clientX: number) => {
    if (!isDraggingRef.current || msg.isUploading) return;
    const dx = clientX - startX.current;
    
    // Support swiping towards the center of the screen
    // For "me", swipe left (dx < 0). For "other", swipe right (dx > 0).
    const raw = isMe ? -dx : dx;
    
    if (raw > 0) {
      // Elastic resistance after threshold
      const damped = raw > SWIPE_THRESHOLD 
        ? SWIPE_THRESHOLD + (raw - SWIPE_THRESHOLD) * 0.3
        : raw;
      
      setOffsetX(Math.min(damped, SWIPE_THRESHOLD + 30));
      
      if (raw >= SWIPE_THRESHOLD && !fired) {
        setFired(true);
        if (window.navigator.vibrate) window.navigator.vibrate(10);
      } else if (raw < SWIPE_THRESHOLD && fired) {
        setFired(false);
      }
    } else {
      setOffsetX(0);
    }
  };

  const handleEnd = () => {
    if (!isDraggingRef.current) return;
    if (fired) onReply(msg);
    
    isDraggingRef.current = false;
    setDragging(false);
    setOffsetX(0);
    setFired(false);
  };

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = handleEnd;

  // Mouse Events for Desktop
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) handleMove(e.clientX);
  };
  const onMouseUp = handleEnd;
  const onMouseLeave = handleEnd;

  const handleReact = useCallback((emoji: string) => {
    if (typeof onReact === "function") onReact(msg.id, emoji);
  }, [msg.id, onReact]);

  const progress = Math.min(offsetX / SWIPE_THRESHOLD, 1);

  return (
    <div
      className="relative group select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Swipe Indicator (Progress Ring) - Fixed position relative to the row */}
      {!msg.isUploading && offsetX > 0 && (
        <div 
          className={`absolute top-1/2 ${isMe ? "right-4" : "left-4"} -translate-y-1/2 z-0 pointer-events-none`}
          style={{ 
            opacity: progress > 0.1 ? 1 : 0,
            transform: `translateY(-50%) scale(${0.8 + progress * 0.2})`,
          }}
        >
          <SwipeIndicator progress={progress} fired={fired} />
        </div>
      )}

      {/* Swipe Row Content */}
      <div
        className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} relative transition-all z-10`}
        style={{
          transform: `translateX(${isMe ? -offsetX : offsetX}px)`,
          transition: dragging ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >

        {/* Left-side avatar for incoming messages */}
        {!isMe && (
          <div className="w-7 shrink-0 mb-1">
            {isLast && (
              <img
                src={msg.sender?.avatar || chatUser?.avatar || 'https://i.pravatar.cc/150'}
                className="w-7 h-7 rounded-full object-cover border border-border/10 shadow-sm animate-in fade-in zoom-in-75 duration-300"
                alt=""
              />
            )}
          </div>
        )}

        <div className="max-w-[82%]">
          {!isMe && isGroup && isFirst && (
            <div className="ml-1 mb-0.5 animate-in fade-in slide-in-from-left-1 duration-300">
              <span className="text-[10px] font-bold text-muted-foreground/60 tracking-tight uppercase">{msg.sender?.name || "Unknown"}</span>
            </div>
          )}

          <div className="relative">
            <div style={{ paddingBottom: grouped.length > 0 ? "16px" : undefined }}>
              <BubbleContent
                msg={msg} isMe={isMe} isLast={isLast} isFirst={isFirst}
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

          {/* Timestamp + status */}
          <div className={`flex items-center ${isMe ? "justify-end" : "justify-start"} gap-1 ${grouped.length > 0 ? "mt-4" : "mt-1"}`}>
            {msg.isUploading ? (
              <span className="text-[10px] text-primary/70 font-medium animate-pulse">Sending…</span>
            ) : (
              <>
                {msg.isEdited && (
                  <span className="text-[9px] text-muted-foreground/50 font-medium italic mr-1 select-none">Edited</span>
                )}
                {msg.timestamp && isLast && (
                  <p className="text-[11px] pr-0.5" style={{ color: themeMutedTextColor || undefined }}>
                    <span className={!themeMutedTextColor ? "text-muted-foreground/55" : undefined}>
                      {msg.timestamp}
                    </span>
                  </p>
                )}
                {isMe && !isGroup && <StatusIcon status={msg.status} />}
              </>
            )}
          </div>

          {/* Read avatars for groups */}
          {isMe && !msg.isUploading && isGroup && msg.readBy && msg.readBy.length > 0 && (
            <div className="flex flex-col items-end mt-1 px-1">
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
                      alt="" 
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
                      <span key={u?._id || u} className="bg-primary/5 text-primary/80 border border-primary/20 rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-widest shadow-sm">
                        {u?.name ? u.name.split(' ')[0] : 'Member'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {isMe && !msg.isUploading && !isGroup && msg.status === "seen" && isLastMyMsg && (
            <div className="flex justify-end mt-0.5">
              <span className="text-[10px] text-blue-500 font-medium">Seen</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

