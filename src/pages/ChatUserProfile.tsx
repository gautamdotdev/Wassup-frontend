import {
  ArrowLeft, MoreVertical, ChevronRight,
  Bell, Lock, LockOpen, AlertTriangle, Trash2, ImageIcon, BellOff
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/chat/ConfirmModal";
import { LockScreen } from "@/components/chat/LockScreen";

const ChatUserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [chatUser, setChatUser]   = useState<any>(null);
  const [chat, setChat]           = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isLocked, setIsLocked]   = useState(false);
  const [isMuted,  setIsMuted]    = useState(false);
  const [confirmType, setConfirmType] = useState<"block" | "clear" | null>(null);
  const [showLockScreen, setShowLockScreen] = useState<"set" | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        setIsLoading(true);
        const { data: userData } = await api.get(`/users/${userId}`);
        setChatUser(userData);
        const { data: chatData } = await api.post("/chats", { userId });
        setChat(chatData);
        const uid = user?._id;
        setIsMuted(!!chatData.mutedBy?.some((m: any) => (m._id || m) === uid));
        setIsLocked(!!chatData.locks?.some((l: any) => (l.user?._id || l.user) === uid));
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    if (userId) load();
  }, [userId, user]);

  /* ── Mute ── */
  const handleMuteToggle = async () => {
    if (!chat) return;
    try {
      await api.post(`/chats/${chat._id}/mute`, { mute: !isMuted });
      setIsMuted(p => !p);
      toast.success(isMuted ? "Notifications unmuted" : "Notifications muted");
    } catch { toast.error("Failed to update notifications"); }
  };

  /* ── Lock ── */
  const handleLockToggle = async () => {
    if (!chat) return;
    if (isLocked) {
      try {
        await api.post(`/chats/${chat._id}/lock`, { password: null });
        setIsLocked(false);
        toast.success("Chat lock removed");
      } catch { toast.error("Failed to remove lock"); }
    } else {
      setShowLockScreen("set");
    }
  };

  const handleSetLock = async (pw: string): Promise<boolean> => {
    if (!chat) return false;
    try {
      await api.post(`/chats/${chat._id}/lock`, { password: pw });
      setIsLocked(true);
      return true;
    } catch { return false; }
  };

  /* ── Block / Clear ── */
  const doBlock = async () => {
    setConfirmType(null);
    try { await api.post(`/chats/${chat._id}/block`); toast.success(`${chatUser?.name} blocked`); navigate(-1); }
    catch { toast.error("Failed to block"); }
  };
  const doClear = async () => {
    setConfirmType(null);
    try { await api.delete(`/chats/${chat._id}/messages`); toast.success("Chat cleared"); navigate(`/chat/${userId}`); }
    catch { toast.error("Failed to clear chat"); }
  };

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto overflow-y-auto scrollbar-none flex flex-col items-center pb-20">

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmType === "block"}
        title={`Block ${chatUser?.name}?`}
        message="They won't be able to send you messages. You can unblock anytime."
        confirmLabel="Block" danger onConfirm={doBlock} onCancel={() => setConfirmType(null)}
      />
      <ConfirmModal
        isOpen={confirmType === "clear"}
        title="Clear chat?"
        message="All messages will be deleted for you. This cannot be undone."
        confirmLabel="Clear Chat" danger onConfirm={doClear} onCancel={() => setConfirmType(null)}
      />

      {/* Lock set-password screen */}
      {showLockScreen === "set" && (
        <LockScreen
          mode="set"
          chatUserName={chatUser?.name || "Chat"}
          chatUserAvatar={chatUser?.avatar}
          onVerified={() => { setShowLockScreen(null); toast.success("Chat locked 🔒"); }}
          onCancel={() => setShowLockScreen(null)}
          onSubmit={handleSetLock}
        />
      )}

      {/* Header */}
      <div className="w-full px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <MoreVertical size={17} strokeWidth={2} />
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center mt-2 w-full">
        {isLoading ? (
          <div className="w-[100px] h-[100px] rounded-full bg-secondary animate-pulse" />
        ) : (
          <>
            <div className="relative">
              <img
                src={chatUser?.avatar || "https://i.pravatar.cc/150"}
                className="w-[100px] h-[100px] rounded-full object-cover shadow-lg"
                alt={chatUser?.name}
              />
              {chatUser?.online && (
                <div className="absolute bottom-1 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-wide mt-4">{chatUser?.name || "User"}</h2>
            {chatUser?.email && (
              <p className="text-[13px] text-muted-foreground mt-1">@{chatUser.email.split("@")[0]}</p>
            )}
            {chatUser?.status && (
              <p className="text-[13px] text-muted-foreground mt-1 px-8 text-center italic">"{chatUser.status}"</p>
            )}
          </>
        )}
      </div>

      {/* Media shortcut card */}
      <div className="w-full px-5 mt-6 mb-4">
        <button
          onClick={() => navigate(`/chat/${userId}/media`)}
          className="w-full bg-card rounded-[22px] px-5 py-4 shadow-sm border border-border/20 flex items-center justify-between hover:bg-secondary/30 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <ImageIcon size={18} className="text-blue-500" strokeWidth={1.8} />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-semibold text-foreground leading-tight">Media & Files</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">View all shared media</p>
            </div>
          </div>
          <ChevronRight size={17} className="text-muted-foreground/60" />
        </button>
      </div>

      {/* Settings */}
      <div className="w-full px-5 mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Settings</p>
        <div className="flex flex-col rounded-[20px] bg-secondary/30 px-4 py-2 border border-border/40">

          {/* Mute */}
          <button onClick={handleMuteToggle}
            className="w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99] border-b border-border/40">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm border border-border/20">
              {isMuted
                ? <BellOff size={18} strokeWidth={1.8} className="text-foreground" />
                : <Bell    size={18} strokeWidth={1.8} className="text-foreground" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-foreground leading-tight">Notifications</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{isMuted ? "Muted" : "On"}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground/60 shrink-0" />
          </button>

          {/* Lock toggle */}
          <button onClick={handleLockToggle}
            className="w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99]">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm border border-border/20">
              {isLocked
                ? <Lock    size={18} strokeWidth={1.8} className="text-primary"    />
                : <LockOpen size={18} strokeWidth={1.8} className="text-foreground" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-foreground leading-tight">Lock Chat</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{isLocked ? "Password protected" : "Unlocked"}</p>
            </div>
            {/* Toggle switch */}
            <div className={`w-[42px] h-[26px] rounded-full flex items-center px-[3px] transition-colors duration-300 ${isLocked ? "bg-green-500" : "bg-muted-foreground/30 dark:bg-black/40"}`}>
              <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-transform duration-300 ${isLocked ? "translate-x-[16px]" : "translate-x-0"}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Privacy / Danger */}
      <div className="w-full px-5 mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Privacy</p>
        <div className="flex flex-col rounded-[20px] bg-secondary/30 px-4 py-2 border border-border/40">
          {[
            { icon: AlertTriangle, label: "Block contact", sub: "Stop receiving messages",    action: () => setConfirmType("block"), danger: true  },
            { icon: Trash2,        label: "Clear chat",    sub: "Delete all messages for you", action: () => setConfirmType("clear"), danger: true  },
          ].map(({ icon: Icon, label, sub, action, danger }, i, arr) => (
            <button key={label} onClick={action}
              className={`w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99] ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-500/10" : "bg-secondary"}`}>
                <Icon size={18} strokeWidth={1.8} className={danger ? "text-red-500" : "text-foreground"} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-[15px] font-medium leading-tight ${danger ? "text-red-500" : "text-foreground"}`}>{label}</p>
                <p className={`text-[12px] mt-0.5 ${danger ? "text-red-400/70" : "text-muted-foreground"}`}>{sub}</p>
              </div>
              <ChevronRight size={16} className={`${danger ? "text-red-400/60" : "text-muted-foreground/60"} shrink-0`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatUserProfile;