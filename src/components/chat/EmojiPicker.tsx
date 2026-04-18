import React, { useState } from "react";
import { Search } from "lucide-react";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  },
  {
    label: "Gestures",
    emojis: ["👍","👎","👊","✊","🤛","🤜","🤞","✌️","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✋","🤚","🖐","🖖","👋","🤙","💪","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁","👅","👄","🫦"],
  },
  {
    label: "Hearts & Symbols",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☯️","🕉","⭐","🌟","💫","✨","🔥","🎉","🎊","🎈","🎁","🏆","🥇","🎯","💯","✅","❌","💢","💥","💦","💨","🕳","💬","💭","💤"],
  },
  {
    label: "Food & Nature",
    emojis: ["🍎","🍊","🍋","🍇","🍓","🫐","🍉","🍑","🥭","🍍","🥥","🥑","🍆","🥦","🌽","🌶","🧄","🧅","🍄","🥜","🍞","🥐","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌮","🍕","🍔","🌯","🥙","🧆","🍜","🍝","🍛","🍣","🍱","🍤","🦞","🦀","🦑","🦐","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🍫","🍬","🍭","☕","🍵","🍺","🍻","🥂","🍷"],
  },
  {
    label: "Animals",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🦂","🐢","🐍","🦎","🦕","🦖","🦎","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🦈","🦭","🐊","🐅","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🦒","🦘","🦬"],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(search.trim()))
    : EMOJI_CATEGORIES[activeTab].emojis;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center pb-4 px-3"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "rgba(20,20,20,0.95)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          animation: "epSlideUp 0.25s cubic-bezier(0.34,1.2,0.64,1) both",
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes epSlideUp {
            from { opacity: 0; transform: translateY(32px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Search bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <Search size={15} className="text-white/40 shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search emoji…"
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 outline-none"
          />
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex overflow-x-auto px-3 pt-2 gap-0.5 scrollbar-none">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => setActiveTab(i)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                  activeTab === i
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div className="grid grid-cols-8 gap-0 px-2 py-2 max-h-52 overflow-y-auto">
          {filteredEmojis.map(e => (
            <button
              key={e}
              onClick={() => { onSelect(e); onClose(); }}
              className="flex items-center justify-center text-[22px] h-10 w-10 rounded-xl hover:bg-white/10 active:scale-90 transition-all"
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
