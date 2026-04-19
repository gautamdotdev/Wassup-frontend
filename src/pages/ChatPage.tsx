import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Video, MoreVertical, X, BellOff, Bell,
  Search, Image, Palette, ChevronRight, ChevronDown,
  Ban, Trash2, Download, Flag, Reply, Copy,
  Forward, Info, Plus, ChevronUp,
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
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { useQuickReactions } from "@/hooks/useQuickReactions";
import { ConfirmModal } from "@/components/chat/ConfirmModal";
import { ThemePicker, ChatTheme } from "@/components/chat/ThemePicker";
import { LockScreen } from "@/components/chat/LockScreen";

/* ─── types ─── */
type MsgMenu = { msgId: string; x: number; y: number; msg: Msg } | null;
type ConfirmType = "block" | "clear" | null;
type UploadStatus = "idle" | "uploading" | "done" | "error";
interface SearchHit { _id: string; text: string; createdAt: string }

/* Theme bubble config */
const THEME_BUBBLES: Record<ChatTheme, { mine: string; mineText: string; chatBg?: string }> = {
  default:  { mine: "bg-[#f0f0f0] dark:bg-[#2a2a2a]", mineText: "text-foreground", chatBg: "" },
  ocean:    { mine: "bg-[#0066cc]", mineText: "text-white", chatBg: "bg-[#0a1628]" },
  forest:   { mine: "bg-[#2d7a2d]", mineText: "text-white", chatBg: "bg-[#0d1f0d]" },
  sunset:   { mine: "bg-[#e85d04]", mineText: "text-white", chatBg: "bg-[#1a0a00]" },
  lavender: { mine: "bg-[#8b5cf6]", mineText: "text-white", chatBg: "bg-[#13001f]" },
  midnight: { mine: "bg-[#1d4ed8]", mineText: "text-white", chatBg: "bg-[#020c1b]" },
  rose:     { mine: "bg-[#e11d48]", mineText: "text-white", chatBg: "bg-[#1f0010]" },
};

const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();
  const isDark     = useIsDark();

  const pill = isDark
    ? { background: "rgba(20,20,20,0.82)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 32px rgba(0,0,0,0.55),0 1px 0 rgba(255,255,255,0.06) inset" }
    : { background: "rgba(255,255,255,0.90)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.12),0 1px 0 rgba(255,255,255,0.9) inset" };
  const blurStyle = { ...pill, backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" };

  /* refs */
  const bottomRef       = useRef<HTMLDivElement>(null);
  const scrollRef       = useRef<HTMLDivElement>(null);
  const typingTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatUserIdRef   = useRef<string | null>(null);
  const menuRef         = useRef<HTMLDivElement>(null);
  const msgMenuRef      = useRef<HTMLDivElement>(null);
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef  = useRef<HTMLInputElement>(null);
  const searchDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef   = useRef(true);
  const prevMsgCountRef = useRef(0);

  /* core state */
  const { user }        = useAuth();
  const { socket }      = useSocket();
  const queryClient     = useQueryClient();
  const [input, setInput]                   = useState("");
  const [messages, setMessages]             = useState<Msg[]>([]);
  const [chatUser, setChatUser]             = useState<any>(null);
  const [chatUserOnline, setChatUserOnline] = useState(false);
  const [currentChat, setCurrentChat]       = useState<any>(null);
  const [playingVoice, setPlayingVoice]     = useState<string | null>(null);
  const [isTyping, setIsTyping]             = useState(false);
  const [replyingTo, setReplyingTo]         = useState<Msg | null>(null);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [pendingImages, setPendingImages]   = useState<{ url: string; file?: File }[]>([]);
  const [lightbox, setLightbox]             = useState<{ images: string[]; index: number } | null>(null);
  const [uploadStatus, setUploadStatus]     = useState<UploadStatus>("idle");

  /* menu */
  const [showMenu, setShowMenu]         = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isMuted, setIsMuted]           = useState(false);

  /* search — replaces header when open */
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState<SearchHit[]>([]);
  const [searchIdx, setSearchIdx]           = useState(-1);
  const [searchLoading, setSearchLoading]   = useState(false);

  /* confirm modals */
  const [confirmType, setConfirmType] = useState<ConfirmType>(null);

  /* theme */
  const [chatTheme, setChatTheme]               = useState<ChatTheme>("default");
  const [showThemePicker, setShowThemePicker]   = useState(false);

  /* lock */
  const [isLocked, setIsLocked]         = useState(false);
  const [lockUnlocked, setLockUnlocked] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState<"verify" | "set" | null>(null);

  /* msg info */
  const [msgInfoOpen, setMsgInfoOpen] = useState<Msg | null>(null);

  /* quick reactions */
  const { quickReactions, replaceReaction } = useQuickReactions();
  const [emojiPickerMode, setEmojiPickerMode] = useState<"react" | { replaceIndex: number } | null>(null);

  const closeMsgMenu = useCallback(() => { setMsgMenu(null); setEmojiPickerMode(null); }, []);

  /* scroll */
  const [isAtBottom, setIsAtBottom]     = useState(true);
  const [unreadWhileAway, setUnreadWhileAway] = useState(0);
  const [msgMenu, setMsgMenu]           = useState<MsgMenu>(null);

  const quickCameraRef = useRef<HTMLInputElement>(null);

  /* ─── prevent context menu ─── */
  useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  /* ─── scroll tracking ─── */
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

  const scrollToMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("msg-highlight");
    setTimeout(() => el.classList.remove("msg-highlight"), 1500);
  }, []);

  /* ─── close menus on outside click ─── */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false); setShowMoreMenu(false);
      }
      if (emojiPickerMode !== null) return;
      if (msgMenuRef.current && !msgMenuRef.current.contains(e.target as Node)) closeMsgMenu();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [emojiPickerMode, closeMsgMenu]);

  /* ─── long press ─── */
  const lpStartX = useRef(0);
  const lpStartY = useRef(0);

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

  /* ─── camera pick ─── */
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

  /* ─── Search (replaces header) ─── */
  const openSearch = () => {
    setSearchOpen(true);
    setShowMenu(false);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchIdx(-1);
  };

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !currentChat) { setSearchResults([]); setSearchIdx(-1); return; }
    setSearchLoading(true);
    try {
      const { data } = await api.get(`/messages/${currentChat._id}/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data);
      const idx = data.length - 1;
      setSearchIdx(idx);
      if (idx >= 0) scrollToMessage(data[idx]._id);
    } catch { /* ignore */ } finally { setSearchLoading(false); }
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

  /* ─── Menu handlers ─── */
  const handleMuteToggle = async () => {
    try {
      await api.post(`/chats/${currentChat._id}/mute`, { mute: !isMuted });
      setIsMuted(p => !p);
      toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
    } catch { toast.error("Failed to update notifications"); }
    setShowMenu(false);
  };

  const handleMediaFiles = () => {
    navigate(`/chat/${userId}/media`);
    setShowMenu(false);
  };

  const handleChatTheme = () => { setShowThemePicker(true); setShowMenu(false); };

  const applyTheme = async (theme: ChatTheme) => {
    setShowThemePicker(false);
    setChatTheme(theme);
    try { await api.post(`/chats/${currentChat._id}/theme`, { theme }); }
    catch { toast.error("Failed to save theme"); }
  };

  const handleBlockUser  = () => { setShowMenu(false); setShowMoreMenu(false); setConfirmType("block"); };
  const handleClearChat  = () => { setShowMenu(false); setShowMoreMenu(false); setConfirmType("clear"); };
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
  const handleReport = () => { setShowMenu(false); setShowMoreMenu(false); toast.info("Report submitted"); };

  const doBlock = async () => {
    setConfirmType(null);
    try { await api.post(`/chats/${currentChat._id}/block`); toast.success(`${chatUser?.name} blocked`); navigate(-1); }
    catch { toast.error("Failed to block user"); }
  };
  const doClear = async () => {
    setConfirmType(null);
    try { await api.delete(`/chats/${currentChat._id}/messages`); setMessages([]); toast.success("Chat cleared"); }
    catch { toast.error("Failed to clear chat"); }
  };

  /* lock — only from profile; verify here on load */
  const handleVerifyLock = async (password: string): Promise<boolean> => {
    try {
      const { data } = await api.post(`/chats/${currentChat._id}/verify-lock`, { password });
      if (data.verified) { setLockUnlocked(true); return true; }
      return false;
    } catch { return false; }
  };

  /* ─── message context menu actions ─── */
  const handleMsgReply  = (msg: Msg) => { setReplyingTo(msg); closeMsgMenu(); };
  const handleMsgCopy   = (msg: Msg) => { navigator.clipboard?.writeText(msg.text || ""); toast.success("Copied"); closeMsgMenu(); };
  const handleMsgForward = (msg: Msg) => { toast.info("Forward coming soon"); closeMsgMenu(); };
  const handleMsgInfo   = (msg: Msg) => { setMsgInfoOpen(msg); closeMsgMenu(); };
  const handleMsgDelete = async (msg: Msg) => {
    closeMsgMenu();
    try { await api.delete(`/messages/${msg.id}`); setMessages(p => p.filter(m => m.id !== msg.id)); toast.success("Message deleted"); }
    catch { toast.error("Failed to delete"); }
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
        setIsMuted(!!chatData.mutedBy?.some((m: any) => (m._id || m) === user?._id));
        setChatTheme((chatData.theme || "default") as ChatTheme);

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
            id: m._id, senderId: isMe ? "me" : "other", text: m.text,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            status: isMe ? (m.tickStatus ?? "sent") : undefined,
            reactions: m.reactions || [],
            ...(replyTo ? { replyTo } : {}),
            ...(m.mediaUrl ? { images: [m.mediaUrl], mediaType: m.mediaType } : {}),
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
          ...(replyTo ? { replyTo } : {}),
          ...(m.mediaUrl ? { images: [m.mediaUrl], mediaType: m.mediaType } : {}),
        };
        return [...prev, msg];
      });
      if ((m.senderId?._id || m.senderId) !== user?._id) {
        if (!isAtBottomRef.current) setUnreadWhileAway(c => c + 1);
        if (readDebounceRef.current) clearTimeout(readDebounceRef.current);
        readDebounceRef.current = setTimeout(() => {
          api.post(`/messages/read/${cid}`).catch(() => { });
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }, 1500);
      }
    };

    const onDelivered = ({ messageId, chatId }: any) => {
      // Fix: compare using currentChat._id not currentChat.chatId
      if (currentChat && chatId === currentChat._id)
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
    socket.on("user-online",  (uid: string) => { if (uid === chatUserIdRef.current) setChatUserOnline(true);  });
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

  /* ─── auto-scroll on new msg ─── */
  useEffect(() => {
    const isNewMessage = messages.length > prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;
    if (isNewMessage && isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom("instant" as ScrollBehavior);
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
  const openLightbox  = (images: string[], index: number) => setLightbox({ images, index });

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

  /* ─── upload ─── */
  const uploadFile = async (file: File): Promise<{ url: string; type: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return { url: data.url, type: data.type };
  };

  /* ─── sendMessage — fixed blank-message bug ─── */
  const sendMessage = async () => {
    if (!input.trim() && pendingImages.length === 0) return;
    if (!currentChat) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (socket) socket.emit("stop typing", currentChat._id);

    const content      = input.trim();
    const replySnap    = replyingTo;
    const filesToUpload = pendingImages.filter(p => !!p.file);
    const existingUrls  = pendingImages.filter(p => !p.file).map(p => p.url);

    setInput(""); setReplyingTo(null); setPendingImages([]);

    const ts       = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const replyObj = replySnap
      ? { replyTo: { id: replySnap.id, senderId: replySnap.senderId, text: replySnap.text || "Voice message" } }
      : {};

    // 1️⃣ Only add optimistic text message if there is actual text content
    if (content) {
      const tempId = `m${Date.now()}`;
      setMessages(p => [...p, { id: tempId, senderId: "me", text: content, timestamp: ts, status: "sent", reactions: [], ...replyObj }]);
      setTimeout(() => scrollToBottom("smooth"), 50);
      try {
        const res = await api.post("/messages", {
          chatId: currentChat._id, content,
          ...(replySnap ? { replyTo: replySnap.id } : {}),
        });
        if (socket) socket.emit("new message", res.data);
        setMessages(p => p.map(m => m.id === tempId ? { ...m, id: res.data._id } : m));
      } catch (err) { console.error("Send text failed", err); }
    }

    // 2️⃣ Upload & send media files (each as its own message)
    if (filesToUpload.length > 0) {
      setUploadStatus("uploading");
      for (const pending of filesToUpload) {
        const tempMediaId = `m${Date.now()}${Math.random()}`;
        // Optimistic media bubble (preview url, no text)
        setMessages(p => [...p, {
          id: tempMediaId, senderId: "me",
          timestamp: ts, status: "sent", reactions: [],
          images: [pending.url],  // show local preview immediately
          ...replyObj,
        }]);
        setTimeout(() => scrollToBottom("smooth"), 50);
        try {
          const { url, type } = await uploadFile(pending.file!);
          const mediaType = type === "video" ? "video" : "image";
          // Replace with real cloudinary url
          setMessages(p => p.map(m => m.id === tempMediaId ? { ...m, images: [url] } : m));
          const mediaRes = await api.post("/messages", {
            chatId: currentChat._id, mediaUrl: url, mediaType,
            ...(replySnap ? { replyTo: replySnap.id } : {}),
          });
          if (socket) socket.emit("new message", mediaRes.data);
          setMessages(p => p.map(m => m.id === tempMediaId ? { ...m, id: mediaRes.data._id } : m));
        } catch { /* skip failed file */ }
      }
      setUploadStatus("done");
      setTimeout(() => setUploadStatus("idle"), 2000);
    }

    // 3️⃣ If only existing (non-file) URLs with no text — treat as media message too
    if (existingUrls.length > 0 && !content) {
      // already handled inline — this case shouldn't normally occur but guard it
    }
  };

  const hasContent  = input.trim() || pendingImages.length > 0;
  const isOnline    = chatUserOnline;
  const statusLabel = isTyping ? "typing…"
    : isOnline ? "Online"
      : chatUser?.lastSeen
        ? `Last seen ${new Date(chatUser.lastSeen).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
        : "Offline";

  const getMsgMenuStyle = () => {
    if (!msgMenu) return {};
    const menuW = 220, menuH = 320;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = msgMenu.x - menuW / 2;
    let top  = msgMenu.y + 12;
    if (left + menuW > vw - 12) left = vw - menuW - 12;
    if (left < 12) left = 12;
    if (top + menuH > vh - 12) top = msgMenu.y - menuH - 12;
    return { left, top };
  };

  const msgMenuActions = msgMenu ? [
    { icon: <Reply   size={15} strokeWidth={1.5} />, label: "Reply",        fn: () => handleMsgReply(msgMenu.msg) },
    { icon: <Copy    size={15} strokeWidth={1.5} />, label: "Copy",         fn: () => handleMsgCopy(msgMenu.msg),   hide: !msgMenu.msg.text },
    { icon: <Forward size={15} strokeWidth={1.5} />, label: "Forward",      fn: () => handleMsgForward(msgMenu.msg) },
    { icon: <Info    size={15} strokeWidth={1.5} />, label: "Message info", fn: () => handleMsgInfo(msgMenu.msg) },
    { icon: <Trash2  size={15} strokeWidth={1.5} />, label: "Delete",       fn: () => handleMsgDelete(msgMenu.msg), danger: true },
  ].filter(a => !a.hide) : [];

  const themeColors = THEME_BUBBLES[chatTheme];

  /* ─── RENDER ─── */
  return (
    <>
      <style>{`
        .msg-highlight { animation: msgFlash 1.5s ease; }
        @keyframes msgFlash { 0%,100%{background:transparent} 20%,80%{background:rgba(99,102,241,0.18)} }
        @keyframes msgMenuIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
        @keyframes menuIn    { from{opacity:0;transform:scale(0.88) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes apSlide   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes apFade    { from{opacity:0} to{opacity:1} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <input ref={quickCameraRef} type="file" multiple accept="image/*,video/*" capture="environment" className="hidden" onChange={handleQuickCameraPick} />
      {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}

      {/* ── Confirm Modals ── */}
      <ConfirmModal isOpen={confirmType === "block"} title={`Block ${chatUser?.name}?`}
        message="They won't be able to send you messages. You can unblock them anytime."
        confirmLabel="Block" danger onConfirm={doBlock} onCancel={() => setConfirmType(null)} />
      <ConfirmModal isOpen={confirmType === "clear"} title="Clear chat?"
        message="All messages will be deleted for you. This cannot be undone."
        confirmLabel="Clear Chat" danger onConfirm={doClear} onCancel={() => setConfirmType(null)} />

      {/* ── Theme picker ── */}
      {showThemePicker && <ThemePicker currentTheme={chatTheme} onSelect={applyTheme} onClose={() => setShowThemePicker(false)} />}

      {/* ── Message info panel ── */}
      {msgInfoOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
          onClick={() => setMsgInfoOpen(null)}
        >
          <div className="w-full max-w-[430px] rounded-t-[28px] overflow-hidden pb-8"
            style={{ background: "var(--background)", border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.45)", animation: "slideUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
            <div className="px-6 pt-3 pb-2 flex items-center justify-between border-b border-border/30">
              <h3 className="text-[17px] font-bold text-foreground">Message Info</h3>
              <button onClick={() => setMsgInfoOpen(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X size={15} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 pt-4 space-y-4">
              {msgInfoOpen.text && (
                <div className="bg-secondary/40 rounded-2xl p-3">
                  <p className="text-[14px] text-foreground leading-relaxed">{msgInfoOpen.text}</p>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="text-foreground font-medium">{msgInfoOpen.timestamp}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${msgInfoOpen.status === "seen" ? "text-blue-500" : "text-foreground"}`}>
                    {msgInfoOpen.status === "seen" ? "✓✓ Seen" : msgInfoOpen.status === "delivered" ? "✓✓ Delivered" : "✓ Sent"}
                  </span>
                </div>
                {msgInfoOpen.reactions && msgInfoOpen.reactions.length > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Reactions</span>
                    <span className="text-foreground font-medium">{msgInfoOpen.reactions.map((r: any) => r.emoji).join(" ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Lock screen (verify only — set is done from profile) ── */}
      {showLockScreen === "verify" && isLocked && !lockUnlocked && (
        <LockScreen mode="verify" chatUserName={chatUser?.name || "Chat"} chatUserAvatar={chatUser?.avatar}
          onVerified={() => { setShowLockScreen(null); setLockUnlocked(true); }}
          onSubmit={handleVerifyLock}
        />
      )}

      {/* ── Message context menu ── */}
      {msgMenu && (
        <div className="fixed inset-0 z-[60]" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(2px)" }}>
          <div ref={msgMenuRef} className="fixed rounded-2xl"
            style={{ ...blurStyle, ...getMsgMenuStyle(), animation: "msgMenuIn 0.18s cubic-bezier(0.34,1.4,0.64,1) both", overflow: "hidden", width: 220 }}>
            {/* Quick emoji row */}
            <div className="flex items-center justify-around px-2 py-2.5 border-b border-border/30">
              {quickReactions.map((e, idx) => (
                <button key={idx}
                  onClick={() => { handleReact(msgMenu.msgId, e); closeMsgMenu(); }}
                  onContextMenu={ev => { ev.preventDefault(); setEmojiPickerMode({ replaceIndex: idx }); }}
                  className="text-[20px] active:scale-90 transition-transform hover:scale-125 relative group"
                >
                  {e}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary text-[7px] text-primary-foreground
                    flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">✎</span>
                </button>
              ))}
              <button onClick={() => setEmojiPickerMode("react")}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted transition-colors active:scale-90">
                <Plus size={14} className="text-muted-foreground" />
              </button>
            </div>
            {msgMenuActions.map((a, i) => (
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

      {/* ── Emoji picker ── */}
      {emojiPickerMode !== null && msgMenu && (
        <EmojiPicker
          onSelect={emoji => {
            if (emojiPickerMode === "react") { handleReact(msgMenu.msgId, emoji); closeMsgMenu(); }
            else { replaceReaction(emojiPickerMode.replaceIndex, emoji); setEmojiPickerMode(null); }
          }}
          onClose={closeMsgMenu}
        />
      )}

      {/* ── Main container — theme background ── */}
      <div className={`min-h-screen flex flex-col max-w-[430px] mx-auto relative ${themeColors.chatBg || "bg-background"}`}>

        {/* ── HEADER — or SEARCH BAR (replaces header) ── */}
        <div className="sticky top-0 z-10 backdrop-blur-md bg-background/50" style={themeColors.chatBg ? { background: `${themeColors.chatBg?.replace("bg-", "")}cc` } : {}}>
          {!searchOpen ? (
            /* Normal header */
            <div className="flex items-center gap-3 px-4 py-3 pb-4">
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
                <button className="hover:text-foreground transition-colors p-1.5"><Video  size={22} strokeWidth={1.5} /></button>
                <button className="hover:text-foreground transition-colors p-1.5"><Phone  size={20} strokeWidth={1.5} /></button>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => { setShowMenu(p => !p); setShowMoreMenu(false); }}
                    className={`hover:text-foreground transition-colors p-1.5 rounded-full ${showMenu ? "text-foreground bg-muted" : ""}`}
                  >
                    <MoreVertical size={20} strokeWidth={1.5} />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-50 overflow-hidden"
                      style={{ ...blurStyle, animation: "menuIn 0.18s cubic-bezier(0.34,1.2,0.64,1) both", transformOrigin: "top right" }}>
                      {!showMoreMenu ? (
                        <>
                          {[
                            { icon: isMuted ? <Bell size={16} strokeWidth={1.5} /> : <BellOff size={16} strokeWidth={1.5} />, label: isMuted ? "Unmute notifications" : "Mute notifications", fn: handleMuteToggle },
                            { icon: <Search  size={16} strokeWidth={1.5} />, label: "Search in chat", fn: openSearch },
                            { icon: <Image   size={16} strokeWidth={1.5} />, label: "Media & files",   fn: handleMediaFiles },
                            { icon: <Palette size={16} strokeWidth={1.5} />, label: "Chat theme",      fn: handleChatTheme },
                          ].map((item, i) => (
                            <button key={i} onClick={item.fn}
                              className="w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left border-b border-border/40">
                              <span className="text-muted-foreground">{item.icon}</span>
                              {item.label}
                            </button>
                          ))}
                          <button onClick={e => { e.stopPropagation(); setShowMoreMenu(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left">
                            <span className="text-muted-foreground"><MoreVertical size={16} strokeWidth={1.5} /></span>
                            More
                            <ChevronRight size={14} className="ml-auto text-muted-foreground" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={e => { e.stopPropagation(); setShowMoreMenu(false); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted/60 transition-colors border-b border-border/40">
                            <ArrowLeft size={15} strokeWidth={2} /> Back
                          </button>
                          {[
                            { icon: <Ban      size={15} strokeWidth={1.5} />, label: "Block user",  fn: handleBlockUser,  danger: true  },
                            { icon: <Trash2   size={15} strokeWidth={1.5} />, label: "Clear chat",  fn: handleClearChat,  danger: true  },
                            { icon: <Download size={15} strokeWidth={1.5} />, label: "Export chat", fn: handleExportChat, danger: false },
                            { icon: <Flag     size={15} strokeWidth={1.5} />, label: "Report",      fn: handleReport,     danger: false },
                          ].map((item, i, arr) => (
                            <button key={i} onClick={item.fn}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium transition-colors text-left
                                ${item.danger ? "text-red-500 hover:bg-red-500/10" : "text-foreground hover:bg-muted/60"}
                                ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
                              <span className={item.danger ? "text-red-500" : "text-muted-foreground"}>{item.icon}</span>
                              {item.label}
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
            /* ── Search bar replaces header ── */
            <div className="flex items-center gap-2 px-4 py-3 pb-4" style={{ animation: "apFade 0.18s ease both" }}>
              <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2.5 bg-secondary border border-border/40">
                <Search size={15} className="text-muted-foreground shrink-0" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && goToNextResult()}
                  placeholder="Search messages…"
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
                {searchLoading && <span className="text-[11px] text-muted-foreground">Searching…</span>}
                {!searchLoading && searchQuery && (
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {searchResults.length > 0 ? `${searchIdx + 1}/${searchResults.length}` : "0 results"}
                  </span>
                )}
                {searchResults.length > 0 && (
                  <>
                    <button onClick={goToPrevResult} className="p-1 text-muted-foreground hover:text-foreground"><ChevronUp    size={16} /></button>
                    <button onClick={goToNextResult} className="p-1 text-muted-foreground hover:text-foreground"><ChevronDown  size={16} /></button>
                  </>
                )}
              </div>
              {/* Close restores header */}
              <button onClick={closeSearch}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Upload status ── */}
        {uploadStatus !== "idle" && (
          <div className="text-center text-[12px] font-medium py-1 pointer-events-none">
            <span className={`px-4 py-1 rounded-full mx-auto inline-block
              ${uploadStatus === "uploading" ? "text-primary animate-pulse bg-primary/10"
                : uploadStatus === "done"    ? "text-green-500 bg-green-500/10"
                : "text-red-500 bg-red-500/10"}`}>
              {uploadStatus === "uploading" ? "Sending…" : uploadStatus === "done" ? "Sent ✓" : "Failed to send"}
            </span>
          </div>
        )}

        {/* ── Messages ── */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
          {messages.map((msg, index) => {
            const isMe           = msg.senderId === "me";
            const isLastInGroup  = !messages[index + 1] || messages[index + 1].senderId !== msg.senderId;
            const isLastMyMsg    = index === lastSeenIdx;
            const isCurrentHit   = searchResults[searchIdx]?._id === msg.id;

            return (
              <div key={msg.id} id={`msg-${msg.id}`}
                className={`transition-colors rounded-2xl ${isCurrentHit ? "ring-2 ring-primary/50 ring-offset-1" : ""}`}
              >
                <div className={isLastInGroup ? "mb-4" : "mb-1"}
                  onMouseDown={e => { if (e.button === 0) startLongPress(msg, e); }}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onMouseMove={e => moveLongPress(e)}
                  onTouchStart={e => startLongPress(msg, e)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={e => moveLongPress(e)}
                >
                  <SwipeRow
                    msg={msg} isMe={isMe} isLast={isLastInGroup} isLastMyMsg={isLastMyMsg}
                    onReply={setReplyingTo} chatUser={chatUser}
                    playingVoice={playingVoice} setPlayingVoice={setPlayingVoice}
                    onImageTap={openLightbox} onReact={handleReact}
                    myUserId={user?._id ?? ""}
                    themeBubbleBg={themeColors.mine}
                    themeBubbleText={themeColors.mineText}
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

        {/* ── Scroll-to-bottom FAB ── */}
        <div className="pointer-events-none fixed bottom-[100px] right-0 flex justify-end pr-5"
          style={{ zIndex: 40, maxWidth: 430, width: "100%" }}>
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

        {/* ── Bottom bar ── */}
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

          {pendingImages.length > 0 && <PendingStrip images={pendingImages.map(p => p.url)} onRemove={removePending} />}

          {showAttachPanel ? (
            <div className="rounded-[32px] pt-5 pb-0" style={{ ...blurStyle, animation: "apSlide 0.25s cubic-bezier(0.34,1.2,0.64,1) both" }}>
              <AttachmentPanel onClose={() => setShowAttachPanel(false)} onAddImages={addPending} />
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ animation: "apFade 0.2s ease both" }}>
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
                  ? <button onClick={sendMessage}        className="text-primary hover:text-primary/80 transition-colors"><FiSend   size={20} /></button>
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