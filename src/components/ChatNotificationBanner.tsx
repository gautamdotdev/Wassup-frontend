import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "@/lib/socket";
import { useAuth } from "@/lib/auth";
import { MessageCircle, X } from "lucide-react";

interface Banner {
  id: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  chatUserId: string;  // the other participant's _id (used for /chat/:userId)
}

const BANNER_DURATION_MS = 4500;

/**
 * Global in-app notification banner — shown when a message arrives in a chat
 * the user is NOT currently viewing. Styled like Instagram's DM pop-up.
 * Clicking navigates to that chat.
 */
export function ChatNotificationBanner() {
  const { socket }               = useSocket();
  const { user }                 = useAuth();
  const navigate                 = useNavigate();
  const params                   = useParams<{ userId?: string }>();  // from /chat/:userId
  const [banners, setBanners]    = useState<Banner[]>([]);
  const timerRefs                = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (m: any) => {
      // Only show if this message is from someone else, not the current sender
      const senderId = m.senderId?._id || m.senderId;
      if (!senderId || senderId === user._id) return;

      // Determine the other participant's userId (for navigation)
      const chatParticipants: any[] = m.chatId?.participants ?? [];
      const otherUser = chatParticipants.find(
        (p: any) => (p._id || p) !== user._id
      );
      const chatUserId = otherUser?._id || senderId;

      // Don't show banner if already in this chat
      if (params.userId && params.userId === chatUserId) return;

      const senderId_str = chatUserId?.toString();

      const newBanner: Banner = {
        id:          `${senderId_str}-${Date.now()}`,
        senderName:  m.senderId?.name || otherUser?.name || "Someone",
        senderAvatar: m.senderId?.avatar || otherUser?.avatar,
        text:        m.text || (m.mediaUrl ? "📷 Photo" : m.mediaType === "voice" ? "🎤 Voice message" : "New message"),
        chatUserId:  senderId_str,
      };

      setBanners(prev => {
        // Replace existing banner from same sender (don't stack duplicates)
        const filtered = prev.filter(b => b.chatUserId !== chatUserId);
        return [...filtered, newBanner];
      });

      // Auto-dismiss after BANNER_DURATION_MS
      if (timerRefs.current[senderId_str]) {
        clearTimeout(timerRefs.current[senderId_str]);
      }
      timerRefs.current[senderId_str] = setTimeout(() => {
        dismiss(newBanner.id);
      }, BANNER_DURATION_MS);
    };

    socket.on("message recieved", handleNewMessage);
    return () => { socket.off("message recieved", handleNewMessage); };
  }, [socket, user, params.userId]);

  const dismiss = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const handleClick = (banner: Banner) => {
    dismiss(banner.id);
    navigate(`/chat/${banner.chatUserId}`);
  };

  if (banners.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[min(92vw,380px)]">
      {banners.map(banner => (
        <div
          key={banner.id}
          className="flex items-center gap-3 px-4 py-3
                     bg-[#1c1c1e]/95 dark:bg-[#2c2c2e]/95
                     border border-white/10
                     rounded-2xl shadow-2xl shadow-black/50
                     backdrop-blur-xl
                     cursor-pointer select-none
                     animate-in slide-in-from-top-3 fade-in duration-300"
          onClick={() => handleClick(banner)}
        >
          {/* Avatar */}
          {banner.senderAvatar ? (
            <img
              src={banner.senderAvatar}
              alt={banner.senderName}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500
                            flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-white" />
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{banner.senderName}</p>
            <p className="text-[12px] text-white/60 truncate mt-0.5">{banner.text}</p>
          </div>

          {/* Dismiss */}
          <button
            className="shrink-0 text-white/40 hover:text-white/80 transition-colors p-1"
            onClick={e => { e.stopPropagation(); dismiss(banner.id); }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
