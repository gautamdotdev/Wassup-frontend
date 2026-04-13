import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, prev, next]);

  const touchStart = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "rgba(0,0,0,0.97)", animation: "lbFadeIn 0.18s ease both" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes lbFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes lbZoom   { from{opacity:0;transform:scale(0.90)} to{opacity:1;transform:scale(1)} }
      `}</style>

      {/* top bar */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
        >
          <X size={18} className="text-white" />
        </button>
        <span className="text-white/60 text-[13px] font-medium tabular-nums">
          {idx + 1} / {images.length}
        </span>
        <div className="w-9" />
      </div>

      {/* main image */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-2">
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 z-10 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}

        <img
          key={idx}
          src={images[idx]}
          alt=""
          className="max-w-full max-h-full object-contain rounded-2xl select-none"
          style={{ animation: "lbZoom 0.22s cubic-bezier(0.34,1.2,0.64,1) both" }}
          draggable={false}
        />

        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-3 z-10 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        )}
      </div>

      {/* thumbnail strip */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 px-4 py-5 shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 ${i === idx ? "border-white scale-105 opacity-100" : "border-transparent opacity-40 hover:opacity-60"
                }`}
            >
              <img src={src} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
