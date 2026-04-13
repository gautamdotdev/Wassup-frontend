import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { Msg } from "@/types/chat";

export function StatusIcon({ status }: { status?: Msg["status"] }) {
  if (!status) return null;
  if (status === "sent") return <Check size={12} className="text-muted-foreground/50" strokeWidth={2.5} />;
  if (status === "delivered") return <CheckCheck size={12} className="text-muted-foreground/50" strokeWidth={2.5} />;
  return <CheckCheck size={12} className="text-blue-500" strokeWidth={2.5} />;
}
