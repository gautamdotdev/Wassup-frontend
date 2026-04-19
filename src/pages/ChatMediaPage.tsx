import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, Play, Grid, Film } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";
import { Lightbox } from "@/components/chat/Lightbox";
import { useAuth } from "../lib/auth";

interface MediaItem {
  _id: string;
  mediaUrl: string;
  mediaType?: "image" | "video" | "voice";
  createdAt: string;
  senderId?: any;
}

type Tab = "all" | "images" | "videos";

const ChatMediaPage = () => {
  const { userId }  = useParams<{ userId: string }>();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [chatId, setChatId]     = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [media, setMedia]       = useState<MediaItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>("all");
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: chatData } = await api.post("/chats", { userId });
        setChatId(chatData._id);
        const other = chatData.participants.find((p: any) => p._id !== user?._id);
        setChatUser(other);

        const { data } = await api.get(`/chats/${chatData._id}/media`);
        setMedia(data.filter((m: MediaItem) => m.mediaType !== "voice"));
      } catch { toast.error("Failed to load media"); }
      finally { setLoading(false); }
    };
    if (userId) load();
  }, [userId, user]);

  const filtered = media.filter(m =>
    tab === "all"    ? true :
    tab === "images" ? m.mediaType !== "video" :
    m.mediaType === "video"
  );

  const imageUrls = filtered.filter(m => m.mediaType !== "video").map(m => m.mediaUrl);

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto flex flex-col">
      {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/20 px-4 pt-6 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={17} strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold text-foreground leading-tight">Media & Files</h1>
            {chatUser && <p className="text-[12px] text-muted-foreground truncate">{chatUser.name}</p>}
          </div>
          <span className="text-[12px] text-muted-foreground">{filtered.length} items</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mx-4 px-4">
          {(["all", "images", "videos"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold capitalize transition-colors border-b-2
                ${tab === t ? "text-foreground border-foreground" : "text-muted-foreground/60 border-transparent hover:text-muted-foreground"}`}>
              {t === "images" && <ImageIcon size={13} />}
              {t === "videos" && <Film size={13} />}
              {t === "all"    && <Grid size={13} />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-[14px] animate-pulse">Loading media…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <ImageIcon size={28} strokeWidth={1} />
          </div>
          <div className="text-center">
            <p className="text-[16px] font-semibold text-foreground">No media yet</p>
            <p className="text-[13px] text-muted-foreground mt-1">Shared photos & videos will appear here</p>
          </div>
        </div>
      ) : (
        <div className="px-1 pt-1 pb-8 grid grid-cols-3 gap-0.5">
          {filtered.map((item, i) => {
            const isVideo = item.mediaType === "video";
            return (
              <button
                key={item._id}
                onClick={() => {
                  if (isVideo) return; // video: just let it play inline
                  const imgs = filtered.filter(m => m.mediaType !== "video").map(m => m.mediaUrl);
                  const idx  = imgs.indexOf(item.mediaUrl);
                  if (idx >= 0) setLightbox({ images: imgs, index: idx });
                }}
                className="relative aspect-square bg-secondary overflow-hidden group"
              >
                {isVideo ? (
                  <div className="w-full h-full relative">
                    <video src={item.mediaUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play size={20} className="text-white" fill="white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.mediaUrl} alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                )}
                {/* Date label on first item of each day */}
                {(i === 0 || new Date(filtered[i - 1].createdAt).toDateString() !== new Date(item.createdAt).toDateString()) && (
                  <div className="absolute top-1 left-1.5">
                    <span className="text-[9px] font-medium text-white bg-black/50 rounded-full px-1.5 py-0.5 backdrop-blur-sm">
                      {new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatMediaPage;
