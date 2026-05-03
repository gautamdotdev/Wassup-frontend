import React from "react";

interface TypingIndicatorProps {
  isGroup: boolean;
  typingUsers: any[];
  isTyping: boolean;
  chatUser: any;
  typingBubbleBg?: string;
  isEffectiveDark: boolean;
  isDefault: boolean;
}

const TypingIndicator = ({
  isGroup,
  typingUsers,
  isTyping,
  chatUser,
  typingBubbleBg,
  isEffectiveDark,
  isDefault,
}: TypingIndicatorProps) => {
  if (!(isTyping || (isGroup && typingUsers.length > 0))) return null;

  const bubbleBg =
    typingBubbleBg ||
    (isEffectiveDark ? "rgba(38,38,38,0.98)" : "rgba(244,244,244,0.98)");
  const dotColor = isEffectiveDark
    ? "rgba(255,255,255,0.5)"
    : "rgba(0,0,0,0.35)";

  const displayUsers = isGroup ? typingUsers : chatUser ? [chatUser] : [];
  const firstName = displayUsers[0]?.name?.split(" ")[0] || "Someone";
  const label =
    isGroup && typingUsers.length > 1
      ? `${typingUsers[0]?.name?.split(" ")[0]} & ${typingUsers[1]?.name?.split(" ")[0]}`
      : firstName;
  const subLabel =
    isGroup && typingUsers.length > 1
      ? `${typingUsers.length} people typing`
      : `${firstName} is typing`;

  return (
    <div className="flex justify-start pt-1 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-end gap-2">
        {/* Avatar(s) */}
        {isGroup && typingUsers.length > 1 ? (
          <div className="relative w-8 h-8 shrink-0">
            <img
              src={typingUsers[1]?.avatar || "https://i.pravatar.cc/150"}
              className="absolute bottom-0 left-0 w-[22px] h-[22px] rounded-full object-cover border-2 border-background"
              alt=""
            />
            <img
              src={typingUsers[0]?.avatar || "https://i.pravatar.cc/150"}
              className="absolute top-0 right-0 w-[22px] h-[22px] rounded-full object-cover border-2 border-background"
              alt=""
            />
          </div>
        ) : (
          <div className="relative shrink-0">
            <img
              src={displayUsers[0]?.avatar || "https://i.pravatar.cc/150"}
              className="w-8 h-8 rounded-full object-cover"
              alt=""
            />
            <div className="absolute inset-[-3px] rounded-full border-2 border-border/40 animate-pulse pointer-events-none" />
          </div>
        )}

        {/* Bubble + label */}
        <div className="flex flex-col gap-1">
          <div
            className="flex items-center gap-2.5 rounded-[18px] rounded-bl-[4px] px-4 py-3"
            style={{
              background: bubbleBg,
              backdropFilter: !isDefault ? "blur(12px)" : undefined,
              border: isEffectiveDark
                ? "0.5px solid rgba(255,255,255,0.08)"
                : "0.5px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* Dots */}
            <div className="flex gap-[5px] items-center">
              {[0, 150, 300].map((delay) => (
                <div
                  key={delay}
                  className="w-[7px] h-[7px] rounded-full animate-typing-bounce"
                  style={{ background: dotColor, animationDelay: `${delay}ms` }}
                />
              ))}
            </div>

            {/* Group name divider */}
            {isGroup && typingUsers.length > 0 && (
              <>
                <div
                  className="w-px h-3.5"
                  style={{
                    background: isEffectiveDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.12)",
                  }}
                />
                <span
                  className="text-[11px] font-medium tracking-wide"
                  style={{
                    color: isEffectiveDark
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(0,0,0,0.4)",
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </div>

          {/* Sub-label only for group */}
          {/* {isGroup && typingUsers.length > 0 && (
            <span className="text-[11px] text-muted-foreground/50 pl-1">
              {subLabel}
            </span>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
