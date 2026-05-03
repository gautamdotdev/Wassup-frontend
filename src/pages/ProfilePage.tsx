import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Mail,
  Edit3,
  Bell,
  BellOff,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { toast } from "sonner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.pushNotificationsEnabled !== false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    try {
      setNotificationsEnabled(newValue);
      const { data } = await api.patch("/users/update-settings", {
        pushNotificationsEnabled: newValue,
      });
      if (setUser) setUser(data);
      toast.success(`Notifications ${newValue ? "enabled" : "disabled"}`);
    } catch {
      setNotificationsEnabled(!newValue);
      toast.error("Failed to update settings");
    }
  };

  const menuSections = [
    {
      label: "Preferences",
      items: [
        {
          icon: dark ? Moon : Sun,
          label: "Dark Mode",
          sub: dark ? "On" : "Off",
          isToggle: true,
          value: dark,
          onToggle: () => setDark(!dark),
        },
        {
          icon: notificationsEnabled ? Bell : BellOff,
          label: "Push Notifications",
          sub: notificationsEnabled ? "Enabled" : "Disabled",
          isToggle: true,
          value: notificationsEnabled,
          onToggle: toggleNotifications,
        },
        {
          icon: Settings,
          label: "Settings",
          sub: "App preferences & more",
          isToggle: false,
          action: () => navigate("/settings"),
        },
      ],
    },
  ];

  return (
    <div className="h-screen bg-background max-w-[430px] mx-auto pb-24 overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="col-start-1 row-start-1 text-2xl font-bold tracking-tight text-foreground z-0 justify-self-start">
          Profile
        </h1>
      </div>

      {/* Avatar + info */}
      <div className="px-5 flex items-center gap-4 mt-2">
        <div className="relative shrink-0">
          <img
            src={user?.avatar || "https://i.pravatar.cc/150"}
            className="w-16 h-16 rounded-full object-cover border-2 border-border/30 shadow-sm"
            alt={user?.name || "User"}
          />
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[17px] text-foreground leading-tight">
            {user?.name || "User"}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
              <Mail size={10} /> {user?.email || "Email hidden"}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate("/edit-profile")}
          className="w-9 h-9 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 hover:bg-secondary transition-colors"
        >
          <Edit3 size={15} className="text-muted-foreground" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-5 my-6 border-t border-border/50" />

      {/* Sectioned menu */}
      <div className="px-5 flex flex-col gap-6">
        {menuSections.map(({ label, items }) => (
          <div key={label}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-3 px-1">
              {label}
            </p>
            <div className="flex flex-col rounded-[24px] bg-secondary/20 px-1 border border-border/30 backdrop-blur-sm overflow-hidden">
              {items.map((item, i) => (
                <div
                  key={item.label}
                  className={`w-full flex items-center gap-4 px-4 py-4 transition-colors ${
                    i < items.length - 1 ? "border-b border-border/20" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-background/50 flex items-center justify-center shrink-0 shadow-sm border border-border/10">
                    <item.icon
                      size={19}
                      strokeWidth={1.5}
                      className="text-foreground/80"
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[15px] font-medium text-foreground leading-tight">
                      {item.label}
                    </p>
                    <p className="text-[12px] text-muted-foreground/80 mt-0.5 truncate">
                      {item.sub}
                    </p>
                  </div>

                  {item.isToggle ? (
                    <button
                      onClick={item.onToggle}
                      className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-300 shrink-0 ${
                        item.value ? "bg-green-500" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                          item.value ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  ) : (
                    <button
                      onClick={item.action}
                      className="p-1 hover:bg-secondary/50 rounded-full transition-colors"
                    >
                      <ChevronRight
                        size={18}
                        className="text-muted-foreground/40"
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 mt-10 pb-4">
        <p className="text-[12px] font-semibold text-foreground/30 tracking-tight">
          Wassup
        </p>
        <p className="text-[11px] text-muted-foreground/40 tracking-wide">
          Designed & Built by{" "}
          <span className="font-semibold text-muted-foreground/60">GAUTAM</span>
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
