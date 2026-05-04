import { useState, useRef, useEffect } from "react";
import { X, Check, GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { useIsDark } from "@/hooks/useIsDark";
import { toast } from "sonner";

type FilterTab = string;
const DEFAULT_FILTERS: FilterTab[] = ["All", "Unread", "Favorites", "Groups"];

interface FilterModalProps {
  isOpen: boolean;
  filters: FilterTab[];
  activeFilter: FilterTab;
  onClose: () => void;
  onFiltersChange: (filters: FilterTab[]) => void;
  onActiveFilterChange: (filter: FilterTab) => void;
}

export function FilterModal({
  isOpen,
  filters,
  activeFilter,
  onClose,
  onFiltersChange,
  onActiveFilterChange,
}: FilterModalProps) {
  const isDark = useIsDark();
  const filterInputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const [editingFilter, setEditingFilter] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setVisible(true);
      setNewFilterName("");
      setEditingFilter(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onClose();
    }, 280);
  };

  const addFilter = () => {
    const name = newFilterName.trim();
    if (!name) return;
    if (filters.includes(name)) {
      toast.error("Filter already exists");
      return;
    }
    onFiltersChange([...filters, name]);
    setNewFilterName("");
    toast.success(`Filter "${name}" added`);
  };

  const deleteFilter = (f: FilterTab) => {
    if (DEFAULT_FILTERS.includes(f)) {
      toast.error("Cannot delete default filter");
      return;
    }
    onFiltersChange(filters.filter((x) => x !== f));
    if (activeFilter === f) onActiveFilterChange("All");
    toast.success("Filter removed");
  };

  const startEdit = (f: FilterTab) => {
    setEditingFilter(f);
    setEditName(f);
  };

  const saveEdit = () => {
    if (!editingFilter || !editName.trim()) return;
    onFiltersChange(
      filters.map((x) => (x === editingFilter ? editName.trim() : x)),
    );
    if (activeFilter === editingFilter) onActiveFilterChange(editName.trim());
    setEditingFilter(null);
    toast.success("Filter renamed");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{
        backdropFilter: closing ? "blur(0px)" : "blur(6px)",
        WebkitBackdropFilter: closing ? "blur(0px)" : "blur(6px)",
        background: closing ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.45)",
        transition:
          "background 0.28s ease, backdrop-filter 0.28s ease, -webkit-backdrop-filter 0.28s ease",
      }}
      onClick={handleClose}
    >
      <style>{`
        @keyframes slideUp   { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(100%)} }
      `}</style>

      <div
        className="w-full max-w-[430px] rounded-t-[28px] overflow-hidden pb-8"
        style={{
          background: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 100%)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.06)",
          boxShadow: isDark
            ? "0 -20px 60px rgba(0,0,0,0.45)"
            : "0 -10px 40px rgba(0,0,0,0.08)",
          animation: `${closing ? "slideDown" : "slideUp"} 0.28s cubic-bezier(0.34,1.2,0.64,1) both`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-6 pt-3 pb-3 flex items-center justify-between border-b border-border/30">
          <h3 className="text-[17px] font-bold text-foreground">
            Manage Filters
          </h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        <div
          className="px-6 pt-4 space-y-1 max-h-[240px] overflow-y-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filters.map((f) => {
            const isDefault = DEFAULT_FILTERS.includes(f);
            return (
              <div
                key={f}
                className="flex items-center gap-3 py-2.5 px-3 rounded-2xl bg-secondary/40 group"
              >
                <GripVertical
                  size={14}
                  className="text-muted-foreground/40 shrink-0"
                />
                {editingFilter === f ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    className="flex-1 bg-transparent text-[14px] text-foreground outline-none border-b border-primary/50 pb-0.5"
                  />
                ) : (
                  <span className="flex-1 text-[14px] font-medium text-foreground">
                    {f}
                  </span>
                )}
                {editingFilter === f ? (
                  <button
                    onClick={saveEdit}
                    className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <Check size={13} className="text-primary" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isDefault && (
                      <button
                        onClick={() => startEdit(f)}
                        className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-muted"
                      >
                        <Pencil size={12} className="text-muted-foreground" />
                      </button>
                    )}
                    {!isDefault && (
                      <button
                        onClick={() => deleteFilter(f)}
                        className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    )}
                    {isDefault && (
                      <span className="text-[10px] text-muted-foreground/50 px-1">
                        default
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 pt-5">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Add new filter
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 bg-secondary/60 border border-border/40">
              <input
                ref={filterInputRef}
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFilter()}
                placeholder="Filter name…"
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
            </div>
            <button
              onClick={addFilter}
              disabled={!newFilterName.trim()}
              className="w-11 h-11 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={20} className="text-primary-foreground" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-2 px-1">
            Filters are simulated — connect to real data when ready.
          </p>
        </div>
      </div>
    </div>
  );
}
