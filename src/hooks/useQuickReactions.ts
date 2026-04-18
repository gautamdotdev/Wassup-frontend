import { useState, useCallback } from "react";

const STORAGE_KEY = "wassup_quick_reactions";
const DEFAULT_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "🔥"];

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 6) return parsed;
    }
  } catch {}
  return DEFAULT_REACTIONS;
}

export function useQuickReactions() {
  const [quickReactions, setQuickReactions] = useState<string[]>(load);

  const replaceReaction = useCallback((index: number, newEmoji: string) => {
    setQuickReactions(prev => {
      const next = [...prev];
      next[index] = newEmoji;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { quickReactions, replaceReaction };
}
