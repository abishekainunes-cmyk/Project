import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Code, Database, Brain, Sparkles, Workflow, Server, Cpu } from "lucide-react";

const AboutSection = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      angle += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = 95;

      // Draw 3 intersecting orbital HUD circles (Cyan, Lime, Rose)
      const circles = [
        { color: "rgba(34, 211, 238, 0.45)", offset: 0, label: "Retrieve" },
        { color: "rgba(163, 230, 53, 0.45)", offset: (2 * Math.PI) / 3, label: "Orchestrate" },
        { color: "rgba(244, 114, 182, 0.45)", offset: (4 * Math.PI) / 3, label: "Deliver" },
      ];

      circles.forEach((c) => {
        const x = cx + Math.cos(angle + c.offset) * 45;
        const y = cy + Math.sin(angle + c.offset) * 45;

        // Glowing circle outline
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Pulsing core dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();
      });

      // Central convergence nucleus
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section id="about" className="relative py-24 lab-grid border-t border-white/10 overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(163,230,53,0.06),transparent_42%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-left mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 border border-lime-300/30 bg-lime-300/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-lime-300 mb-3">
              <span>// 01 · Operator Dossier</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Operator Profile
            </h2>
          </div>
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 px-4 py-2.5 rounded-xl">
            <img 
              src="./abishek_avatar.png" 
              alt="Abishek Pranav" 
              className="w-11 h-11 rounded-full border border-cyan-400/50 object-cover shadow-md shadow-cyan-500/20"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://github.com/abishekainunes-cmyk.png"; }}
            />
            <div className="text-left font-mono">
              <div className="text-xs font-bold text-white">Abishek Pranav G V</div>
              <a 
                href="https://github.com/abishekainunes-cmyk" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-cyan-300 hover:underline block"
              >
                @abishekainunes-cmyk
              </a>
            </div>
          </div>
        </div>

        {/* Narrative & Triple Intersection Canvas Grid */}
        <div className="mb-16 grid items-center gap-10 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6 text-left">
            <p className="text-base sm:text-xl text-white/80 leading-relaxed font-light">
              My name is <span className="text-white font-semibold">Abishek Pranav G V</span>. I build software products powered by modern web technologies and applied artificial intelligence, transforming complex operational requirements into practical solutions through intelligent workflows, scalable architectures, and user-centered experiences.
            </p>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed">
              Combining an <span className="text-cyan-200 font-medium">MBA in Artificial Intelligence (in progress)</span> from JAIN University, a <span className="text-cyan-200 font-medium">BBA in Data Science & AI</span> from Woxsen University, and 3 years of rigorous Chartered Accountancy foundational training, I bridge the critical gap between technical machine learning pipelines and real-world commercial viability.
            </p>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed">
              At Nunes Instrumentation, I contributed to key operational automation initiatives including IGNIS, which classified and indexed over 19,000 Google Drive file records. My prior experience includes achieving a 30% reduction in export documentation processing time and a 50% reduction in recruitment screening time.
            </p>
          </div>

          {/* Triple Intersection Canvas Container */}
          <div className="mx-auto w-full max-w-[420px] p-6 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md text-center space-y-4">
            <div className="flex justify-between items-center text-[10px] font-mono text-white/40 pb-2 border-b border-white/10 uppercase tracking-widest">
              <span>Convergence Core</span>
              <span className="text-lime-300">Active Orbit</span>
            </div>
            
            <div className="relative aspect-square w-full flex items-center justify-center">
              <canvas 
                ref={canvasRef} 
                width={360} 
                height={360} 
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-[11px] font-mono text-white/60 border-t border-white/10 pt-3">
              <span className="text-cyan-300">Retrieve knowledge</span> · <span className="text-lime-300">Orchestrate workflows</span> · <span className="text-rose-300">Deliver outcomes</span>
            </div>
          </div>
        </div>

        {/* 3 Core Competency Cards in 1x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10 rounded-xl">
          
          {/* Card 1: Software Engineer */}
          <div className="h-full bg-slate-950/90 p-8 text-left transition-colors hover:bg-slate-900/90 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-300/10 border border-cyan-300/20 flex items-center justify-center mb-4 text-cyan-200">
              <Code className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Software Engineer</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Designs and builds high-throughput web applications, REST APIs, and interactive frontends (Next.js 16, React 19, TypeScript, Tailwind) with a focus on speed, reliability, and human-centered design.
            </p>
          </div>

          {/* Card 2: AI Engineer */}
          <div className="h-full bg-slate-950/90 p-8 text-left transition-colors hover:bg-slate-900/90 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-lime-300/10 border border-lime-300/20 flex items-center justify-center mb-4 text-lime-200">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">AI Engineer</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Builds intelligent systems powered by LLMs, retrieval systems (RAG), vector embeddings, and agentic prompt chains that solve measurable enterprise problems without hallucination.
            </p>
          </div>

          {/* Card 3: Systems Builder */}
          <div className="h-full bg-slate-950/90 p-8 text-left transition-colors hover:bg-slate-900/90 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-rose-300/10 border border-rose-300/20 flex items-center justify-center mb-4 text-rose-200">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Systems Builder</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Combines software engineering, operational automation, local on-prem LLMs (Ollama), and multi-account Workspace integrations to transform manual overhead into automated production systems.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default AboutSection;
