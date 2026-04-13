import { useState, useEffect } from "react";
import { Search, X, MailPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

const SearchPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["users", debouncedQuery],
    queryFn: async () => {
      const res = await api.get(`/users?search=${debouncedQuery}`);
      return res.data;
    },
    enabled: !!debouncedQuery
  });

  const { data: allUsers = [], isLoading: loadingAll } = useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const res = await api.get("/users");
      // Filter out current user
      return res.data.filter((u: any) => u._id !== currentUser?._id);
    },
    enabled: !!currentUser
  });

  const { data: connections = [], isLoading: loadingConnections } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const res = await api.get("/connections");
      return res.data;
    }
  });

  const sendRequestMutation = useMutation({
    mutationFn: (receiverId: string) => api.post("/connections", { receiverId }),
    onSuccess: () => {
      toast.success("Connection request sent!");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to send request");
    }
  });

  const displayedUsers = debouncedQuery ? searchResults.filter((u: any) => u._id !== currentUser?._id) : allUsers;
  const loading = (debouncedQuery ? isLoading : loadingAll) || loadingConnections;

  const getConnectStatus = (targetUserId: string) => {
    const conn = connections.find((c: any) => 
      (c.senderId._id === currentUser?._id && c.receiverId._id === targetUserId) ||
      (c.senderId._id === targetUserId && c.receiverId._id === currentUser?._id)
    );
    if (!conn) return "none";
    return conn.status;
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-[430px] mx-auto">

      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">New Chat</h1>
      </div>

      {/* Search input */}
      <div className="px-5 mt-3">
        <div className="flex items-center gap-2.5 bg-secondary rounded-full px-4 py-3">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={15} className="text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mt-5 border-t border-border" />

      {/* New Chat Action / Empty State */}
      <div className="mt-4">
        {loading && (
          <div className="px-5 py-12 text-center flex flex-col items-center gap-2">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Searching...</p>
          </div>
        )}

        {!loading && displayedUsers.length === 0 && (
          <div className="px-5 py-12 text-center flex flex-col items-center gap-2">
            <Search size={32} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No users found</p>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              We couldn't find anyone matching that name or email address.
            </p>
          </div>
        )}

        {/* Users list */}
        {!loading && displayedUsers.length > 0 && (
          <div className="mb-6">
            {/* Connected Section */}
            {displayedUsers.some(u => getConnectStatus(u._id) === "accepted") && (
              <div className="mt-4">
                <div className="px-5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-70" />
                    Connections
                  </span>
                </div>
                <div className="flex flex-col">
                  {displayedUsers
                    .filter(u => getConnectStatus(u._id) === "accepted")
                    .map((user: any) => renderUserRow(user))}
                </div>
              </div>
            )}

            {/* Discover Section */}
            {displayedUsers.some(u => getConnectStatus(u._id) !== "accepted") && (
              <div className="mt-6">
                <div className="px-5 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                    New People
                  </span>
                </div>
                <div className="flex flex-col">
                  {displayedUsers
                    .filter(u => getConnectStatus(u._id) !== "accepted")
                    .map((user: any) => renderUserRow(user))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  function renderUserRow(user: any) {
    const status = getConnectStatus(user._id);
    const isConnected = status === "accepted";
    const isPending = status === "pending";

    return (
      <div
        key={user._id}
        className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-secondary/40 transition-all border-b border-border/10 last:border-0"
      >
        <div className="relative shrink-0">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
            className="w-12 h-12 rounded-full object-cover shadow-sm border border-border/20"
            alt={user.name}
          />
          {user.online && (
            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-background shadow-sm" />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-bold text-[15px] text-foreground leading-none tracking-tight">{user.name}</p>
          <p className="text-[11px] text-muted-foreground mt-1.5 truncate opacity-60 font-medium">
            {user.email}
          </p>
        </div>
        
        {isConnected ? (
          <button 
            onClick={() => navigate(`/chat/${user._id}`)}
            className="px-5 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/[0.08] text-foreground text-[11px] font-bold transition-all active:scale-95 border border-foreground/5"
          >
            Message
          </button>
        ) : isPending ? (
          <div className="px-5 py-1.5 rounded-xl bg-secondary/80 text-muted-foreground/60 text-[11px] font-bold border border-border/40">
            Pending
          </div>
        ) : (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              sendRequestMutation.mutate(user._id);
            }}
            className="px-5 py-1.5 rounded-xl bg-foreground text-background hover:opacity-90 text-[11px] font-black transition-all active:scale-95 shadow-md shadow-foreground/10"
          >
            Connect
          </button>
        )}
      </div>
    );
  }
};

export default SearchPage;