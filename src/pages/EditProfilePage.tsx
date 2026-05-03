import { useState } from "react";
import { ArrowLeft, Camera, Check, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { toast } from "sonner";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const hasChanged =
    name.trim() !== (user?.name || "").trim() && name.trim().length > 0;

  const handleSave = async () => {
    if (!hasChanged || saving) return;
    setSaving(true);
    try {
      const { data } = await api.patch("/users/update-settings", {
        name: name.trim(),
      });
      if (setUser) setUser(data);
      toast.success("Name updated!");
      navigate(-1);
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen bg-background max-w-[430px] mx-auto overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md px-5 pt-5 pb-4 border-b border-border/20 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-[17px] font-semibold text-foreground">
          Edit Profile
        </h1>
        <button
          onClick={handleSave}
          disabled={!hasChanged || saving}
          className={`text-[14px] font-semibold transition-colors ${
            hasChanged ? "text-green-500" : "text-muted-foreground/40"
          }`}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Avatar area */}
      <div className="flex flex-col items-center pt-10 pb-8">
        <div className="relative">
          <img
            src={user?.avatar || "https://i.pravatar.cc/150"}
            className="w-24 h-24 rounded-full object-cover border-2 border-border/30 shadow-md"
            alt={user?.name || "User"}
          />
          <button
            onClick={() => toast.info("Photo upload coming soon!")}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-background shadow"
          >
            <Camera size={14} className="text-white" />
          </button>
        </div>
        <p className="text-[12px] text-muted-foreground/60 mt-3">
          Tap to change photo
        </p>
      </div>

      {/* Form */}
      <div className="px-5 flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2.5 px-1">
            Display Name
          </p>
          <div className="relative flex items-center rounded-full bg-secondary/20 border border-border/30 overflow-hidden px-4 py-3.5 gap-3">
            <User
              size={17}
              strokeWidth={1.6}
              className="text-muted-foreground/50 shrink-0"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={40}
              className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none"
            />
            {hasChanged && (
              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Check size={12} className="text-green-500" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-1.5 px-1">
            {name.length}/40 characters
          </p>
        </div>

        {/* Info card */}
        <div className="rounded-[20px] bg-secondary/20 border border-border/30 px-4 py-4">
          <p className="text-[13px] text-muted-foreground/70 leading-relaxed">
            Your display name is how other users will see you in conversations
            and search results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
