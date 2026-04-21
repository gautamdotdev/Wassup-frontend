import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Camera, ChevronRight, X } from 'lucide-react';
import api from '../lib/api';
import { User } from '../types/chat';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';
import MemberSelection from '../components/chat/MemberSelection';

const NewGroupPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [connections, setConnections] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const { data } = await api.get('/connections');
        const users = data
          .filter((c: any) => c.status === 'accepted')
          .map((c: any) => {
            const other = c.senderId._id === currentUser?._id ? c.receiverId : c.senderId;
            return other;
          });
        setConnections(users);
      } catch (error) {
        toast.error('Failed to load connections');
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, [currentUser]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatar(data.url);
      toast.success('Avatar uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleUser = (user: User) => {
    setSelectedUsers(prev => 
      prev.find(u => u._id === user._id) 
        ? prev.filter(u => u._id !== user._id) 
        : [...prev, user]
    );
  };

  const handleNext = () => {
    if (!name.trim()) return toast.error('Group name is required');
    setStep(2);
  };

  const handleCreate = async () => {
    if (selectedUsers.length < 2) return toast.error('Select at least 2 members');

    setCreating(true);
    try {
      const { data } = await api.post('/chats/group', {
        name,
        description,
        avatar: avatar || '',
        participants: JSON.stringify(selectedUsers.map(u => u._id))
      });
      toast.success('Group created successfully');
      navigate(`/chat/group/${data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 hover:bg-secondary rounded-full transition-all active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">{step === 1 ? 'New Group' : 'Add Members'}</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Step {step} of 2</p>
          </div>
        </div>
        
        {step === 1 ? (
          <button 
            onClick={handleNext}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button 
            onClick={handleCreate}
            disabled={creating || selectedUsers.length < 2}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all"
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8 custom-scrollbar">
        {step === 1 ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Group Meta Overlay */}
            <div className="flex flex-col items-center space-y-8">
              <div className="relative group">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-[40px] bg-secondary flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary transition-all duration-300 relative overflow-hidden cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin text-primary" size={32} />
                  ) : avatar ? (
                    <>
                      <img src={avatar} className="w-full h-full object-cover" alt="Group avatar" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={32} />
                      </div>
                    </>
                  ) : (
                    <Camera size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                {avatar ? (
                  <button 
                    onClick={clearAvatar}
                    className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-500/30 border-4 border-background active:scale-90 transition-transform z-10"
                  >
                    <X size={20} />
                  </button>
                ) : (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 border-4 border-background pointer-events-none">
                    <PlusIcon size={20} />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </div>
              
              <div className="w-full space-y-6">
                <div className="space-y-1.5 px-1">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Group Name</label>
                  <input 
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="E.g. The Dream Team"
                    className="w-full text-2xl font-bold bg-transparent border-b-2 border-border focus:border-primary outline-none py-3 transition-all placeholder:text-muted-foreground/20"
                  />
                </div>
                <div className="space-y-1.5 px-1">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Description (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What's this group about?"
                    rows={2}
                    className="w-full text-md bg-transparent border-b border-border focus:border-primary outline-none py-3 transition-all placeholder:text-muted-foreground/20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-secondary/30 rounded-3xl p-6 border border-border/20">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Tips</h4>
              <ul className="space-y-2">
                {['Add a catchy name', 'Set a clear description', 'You need at least 2 more people'].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-muted-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <MemberSelection 
            connections={connections}
            selectedUsers={selectedUsers}
            onToggleUser={toggleUser}
            loading={loading}
          />
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default NewGroupPage;
