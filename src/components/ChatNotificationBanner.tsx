import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "@/lib/socket";
import { useAuth } from "@/lib/auth";
import { MessageCircle } from "lucide-react";
import api from "@/lib/api";

interface Banner {
  id: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  chatUserId: string;
}

const BANNER_DURATION_MS     = 4500;
const SWIPE_DISMISS_THRESHOLD = 80;

/**
 * Global in-app notification banner.
 * - Does NOT appear on the chat page of the sender.
 * - Does NOT appear when the chat is muted (persisted via /chats endpoint).
 * - No X button — swipe left or right to dismiss.
 * - Clicking navigates to that chat.
 */
export function ChatNotificationBanner() {
  const { socket }            = useSocket();
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const location              = useLocation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const timerRefs             = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Cache of chatId → isMuted
  const mutedChats            = useRef<Set<string>>(new Set());

  // Parse current chatUserId from URL path: /chat/:userId
  const currentChatId = (() => {
    // Matches /chat/:id or /chat/group/:id
    const match = location.pathname.match(/\/chat\/(?:group\/)?([^/]+)/);
    return match ? match[1] : null;
  })();

  // Fetch muted chat list once on mount and refresh when chats list changes
  useEffect(() => {
    if (!user) return;
    const fetchMuted = async () => {
      try {
        const { data } = await api.get("/chats");
        mutedChats.current = new Set(
          (data as any[]).filter(c => c.isMuted).reduce((acc: string[], c) => {
            // Store the chat ID itself (works for both DM and Group)
            acc.push(c._id);
            // Also store the other user ID specifically for DM lookup consistency
            if (!c.isGroup) {
              const other = c.participants.find((p: any) => (p._id || p) !== user._id);
              const otherId = other?._id || other;
              if (otherId) acc.push(otherId);
            }
            return acc;
          }, [])
        );
      } catch { /* ignore */ }
    };
    fetchMuted();
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (m: any) => {
      const senderId = m.senderId?._id || m.senderId;
      if (!senderId || senderId === user._id) return;

      const chatParticipants: any[] = m.chatId?.participants ?? [];
      const otherUser = chatParticipants.find(
        (p: any) => (p._id?.toString() || p?.toString()) !== user._id?.toString()
      );
      const chatUserId: string = (otherUser?._id || senderId)?.toString();

      // Suppress if already viewing this chat
      const chatId: string = (m.chatId?._id || m.chatId)?.toString();
      if (currentChatId && (currentChatId === chatUserId || currentChatId === chatId)) return;

      // Suppress if muted
      if (mutedChats.current.has(chatUserId) || (chatId && mutedChats.current.has(chatId))) return;

      const newBanner: Banner = {
        id:           `${chatUserId}-${Date.now()}`,
        senderName:   m.senderId?.name || otherUser?.name || "Someone",
        senderAvatar: m.senderId?.avatar || otherUser?.avatar,
        text:         m.text
          || (m.mediaUrl ? "📷 Photo" : m.mediaType === "video" ? "🎬 Video" : m.mediaType === "voice" ? "🎤 Voice message" : "New message"),
        chatUserId,
      };

      setBanners(prev => {
        const filtered = prev.filter(b => b.chatUserId !== chatUserId);
        return [...filtered, newBanner];
      });

      if (timerRefs.current[chatUserId]) clearTimeout(timerRefs.current[chatUserId]);
      timerRefs.current[chatUserId] = setTimeout(() => {
        dismiss(newBanner.id);
      }, BANNER_DURATION_MS);
    };

    socket.on("message recieved", handleNewMessage);
    return () => { socket.off("message recieved", handleNewMessage); };
  }, [socket, user, currentChatId]);

  const dismiss = (id: string) =>
    setBanners(prev => prev.filter(b => b.id !== id));

  const handleClick = (banner: Banner) => {
    dismiss(banner.id);
    navigate(`/chat/${banner.chatUserId}`);
  };

  if (banners.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
      {banners.map(banner => (
        <SwipeableBanner
          key={banner.id}
          banner={banner}
          onClick={() => handleClick(banner)}
          onDismiss={() => dismiss(banner.id)}
        />
      ))}
    </div>
  );
}

/* ── Swipeable individual banner ── */
function SwipeableBanner({
  banner, onClick, onDismiss,
}: {
  banner: Banner;
  onClick: () => void;
  onDismiss: () => void;
}) {
  const startX         = useRef(0);
  const [offsetX, setOffsetX]     = useState(0);
  const [swiping, setSwiping]     = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current;
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (Math.abs(offsetX) >= SWIPE_DISMISS_THRESHOLD) {
      setDismissed(true);
      setTimeout(onDismiss, 280);
    } else {
      setOffsetX(0);
    }
  };

  const opacity = Math.max(0, 1 - Math.abs(offsetX) / 160);

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3
        bg-[#1c1c1e]/95 dark:bg-[#2c2c2e]/95
        border border-white/10 rounded-2xl shadow-2xl shadow-black/50
        backdrop-blur-xl cursor-pointer select-none
        animate-in slide-in-from-top-3 fade-in duration-300
      `}
      style={{
        transform: dismissed
          ? `translateX(${offsetX >= 0 ? "110%" : "-110%"})`
          : `translateX(${offsetX}px)`,
        transition: swiping ? "none" : "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease",
        opacity: dismissed ? 0 : opacity,
      }}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar */}
      {banner.senderAvatar ? (
        <img
          src={banner.senderAvatar}
          alt={banner.senderName}
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0">
          <MessageCircle size={18} className="text-white" />
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white truncate">{banner.senderName}</p>
        <p className="text-[12px] text-white/60 truncate mt-0.5">{banner.text}</p>
      </div>

      {/* Subtle swipe hint */}
      <div className="shrink-0 flex gap-[3px] opacity-30">
        <div className="w-1 h-3 rounded-full bg-white" />
        <div className="w-1 h-3 rounded-full bg-white" />
        <div className="w-1 h-3 rounded-full bg-white" />
      </div>
    </div>
  );
}
