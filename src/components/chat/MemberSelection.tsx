import React, { useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import { User } from '../../types/chat';

interface MemberSelectionProps {
  connections: User[];
  selectedUsers: User[];
  onToggleUser: (user: User) => void;
  loading: boolean;
}

const MemberSelection: React.FC<MemberSelectionProps> = ({ 
  connections, 
  selectedUsers, 
  onToggleUser,
  loading 
}) => {
  const [search, setSearch] = useState('');

  const filteredConnections = connections.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between px-1">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Select members</label>
        <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{selectedUsers.length} selected</span>
      </div>

      {/* Selected Chips */}
      {selectedUsers.length > 0 && (
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar animate-in slide-in-from-left-4 duration-300">
          {selectedUsers.map(u => (
            <div key={u._id} className="flex flex-col items-center gap-1 shrink-0 relative">
              <div className="relative">
                <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-14 h-14 rounded-2xl object-cover border border-border" alt="" />
                <button 
                  onClick={() => onToggleUser(u)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground shadow-sm hover:bg-secondary transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
              <span className="text-[10px] font-bold truncate w-14 text-center">{u.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your contacts..."
          className="w-full pl-12 pr-4 py-3.5 bg-secondary/40 rounded-2xl border border-border/10 focus:border-primary/30 outline-none transition-all text-sm font-medium"
        />
      </div>

      {/* Contacts List */}
      <div className="space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary rounded w-1/3" />
                <div className="h-2 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filteredConnections.length > 0 ? (
          filteredConnections.map(u => {
            const isSelected = selectedUsers.find(su => su._id === u._id);
            return (
              <div 
                key={u._id}
                onClick={() => onToggleUser(u)}
                className={`flex items-center gap-4 p-3 rounded-[24px] cursor-pointer transition-all active:scale-[0.98]
                  ${isSelected ? 'bg-primary/5' : 'hover:bg-secondary/40'}`}
              >
                <div className="relative">
                  <img src={u.avatar || 'https://i.pravatar.cc/150'} className="w-12 h-12 rounded-2xl object-cover border border-border/20 shadow-sm" alt="" />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-lg flex items-center justify-center text-white border-2 border-background animate-in zoom-in-50 duration-200">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}>{u.name}</p>
                  <p className="text-[12px] text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <Search size={28} />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">No contacts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberSelection;
