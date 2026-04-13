import React, { useRef } from "react";
import { Image as ImageIcon, Camera, MapPin, User, FileText, Headphones, BarChart2, Calendar, X } from "lucide-react";

export function AttachmentPanel({
  onClose, onAddImages,
}: {
  onClose: () => void;
  onAddImages: (urls: string[]) => void;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const handleDevicePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    Promise.all(
      files.map(
        file => new Promise<string>(resolve => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        })
      )
    ).then(urls => { onAddImages(urls); onClose(); });
    e.target.value = "";
  };

  const options = [
    { id: "gallery", label: "Gallery", icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/20" },
    { id: "camera", label: "Camera", icon: Camera, color: "text-rose-500", bg: "bg-rose-500/10 dark:bg-rose-500/20" },
    { id: "location", label: "Location", icon: MapPin, color: "text-green-500", bg: "bg-green-500/10 dark:bg-green-500/20" },
    { id: "contact", label: "Contact", icon: User, color: "text-cyan-500", bg: "bg-cyan-500/10 dark:bg-cyan-500/20" },
    { id: "document", label: "Document", icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10 dark:bg-indigo-500/20" },
    { id: "audio", label: "Audio", icon: Headphones, color: "text-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/20" },
    { id: "poll", label: "Poll", icon: BarChart2, color: "text-yellow-500", bg: "bg-yellow-500/10 dark:bg-yellow-500/20" },
    { id: "event", label: "Event", icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10 dark:bg-purple-500/20" },
  ];

  return (
    <div>
      <input ref={galleryRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleDevicePick} />
      <input ref={cameraRef} type="file" multiple accept="image/*,video/*" capture="environment" className="hidden" onChange={handleDevicePick} />
      <input ref={docRef} type="file" multiple accept="*/*" className="hidden" onChange={handleDevicePick} />
      <input ref={audioRef} type="file" multiple accept="audio/*" className="hidden" onChange={handleDevicePick} />

      <div className="grid grid-cols-4 gap-y-7 gap-x-2 pt-1 pb-6 px-4">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => {
              if (opt.id === "gallery") galleryRef.current?.click();
              else if (opt.id === "camera") cameraRef.current?.click();
              else if (opt.id === "document") docRef.current?.click();
              else if (opt.id === "audio") audioRef.current?.click();
              else onClose();
            }}
            className="flex flex-col items-center gap-2.5 group active:scale-95 transition-transform"
          >
            <div className={`w-[56px] h-[56px] rounded-[18px] ${opt.bg} flex items-center justify-center group-hover:opacity-80 transition-shadow transition-transform shadow-sm`}>
              <opt.icon size={26} className={opt.color} strokeWidth={1.8} />
            </div>
            <span className="text-[12px] text-foreground/85 font-medium">{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-start px-0" style={{ borderTop: "1px solid rgba(128,128,128,0.08)", paddingTop: "4px" }}>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-transparent hover:bg-secondary/40 text-foreground flex items-center justify-center active:scale-90 transition-all"
        >
          <X size={26} strokeWidth={1.2} />
        </button>
      </div>
    </div>
  );
}
