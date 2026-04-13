import React from "react";
import { X } from "lucide-react";

export function PendingStrip({ images, onRemove }: { images: string[]; onRemove: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {images.map((src, i) => (
        <div key={i} className="relative shrink-0">
          <img src={src} className="w-16 h-16 rounded-xl object-cover border border-black/[0.08] dark:border-white/[0.08]" alt="" />
          <button
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center shadow-md"
          >
            <X size={10} strokeWidth={3} />
          </button>
        </div>
      ))}
    </div>
  );
}
