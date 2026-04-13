import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, RequireAuth, GuestOnly, useAuth } from "./lib/auth";
import { SocketProvider } from "./lib/socket";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MessengersPage from "./pages/MessengersPage";
import ChatPage from "./pages/ChatPage";
import SearchPage from "./pages/SearchPage";
import ActivityPage from "./pages/ActivityPage";
import ProfilePage from "./pages/ProfilePage";
import ChatUserProfile from "./pages/ChatUserProfile";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import { Loader2 } from "lucide-react";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  return user
    ? <Navigate to="/messengers" replace />
    : <Navigate to="/welcome" replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SocketProvider>
          <HashRouter>
            <Routes>
            
              {/* Guest-only */}
              <Route path="/welcome" element={<GuestOnly><WelcomePage /></GuestOnly>} />
              <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />

              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Protected routes */}
              <Route path="/messengers" element={<RequireAuth><MessengersPage /></RequireAuth>} />
              <Route path="/chat/:userId" element={<RequireAuth><ChatPage /></RequireAuth>} />
              <Route path="/chat/:userId/profile" element={<RequireAuth><ChatUserProfile /></RequireAuth>} />
              <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
              <Route path="/activity" element={<RequireAuth><ActivityPage /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </HashRouter>
        </SocketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
