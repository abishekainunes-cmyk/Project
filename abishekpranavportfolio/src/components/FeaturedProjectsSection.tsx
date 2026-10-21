import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ExternalLink, 
  Github, 
  FlaskConical, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  Share2,
  FileSpreadsheet,
  FileText,
  BarChart3,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProjectCase {
  id: string;
  caseNum: string;
  category: "AI Systems" | "Enterprise Automation" | "Machine Learning & Analytics";
  title: string;
  tagline: string;
  liveUrl: string;
  githubUrl: string;
  before: string;
  built: string;
  after: string;
  summary: string;
  stack: string[];
  imageMockColor: string;
}

const projectCases: ProjectCase[] = [
  {
    id: "catalogue-studio",
    caseNum: "01",
    category: "AI Systems",
    title: "NUNES Catalogue Studio (IndiaMART AI Catalog Studio)",
    tagline: "Multimodal AI Vision & Vector PDF Synthesis Engine",
    liveUrl: "https://indiamart-ai-catalog-studio.vercel.app",
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/IndiaMART-AI-Content-Catalog-Generator",
    before: "Industrial sales teams spent 35–45 minutes manually transcribing instrument specs, verifying tolerances, and compiling PDF catalogs for marketplace buyers.",
    built: "Next.js 16, React 19, multimodal vision prompt chaining, ReportLab 4.1 vector engine, and evidence-locked parameter verification.",
    after: "Catalog generation time reduced by 98% (<45 seconds), producing print-ready 300-DPI vector PDFs with zero hallucinated specifications.",
    summary: "An autonomous multimodal studio that ingests raw supplier imagery, extracts technical parameters, and renders branded commercial PDF catalogs.",
    stack: ["Next.js 16", "Multimodal GenAI", "ReportLab 4.1", "Tailwind CSS", "Vercel"],
    imageMockColor: "from-cyan-900/60 to-slate-950"
  },
  {
    id: "social-command-center",
    caseNum: "02",
    category: "Enterprise Automation",
    title: "NUNES Social Media Command Center",
    tagline: "Multi-Tenant Enterprise Social & Lead Flow Orchestrator",
    liveUrl: "https://nunessocialpostmachine-app.vercel.app",
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/social-command-center",
    before: "Disjointed manual posting across LinkedIn, Facebook, and Instagram caused multi-day lead response latency and inconsistent brand presence.",
    built: "Unified Next.js 16 hub integrating Meta Graph API v24.0, LinkedIn REST APIs, WhatsApp Cloud API, and AES-256-GCM encrypted token persistence.",
    after: "Simultaneous 1-click multi-platform publishing and automated routing of ad inquiries directly into sales rep WhatsApp sessions.",
    summary: "Autonomous social media publishing hub with real-time lead routing and encrypted credential governance.",
    stack: ["Next.js 16", "React 19", "Meta Graph API", "WhatsApp Cloud", "AES-256-GCM"],
    imageMockColor: "from-purple-900/60 to-slate-950"
  },
  {
    id: "smart-price-master",
    caseNum: "03",
    category: "Enterprise Automation",
    title: "Smart Price Master & Quotation Engine",
    tagline: "Cloud Price Book Synchronizer & Vector Mini-Catalog Dispatcher",
    liveUrl: "https://smart-price-master.vercel.app",
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Smart-Price-Master-Catalog-Generator",
    before: "Sales reps struggled to calculate progressive volume discounts and margin floors across thousands of testing instrument SKUs during live client negotiations.",
    built: "Google Drive API change watcher, automated tiered margin calculator (retail, wholesale, distributor), dynamic QR generator, and ReportLab PDF compiler.",
    after: "Instant generation of GST-compliant quote packets with embedded showroom QR codes, dispatched directly via WhatsApp Business in seconds.",
    summary: "B2B sales automation system synchronizing cloud price books and emitting instant branded quotation PDFs.",
    stack: ["Google Drive API", "ReportLab", "OpenPyXL", "QRCode", "WhatsApp API"],
    imageMockColor: "from-emerald-900/60 to-slate-950"
  },
  {
    id: "crm-orchestration",
    caseNum: "04",
    category: "Enterprise Automation",
    title: "Serverless B2B AI CRM Platform",
    tagline: "Google Apps Script Serverless Lead Triage & Product Master",
    liveUrl: "https://nunes-b2b-ai-crm.vercel.app",
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Crm",
    before: "Inbound buyer RFQs arriving across sales inboxes were delayed by 24–48 hours due to manual CRM data entry and slow catalog SKU lookups.",
    built: "Serverless Google Apps Script backend with 14 modular services, NLP heuristic lead entity parsing, Levenshtein distance SKU matching, and Gmail OAuth2.",
    after: "Inbound RFQs automatically parsed into commercial line-items and matched to 1,200+ inventory SKUs with 95%+ confidence scores.",
    summary: "Serverless enterprise B2B CRM combining automated NLP lead intent parsing and catalog fuzzy lookups.",
    stack: ["Google Apps Script", "Google Sheets DB", "Gmail OAuth2", "NLP Heuristics"],
    imageMockColor: "from-teal-900/60 to-slate-950"
  },
  {
    id: "temp-cleaner",
    caseNum: "05",
    category: "Enterprise Automation",
    title: "Autonomous System Temp Cleaner Daemon",
    tagline: "Zero-Downtime Windows Storage Maintenance Background Daemon",
    liveUrl: "https://autonomous-system-temp-cleaner.vercel.app",
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Autonomous-System-Temp-Cleaner",
    before: "Heavy developer environments and industrial workstations accumulated 15–20 GB of temporary cache files monthly, degrading workstation I/O.",
    built: "Windows API daemon with Win32 file-lock bypass algorithms, scheduled every 4 hours via Windows Task Scheduler with full audit logging.",
    after: "Reclaimed up to 15.4 GB of system storage per cycle with zero system interruption or accidental deletion of locked application handles.",
    summary: "Autonomous Windows daemon purging transient caches while respecting active OS lock handles.",
    stack: ["Windows API", "Python 3.12", "Task Scheduler", "Win32 Security"],
    imageMockColor: "from-blue-900/60 to-slate-950"
  },
  {
    id: "retail-forecasting",
    caseNum: "06",
    category: "Machine Learning & Analytics",
    title: "Retail Sales Performance Predictive Analytics",
    tagline: "Enterprise Econometric Forecasting & Reorder Point (ROP) Model",
    liveUrl: "https://retail-sales-predictive-analytics.vercel.app",
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Retail-Sales-Performance-Predictive-Analytics",
    before: "Stockouts and over-inventory conditions caused 12% revenue leakage due to static historical reorder thresholds.",
    built: "SQL Server POS pipeline analyzing 500K+ transaction records, comparing Facebook Prophet vs. Box-Jenkins ARIMA, and dynamic lead-time ROP calculation.",
    after: "Achieved 86.4% directional forecasting accuracy and optimized safety stock buffers across 18 product categories.",
    summary: "Quantitative forecasting studio comparing machine learning and econometric seasonality models.",
    stack: ["SQL Server", "Facebook Prophet", "ARIMA", "Power BI", "Python"],
    imageMockColor: "from-amber-900/60 to-slate-950"
  }
];

const categories = ["All Projects", "AI Systems", "Enterprise Automation", "Machine Learning & Analytics"] as const;

const FeaturedProjectsSection = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All Projects");

  const filteredCases = projectCases.filter(
    (c) => activeCategory === "All Projects" || c.category === activeCategory
  );

  return (
    <section id="projects" className="relative py-24 lab-grid border-t border-white/10 overflow-hidden">
      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.76),rgba(2,6,23,0.96))] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center gap-2 border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-cyan-200 mb-3">
            <span>// 03 · Deployed Case Files</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Project Case Files
          </h2>
          <p className="text-base text-white/60 mt-3 max-w-2xl font-normal">
            Each case file shows what changed: the operational bottleneck before, the engineering architecture built, and the measurable business outcome after.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2.5 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-mono rounded transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-cyan-300 text-slate-950 font-bold shadow-md shadow-cyan-300/20"
                  : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Case Files Stack */}
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {filteredCases.map((caseItem) => (
              <motion.article
                key={caseItem.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="case-file grid overflow-hidden border border-white/10 bg-slate-950/90 rounded-xl transition-all duration-300 hover:border-cyan-300/30 lg:grid-cols-[0.82fr_1.18fr]"
              >
                {/* Left: Interactive Visual Simulation Viewport */}
                <div className={`relative min-h-[260px] bg-gradient-to-br ${caseItem.imageMockColor} p-6 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10`}>
                  
                  {/* Subtle Grid Lines in preview */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none lab-grid" />

                  {/* Top Case Badge */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 border border-cyan-200/25 bg-slate-950/80 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em] text-cyan-200 rounded">
                      <FlaskConical className="h-3.5 w-3.5 text-cyan-300" />
                      <span>Case {caseItem.caseNum}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] font-mono text-emerald-400 font-semibold">
                      VERIFIED LIVE
                    </span>
                  </div>

                  {/* Centered Graphic / Title Mockup */}
                  <div className="relative z-10 my-6">
                    <div className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest">{caseItem.category}</div>
                    <h4 className="text-xl font-bold text-white tracking-tight mt-1">{caseItem.title}</h4>
                    <p className="text-xs text-white/50 mt-1 font-mono">{caseItem.tagline}</p>
                  </div>

                  {/* Bottom Preview Button */}
                  <div className="relative z-10 flex items-center gap-2">
                    <a
                      href={caseItem.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs font-mono transition shadow-lg shadow-cyan-300/10"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Live Preview</span>
                    </a>

                    <a
                      href={caseItem.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/20 bg-black/60 hover:bg-black/90 text-white font-mono text-xs transition"
                    >
                      <Github className="h-3.5 w-3.5" />
                      <span>Source</span>
                    </a>
                  </div>
                </div>

                {/* Right: Before / Built / After Tri-Column Diagnostic */}
                <div className="flex flex-col p-6 sm:p-7 justify-between space-y-6">
                  
                  {/* Tri-Column Comparison */}
                  <div className="grid gap-4 md:grid-cols-3">
                    
                    {/* 1. BEFORE */}
                    <div className="border-l-2 pl-3.5 border-white/10 space-y-1.5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rose-300/80 font-bold">
                        // 01 Before
                      </div>
                      <p className="text-xs leading-relaxed text-white/60">
                        {caseItem.before}
                      </p>
                    </div>

                    {/* 2. BUILT */}
                    <div className="border-l-2 pl-3.5 border-white/10 space-y-1.5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-lime-300/80 font-bold">
                        // 02 Built
                      </div>
                      <p className="text-xs leading-relaxed text-white/60">
                        {caseItem.built}
                      </p>
                    </div>

                    {/* 3. AFTER (Highlighted in Cyan Glow) */}
                    <div className="border-l-2 pl-3.5 border-cyan-300 bg-cyan-300/[0.04] p-3 rounded-r-lg space-y-1.5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200 font-bold">
                        // 03 After (Outcome)
                      </div>
                      <p className="text-xs leading-relaxed text-white/90 font-medium">
                        {caseItem.after}
                      </p>
                    </div>

                  </div>

                  {/* Summary Narrative */}
                  <p className="text-xs text-white/50 leading-relaxed font-mono">
                    {caseItem.summary}
                  </p>

                  {/* Tech Stack Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/10">
                    {caseItem.stack.map((tech) => (
                      <span
                        key={tech}
                        className="border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-mono text-white/70 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                </div>

              </motion.article>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default FeaturedProjectsSection;
