import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import gsap from "gsap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSocket } from "../lib/socket";
import { formatDistanceToNow } from "date-fns";
import { useIsDark } from "@/hooks/useIsDark";
import { toast } from "sonner";

type FilterTab = string;

/* ── default filters ── */
const DEFAULT_FILTERS: FilterTab[] = [
  "All",
  "Favorites",
  "Work",
  "Groups",
  "Communities",
];

const MessengersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const isDark = useIsDark();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [filters, setFilters] = useState<FilterTab[]>(DEFAULT_FILTERS);

  /* filter modal state */
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [editingFilter, setEditingFilter] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  /* ── glass style ── */
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

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get("/chats");
      return res.data;
    },
  });

  useEffect(() => {
    if (!socket) return;
    const inv = () => queryClient.invalidateQueries({ queryKey: ["chats"] });
    socket.on("message recieved", inv);
    socket.on("messages read", inv);
    return () => {
      socket.off("message recieved", inv);
      socket.off("messages read", inv);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    const onFocus = () =>
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient]);

  /* close menus on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMoreMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* search gsap */
  useEffect(() => {
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
        onComplete: () =>
          gsap.set([searchInputRef.current, closeBtnRef.current], {
            display: "none",
          }),
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
      gsap.to(moreBtnRef.current, {
        width: "40px",
        opacity: 1,
        marginLeft: 8,
        duration: 0.28,
        ease: "expo.out",
        delay: 0.18,
      });
    }
  }, [isSearching]);

  /* filter logic */
  const filteredChats = chats.filter((chat: any) => {
    const otherUser = chat.participants.find((p: any) => p._id !== user?._id);
    if (!otherUser) return false;
    if (searchQuery) {
      return (
        otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.latestMessage?.text
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }
    if (activeFilter === "Favorites") return !!chat.isFavorite;
    if (activeFilter === "Work") return !!chat.isWork;
    if (activeFilter === "Groups") return !!chat.isGroup;
    if (activeFilter === "Communities") return !!chat.isCommunity;
    return true;
  });

  /* menu actions */
  const handleNewContact = () => {
    setShowMoreMenu(false);
    navigate("/search");
  };
  const handleNewGroup = () => {
    setShowMoreMenu(false);
    toast.info("New group coming soon");
  };
  const handleArchivedChats = () => {
    setShowMoreMenu(false);
    toast.info("Archived chats coming soon");
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

  /* filter modal actions */
  const openFilterModal = () => {
    setShowFilterModal(true);
    setNewFilterName("");
    setEditingFilter(null);
  };

  const addFilter = () => {
    const name = newFilterName.trim();
    if (!name) return;
    if (filters.includes(name)) {
      toast.error("Filter already exists");
      return;
    }
    setFilters((p) => [...p, name]);
    setNewFilterName("");
    toast.success(`Filter "${name}" added`);
  };

  const deleteFilter = (f: FilterTab) => {
    if (DEFAULT_FILTERS.includes(f)) {
      toast.error("Cannot delete default filter");
      return;
    }
    setFilters((p) => p.filter((x) => x !== f));
    if (activeFilter === f) setActiveFilter("All");
    toast.success("Filter removed");
  };

  const startEdit = (f: FilterTab) => {
    setEditingFilter(f);
    setEditName(f);
  };
  const saveEdit = () => {
    if (!editingFilter || !editName.trim()) return;
    setFilters((p) =>
      p.map((x) => (x === editingFilter ? editName.trim() : x)),
    );
    if (activeFilter === editingFilter) setActiveFilter(editName.trim());
    setEditingFilter(null);
    toast.success("Filter renamed");
  };

  return (
    <>
      <style>{`
        @keyframes menuIn  { from{opacity:0;transform:scale(0.88) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
        @keyframes apFade  { from{opacity:0} to{opacity:1} }
        *::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Filter management modal ── */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-[28px] overflow-hidden pb-8"
            style={{
              background: "var(--background)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.45)",
              animation: "slideUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* title row */}
            <div className="px-6 pt-3 pb-3 flex items-center justify-between border-b border-border/30">
              <h3 className="text-[17px] font-bold text-foreground">
                Manage Filters
              </h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X size={15} className="text-muted-foreground" />
              </button>
            </div>

            {/* existing filters list */}
            <div
              className="px-6 pt-4 space-y-1 max-h-[240px] overflow-y-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filters.map((f) => {
                const isDefault = DEFAULT_FILTERS.includes(f);
                return (
                  <div
                    key={f}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-2xl bg-secondary/40 group"
                  >
                    <GripVertical
                      size={14}
                      className="text-muted-foreground/40 shrink-0"
                    />
                    {editingFilter === f ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="flex-1 bg-transparent text-[14px] text-foreground outline-none border-b border-primary/50 pb-0.5"
                      />
                    ) : (
                      <span className="flex-1 text-[14px] font-medium text-foreground">
                        {f}
                      </span>
                    )}
                    {editingFilter === f ? (
                      <button
                        onClick={saveEdit}
                        className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"
                      >
                        <Check size={13} className="text-primary" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isDefault && (
                          <button
                            onClick={() => startEdit(f)}
                            className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-muted"
                          >
                            <Pencil
                              size={12}
                              className="text-muted-foreground"
                            />
                          </button>
                        )}
                        {!isDefault && (
                          <button
                            onClick={() => deleteFilter(f)}
                            className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20"
                          >
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        )}
                        {isDefault && (
                          <span className="text-[10px] text-muted-foreground/50 px-1">
                            default
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* add new filter */}
            <div className="px-6 pt-5">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Add new filter
              </p>

              {/* name input + add btn */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 bg-secondary/60 border border-border/40">
                  <input
                    ref={filterInputRef}
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFilter()}
                    placeholder="Filter name…"
                    className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none"
                  />
                </div>
                <button
                  onClick={addFilter}
                  disabled={!newFilterName.trim()}
                  className="w-11 h-11 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={20} className="text-primary-foreground" />
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground/50 mt-2 px-1">
                Filters are simulated — connect to real data when ready.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className="min-h-screen bg-background pb-28 max-w-[430px] mx-auto font-sans"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-6 pb-2 min-h-[64px] grid items-center">
          <h1
            ref={titleRef}
            className="col-start-1 row-start-1 text-2xl font-bold tracking-tight text-foreground z-0 justify-self-start"
            style={{ pointerEvents: isSearching ? "none" : "auto" }}
          >
            Chats
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
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Three-dots menu */}
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
                    ...blurStyle,
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
                      <span className="text-muted-foreground">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="px-5 pb-5">
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[13.5px] font-medium transition-all duration-200 border select-none active:scale-95
                    ${
                      isActive
                        ? "bg-foreground text-background border-foreground shadow-sm"
                        : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary/80 hover:text-foreground"
                    }`}
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
        </div>

        {/* ── Chat List ── */}
        <div className="flex flex-col pb-6">
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
              {activeFilter !== "All" && (
                <button
                  onClick={() => setActiveFilter("All")}
                  className="text-xs text-muted-foreground underline underline-offset-2 mt-1"
                >
                  Show all chats
                </button>
              )}
            </div>
          )}

          {!isLoading &&
            filteredChats.map((chat: any) => {
              const otherUser = chat.participants.find(
                (p: any) => p._id !== user?._id,
              );
              if (!otherUser) return null;

              const latestMsg = chat.latestMessage;
              const latestSenderId =
                latestMsg?.senderId?._id || latestMsg?.senderId;
              const isMine = latestSenderId === user?._id;
              const unreadCount: number = chat.unreadCount ?? 0;
              const isUnread = unreadCount > 0;
              const tickSeen = isMine && latestMsg?.readBy?.length > 1;
              const tickDelivered =
                isMine && !tickSeen && latestMsg?.readBy?.length >= 1;
              let timeLabel = "";
              if (latestMsg?.createdAt) {
                timeLabel = formatDistanceToNow(new Date(latestMsg.createdAt), {
                  addSuffix: true,
                }).replace("about ", "");
              }

              return (
                <button
                  key={chat._id}
                  onClick={() => navigate(`/chat/${otherUser._id}`)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="relative shrink-0">
                    <img
                      src={otherUser.avatar || "https://i.pravatar.cc/150"}
                      className="w-[58px] h-[58px] rounded-full object-cover"
                      alt={otherUser.name}
                    />
                    {otherUser.online && (
                      <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left self-center mt-1 pb-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-[16px] leading-tight truncate pr-2 text-foreground">
                        {otherUser.name}
                      </p>
                      <span
                        className={`text-[12px] shrink-0 ${isUnread ? "text-green-500 font-semibold" : "text-muted-foreground"}`}
                      >
                        {timeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1 truncate flex-1">
                        {isMine &&
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
                          className={`text-[14px] truncate ${isUnread ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                        >
                          {latestMsg ? latestMsg.text || "📷 Photo" : "Say hi!"}
                        </p>
                      </div>
                      {isUnread && (
                        <span className="bg-green-500 text-white text-[11px] font-bold min-w-[20px] h-[20px] rounded-full inline-flex items-center justify-center px-1 shrink-0 pl-2">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
};

export default MessengersPage;
