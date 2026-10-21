import React, { useState, useEffect } from "react";
import { useResumeViewer } from "@/context/ResumeViewerContext";
import { 
  X, 
  FileText, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Code2, 
  ExternalLink,
  ShieldCheck,
  Maximize2
} from "lucide-react";

export const ResumeViewerModal: React.FC = () => {
  const { isOpen, closeResume } = useResumeViewer();
  const [activeTab, setActiveTab] = useState<"document" | "digital">("document");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeResume();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeResume]);

  // Lock background scroll when open without layout shifts
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setZoomLevel(100);
      setIsFullscreen(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 75));
  const handleZoomReset = () => setZoomLevel(100);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeResume();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Executive Resume Viewer"
    >
      <div 
        className={`relative w-full ${isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[90vh] max-w-5xl"} flex flex-col bg-slate-950/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden transition-all duration-300`}
      >
        {/* Top Executive Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  ABISHEK PRANAV G V
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" /> Verified CV
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Generative AI &amp; Automation Developer · Interactive View
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
            <button
              onClick={() => setActiveTab("document")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === "document"
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document View</span>
            </button>
            <button
              onClick={() => setActiveTab("digital")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === "digital"
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Digital View</span>
            </button>
          </div>

          {/* Controls & Close */}
          <div className="flex items-center gap-1.5">
            {activeTab === "document" && (
              <div className="hidden md:flex items-center gap-1 pr-2 border-r border-white/10">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-cyan-300 w-10 text-center select-none">
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={closeResume}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 border border-transparent transition-all ml-1"
              aria-label="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-slate-950/70 p-2 sm:p-4">
          {activeTab === "document" ? (
            /* TAB 1: Document View */
            <div className="w-full h-full flex flex-col items-center justify-start min-h-[500px]">
              <div 
                className="w-full h-full transition-transform duration-200 origin-top rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-white"
                style={{ transform: `scale(${zoomLevel / 100})`, height: `${100 * (100 / zoomLevel)}%` }}
              >
                <iframe
                  src="./Abishek_Pranav_Resume.pdf#toolbar=0&navpanes=0&view=FitH"
                  title="Abishek Pranav Resume PDF"
                  className="w-full h-full border-0 select-none"
                />
              </div>
            </div>
          ) : (
            /* TAB 2: Interactive Digital View */
            <div className="max-w-3xl mx-auto space-y-6 py-4 px-2 sm:px-6 text-slate-200">
              {/* Header Box */}
              <div className="p-6 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      ABISHEK PRANAV G V
                    </h1>
                    <p className="text-sm font-semibold text-cyan-300">
                      Generative AI &amp; Automation Developer | Python | Business Analytics | AI Solutions
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-400 space-y-0.5">
                    <div>Coimbatore, Tamil Nadu, India</div>
                    <div>+91 63835 00484</div>
                    <div className="text-cyan-400">Abishekpranav403@gmail.com</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10 text-xs font-mono">
                  <a
                    href="https://www.linkedin.com/in/abishek-pranav-g-v-/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-300 hover:underline"
                  >
                    LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-600">•</span>
                  <a
                    href="https://github.com/abishekainunes-cmyk/Project"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-300 hover:underline"
                  >
                    GitHub Master Monorepo <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-600">•</span>
                  <a
                    href="https://abishekpranavportfolio.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-300 hover:underline"
                  >
                    Live Portfolio <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Professional Summary */}
              <div className="space-y-2">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Professional Summary
                </h2>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-sm leading-relaxed text-slate-300">
                  Generative AI and Business Automation professional with hands-on experience developing AI-assisted applications, operational automation workflows, and data-driven business tools. Experienced in Python, REST APIs, Google Workspace integrations, product research automation, and business analytics. Contributed to automation initiatives at Nunes Instrumentation, including IGNIS, which indexed over 19,000 Google Drive file records. Previous experience includes a 30% reduction in export documentation processing time and a 50% reduction in recruitment screening time. Currently pursuing an MBA in Artificial Intelligence.
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Professional Experience
                </h2>
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Generative AI &amp; Forward Deployed Engineer
                      </h3>
                      <div className="text-xs text-cyan-300 font-mono">Nunes Instrumentation</div>
                    </div>
                    <div className="text-xs font-mono px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 w-fit">
                      Aug 2026 – Present
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs leading-relaxed text-slate-300 list-disc list-inside">
                    <li>Built IGNIS, a system that indexed over 19,000 files in Google Drive into structured Google Sheets using Google Apps Script and Drive API.</li>
                    <li>Developed an automated recruitment screening pipeline using Google Sheets, Forms, and AI-assisted candidate shortlisting, reducing initial screening time by 50%.</li>
                    <li>Designed and implemented automated export documentation workflows that cut document preparation time by 30%.</li>
                    <li>Created an automated product research engine using Apify, Google Gemini API, and custom Python scripts for competitive intelligence.</li>
                    <li>Engineered an AI-powered social media content generation pipeline producing platform-specific marketing materials.</li>
                    <li>Built an intelligent B2B lead capture and customer inquiry management system with automated tagging and response workflows.</li>
                  </ul>
                </div>
              </div>

              {/* Technical Skills */}
              <div className="space-y-3">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5" /> Technical Skills
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <span className="font-bold text-cyan-300 font-mono">Programming &amp; Automation:</span>
                    <p className="text-slate-300">Python, REST APIs, Google Apps Script, Streamlit, Git, Selenium, Web Scraping (BeautifulSoup, Apify)</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <span className="font-bold text-cyan-300 font-mono">Generative AI &amp; Tooling:</span>
                    <p className="text-slate-300">Google Gemini API, OpenAI API, Anthropic Claude, Prompt Engineering, Multimodal AI, RAG Systems, Cursor, v0</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <span className="font-bold text-cyan-300 font-mono">Business Analytics &amp; Ops:</span>
                    <p className="text-slate-300">Process Automation, Competitive Intelligence, Lead Generation, Export Documentation, Recruitment Screening</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                    <span className="font-bold text-cyan-300 font-mono">Data &amp; Cloud Tools:</span>
                    <p className="text-slate-300">Google Workspace APIs (Drive, Sheets, Docs, Gmail), Pandas, NumPy, SQL, Vercel, Supabase</p>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="space-y-3">
                <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" /> Education &amp; Foundational Training
                </h2>
                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="font-bold text-white">MBA in Artificial Intelligence (In Progress)</div>
                      <div className="text-slate-400 font-mono">JAIN (Deemed-to-be University)</div>
                    </div>
                    <div className="text-cyan-300 font-mono text-[11px]">Bangalore, India · Expected 2026</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="font-bold text-white">BBA in Data Science &amp; Artificial Intelligence</div>
                      <div className="text-slate-400 font-mono">Woxsen University</div>
                    </div>
                    <div className="text-cyan-300 font-mono text-[11px]">Hyderabad, India · Graduated 2024</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="font-bold text-white">Chartered Accountancy (Foundation &amp; Intermediate Training)</div>
                      <div className="text-slate-400 font-mono">ICAI — 3 Years Foundational Coursework</div>
                    </div>
                    <div className="text-cyan-300 font-mono text-[11px]">Financial Accounting, Corporate Law, Cost Management</div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">In-Browser Interactive Viewer</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">Esc</kbd> or click outside to dismiss</span>
            <button
              onClick={closeResume}
              className="text-cyan-300 hover:text-cyan-200 font-bold transition-colors"
            >
              Done Viewing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
