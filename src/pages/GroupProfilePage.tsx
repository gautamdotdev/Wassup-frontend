import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, Edit2, UserPlus, UserMinus, LogOut, Trash2, 
  Shield, Settings, Search, Camera, Loader2, ChevronRight,
  MoreVertical, X, Check, ImageIcon, Bell
} from "lucide-react";
import { User, Chat } from "../types/chat";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/chat/ConfirmModal";

const GroupProfilePage = () => {
  const { userId: chatId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [connectionIds, setConnectionIds] = useState<string[]>([]);
  const [pendingRequestIds, setPendingRequestIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [confirmType, setConfirmType] = useState<"leave" | "delete" | null>(null);
  const fetchedIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      try {
        setIsLoading(true);
        const { data: chats } = await api.get('/chats');
        const chatData = chats.find((c: any) => c._id === chatId);
        if (!chatData) {
          toast.error("Group not found");
          navigate('/messengers');
          return;
        }
        setChat(chatData);
        setName(chatData.chatName || '');
        setDescription(chatData.description || '');
        setAvatar(chatData.avatar || '');

        const { data: conns } = await api.get('/connections');
        const accepted = conns.filter((c: any) => c.status === 'accepted');
        const pending = conns.filter((c: any) => c.status === 'pending' && c.senderId._id === currentUser?._id);
        
        const acceptedUsers = accepted.map((c: any) => c.senderId._id === currentUser?._id ? c.receiverId : c.senderId);
        setConnections(acceptedUsers);
        setConnectionIds(acceptedUsers.map((u: any) => u._id));
        setPendingRequestIds(pending.map((c: any) => (c.receiverId._id || c.receiverId)));

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (chatId && fetchedIdRef.current !== chatId) {
      fetchedIdRef.current = chatId;
      loadData();
    }
  }, [chatId, currentUser, navigate]);

  const isAdmin = chat?.admins.some(a => (typeof a === 'string' ? a : a._id) === currentUser?._id);
  const isCreator = (typeof chat?.createdBy === 'string' ? chat.createdBy : chat?.createdBy?._id) === currentUser?._id;

  const handleUpdate = async () => {
    if (!chat) return;
    try {
      const { data } = await api.put('/chats/group', {
        chatId: chat._id,
        chatName: name,
        description,
        avatar
      });
      setChat(data);
      setIsEditing(false);
      toast.success('Group updated');
    } catch (err) {
      toast.error('Failed to update group');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chat) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { data: updatedChat } = await api.put('/chats/group', { 
        chatId: chat._id, 
        chatName: name, 
        description, 
        avatar: data.url 
      });
      setAvatar(data.url);
      setChat(updatedChat);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chat) return;
    try {
      const { data: updatedChat } = await api.put('/chats/group', { 
        chatId: chat._id, 
        chatName: name, 
        description, 
        avatar: '' 
      });
      setAvatar('');
      setChat(updatedChat);
      toast.success('Avatar removed');
    } catch { toast.error('Failed to remove avatar'); }
  };

  const handeRemoveMember = async (userId: string) => {
    if (!chat) return;
    try {
      const { data } = await api.put('/chats/group/remove', { chatId: chat._id, userId });
      setChat(data);
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!chat) return;
    try {
      const { data } = await api.put('/chats/group/add', { chatId: chat._id, userId });
      setChat(data);
      toast.success('Member added');
      setShowAddMembers(false);
      setSearch('');
    } catch (err) {
      toast.error('Failed to add member');
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    try {
      await api.post('/connections', { userId: targetUserId });
      setPendingRequestIds(prev => [...prev, targetUserId]);
      toast.success('Connection request sent');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send request');
    }
  };

  const handleLeave = async () => {
    if (!chat) return;
    try {
      await api.put('/chats/group/leave', { chatId: chat._id });
      setConfirmType(null);
      navigate('/messengers');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleDelete = async () => {
    if (!chat) return;
    try {
      await api.delete(`/chats/group/${chat._id}`);
      setConfirmType(null);
      navigate('/messengers');
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  const handleUpdateSettings = async (settings: any) => {
    if (!chat) return;
    try {
      const { data } = await api.put('/chats/group/settings', {
        chatId: chat._id,
        ...settings
      });
      setChat(data);
      toast.success('Settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  useEffect(() => {
    if (search.trim() && chat) {
      const delay = setTimeout(async () => {
        const { data } = await api.get(`/users/search?q=${search}`);
        setSearchResult(data.filter((u: User) => !chat.participants.find(p => p._id === u._id)));
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setSearchResult([]);
    }
  }, [search, chat]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background max-w-[430px] mx-auto flex flex-col pb-10 overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="px-5 py-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-lg z-50">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors shadow-sm">
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <p className="font-bold uppercase tracking-widest text-[11px] text-muted-foreground">Group Info</p>
        <div className="w-9 h-9" /> {/* Spacer */}
      </div>

      <div className="flex-1">
        {/* Hero Section */}
        <div className="flex flex-col items-center mt-2 w-full px-5">
          <div className="relative">
            <div 
              onClick={() => isAdmin && fileInputRef.current?.click()}
              className={`w-[110px] h-[110px] rounded-[35px] bg-secondary flex items-center justify-center border border-border/40 overflow-hidden relative shadow-lg transition-all duration-300 ${isAdmin ? 'hover:scale-105 active:scale-95 cursor-pointer' : ''}`}
            >
              {uploading ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={24} /></div>
              ) : avatar ? (
                <img src={avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                <Camera size={32} className="text-muted-foreground/40" />
              )}
            </div>
            {isAdmin && (
              <button onClick={() => setIsEditing(!isEditing)} className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-4 border-background shadow-lg active:scale-90">
                <Edit2 size={12} strokeWidth={3} />
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="mt-5 w-full flex flex-col items-center">
            {isEditing ? (
              <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-secondary/40 rounded-[20px] px-5 py-3 border border-border/40 focus-within:border-primary/40">
                    <input autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent text-[15px] font-bold outline-none" placeholder="Group Name" />
                  </div>
                  <button onClick={handleUpdate} disabled={!name.trim()} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg active:scale-90 disabled:opacity-40">
                    <Check size={18} strokeWidth={3} />
                  </button>
                </div>
                <div className="flex items-center bg-secondary/40 rounded-[20px] px-5 py-3 border border-border/40 focus-within:border-primary/40">
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-transparent text-[13px] outline-none resize-none h-16" placeholder="Group Description" />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-foreground tracking-wide">{chat?.chatName}</h2>
                <p className="text-[13px] text-muted-foreground mt-1 px-8 text-center">{chat?.description || "Group Chat"}</p>
              </>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-6 bg-secondary/20 px-6 py-2.5 rounded-2xl border border-border/20 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-foreground">{chat?.participants.length}</span>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Members</span>
            </div>
            <div className="w-px h-4 bg-border/40" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-primary">{chat?.admins.length}</span>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Admins</span>
            </div>
          </div>
        </div>

        {/* Media shortcut card removed per user request */}

        {/* Settings Section */}
        <div className="w-full px-5 mt-8 mb-4">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Settings</p>
          <div className="flex flex-col rounded-[20px] bg-secondary/30 px-4 py-2 border border-border/40">
            {/* Mute (Mock as not implemented in group yet but for design consistency) */}
            <button className="w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99] border-b border-border/40">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm border border-border/20">
                <Bell size={18} strokeWidth={1.8} className="text-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-medium text-foreground leading-tight">Notifications</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">On</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/60 shrink-0" />
            </button>

            {/* Group Permissions (Admins only) */}
            {isAdmin && (
              <button onClick={() => setShowSettings(!showSettings)} className={`w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99]`}>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm border border-border/20">
                  <Settings size={18} strokeWidth={1.8} className="text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-medium text-foreground leading-tight">Group Permissions</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Admin controls</p>
                </div>
                <ChevronRight size={16} className={`text-muted-foreground/60 shrink-0 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
          {/* Settings detail panel */}
          {showSettings && (
            <div className="mt-3 px-4 py-4 rounded-[20px] bg-secondary/10 border border-border/20 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest px-1">Who can send messages?</p>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateSettings({ canSendMessage: 'all', canAddMembers: chat?.groupSettings.canAddMembers })} 
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${chat?.groupSettings.canSendMessage === 'all' ? 'bg-primary text-white' : 'bg-background text-muted-foreground'}`}>Everyone</button>
                  <button onClick={() => handleUpdateSettings({ canSendMessage: 'admins', canAddMembers: chat?.groupSettings.canAddMembers })} 
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${chat?.groupSettings.canSendMessage === 'admins' ? 'bg-primary text-white' : 'bg-background text-muted-foreground'}`}>Only Admins</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="w-full px-5 mb-4">
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Members</p>
            {((isAdmin && chat?.groupSettings.canAddMembers === 'all') || isCreator) && (
              <button onClick={() => setShowAddMembers(true)} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase active:scale-95 transition-all">
                <UserPlus size={12} /> Add
              </button>
            )}
          </div>
          <div className="flex flex-col rounded-[20px] bg-secondary/30 border border-border/40 overflow-hidden">
            {chat?.participants.map((p, i) => {
              const pIsAdmin = chat.admins.some(a => (typeof a === 'string' ? a : a?._id) === p._id);
              const pIsCreator = (typeof chat.createdBy === 'string' ? chat.createdBy : chat.createdBy?._id) === p._id;
              const isMe = p._id === currentUser?._id;
              return (
                <div key={p._id} className={`flex items-center gap-3.5 px-4 py-3 hover:bg-secondary/40 transition-all ${i < chat.participants.length - 1 ? 'border-b border-border/10' : ''}`}>
                  <div className="relative shrink-0">
                    <img src={p.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full object-cover shadow-sm border border-border/10" alt="" />
                    {p.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[14px] font-bold truncate text-foreground">{p.name}</p>
                      {pIsCreator && <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm font-black uppercase">Creator</span>}
                      {pIsAdmin && !pIsCreator && <Shield size={10} className="text-primary" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{isMe ? "You" : pIsAdmin ? "Admin" : "Member"}</p>
                  </div>
                  {isAdmin && !isMe && !pIsCreator && (
                    <button onClick={() => handeRemoveMember(p._id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-red-500 transition-colors">
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy / Danger Section */}
        <div className="w-full px-5 mb-10">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Privacy</p>
          <div className="flex flex-col rounded-[20px] bg-red-500/5 px-4 py-2 border border-red-500/10">
            <button onClick={() => setConfirmType("leave")} className={`w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99] ${isCreator ? "border-b border-red-500/10" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 shadow-sm border border-red-500/20">
                <LogOut size={18} strokeWidth={1.8} className="text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-medium text-red-500 leading-tight">Leave Group</p>
                <p className="text-[12px] text-red-400/70 mt-0.5">Exit this conversation</p>
              </div>
              <ChevronRight size={16} className="text-red-400/60 shrink-0" />
            </button>
            {isCreator && (
              <button onClick={() => setConfirmType("delete")} className="w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99]">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 shadow-sm border border-red-500/20">
                  <Trash2 size={18} strokeWidth={1.8} className="text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-medium text-red-500 leading-tight">Delete Group</p>
                  <p className="text-[12px] text-red-400/70 mt-0.5">Remove for everyone</p>
                </div>
                <ChevronRight size={16} className="text-red-400/60 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmType === "leave"} 
        title="Leave Group?" 
        message="Are you sure you want to leave this group? You will no longer receive messages." 
        confirmLabel="Leave" 
        danger 
        onConfirm={handleLeave} 
        onCancel={() => setConfirmType(null)} 
      />

      <ConfirmModal 
        isOpen={confirmType === "delete"} 
        title="Delete Group?" 
        message="This will delete the group for everyone. This action cannot be undone." 
        confirmLabel="Delete" 
        danger 
        onConfirm={handleDelete} 
        onCancel={() => setConfirmType(null)} 
      />

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col p-safe animate-in slide-in-from-right duration-300">
          <div className="px-5 py-6 flex items-center gap-4 border-b border-border/30">
            <button onClick={() => setShowAddMembers(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2 className="text-xl font-bold tracking-tight">Add Members</h2>
          </div>
          <div className="p-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..." className="w-full pl-11 pr-4 py-3 bg-secondary/40 rounded-[18px] focus:outline-none text-[15px]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 scrollbar-none">
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">Suggested</p>
              <div className="flex flex-col rounded-[20px] bg-secondary/10 border border-border/20 overflow-hidden">
                {(search ? searchResult : connections).filter(u => !chat?.participants.find(p => p._id === u._id)).map((u, i, arr) => (
                  <div key={u._id} className={`flex items-center justify-between p-4 ${i < arr.length - 1 ? 'border-b border-border/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full" alt="" />
                      <p className="text-[14px] font-bold">{u.name}</p>
                    </div>
                    <button onClick={() => handleAddMember(u._id)} className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full active:scale-90 transition-transform">
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupProfilePage;
