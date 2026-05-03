import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  X,
  Sun,
  Moon,
  Bell,
  BellOff,
  Shield,
  Smartphone,
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Globe,
  MessageSquare,
  Image,
  Volume2,
  VolumeX,
  Vibrate,
  LogOut,
  ChevronRight,
  Info,
  Database,
  Palette,
  Clock,
  UserX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/chat/ConfirmModal";

// ── Toggle Row ──────────────────────────────────────────────────────────────
const ToggleRow = ({
  icon: Icon,
  label,
  sub,
  value,
  onToggle,
  last = false,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  value: boolean;
  onToggle: () => void;
  last?: boolean;
}) => (
  <div
    className={`flex items-center gap-4 px-4 py-3.5 ${!last ? "border-b border-border/20" : ""}`}
  >
    <div className="w-9 h-9 rounded-xl bg-background/60 flex items-center justify-center shrink-0 border border-border/10">
      <Icon size={17} strokeWidth={1.6} className="text-foreground/75" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-medium text-foreground">{label}</p>
      {sub && (
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>
      )}
    </div>
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-300 shrink-0 ${value ? "bg-green-500" : "bg-muted"}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  </div>
);

// ── Nav Row ─────────────────────────────────────────────────────────────────
const NavRow = ({
  icon: Icon,
  label,
  sub,
  action,
  last = false,
  destructive = false,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  action: () => void;
  last?: boolean;
  destructive?: boolean;
}) => (
  <button
    onClick={action}
    className={`w-full flex items-center gap-4 px-4 py-3.5 transition-colors active:bg-secondary/40 ${!last ? "border-b border-border/20" : ""}`}
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${destructive ? "bg-red-500/10 border-red-500/10" : "bg-background/60 border-border/10"}`}
    >
      <Icon
        size={17}
        strokeWidth={1.6}
        className={destructive ? "text-red-500" : "text-foreground/75"}
      />
    </div>
    <div className="flex-1 text-left min-w-0">
      <p
        className={`text-[14px] font-medium ${destructive ? "text-red-500" : "text-foreground"}`}
      >
        {label}
      </p>
      {sub && (
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>
      )}
    </div>
    <ChevronRight size={16} className="text-muted-foreground/30 shrink-0" />
  </button>
);

// ── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2.5 px-1">
      {label}
    </p>
    <div className="rounded-[20px] bg-secondary/20 border border-border/30 overflow-hidden">
      {children}
    </div>
  </div>
);

// ── Main SettingsPage ────────────────────────────────────────────────────────
const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [showLogout, setShowLogout] = useState(false);

  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const [notifications, setNotifications] = useState(
    user?.pushNotificationsEnabled !== false,
  );
  const [sounds, setSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [mediaAutoDownload, setMediaAutoDownload] = useState(true);
  const [linkPreviews, setLinkPreviews] = useState(true);
  const [saveToGallery, setSaveToGallery] = useState(false);

  const toggleNotifications = async () => {
    const next = !notifications;
    try {
      setNotifications(next);
      const { data } = await api.patch("/users/update-settings", {
        pushNotificationsEnabled: next,
      });
      if (setUser) setUser(data);
      toast.success(`Notifications ${next ? "enabled" : "disabled"}`);
    } catch {
      setNotifications(!next);
      toast.error("Failed to update notifications");
    }
  };

  const allSettingItems = [
    {
      keywords: "dark light theme appearance",
      render: (last: boolean) => (
        <ToggleRow
          key="dark-mode"
          icon={dark ? Moon : Sun}
          label="Dark Mode"
          sub={dark ? "Currently dark" : "Currently light"}
          value={dark}
          onToggle={() => setDark((d) => !d)}
          last={last}
        />
      ),
    },
    {
      keywords: "push notifications alert notify bell",
      render: (last: boolean) => (
        <ToggleRow
          key="notifications"
          icon={notifications ? Bell : BellOff}
          label="Push Notifications"
          sub="Alerts for new messages"
          value={notifications}
          onToggle={toggleNotifications}
          last={last}
        />
      ),
    },
    {
      keywords: "sound audio volume",
      render: (last: boolean) => (
        <ToggleRow
          key="sounds"
          icon={sounds ? Volume2 : VolumeX}
          label="Sound"
          sub="Play sounds for incoming messages"
          value={sounds}
          onToggle={() => setSounds((s) => !s)}
          last={last}
        />
      ),
    },
    {
      keywords: "vibration vibrate haptic",
      render: (last: boolean) => (
        <ToggleRow
          key="vibration"
          icon={Vibrate}
          label="Vibration"
          sub="Haptic feedback on new messages"
          value={vibration}
          onToggle={() => setVibration((v) => !v)}
          last={last}
        />
      ),
    },
    {
      keywords: "read receipts seen tick eye",
      render: (last: boolean) => (
        <ToggleRow
          key="read-receipts"
          icon={readReceipts ? Eye : EyeOff}
          label="Read Receipts"
          sub="Let others know you've read their messages"
          value={readReceipts}
          onToggle={() => setReadReceipts((r) => !r)}
          last={last}
        />
      ),
    },
    {
      keywords: "online status active globe",
      render: (last: boolean) => (
        <ToggleRow
          key="online-status"
          icon={Globe}
          label="Online Status"
          sub="Show when you're active"
          value={onlineStatus}
          onToggle={() => setOnlineStatus((o) => !o)}
          last={last}
        />
      ),
    },
    {
      keywords: "privacy settings lock contact",
      render: (last: boolean) => (
        <NavRow
          key="privacy"
          icon={Lock}
          label="Privacy Settings"
          sub="Manage who can contact you"
          action={() => navigate("/settings/privacy")}
          last={last}
        />
      ),
    },
    {
      keywords: "media auto download wifi",
      render: (last: boolean) => (
        <ToggleRow
          key="media-download"
          icon={Download}
          label="Media Auto-Download"
          sub="Download on Wi-Fi automatically"
          value={mediaAutoDownload}
          onToggle={() => setMediaAutoDownload((m) => !m)}
          last={last}
        />
      ),
    },
    {
      keywords: "link preview url message",
      render: (last: boolean) => (
        <ToggleRow
          key="link-previews"
          icon={MessageSquare}
          label="Link Previews"
          sub="Show rich previews for URLs"
          value={linkPreviews}
          onToggle={() => setLinkPreviews((l) => !l)}
          last={last}
        />
      ),
    },
    {
      keywords: "save gallery photos image",
      render: (last: boolean) => (
        <ToggleRow
          key="save-gallery"
          icon={Image}
          label="Save to Gallery"
          sub="Auto-save received photos & videos"
          value={saveToGallery}
          onToggle={() => setSaveToGallery((s) => !s)}
          last={last}
        />
      ),
    },
    {
      keywords: "account shield privacy data control",
      render: (last: boolean) => (
        <NavRow
          key="account-privacy"
          icon={Shield}
          label="Privacy Settings"
          sub="Control your data"
          action={() => navigate("/settings/privacy")}
          last={last}
        />
      ),
    },
    {
      keywords: "devices smartphone sessions login",
      render: (last: boolean) => (
        <NavRow
          key="devices"
          icon={Smartphone}
          label="Devices"
          sub="Manage active sessions"
          action={() => navigate("/settings/devices")}
          last={last}
        />
      ),
    },
    {
      keywords: "export data download backup database",
      render: (last: boolean) => (
        <NavRow
          key="export"
          icon={Database}
          label="Export Data"
          sub="Download a copy of your data"
          action={() =>
            toast.info("Export started — you'll receive an email shortly")
          }
          last={last}
        />
      ),
    },
    {
      keywords: "active sessions clock login",
      render: (last: boolean) => (
        <NavRow
          key="sessions"
          icon={Clock}
          label="Active Sessions"
          sub="See where you're logged in"
          action={() => navigate("/settings/devices")}
          last={last}
        />
      ),
    },
    {
      keywords: "help center faq support question",
      render: (last: boolean) => (
        <NavRow
          key="help"
          icon={HelpCircle}
          label="Help Center"
          sub="FAQs and support contact"
          action={() => navigate("/settings/help")}
          last={last}
        />
      ),
    },
    {
      keywords: "app info version about",
      render: (last: boolean) => (
        <NavRow
          key="app-info"
          icon={Info}
          label="App Info"
          sub="Wassup • Version 1.0.0"
          action={() => toast.info("Wassup v1.0.0 — You're up to date!")}
          last={last}
        />
      ),
    },
    {
      keywords: "appearance palette theme display",
      render: (last: boolean) => (
        <NavRow
          key="appearance-nav"
          icon={Palette}
          label="Appearance"
          sub="Theme and display options"
          action={() => {}}
          last={last}
        />
      ),
    },
    {
      keywords: "block list user blocked",
      render: (last: boolean) => (
        <NavRow
          key="block-list"
          icon={UserX}
          label="Block List"
          sub="Manage blocked users"
          action={() => navigate("/settings/privacy")}
          last={last}
        />
      ),
    },
    {
      keywords: "delete account trash permanently remove",
      render: (last: boolean) => (
        <NavRow
          key="delete-account"
          icon={Trash2}
          label="Delete Account"
          sub="Permanently remove your account"
          action={() => toast.error("This would open account deletion flow")}
          destructive
          last={last}
        />
      ),
    },
    {
      keywords: "logout log out signout sign out",
      render: (last: boolean) => (
        <NavRow
          key="logout"
          icon={LogOut}
          label="Log Out"
          sub="Sign out of your account"
          action={() => setShowLogout(true)}
          destructive
          last={last}
        />
      ),
    },
  ];

  const filteredItems = search.trim()
    ? allSettingItems.filter((item) =>
        item.keywords.toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  const handleLogout = async () => {
    await logout();
    navigate("/welcome", { replace: true });
  };

  return (
    <div className="h-screen bg-background max-w-[430px] mx-auto pb-10 overflow-y-auto scrollbar-none">
      <ConfirmModal
        isOpen={showLogout}
        title="Log out?"
        message="You'll need to sign in again to access your messages."
        confirmLabel="Yes, log me out"
        cancelLabel="Cancel"
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md px-5 pt-5 pb-3 border-b border-border/20">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-[18px] font-semibold text-foreground">
            Settings
          </h1>
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settings..."
            className="w-full bg-secondary/40 border border-border/20 rounded-full pl-9 pr-9 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-border/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X size={15} className="text-muted-foreground/50" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">
        {filteredItems ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2.5 px-1">
              Results ({filteredItems.length})
            </p>
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground/50">
                <Search size={32} strokeWidth={1.2} />
                <p className="text-[14px]">No settings found</p>
              </div>
            ) : (
              <div className="rounded-[20px] bg-secondary/20 border border-border/30 overflow-hidden">
                {filteredItems.map((item, i) =>
                  item.render(i === filteredItems.length - 1),
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <Section label="Appearance">
              <ToggleRow
                icon={dark ? Moon : Sun}
                label="Dark Mode"
                sub={dark ? "Currently dark" : "Currently light"}
                value={dark}
                onToggle={() => setDark((d) => !d)}
                last
              />
            </Section>

            <Section label="Notifications">
              <ToggleRow
                icon={notifications ? Bell : BellOff}
                label="Push Notifications"
                sub="Alerts for new messages"
                value={notifications}
                onToggle={toggleNotifications}
              />
              <ToggleRow
                icon={sounds ? Volume2 : VolumeX}
                label="Sound"
                sub="Play sounds for incoming messages"
                value={sounds}
                onToggle={() => setSounds((s) => !s)}
              />
              <ToggleRow
                icon={Vibrate}
                label="Vibration"
                sub="Haptic feedback on new messages"
                value={vibration}
                onToggle={() => setVibration((v) => !v)}
                last
              />
            </Section>

            <Section label="Privacy">
              <ToggleRow
                icon={readReceipts ? Eye : EyeOff}
                label="Read Receipts"
                sub="Let others know you've read their messages"
                value={readReceipts}
                onToggle={() => setReadReceipts((r) => !r)}
              />
              <ToggleRow
                icon={Globe}
                label="Online Status"
                sub="Show when you're active"
                value={onlineStatus}
                onToggle={() => setOnlineStatus((o) => !o)}
              />
              <NavRow
                icon={Lock}
                label="Privacy Settings"
                sub="Manage who can contact you"
                action={() => navigate("/settings/privacy")}
                last
              />
            </Section>

            <Section label="Chats">
              <ToggleRow
                icon={Download}
                label="Media Auto-Download"
                sub="Download on Wi-Fi automatically"
                value={mediaAutoDownload}
                onToggle={() => setMediaAutoDownload((m) => !m)}
              />
              <ToggleRow
                icon={MessageSquare}
                label="Link Previews"
                sub="Show rich previews for URLs"
                value={linkPreviews}
                onToggle={() => setLinkPreviews((l) => !l)}
              />
              <ToggleRow
                icon={Image}
                label="Save to Gallery"
                sub="Auto-save received photos & videos"
                value={saveToGallery}
                onToggle={() => setSaveToGallery((s) => !s)}
                last
              />
            </Section>

            <Section label="Account">
              <NavRow
                icon={Shield}
                label="Privacy Settings"
                sub="Control your data"
                action={() => navigate("/settings/privacy")}
              />
              <NavRow
                icon={Smartphone}
                label="Devices"
                sub="Manage active sessions"
                action={() => navigate("/settings/devices")}
              />
              <NavRow
                icon={Database}
                label="Export Data"
                sub="Download a copy of your data"
                action={() =>
                  toast.info("Export started — you'll receive an email shortly")
                }
              />
              <NavRow
                icon={Clock}
                label="Active Sessions"
                sub="See where you're logged in"
                action={() => navigate("/settings/devices")}
                last
              />
            </Section>

            <Section label="About">
              <NavRow
                icon={HelpCircle}
                label="Help Center"
                sub="FAQs and support contact"
                action={() => navigate("/settings/help")}
              />
              <NavRow
                icon={Info}
                label="App Info"
                sub="Wassup • Version 1.0.0"
                action={() => toast.info("Wassup v1.0.0 — You're up to date!")}
              />
              <NavRow
                icon={Palette}
                label="Appearance"
                sub="Theme and display options"
                action={() => {}}
                last
              />
            </Section>

            <Section label="Danger Zone">
              <NavRow
                icon={UserX}
                label="Block List"
                sub="Manage blocked users"
                action={() => navigate("/settings/privacy")}
              />
              <NavRow
                icon={Trash2}
                label="Delete Account"
                sub="Permanently remove your account"
                action={() =>
                  toast.error("This would open account deletion flow")
                }
                destructive
              />
              <NavRow
                icon={LogOut}
                label="Log Out"
                sub="Sign out of your account"
                action={() => setShowLogout(true)}
                destructive
                last
              />
            </Section>

            <p className="text-center text-[11px] font-medium text-muted-foreground/40 mt-4 tracking-tight pb-4">
              Wassup • Version 1.0.0
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
