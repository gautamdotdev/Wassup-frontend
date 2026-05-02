import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Phone, Video, MoreVertical, X, BellOff, Bell,
  Search, Image, Palette, ChevronRight, ChevronDown,
  Ban, Trash2, Download, Flag, Reply, Copy,
  Forward, Info, Plus, ChevronUp, Pencil,
} from "lucide-react";
import { FaPencilAlt } from "react-icons/fa";
import { FiPlus, FiCamera, FiSend } from "react-icons/fi";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useIsDark } from "@/hooks/useIsDark";
import { useMediaUrl, isVideo } from "@/hooks/useMediaUrl";
import { Msg } from "@/types/chat";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSocket } from "../lib/socket";

import { Lightbox } from "@/components/chat/Lightbox";
import { SwipeRow } from "@/components/chat/SwipeRow";
import { AttachmentPanel } from "@/components/chat/AttachmentPanel";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { useQuickReactions } from "@/hooks/useQuickReactions";
import { ConfirmModal } from "@/components/chat/ConfirmModal";
import { ThemePicker, ChatTheme, THEMES } from "@/components/chat/ThemePicker";
import { LockScreen } from "@/components/chat/LockScreen";
import { MediaRenderer } from "@/components/chat/MediaRenderer";
import { Chat, User } from "@/types/chat";

type MsgMenu = { msgId: string; x: number; y: number; msg: Msg } | null;
type ConfirmType = "block" | "clear" | null;
type UploadStatus = "idle" | "uploading" | "done" | "error";
interface SearchHit { _id: string; text: string; createdAt: string }

// ── Animated background (same components as ThemePicker, re-exported here) ──

function LoveParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes floatHeartChat {
          0%   { transform: translateY(0) scale(1) rotate(var(--r)); opacity: 0; }
          10%  { opacity: var(--op); }
          90%  { opacity: var(--op); }
          100% { transform: translateY(-110vh) scale(var(--s)) rotate(calc(var(--r)+30deg)); opacity: 0; }
        }
        .love-heart-chat {
          position:absolute; bottom:-60px;
          animation: floatHeartChat var(--dur) var(--delay) infinite ease-in-out;
          font-size: var(--fsize); user-select: none; max-width:430px;
        }
      `}</style>
      {Array.from({ length: 14 }).map((_, i) => {
        const emojis = ["❤️", "💕", "💗", "💓", "🩷", "💖", "💝", "💘"];
        return (
          <span key={i} className="love-heart-chat" style={{
            left: `${5 + (i * 6.5) % 88}%`,
            "--dur": `${7 + (i * 1.5) % 8}s`,
            "--delay": `${-(i * 0.9) % 8}s`,
            "--fsize": `${14 + (i * 8) % 22}px`,
            "--r": `${-15 + (i * 12) % 30}deg`,
            "--s": `${0.8 + (i * 0.1) % 0.5}`,
            "--op": `${0.25 + (i * 0.05) % 0.35}`,
          } as any}>{emojis[i % emojis.length]}</span>
        );
      })}
    </div>
  );
}

function GalaxyStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes twinkleChat { 0%,100%{opacity:.1;transform:scale(.8)} 50%{opacity:1;transform:scale(1.3)} }
        .gc-star { position:absolute; border-radius:50%; background:white; animation:twinkleChat var(--d) var(--del) infinite; }
      `}</style>
      {Array.from({ length: 55 }).map((_, i) => (
        <div key={i} className="gc-star" style={{
          left: `${(i * 17.3) % 100}%`, top: `${(i * 13.7) % 100}%`,
          width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
          "--d": `${1.5 + (i * 0.4) % 3}s`, "--del": `${-(i * 0.25) % 3}s`,
        } as any} />
      ))}
    </div>
  );
}

function AuroraWaves() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes aw1c { 0%,100%{transform:translateX(-20%) scaleY(1);opacity:.2} 50%{transform:translateX(20%) scaleY(1.3);opacity:.35} }
        @keyframes aw2c { 0%,100%{transform:translateX(15%) scaleY(.9);opacity:.15} 50%{transform:translateX(-15%) scaleY(1.2);opacity:.3} }
        .aurora-band-c { position:absolute; width:200%; left:-50%; border-radius:9999px; filter:blur(40px); }
      `}</style>
      <div className="aurora-band-c" style={{ height: "35%", top: "10%", background: "linear-gradient(90deg,#00ffcc,#00bfff,#7fffaa)", animation: "aw1c 6s ease-in-out infinite" }} />
      <div className="aurora-band-c" style={{ height: "30%", top: "30%", background: "linear-gradient(90deg,#00e5ff,#00ff88,#00ccff)", animation: "aw2c 8s ease-in-out infinite" }} />
      <div className="aurora-band-c" style={{ height: "25%", top: "50%", background: "linear-gradient(90deg,#00ffaa,#00e5ff)", animation: "aw1c 10s ease-in-out infinite reverse" }} />
    </div>
  );
}

function FlirtBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes fbChat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.06)} }
        .fb-blob { position:absolute; border-radius:50%; filter:blur(50px); }
      `}</style>
      {[
        { w: 160, h: 160, top: "8%", left: "-5%", bg: "rgba(244,114,182,0.2)", dur: "7s", del: "0s" },
        { w: 120, h: 120, top: "55%", left: "8%", bg: "rgba(192,38,211,0.15)", dur: "9s", del: "-3s" },
        { w: 200, h: 200, top: "28%", right: "-8%", bg: "rgba(244,114,182,0.15)", dur: "11s", del: "-5s" },
      ].map((b, i) => (
        <div key={i} className="fb-blob" style={{
          width: b.w, height: b.h, top: b.top,
          left: b.left ?? undefined, right: (b as any).right ?? undefined,
          background: b.bg, animation: `fbChat ${b.dur} ${b.del} infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

function BasketballBg() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0" style={{ opacity: 0.06 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50%" cy="45%" r="100" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="50%" cy="45%" r="24" fill="none" stroke="#fff" strokeWidth="1.5" />
        <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#fff" strokeWidth="1" strokeDasharray="6 6" />
      </svg>
    </div>
  );
}

function ChatAnimatedBg({ themeId }: { themeId: ChatTheme }) {
  if (themeId === "love") return <LoveParticles />;
  if (themeId === "galaxy") return <GalaxyStars />;
  if (themeId === "aurora") return <AuroraWaves />;
  if (themeId === "basketball") return <BasketballBg />;
  if (themeId === "flirt") return <FlirtBlobs />;
  return null;
}

// ── Pending preview ──────────────────────────────────────────────────────────

const PendingPreviewImg = ({ url }: { url: string }) => {
  const { url: converted, loading } = useMediaUrl(url);
  if (loading) return <div className="w-16 h-16 bg-secondary rounded-xl animate-pulse" />;
  return <img src={converted} className="w-16 h-16 object-cover rounded-xl" alt="" />;
};

// ── ChatPage ─────────────────────────────────────────────────────────────────

const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = useIsDark();

  /* refs */
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatUserIdRef = useRef<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const msgMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);
  const lpStartX = useRef(0);
  const lpStartY = useRef(0);
  const quickCameraRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* auth / socket */
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  /* state */
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatUser, setChatUser] = useState<any>(null);
  const [chatUserOnline, setChatUserOnline] = useState(false);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ url: string; file?: File }[]>([]);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [showMenu, setShowMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searchIdx, setSearchIdx] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [confirmType, setConfirmType] = useState<ConfirmType>(null);
  const [chatTheme, setChatTheme] = useState<ChatTheme>("default");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUnlocked, setLockUnlocked] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState<"verify" | "set" | null>(null);
  const [msgInfoOpen, setMsgInfoOpen] = useState<Msg | null>(null);
  const { quickReactions, replaceReaction } = useQuickReactions();
  const [emojiPickerMode, setEmojiPickerMode] = useState<"react" | { replaceIndex: number } | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadWhileAway, setUnreadWhileAway] = useState(0);
  const [msgMenu, setMsgMenu] = useState<MsgMenu>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingMsg, setEditingMsg] = useState<Msg | null>(null);

  const fetchMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !currentChat || messages.length === 0) return;
    setLoadingMore(true);
    
    // Save current scroll height to restore later
    const oldScrollHeight = scrollRef.current?.scrollHeight || 0;

    try {
      const oldestMsg = messages[0];
      const { data } = await api.get(`/messages/${currentChat._id}`, {
        params: { cursor: oldestMsg.createdAt, limit: 30 }
      });

      if (data.length < 30) setHasMore(false);

      const myId = user?._id;
      const mapped: Msg[] = data.map((m: any) => {
        const sId = m.senderId?._id || m.senderId;
        const isMe = sId === myId;
        let replyTo: Msg["replyTo"] | undefined;
        if (m.replyTo) {
          const rtId = m.replyTo.senderId?._id || m.replyTo.senderId;
          replyTo = { id: m.replyTo._id, senderId: rtId === myId ? "me" : "other", text: m.replyTo.text || "Voice message" };
        }
        return {
          id: m._id, senderId: isMe ? "me" : "other",
          sender: m.senderId,
          text: m.text,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          status: isMe ? (m.tickStatus ?? "sent") : undefined,
          readBy: m.readBy || [],
          reactions: m.reactions || [],
          ...(replyTo ? { replyTo } : {}),
          ...(m.mediaUrl ? { images: [m.mediaUrl], mediaType: m.mediaType } : {}),
          isSystem: m.isSystem,
          isEdited: m.isEdited,
          createdAt: m.createdAt,
        };
      });

      if (mapped.length > 0) {
        setMessages(prev => [...mapped, ...prev]);
        
        // Restore scroll position
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - oldScrollHeight;
          }
        }, 0);
      }
    } catch (err) {
      console.error("Failed to fetch more messages", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentChat, messages, user]);

  useEffect(() => {
    const onFocus = () => {
      if (currentChat?._id) {
        api.post(`/messages/read/${currentChat._id}`).catch(() => { });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [currentChat?._id, queryClient]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reply") === "true") {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [location.search]);

  /* Group specific state */
  const [isGroup, setIsGroup] = useState(false);
  const [groupData, setGroupData] = useState<Chat | null>(null);

  // ── Resolve theme colors ──
  const themeDef = THEMES.find(t => t.id === chatTheme) || THEMES[0];
  const isDefault = chatTheme === "default";

  const isEffectiveDark = isDark || !isDefault;

  // Glassmorphism pill for input bar
  const pill = isEffectiveDark
    ? { background: "rgba(20,20,20,0.82)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 32px rgba(0,0,0,0.55),0 1px 0 rgba(255,255,255,0.06) inset" }
    : { background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.12),0 1px 0 rgba(255,255,255,0.9) inset" };
  const blurStyle = { ...pill, backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" };

  // Theme-tinted input pill (more opaque for legibility)
  const inputPillStyle = isDefault ? blurStyle : {
    background: `${themeDef.hex}F2`,
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    backdropFilter: "blur(25px) saturate(160%)",
    WebkitBackdropFilter: "blur(25px) saturate(160%)",
  };

  const sheetBg = {
    background: isEffectiveDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
    border: isEffectiveDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 -20px 60px rgba(0,0,0,0.45)",
    animation: "slideUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both",
  };

  const dropdownBg = {
    background: isEffectiveDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
    border: isEffectiveDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  };

  const closeMsgMenu = useCallback(() => { setMsgMenu(null); setEmojiPickerMode(null); }, []);

  useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadWhileAway(0);

    // If reached top, load more
    if (el.scrollTop < 100 && !loadingMore && hasMore) {
      fetchMoreMessages();
    }
  }, [loadingMore, hasMore, fetchMoreMessages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setUnreadWhileAway(0);
  }, []);

  const scrollToMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("msg-highlight");
    setTimeout(() => el.classList.remove("msg-highlight"), 1500);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setShowMenu(false); setShowMoreMenu(false); }
      if (emojiPickerMode !== null) return;
      if (msgMenuRef.current && !msgMenuRef.current.contains(e.target as Node)) closeMsgMenu();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [emojiPickerMode, closeMsgMenu]);

  const startLongPress = useCallback((msg: Msg, e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    lpStartX.current = clientX; lpStartY.current = clientY;
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(30);
      setMsgMenu({ msgId: msg.id, x: clientX, y: clientY, msg });
    }, 450);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const moveLongPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const x = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    if (Math.abs(x - lpStartX.current) > 10 || Math.abs(y - lpStartY.current) > 10) cancelLongPress();
  }, [cancelLongPress]);

  const handleQuickCameraPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    Promise.all(files.map(f => new Promise<{ url: string; file: File }>(res => {
      const r = new FileReader();
      r.onload = () => res({ url: r.result as string, file: f });
      r.readAsDataURL(f);
    }))).then(items => addPending(items));
    e.target.value = "";
  };

  const openSearch = () => { setSearchOpen(true); setShowMenu(false); setTimeout(() => searchInputRef.current?.focus(), 80); };
  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); setSearchIdx(-1); };

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !currentChat) { setSearchResults([]); setSearchIdx(-1); return; }
    setSearchLoading(true);
    try {
      const { data } = await api.get(`/messages/${currentChat._id}/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data);
      const idx = data.length - 1;
      setSearchIdx(idx);
      if (idx >= 0) scrollToMessage(data[idx]._id);
    } catch { } finally { setSearchLoading(false); }
  }, [currentChat, scrollToMessage]);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => doSearch(q), 500);
  };

  const goToPrevResult = () => {
    if (!searchResults.length) return;
    const next = (searchIdx - 1 + searchResults.length) % searchResults.length;
    setSearchIdx(next); scrollToMessage(searchResults[next]._id);
  };
  const goToNextResult = () => {
    if (!searchResults.length) return;
    const next = (searchIdx + 1) % searchResults.length;
    setSearchIdx(next); scrollToMessage(searchResults[next]._id);
  };

  const handleMuteToggle = async () => {
    try {
      await api.post(`/chats/${currentChat._id}/mute`, { mute: !isMuted });
      setIsMuted(p => !p);
      toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
    } catch { toast.error("Failed to update notifications"); }
    setShowMenu(false);
  };
   const handleMediaFiles = () => { 
    const path = isGroup ? `/chat/group/${userId}/media` : `/chat/${userId}/media`;
    navigate(path); 
    setShowMenu(false); 
  };
  const handleChatTheme = () => { setShowThemePicker(true); setShowMenu(false); };

  const applyTheme = async (theme: ChatTheme) => {
    setShowThemePicker(false);
    setChatTheme(theme);
    if (userId) localStorage.setItem(`chat-theme-${userId}`, theme);
    try { await api.post(`/chats/${currentChat._id}/theme`, { theme }); }
    catch { toast.error("Failed to save theme"); }
  };

  const handleBlockUser = () => { setShowMenu(false); setShowMoreMenu(false); setConfirmType("block"); };
  const handleClearChat = () => { setShowMenu(false); setShowMoreMenu(false); setConfirmType("clear"); };
  const handleExportChat = async () => {
    setShowMenu(false); setShowMoreMenu(false);
    try {
      const text = messages.map(m => `[${m.timestamp}] ${m.senderId === "me" ? "You" : chatUser?.name}: ${m.text || "[media]"}`).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
      a.download = `chat-${chatUser?.name || "export"}.txt`;
      a.click();
      toast.success("Chat exported");
    } catch { toast.error("Export failed"); }
  };
  const handleReport = () => { setShowMenu(false); setShowMoreMenu(false); toast.info("Report submitted"); };

  const doBlock = async () => {
    setConfirmType(null);
    try { await api.post(`/chats/${currentChat._id}/block`); toast.success(`${chatUser?.name} blocked`); navigate("/messengers", { replace: true }); }
    catch { toast.error("Failed to block user"); }
  };
  const doClear = async () => {
    setConfirmType(null); setMessages([]);
    try {
      await api.delete(`/chats/${currentChat._id}/messages`);
      toast.success("Chat cleared");
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    } catch {
      toast.error("Failed to clear chat");
      const { data } = await api.get(`/messages/${currentChat._id}`).catch(() => ({ data: [] }));
      setMessages(data);
    }
  };
  const handleVerifyLock = async (password: string): Promise<boolean> => {
    try {
      const { data } = await api.post(`/chats/${currentChat._id}/verify-lock`, { password });
      if (data.verified) { setLockUnlocked(true); return true; }
      return false;
    } catch { return false; }
  };

  const handleMsgReply = (msg: Msg) => { setReplyingTo(msg); closeMsgMenu(); };
  const handleMsgCopy = (msg: Msg) => { navigator.clipboard?.writeText(msg.text || ""); toast.success("Copied"); closeMsgMenu(); };
  const handleMsgForward = (_msg: Msg) => { toast.info("Forward coming soon"); closeMsgMenu(); };
  const handleMsgInfo = (msg: Msg) => { setMsgInfoOpen(msg); closeMsgMenu(); };
  const handleMsgEdit = (msg: Msg) => {
    setEditingMsg(msg);
    setInput(msg.text || "");
    closeMsgMenu();
    setTimeout(() => inputRef.current?.focus(), 80);
  };
  const handleMsgDelete = async (msg: Msg, forEveryone = false) => {
    closeMsgMenu();
    if (!forEveryone) {
      setMessages(p => p.filter(m => m.id !== msg.id));
    }
    try {
      await api.delete(`/messages/${msg.id}`, { 
        params: { deleteForEveryone: forEveryone },
        data: { deleteForEveryone: forEveryone } 
      });
      if (!forEveryone) {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      }
    } catch { toast.error("Failed to delete"); }
  };

  useEffect(() => {
    if (!socket || !currentChat?._id) return;
    const join = () => socket.emit("join chat", currentChat._id);
    join(); socket.on("connect", join);
    return () => { socket.off("connect", join); };
  }, [socket, currentChat?._id]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (userId) {
        const cached = localStorage.getItem(`chat-theme-${userId}`) as ChatTheme | null;
        if (cached) setChatTheme(cached);
      }
      try {
        const isGroupId = location.pathname.includes('/chat/group/') || window.location.hash.includes('/chat/group/');
        setIsGroup(isGroupId);

        let chatData;
        if (isGroupId) {
          const res = await api.get(`/chats`);
          chatData = res.data.find((c: any) => c._id === userId);
          if (!chatData) throw new Error('Chat not found');
        } else {
          const res = await api.post('/chats', { userId });
          chatData = res.data;
        }

        if (!active) return;
        setCurrentChat(chatData);
        setGroupData(chatData);

        if (isGroupId) {
          setChatUser({ name: chatData.chatName, avatar: chatData.avatar });
        } else {
          const other = chatData.participants.find((p: any) => p._id !== user?._id);
          setChatUser(other);
          chatUserIdRef.current = other?._id ?? null;
          setChatUserOnline(!!other?.online);
        }

        setIsMuted(!!chatData.mutedBy?.some((m: any) => (m._id || m) === user?._id));
        const serverTheme = (chatData.theme || "default") as ChatTheme;
        setChatTheme(serverTheme);
        if (userId) localStorage.setItem(`chat-theme-${userId}`, serverTheme);
        const locked = !!chatData.locks?.some((l: any) => (l.user?._id || l.user) === user?._id);
        setIsLocked(locked);
        if (locked) setShowLockScreen("verify");

        const { data: msgsData } = await api.get(`/messages/${chatData._id}`);
        if (!active) return;
        const myId = user?._id;
        const mapped: Msg[] = msgsData.map((m: any) => {
          const sId = m.senderId?._id || m.senderId;
          const isMe = sId === myId;
          let replyTo: Msg["replyTo"] | undefined;
          if (m.replyTo) {
            const rtId = m.replyTo.senderId?._id || m.replyTo.senderId;
            replyTo = { id: m.replyTo._id, senderId: rtId === myId ? "me" : "other", text: m.replyTo.text || "Voice message" };
          }
          return {
            id: m._id, senderId: isMe ? "me" : "other",
            sender: m.senderId,
            text: m.text,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            status: isMe ? (m.tickStatus ?? "sent") : undefined,
            readBy: m.readBy || [],
            reactions: m.reactions || [],
            ...(replyTo ? { replyTo } : {}),
            ...(m.mediaUrl ? { images: [m.mediaUrl], mediaType: m.mediaType } : {}),
            isSystem: m.isSystem,
            isEdited: m.isEdited,
            createdAt: m.createdAt,
          };
        });
        prevMsgCountRef.current = mapped.length;
        setMessages(mapped);
        setHasMore(mapped.length >= 30);
        
        // Scroll to bottom on initial load
        setTimeout(() => scrollToBottom("auto"), 100);

        const hasUnreadFromOthers = mapped.some(m => m.senderId === "other" && !m.readBy?.some(u => (u?._id || u) === myId));
        if (hasUnreadFromOthers) {
          await api.post(`/messages/read/${chatData._id}`).catch(() => { });
        }
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      } catch (err: any) {
        if (err.response?.status === 403) { toast.error("Must connect before chatting"); navigate("/search"); }
        else console.error("Failed to load chat", err);
      }
    };
    if (userId) load();
    return () => { active = false; };
  }, [userId, user]);

  useEffect(() => {
    if (!socket) return;
    const onNewMsg = (m: any) => {
      const cid = m.chatId?._id || m.chatId;
      if (!currentChat || cid !== currentChat._id) return;

      const senderIdRaw = m.senderId?._id || m.senderId;
      setMessages(prev => {
        // Prevent duplicates
        if (prev.find(x => x.id === m._id)) return prev;

        const myId = user?._id;
        const isMe = senderIdRaw === myId;

        let replyTo: Msg["replyTo"] | undefined;
        if (m.replyTo) {
          const rtIdRaw = m.replyTo.senderId?._id || m.replyTo.senderId;
          replyTo = {
            id: m.replyTo._id || m.replyTo,
            senderId: (rtIdRaw === myId) ? "me" : "other",
            text: m.replyTo.text || (m.replyTo.mediaUrl ? "Media message" : "Voice message")
          };
        }

        const newMsg: Msg = {
          id: m._id,
          senderId: isMe ? "me" : "other",
          sender: m.senderId,
          text: m.text,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          status: isMe ? (m.tickStatus || "sent") : undefined,
          readBy: m.readBy || [],
          reactions: m.reactions || [],
          ...(replyTo ? { replyTo } : {}),
          ...(m.mediaUrl ? { images: [m.mediaUrl], mediaType: m.mediaType } : {}),
          isSystem: m.isSystem,
          isEdited: m.isEdited,
          createdAt: m.createdAt,
        };

        return [...prev, newMsg];
      });

      // Clear typing indicator for this sender
      if (isGroup) {
        setTypingUsers(prev => prev.filter(u => (u._id || (u as any).userId) !== senderIdRaw));
      } else if (senderIdRaw === chatUserIdRef.current) {
        setIsTyping(false);
      }

      // Handle read receipts and global list invalidation for other's messages
      if (senderIdRaw.toString() !== user?._id?.toString()) {
        if (!isAtBottomRef.current) setUnreadWhileAway(c => c + 1);
        if (readDebounceRef.current) clearTimeout(readDebounceRef.current);
        readDebounceRef.current = setTimeout(() => {
          api.post(`/messages/read/${cid}`).catch(() => { });
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }, 1500);
      } else {
        // Even for my messages, invalidate chats to update latest message in sidebar
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      }
    };
    const onDelivered = ({ messageId, chatId }: any) => {
      if (!currentChat || chatId !== currentChat._id) return;
      setMessages(p => p.map(m => m.senderId === "me" && m.status === "sent" && (!messageId || m.id === messageId) ? { ...m, status: "delivered" } : m));
    };
    const onManyDelivered = ({ chatId, messageIds }: any) => {
      if (!currentChat || chatId !== currentChat._id) return;
      const s = new Set(messageIds as string[]);
      setMessages(p => p.map(m => m.senderId === "me" && m.status === "sent" && s.has(m.id) ? { ...m, status: "delivered" } : m));
    };
    const onRead = ({ chatId, readBy, user: readByUser }: any) => {
      if (!currentChat || chatId !== currentChat._id) return;
      const rId = (readBy?._id || readBy)?.toString();

      setMessages(p => p.map(m => {
        const isMyMsg = m.senderId === "me";
        const currentRB = m.readBy || [];
        const alreadyRead = currentRB.some(ru => (ru?._id?.toString() || ru.toString()) === rId);

        if (rId && rId !== user?._id && !alreadyRead) {
          const userObj = readByUser || groupData?.participants?.find((x: any) => x._id === rId) || { _id: rId, name: "Someone", avatar: "" };
          return {
            ...m,
            readBy: [...currentRB, userObj],
            status: isMyMsg ? "seen" : m.status
          };
        }

        return isMyMsg && rId && rId !== user?._id ? { ...m, status: "seen" } : m;
      }));

      queryClient.invalidateQueries({ queryKey: ["chats"] });
    };
    const onReaction = ({ messageId, reactions }: any) => setMessages(p => p.map(m => m.id === messageId ? { ...m, reactions } : m));
    const onMsgDeleted = ({ messageId }: any) => setMessages(p => p.filter(m => m.id !== messageId));
    const onMsgEdited = ({ messageId, text, systemMsg, isEdited }: any) => {
      setMessages(p => {
        const next = p.map(m => m.id === messageId ? { ...m, text, isEdited: isEdited ?? true } : m);
        if (systemMsg) {
          const sys = {
            id: systemMsg._id,
            senderId: "other",
            text: systemMsg.text,
            isSystem: true,
            timestamp: new Date(systemMsg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          };
          if (!next.find(x => x.id === sys.id)) next.push(sys);
        }
        return next;
      });
    };
    const onSystemEvent = ({ systemMsg }: any) => {
      if (!systemMsg) return;
      setMessages(p => {
        if (p.find(x => x.id === systemMsg._id)) return p;
        return [...p, {
          id: systemMsg._id,
          senderId: "other",
          text: systemMsg.text,
          isSystem: true,
          timestamp: new Date(systemMsg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        }];
      });
    };

    socket.on("message recieved", onNewMsg);
    socket.on("message received", onNewMsg); // Catch both spellings
    socket.on("message delivered", onDelivered);
    socket.on("messages delivered", onManyDelivered);
    socket.on("messages read", onRead);
    socket.on("reaction updated", onReaction);
    socket.on("message deleted", onMsgDeleted);
    socket.on("message edited", onMsgEdited);
    socket.on("member-added", onSystemEvent);
    socket.on("member-removed", onSystemEvent);
    socket.on("user-left", onSystemEvent);
    socket.on("theme-updated", onSystemEvent);
    socket.on("settings-updated", onSystemEvent);
    socket.on("typing", (data: any) => {
      const uid = data.userId || data._id;
      if (isGroup) {
        setTypingUsers(prev => {
          if (prev.find(u => (u._id || (u as any).userId) === uid)) return prev;
          return [...prev, { ...data, _id: uid, userId: uid }];
        });
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => (u._id || (u as any).userId) !== uid));
        }, 8000);
      } else {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 8000);
      }
    });

    socket.on("stop typing", (data: any) => {
      const uid = data?.userId || data?._id;
      if (isGroup) {
        setTypingUsers(prev => prev.filter(u => (u._id || (u as any).userId) !== uid));
      } else {
        setIsTyping(false);
      }
    });

    socket.on("stop typing", (data: any) => {
      if (isGroup) {
        setTypingUsers(prev => prev.filter(u => u._id !== data.userId));
      } else {
        setIsTyping(false);
      }
    });
    socket.on("user-online", (uid: string) => { if (uid === chatUserIdRef.current) { setChatUserOnline(true); setMessages(p => p.map(m => m.senderId === "me" && m.status === "sent" ? { ...m, status: "delivered" } : m)); } });
    socket.on("user-offline", (uid: string) => { if (uid === chatUserIdRef.current) setChatUserOnline(false); });
    return () => {
      socket.off("message recieved", onNewMsg); socket.off("message delivered", onDelivered);
      socket.off("messages delivered", onManyDelivered); socket.off("messages read", onRead);
      socket.off("reaction updated", onReaction); socket.off("message deleted", onMsgDeleted);
      socket.off("message edited", onMsgEdited);
      socket.off("member-added", onSystemEvent); socket.off("member-removed", onSystemEvent);
      socket.off("user-left", onSystemEvent); socket.off("theme-updated", onSystemEvent);
      socket.off("settings-updated", onSystemEvent);
      socket.off("typing"); socket.off("stop typing"); socket.off("user-online"); socket.off("user-offline");
    };
  }, [socket, currentChat, user, queryClient]);

  useEffect(() => {
    const isNew = messages.length > prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;
    if (isNew && isAtBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && currentChat) {
      // Just a safety scroll on chat change
      scrollToBottom("instant" as ScrollBehavior);
    }
  }, [currentChat?._id]);


  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (readDebounceRef.current) clearTimeout(readDebounceRef.current);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
  }, []);

  const lastSeenIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--)
      if (messages[i].senderId === "me" && messages[i].status === "seen") return i;
    return -1;
  })();

  const addPending = (items: { url: string; file?: File }[]) => setPendingImages(p => [...p, ...items]);
  const removePending = (i: number) => setPendingImages(p => p.filter((_, idx) => idx !== i));
  const openLightbox = (images: string[], index: number) => setLightbox({ images, index });

  const handleReact = useCallback(async (msgId: string, emoji: string) => {
    try { await api.post(`/messages/${msgId}/react`, { emoji }); }
    catch (err) { console.error("React failed", err); }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socket || !currentChat) return;
    socket.emit("typing", currentChat._id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => socket.emit("stop typing", currentChat._id), 3000);
  }, [socket, currentChat]);

  const uploadFile = async (file: File): Promise<{ url: string; type: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return { url: data.url, type: data.type };
  };

  const sendMessage = async () => {
    if (!input.trim() && pendingImages.length === 0) return;
    if (editingMsg) {
      const msgId = editingMsg.id;
      const newText = input.trim();
      setMessages(p => p.map(m => m.id === msgId ? { ...m, text: newText } : m));
      setEditingMsg(null);
      setInput("");
      try { await api.patch(`/messages/${msgId}`, { text: newText }); }
      catch { toast.error("Edit failed"); }
      return;
    }
    if (!currentChat) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (socket) socket.emit("stop typing", currentChat._id);

    const content = input.trim();
    const replySnap = replyingTo;
    const filesToUpload = pendingImages.filter(p => !!p.file);
    setInput(""); setReplyingTo(null); setPendingImages([]);

    const ts = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const replyObj = replySnap ? { replyTo: { id: replySnap.id, senderId: replySnap.senderId, text: replySnap.text || "Voice message" } } : {};

    if (content) {
      const tempId = `m${Date.now()}`;
      setMessages(p => [...p, { id: tempId, senderId: "me", text: content, timestamp: ts, status: "sent", reactions: [], ...replyObj }]);
      setTimeout(() => scrollToBottom("smooth"), 50);
      try {
        const res = await api.post("/messages", { chatId: currentChat._id, content, ...(replySnap ? { replyTo: replySnap.id } : {}) });
        if (socket) socket.emit("new message", res.data);
        setMessages(p => p.map(m => m.id === tempId ? { ...m, id: res.data._id } : m));
      } catch (err) { console.error("Send text failed", err); }
    }

    if (filesToUpload.length > 0) {
      setUploadStatus("uploading");
      for (const pending of filesToUpload) {
        const tempMediaId = `mm${Date.now()}${Math.random()}`;
        setMessages(p => [...p, { id: tempMediaId, senderId: "me", timestamp: ts, status: "sent", reactions: [], images: [pending.url], isUploading: true, ...replyObj }]);
        setTimeout(() => scrollToBottom("smooth"), 50);
        try {
          const { url, type } = await uploadFile(pending.file!);
          const mediaType = type === "video" ? "video" : "image";
          setMessages(p => p.map(m => m.id === tempMediaId ? { ...m, images: [url], isUploading: false, mediaType } : m));
          const mediaRes = await api.post("/messages", { chatId: currentChat._id, mediaUrl: url, mediaType, ...(replySnap ? { replyTo: replySnap.id } : {}) });
          if (socket) socket.emit("new message", mediaRes.data);
          setMessages(p => p.map(m => m.id === tempMediaId ? { ...m, id: mediaRes.data._id } : m));
        } catch {
          setMessages(p => p.map(m => m.id === tempMediaId ? { ...m, isUploading: false } : m));
        }
      }
      setUploadStatus("done");
      setTimeout(() => setUploadStatus("idle"), 1500);
    }
  };

  const hasContent = input.trim() || pendingImages.length > 0;
  const isOnline = chatUserOnline;
  const statusLabel = isTyping ? "typing…"
    : isOnline ? "Online"
      : chatUser?.lastSeen ? `Last seen ${new Date(chatUser.lastSeen).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Offline";

  const getMsgMenuStyle = () => {
    if (!msgMenu) return {};
    const menuW = 220, menuH = 280;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = msgMenu.x - menuW / 2;
    let top = msgMenu.y + 12;
    if (left + menuW > vw - 12) left = vw - menuW - 12;
    if (left < 12) left = 12;
    if (top + menuH > vh - 12) top = msgMenu.y - menuH - 12;
    return { left, top };
  };

  const isGroupAdmin = isGroup && groupData?.admins?.some((a: any) => (a._id || a) === user?._id);

  const msgMenuActions = msgMenu ? [
    { icon: <Reply size={15} strokeWidth={1.5} />, label: "Reply", fn: () => handleMsgReply(msgMenu.msg) },
    {
      icon: <Pencil size={15} strokeWidth={1.5} />,
      label: "Edit",
      fn: () => handleMsgEdit(msgMenu.msg),
      hide: msgMenu.msg.senderId !== "me" || !!msgMenu.msg.images?.length || (msgMenu.msg.createdAt && new Date(msgMenu.msg.createdAt).getTime() < Date.now() - 3600000)
    },
    { icon: <Copy size={15} strokeWidth={1.5} />, label: "Copy", fn: () => handleMsgCopy(msgMenu.msg), hide: !msgMenu.msg.text },
    { icon: <Forward size={15} strokeWidth={1.5} />, label: "Forward", fn: () => handleMsgForward(msgMenu.msg) },
    { icon: <Info size={15} strokeWidth={1.5} />, label: "Message info", fn: () => handleMsgInfo(msgMenu.msg) },
    { icon: <Trash2 size={15} strokeWidth={1.5} />, label: "Delete for me", fn: () => handleMsgDelete(msgMenu.msg, false), danger: true },
    { icon: <Trash2 size={15} strokeWidth={1.5} />, label: "Delete for everyone", fn: () => handleMsgDelete(msgMenu.msg, true), danger: true, hide: msgMenu.msg.senderId !== "me" && !isGroupAdmin },
  ].filter((a: any) => !a.hide) : [];

  // Compute the chat container background style
  const chatContainerStyle: React.CSSProperties = isDefault
    ? {}
    : { background: themeDef.chatBg };

  // Header bg style for themed mode (Solid for better premium feel)
  const headerBgStyle: React.CSSProperties = isDefault
    ? {}
    : { backgroundColor: `${themeDef.hex}`, borderBottom: "1px solid rgba(255,255,255,0.1)" };

  // Bottom gradient style
  const bottomGradientStyle: React.CSSProperties = isDefault
    ? {}
    : { background: `linear-gradient(to top, ${themeDef.hex} 0%, ${themeDef.hex}F2 70%, transparent 100%)` };

  // Typing indicator bg
  const typingBubbleBg = isDefault
    ? undefined
    : themeDef.otherBubble;

  return (
    <>
      <style>{`
        .msg-highlight { animation: msgFlash 1.5s ease; }
        @keyframes msgFlash  { 0%,100%{background:transparent} 20%,80%{background:rgba(99,102,241,0.18)} }
        @keyframes msgMenuIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
        @keyframes menuIn    { from{opacity:0;transform:scale(0.88) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes apSlide   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes apFade    { from{opacity:0} to{opacity:1} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <input ref={quickCameraRef} type="file" multiple
        accept="image/*,video/*,.heic,.heif,.mov"
        capture="environment" className="hidden" onChange={handleQuickCameraPick} />

      {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}

      <ConfirmModal isOpen={confirmType === "block"} title={`Block ${chatUser?.name}?`}
        message="They won't be able to send you messages." confirmLabel="Block" danger
        onConfirm={doBlock} onCancel={() => setConfirmType(null)} />
      <ConfirmModal isOpen={confirmType === "clear"} title="Clear chat?"
        message="All messages deleted for you. Cannot be undone." confirmLabel="Clear Chat" danger
        onConfirm={doClear} onCancel={() => setConfirmType(null)} />

      {showThemePicker && (
        <ThemePicker
          currentTheme={chatTheme}
          chatUser={{ name: chatUser?.name, avatar: chatUser?.avatar }}
          onSelect={applyTheme}
          onClose={() => setShowThemePicker(false)}
        />
      )}

      {/* Message info sheet */}
      {msgInfoOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
          onClick={() => setMsgInfoOpen(null)}>
          <div className="w-full max-w-[430px] rounded-t-[28px] overflow-hidden pb-8"
            style={sheetBg} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
            <div className="px-6 pt-3 pb-2 flex items-center justify-between border-b border-border/30">
              <h3 className="text-[17px] font-bold text-foreground">Message Info</h3>
              <button onClick={() => setMsgInfoOpen(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X size={15} className="text-muted-foreground" /></button>
            </div>
            <div className="px-6 pt-4 space-y-4">
              {msgInfoOpen.text && <div className="bg-secondary/40 rounded-2xl p-3"><p className="text-[14px] text-foreground leading-relaxed">{msgInfoOpen.text}</p></div>}
              <div className="space-y-3">
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Sent</span><span className="text-foreground font-medium">{msgInfoOpen.timestamp}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${msgInfoOpen.status === "seen" ? "text-blue-500" : "text-foreground"}`}>
                    {msgInfoOpen.status === "seen" ? "✓✓ Seen" : msgInfoOpen.status === "delivered" ? "✓✓ Delivered" : "✓ Sent"}
                  </span>
                </div>
                {msgInfoOpen.reactions?.length > 0 && (
                  <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Reactions</span><span className="text-foreground font-medium">{msgInfoOpen.reactions.map((r: any) => r.emoji).join(" ")}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showLockScreen === "verify" && isLocked && !lockUnlocked && (
        <LockScreen mode="verify" chatUserName={chatUser?.name || "Chat"} chatUserAvatar={chatUser?.avatar}
          onVerified={() => { setShowLockScreen(null); setLockUnlocked(true); }}
          onSubmit={handleVerifyLock} />
      )}

      {/* Message context menu */}
      {msgMenu && (
        <div className="fixed inset-0 z-[60]" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(2px)" }}
          onMouseDown={() => setMsgMenu(null)} onTouchStart={() => setMsgMenu(null)}>
          <div ref={msgMenuRef} className="fixed rounded-2xl overflow-hidden"
            style={{ ...dropdownBg, ...getMsgMenuStyle(), animation: "msgMenuIn 0.18s cubic-bezier(0.34,1.4,0.64,1) both", width: 220 }}
            onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            <div className="flex items-center justify-around px-2 py-2.5 border-b border-border/30">
              {quickReactions.map((e, idx) => (
                <button key={idx}
                  onClick={() => { handleReact(msgMenu.msgId, e); closeMsgMenu(); }}
                  onContextMenu={ev => { ev.preventDefault(); setEmojiPickerMode({ replaceIndex: idx }); }}
                  className="text-[20px] active:scale-90 transition-transform hover:scale-125 relative group">
                  {e}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary text-[7px] text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">✎</span>
                </button>
              ))}
              <button onClick={() => setEmojiPickerMode("react")}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted transition-colors active:scale-90">
                <Plus size={14} className="text-muted-foreground" />
              </button>
            </div>
            {msgMenuActions.map((a: any, i: number) => (
              <button key={i} onClick={a.fn}
                className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium transition-colors text-left
                  ${a.danger ? "text-red-500 hover:bg-red-500/10" : "text-foreground hover:bg-muted/60"}
                  ${i < msgMenuActions.length - 1 ? "border-b border-border/30" : ""}`}>
                <span className={a.danger ? "text-red-500" : "text-muted-foreground"}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {emojiPickerMode !== null && msgMenu && (
        <EmojiPicker
          onSelect={emoji => {
            if (emojiPickerMode === "react") { handleReact(msgMenu.msgId, emoji); closeMsgMenu(); }
            else { replaceReaction((emojiPickerMode as any).replaceIndex, emoji); setEmojiPickerMode(null); }
          }}
          onClose={closeMsgMenu} />
      )}

      {/* ── Main chat layout ── */}
      <div
        className={`${!isDefault ? "dark " : ""}min-h-screen flex flex-col max-w-[430px] mx-auto relative transition-colors duration-300 ${isDefault ? "bg-background" : ""}`}
        style={chatContainerStyle}
      >
        {/* Animated background layer (fixed, behind content) */}
        {!isDefault && <ChatAnimatedBg key={chatTheme} themeId={chatTheme} />}

        {/* Header */}
        <div
          className={`sticky top-0 z-[60] backdrop-blur-md transition-colors duration-300 ${isDefault ? "bg-background/80" : ""}`}
          style={!isDefault ? headerBgStyle : undefined}
        >
          {!searchOpen ? (
            <div className="flex items-center gap-3 px-4 py-3 pb-4">
              <button onClick={() => navigate(-1)} className="text-foreground hover:opacity-80 transition-opacity">
                <ArrowLeft size={22} strokeWidth={1.5} />
              </button>
              <button onClick={() => isGroup ? navigate(`/chat/group/${userId}/profile`) : navigate(`/chat/${userId}/profile`)}
                className="flex-1 min-w-0 flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                <div className="relative shrink-0">
                  <img src={chatUser?.avatar || (isGroup ? 'https://i.pravatar.cc/150?u=group' : 'https://i.pravatar.cc/150')} className="w-10 h-10 rounded-full object-cover shadow-sm border border-white/10" alt="" />
                  {!isGroup && isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
                </div>
                <div className="flex flex-col flex-1 overflow-hidden leading-tight justify-center mt-0.5">
                  <span className="font-semibold text-foreground text-[15px] truncate">{chatUser?.name || "Loading..."}</span>
                  <span className="text-[11px] truncate opacity-80 transition-colors duration-300"
                    style={{ color: (isTyping || typingUsers.length > 0) ? "hsl(var(--primary))" : (!isGroup && isOnline) ? "hsl(142 70% 45%)" : "hsl(var(--muted-foreground))" }}>
                    {isGroup ? (
                      typingUsers.length > 0
                        ? `${typingUsers[0].name} is typing...`
                        : `${groupData?.participants?.length || 0} members`
                    ) : statusLabel}
                  </span>
                </div>
              </button>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button className="hover:text-foreground transition-colors p-1.5"><Video size={22} strokeWidth={1.5} /></button>
                <button className="hover:text-foreground transition-colors p-1.5"><Phone size={20} strokeWidth={1.5} /></button>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => { setShowMenu(p => !p); setShowMoreMenu(false); }}
                    className={`hover:text-foreground transition-colors p-1.5 rounded-full ${showMenu ? "text-foreground bg-muted" : ""}`}>
                    <MoreVertical size={20} strokeWidth={1.5} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-50 overflow-hidden"
                      style={{ ...dropdownBg, animation: "menuIn 0.18s cubic-bezier(0.34,1.2,0.64,1) both", transformOrigin: "top right" }}>
                      {!showMoreMenu ? (
                        <>
                          {[
                            { icon: isMuted ? <Bell size={16} strokeWidth={1.5} /> : <BellOff size={16} strokeWidth={1.5} />, label: isMuted ? "Unmute notifications" : "Mute notifications", fn: handleMuteToggle },
                            { icon: <Search size={16} strokeWidth={1.5} />, label: "Search in chat", fn: openSearch },
                            { icon: <Image size={16} strokeWidth={1.5} />, label: "Media & files", fn: handleMediaFiles },
                            { icon: <Palette size={16} strokeWidth={1.5} />, label: "Chat theme", fn: handleChatTheme },
                            { icon: <Info size={16} strokeWidth={1.5} />, label: isGroup ? "Group info" : "User info", fn: () => isGroup ? navigate(`/chat/group/${userId}/profile`) : navigate(`/chat/${userId}/profile`) },
                          ].map((item, i) => (
                            <button key={i} onClick={item.fn}
                              className="w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left border-b border-border/40">
                              <span className="text-muted-foreground">{item.icon}</span>{item.label}
                            </button>
                          ))}
                          <button onClick={e => { e.stopPropagation(); setShowMoreMenu(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left">
                            <span className="text-muted-foreground"><MoreVertical size={16} strokeWidth={1.5} /></span>
                            More <ChevronRight size={14} className="ml-auto text-muted-foreground" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={e => { e.stopPropagation(); setShowMoreMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted/60 transition-colors border-b border-border/40">
                            <ArrowLeft size={15} strokeWidth={2} /> Back
                          </button>
                          {[
                            { icon: <Ban size={15} strokeWidth={1.5} />, label: "Block user", fn: handleBlockUser, danger: true, hide: isGroup },
                            { icon: <Trash2 size={15} strokeWidth={1.5} />, label: "Clear chat", fn: handleClearChat, danger: true },
                            { icon: <Download size={15} strokeWidth={1.5} />, label: "Export chat", fn: handleExportChat, danger: false },
                            { icon: <Flag size={15} strokeWidth={1.5} />, label: "Report", fn: handleReport, danger: false },
                          ].filter(i => !i.hide).map((item: any, i, arr) => (
                            <button key={i} onClick={item.fn}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium transition-colors text-left
                                ${item.danger ? "text-red-500 hover:bg-red-500/10" : "text-foreground hover:bg-muted/60"}
                                ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
                              <span className={item.danger ? "text-red-500" : "text-muted-foreground"}>{item.icon}</span>{item.label}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 pb-4" style={{ animation: "apFade 0.18s ease both" }}>
              <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2.5 bg-secondary border border-border/40">
                <Search size={15} className="text-muted-foreground shrink-0" />
                <input ref={searchInputRef} value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && goToNextResult()}
                  placeholder="Search messages…"
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none" />
                {searchLoading && <span className="text-[11px] text-muted-foreground">Searching…</span>}
                {!searchLoading && searchQuery && (
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {searchResults.length > 0 ? `${searchIdx + 1}/${searchResults.length}` : "0 results"}
                  </span>
                )}
                {searchResults.length > 0 && (
                  <>
                    <button onClick={goToPrevResult} className="p-1 text-muted-foreground hover:text-foreground"><ChevronUp size={16} /></button>
                    <button onClick={goToNextResult} className="p-1 text-muted-foreground hover:text-foreground"><ChevronDown size={16} /></button>
                  </>
                )}
              </div>
              <button onClick={closeSearch} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {uploadStatus !== "idle" && (
          <div className="relative z-10 text-center text-[12px] font-medium py-1 pointer-events-none">
            <span className={`px-4 py-1 rounded-full mx-auto inline-block
              ${uploadStatus === "uploading" ? "text-primary animate-pulse bg-primary/10"
                : uploadStatus === "done" ? "text-green-500 bg-green-500/10"
                  : "text-red-500 bg-red-500/10"}`}>
              {uploadStatus === "uploading" ? "Sending…" : uploadStatus === "done" ? "Sent ✓" : "Failed to send"}
            </span>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {messages.map((msg, index) => {
            const isMe = msg.senderId === "me";
            const isLastInGroup = !messages[index + 1] || messages[index + 1].senderId !== msg.senderId;
            const isFirstInGroup = !messages[index - 1] || messages[index - 1].senderId !== msg.senderId;
            const isLastMyMsg = index === lastSeenIdx;
            const isCurrentHit = searchResults[searchIdx]?._id === msg.id;

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-6 px-10">
                  <div className="px-4 py-1.5 rounded-full bg-secondary/40 backdrop-blur-sm border border-border/20 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] text-center leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            }

            // Only show participant avatar on the LATEST message they've read
            const effectiveReadBy = isGroup ? (msg.readBy || []).filter(u => {
              const uId = typeof u === 'string' ? u : u._id;
              if (uId === user?._id) return false; // Don't show me in read stack
              // Find if there's any later message seen by this user
              const laterMsgWithUser = messages.slice(index + 1).find(m =>
                m.readBy?.some(ru => (typeof ru === 'string' ? ru : ru._id) === uId)
              );
              return !laterMsgWithUser;
            }) : msg.readBy;

            return (
              <div key={msg.id} id={`msg-${msg.id}`}
                className={`transition-colors rounded-2xl ${isCurrentHit ? "ring-2 ring-primary/50 ring-offset-1" : ""}`}>
                <div className={isLastInGroup ? "mb-4" : "mb-1"}
                  onMouseDown={e => { if (e.button === 0) startLongPress(msg, e); }}
                  onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
                  onMouseMove={e => moveLongPress(e)}
                  onTouchStart={e => startLongPress(msg, e)}
                  onTouchEnd={cancelLongPress} onTouchMove={e => moveLongPress(e)}>
                  <SwipeRow
                    msg={{ ...msg, readBy: effectiveReadBy as any }} isMe={isMe} isLast={isLastInGroup} isFirst={isFirstInGroup} isLastMyMsg={isLastMyMsg}
                    onReply={setReplyingTo} chatUser={chatUser}
                    playingVoice={playingVoice} setPlayingVoice={setPlayingVoice}
                    onImageTap={openLightbox} onReact={handleReact}
                    myUserId={user?._id ?? ""}
                    themeBubbleBg={isDefault ? undefined : themeDef.myBubble}
                    themeBubbleText={isDefault ? undefined : themeDef.myBubbleText}
                    themeOtherBubbleBg={isDefault ? undefined : themeDef.otherBubble}
                    themeOtherBubbleText={isDefault ? undefined : themeDef.otherBubbleText}
                    themeMutedTextColor={isDefault ? undefined : themeDef.mutedText}
                    MediaRenderer={MediaRenderer}
                    isGroup={isGroup}
                    highlightText={searchQuery}
                  />
                </div>
              </div>
            );
          })}

          <div className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: (isTyping || (isGroup && typingUsers.length > 0)) ? 64 : 0, opacity: (isTyping || (isGroup && typingUsers.length > 0)) ? 1 : 0, marginBottom: (isTyping || (isGroup && typingUsers.length > 0)) ? 16 : 0 }}>
            <div className="flex justify-start pt-1">
              <div
                className="rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm border border-black/[0.05] dark:border-white/[0.08]"
                style={{
                  background: typingBubbleBg || "rgba(240,240,240,0.85)",
                  backdropFilter: !isDefault ? "blur(12px)" : "blur(6px)",
                }}
              >
                {isGroup && typingUsers.length > 0 && (
                  <img src={typingUsers[0].avatar || 'https://i.pravatar.cc/150'} className="w-5 h-5 rounded-full object-cover border border-white/20" alt="" />
                )}
                <div className="flex gap-1.5 items-center">
                  {[0, 180, 360].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-typing-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                {isGroup && typingUsers.length > 0 && typingUsers[0].name && (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter ml-0.5">{typingUsers[0].name.split(' ')[0]} is typing</span>
                )}
              </div>
            </div>
          </div>
          <div ref={bottomRef} />
        </div>

        {/* FAB scroll to bottom */}
        <div className="pointer-events-none fixed bottom-[100px] right-0 flex justify-end pr-5 z-40" style={{ maxWidth: 430, width: "100%" }}>
          <div className={`pointer-events-auto transition-all duration-200 ${isAtBottom ? "opacity-0 scale-75 translate-y-2 pointer-events-none" : "opacity-100 scale-100 translate-y-0"}`}>
            <button onClick={() => scrollToBottom("smooth")}
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform relative"
              style={blurStyle} aria-label="Scroll to bottom">
              <ChevronDown size={22} className="text-foreground" strokeWidth={2.5} />
              {unreadWhileAway > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadWhileAway > 99 ? "99+" : unreadWhileAway}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={`relative z-[50] sticky bottom-0 pb-6 pt-4 px-4 flex flex-col justify-end ${isDefault ? "bg-gradient-to-t from-background via-background/90 to-transparent" : ""}`}
          style={!isDefault ? bottomGradientStyle : undefined}
        >
          {/* Pending images strip */}
          {pendingImages.length > 0 && (
            <div className="flex gap-2 pb-3 overflow-x-auto">
              {pendingImages.map((p, i) => (
                <div key={i} className="relative shrink-0">
                  {isVideo(p.url, p.file?.type) ? (
                    <video src={p.url} className="w-16 h-16 object-cover rounded-xl" />
                  ) : (
                    <PendingPreviewImg url={p.url} />
                  )}
                  <button type="button" onClick={() => removePending(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center pointer-events-auto">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showAttachPanel ? (
            <div className="rounded-[32px] pt-5 pb-0" style={{ ...inputPillStyle, animation: "apSlide 0.25s cubic-bezier(0.34,1.2,0.64,1) both" }}>
              <AttachmentPanel onClose={() => setShowAttachPanel(false)} onAddImages={addPending} />
            </div>
          ) : (
            <div className="flex items-end gap-2" style={{ animation: "apFade 0.2s ease both" }}>
              <button onClick={() => setShowAttachPanel(true)}
                className="text-foreground w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                style={inputPillStyle}>
                <FiPlus size={24} />
              </button>
              <div
                className="flex-1 flex flex-col overflow-hidden transition-all duration-300 rounded-[28px]"
                style={inputPillStyle}
              >
                {editingMsg && (
                  <div className="flex relative items-center gap-3 bg-primary/10 dark:bg-primary/5 p-3 pb-2 border-b border-primary/10 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-[3.5px] h-9 bg-primary rounded-full shrink-0" />
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-[11px] font-bold tracking-wide uppercase text-primary mb-0.5">Editing Message</p>
                      <p className="text-[13px] text-foreground/80 truncate font-medium">{editingMsg.text}</p>
                    </div>
                    <button type="button" onClick={() => { setEditingMsg(null); setInput(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center shrink-0 transition-all active:scale-90">
                      <X size={15} className="text-foreground/60" />
                    </button>
                  </div>
                )}
                {replyingTo && (
                  <div className="flex relative items-center gap-3 bg-black/5 dark:bg-white/5 p-3 pb-2 border-b border-black/5 dark:border-white/10 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-[3.5px] h-9 bg-primary rounded-full shrink-0 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-[11px] font-bold tracking-wide uppercase text-primary/80 mb-0.5">
                        Replying to {replyingTo.senderId === "me" ? "yourself" : (chatUser?.name?.split(" ")[0] || "User")}
                      </p>
                      <p className="text-[13px] text-foreground/80 truncate font-medium">{(replyingTo as any).voiceNote ? "🎤 Voice message" : replyingTo.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setReplyingTo(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center shrink-0 transition-all border border-foreground/5 z-[110] active:scale-90">
                      <X size={15} className="text-foreground/60" />
                    </button>
                  </div>
                )}
                <div className={`flex items-center gap-2 px-4 py-2 ${replyingTo ? "pt-1" : "pt-2.5"}`}>
                  <textarea
                    ref={inputRef as any}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      handleInputChange(e as any);
                      e.target.style.height = "inherit";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                        (e.target as HTMLTextAreaElement).style.height = "inherit";
                      }
                    }}
                    placeholder="Type a message"
                    className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none px-1 py-1 resize-none max-h-[120px] transition-all"
                  />
                  {hasContent
                    ? <button onClick={sendMessage} className="text-primary hover:text-primary/80 transition-colors p-2 shrink-0"><FiSend size={20} /></button>
                    : <button onClick={() => quickCameraRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors p-2 shrink-0"><FiCamera size={20} /></button>
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;