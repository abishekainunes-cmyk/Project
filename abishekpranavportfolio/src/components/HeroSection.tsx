import { motion } from "framer-motion";
import { 
  Terminal, 
  Cpu, 
  Braces, 
  MapPin, 
  ArrowRight, 
  FileText, 
  Eye,
  Sparkles, 
  ExternalLink,
  Github,
  Linkedin,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResumeViewer } from "@/context/ResumeViewerContext";

const HeroSection = () => {
  const { openResume } = useResumeViewer();
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-24 pb-16 lab-grid overflow-hidden">
      {/* Radial atmospheric ambient glows */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.12),transparent_38%),radial-gradient(ellipse_at_bottom_right,rgba(244,114,182,0.08),transparent_36%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
        
        {/* Left Column: Terminal Session & Identity */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 text-left"
        >
          {/* Eyebrow Chip */}
          <div className="inline-flex items-center gap-2 border border-cyan-300/30 bg-cyan-300/10 px-3.5 py-1.5 text-xs font-mono uppercase tracking-[0.28em] text-cyan-200">
            <Terminal className="h-3.5 w-3.5" />
            <span>Abishek's AI Engineering Desk</span>
          </div>

          {/* Terminal Session Window */}
          <div className="terminal-panel max-w-3xl rounded-xl overflow-hidden border border-white/10">
            {/* Top Bar with 3 Colored Dots */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-black/40">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[11px] font-mono text-white/40">identity.session // bash</span>
            </div>

            {/* Terminal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="font-mono text-xs sm:text-sm text-cyan-200">
                <span className="text-lime-300">abishek@desk</span>
                <span className="text-white/40">:</span>
                <span className="text-sky-300">~</span>
                <span className="text-white/50">$</span> whoami
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold leading-tight text-white tracking-tight">
                Abishek Pranav G V builds intelligent software systems.
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-white/70 max-w-2xl font-normal">
                I design and ship AI-powered applications, operational automations, and data-driven systems by connecting language models, retrieval pipelines, backend microservices, and intuitive user experiences.
              </p>

              {/* Lab Chips */}
              <div className="grid gap-2.5 sm:grid-cols-3 pt-2 font-mono">
                <div className="lab-chip">
                  <Cpu className="h-4 w-4 text-cyan-200" />
                  <span className="text-xs text-white/90">Applied AI & LLMs</span>
                </div>
                <div className="lab-chip">
                  <Braces className="h-4 w-4 text-lime-200" />
                  <span className="text-xs text-white/90">Intelligent Automation</span>
                </div>
                <div className="lab-chip">
                  <MapPin className="h-4 w-4 text-rose-200" />
                  <span className="text-xs text-white/90">Coimbatore, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="h-11 px-7 rounded-md bg-cyan-300 text-slate-950 hover:bg-cyan-200 font-bold text-sm shadow-lg shadow-cyan-300/20 border-none transition"
            >
              <a href="#projects">
                Run Project Cases <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 px-6 rounded-md border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-cyan-100 text-sm font-medium transition"
            >
              <a href="#contact">
                Want to build software?
              </a>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={openResume}
              className="h-11 px-4 rounded-md text-white/70 hover:text-white hover:bg-white/[0.04] text-xs font-mono transition cursor-pointer"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5 text-cyan-300" /> View Resume
            </Button>
          </div>

        </motion.div>

        {/* Right Column: Profile Scan Telemetry Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <div className="scan-card w-full max-w-md rounded-xl overflow-hidden border border-white/10">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/60">
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-white/50">
                profile.scan // telemetry
              </span>
              <span className="flex items-center gap-1.5 font-mono text-xs text-lime-400">
                <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                online · 20 live
              </span>
            </div>

            {/* Portrait Scan Viewport */}
            <div className="p-5">
              <div className="relative aspect-[4/4.5] overflow-hidden rounded-lg border border-cyan-300/20 bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
                {/* Animated Horizontal Laser Scan Line */}
                <div className="scan-line" />

                {/* Styled Profile Picture with Telemetry Scan Overlay */}
                <div className="w-full h-full relative flex flex-col items-center justify-end text-center p-6 pb-16 overflow-hidden">
                  <img
                    src="./abishek_avatar.png"
                    alt="Abishek Pranav G V"
                    className="absolute inset-0 w-full h-full object-cover object-center filter contrast-105 brightness-95"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://github.com/abishekainunes-cmyk.png";
                    }}
                  />
                  {/* High-tech gradient overlay for legible typography */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  {/* Identity Monogram & Details */}
                  <div className="relative z-10 space-y-1">
                    <div className="text-base font-bold text-white tracking-wide drop-shadow-md">
                      Abishek Pranav G V
                    </div>
                    <div className="text-xs text-cyan-300 font-mono drop-shadow">
                      AI Engineer & Systems Architect
                    </div>
                    <div className="text-[11px] text-white/70 max-w-[260px] drop-shadow">
                      MBA in Artificial Intelligence · BBA Data Science & AI
                    </div>
                  </div>
                </div>

                {/* Bottom Overlay Pill */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs text-cyan-200 font-bold">NUNES Applied AI</div>
                    <div className="text-[10px] text-white/50">100% Deployed Repositories</div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[10px] font-mono text-cyan-300">
                    V3.2 VERIFIED
                  </div>
                </div>
              </div>

              {/* 4-Cell Telemetry Stats Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="border border-white/10 bg-white/[0.02] p-2.5 rounded-lg">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">focus</div>
                  <div className="mt-0.5 text-white/90 text-xs font-semibold">AI-Powered Systems</div>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-2.5 rounded-lg">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">stack</div>
                  <div className="mt-0.5 text-white/90 text-xs font-semibold">Next.js + Python + LLMs</div>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-2.5 rounded-lg">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">signal</div>
                  <div className="mt-0.5 text-white/90 text-xs font-semibold">Zero-Loss Business Value</div>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-2.5 rounded-lg">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">status</div>
                  <div className="mt-0.5 text-emerald-400 text-xs font-semibold">24/24 Repos Live</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
