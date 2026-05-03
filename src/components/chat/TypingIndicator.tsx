import React from 'react';

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
  isDefault 
}: TypingIndicatorProps) => {
  if (!(isTyping || (isGroup && typingUsers.length > 0))) return null;

  return (
    <div className="flex justify-start pt-1 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className="rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm border border-black/[0.05] dark:border-white/[0.08]"
        style={{
          background: typingBubbleBg || (isEffectiveDark ? "rgba(45,45,45,0.98)" : "rgba(242,242,242,0.98)"),
          backdropFilter: !isDefault ? "blur(12px)" : "blur(8px)",
        }}
      >
        <img
          src={isGroup ? (typingUsers[0].avatar || 'https://i.pravatar.cc/150') : (chatUser?.avatar || 'https://i.pravatar.cc/150')}
          className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0"
          alt=""
        />
        <div className="flex gap-1.5 items-center">
          {[0, 180, 360].map(d => (
            <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-typing-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
        {isGroup && typingUsers.length > 0 && (
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter ml-0.5">
            {typingUsers[0].name?.split(' ')[0] || "Someone"}
          </span>
        )}
      </div>
    </div>
  );
};

export default TypingIndicator;
