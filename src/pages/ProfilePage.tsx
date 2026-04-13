import { useState, useEffect } from "react";
import {
  Sun, Moon, LogOut, Mail, Edit3,
  Shield, Smartphone, HelpCircle, ChevronRight,
  Settings, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import api from "../lib/api";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [dark, setDark] = useState(() =>

    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const sections = [
    {
      label: "Preferences",
      items: [
        { icon: Shield, label: "Privacy", sub: "Control your data", action: () => navigate("/settings/privacy") },
        { icon: Smartphone, label: "Devices", sub: "2 devices active", action: () => navigate("/settings/devices") },
      ],
    },
    {
      label: "More",
      items: [
        { icon: HelpCircle, label: "Help & Support", sub: "FAQs and contact", action: () => navigate("/settings/help") },
        { icon: Settings, label: "All Settings", sub: "More options", action: () => navigate("/settings") },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto pb-24 overflow-y-auto scrollbar-none">

      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
      </div>

      {/* Avatar + info */}
      <div className="px-5 flex items-center gap-4 mt-2">
        <div className="relative shrink-0">
          <img
            src={user?.avatar || "https://i.pravatar.cc/150"}
            className="w-16 h-16 rounded-full object-cover border-2 border-border/30"
            alt={user?.name || "User"}
          />
          <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[17px] text-foreground leading-tight">{user?.name || "User"}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail size={11} /> {user?.email || "Email hidden"}
            </span>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <Edit3 size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-5 my-6 border-t border-border/50" />

      {/* Sectioned menu */}
      <div className="px-5 flex flex-col gap-7">
        {sections.map(({ label, items }) => (
          <div key={label}>
            <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">{label}</p>
            <div className="flex flex-col rounded-[20px] bg-secondary/30 px-4 py-2 border border-border/40">
              {label === "Preferences" && (
                <div className="w-full flex items-center gap-3.5 py-3.5 border-b border-border/30">
                  <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                    {dark
                      ? <Moon size={17} strokeWidth={1.8} className="text-muted-foreground" />
                      : <Sun size={17} strokeWidth={1.8} className="text-muted-foreground" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[14px] font-medium text-foreground leading-tight">Dark Mode</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{dark ? "On" : "Off"}</p>
                  </div>
                  <button
                    onClick={() => setDark(!dark)}
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-200 shrink-0 ${dark ? "bg-green-500" : "bg-muted"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${dark ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              )}
              {items.map(({ icon: Icon, label: itemLabel, sub, action }, i, arr) => (
                <button
                  key={itemLabel}
                  onClick={action}
                  className={`w-full flex items-center gap-4 py-3.5 hover:opacity-80 transition-opacity active:scale-[0.99] border-b border-border/40 ${i === arr.length - 1 ? "border-none" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm border border-border/20">
                    <Icon size={18} strokeWidth={1.8} className="text-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[15px] font-medium text-foreground leading-tight">{itemLabel}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/60 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-5 my-6 border-t border-border/50" />

      {/* Logout */}
      <button
        onClick={async () => {
          await logout();
          navigate("/welcome", { replace: true });
        }}
        className="w-full flex items-center gap-4 px-5 py-2 active:scale-95 transition-transform"
      >

        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
          <LogOut size={18} strokeWidth={1.8} className="text-red-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[15px] font-medium text-red-500">Log out</p>
          <p className="text-[12px] text-red-400/70 mt-0.5">Sign out of your account</p>
        </div>
      </button>

      <p className="text-center text-[11px] text-muted-foreground mt-4">Version 1.0.0</p>
    </div>
  );
};

export default ProfilePage;