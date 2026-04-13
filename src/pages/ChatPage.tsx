import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Video, MoreVertical, X } from "lucide-react";
import { FiPlus, FiCamera, FiSend } from "react-icons/fi";
import { PiSticker } from "react-icons/pi";
import { toast } from "sonner";

import { useIsDark } from "@/hooks/useIsDark";
import { Msg } from "@/types/chat";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSocket } from "../lib/socket";

import { Lightbox } from "@/components/chat/Lightbox";
import { SwipeRow } from "@/components/chat/SwipeRow";
import { PendingStrip } from "@/components/chat/PendingStrip";
import { AttachmentPanel } from "@/components/chat/AttachmentPanel";

/* ────────────────────────────────────────────────────────────────────────── */
/*  ChatPage                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const isDark = useIsDark();

  const pill = isDark
    ? { background: "rgba(20,20,20,0.65)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 32px rgba(0,0,0,0.45),0 1px 0 rgba(255,255,255,0.06) inset" }
    : { background: "rgba(255,255,255,0.72)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.10),0 1px 0 rgba(255,255,255,0.9) inset" };
  const blurStyle = { ...pill, backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" };

  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatUser, setChatUser] = useState<any>(null);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const quickCameraRef = useRef<HTMLInputElement>(null);

  const handleQuickCameraPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    Promise.all(
      files.map(
        file => new Promise<string>(resolve => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        })
      )
    ).then(urls => { addPending(urls); });
    e.target.value = "";
  };

  useEffect(() => {
    if (!socket || !currentChat?._id) return;

    const joinRoom = () => {
      socket.emit("join chat", currentChat._id);
    };

    joinRoom(); // Initial join
    socket.on("connect", joinRoom); // Re-join on reconnect
    
    return () => {
      socket.off("connect", joinRoom);
    };
  }, [socket, currentChat?._id]);

  useEffect(() => {
    let active = true;
    const loadChat = async () => {
      try {
        const { data: chatData } = await api.post('/chats', { userId });
        if (!active) return;
        setCurrentChat(chatData);
        const otherUser = chatData.participants.find((p: any) => p._id !== user?._id);
        setChatUser(otherUser);
        
        const { data: msgsData } = await api.get(`/messages/${chatData._id}`);
        if (!active) return;
        const mappedMsgs: Msg[] = msgsData.map((m: any) => {
          const sId = m.senderId?._id || m.senderId;
          return {
            id: m._id,
            senderId: sId === user?._id ? "me" : "other",
            text: m.text,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            status: m.readBy && m.readBy.length > 1 ? "seen" : "delivered",
            ...(m.mediaUrl ? { images: [m.mediaUrl] } : {})
          };
        });
        setMessages(mappedMsgs);
      } catch (err: any) {
        if (err.response?.status === 403) {
          toast.error("You must connect before chatting");
          navigate("/search");
        } else {
          console.error("Failed to load chat", err);
        }
      }
    };
    if (userId) loadChat();
    return () => { active = false; };
  }, [userId, user]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (m: any) => {
      const incomingChatId = m.chatId?._id || m.chatId;
      if (currentChat && incomingChatId === currentChat._id) {
        // Prevent duplicate messages if sender also receives the event
        setMessages(prev => {
          if (prev.find(existing => existing.id === m._id)) return prev;
          const msg: Msg = {
            id: m._id,
            senderId: (m.senderId?._id || m.senderId) === user?._id ? "me" : "other",
            text: m.text,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            status: "delivered",
            ...(m.mediaUrl ? { images: [m.mediaUrl] } : {})
          };
          return [...prev, msg];
        });
      }
    };

    socket.on("message recieved", handleNewMessage);
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    return () => {
      socket.off("message recieved", handleNewMessage);
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [socket, currentChat, user]);

  /* index of last "seen" outgoing message */
  const lastSeenIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--)
      if (messages[i].senderId === "me" && messages[i].status === "seen") return i;
    return -1;
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, pendingImages]);

  const addPending = (urls: string[]) => setPendingImages(prev => [...prev, ...urls]);
  const removePending = (i: number) => setPendingImages(prev => prev.filter((_, idx) => idx !== i));
  const openLightbox = (images: string[], index: number) => setLightbox({ images, index });

  const sendMessage = async () => {
    if (!input.trim() && pendingImages.length === 0) return;
    if (!currentChat) return;
    const content = input.trim();
    setInput("");
    
    // Optimistic UI
    const tempId = `m${Date.now()}`;
    const ts = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const newMsg: Msg = {
      id: tempId,
      senderId: "me",
      text: content || undefined,
      timestamp: ts,
      status: "sent",
      ...(pendingImages.length > 0 ? { images: [...pendingImages] } : {}),
      ...(replyingTo ? { replyTo: { id: replyingTo.id, senderId: replyingTo.senderId, text: replyingTo.text || "Voice message" } } : {}),
    };
    setMessages(prev => [...prev, newMsg]);
    setPendingImages([]);
    setReplyingTo(null);

    // Actual API Call
    try {
      const res = await api.post("/messages", { chatId: currentChat._id, content });
      if (socket) {
        socket.emit("new message", res.data);
      }
      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m, id: res.data._id, status: "delivered"
      } : m));
    } catch (err) {
      console.error("Failed to send msg", err);
    }
  };

  const hasContent = input.trim() || pendingImages.length > 0;

  return (
    <>
      <input ref={quickCameraRef} type="file" multiple accept="image/*,video/*" capture="environment" className="hidden" onChange={handleQuickCameraPick} />

      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}

      <div className="min-h-screen bg-background flex flex-col max-w-[430px] mx-auto">

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
              {chatUser?.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden leading-tight justify-center mt-0.5">
              <span className="font-semibold text-foreground text-[15px] truncate">{chatUser?.name || "Loading..."}</span>
              <span className="text-[11px] text-muted-foreground truncate opacity-80">{chatUser?.online ? "Active now" : "Offline"}</span>
            </div>
          </button>
          <div className="flex items-center gap-1 text-muted-foreground">
            <button className="hover:text-foreground transition-colors p-1.5"><Video size={22} strokeWidth={1.5} /></button>
            <button className="hover:text-foreground transition-colors p-1.5"><Phone size={20} strokeWidth={1.5} /></button>
            <button className="hover:text-foreground transition-colors p-1.5"><MoreVertical size={20} strokeWidth={1.5} /></button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
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
                <div className={isLastInGroup ? "mb-4" : "mb-1"}>
                  <SwipeRow
                    msg={msg} isMe={isMe} isLast={isLastInGroup} isLastMyMsg={isLastMyMsg}
                    onReply={setReplyingTo} chatUser={chatUser}
                    playingVoice={playingVoice} setPlayingVoice={setPlayingVoice}
                    onImageTap={openLightbox}
                  />
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-[#f0f0f0] dark:bg-[#2a2a2a] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-1.5">
                {[0, 180, 360].map(delay => (
                  <div key={delay} className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Sticky bottom ── */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent pb-6 pt-4 px-4">

          {/* Reply bar */}
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
                <button
                  onClick={() => setReplyingTo(null)}
                  className="w-7 h-7 rounded-full bg-secondary hover:opacity-80 flex items-center justify-center shrink-0 transition-opacity"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* Pending preview strip */}
          {pendingImages.length > 0 && (
            <PendingStrip images={pendingImages} onRemove={removePending} />
          )}

          {/* Attachment panel OR normal input explicitly toggled */}
          {showAttachPanel ? (
            <div className="rounded-[32px] pt-5 pb-0" style={{ ...blurStyle, animation: "apSlide 0.25s cubic-bezier(0.34,1.2,0.64,1) both" }}>
              <style>{`@keyframes apSlide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>
              <AttachmentPanel onClose={() => setShowAttachPanel(false)} onAddImages={addPending} />
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ animation: "apFade 0.2s ease both" }}>
              <style>{`@keyframes apFade { from{opacity:0} to{opacity:1} }`}</style>
              <button
                onClick={() => setShowAttachPanel(true)}
                className={`text-foreground w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform`}
                style={blurStyle}
              >
                <FiPlus size={24} />
              </button>
              <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5" style={blurStyle}>
                {/* <button className="text-muted-foreground hover:text-foreground transition-colors -ml-1">
                  <PiSticker size={22} />
                </button> */}
                <input
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    if (socket && currentChat) {
                      socket.emit("typing", currentChat._id);
                      let lastTypingTime = new Date().getTime();
                      const timerLength = 3000;
                      setTimeout(() => {
                        const timeNow = new Date().getTime();
                        if (timeNow - lastTypingTime >= timerLength) {
                          socket.emit("stop typing", currentChat._id);
                        }
                      }, timerLength);
                    }
                  }}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Type here"
                  className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none px-1"
                />
                {hasContent ? (
                  <button onClick={sendMessage} className="text-primary hover:text-primary/80 transition-colors">
                    <FiSend size={20} />
                  </button>
                ) : (
                  <button onClick={() => quickCameraRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors -mr-1">
                    <FiCamera size={20} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;