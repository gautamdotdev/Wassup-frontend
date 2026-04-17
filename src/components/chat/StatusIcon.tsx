import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { Msg } from "@/types/chat";

/**
 * WhatsApp-style tick icons:
 *   sent      → ✓  (single tick, grey)   — saved to server, recipient offline
 *   delivered → ✓✓ (double tick, grey)   — recipient online & received it
 *   seen      → ✓✓ (double tick, blue)   — recipient opened the chat
 */
export function StatusIcon({ status }: { status?: Msg["status"] }) {
  if (!status) return null;

  if (status === "sent") {
    return (
      <Check
        size={13}
        strokeWidth={2.5}
        className="text-muted-foreground/50 transition-all duration-300"
        aria-label="Sent"
      />
    );
  }

  if (status === "delivered") {
    return (
      <CheckCheck
        size={13}
        strokeWidth={2.5}
        className="text-muted-foreground/60 transition-all duration-300"
        aria-label="Delivered"
      />
    );
  }

  // seen
  return (
    <CheckCheck
      size={13}
      strokeWidth={2.5}
      className="text-blue-500 transition-all duration-300"
      aria-label="Seen"
    />
  );
}
