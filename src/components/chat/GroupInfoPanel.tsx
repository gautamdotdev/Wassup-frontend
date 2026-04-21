import React, { useState, useEffect } from 'react';
import { X, Edit2, UserMinus, UserPlus, LogOut, Trash2, Shield, Settings, Check, Search, Camera, Loader2 } from 'lucide-react';
import { User, Chat } from '../../types/chat';
import api from '../../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth';

interface GroupInfoPanelProps {
  chat: Chat;
  onClose: () => void;
  onUpdate: (updatedChat: Chat) => void;
  onLeave: () => void;
  onDelete: () => void;
}

export const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({ chat, onClose, onUpdate, onLeave, onDelete }) => {
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(chat.chatName || '');
  const [description, setDescription] = useState(chat.description || '');
  const [avatar, setAvatar] = useState(chat.avatar || '');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [connections, setConnections] = useState<User[]>([]); 
  const [connectionIds, setConnectionIds] = useState<string[]>([]);
  const [loadingConn, setLoadingConn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchConn = async () => {
      setLoadingConn(true);
      try {
        const { data } = await api.get('/connections');
        const accepted = data.filter((c: any) => c.status === 'accepted');
        const users = accepted.map((c: any) => c.senderId._id === currentUser?._id ? c.receiverId : c.senderId);
        setConnections(users);
        setConnectionIds(users.map((u: any) => u._id));
      } catch (err) {}
      finally { setLoadingConn(false); }
    };
    fetchConn();
  }, [currentUser]);

  const isAdmin = chat.admins.some(a => (typeof a === 'string' ? a : a._id) === currentUser?._id);
  const isCreator = (typeof chat.createdBy === 'string' ? chat.createdBy : chat.createdBy._id) === currentUser?._id;

  const handleUpdate = async () => {
    try {
      const { data } = await api.put('/chats/group', {
        chatId: chat._id,
        chatName: name,
        description,
        avatar
      });
      onUpdate(data);
      setIsEditing(false);
      toast.success('Group updated');
    } catch (err) {
      toast.error('Failed to update group');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Update immediately in DB
      const { data: updatedChat } = await api.put('/chats/group', { 
        chatId: chat._id, 
        chatName: name, 
        description, 
        avatar: data.url 
      });
      setAvatar(data.url);
      onUpdate(updatedChat);
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
    try {
      const { data: updatedChat } = await api.put('/chats/group', { 
        chatId: chat._id, 
        chatName: name, 
        description, 
        avatar: '' 
      });
      setAvatar('');
      onUpdate(updatedChat);
      toast.success('Avatar removed');
    } catch { toast.error('Failed to remove avatar'); }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const { data } = await api.put('/chats/group/remove', { chatId: chat._id, userId });
      onUpdate(data);
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      const { data } = await api.put('/chats/group/add', { chatId: chat._id, userId });
      onUpdate(data);
      toast.success('Member added');
      setShowAddMembers(false);
      setSearch('');
    } catch (err) {
      toast.error('Failed to add member');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.put('/chats/group/leave', { chatId: chat._id });
      onLeave();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this group for everyone?')) return;
    try {
      await api.delete(`/chats/group/${chat._id}`);
      onDelete();
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  const handleUpdateSettings = async (settings: any) => {
    try {
      const { data } = await api.put('/chats/group/settings', {
        chatId: chat._id,
        ...settings
      });
      onUpdate(data);
      toast.success('Settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  useEffect(() => {
    if (search.trim()) {
      const delay = setTimeout(async () => {
        const { data } = await api.get(`/users/search?q=${search}`);
        setSearchResult(data.filter((u: User) => !chat.participants.find(p => p._id === u._id)));
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setSearchResult([]);
    }
  }, [search, chat.participants]);

  return (
    <div className="fixed inset-0 z-[150] flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative w-full max-w-[400px] bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
           style={{ animation: 'slideInRight 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)' }}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
          <h3 className="text-lg font-bold">Group Info</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Group Profile */}
          <div className="px-6 py-8 flex flex-col items-center text-center space-y-4 border-b border-border/30">
            <div className="relative group/avatar">
              <div 
                onClick={() => isAdmin && fileInputRef.current?.click()}
                className={`w-28 h-28 rounded-[40px] bg-secondary flex items-center justify-center border-2 border-border overflow-hidden relative ${isAdmin ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
              >
                {uploading ? (
                  <Loader2 className="animate-spin text-primary" size={28} />
                ) : avatar ? (
                  <>
                    <img src={avatar} className="w-full h-full object-cover" alt="" />
                    {isAdmin && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <Camera className="text-white" size={28} />
                      </div>
                    )}
                  </>
                ) : (
                  <Camera size={32} className="text-muted-foreground" />
                )}
              </div>
              
              {isAdmin && avatar && (
                <button 
                  onClick={removeAvatar}
                  className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-background shadow-lg active:scale-90 transition-transform z-10"
                >
                  <X size={14} />
                </button>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
            </div>
            
            {isEditing ? (
              <div className="w-full space-y-3">
                <input 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-center text-xl font-bold bg-secondary/50 rounded-xl px-4 py-2 border border-primary/20"
                />
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-center text-sm bg-secondary/50 rounded-xl px-4 py-2 border border-primary/20 resize-none"
                  placeholder="Group Description"
                />
                <div className="flex gap-2 justify-center">
                  <button onClick={handleUpdate} className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold">Save</button>
                  <button onClick={() => setIsEditing(false)} className="bg-secondary text-foreground px-4 py-2 rounded-full text-xs font-bold">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold">{chat.chatName}</h2>
                  {isAdmin && (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground max-w-[280px]">{chat.description || 'No description provided'}</p>
              </div>
            )}

            <div className="flex items-center gap-6 pt-2">
              <div className="text-center">
                <p className="text-lg font-bold">{chat.participants.length}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Members</p>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{chat.admins.length}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Admins</p>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Members</h4>
              {(isAdmin && chat.groupSettings.canAddMembers === 'all') || isCreator ? (
                 <button 
                  onClick={() => setShowAddMembers(true)}
                  className="p-1 px-3 text-[11px] font-bold bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                >
                  Add Member
                </button>
              ) : null}
            </div>

            <div className="space-y-4">
              {chat.participants.map(p => {
                const pIsAdmin = chat.admins.some(a => (typeof a === 'string' ? a : a._id) === p._id);
                const pIsCreator = (typeof chat.createdBy === 'string' ? chat.createdBy : chat.createdBy._id) === p._id;
                const isContact = connectionIds.includes(p._id);
                const isMe = p._id === currentUser?._id;

                return (
                  <div key={p._id} className="flex items-center gap-3 group">
                    <img src={p.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full border border-border" alt="" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold">{p.name}</p>
                        {pIsCreator && <span className="text-[9px] bg-primary/20 text-primary px-1.5 rounded-sm font-bold uppercase">Creator</span>}
                        {pIsAdmin && !pIsCreator && <Shield size={12} className="text-primary" />}
                        {!isMe && (
                          <span className={`text-[8px] px-1 rounded-full font-bold uppercase border ${isContact ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted-foreground/10 text-muted-foreground border-border/50'}`}>
                            {isContact ? 'Connected' : 'Not Connected'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{p.online ? 'Online' : 'Offline'}</p>
                    </div>
                    {isAdmin && p._id !== currentUser?._id && !pIsCreator && (
                      <button 
                        onClick={() => handleRemoveMember(p._id)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-6 border-t border-border/30 space-y-3">
             {isCreator && (
              <>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-secondary/40 hover:bg-secondary/60 transition-colors text-sm font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <Settings size={18} className="text-muted-foreground" />
                    <span>Group Settings</span>
                  </div>
                  <Edit2 size={14} className="text-muted-foreground" />
                </button>

                {showSettings && (
                  <div className="bg-secondary/20 rounded-2xl p-4 space-y-4 border border-border/40 animate-apFade">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Who can send messages</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateSettings({ canSendMessage: 'all', canAddMembers: chat.groupSettings.canAddMembers })}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${chat.groupSettings.canSendMessage === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'}`}
                        >
                          All Members
                        </button>
                        <button 
                          onClick={() => handleUpdateSettings({ canSendMessage: 'admins', canAddMembers: chat.groupSettings.canAddMembers })}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${chat.groupSettings.canSendMessage === 'admins' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'}`}
                        >
                          Admins Only
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Who can add members</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateSettings({ canSendMessage: chat.groupSettings.canSendMessage, canAddMembers: 'all' })}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${chat.groupSettings.canAddMembers === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'}`}
                        >
                          All Members
                        </button>
                        <button 
                          onClick={() => handleUpdateSettings({ canSendMessage: chat.groupSettings.canSendMessage, canAddMembers: 'admins' })}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${chat.groupSettings.canAddMembers === 'admins' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'}`}
                        >
                          Admins Only
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {!isCreator && (
              <button 
                onClick={handleLeave}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors text-sm font-bold"
              >
                <LogOut size={18} />
                <span>Leave Group</span>
              </button>
            )}

            {isCreator && (
              <button 
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors text-sm font-bold"
              >
                <Trash2 size={18} />
                <span>Delete Group</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Members Slide-over */}
      {showAddMembers && (
        <div className="absolute inset-0 z-[160] bg-background flex flex-col"
             style={{ animation: 'slideInRight 0.2s ease-out' }}>
          <div className="px-6 py-5 border-b border-border/50 flex items-center gap-4 bg-secondary/20">
            <button onClick={() => setShowAddMembers(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
              <X size={20} />
            </button>
            <h4 className="text-lg font-bold">Add Members</h4>
          </div>
          <div className="px-6 py-4 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users to add..."
                className="w-full pl-12 pr-4 py-3 bg-secondary/50 border border-border/50 rounded-full focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-4">
            {!search && (
              <div className="space-y-4">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Suggested Connections</h5>
                {connections.filter(u => !chat.participants.find(p => p._id === u._id)).map(u => (
                   <div key={u._id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full border border-border" alt="" />
                      <div>
                        <p className="text-sm font-semibold">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddMember(u._id)}
                      className="p-2 bg-primary text-white rounded-full shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))}
                {connections.filter(u => !chat.participants.find(p => p._id === u._id)).length === 0 && (
                  <p className="text-center py-4 text-xs text-muted-foreground">All connections are already in the group</p>
                )}
              </div>
            )}

            {search && searchResult.map(u => {
              const isContact = connectionIds.includes(u._id);
              return (
                <div key={u._id} className="flex items-center justify-between p-3 rounded-[24px] hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full border border-border" alt="" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{u.name}</p>
                        {isContact && <span className="text-[8px] px-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded font-bold uppercase">Contact</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddMember(u._id)}
                    className="p-2 bg-primary text-white rounded-full shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              );
            })}
            {search && searchResult.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">No results found</p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes apFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
