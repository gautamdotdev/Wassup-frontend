import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiMoreVertical, FiPlus, FiX } from "react-icons/fi";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import {
  UserPlus,
  Users,
  Archive,
  Settings,
  RefreshCw,
  BellOff,
  Plus,
  X,
  Check,
  GripVertical,
  Pencil,
  Trash2,
  Pin,
  Star,
  CheckCheck,
  MoreVertical as MoreVert,
} from "lucide-react";
import gsap from "gsap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSocket } from "../lib/socket";
import { formatDistanceToNow } from "date-fns";
import { useIsDark } from "@/hooks/useIsDark";
import { toast } from "sonner";
import { FilterModal } from "@/components/chat/FilterModal";

type FilterTab = string;
type ChatMenu = { chatId: string; x: number; y: number } | null;

const DEFAULT_FILTERS: FilterTab[] = ["All", "Unread", "Favorites", "Groups"];

const MessengersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const isDark = useIsDark();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  };
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [filters, setFilters] = useState<FilterTab[]>(DEFAULT_FILTERS);

  /* filter modal */
  const [showFilterModal, setShowFilterModal] = useState(false);

  /* long-press context menu */
  const [chatMenu, setChatMenu] = useState<ChatMenu>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lpStartX = useRef(0);
  const lpStartY = useRef(0);
  const chatMenuRef = useRef<HTMLDivElement>(null);

  /* multi-select */
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const selectMenuRef = useRef<HTMLDivElement>(null);

  const [typingStates, setTypingStates] = useState<
    Record<string, { userId: string; name?: string }[]>
  >({});

  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const pill = isDark
    ? {
        background: "rgba(20,20,20,0.82)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.55),0 1px 0 rgba(255,255,255,0.06) inset",
      }
    : {
        background: "rgba(255,255,255,0.90)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.12),0 1px 0 rgba(255,255,255,0.9) inset",
      };
  const blurStyle = {
    ...pill,
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
  };

  const dropdownBg = {
    background: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
    border: isDark
      ? "1px solid rgba(255,255,255,0.1)"
      : "1px solid rgba(0,0,0,0.08)",
    boxShadow: isDark
      ? "0 4px 20px rgba(0,0,0,0.4)"
      : "0 4px 20px rgba(0,0,0,0.08)",
  };

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get("/chats");
      return res.data;
    },
  });

  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (newMessage: any) => {
      const incomingChatId = newMessage.chatId?._id || newMessage.chatId;
      if (!incomingChatId) return;

      queryClient.setQueryData<any[]>(["chats"], (oldChats) => {
        if (!oldChats) return oldChats;

        const chatIndex = oldChats.findIndex(
          (c: any) => c._id === incomingChatId,
        );
        if (chatIndex === -1) return oldChats;

        const updatedChat = {
          ...oldChats[chatIndex],
          latestMessage: newMessage,
          lastMessageTime: newMessage.createdAt || new Date().toISOString(),
          unreadCount:
            newMessage.senderId?._id === user?._id ||
            newMessage.senderId === user?._id
              ? (oldChats[chatIndex].unreadCount ?? 0)
              : (oldChats[chatIndex].unreadCount ?? 0) + 1,
        };

        const rest = oldChats.filter((_: any, i: number) => i !== chatIndex);
        return [updatedChat, ...rest];
      });
    };

    const invalidateOnRead = () =>
      queryClient.invalidateQueries({ queryKey: ["chats"] });

    socket.on("message recieved", handleMessageReceived);
    socket.on("messages read", invalidateOnRead);

    socket.on("typing", (data: any) => {
      const cid = data.chatId;
      const uid = data.userId || data._id;
      if (!cid || !uid) return;
      setTypingStates((prev) => {
        const current = prev[cid] || [];
        if (current.find((u) => u.userId === uid)) return prev;
        return {
          ...prev,
          [cid]: [
            ...current,
            { userId: uid, name: data.name || data.userName },
          ],
        };
      });
    });

    socket.on("stop typing", (data: any) => {
      const cid = data.chatId;
      const uid = data.userId || data._id;
      if (!cid || !uid) return;
      setTypingStates((prev) => {
        const current = prev[cid] || [];
        const next = current.filter((u) => u.userId !== uid);
        if (next.length === 0) {
          const copy = { ...prev };
          delete copy[cid];
          return copy;
        }
        return { ...prev, [cid]: next };
      });
    });

    return () => {
      socket.off("message recieved", handleMessageReceived);
      socket.off("messages read", invalidateOnRead);
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [socket, queryClient, user]);

  // Periodic cleanup for typing states
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingStates({}); // Reset to clear any stale states
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onFocus = () =>
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMoreMenu(false);
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(e.target as Node)
      )
        setChatMenu(null);
      if (
        selectMenuRef.current &&
        !selectMenuRef.current.contains(e.target as Node)
      )
        setShowSelectMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitSelect();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    if (!titleRef.current || !searchContainerRef.current) return;
    if (isSearching) {
      gsap.to(titleRef.current, {
        opacity: 0,
        x: -8,
        duration: 0.22,
        ease: "expo.inOut",
      });
      gsap.to(moreBtnRef.current, {
        width: 0,
        opacity: 0,
        marginLeft: 0,
        duration: 0.25,
        ease: "expo.inOut",
      });
      gsap.to(searchContainerRef.current, {
        width: "100%",
        duration: 0.38,
        ease: "expo.inOut",
        onComplete: () => searchInputRef.current?.focus(),
      });
      gsap.set([searchInputRef.current, closeBtnRef.current], {
        display: "block",
      });
      gsap.to([searchInputRef.current, closeBtnRef.current], {
        opacity: 1,
        duration: 0.2,
        delay: 0.22,
      });
    } else {
      gsap.to([searchInputRef.current, closeBtnRef.current], {
        opacity: 0,
        duration: 0.15,
        onComplete: () => {
          if (searchInputRef.current)
            gsap.set([searchInputRef.current, closeBtnRef.current], {
              display: "none",
            });
        },
      });
      gsap.to(searchContainerRef.current, {
        width: "40px",
        duration: 0.35,
        ease: "expo.inOut",
        delay: 0.08,
      });
      gsap.to(titleRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.28,
        ease: "expo.out",
        delay: 0.18,
      });
      if (moreBtnRef.current)
        gsap.to(moreBtnRef.current, {
          width: "40px",
          opacity: 1,
          marginLeft: 8,
          duration: 0.28,
          ease: "expo.out",
          delay: 0.18,
        });
    }
  }, [isSearching, selecting]); // Add selecting to dependency to re-check refs when header swaps

  /* ── long press ── */
  const startLongPress = useCallback(
    (chatId: string, e: React.TouchEvent | React.MouseEvent) => {
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      lpStartX.current = clientX;
      lpStartY.current = clientY;
      longPressTimer.current = setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(30);
        if (selecting) {
          toggleSelect(chatId);
        } else {
          setChatMenu({ chatId, x: clientX, y: clientY });
        }
      }, 450);
    },
    [selecting],
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const moveLongPress = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const x =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const y =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      if (
        Math.abs(x - lpStartX.current) > 10 ||
        Math.abs(y - lpStartY.current) > 10
      )
        cancelLongPress();
    },
    [cancelLongPress],
  );

  /* ── multi-select ── */
  const enterSelect = (chatId: string) => {
    setSelecting(true);
    setSelected(new Set([chatId]));
    setChatMenu(null);
  };
  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
    setShowSelectMenu(false);
  };
  const toggleSelect = (chatId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(chatId) ? next.delete(chatId) : next.add(chatId);
      if (next.size === 0) setSelecting(false);
      return next;
    });
  };
  const selectAll = () =>
    setSelected(new Set(filteredChats.map((c: any) => c._id)));

  /* ── single chat menu actions ── */
  const handlePin = () => {
    setChatMenu(null);
    toast.success("Chat pinned");
  };
  const handleMuteChat = () => {
    setChatMenu(null);
    toast.success("Chat muted");
  };
  const handleArchiveChat = () => {
    setChatMenu(null);
    toast.success("Chat archived");
  };
  const handleMarkRead = () => {
    setChatMenu(null);
    toast.success("Marked as read");
  };
  const handleFavorite = () => {
    setChatMenu(null);
    toast.success("Added to favorites");
  };
  const handleDeleteChat = () => {
    setChatMenu(null);
    toast.error("Delete chat — simulated");
  };

  /* ── bulk actions ── */
  const bulkMarkRead = () => {
    toast.success(`${selected.size} chat(s) marked as read`);
    exitSelect();
  };
  const bulkMute = () => {
    toast.success(`${selected.size} chat(s) muted`);
    exitSelect();
  };
  const bulkArchive = () => {
    toast.success(`${selected.size} chat(s) archived`);
    exitSelect();
  };
  const bulkDelete = () => {
    toast.error(`${selected.size} chat(s) deleted — simulated`);
    exitSelect();
  };
  const bulkPin = () => {
    toast.success(`${selected.size} chat(s) pinned`);
    exitSelect();
  };
  const bulkFavorite = () => {
    toast.success(`${selected.size} chat(s) added to favorites`);
    exitSelect();
  };

  /* ── menu position ── */
  const getMenuStyle = () => {
    if (!chatMenu) return {};
    const menuW = 220,
      menuH = 300;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    let left = chatMenu.x - menuW / 2;
    let top = chatMenu.y + 12;
    if (left + menuW > vw - 12) left = vw - menuW - 12;
    if (left < 12) left = 12;
    if (top + menuH > vh - 12) top = chatMenu.y - menuH - 12;
    return { left, top };
  };

  /* filter logic */
  const filteredChats = chats.filter((chat: any) => {
    const isGroup = chat.chatType === "group";
    const otherUser = isGroup
      ? null
      : chat.participants.find((p: any) => p._id !== user?._id);
    const chatName = isGroup ? chat.chatName : otherUser?.name || "Unknown";

    if (debouncedSearch) {
      return (
        chatName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        chat.latestMessage?.text
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      );
    }
    if (activeFilter === "Favorites") return !!chat.isFavorite;
    if (activeFilter === "Work") return !!chat.isWork;
    if (activeFilter === "Groups") return chat.chatType === "group";
    if (activeFilter === "Communities") return !!chat.isCommunity;
    return true;
  });

  /* top-bar menu actions */
  const handleNewContact = () => {
    setShowMoreMenu(false);
    navigate("/search");
  };
  const handleNewGroup = () => {
    setShowMoreMenu(false);
    navigate("/new-group");
  };
  const handleArchivedChats = () => {
    setShowMoreMenu(false);
    navigate("/archived");
  };
  const handleSettings = () => {
    setShowMoreMenu(false);
    navigate("/settings");
  };
  const handleClearAllRead = async () => {
    setShowMoreMenu(false);
    try {
      await api.post("/chats/read-all");
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      toast.success("All chats marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };
  const handleRefresh = () => {
    setShowMoreMenu(false);
    queryClient.invalidateQueries({ queryKey: ["chats"] });
    toast.success("Chats refreshed");
  };

  /* filter modal */
  const openFilterModal = () => {
    setShowFilterModal(true);
  };

  const chatMenuActions = chatMenu
    ? [
        {
          icon: <Pin size={15} strokeWidth={1.5} />,
          label: "Pin chat",
          fn: handlePin,
        },
        {
          icon: <Star size={15} strokeWidth={1.5} />,
          label: "Add to favorites",
          fn: handleFavorite,
        },
        {
          icon: <CheckCheck size={15} strokeWidth={1.5} />,
          label: "Mark as read",
          fn: handleMarkRead,
        },
        {
          icon: <BellOff size={15} strokeWidth={1.5} />,
          label: "Mute notifications",
          fn: handleMuteChat,
        },
        {
          icon: <Archive size={15} strokeWidth={1.5} />,
          label: "Archive chat",
          fn: handleArchiveChat,
        },
        {
          icon: <Users size={15} strokeWidth={1.5} />,
          label: "Select",
          fn: () => enterSelect(chatMenu.chatId),
        },
        {
          icon: <Trash2 size={15} strokeWidth={1.5} />,
          label: "Delete chat",
          fn: handleDeleteChat,
          danger: true,
        },
      ]
    : [];

  /* select-mode 3-dot menu actions */
  const selectMenuActions = [
    {
      icon: <CheckCheck size={15} strokeWidth={1.5} />,
      label: "Mark as read",
      fn: bulkMarkRead,
    },
    {
      icon: <Pin size={15} strokeWidth={1.5} />,
      label: "Pin selected",
      fn: bulkPin,
    },
    {
      icon: <Star size={15} strokeWidth={1.5} />,
      label: "Add to favorites",
      fn: bulkFavorite,
    },
    {
      icon: <BellOff size={15} strokeWidth={1.5} />,
      label: "Mute selected",
      fn: bulkMute,
    },
    {
      icon: <Archive size={15} strokeWidth={1.5} />,
      label: "Archive selected",
      fn: bulkArchive,
    },
    {
      icon: <Trash2 size={15} strokeWidth={1.5} />,
      label: "Delete selected",
      fn: bulkDelete,
      danger: true,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes menuIn    { from{opacity:0;transform:scale(0.88) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes msgMenuIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
        @keyframes barIn     { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        *::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Long-press context menu ── */}
      {chatMenu && (
        <div
          className="fixed inset-0 z-[60]"
          style={{ background: "transparent", backdropFilter: "blur(2px)" }}
          onMouseDown={() => setChatMenu(null)}
          onTouchStart={() => setChatMenu(null)}
        >
          <div
            ref={chatMenuRef}
            className="fixed rounded-2xl overflow-hidden"
            style={{
              ...dropdownBg,
              ...getMenuStyle(),
              animation: "msgMenuIn 0.18s cubic-bezier(0.34,1.4,0.64,1) both",
              width: 220,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {chatMenuActions.map((a, i) => (
              <button
                key={i}
                onClick={a.fn}
                className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium transition-colors text-left
                  ${(a as any).danger ? "text-red-500 hover:bg-red-500/10" : "text-foreground hover:bg-muted/60"}
                  ${i < chatMenuActions.length - 1 ? "border-b border-border/30" : ""}`}
              >
                <span
                  className={
                    (a as any).danger ? "text-red-500" : "text-muted-foreground"
                  }
                >
                  {a.icon}
                </span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter modal ── */}
      <FilterModal
        isOpen={showFilterModal}
        filters={filters}
        activeFilter={activeFilter}
        onClose={() => setShowFilterModal(false)}
        onFiltersChange={setFilters}
        onActiveFilterChange={setActiveFilter}
      />
      <div className="h-screen bg-background pb-28 max-w-[430px] mx-auto font-sans overflow-y-auto scrollbar-none">
        {/* ── Header ── */}
        {selecting ? (
          /* ── Selection header ── */
          <div
            key="select-header"
            className="px-5 pt-6 pb-4 flex items-center gap-3"
            style={{ animation: "menuIn 0.18s ease both" }}
          >
            {/* X to exit */}
            <button
              onClick={exitSelect}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <X size={18} className="text-foreground" />
            </button>

            {/* count */}
            <span className="flex-1 text-[17px] font-bold text-foreground">
              {selected.size} selected
            </span>

            {/* Select All text btn */}
            <button
              onClick={selectAll}
              className="text-[13px] font-semibold text-primary px-3 py-1.5 rounded-full bg-primary/10 active:scale-95 transition-all shrink-0"
            >
              All
            </button>

            {/* 3-dot menu */}
            <div className="relative" ref={selectMenuRef}>
              <button
                onClick={() => setShowSelectMenu((p) => !p)}
                className={`w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 active:scale-95 transition-all ${showSelectMenu ? "bg-muted" : ""}`}
              >
                <MoreVert size={18} className="text-foreground" />
              </button>

              {showSelectMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl z-50 overflow-hidden"
                  style={{
                    ...dropdownBg,
                    animation:
                      "menuIn 0.18s cubic-bezier(0.34,1.2,0.64,1) both",
                    transformOrigin: "top right",
                  }}
                >
                  {selectMenuActions.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowSelectMenu(false);
                        a.fn();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium transition-colors text-left
                        ${(a as any).danger ? "text-red-500 hover:bg-red-500/10" : "text-foreground hover:bg-muted/60"}
                        ${i < selectMenuActions.length - 1 ? "border-b border-border/30" : ""}`}
                    >
                      <span
                        className={
                          (a as any).danger
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }
                      >
                        {a.icon}
                      </span>
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            key="normal-header"
            className="px-5 pt-6 pb-2 min-h-[64px] grid items-center"
          >
            <h1
              ref={titleRef}
              className="col-start-1 row-start-1 text-2xl font-bold tracking-tight text-foreground z-0 justify-self-start"
              style={{ pointerEvents: isSearching ? "none" : "auto" }}
            >
              {activeFilter === "All" ? "Chats" : activeFilter}
            </h1>
            <div className="col-start-1 row-start-1 flex items-center justify-end w-full z-10">
              <div
                ref={searchContainerRef}
                className="flex items-center bg-secondary/80 rounded-[99px] backdrop-blur-md overflow-hidden relative"
                style={{ width: "40px", height: "40px" }}
              >
                <button
                  onClick={() => !isSearching && setIsSearching(true)}
                  className="w-10 h-10 shrink-0 flex items-center justify-center z-10"
                  style={{ cursor: isSearching ? "default" : "pointer" }}
                >
                  <FiSearch
                    size={isSearching ? 18 : 20}
                    className={`transition-all duration-300 ${isSearching ? "text-muted-foreground mr-1" : "text-foreground"}`}
                  />
                </button>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search chats..."
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none absolute left-10 right-10 top-0 bottom-0 pr-2"
                  style={{ display: "none", opacity: 0 }}
                />
                <button
                  ref={closeBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSearching(false);
                    setSearchQuery("");
                  }}
                  className="w-10 h-10 shrink-0 flex items-center justify-center transition-colors absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                  style={{ display: "none", opacity: 0 }}
                >
                  <FiX size={18} />
                </button>
              </div>
              <div className="relative ml-2" ref={menuRef}>
                <button
                  ref={moreBtnRef}
                  onClick={() => setShowMoreMenu((p) => !p)}
                  className={`w-10 h-10 overflow-hidden flex items-center justify-center rounded-full bg-secondary/80 text-foreground transition-colors backdrop-blur-md active:scale-95 shrink-0 ${showMoreMenu ? "bg-muted" : ""}`}
                >
                  <FiMoreVertical size={20} />
                </button>
                {showMoreMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-50 overflow-hidden"
                    style={{
                      ...dropdownBg,
                      animation:
                        "menuIn 0.18s cubic-bezier(0.34,1.2,0.64,1) both",
                      transformOrigin: "top right",
                    }}
                  >
                    {[
                      {
                        icon: <UserPlus size={16} strokeWidth={1.5} />,
                        label: "New contact",
                        fn: handleNewContact,
                      },
                      {
                        icon: <Users size={16} strokeWidth={1.5} />,
                        label: "New group",
                        fn: handleNewGroup,
                      },
                      {
                        icon: <Archive size={16} strokeWidth={1.5} />,
                        label: "Archived chats",
                        fn: handleArchivedChats,
                      },
                      {
                        icon: <BellOff size={16} strokeWidth={1.5} />,
                        label: "Mark all as read",
                        fn: handleClearAllRead,
                      },
                      {
                        icon: <RefreshCw size={16} strokeWidth={1.5} />,
                        label: "Refresh",
                        fn: handleRefresh,
                      },
                      {
                        icon: <Settings size={16} strokeWidth={1.5} />,
                        label: "Settings",
                        fn: handleSettings,
                      },
                    ].map((item, i, arr) => (
                      <button
                        key={i}
                        onClick={item.fn}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-foreground hover:bg-muted/60 transition-colors text-left ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}
                      >
                        <span className="text-muted-foreground">
                          {item.icon}
                        </span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Filter tabs + Archived row ── */}
        {!selecting && (
          <div className="px-5 pb-3">
            {/* Filter pills */}
            <div
              className="flex items-center gap-2 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filters.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-[13.5px] font-medium transition-all duration-200 border select-none active:scale-95
                      ${isActive ? "bg-foreground text-background border-foreground shadow-sm" : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary/80 hover:text-foreground"}`}
                  >
                    {filter}
                  </button>
                );
              })}
              <button
                onClick={openFilterModal}
                className="shrink-0 w-[32px] h-[32px] rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary/80 hover:text-foreground flex items-center justify-center transition-colors border border-border/50 active:scale-95"
              >
                <FiPlus size={15} />
              </button>
            </div>

            <button
              onClick={() => navigate("/archived")}
              className={`w-full flex items-center justify-between gap-3 py-2.5 mt-1 transition-all duration-200 active:scale-[0.98] text-muted-foreground hover:text-foreground`}
            >
              <span className="flex items-center gap-3">
                <Archive
                  size={16}
                  strokeWidth={1.5}
                  className="text-muted-foreground"
                />
                <span className="text-[13.5px] font-medium flex-1 text-left">
                  Archived chats
                </span>
              </span>
              <p className="text-[13.5px] font-medium">9</p>
            </button>
          </div>
        )}

        {/* ── Chat List ── */}
        <div className="flex flex-col pb-6">
          <>
            {isLoading && (
              <div className="px-5 py-12 text-center flex flex-col items-center gap-2">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Loading chats...
                </p>
              </div>
            )}

            {!isLoading && filteredChats.length === 0 && (
              <div className="px-5 py-12 text-center flex flex-col items-center gap-2">
                <FiSearch size={32} className="text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">
                  No chats found
                </p>
              </div>
            )}

            {!isLoading &&
              filteredChats.map((chat: any) => {
                const isGroup = chat.chatType === "group";
                const otherUser = isGroup
                  ? null
                  : chat.participants.find((p: any) => p._id !== user?._id);
                if (!isGroup && !otherUser) return null;

                const chatName = isGroup ? chat.chatName : otherUser.name;
                const chatAvatar = isGroup
                  ? chat.avatar || "https://i.pravatar.cc/150?u=group"
                  : otherUser.avatar;

                const latestMsg = chat.latestMessage || chat.lastMessage;
                const status = latestMsg?.tickStatus || "sent";
                const latestSenderId =
                  latestMsg?.senderId?._id || latestMsg?.senderId;
                const isMine = latestSenderId === user?._id;
                const unreadCount: number = chat.unreadCount ?? 0;
                const isUnread = unreadCount > 0;
                const tickSeen = isMine && status === "seen";
                const tickDelivered =
                  isMine && (status === "delivered" || status === "seen");
                let timeLabel = "";
                if (latestMsg?.createdAt) {
                  timeLabel = formatDistanceToNow(
                    new Date(latestMsg.createdAt),
                    { addSuffix: true },
                  ).replace("about ", "");
                }
                const isSelected = selected.has(chat._id);

                return (
                  <div
                    key={chat._id}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 transition-colors cursor-pointer select-none
                      ${isSelected ? "bg-primary/[0.08]" : "hover:bg-secondary/50"}`}
                    onMouseDown={(e) => {
                      if (e.button === 0) startLongPress(chat._id, e);
                    }}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onMouseMove={(e) => moveLongPress(e)}
                    onTouchStart={(e) => startLongPress(chat._id, e)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={(e) => moveLongPress(e)}
                    onClick={() => {
                      if (selecting) {
                        toggleSelect(chat._id);
                        return;
                      }
                      navigate(
                        isGroup
                          ? `/chat/group/${chat._id}`
                          : `/chat/${otherUser._id}`,
                      );
                    }}
                  >
                    {/* select circle */}
                    {selecting && (
                      <div
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150
                        ${isSelected ? "bg-primary border-primary scale-110" : "border-border"}`}
                      >
                        {isSelected && (
                          <Check
                            size={13}
                            className="text-primary-foreground"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    )}

                    <div
                      className={`relative shrink-0 transition-transform duration-150 ${selecting ? "scale-90" : ""}`}
                    >
                      <img
                        src={chatAvatar || "https://i.pravatar.cc/150"}
                        className={`w-[58px] h-[58px] object-cover ${isGroup ? "rounded-[20px]" : "rounded-full"}`}
                        alt={chatName}
                      />
                      {!isGroup && otherUser.online && !selecting && (
                        <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left self-center mt-1 pb-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-[16px] leading-tight truncate pr-2 text-foreground">
                          {chatName}
                        </p>
                        <span
                          className={`text-[12px] shrink-0 ${isUnread ? "text-green-500 font-semibold" : "text-muted-foreground"}`}
                        >
                          {timeLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="flex items-center gap-1 truncate flex-1">
                          {!typingStates[chat._id] &&
                            isMine &&
                            (tickSeen ? (
                              <BsCheckAll
                                size={18}
                                className="text-[#4E89F0] shrink-0"
                              />
                            ) : tickDelivered ? (
                              <BsCheckAll
                                size={18}
                                className="text-muted-foreground shrink-0"
                              />
                            ) : (
                              <BsCheck
                                size={18}
                                className="text-muted-foreground shrink-0"
                              />
                            ))}

                          <p
                            className={`text-[14px] truncate flex items-center gap-1 ${typingStates[chat._id] ? "text-green-500 font-bold" : isUnread ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                          >
                            {typingStates[chat._id] ? (
                              <>
                                {isGroup
                                  ? `${typingStates[chat._id][0].name?.split(" ")[0] || "Someone"} is typing`
                                  : "typing"}
                                <span className="flex gap-0.5 ml-1 items-center h-full pt-1">
                                  {[0, 180, 360].map((d) => (
                                    <span
                                      key={d}
                                      className="w-1 h-1 rounded-full bg-green-500 animate-typing-bounce"
                                      style={{ animationDelay: `${d}ms` }}
                                    />
                                  ))}
                                </span>
                              </>
                            ) : latestMsg ? (
                              <>
                                {isGroup &&
                                  latestMsg.senderId?._id !== user?._id && (
                                    <span className="text-primary/70 font-bold mr-1">
                                      {latestMsg.senderId?.name || "Member"}:
                                    </span>
                                  )}
                                {latestMsg.text ||
                                  latestMsg.content ||
                                  latestMsg.message ||
                                  (latestMsg.images?.length
                                    ? "📷 Photo"
                                    : latestMsg.files?.length
                                      ? "📁 File"
                                      : "New message")}
                              </>
                            ) : (
                              "No messages yet"
                            )}
                          </p>
                        </div>
                        {isUnread && !selecting && (
                          <span className="bg-green-500 text-white text-[11px] font-bold min-w-[20px] h-[20px] rounded-full inline-flex items-center justify-center px-1 shrink-0">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </>
        </div>
      </div>
    </>
  );
};

export default MessengersPage;
