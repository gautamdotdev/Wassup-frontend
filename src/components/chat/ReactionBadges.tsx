import React from "react";
import { GroupedReaction } from "@/types/chat";

interface Props {
  reactions: GroupedReaction[];
  isMe: boolean;
  onReact: (emoji: string) => void;
}

/**
 * Reaction count badges shown below the message bubble — like the screenshot.
 * Dark rounded pill with emoji + count (count hidden when only 1).
 * User's own reactions are highlighted with a blue ring.
 */
export function ReactionBadges({ reactions, isMe, onReact }: Props) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
      {reactions.map(({ emoji, count, reacted }) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={`
            flex items-center gap-1 px-2.5 py-1
            rounded-full text-sm font-medium
            bg-[#2a2a2a] dark:bg-[#3a3a3a]
            transition-all duration-150
            active:scale-95
            ${reacted
              ? "ring-1 ring-blue-500 bg-blue-500/10 dark:bg-blue-500/15"
              : "hover:bg-[#383838] dark:hover:bg-[#4a4a4a]"
            }
          `}
          aria-label={`${emoji} ${count} reaction${count !== 1 ? "s" : ""}`}
        >
          <span className="text-base leading-none">{emoji}</span>
          {count >= 2 && (
            <span className="text-[12px] text-white/80 leading-none">{count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
