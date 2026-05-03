import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, Settings, RefreshCw, BellOff } from "lucide-react";
import { FiMoreVertical } from "react-icons/fi";
import { toast } from "sonner";
import { useIsDark } from "@/hooks/useIsDark";

const FAKE_ARCHIVED = [
  { _id: "a1", name: "Old Project Team", avatar: "https://i.pravatar.cc/150?img=10", lastMsg: "Let's wrap this up", time: "3d ago" },
  { _id: "a2", name: "Jane Doe", avatar: "https://i.pravatar.cc/150?img=20", lastMsg: "Thanks for everything!", time: "1w ago" },
  { _id: "a3", name: "Travel Group", avatar: "https://i.pravatar.cc/150?img=30", lastMsg: "📷 Photo", time: "2w ago" },
];

const ArchivedPage = () => {
  const navigate = useNavigate();
  const isDark = useIsDark();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  const pill = isDark
    ? { background: "rgba(20,20,20,0.82)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 32px rgba(0,0,0,0.55),0 1px 0 rgba(255,255,255,0.06) inset" }
    : { background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.12),0 1px 0 rgba(255,255,255,0.9) inset" };
  const blurStyle = { ...pill, backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" };

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-[430px] mx-auto relative bg-background">
      <style>{`
        @keyframes menuIn { from{opacity:0;transform:scale(0.88) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-background/50">
        <div className="flex items-center gap-3 px-4 py-3 pb-4">
          <button onClick={() => navigate(-1)} className="text-foreground hover:opacity-80 transition-opacity">
            <ArrowLeft size={22} strokeWidth={1.5} />
          </button>

          <div className="flex flex-col flex-1 overflow-hidden leading-tight justify-center mt-0.5">
            <span className="font-semibold text-foreground text-[20px] truncate">Archived</span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <div className="relative ml-2" ref={menuRef}>
              <button ref={moreBtnRef} onClick={() => setShowMenu(p => !p)}
                className={`w-10 h-10 overflow-hidden flex items-center justify-center rounded-full bg-secondary/80 text-foreground transition-colors backdrop-blur-md active:scale-95 shrink-0 ${showMenu ? "bg-muted" : ""}`}>
                <FiMoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-50 overflow-hidden"
                  style={{
                    background: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
                    boxShadow: isDark 
                      ? "0 4px 20px rgba(0,0,0,0.4)" 
                      : "0 4px 20px rgba(0,0,0,0.08)",
                    animation: "menuIn 0.18s cubic-bezier(0.34,1.2,0.64,1) both",
                    transformOrigin: "top right"
                  }}>
                  {[
                    { icon: <Settings size={16} strokeWidth={1.5} />, label: "Archive settings", fn: () => { setShowMenu(false); toast.info("Archive settings"); } },
                    { icon: <BellOff size={16} strokeWidth={1.5} />, label: "Mark all as read", fn: () => { setShowMenu(false); toast.info("All marked as read"); } },
                    { icon: <RefreshCw size={16} strokeWidth={1.5} />, label: "Refresh", fn: () => { setShowMenu(false); toast.info("Refreshing archived chats"); } },
                  ].map((item, i, arr) => (
                    <button key={i} onClick={item.fn}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
                      <span className="text-muted-foreground">{item.icon}</span>{item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-2 pb-6">
        <div className="px-5 pb-3">
          <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            {FAKE_ARCHIVED.length} archived chats — simulated
          </p>
        </div>
        {FAKE_ARCHIVED.map((ac) => (
          <div key={ac._id}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/50 transition-colors cursor-pointer select-none"
            onClick={() => toast.info(`Open archived: ${ac.name}`)}>
            <div className="relative shrink-0">
              <img src={ac.avatar} className="w-[58px] h-[58px] rounded-full object-cover" alt={ac.name} />
              <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                <Archive size={10} className="text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0 text-left self-center mt-1 pb-1">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-[16px] leading-tight truncate pr-2 text-foreground">{ac.name}</p>
                <span className="text-[12px] shrink-0 text-muted-foreground">{ac.time}</span>
              </div>
              <p className="text-[14px] truncate text-muted-foreground">{ac.lastMsg}</p>
            </div>
          </div>
        ))}
        {FAKE_ARCHIVED.length === 0 && (
          <div className="px-5 py-12 text-center flex flex-col items-center gap-2">
            <Archive size={32} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No archived chats</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedPage;