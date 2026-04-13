import { Home, Search, Bell, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

const tabs = [
  { icon: Home, label: "Overview", path: "/messengers" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Bell, label: "Activity", path: "/activity" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = useIsDark();

  const pillRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const slidingBgRef = useRef<HTMLDivElement>(null);

  const pill = isDark
    ? {
      background: "rgba(20, 20, 20, 0.65)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow:
        "0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
    }
    : {
      background: "rgba(255, 255, 255, 0.72)",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow:
        "0 4px 24px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.04) inset",
    };

  const token = isDark
    ? {
      activeColor: "rgba(255,255,255,1)",
      inactiveColor: "rgba(255,255,255,0.40)",
      activeBg: "rgba(255,255,255,0.18)",
      activeBoxShadow:
        "0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
    }
    : {
      activeColor: "rgba(0,0,0,0.90)",
      inactiveColor: "rgba(0,0,0,0.35)",
      activeBg: "rgba(0,0,0,0.07)",
      activeBoxShadow:
        "0 2px 10px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.70)",
    };

  // ── Mount entrance ────────────────────────────────────────────
  useEffect(() => {
    if (!pillRef.current) return;
    gsap.fromTo(
      pillRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.1 }
    );
  }, []);

  // ── Slide active bg to current tab ───────────────────────────
  useEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.path === location.pathname);
    const btn = buttonRefs.current[activeIndex];
    const container = pillRef.current;
    const bg = slidingBgRef.current;
    if (!btn || !container || !bg) return;

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const left = btnRect.left - containerRect.left;
    const width = btnRect.width;

    // On first render just snap, then slide from then on
    const isFirst = gsap.getProperty(bg, "opacity") === 0;

    if (isFirst) {
      gsap.set(bg, { left, width, opacity: 1 });
    } else {
      gsap.to(bg, {
        left,
        width,
        duration: 0.35,
        ease: "power2.inOut",
      });
    }
  }, [location.pathname]);

  if (
    location.pathname.startsWith("/chat/") ||
    location.pathname === "/welcome" ||
    location.pathname === "/login"
  ) return null;


  return (
    <div
      style={{
        position: "fixed",
        bottom: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
      }}
    >
      <div
        ref={pillRef}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 10px",
          borderRadius: "9999px",
          border: pill.border,
          background: pill.background,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: pill.boxShadow,
          position: "relative",
        }}
      >
        {/* Active sliding background */}
        <div
          ref={slidingBgRef}
          style={{
            position: "absolute",
            top: "8px",
            height: "44px",
            borderRadius: "9999px",
            background: token.activeBg,
            boxShadow: token.activeBoxShadow,
            opacity: 0,
            pointerEvents: "none",
          }}
        />

        {tabs.map((tab, i) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.label}
              ref={(el) => { buttonRefs.current[i] = el; }}
              onClick={() => navigate(tab.path)}
              title={tab.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                background: "transparent",
                color: isActive ? token.activeColor : token.inactiveColor,
                outline: "none",
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
                transition: "color 0.25s ease",
              }}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;