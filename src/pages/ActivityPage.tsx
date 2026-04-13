import { useState } from "react";
import { Check, X, Bell, PhoneMissed, Video, ShieldAlert } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

const ActivityPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading: loadingConnections } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const res = await api.get("/connections");
      return res.data;
    }
  });

  const { data: notifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      return api.put(`/connections/${id}`, { status });
    },
    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  });

  // Filters for connection requests where current user is the receiver
  const pendingRequests = connections.filter(
    (c: any) => c.status === "pending" && c.receiverId?._id === user?._id
  );
  
  const unreadCount = pendingRequests.length + notifications.filter((n: any) => !n.isRead).length;

  const isLoading = loadingConnections || loadingNotifications;

  return (
    <div className="min-h-screen bg-background pb-24 max-w-[430px] mx-auto">

      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity</h1>
        {unreadCount > 0 && (
          <span className="shrink-0 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[20px] min-h-[20px] rounded-full flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Contact Requests
            </span>
            <span className="text-xs text-muted-foreground font-medium">{pendingRequests.length} pending</span>
          </div>
          <div className="flex flex-col gap-1 px-3">
            {pendingRequests.map((req: any) => (
              <div
                key={req._id}
                className="flex items-center gap-3.5 px-3 py-3.5 bg-secondary/30 rounded-2xl border border-border/50 backdrop-blur-sm"
              >
                <img
                  src={req.senderId?.avatar || "https://i.pravatar.cc/150"}
                  className="w-11 h-11 rounded-full object-cover shrink-0 shadow-sm border border-border/10"
                  alt={req.senderId?.name}
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-sm text-foreground leading-tight">{req.senderId?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 opacity-80">wants to connect with you</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate({ id: req._id, status: "rejected" })}
                    className="w-9 h-9 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                  >
                    <X size={16} />
                  </button>
                  <button
                    disabled={updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate({ id: req._id, status: "accepted" })}
                    className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 transition-all shadow-md"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mt-6">
          <div className="px-5 mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Alerts
            </span>
          </div>
          <div className="flex flex-col">
            {notifications.map((act: any) => {
              const Icon = act.type === "message" ? Bell : ShieldAlert;
              return (
                <button
                  key={act._id}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-border/50 last:border-0 text-left active:bg-secondary/40 transition-colors ${!act.isRead ? "bg-secondary/10" : "opacity-70"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border/40">
                    <Icon size={16} className="text-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug ${act.isRead ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                      {act.text}
                    </p>
                  </div>
                  
                  {!act.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && pendingRequests.length === 0 && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 px-8 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-[22px] bg-secondary flex items-center justify-center rotate-3 shadow-inner">
            <Bell size={24} className="text-muted-foreground/60" />
          </div>
          <div>
            <p className="font-bold text-base text-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground max-w-[200px] mt-1 line-clamp-2">
              You've handled all connection requests and alerts for now.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;