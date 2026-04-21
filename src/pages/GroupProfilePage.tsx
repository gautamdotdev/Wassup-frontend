import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Edit2, UserPlus, UserMinus, LogOut, Trash2, 
  Shield, Settings, Search, Camera, Loader2, ChevronRight,
  MoreVertical, X, Check
} from "lucide-react";
import { User, Chat } from "../types/chat";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

const GroupProfilePage = () => {
  const { userId: chatId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
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
    if (chatId) loadData();
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
    if (!chat || !window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.put('/chats/group/leave', { chatId: chat._id });
      navigate('/messengers');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleDelete = async () => {
    if (!chat || !window.confirm('Are you sure you want to delete this group for everyone?')) return;
    try {
      await api.delete(`/chats/group/${chat._id}`);
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
    <div className="min-h-screen bg-background max-w-[430px] mx-auto flex flex-col pb-10">
      <div className="px-5 py-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-lg z-50">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors shadow-sm">
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <p className="font-bold uppercase tracking-widest text-[11px] text-muted-foreground">Group Profile</p>
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors shadow-sm">
          <MoreVertical size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <div className="relative">
            <div 
              onClick={() => isAdmin && fileInputRef.current?.click()}
              className={`w-32 h-32 rounded-[40px] bg-secondary flex items-center justify-center border-2 border-border/40 overflow-hidden relative shadow-xl transition-all duration-300 ${isAdmin ? 'hover:scale-105 active:scale-95 cursor-pointer hover:border-primary/40' : ''}`}
            >
              {uploading ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>
              ) : avatar ? (
                <>
                  <img src={avatar} className="w-full h-full object-cover" alt="" />
                  {isAdmin && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={32} />
                    </div>
                  )}
                </>
              ) : (
                <Camera size={40} className="text-muted-foreground/40" />
              )}
            </div>
            {isAdmin && avatar && (
              <button onClick={removeAvatar} className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white border-4 border-background shadow-lg active:scale-90 transition-transform">
                <X size={14} strokeWidth={3} />
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="mt-6 flex flex-col items-center gap-1 w-full max-w-[320px] mx-auto">
            {isEditing ? (
              <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1 text-left px-1">
                  <p className="text-[10px] font-black uppercase text-primary/70 tracking-widest">Group Name</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-secondary/40 rounded-[22px] px-5 py-3.5 border border-border/40 focus-within:border-primary/40 transition-colors">
                      <input 
                        autoFocus
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:text-muted-foreground/40" 
                        placeholder="Enter group name..."
                      />
                    </div>
                    <button 
                      onClick={handleUpdate}
                      disabled={!name.trim()}
                      className="w-[50px] h-[50px] rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg active:scale-90 transition-all disabled:opacity-40"
                    >
                      <Check size={22} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-left px-1">
                  <p className="text-[10px] font-black uppercase text-primary/70 tracking-widest">Description</p>
                  <div className="flex items-center bg-secondary/40 rounded-[22px] px-5 py-3.5 border border-border/40 focus-within:border-primary/40 transition-colors">
                    <textarea 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/40 resize-none h-20" 
                      placeholder="What's this group about?"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel Editing
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{chat?.chatName}</h1>
                  {isAdmin && (
                    <button onClick={() => setIsEditing(true)} className="p-2 text-muted-foreground hover:text-primary transition-all bg-secondary/50 rounded-full hover:scale-110 active:scale-95">
                      <Pencil size={15} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground max-w-[90%] leading-relaxed">{chat?.description || 'No description set'}</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-8 mt-8 bg-secondary/20 px-8 py-3 rounded-[24px] border border-border/20 shadow-sm">
            <div className="flex flex-col">
              <span className="text-xl font-black">{chat?.participants.length}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Members</span>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="flex flex-col">
              <span className="text-xl font-black text-primary">{chat?.admins.length}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Admins</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Members</h3>
            {((isAdmin && chat?.groupSettings.canAddMembers === 'all') || isCreator) && (
              <button onClick={() => setShowAddMembers(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase">
                <UserPlus size={12} /> Add People
              </button>
            )}
          </div>

          <div className="space-y-2">
            {chat?.participants.map(p => {
              const pIsAdmin = chat.admins.some(a => (typeof a === 'string' ? a : a?._id) === p._id);
              const pIsCreator = (typeof chat.createdBy === 'string' ? chat.createdBy : chat.createdBy?._id) === p._id;
              const isContact = connectionIds.includes(p._id);
              const isPending = pendingRequestIds.includes(p._id);
              const isMe = p._id === currentUser?._id;

              return (
                <div key={p._id} className="flex items-center gap-3 p-3 rounded-[28px] hover:bg-secondary/20 transition-all group">
                  <div className="relative shrink-0">
                    <img src={p.avatar || 'https://i.pravatar.cc/150'} className="w-11 h-11 rounded-full object-cover" alt="" />
                    {p.online && <div className="absolute bottom-0 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold truncate">{p.name}</p>
                      {pIsCreator && <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm font-black uppercase">Creator</span>}
                      {pIsAdmin && !pIsCreator && <Shield size={10} className="text-primary" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isMe ? <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">You</span> : (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${isContact ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted/10 text-muted-foreground'}`}>
                          {isContact ? 'Connected' : 'Not Connected'}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isMe && !isContact && (
                    <button onClick={() => !isPending && handleSendRequest(p._id)} disabled={isPending} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase ${isPending ? 'bg-secondary text-muted-foreground' : 'bg-primary text-white'}`}>
                      {isPending ? 'Pending' : 'Connect'}
                    </button>
                  )}
                  {isAdmin && !isMe && !pIsCreator && (
                    <button onClick={() => handeRemoveMember(p._id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500">
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">Management</p>
          <div className="bg-secondary/20 rounded-[32px] overflow-hidden border border-border/20">
            {isCreator && (
              <>
                <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center justify-between p-5 hover:bg-secondary/40 transition-colors uppercase">
                  <div className="flex items-center gap-4">
                    <Settings size={20} className="text-primary" />
                    <span className="text-sm font-bold">Permissions</span>
                  </div>
                  <ChevronRight size={18} className={`transition-transform ${showSettings ? 'rotate-90' : ''}`} />
                </button>
                {showSettings && (
                  <div className="px-5 pb-6 space-y-5">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-primary">Messages</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateSettings({ canSendMessage: 'all', canAddMembers: chat?.groupSettings.canAddMembers })} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase ${chat?.groupSettings.canSendMessage === 'all' ? 'bg-primary text-white' : 'bg-background text-muted-foreground'}`}>Everyone</button>
                        <button onClick={() => handleUpdateSettings({ canSendMessage: 'admins', canAddMembers: chat?.groupSettings.canAddMembers })} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase ${chat?.groupSettings.canSendMessage === 'admins' ? 'bg-primary text-white' : 'bg-background text-muted-foreground'}`}>Admins</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {!isCreator ? (
              <button onClick={handleLeave} className="w-full flex items-center gap-4 p-5 hover:bg-red-500/10 text-red-500 transition-colors uppercase">
                <LogOut size={20} />
                <span className="text-sm font-black">Leave Group</span>
              </button>
            ) : (
              <button onClick={handleDelete} className="w-full flex items-center gap-4 p-5 hover:bg-red-500/10 text-red-500 transition-colors uppercase">
                <Trash2 size={20} />
                <span className="text-sm font-black">Disband Group</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showAddMembers && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col p-safe animate-in slide-in-from-right">
          <div className="px-5 py-6 flex items-center gap-4 border-b border-border/30">
            <button onClick={() => setShowAddMembers(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <h2 className="text-xl font-black italic">Add People</h2>
          </div>
          <div className="p-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..." className="w-full pl-11 pr-4 py-3.5 bg-secondary/40 rounded-[22px] focus:outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5">
            {!search ? (
              <div className="space-y-6">
                <p className="text-[11px] font-black uppercase text-muted-foreground">Connections</p>
                <div className="space-y-3">
                  {connections.filter(u => !chat?.participants.find(p => p._id === u._id)).map(u => (
                    <div key={u._id} className="flex items-center justify-between p-4 rounded-[32px] bg-secondary/20">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full" alt="" />
                        <p className="text-sm font-bold">{u.name}</p>
                      </div>
                      <button onClick={() => handleAddMember(u._id)} className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-full">
                        <UserPlus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResult.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-4 rounded-[32px] bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full" alt="" />
                      <p className="text-sm font-bold">{u.name}</p>
                    </div>
                    <button onClick={() => handleAddMember(u._id)} className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-full">
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .p-safe { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
        .animate-typing-bounce {
          animation: typing-bounce 0.6s infinite alternate ease-in-out;
        }
        @keyframes typing-bounce {
          from { transform: translateY(0); opacity: 0.4; }
          to { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const Pencil = ({ size, className, strokeWidth }: { size: number; className?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || "2"} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    <path d="m15 5 4 4"/>
  </svg>
);

export default GroupProfilePage;
