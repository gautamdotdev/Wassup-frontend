import React from "react";
import { Msg } from "@/types/chat";

/**
 * WhatsApp-style tick indicators:
 * - sent      → single grey tick  (✓)
 * - delivered → double grey ticks (✓✓)
 * - seen      → double blue ticks (✓✓ in blue)
 */
export function StatusIcon({ status }: { status?: Msg["status"] }) {
  if (!status) return null;

  if (status === "sent") {
    return (
      <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-label="Sent">
        <path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="text-muted-foreground/60" />
      </svg>
    );
  }

  if (status === "delivered") {
    return (
      <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-label="Delivered">
        {/* first tick */}
        <path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="text-muted-foreground/60" />
        {/* second tick offset right */}
        <path d="M5 5.5L8.5 9L15 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="text-muted-foreground/60" />
      </svg>
    );
  }

  // seen — blue double tick
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-label="Seen">
      <path d="M1 5.5L4.5 9L11 2" stroke="#46a5f5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5.5L8.5 9L15 2" stroke="#46a5f5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
