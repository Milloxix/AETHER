import React, { useState, useEffect, useRef, MouseEvent, FormEvent } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { 
  howItWorksSteps, 
  trioCards, 
  radarMetrics, 
  faqList
} from "./data";

// Count-up animation component for metric values
const CountUpValue = ({ target, duration = 1200 }: { target: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
};

const TypewriterText = ({ text, delayMs = 500 }: { text: string; delayMs?: number }) => {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    timeoutId = setTimeout(() => {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(intervalId);
          setTimeout(() => setShowCursor(false), 3000); // Hide cursor after 3s
        }
      }, 60);
      return () => clearInterval(intervalId);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [text, delayMs]);

  return (
    <>
      {displayText}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block w-[3px] h-[0.9em] bg-white/70 ml-[2px] align-baseline"
        />
      )}
    </>
  );
};

export default function App() {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number, y: number, label: string } | null>(null);
  // Billing cycle state: false for monthly, true for annual
  const [isAnnual, setIsAnnual] = useState(false);

  // Email capture states
  const [finalEmail, setFinalEmail] = useState("");
  const [finalSuccess, setFinalSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (email: string, setSubmitted: (val: boolean) => void) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return;
    
    setIsSubmitting(true);
    try {
      await fetch(`https://script.google.com/macros/s/AKfycbzQo-7qPHbOL_fG--UBsP2X_oPpkSz1f4urf7KoxFeNGVVtz7VsKjgHNdfGLaglO6Mo/exec?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        mode: 'no-cors'
      });
    } catch(e) {}
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleFinalSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleEmailSubmit(finalEmail, setFinalSuccess);
  };

  // FAQ accordion state: track which FAQs are open
  const [openFaqIds, setOpenFaqIds] = useState<Record<number, boolean>>({});

  // Active step index in How It Works
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  // Hero card soft fade-in state
  const [heroCardVisible, setHeroCardVisible] = useState(false);
  useEffect(() => {
    setHeroCardVisible(true);
  }, []);

  // 3D voice card interaction state
  const voiceCardRef = useRef<HTMLDivElement | null>(null);
  const [voiceCardTilt, setVoiceCardTilt] = useState({ x: 0, y: 0 });
  const [voiceCardGlare, setVoiceCardGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isVoiceCardHovered, setIsVoiceCardHovered] = useState(false);

  const handleVoiceCardMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = voiceCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const px = x / rect.width;
    const py = y / rect.height;
    
    const rotateX = (py - 0.5) * -18; // tilt max 18 degrees
    const rotateY = (px - 0.5) * 18;
    
    setVoiceCardTilt({ x: rotateX, y: rotateY });
    setVoiceCardGlare({ x: px * 100, y: py * 100, opacity: 0.55 });
    setIsVoiceCardHovered(true);
  };

  const handleVoiceCardMouseLeave = () => {
    setVoiceCardTilt({ x: 0, y: 0 });
    setVoiceCardGlare(prev => ({ ...prev, opacity: 0 }));
    setIsVoiceCardHovered(false);
  };

  // Canvas Refs
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const finalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Toggle FAQ item open/close state
  const toggleFaq = (id: number) => {
    setOpenFaqIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Dual Canvas effect hook
  useEffect(() => {
    // 1. HERO CANVAS
    const hc = heroCanvasRef.current;
    let heroAnimationFrameId: number;
    let resizeHeroListener: () => void;

    if (hc) {
      const hx = hc.getContext("2d");
      if (hx) {
        resizeHeroListener = () => {
          hc.width = hc.offsetWidth;
          hc.height = hc.offsetHeight;
        };
        resizeHeroListener();
        window.addEventListener("resize", resizeHeroListener);


        // Config for 8 quiet, thin straight light lines drifting imperceptibly
        const linesCount = 8;
        const lines: Array<{
          x: number;
          y: number;
          angle: number;
          length: number;
          driftX: number;
          driftY: number;
          pulseSpeed: number;
          pulseOffset: number;
        }> = [];

        for (let i = 0; i < linesCount; i++) {
          lines.push({
            x: Math.random() * 1.2 - 0.1, // slightly outer bounded to allow clean drifting in/out
            y: Math.random() * 1.2 - 0.1,
            angle: Math.random() * Math.PI * 2,
            length: 200 + Math.random() * 500, // 200-700px
            driftX: (Math.random() - 0.5) * 0.00015, // very slow drift rate
            driftY: (Math.random() - 0.5) * 0.00015,
            pulseSpeed: 0.18 + Math.random() * 0.22, // slow breathing cycle matching breath
            pulseOffset: Math.random() * Math.PI * 2,
          });
        }

        const drawHero = (t: number) => {
          const w = hc.width;
          const h = hc.height;
          hx.clearRect(0, 0, w, h);

          // Pure black background (#060606)
          hx.fillStyle = "#060606";
          hx.fillRect(0, 0, w, h);

          const time = t * 0.001; // Scaled time parameter

          // 1. Three ambient radial gradient glows covering roughly 40% width each (z-index level below white lines)
          const glowRadius = w * 0.40;

          // Top Left Glow
          const tlGrad = hx.createRadialGradient(w * 0.15, h * 0.15, 0, w * 0.15, h * 0.15, glowRadius);
          tlGrad.addColorStop(0, "rgba(255, 255, 255, 0.035)");
          tlGrad.addColorStop(1, "transparent");
          hx.fillStyle = tlGrad;
          hx.fillRect(0, 0, w, h);

          // Top Right Glow
          const trGrad = hx.createRadialGradient(w * 0.85, h * 0.15, 0, w * 0.85, h * 0.15, glowRadius);
          trGrad.addColorStop(0, "rgba(255, 255, 255, 0.035)");
          trGrad.addColorStop(1, "transparent");
          hx.fillStyle = trGrad;
          hx.fillRect(0, 0, w, h);

          // Bottom Center Glow
          const bcGrad = hx.createRadialGradient(w * 0.5, h * 0.90, 0, w * 0.5, h * 0.90, glowRadius);
          bcGrad.addColorStop(0, "rgba(255, 255, 255, 0.045)");
          bcGrad.addColorStop(1, "transparent");
          hx.fillStyle = bcGrad;
          hx.fillRect(0, 0, w, h);

          // Subtle central bloom behind the headline
          const glowGrad = hx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, Math.max(w, h) * 0.45);
          glowGrad.addColorStop(0, "rgba(255, 255, 255, 0.03)");
          glowGrad.addColorStop(1, "transparent");
          hx.fillStyle = glowGrad;
          hx.fillRect(0, 0, w, h);

          // 2. Render each thin straight light line
          lines.forEach(l => {
            // Apply drift
            l.x += l.driftX;
            l.y += l.driftY;

            // Soft wrap bounds to keep them circulating on screen elegantly
            if (l.x < -0.2) l.x += 1.4;
            if (l.x > 1.2) l.x -= 1.4;
            if (l.y < -0.2) l.y += 1.4;
            if (l.y > 1.2) l.y -= 1.4;

            // Sine wave breathing opacity calculation
            const breathe = Math.sin(time * l.pulseSpeed + l.pulseOffset);
            const intensity = (breathe + 1) / 2; // Normalize to range [0, 1]
            const opacity = intensity * 0.04;    // Max opacity exactly at 0.04 center

            // Coordinate construction
            const cxLine = l.x * w;
            const cyLine = l.y * h;
            const dx = Math.cos(l.angle);
            const dy = Math.sin(l.angle);

            const x0 = cxLine - dx * l.length / 2;
            const y0 = cyLine - dy * l.length / 2;
            const x1 = cxLine + dx * l.length / 2;
            const y1 = cyLine + dy * l.length / 2;

            // Linear gradient: transparent -> center solid -> transparent
            const lineGrad = hx.createLinearGradient(x0, y0, x1, y1);
            lineGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
            lineGrad.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
            lineGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

            hx.save();
            hx.strokeStyle = lineGrad;
            hx.lineWidth = 0.5; // Exactly 0.5px thick line
            hx.beginPath();
            hx.moveTo(x0, y0);
            hx.lineTo(x1, y1);
            hx.stroke();
            hx.restore();
          });

          heroAnimationFrameId = requestAnimationFrame(drawHero);
        };

        heroAnimationFrameId = requestAnimationFrame(drawHero);
      }
    }

    // 2. FINAL CTA CANVAS with 8 quiet, thin straight light lines drifting
    const fc = finalCanvasRef.current;
    let finalAnimationFrameId: number;
    let resizeFinalListener: () => void;

    if (fc) {
      const fx = fc.getContext("2d");
      if (fx) {
        resizeFinalListener = () => {
          fc.width = fc.offsetWidth;
          fc.height = fc.offsetHeight;
        };
        resizeFinalListener();
        window.addEventListener("resize", resizeFinalListener);

        const finalLinesCount = 8;
        const finalLines: Array<{
          x: number;
          y: number;
          angle: number;
          length: number;
          driftX: number;
          driftY: number;
          pulseSpeed: number;
          pulseOffset: number;
        }> = [];

        for (let i = 0; i < finalLinesCount; i++) {
          finalLines.push({
            x: Math.random() * 1.2 - 0.1,
            y: Math.random() * 1.2 - 0.1,
            angle: Math.random() * Math.PI * 2,
            length: 200 + Math.random() * 500,
            driftX: (Math.random() - 0.5) * 0.00015,
            driftY: (Math.random() - 0.5) * 0.00015,
            pulseSpeed: 0.18 + Math.random() * 0.22,
            pulseOffset: Math.random() * Math.PI * 2,
          });
        }

        const drawFinal = (t: number) => {
          const w = fc.width;
          const h = fc.height;
          fx.clearRect(0, 0, w, h);

          const time = t * 0.001;

          finalLines.forEach(l => {
            // Apply drift
            l.x += l.driftX;
            l.y += l.driftY;

            // Soft wrap bounds
            if (l.x < -0.2) l.x += 1.4;
            if (l.x > 1.2) l.x -= 1.4;
            if (l.y < -0.2) l.y += 1.4;
            if (l.y > 1.2) l.y -= 1.4;

            // Sine wave breathing opacity
            const breathe = Math.sin(time * l.pulseSpeed + l.pulseOffset);
            const intensity = (breathe + 1) / 2;
            const opacity = intensity * 0.04;

            // Coordinates
            const cxLine = l.x * w;
            const cyLine = l.y * h;
            const dx = Math.cos(l.angle);
            const dy = Math.sin(l.angle);

            const x0 = cxLine - dx * l.length / 2;
            const y0 = cyLine - dy * l.length / 2;
            const x1 = cxLine + dx * l.length / 2;
            const y1 = cyLine + dy * l.length / 2;

            const lineGrad = fx.createLinearGradient(x0, y0, x1, y1);
            lineGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
            lineGrad.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
            lineGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

            fx.save();
            fx.strokeStyle = lineGrad;
            fx.lineWidth = 0.5;
            fx.beginPath();
            fx.moveTo(x0, y0);
            fx.lineTo(x1, y1);
            fx.stroke();
            fx.restore();
          });

          finalAnimationFrameId = requestAnimationFrame(drawFinal);
        };

        finalAnimationFrameId = requestAnimationFrame(drawFinal);
      }
    }

    // Cleanup listeners and render loops
    return () => {
      if (resizeHeroListener) {
        window.removeEventListener("resize", resizeHeroListener);
      }
      if (heroAnimationFrameId) {
        cancelAnimationFrame(heroAnimationFrameId);
      }
      if (resizeFinalListener) {
        window.removeEventListener("resize", resizeFinalListener);
      }
      if (finalAnimationFrameId) {
        cancelAnimationFrame(finalAnimationFrameId);
      }
    };
  }, []);

  // Smooth scroll handler for nav clicks
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      {/* 1. NAVBAR */}
      <nav>
        <div className="nav-left">
          <div className="logo cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            ✦ AETHER
          </div>
        </div>
        <div className="nav-center">
          <div className="nav-links">
            <span onClick={() => scrollToSection("how-it-works")}>How it works</span>
            <span onClick={() => scrollToSection("features")}>Your Voice Card</span>
            <span onClick={() => scrollToSection("difference")}>The Difference</span>
            <span onClick={() => scrollToSection("pricing")}>Pricing</span>
          </div>
        </div>
        <div className="nav-right" style={{ gap: '1.5rem', alignItems: 'center' }}>
          <a href="https://x.com/TheAetherApp" target="_blank" rel="noopener noreferrer" className="nav-social-link">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" width="14" height="14">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </svg>
          </a>
          <button className="nav-btn" onClick={() => document.getElementById('final-cta')?.scrollIntoView({ behavior: 'smooth' })}>Get Early Access</button>
        </div>
      </nav>

      {/* 2. HERO */}
      <section className="hero bg-odd">
        <div style={{position:'absolute',top:'-10%',left:'-10%',width:'500px',height:'500px',background:'radial-gradient(circle, rgba(200,220,255,0.10) 0%, transparent 70%)',borderRadius:'50%',pointerEvents:'none',zIndex:0}} />

        <div style={{position:'absolute',top:'-10%',right:'-10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(200,220,255,0.07) 0%, transparent 70%)',borderRadius:'50%',pointerEvents:'none',zIndex:0}} />

        <canvas ref={heroCanvasRef} id="heroCanvas"></canvas>
        <div className="hero-inner">
          {/* Subtle radial glow bloom behind the headline to feel as if it is emanating light */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-full aspect-square bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.012)_45%,transparent_70%)] rounded-full pointer-events-none -z-10 blur-xl" />

          <div className="hero-pill">
            <span></span> AI TRAINED ON YOUR WRITING
          </div>
          <h1 className="hero-h1">
            AI that writes<br />
            <span className="dim font-sans font-medium"><TypewriterText text="exactly like you." delayMs={600} /></span>
          </h1>
          <p className="hero-sub" style={{ marginBottom: "11.25rem" }}>
            Feed it your writing once. Get content that sounds like you forever.
          </p>

          <div className="flex justify-center">
            <button 
              className="btn-white" 
              onClick={() => document.getElementById('final-cta')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Join the waitlist →
            </button>
          </div>

        </div>

        {/* Moving, infinitely repeating feature ticker pinned near the bottom */}
        <div className="hero-ticker-container font-mono text-[10px] sm:text-[11px] text-white select-none">
          <div className="hero-ticker-content whitespace-nowrap">
            {/* Block 1 */}
            <div className="flex items-center gap-x-10 pr-10 flex-shrink-0">
              {['SOUNDS LIKE YOU', 'NO TEMPLATES', 'EVERY FORMAT', 'YOUR TONE', 'YOUR RHYTHM', 'YOUR WORDS', 'EVERY PLATFORM'].map((item, i) => (
                <React.Fragment key={i}>
                  <span>✦ {item}</span>
                  <span>·</span>
                </React.Fragment>
              ))}
            </div>
            {/* Block 2 (Seamless clone) */}
            <div className="flex items-center gap-x-10 pr-10 flex-shrink-0" aria-hidden="true">
              {['SOUNDS LIKE YOU', 'NO TEMPLATES', 'EVERY FORMAT', 'YOUR TONE', 'YOUR RHYTHM', 'YOUR WORDS', 'EVERY PLATFORM'].map((item, i) => (
                <React.Fragment key={i}>
                  <span>✦ {item}</span>
                  <span>·</span>
                </React.Fragment>
              ))}
            </div>
            {/* Block 3 (Seamless clone) */}
            <div className="flex items-center gap-x-10 pr-10 flex-shrink-0" aria-hidden="true">
              {['SOUNDS LIKE YOU', 'NO TEMPLATES', 'EVERY FORMAT', 'YOUR TONE', 'YOUR RHYTHM', 'YOUR WORDS', 'EVERY PLATFORM'].map((item, i) => (
                <React.Fragment key={i}>
                  <span>✦ {item}</span>
                  <span>·</span>
                </React.Fragment>
              ))}
            </div>
            {/* Block 4 (Seamless clone) */}
            <div className="flex items-center gap-x-10 pr-10 flex-shrink-0" aria-hidden="true">
              {['SOUNDS LIKE YOU', 'NO TEMPLATES', 'EVERY FORMAT', 'YOUR TONE', 'YOUR RHYTHM', 'YOUR WORDS', 'EVERY PLATFORM'].map((item, i) => (
                <React.Fragment key={i}>
                  <span>✦ {item}</span>
                  <span>·</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="section bg-even" id="how-it-works">
        <p className="s-eyebrow">How it works</p>
        <h2 className="s-h2">
          Four steps to your voice,<br />
          at scale.
        </h2>
        <p className="s-sub">
          From raw writing samples to content that sounds exactly like you — in minutes.
        </p>

        <div className="hiw-agenda-container hidden md:grid">
          {/* Left panel: Agenda wheel + Bowing track on desktop */}
          <div className="hiw-agenda-left">
            <div className="agenda-wheel-wrapper">
              {/* Underlying SVG decoration circles, trails, and central Agenda disk */}
              <svg className="agenda-bg-svg" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="aetherGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
                    <stop offset="65%" stopColor="rgba(255, 255, 255, 0.02)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                  </radialGradient>
                  <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0.12)" />
                    <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                  </radialGradient>
                </defs>

                {/* Soft background ambient halo */}
                <circle cx="110" cy="225" r="130" fill="url(#aetherGlow)" pointerEvents="none" />

                {/* Bowing vertical arc path centered at cx=110, cy=225, radius=280 */}
                <path 
                  d="M 285,15 A 280,280 0 0,1 285,435" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.06)" 
                  strokeWidth="1" 
                  strokeLinecap="round"
                />

                {/* Concentric helper arcs and dash highlights */}
                <path 
                  d="M 285,15 A 280,280 0 0,1 285,435" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="1.5"
                  strokeDasharray="8 12" 
                  strokeLinecap="round"
                />

                {/* Concentric tracks around center (110, 225) */}
                <circle cx="110" cy="225" r="62" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" fill="none" />
                <circle cx="110" cy="225" r="76" stroke="rgba(255,255,255,0.06)" strokeWidth="0.75" className="track-dashed-glide" fill="none" strokeLinecap="round" />
                <circle cx="110" cy="225" r="95" stroke="rgba(255,255,255,0.05)" strokeWidth="0.75" className="track-dots-glide" fill="none" strokeLinecap="round" />

                {/* Animated Orbiting Dots / Particles on the lines */}
                <g className="orbit-group-1">
                  {/* Particle orbiting on the inner r=62 track */}
                  <circle cx="110" cy="163" r="1.7" fill="#ffffff" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.85))" }} />
                </g>
                <g className="orbit-group-2">
                  {/* Particle orbiting on the middle r=76 track */}
                  <circle cx="110" cy="149" r="1.5" fill="rgba(255,255,255,0.6)" />
                </g>
                <g className="orbit-group-3">
                  {/* Particle orbiting on the outer r=95 track */}
                  <circle cx="110" cy="130" r="1.8" fill="#ffffff" style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.85))" }} />
                  <circle cx="110" cy="320" r="1.2" fill="rgba(255,255,255,0.4)" />
                </g>

                {/* Decorative dots and curves styling matching sketch with subtle pulse */}
                <path d="M 45,160 A 82,82 0 0,1 110,143" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" className="pulsing-deco-arc" strokeLinecap="round" />
                <path d="M 110,307 A 82,82 0 0,1 40,265" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" className="pulsing-deco-arc" strokeLinecap="round" />

                <circle cx="32" cy="135" r="2.5" fill="rgba(255,255,255,0.2)" />
                <circle cx="49" cy="168" r="4.5" fill="#000" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <circle cx="205" cy="225" r="3.5" fill="rgba(255,255,255,0.35)" />
                <circle cx="155" cy="310" r="4" fill="#000" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <rect x="30" y="315" width="5" height="5" fill="#000" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
                
                {/* Center Core Black disk with glow background shadow */}
                <circle cx="110" cy="225" r="54" fill="url(#coreGlow)" pointerEvents="none" />
                <circle cx="110" cy="225" r="50" fill="#030303" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
                <circle cx="110" cy="225" r="46" fill="#070707" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                
                {/* Refined clean high-tech alignment tickmarks - drawn ON TOP of the core disk (above the line) and symmetric from r=50 to r=56 */}
                <line x1="110" y1="175" x2="110" y2="169" stroke="rgba(255,255,255,0.32)" strokeWidth="1" strokeLinecap="round" />
                <line x1="110" y1="275" x2="110" y2="281" stroke="rgba(255,255,255,0.32)" strokeWidth="1" strokeLinecap="round" />
                <line x1="60" y1="225" x2="54" y2="225" stroke="rgba(255,255,255,0.32)" strokeWidth="1" strokeLinecap="round" />
                <line x1="160" y1="225" x2="166" y2="225" stroke="rgba(255,255,255,0.32)" strokeWidth="1" strokeLinecap="round" />

                <text 
                  x="110" 
                  y="230" 
                  textAnchor="middle" 
                  fill="#ffffff" 
                  fontFamily="'Inter', sans-serif" 
                  fontWeight="600" 
                  fontSize="14" 
                  letterSpacing="0.08em"
                >
                  AETHER
                </text>
              </svg>

              {/* Node Overlay elements */}
              <div 
                className={`agenda-node ${activeStepIdx === 0 ? "active" : ""}`}
                style={{ top: "60px", left: "336px" }}
                onMouseEnter={() => setActiveStepIdx(0)}
              >
                <div className="agenda-node-label">Part 01</div>
                <div className="agenda-node-icon">
                  <span className="text-[13px] font-sans select-none leading-none">✦</span>
                </div>
              </div>

              <div 
                className={`agenda-node ${activeStepIdx === 1 ? "active" : ""}`}
                style={{ top: "170px", left: "384px" }}
                onMouseEnter={() => setActiveStepIdx(1)}
              >
                <div className="agenda-node-label">Part 02</div>
                <div className="agenda-node-icon">
                  <span className="text-[13px] font-sans select-none leading-none">✧</span>
                </div>
              </div>

              <div 
                className={`agenda-node ${activeStepIdx === 2 ? "active" : ""}`}
                style={{ top: "280px", left: "384px" }}
                onMouseEnter={() => setActiveStepIdx(2)}
              >
                <div className="agenda-node-label">Part 03</div>
                <div className="agenda-node-icon">
                  <span className="text-[13px] font-sans select-none leading-none">⟡</span>
                </div>
              </div>

              <div 
                className={`agenda-node ${activeStepIdx === 3 ? "active" : ""}`}
                style={{ top: "390px", left: "336px" }}
                onMouseEnter={() => setActiveStepIdx(3)}
              >
                <div className="agenda-node-label">Part 04</div>
                <div className="agenda-node-icon">
                  <span className="text-[13px] font-sans select-none leading-none">✺</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: text descriptions synced with index */}
          <div className="hiw-agenda-right">
            {howItWorksSteps.map((step, idx) => (
              <div 
                className={`agenda-text-block ${activeStepIdx === idx ? "active" : ""}`} 
                key={step.number}
                onMouseEnter={() => setActiveStepIdx(idx)}
                style={{ cursor: "pointer", touchAction: "manipulation" }}
              >
                <div className="agenda-text-header">
                  <span className="agenda-part-badge md:hidden">Part {step.number}</span>
                  <h3 className="agenda-title">{step.title}</h3>
                </div>
                <p className="agenda-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile vertical timeline visual (visible on screens < 768px) */}
        <div className="hiw-mobile-timeline">
          <div className="hiw-timeline-wrapper">
            {howItWorksSteps.map((step) => (
              <div className="hiw-timeline-item" key={step.number}>
                {/* Node column */}
                <div className="hiw-timeline-node-col">
                  <div className="hiw-timeline-node">
                    <span className="hiw-node-text">PART {step.number}</span>
                  </div>
                </div>
                {/* Content column */}
                <div className="hiw-timeline-content-col">
                  <div className="hiw-timeline-card">
                    <h3 className="hiw-timeline-title">{step.title}</h3>
                    <p className="hiw-timeline-desc">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE PERSONAL VOICE ENGINE */}
      <section className="section bg-odd" id="features" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <p className="s-eyebrow">Your Voice Card</p>
        <h2 className="s-h2">
          Classified & Locked.
        </h2>
        <p className="s-sub">
          One identity. Assigned to you. Locked in the system. No duplicates.
        </p>

        <div className="flex justify-center items-center py-8 sm:py-16 select-none perspective-[1500px]">
          <div 
            ref={voiceCardRef}
            onMouseMove={handleVoiceCardMouseMove}
            onMouseLeave={handleVoiceCardMouseLeave}
            className={`w-full max-w-[600px] aspect-[1.586/1] rounded-2xl p-8 sm:p-9 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#151518] via-[#09090a] to-[#020202] cursor-pointer select-none text-white font-sans transition-all duration-500 ease-out ${
              isVoiceCardHovered 
                ? "shadow-[0_45px_85px_rgba(0,0,0,0.95),0_0_25px_rgba(255,255,255,0.04)]" 
                : "shadow-[0_30px_75px_-15px_rgba(0,0,0,0.95)]"
            }`}
            style={{
              transform: isVoiceCardHovered ? "scale3d(1.025, 1.025, 1.025)" : "scale3d(1, 1, 1)",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease-out, box-shadow 0.4s ease-out",
            }}
          >
            {/* Subtle premium gradient border overlay */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500" style={{
              padding: "1px",
              background: `linear-gradient(135deg, rgba(255, 255, 255, ${isVoiceCardHovered ? '0.18' : '0.08'}), rgba(255, 255, 255, 0.01))`,
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }} />

            {/* Reflective shiny silver card glare overlay */}
            <div 
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `radial-gradient(circle at ${voiceCardGlare.x}% ${voiceCardGlare.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 45%, transparent 70%)`,
                opacity: voiceCardGlare.opacity,
                transition: "opacity 0.2s ease-out",
              }}
            />

            {/* Brushed-finish metal look */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:2px_100%]" />
            
            {/* Top Header Row */}
            <div className="flex items-center justify-between w-full relative z-10" style={{ transform: "translateZ(30px)" }}>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] sm:text-[12px] tracking-[0.24em] font-medium text-white/45 uppercase select-none">
                  AETHER VOICE ID
                </span>
                <span className="text-[12px] text-white/45 select-none opacity-85">✦</span>
              </div>
            </div>

            {/* Main Content Area split in left/right */}
            <div className="flex justify-between items-stretch flex-grow mt-6 sm:mt-8 relative z-10">
              
              {/* Left Column: Archetype Name, Description Quote */}
              <div className="flex flex-col justify-center w-[54%] text-left">
                
                {/* Archetype Label & Typography Title */}
                <div className="flex flex-col" style={{ transform: "translateZ(45px)" }}>
                  <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] text-white/30 uppercase select-none">
                    VOICE ARCHETYPE
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif tracking-[0.12em] font-medium text-white/95 uppercase select-none leading-none mt-2" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                    THE ARCHITECT
                  </h2>
                </div>

                {/* Description Quote precisely matching the prompt style */}
                <div className="mt-4 pl-4 border-l-[1px] border-white/10 opacity-90" style={{ transform: "translateZ(35px)" }}>
                  <p className="font-luxury italic text-white/80 text-[12.5px] sm:text-[13.5px] leading-relaxed tracking-wider select-none">
                    Turns complex ideas into<br />
                    inevitable conclusions.
                  </p>
                </div>

              </div>

              {/* Right Column: Waveform, Large Signature No */}
              <div className="flex flex-col justify-between items-end w-[44%] text-right relative">
                
                {/* Waveform visual at the top right of this column - bigger and more prominent */}
                <div className="w-[210px] h-[65px] opacity-90 select-none pointer-events-none mt-1" style={{ transform: "translateZ(30px)" }}>
                  <svg width="100%" height="100%" viewBox="0 0 170 55" fill="none" className="overflow-visible">
                    <path 
                      d="M 10 27.5 C 30 15, 40 40, 55 18 C 70 35, 85 10, 100 42 C 115 20, 130 33, 145 22 C 153 26, 160 27.5, 165 27.5" 
                      fill="none" 
                      stroke="rgba(255, 255, 255, 0.85)" 
                      strokeWidth="1.75" 
                      strokeLinecap="round" 
                      className="animate-pulse"
                      style={{ animationDuration: "2.8s" }}
                    />
                    <path 
                      d="M 10 27.5 C 22 17, 38 35, 48 20 C 62 30, 82 15, 98 32 C 108 22, 122 28, 140 25 C 148 27, 155 26, 165 27.5" 
                      fill="none" 
                      stroke="rgba(255, 255, 255, 0.28)" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                    />
                    <path 
                      d="M 10 27.5 Q 20 30, 30 24 T 50 27 T 70 27 T 90 24 T 110 27 T 130 26 T 150 29 T 165 27.5" 
                      fill="none" 
                      stroke="rgba(255, 255, 255, 0.1)" 
                      strokeWidth="0.75" 
                    />
                  </svg>
                </div>

                {/* VOICE NUMBER with XCIX - elegant serif, larger size, cleaner layout */}
                <div className="flex flex-col items-end text-right mt-auto pr-1" style={{ transform: "translateZ(45px)" }}>
                  <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] text-white/30 uppercase select-none">
                    VOICE NUMBER
                  </span>
                  <span className="text-2xl sm:text-3xl font-serif font-bold tracking-wider text-white select-none leading-none mt-2 shadow-sm" style={{ textShadow: "0 0 8px rgba(255, 255, 255, 0.35), 0 0 2px rgba(255, 255, 255, 0.7), 0 1px 1.5px rgba(0, 0, 0, 0.7)" }}>
                    #99
                  </span>
                </div>

              </div>

            </div>

            {/* Bottom Tags Bracket Strip - Spans entire card width */}
            <div className="w-full flex items-center gap-4 font-mono text-[11.5px] sm:text-[12.5px] text-[#b5b5bc]/85 mt-4 relative z-10 pl-0.5" style={{ transform: "translateZ(25px)" }}>
              <span className="opacity-90 tracking-widest uppercase font-mono">[Analytical]</span>
              <span className="text-white/20 font-light">•</span>
              <span className="opacity-90 tracking-widest uppercase font-mono">[Strategic]</span>
              <span className="text-white/20 font-light">•</span>
              <span className="opacity-90 tracking-widest uppercase font-mono">[Precise]</span>
            </div>

            {/* Sweeping laser line across card representing active processing */}
            <div className="absolute inset-x-[15px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent trio-scan-laser pointer-events-none" />

          </div>
        </div>
      </section>

      {/* 5. THE DIFFERENCE COMPARISON */}
      <section className="section bg-even" id="difference">
        <p className="s-eyebrow">The difference</p>
        <h2 className="s-h2">
          Everything AI writes sounds the same.
        </h2>
        <p className="s-sub">
          Your audience can feel the difference between you and a template. So can we.
        </p>

        <div className="compare-outer">
          <div className="compare-header">
            <div className="c-lbl bad">✕ Generic AI — Status: Rejected by audience</div>
            <div className="c-lbl good">✦ AETHER Engine — Status: Verified native</div>
          </div>
          <div className="compare-cards">
            {/* Bad AI Output */}
            <div className="cc bad">
              <div className="cc-badge bad">✕ Generic output</div>
              <p className="cc-text">
                "We are absolutely thrilled to announce the launch of our groundbreaking new product. This innovative solution leverages cutting-edge technology to deliver exceptional value to our stakeholders and the broader community."
              </p>
            </div>

            {/* Aether Custom Voice-Matched Output */}
            <div className="cc good">
              <div className="cc-badge good">✦ Voice matched</div>
              <p className="cc-text real">
                After 14 months building in silence — it's live.<br /><br />
                No launch events. No fluff. Just the thing we said we'd ship.
                <span className="cursor"></span>
              </p>

              {/* Progress Indicator */}
              <div className="cc-progress">
                <div className="cpp-header">
                  <span className="cpp-label">Authenticity Score</span>
                  <span className="cpp-dots">···</span>
                </div>
                <div className="cpp-score-row">
                  <span className="cpp-big">10/10</span>
                  <span className="cpp-badge">↑ 10 patterns matched</span>
                </div>
                <p className="cpp-sub" style={{ marginBottom: "8px" }}>
                  All 10 voice patterns detected
                </p>
                <div className="flex gap-[5px] items-center h-[20px] mt-3 select-none w-3/4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 h-[11.25px] rounded-[1.2px] bg-gradient-to-b from-white to-white/70 opacity-95 shadow-[0_0_6px_rgba(255,255,255,0.2)]"
                    />
                  ))}
                </div>
                <div className="flex justify-end items-center mt-3.5 border-t border-white/5 pt-2">
                  <span className="font-mono text-[8px] text-white/90 tracking-widest font-semibold uppercase">10/10 ✦</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VOICE INTELLIGENCE */}
      <section className="section bg-odd">
        <p className="s-eyebrow">Voice Intelligence</p>
        <h2 className="s-h2">
          Your voice runs deeper than you think.
        </h2>
        <p className="s-sub">
          Sentence rhythm. Word density. How you open, how you close. AETHER reads all of it — then uses it every time you generate.
        </p>

        <div className="radar-section">
          {/* Left details and metric bars */}
          <div className="radar-left">
            <h3>
              Five dimensions.<br />
              One fingerprint.
            </h3>
            <p>
              Most tools guess your style. AETHER measures it — across tone, rhythm, vocabulary, edge, and consistency — and locks those scores into every creation.
            </p>
            <div className="radar-metrics">
              {radarMetrics.map((m) => (
                <div className="rm" key={m.label}>
                  <span className="rm-label">{m.label}</span>
                  <div className="rm-bar row-span-1 rounded">
                    <motion.div 
                      className="rm-fill" 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.value}%` }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="rm-val"><CountUpValue target={m.value} /></span>
                </div>
              ))}
            </div>
          </div>

          {/* Right SVG Radar Diagram */}
          <div className="radar-right">

            <div className="radar-legend">
              <motion.div 
                className="rl-item"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <span className="rl-dot you"></span>
                <span>You</span>
              </motion.div>
              <motion.div 
                className="rl-item"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
              >
                <span className="rl-dot avg"></span>
                <span>Average writer</span>
              </motion.div>
            </div>

            <div 
              className="radar-svg-container" 
              style={{ width: "100%", maxWidth: "650px", margin: "0 auto", overflow: "visible" }}
            >
              <svg id="radarSvg" width="100%" height="auto" className="overflow-visible" viewBox="-45 -5 370 255" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
              <g transform="translate(140,140)">
                {/* dashed grid pentagons */}
                <polygon 
                  points="0,-100 95,-31 59,81 -59,81 -95,-31" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.06)" 
                  strokeWidth="0.5" 
                  strokeDasharray="3 4" 
                />
                <polygon 
                  points="0,-75 71,-23 44,61 -44,61 -71,-23" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="0.5" 
                  strokeDasharray="3 4" 
                />
                <polygon 
                  points="0,-50 48,-15 29,40 -29,40 -48,-15" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.04)" 
                  strokeWidth="0.5" 
                  strokeDasharray="3 4" 
                />
                <polygon 
                  points="0,-25 24,-8 15,20 -15,20 -24,-8" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.04)" 
                  strokeWidth="0.5" 
                  strokeDasharray="3 4" 
                />

                {/* axes spokes */}
                <line x1="0" y1="0" x2="0" y2="-100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="95" y2="-31" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="59" y2="81" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="-59" y2="81" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="-95" y2="-31" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

                {/* 'average writer' polygon — behind 'you' polygon */}
                <motion.polygon 
                  points="0,-53 41,-13 34,46 -29,37 -43,-14" 
                  fill="rgba(255,255,255,0.15)" 
                  stroke="rgba(255,255,255,0.25)" 
                  strokeWidth="1.0"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                  style={{ transformOrigin: "0px 0px" }}
                />

                {/* 'you' polygon — filled with brighter stroke */}
                <motion.polygon 
                  points="0,-88 68,-22 56,76 -48,62 -72,-24" 
                  fill="rgba(255,255,255,0.07)" 
                  stroke="rgba(255,255,255,0.5)" 
                  strokeWidth="1.2"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  style={{ transformOrigin: "0px 0px" }}
                />

                {/* you indicator dots (larger, bright) */}
                <motion.circle cx="0" cy="-88" r="6" fill="#fff" opacity="0.8"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 0.8 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.7 }}
                  style={{ transformOrigin: "0px -88px", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredPoint({ x: 0, y: -88, label: "Tone: 92" })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <motion.circle cx="68" cy="-22" r="6" fill="#fff" opacity="0.6"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 0.6 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.75 }}
                  style={{ transformOrigin: "68px -22px", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredPoint({ x: 68, y: -22, label: "Rhythm: 72" })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <motion.circle cx="56" cy="76" r="6" fill="#fff" opacity="0.8"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 0.8 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.8 }}
                  style={{ transformOrigin: "56px 76px", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredPoint({ x: 56, y: 76, label: "Vocabulary: 94" })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <motion.circle cx="-48" cy="62" r="6" fill="#fff" opacity="0.65"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 0.65 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.85 }}
                  style={{ transformOrigin: "-48px 62px", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredPoint({ x: -48, y: 62, label: "Edge: 78" })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <motion.circle cx="-72" cy="-24" r="6" fill="#fff" opacity="0.7"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 0.7 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.9 }}
                  style={{ transformOrigin: "-72px -24px", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredPoint({ x: -72, y: -24, label: "Consistency: 80" })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* label texts */}
                <text x="0" y="-110" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter,sans-serif">Tone</text>
                <text x="106" y="-28" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter,sans-serif">Rhythm</text>
                <text x="65" y="96" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter,sans-serif">Vocabulary</text>
                <text x="-102" y="96" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter,sans-serif">Edge</text>
                <text x="-102" y="-28" textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="Inter,sans-serif">Consistency</text>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredPoint && (
                    <motion.g 
                      initial={{ opacity: 0, x: hoveredPoint.x, y: hoveredPoint.y - 15 }}
                      animate={{ opacity: 1, x: hoveredPoint.x, y: hoveredPoint.y - 25 }}
                      exit={{ opacity: 0, x: hoveredPoint.x, y: hoveredPoint.y - 15 }}
                      transition={{ duration: 0.15 }}
                      style={{ pointerEvents: "none" }}
                    >
                      <foreignObject x="-75" y="-20" width="150" height="40" style={{ overflow: "visible" }}>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                          <div style={{
                            backgroundColor: '#0a0a0a',
                            color: '#fff',
                            border: '0.5px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            fontFamily: 'Inter, sans-serif',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                          }}>
                            {hoveredPoint.label}
                          </div>
                        </div>
                      </foreignObject>
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            </svg>
          </div>
        </div>
        </div>
      </section>

      {/* 7. PRICING */}
      <section className="section bg-even" id="pricing">
        <p className="s-eyebrow">Pricing</p>
        <h2 className="s-h2">Simple pricing. No surprises.</h2>
        <p className="s-sub">
          Start free. Upgrade when you're ready to scale your voice.
        </p>

        {/* Pricing toggle */}
        <div className="pricing-toggle">
          <span 
            className={`tog-opt ${!isAnnual ? "on" : ""}`} 
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </span>
          <span className="tog-sep">/</span>
          <span 
            className={`tog-opt ${isAnnual ? "on" : ""}`} 
            onClick={() => setIsAnnual(true)}
          >
            Annually <span className="save-pill">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid">
          {/* 1. Free plan */}
          <div className="pc">
            <div>
              <p className="pc-name">Free</p>
              <p className="pc-desc">Explore AETHER.</p>
            </div>
            
            <p className="pc-price">$0 <span>/ forever</span></p>

            <div className="pc-feats">
              <div className="pf"><div className="pf-dot"></div>15 creations per month</div>
              <div className="pf"><div className="pf-dot"></div>1 Voice Profile</div>
              <div className="pf"><div className="pf-dot"></div>All content types</div>
              <div className="pf"><div className="pf-dot"></div>7-day history</div>
              <div className="pf"><div className="pf-dot"></div>Basic voice analysis</div>
            </div>

            <button className="pc-btn w-full mt-auto" onClick={() => document.getElementById('final-cta')?.scrollIntoView({ behavior: 'smooth' })}>
              Get early access
            </button>
          </div>

          {/* 2. Pro Plan */}
          <div className="pc">
            <div>
              <p className="pc-name">Pro</p>
              <p className="pc-desc">Your voice. Unlimited.</p>
            </div>

            {!isAnnual ? (
              <p className="pc-price">$29 <span>/ month</span></p>
            ) : (
              <p className="pc-price">
                $23 <span style={{ fontSize: "13px" }}>/ month <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", marginLeft: "4px" }}>— billed annually ($276/yr)</span> <span className="save-pill" style={{ display: "inline-block", marginLeft: "6px" }}>save $72</span></span>
              </p>
            )}

            <div className="pc-feats">
              <div className="pf"><div className="pf-dot"></div>Unlimited creations</div>
              <div className="pf"><div className="pf-dot"></div>3 Voice Profiles</div>
              <div className="pf"><div className="pf-dot"></div>Personalized Voice Engine</div>
              <div className="pf"><div className="pf-dot"></div>All content types</div>
              <div className="pf"><div className="pf-dot"></div>Unlimited history</div>
              <div className="pf"><div className="pf-dot"></div>Authenticity score</div>
              <div className="pf"><div className="pf-dot"></div>Priority support</div>
              <div className="pf"><div className="pf-dot"></div>Early access to new features</div>
            </div>

            <button className="pc-btn w-full mt-auto" onClick={() => document.getElementById('final-cta')?.scrollIntoView({ behavior: 'smooth' })}>
              Get early access
            </button>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="section bg-odd">
        <p className="s-eyebrow">FAQ</p>
        <h2 className="s-h2">Questions answered.</h2>

        <div className="faq-wrap" style={{ marginTop: "3rem" }}>
          {faqList.map((item) => {
            const isOpen = !!openFaqIds[item.id];
            return (
              <div 
                className={`faq-item ${isOpen ? "open" : ""}`} 
                key={item.id}
                onClick={() => toggleFaq(item.id)}
              >
                <div className="faq-q">
                  {item.question}
                  <span className="faq-icon">+</span>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <p className="faq-a" style={{ display: "block" }}>
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. FINAL CTA SECTION */}
      <section className="final bg-even" id="final-cta">
        <div style={{position:'absolute',top:'-10%',left:'-10%',width:'250px',height:'250px',background:'radial-gradient(circle, rgba(200,220,255,0.04) 0%, transparent 70%)',borderRadius:'50%',pointerEvents:'none',zIndex:0}} />
        <div style={{position:'absolute',top:'-10%',right:'-10%',width:'200px',height:'200px',background:'radial-gradient(circle, rgba(200,220,255,0.03) 0%, transparent 70%)',borderRadius:'50%',pointerEvents:'none',zIndex:0}} />
        <div style={{position:'absolute',bottom:'-10%',left:'50%',transform:'translateX(-50%)',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(200,220,255,0.02) 0%, transparent 70%)',borderRadius:'50%',pointerEvents:'none',zIndex:0}} />
        <canvas ref={finalCanvasRef} id="finalCanvas"></canvas>
        <div className="final-inner">
          <p className="final-mark" style={{
            display: 'inline-block',
            fontSize: '1.15em',
            animation: 'starPulse 3s ease-in-out infinite',
          }}>✦</p>
          <h2 className="final-h2">
            Your voice. Captured once.<br />
            Written forever.
          </h2>
          <p className="final-sub">Free to start. No credit card required.</p>
          {!finalSuccess ? (
            <div className="w-full max-w-[480px] mx-auto mt-2">
              <form onSubmit={handleFinalSubmit} className="flex flex-col sm:flex-row items-stretch justify-center gap-3 w-full">
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  required
                  value={finalEmail}
                  onChange={(e) => setFinalEmail(e.target.value)}
                  className="bg-[#0c0c0c] border-[0.5px] border-white/20 text-white placeholder:text-white/35 text-[14px] px-[18px] py-[14px] rounded-[10px] focus:outline-none focus:border-white transition-colors duration-300 flex-grow"
                />
                <button type="submit" disabled={isSubmitting} className="btn-white whitespace-nowrap disabled:opacity-50">
                  {isSubmitting ? "Joining..." : "Join the waitlist →"}
                </button>
              </form>
              <p className="text-white/20 text-[13px] text-center mt-3 select-none">
                Be first.
              </p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="py-2 text-center mt-2"
            >
              <p className="text-white/55 text-[14px] select-none">
                ✦ You're on the list.
              </p>
              <p className="text-white/20 text-[13px] mt-2 select-none">
                Be first.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer>
        <span className="f-logo">✦ AETHER</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="https://x.com/TheAetherApp" target="_blank" rel="noopener noreferrer" className="nav-social-link">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" width="14" height="14">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </svg>
          </a>
          <span className="f-copy">© 2026 AETHER. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
