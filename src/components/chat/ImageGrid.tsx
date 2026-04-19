import React from "react";
import { MediaRenderer } from "./MediaRenderer";

export function ImageGrid({ images, onTap }: { images: string[]; onTap: (i: number) => void }) {
  const n = images.length;

  if (n === 1) return (
    <button onClick={() => onTap(0)} className="w-full block overflow-hidden" style={{ aspectRatio: "1" }}>
      <MediaRenderer src={images[0]} className="w-full h-full object-cover" />
    </button>
  );

  if (n === 2) return (
    <div className="grid grid-cols-2 gap-[2px]">
      {images.map((src, i) => (
        <button key={i} onClick={() => onTap(i)} className="overflow-hidden" style={{ aspectRatio: "1" }}>
          <MediaRenderer src={src} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );

  if (n === 3) return (
    <div className="grid grid-cols-2 gap-[2px]">
      <button onClick={() => onTap(0)} className="row-span-2 overflow-hidden" style={{ aspectRatio: "0.499" }}>
        <MediaRenderer src={images[0]} className="w-full h-full object-cover" />
      </button>
      {[1, 2].map(i => (
        <button key={i} onClick={() => onTap(i)} className="overflow-hidden" style={{ aspectRatio: "1" }}>
          <MediaRenderer src={images[i]} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );

  if (n === 4) return (
    <div className="grid grid-cols-2 gap-[2px]">
      {images.map((src, i) => (
        <button key={i} onClick={() => onTap(i)} className="overflow-hidden" style={{ aspectRatio: "1" }}>
          <MediaRenderer src={src} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );

  /* 5+ — show 4 with "+N" on last cell */
  const extra = n - 4;
  return (
    <div className="grid grid-cols-2 gap-[2px]">
      {images.slice(0, 4).map((src, i) => (
        <button key={i} onClick={() => onTap(i)} className="overflow-hidden relative" style={{ aspectRatio: "1" }}>
          <MediaRenderer src={src} className="w-full h-full object-cover" />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-white text-[24px] font-bold">+{extra}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
