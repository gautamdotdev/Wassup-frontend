import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center font-sans">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nf-planet { animation: float 3.5s ease-in-out infinite; }
        .nf-a1 { animation: fadeUp .5s ease both .1s; }
        .nf-a2 { animation: fadeUp .5s ease both .25s; }
        .nf-a3 { animation: fadeUp .5s ease both .4s; }
        .nf-a4 { animation: fadeUp .5s ease both .55s; }
      `}</style>

      {/* Floating planet illustration */}
      <div className="nf-planet mb-2">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Planet body */}
          <circle cx="60" cy="60" r="36" className="fill-secondary stroke-border" strokeWidth="1" />
          {/* Orbit ring */}
          <ellipse cx="60" cy="60" rx="58" ry="14" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeDasharray="4 3" className="text-muted-foreground/30" />
          {/* Craters */}
          <circle cx="48" cy="52" r="5" className="fill-muted" />
          <circle cx="67" cy="63" r="8" className="fill-muted" />
          <circle cx="55" cy="68" r="4" className="fill-muted/50" />
          {/* Stars */}
          <circle cx="28" cy="30" r="3" className="fill-muted" />
          <circle cx="95" cy="38" r="2" className="fill-muted" />
          <circle cx="85" cy="88" r="2.5" className="fill-muted" />
          <circle cx="18" cy="75" r="1.5" className="fill-muted/60" />
        </svg>
      </div>

      {/* 404 number */}
      <h1 className="nf-a1 text-[80px] font-bold leading-none tracking-tighter text-foreground m-0 tabular-nums">
        404
      </h1>

      {/* Heading */}
      <h2 className="nf-a2 text-[18px] font-semibold text-foreground mt-3 mb-1">
        Page not found
      </h2>

      {/* Subtext */}
      <p className="nf-a3 text-[14px] text-muted-foreground leading-relaxed max-w-[220px] mb-8">
        Looks like this page drifted into deep space. Let's get you back.
      </p>

      {/* CTA button */}
      <button
        onClick={() => navigate("/")}
        className="nf-a4 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-foreground text-background text-[14px] font-medium active:scale-95 transition-all duration-150"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M6 2L1 7L6 12M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to home
      </button>
    </div>
  );
};

export default NotFound;