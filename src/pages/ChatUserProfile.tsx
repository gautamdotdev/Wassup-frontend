import { ArrowLeft, MoreVertical, ChevronRight, Bell, Image as ImageIcon, Bookmark, Lock, AlertTriangle, Trash2, Timer } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

const mockPhotos = [
  "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1524316986518-e7144e00508a?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1502472584811-0a2f2feb8968?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&h=400&fit=crop"
];

const ChatUserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await api.get(`/users`);
      // Finding the specific user from the list since we don't have a get single user by ID endpoint yet in the provided backend snippets, 
      // but let's assume we can filter or look for it. 
      // Actually, looking at user.controller.ts, it returns all users. 
      // Let's refine the logic or stick to fetching all and finding for now if a single endpoint is missing.
      return res.data.find((u: any) => u._id === userId);
    },
    enabled: !!userId
  });

  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const settingsItems = [
    { icon: Bell, label: "Notification", sub: "Manage alerts" },
    { icon: ImageIcon, label: "Media visibility", sub: "Control what's saved" },
    { icon: Bookmark, label: "Bookmarked", sub: "View saved messages" },
    { icon: Timer, label: "Disappearing messages", sub: "Set auto-delete timer" },
  ];

  const privacyItems = [
    { icon: AlertTriangle, label: "Block contact", sub: "Stop receiving messages" },
    { icon: Trash2, label: "Clear chat", sub: "Delete all messages" },
  ];

  return (
    <div className="min-h-screen z-50 bg-background max-w-[430px] mx-auto overflow-y-auto scrollbar-none flex flex-col items-center pb-20">

      {/* Header */}
      <div className="w-full px-5 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <MoreVertical size={17} strokeWidth={2} />
        </button>
      </div>

      {/* Profile Image & Name */}
      <div className="flex flex-col items-center mt-2 w-full">
        {isLoading ? (
          <div className="w-[100px] h-[100px] rounded-full bg-secondary animate-pulse" />
        ) : (
          <>
            <div className="relative">
              <img
                src={user?.avatar || "https://i.pravatar.cc/150"}
                className="w-[100px] h-[100px] rounded-full object-cover shadow-sm"
                alt={user?.name}
              />
              {user?.online && (
                <div className="absolute bottom-1 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-wide mt-4">{user?.name || "User"}</h2>
          </>
        )}
      </div>

      {/* Media and photos */}
      <div className="w-full px-5 mt-6 mb-4">
        <div className="bg-card rounded-[22px] p-4 shadow-sm border border-border/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-semibold text-[15px]">Media and photos</h3>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none rounded-xl">
            {mockPhotos.map((src, i) => (
              <div key={i} className="relative w-[calc(25%-6px)] aspect-[4/5] rounded-xl overflow-hidden shrink-0">
                <img src={src} className="w-full h-full object-cover" alt="" />
                {i === 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold text-[15px]">+42</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings section */}
      <div className="w-full px-5 mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Settings</p>
        <div className="flex flex-col rounded-[20px] bg-secondary/30 px-4 py-2 border border-border/40">
          {settingsItems.map(({ icon: Icon, label, sub }, i, arr) => (
            <button
              key={label}
              className={`w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99] border-b border-border/40 ${i === arr.length - 1 ? "border-none" : ""}`}
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm border border-border/20">
                <Icon size={18} strokeWidth={1.8} className="text-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-medium text-foreground leading-tight">{label}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/60 shrink-0" />
            </button>
          ))}

          {/* Lock Chat toggle */}
          <button
            onClick={() => setIsLocked(!isLocked)}
            className="w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm border border-border/20">
              <Lock size={18} strokeWidth={1.8} className="text-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-foreground leading-tight">Lock Chat</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{isLocked ? "Locked" : "Unlocked"}</p>
            </div>
            <div className={`w-[42px] h-[26px] rounded-full flex items-center px-[3px] transition-colors duration-300 ${isLocked ? "bg-green-500" : "bg-muted-foreground/30 dark:bg-black/40"}`}>
              <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-transform duration-300 ${isLocked ? "translate-x-[16px]" : "translate-x-0"}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Privacy section */}
      <div className="w-full px-5 mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Privacy</p>
        <div className="flex flex-col rounded-[20px] bg-secondary/30 px-4 py-2 border border-border/40">
          {privacyItems.map(({ icon: Icon, label, sub }, i, arr) => (
            <button
              key={label}
              className={`w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99] border-b border-border/40 ${i === arr.length - 1 ? "border-none" : ""}`}
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Icon size={18} strokeWidth={1.8} className="text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-medium text-red-500 leading-tight">{label}</p>
                <p className="text-[12px] text-red-400/70 mt-0.5">{sub}</p>
              </div>
              <ChevronRight size={16} className="text-red-400/60 shrink-0" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ChatUserProfile;