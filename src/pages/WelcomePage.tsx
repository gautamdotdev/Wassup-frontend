import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function WelcomePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emojiRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const tagWordsRef = useRef<HTMLSpanElement[]>([]);
  const particlesRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /* ── Lock height to actual visible viewport on mobile ─────── */
  useEffect(() => {
    const setVh = () => {
      const el = rootRef.current;
      if (!el) return;
      // Use dvh if supported, otherwise fall back to window.innerHeight
      // window.innerHeight excludes the mobile browser chrome reliably
      el.style.height = `${window.innerHeight}px`;
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  /* ── Wave canvas ─────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    let t = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains("dark");
      const lineColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
      const lines = 18;
      for (let i = 0; i < lines; i++) {
        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.8;
        const yBase = canvas.height * 0.55 + i * 18;
        ctx.moveTo(0, yBase);
        for (let x = 0; x <= canvas.width; x += 4) {
          const y =
            yBase +
            Math.sin((x / canvas.width) * Math.PI * 3 + t + i * 0.3) * 20 +
            Math.cos((x / canvas.width) * Math.PI * 2 + t * 0.7 + i * 0.2) * 10;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      t += 0.008;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ── GSAP entrance + ambient animations ──────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });

      gsap.set([orb1Ref.current, orb2Ref.current, orb3Ref.current], {
        opacity: 0, scale: 0.6,
      });
      tl.to(
        [orb1Ref.current, orb2Ref.current, orb3Ref.current],
        { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out", stagger: 0.15 },
        0
      );
      gsap.to(orb1Ref.current, { y: -22, x: 14, duration: 4.2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.5 });
      gsap.to(orb2Ref.current, { y: 26, x: -12, duration: 5.1, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 0.8 });
      gsap.to(orb3Ref.current, { y: -16, x: 9, duration: 3.7, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.2 });

      gsap.set([emojiRef.current, titleRef.current, subRef.current, btnRef.current], {
        opacity: 0, y: 28,
      });
      tl.to(emojiRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }, 0.5);
      tl.to(titleRef.current, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.72);
      tl.to(subRef.current, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.92);
      tl.to(btnRef.current, { opacity: 1, y: 0, duration: 0.65, ease: "back.out(1.7)" }, 1.08);

      gsap.set(tagWordsRef.current, { opacity: 0, y: 10 });
      tl.to(tagWordsRef.current, { opacity: 1, y: 0, stagger: 0.12, duration: 0.45, ease: "power2.out" }, 1.25);

      gsap.to(emojiRef.current, { rotation: 8, duration: 2, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 2 });
    });
    return () => ctx.revert();
  }, []);

  /* ── Particle spawn ──────────────────────────────────────── */
  useEffect(() => {
    const cont = particlesRef.current;
    if (!cont) return;
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement("div");
      p.style.cssText = `
        position:absolute; width:2px; height:2px; border-radius:50%;
        background:rgba(255,255,255,0.4);
        left:${Math.random() * 100}%; top:${Math.random() * 100}%;
        opacity:${Math.random() * 0.5 + 0.1};
      `;
      cont.appendChild(p);
      particles.push(p);
      gsap.to(p, {
        y: (Math.random() - 0.5) * 45,
        x: (Math.random() - 0.5) * 22,
        opacity: Math.random() * 0.4,
        duration: 3 + Math.random() * 4,
        repeat: -1, yoyo: true, ease: "sine.inOut",
        delay: Math.random() * 3,
      });
    }
    return () => particles.forEach((p) => p.remove());
  }, []);

  /* ── Button interactions ─────────────────────────────────── */
  const handleBtnEnter = () =>
    gsap.to(btnRef.current, { scale: 1.07, duration: 0.22, ease: "power2.out" });
  const handleBtnLeave = () =>
    gsap.to(btnRef.current, { scale: 1, duration: 0.35, ease: "elastic.out(1.3, 0.45)" });
  const handleBtnClick = () => {
    gsap.to(btnRef.current, {
      scale: 0.9, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.in",
      onComplete: () => navigate("/login"),
    });
  };

  return (
    /*
      Key fixes for mobile no-scroll:
      - `overflow: hidden` prevents any bleed
      - height is set dynamically to window.innerHeight via rootRef
      - `flex flex-col` + children using flex-1 fill the space naturally
      - NO min-h-screen (that was the culprit — 100vh > visible area on mobile)
    */
    <div
      ref={rootRef}
      className="relative w-full max-w-[430px] mx-auto overflow-hidden flex flex-col"
      style={{
        background: "var(--welcome-bg)",
        height: "100dvh", /* dvh = dynamic viewport height, clips browser chrome */
      }}
    >
      {/* Gradient orbs */}
      <div
        ref={orb1Ref}
        className="pointer-events-none absolute"
        style={{
          top: "8%", right: "12%", width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234,179,8,0.28) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      <div
        ref={orb2Ref}
        className="pointer-events-none absolute"
        style={{
          bottom: "18%", left: "-5%", width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.22) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        ref={orb3Ref}
        className="pointer-events-none absolute"
        style={{
          top: "42%", left: "32%", width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          filter: "blur(25px)",
        }}
      />

      {/* Wave canvas */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 w-full h-full" />

      {/* Particles */}
      <div ref={particlesRef} className="pointer-events-none absolute inset-0" />

      {/* Main content — flex-1 fills remaining vertical space */}
      <div className="relative z-10 flex flex-col flex-1 px-8 pt-16">
        <span
          ref={emojiRef}
          className="text-4xl mb-5 select-none inline-block"
          role="img"
          aria-label="smile"
        >
          😊
        </span>
        <h1
          ref={titleRef}
          className="text-4xl font-extrabold leading-tight tracking-tight"
          style={{ color: "var(--welcome-fg)" }}
        >
          Welcome
        </h1>
        <p
          ref={subRef}
          className="mt-3 text-lg leading-relaxed"
          style={{ color: "var(--welcome-muted)" }}
        >
          Chat with friends &amp;&nbsp;family effortlessly.
        </p>
      </div>

      {/* Tag words */}
      <div className="relative z-10 px-8 pb-2 flex gap-3">
        {["Secure", "Fast", "Beautiful"].map((w, i) => (
          <span
            key={w}
            ref={(el) => { if (el) tagWordsRef.current[i] = el; }}
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: "var(--welcome-muted)", opacity: 0 }}
          >
            {w}
          </span>
        ))}
      </div>

      {/* Next button — pinned to bottom */}
      <div className="relative z-10 flex justify-end px-6 pb-10">
        <button
          ref={btnRef}
          onClick={handleBtnClick}
          onMouseEnter={handleBtnEnter}
          onMouseLeave={handleBtnLeave}
          className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm"
          style={{
            background: "var(--welcome-btn-bg)",
            color: "var(--welcome-btn-fg)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            opacity: 0,
          }}
        >
          Next
          <span className="flex items-center">
            <ChevronRight size={15} strokeWidth={2.5} />
            <ChevronRight size={15} strokeWidth={2.5} className="-ml-2.5" />
          </span>
        </button>
      </div>
    </div>
  );
}