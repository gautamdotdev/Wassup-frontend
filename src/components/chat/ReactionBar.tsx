import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "🎉", "💯"];

interface Props {
  visible: boolean;
  position: "top" | "bottom";
  isMe: boolean;
  onReact: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Floating emoji reaction bar — dark pill that floats above or below a message.
 * Appears with a smooth scale + fade-in animation.
 */
export function ReactionBar({ visible, position, isMe, onReact, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [visible, onClose]);

  return (
    <div
      ref={ref}
      className={`
        absolute z-50 flex items-center gap-1 px-3 py-2
        bg-[#1c1c1e] dark:bg-[#2c2c2e] border border-white/10
        rounded-full shadow-2xl shadow-black/60 select-none
        transition-all duration-200
        ${position === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"}
        ${isMe ? "right-0" : "left-0"}
        ${visible
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-75 pointer-events-none"
        }
      `}
      style={{ transformOrigin: isMe ? "bottom right" : "bottom left" }}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className="text-[26px] leading-none hover:scale-125 active:scale-110
                     transition-transform duration-150 p-0.5"
          onClick={() => { onReact(emoji); onClose(); }}
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}

      {/* Divider + close */}
      <div className="w-px h-6 bg-white/20 mx-0.5" />
      <button
        className="text-white/50 hover:text-white transition-colors p-0.5"
        onClick={onClose}
        aria-label="Close reaction bar"
      >
        <X size={14} />
      </button>
    </div>
  );
}
