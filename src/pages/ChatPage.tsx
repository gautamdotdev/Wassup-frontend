import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Video, MoreVertical, X, BellOff, Bell,
  Search, Pin, Image, Palette, ChevronRight, ChevronDown,
  Ban, Trash2, Download, Flag, ArrowRight, Reply, Copy,
  Forward, Star, Info
} from "lucide-react";
import { FiPlus, FiCamera, FiSend } from "react-icons/fi";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useIsDark } from "@/hooks/useIsDark";
import { Msg } from "@/types/chat";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSocket } from "../lib/socket";

import { Lightbox } from "@/components/chat/Lightbox";
import { SwipeRow } from "@/components/chat/SwipeRow";
import { PendingStrip } from "@/components/chat/PendingStrip";
import { AttachmentPanel } from "@/components/chat/AttachmentPanel";

/* ─── types ─── */
type MsgMenu = { msgId: string; x: number; y: number; msg: Msg } | null;

const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const isDark = useIsDark();

  const pill = isDark
    ? { background: "rgba(20,20,20,0.82)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 32px rgba(0,0,0,0.55),0 1px 0 rgba(255,255,255,0.06) inset" }
    : { background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.12),0 1px 0 rgba(255,255,255,0.9) inset" };
  const blurStyle = { ...pill, backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" };

  /* refs */
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatUserIdRef = useRef<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const msgMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* FIX 3 & 4: Use a ref for isAtBottom so scroll effects always read current value (no stale closure) */
  const isAtBottomRef = useRef(true);
  /* FIX 4: Track message count to distinguish new-message adds from reaction/status updates */
  const prevMsgCountRef = useRef(0);

  /* core state */
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatUser, setChatUser] = useState<any>(null);
  const [chatUserOnline, setChatUserOnline] = useState(false);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  /* menu state */
  const [showMenu, setShowMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  /* scroll state */
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadWhileAway, setUnreadWhileAway] = useState(0);

  /* message context menu */
  const [msgMenu, setMsgMenu] = useState<MsgMenu>(null);

  const quickCameraRef = useRef<HTMLInputElement>(null);

  /* ─── prevent right-click on entire page ─── */
  useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  /* ─── FIX 3: scroll tracking — keep ref in sync with state ─── */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadWhileAway(0);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setUnreadWhileAway(0);
  }, []);

  /* ─── FIX 6: close menus on outside click ─── */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowMoreMenu(false);
      }
      if (msgMenuRef.current && !msgMenuRef.current.contains(e.target as Node)) {
        setMsgMenu(null);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* ─── long press handlers ─── */
  const startLongPress = useCallback((msg: Msg, e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(30);
      setMsgMenu({ msgId: msg.id, x: clientX, y: clientY, msg });
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  /* ─── camera pick ─── */
  const handleQuickCameraPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    Promise.all(files.map(f => new Promise<string>(res => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(f);
    }))).then(urls => addPending(urls));
    e.target.value = "";
  };

  /* ─── options menu handlers ─── */
  const handleMuteToggle = async () => {
    try {
      await api.post(`/chats/${currentChat._id}/mute`, { mute: !isMuted });
      setIsMuted(p => !p);
      toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
    } catch { toast.error("Failed to update notifications"); }
    setShowMenu(false);
  };
  const handleSearchInChat = () => { toast.info("Search coming soon"); setShowMenu(false); };
  const handleUnpinMessage = () => { toast.info("Pinned messages coming soon"); setShowMenu(false); };
  const handleMediaFiles = () => { navigate(`/chat/${userId}/media`); setShowMenu(false); };
  const handleChatTheme = () => { toast.info("Chat theme coming soon"); setShowMenu(false); };

  /* "More" sub-menu */
  const handleBlockUser = async () => {
    setShowMenu(false); setShowMoreMenu(false);
    if (!window.confirm(`Block ${chatUser?.name}?`)) return;
    try {
      await api.post(`/users/${chatUser._id}/block`);
      toast.success(`${chatUser?.name} blocked`);
      navigate(-1);
    } catch { toast.error("Failed to block user"); }
  };
  const handleClearChat = async () => {
    setShowMenu(false); setShowMoreMenu(false);
    if (!window.confirm("Clear all messages? Cannot be undone.")) return;
    try {
      await api.delete(`/chats/${currentChat._id}/messages`);
      setMessages([]);
      toast.success("Chat cleared");
    } catch { toast.error("Failed to clear chat"); }
  };
  const handleExportChat = async () => {
    setShowMenu(false); setShowMoreMenu(false);
    try {
      const text = messages.map(m =>
        `[${m.timestamp}] ${m.senderId === "me" ? "You" : chatUser?.name}: ${m.text || "[media]"}`
      ).join("\n");
      const blob = new Blob([text], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `chat-${chatUser?.name || "export"}.txt`;
      a.click();
      toast.success("Chat exported");
    } catch { toast.error("Export failed"); }
  };
  const handleReport = () => {
    setShowMenu(false); setShowMoreMenu(false);
    toast.info("Report submitted");
  };

  /* ─── message context menu actions ─── */
  const handleMsgReply = (msg: Msg) => { setReplyingTo(msg); setMsgMenu(null); };
  const handleMsgCopy = (msg: Msg) => { navigator.clipboard?.writeText(msg.text || ""); toast.success("Copied"); setMsgMenu(null); };
  const handleMsgForward = (msg: Msg) => { toast.info("Forward coming soon"); setMsgMenu(null); };
  const handleMsgStar = (msg: Msg) => { toast.success("Message starred"); setMsgMenu(null); };
  const handleMsgInfo = (msg: Msg) => { toast.info("Message info coming soon"); setMsgMenu(null); };
  const handleMsgDelete = async (msg: Msg) => {
    setMsgMenu(null);
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.delete(`/messages/${msg.id}`);
      setMessages(p => p.filter(m => m.id !== msg.id));
      toast.success("Message deleted");
    } catch { toast.error("Failed to delete"); }
  };

  /* ─── socket room ─── */
  useEffect(() => {
    if (!socket || !currentChat?._id) return;
    const join = () => socket.emit("join chat", currentChat._id);
    join();
    socket.on("connect", join);
    return () => { socket.off("connect", join); };
  }, [socket, currentChat?._id]);

  /* ─── load chat ─── */
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data: chatData } = await api.post('/chats', { userId });
        if (!active) return;
        setCurrentChat(chatData);
        const other = chatData.participants.find((p: any) => p._id !== user?._id);
        setChatUser(other);
        chatUserIdRef.current = other?._id ?? null;
        setChatUserOnline(!!other?.online);
        setIsMuted(!!chatData.mutedBy?.includes(user?._id));

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
            id: m._id, senderId: isMe ? "me" : "other", text: m.text,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            status: isMe ? (m.tickStatus ?? "sent") : undefined,
            reactions: m.reactions || [],
            ...(replyTo ? { replyTo } : {}),
            ...(m.mediaUrl ? { images: [m.mediaUrl] } : {}),
          };
        });
        prevMsgCountRef.current = mapped.length;
        setMessages(mapped);
        await api.post(`/messages/read/${chatData._id}`).catch(() => { });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      } catch (err: any) {
        if (err.response?.status === 403) { toast.error("Must connect before chatting"); navigate("/search"); }
        else console.error("Failed to load chat", err);
      }
    };
    if (userId) load();
    return () => { active = false; };
  }, [userId, user]);

  /* ─── socket events ─── */
  useEffect(() => {
    if (!socket) return;

    const onNewMsg = (m: any) => {
      const cid = m.chatId?._id || m.chatId;
      if (!currentChat || cid !== currentChat._id) return;
      setMessages(prev => {
        if (prev.find(x => x.id === m._id)) return prev;
        const isMe = (m.senderId?._id || m.senderId) === user?._id;
        let replyTo: Msg["replyTo"] | undefined;
        if (m.replyTo) {
          const rtId = m.replyTo.senderId?._id || m.replyTo.senderId;
          replyTo = { id: m.replyTo._id || m.replyTo, senderId: rtId === user?._id ? "me" : "other", text: m.replyTo.text || "Voice message" };
        }
        const msg: Msg = {
          id: m._id, senderId: isMe ? "me" : "other", text: m.text,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          status: isMe ? "sent" : undefined, reactions: m.reactions || [],
          ...(replyTo ? { replyTo } : {}), ...(m.mediaUrl ? { images: [m.mediaUrl] } : {}),
        };
        return [...prev, msg];
      });
      if ((m.senderId?._id || m.senderId) !== user?._id) {
        /* FIX 5: Only mark unread counter if NOT at bottom — don't auto-scroll for incoming messages when user scrolled up */
        if (!isAtBottomRef.current) {
          setUnreadWhileAway(c => c + 1);
        }
        if (readDebounceRef.current) clearTimeout(readDebounceRef.current);
        readDebounceRef.current = setTimeout(() => {
          api.post(`/messages/read/${cid}`).catch(() => { });
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }, 1500);
      }
    };

    const onDelivered = ({ messageId, chatId }: any) => {
      if (currentChat?.chatId === chatId)
        setMessages(p => p.map(m => m.id === messageId && m.senderId === "me" && m.status === "sent" ? { ...m, status: "delivered" } : m));
    };
    const onManyDelivered = ({ chatId, messageIds }: any) => {
      if (currentChat && chatId === currentChat._id) {
        const s = new Set(messageIds);
        setMessages(p => p.map(m => m.senderId === "me" && m.status === "sent" && s.has(m.id) ? { ...m, status: "delivered" } : m));
      }
    };
    const onRead = ({ chatId }: any) => {
      if (currentChat && chatId === currentChat._id) {
        setMessages(p => p.map(m => m.senderId === "me" && m.status !== "seen" ? { ...m, status: "seen" } : m));
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      }
    };
    const onReaction = ({ messageId, reactions }: any) =>
      setMessages(p => p.map(m => m.id === messageId ? { ...m, reactions } : m));

    socket.on("message recieved", onNewMsg);
    socket.on("message delivered", onDelivered);
    socket.on("messages delivered", onManyDelivered);
    socket.on("messages read", onRead);
    socket.on("reaction updated", onReaction);
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    socket.on("user-online", (uid: string) => { if (uid === chatUserIdRef.current) setChatUserOnline(true); });
    socket.on("user-offline", (uid: string) => { if (uid === chatUserIdRef.current) setChatUserOnline(false); });

    return () => {
      socket.off("message recieved", onNewMsg);
      socket.off("message delivered", onDelivered);
      socket.off("messages delivered", onManyDelivered);
      socket.off("messages read", onRead);
      socket.off("reaction updated", onReaction);
      socket.off("typing"); socket.off("stop typing");
      socket.off("user-online"); socket.off("user-offline");
    };
  }, [socket, currentChat, user, queryClient]);

  /* ─── FIX 3 & 4: auto-scroll ONLY when a genuine new message is added AND user is at bottom ─── */
  useEffect(() => {
    const isNewMessage = messages.length > prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;

    // Only scroll for actual new messages (not reaction/status updates)
    // and only if user is already at the bottom
    if (isNewMessage && isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ─── initial scroll on chat open ─── */
  useEffect(() => {
    if (messages.length > 0) scrollToBottom("instant" as ScrollBehavior);
  }, [currentChat?._id]);

  /* ─── cleanup timers ─── */
  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (readDebounceRef.current) clearTimeout(readDebounceRef.current);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const lastSeenIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--)
      if (messages[i].senderId === "me" && messages[i].status === "seen") return i;
    return -1;
  })();

  const addPending = (urls: string[]) => setPendingImages(p => [...p, ...urls]);
  const removePending = (i: number) => setPendingImages(p => p.filter((_, idx) => idx !== i));
  const openLightbox = (images: string[], index: number) => setLightbox({ images, index });

  /* FIX 3: React does NOT trigger scroll since it's not a new message (count doesn't change) */
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

  const sendMessage = async () => {
    if (!input.trim() && pendingImages.length === 0) return;
    if (!currentChat) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (socket) socket.emit("stop typing", currentChat._id);

    const content = input.trim();
    setInput("");
    const tempId = `m${Date.now()}`;
    const ts = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const newMsg: Msg = {
      id: tempId, senderId: "me", text: content || undefined, timestamp: ts, status: "sent",
      ...(pendingImages.length > 0 ? { images: [...pendingImages] } : {}),
      ...(replyingTo ? { replyTo: { id: replyingTo.id, senderId: replyingTo.senderId, text: replyingTo.text || "Voice message" } } : {}),
    };
    setMessages(p => [...p, newMsg]);
    setPendingImages([]); setReplyingTo(null);
    // Always scroll to bottom when I send a message
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const res = await api.post("/messages", {
        chatId: currentChat._id, content,
        ...(replyingTo ? { replyTo: replyingTo.id } : {}),
      });
      if (socket) socket.emit("new message", res.data);
      setMessages(p => p.map(m => m.id === tempId ? { ...m, id: res.data._id, status: "sent" } : m));
    } catch (err) { console.error("Send failed", err); }
  };

  const hasContent = input.trim() || pendingImages.length > 0;
  const isOnline = chatUserOnline;
  const statusLabel = isTyping ? "typing…"
    : isOnline ? "Online"
      : chatUser?.lastSeen
        ? `Last seen ${new Date(chatUser.lastSeen).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
        : "Offline";

  /* ─── compute smart message-menu position ─── */
  const getMsgMenuStyle = () => {
    if (!msgMenu) return {};
    const menuW = 200, menuH = 320;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = msgMenu.x - menuW / 2;
    let top = msgMenu.y + 12;
    if (left + menuW > vw - 12) left = vw - menuW - 12;
    if (left < 12) left = 12;
    if (top + menuH > vh - 12) top = msgMenu.y - menuH - 12;
    return { left, top };
  };

  const msgMenuActions = msgMenu ? [
    { icon: <Reply size={15} strokeWidth={1.5} />, label: "Reply", fn: () => handleMsgReply(msgMenu.msg) },
    { icon: <Copy size={15} strokeWidth={1.5} />, label: "Copy", fn: () => handleMsgCopy(msgMenu.msg), hide: !msgMenu.msg.text },
    { icon: <Forward size={15} strokeWidth={1.5} />, label: "Forward", fn: () => handleMsgForward(msgMenu.msg) },
    { icon: <Star size={15} strokeWidth={1.5} />, label: "Star message", fn: () => handleMsgStar(msgMenu.msg) },
    { icon: <Info size={15} strokeWidth={1.5} />, label: "Message info", fn: () => handleMsgInfo(msgMenu.msg) },
    { icon: <Trash2 size={15} strokeWidth={1.5} />, label: "Delete", fn: () => handleMsgDelete(msgMenu.msg), danger: true },
  ].filter(a => !a.hide) : [];

  return (
    <>
      <input ref={quickCameraRef} type="file" multiple accept="image/*,video/*" capture="environment" className="hidden" onChange={handleQuickCameraPick} />
      {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}

      {/* ── FIX 1: Message context menu — single unified panel: emoji row + actions (Image 1 style) ── */}
      {msgMenu && (
        <div className="fixed inset-0 z-[60]" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(2px)" }}>
          <div
            ref={msgMenuRef}
            className="fixed w-[200px] rounded-2xl"
            style={{ ...blurStyle, ...getMsgMenuStyle(), animation: "msgMenuIn 0.18s cubic-bezier(0.34,1.4,0.64,1) both", overflow: "hidden" }}
          >
            <style>{`@keyframes msgMenuIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
            {/* Quick emoji row — top of the menu, same panel as actions */}
            <div className="flex items-center justify-around px-3 py-2.5 border-b border-border/30">
              {["❤️", "👍", "😂", "😮", "😢", "🔥"].map(e => (
                <button key={e} onClick={() => { handleReact(msgMenu.msgId, e); setMsgMenu(null); }}
                  className="text-[20px] active:scale-90 transition-transform hover:scale-125">
                  {e}
                </button>
              ))}
            </div>
            {/* Action items */}
            {msgMenuActions.map((a, i) => (
              <button key={i} onClick={a.fn}
                className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium transition-colors text-left
                  ${a.danger ? "text-red-500 hover:bg-red-500/10" : "text-foreground hover:bg-muted/60"}
                  ${i < msgMenuActions.length - 1 ? "border-b border-border/30" : ""}
                `}
              >
                <span className={a.danger ? "text-red-500" : "text-muted-foreground"}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background flex flex-col max-w-[430px] mx-auto relative">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 backdrop-blur-md bg-background/50 sticky top-0 z-10 pb-4">
          <button onClick={() => navigate(-1)} className="text-foreground hover:opacity-80 transition-opacity">
            <ArrowLeft size={22} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => chatUser?._id && navigate(`/chat/${chatUser._id}/profile`)}
            className="flex-1 min-w-0 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <div className="relative shrink-0">
              <img src={chatUser?.avatar || "https://i.pravatar.cc/150"} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="" />
              {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden leading-tight justify-center mt-0.5">
              <span className="font-semibold text-foreground text-[15px] truncate">{chatUser?.name || "Loading..."}</span>
              <span className="text-[11px] truncate opacity-80 transition-colors duration-300"
                style={{ color: isTyping ? "hsl(var(--primary))" : isOnline ? "hsl(142 70% 45%)" : "hsl(var(--muted-foreground))" }}>
                {statusLabel}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1 text-muted-foreground">
            <button className="hover:text-foreground transition-colors p-1.5"><Video size={22} strokeWidth={1.5} /></button>
            <button className="hover:text-foreground transition-colors p-1.5"><Phone size={20} strokeWidth={1.5} /></button>

            {/* FIX 6: 3-dot menu — removed overflow-hidden from dropdown container so "More" submenu renders outside bounds */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => { setShowMenu(p => !p); setShowMoreMenu(false); }}
                className={`hover:text-foreground transition-colors p-1.5 rounded-full ${showMenu ? "text-foreground bg-muted" : ""}`}
              >
                <MoreVertical size={20} strokeWidth={1.5} />
              </button>

              {showMenu && (
                /* FIX 6: No overflow-hidden here — the submenu extends to the left and was being clipped */
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-50"
                  style={{ ...blurStyle, animation: "menuIn 0.18s cubic-bezier(0.34,1.2,0.64,1) both", transformOrigin: "top right" }}>
                  <style>{`@keyframes menuIn{from{opacity:0;transform:scale(0.88) translateY(-6px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

                  {/* Clip only the rounded corners visually using a wrapper per item */}
                  <div className="rounded-2xl overflow-hidden">
                    {[
                      { icon: isMuted ? <Bell size={16} strokeWidth={1.5} /> : <BellOff size={16} strokeWidth={1.5} />, label: isMuted ? "Unmute notifications" : "Mute notifications", fn: handleMuteToggle },
                      { icon: <Search size={16} strokeWidth={1.5} />, label: "Search in chat", fn: handleSearchInChat },
                      { icon: <Pin size={16} strokeWidth={1.5} />, label: "Remove pin", fn: handleUnpinMessage },
                      { icon: <Image size={16} strokeWidth={1.5} />, label: "Media & files", fn: handleMediaFiles },
                      { icon: <Palette size={16} strokeWidth={1.5} />, label: "Chat theme", fn: handleChatTheme },
                    ].map((item, i, arr) => (
                      <button key={i} onClick={item.fn}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left
                          ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}
                      >
                        <span className="text-muted-foreground">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}

                    {/* FIX 6: More sub-menu — stopPropagation prevents outer mousedown handler firing */}
                    <div className="relative border-t border-border/40">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowMoreMenu(p => !p); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left"
                      >
                        <span className="text-muted-foreground"><MoreVertical size={16} strokeWidth={1.5} /></span>
                        More
                        <ChevronRight size={14} className={`ml-auto text-muted-foreground transition-transform duration-200 ${showMoreMenu ? "rotate-90" : ""}`} />
                      </button>

                      {showMoreMenu && (
                        /* FIX 6: Render to LEFT of the main menu; positioned relative to the More row */
                        <div
                          className="absolute right-full top-0 mr-2 w-52 rounded-2xl overflow-hidden z-50"
                          style={{ ...blurStyle, animation: "menuIn 0.15s cubic-bezier(0.34,1.2,0.64,1) both", transformOrigin: "top right" }}
                          onMouseDown={e => e.stopPropagation()} // prevent closing when clicking inside sub-menu
                        >
                          {[
                            { icon: <Ban size={15} strokeWidth={1.5} />, label: "Block user", fn: handleBlockUser, danger: true },
                            { icon: <Trash2 size={15} strokeWidth={1.5} />, label: "Clear chat", fn: handleClearChat, danger: true },
                            { icon: <Download size={15} strokeWidth={1.5} />, label: "Export chat", fn: handleExportChat, danger: false },
                            { icon: <Flag size={15} strokeWidth={1.5} />, label: "Report", fn: handleReport, danger: false },
                          ].map((item, i, arr) => (
                            <button key={i} onClick={item.fn}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium transition-colors text-left
                                ${item.danger ? "text-red-500 hover:bg-red-500/10" : "text-foreground hover:bg-muted/60"}
                                ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}
                            >
                              <span className={item.danger ? "text-red-500" : "text-muted-foreground"}>{item.icon}</span>
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
          {messages.map((msg, index) => {
            const isMe = msg.senderId === "me";
            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];
            const showName = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
            const isLastMyMsg = index === lastSeenIdx;

            return (
              <div key={msg.id} id={`msg-${msg.id}`}>
                {showName && (
                  <p className="text-[13px] font-bold text-foreground mb-1.5 mt-2">
                    {chatUser?.name?.split(" ")[0]}
                  </p>
                )}
                <div className={isLastInGroup ? "mb-4" : "mb-1"}
                  onMouseDown={e => { if (e.button === 0) startLongPress(msg, e); }}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onTouchStart={e => startLongPress(msg, e)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                >
                  <SwipeRow
                    msg={msg} isMe={isMe} isLast={isLastInGroup} isLastMyMsg={isLastMyMsg}
                    onReply={setReplyingTo} chatUser={chatUser}
                    playingVoice={playingVoice} setPlayingVoice={setPlayingVoice}
                    onImageTap={openLightbox} onReact={handleReact}
                    myUserId={user?._id ?? ""}
                  />
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          <div className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: isTyping ? 56 : 0, opacity: isTyping ? 1 : 0 }}>
            <div className="flex justify-start mb-4 pt-1">
              <div className="bg-[#f0f0f0] dark:bg-[#2a2a2a] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-1.5">
                {[0, 180, 360].map(d => (
                  <div key={d} className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
          <div ref={bottomRef} />
        </div>

        {/* ── FIX 2: Scroll-to-bottom FAB — fixed positioning so it always renders above the bottom bar ── */}
        <div
          className="pointer-events-none fixed bottom-[100px] right-0 flex justify-end pr-5"
          style={{ zIndex: 40, maxWidth: 430, width: "100%" }}
        >
          <div
            className={`pointer-events-auto transition-all duration-200 ${isAtBottom ? "opacity-0 scale-75 translate-y-2 pointer-events-none" : "opacity-100 scale-100 translate-y-0"}`}
          >
            <button
              onClick={() => scrollToBottom("smooth")}
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform relative"
              style={blurStyle}
              aria-label="Scroll to bottom"
            >
              <ChevronDown size={22} className="text-foreground" strokeWidth={2.5} />
              {unreadWhileAway > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadWhileAway > 99 ? "99+" : unreadWhileAway}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Sticky bottom bar ── */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent pb-6 pt-4 px-4">

          {replyingTo && (
            <div className="pb-3">
              <div className="flex items-center gap-2 bg-[#f0f0f0]/95 dark:bg-[#2a2a2a]/95 backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] shadow-sm rounded-2xl px-3 py-2.5">
                <div className="w-[3px] h-9 bg-foreground/30 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground/60 mb-0.5">
                    Replying to {replyingTo.senderId === "me" ? "yourself" : (chatUser?.name?.split(" ")[0] || "User")}
                  </p>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {replyingTo.voiceNote ? "🎤 Voice message" : replyingTo.text}
                  </p>
                </div>
                <button onClick={() => setReplyingTo(null)}
                  className="w-7 h-7 rounded-full bg-secondary hover:opacity-80 flex items-center justify-center shrink-0 transition-opacity">
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {pendingImages.length > 0 && <PendingStrip images={pendingImages} onRemove={removePending} />}

          {showAttachPanel ? (
            <div className="rounded-[32px] pt-5 pb-0" style={{ ...blurStyle, animation: "apSlide 0.25s cubic-bezier(0.34,1.2,0.64,1) both" }}>
              <style>{`@keyframes apSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <AttachmentPanel onClose={() => setShowAttachPanel(false)} onAddImages={addPending} />
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ animation: "apFade 0.2s ease both" }}>
              <style>{`@keyframes apFade{from{opacity:0}to{opacity:1}}`}</style>
              <button onClick={() => setShowAttachPanel(true)}
                className="text-foreground w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                style={blurStyle}>
                <FiPlus size={24} />
              </button>
              <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5" style={blurStyle}>
                <input
                  value={input} onChange={handleInputChange}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Type here"
                  className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none px-1"
                />
                {hasContent
                  ? <button onClick={sendMessage} className="text-primary hover:text-primary/80 transition-colors"><FiSend size={20} /></button>
                  : <button onClick={() => quickCameraRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors -mr-1"><FiCamera size={20} /></button>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;