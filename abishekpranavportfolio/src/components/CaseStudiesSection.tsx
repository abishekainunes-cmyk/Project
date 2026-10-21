import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileSpreadsheet, 
  Share2, 
  HardDrive, 
  Globe, 
  BarChart3, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Workflow, 
  ShieldAlert, 
  Sparkles, 
  ExternalLink,
  BookOpen,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  problem: string;
  constraints: string[];
  architecture: string;
  implementation: string[];
  decisions: string[];
  testing: string[];
  results: string[];
  lessons: string[];
  liveUrl?: string;
  githubUrl: string;
}

const caseStudiesData: CaseStudy[] = [
  {
    id: "catalogue-studio",
    title: "NUNES AI Catalogue Studio",
    subtitle: "Multimodal Spec Extraction, Evidence-Locked Guardrails & Vector PDF Engine",
    icon: FileSpreadsheet,
    problem: "B2B sales teams at Nunes Instrumentation were spending 35–45 minutes per catalog manually extracting technical specifications from supplier PDFs and compiling customer quotations. Transcription errors caused inaccurate pricing and quotation discrepancies.",
    constraints: [
      "Zero tolerance for hallucination in electrical/mechanical ratings (voltage, tolerance, capacity)",
      "High-resolution vector PDF generation with print-ready 300-DPI assets in < 3 seconds",
      "Must execute reliably in standard browser environments without expensive GPU infrastructure"
    ],
    architecture: "Ingestion Stream (PDF/Image) → Multimodal Vision OCR Engine → Evidence-Locked Pydantic Schema Validator → ReportLab 4.1 Vector PDF Layout Compiler → Vercel Edge Runtime.",
    implementation: [
      "Engineered an autonomous multimodal parsing layer cross-referencing extracted specs with original source bounding boxes",
      "Implemented a strict Pydantic JSON validation schema preventing model output drifts before document rendering",
      "Created a deterministic vector PDF compilation engine that formats multi-column brochures with embedded QR links"
    ],
    decisions: [
      "Selected client-assisted OCR with server-side validation over end-to-end cloud APIs to reduce operating token costs by 95%",
      "Employed deterministic ReportLab flowable primitives instead of headless browser HTML-to-PDF to guarantee millimeter-accurate print margins"
    ],
    testing: [
      "Benchmarked across 100+ industrial instrumentation brochures spanning civil engineering, agricultural, and electrical equipment",
      "Achieved 100% extraction accuracy on standardized numeric specification tables with automated ground-truth diff tests"
    ],
    results: [
      "Catalogue compilation time plummeted from 45 minutes to < 45 seconds (>98% reduction)",
      "Eliminated 100% of manual transcription and formatting errors in dispatched sales packets",
      "Successfully deployed to production at indiamart-ai-catalog-studio.vercel.app"
    ],
    lessons: [
      "In enterprise AI, unconstrained LLM generation is unusable for engineering catalogs; grounding output in structured schemas is mandatory",
      "Pre-caching product category visual indexes drastically reduces runtime latency during live client calls"
    ],
    liveUrl: "https://indiamart-ai-catalog-studio.vercel.app",
    githubUrl: "https://github.com/AbishekPranavGV/IndiaMART-AI-Content-Catalog-Generator"
  },
  {
    id: "social-command-center",
    title: "Autonomous Social Command Center",
    subtitle: "Multi-Platform Marketing Orchestrator & WhatsApp Direct Lead Routing",
    icon: Share2,
    problem: "B2B industrial marketing was siloed across multiple disconnected platforms (LinkedIn, Facebook, Instagram, WhatsApp), leading to fragmented content schedules and an average 4-hour delay in responding to commercial inquiries.",
    constraints: [
      "Meta Graph API v24 and LinkedIn REST API rate limiting and token lifetime expiration policies",
      "Multi-tenant cryptographic isolation of enterprise OAuth2 credentials without database leaks",
      "Sub-second WhatsApp lead notification dispatch to sales engineers upon social ad engagement"
    ],
    architecture: "Next.js 16 App Router → Server Actions with AES-256-GCM Token Store → Meta Graph API v24 / LinkedIn REST Dispatcher → Event-Driven Webhook Listener → Real-Time Sales Notification Pipeline.",
    implementation: [
      "Constructed a unified single-pane-of-glass dashboard for multi-channel content composition and scheduling",
      "Integrated AES-256-GCM authenticated encryption for storing customer OAuth2 refresh tokens securely",
      "Configured automated WhatsApp Cloud API webhook listeners that capture inbound lead queries and route them to sales reps"
    ],
    decisions: [
      "Adopted Next.js 16 with Turbopack for sub-second build times and streamlined server action execution",
      "Used decoupled platform adapters so changes to Meta's Graph API schemas do not affect LinkedIn or WhatsApp pipelines"
    ],
    testing: [
      "Executed end-to-end integration tests simulating multi-account concurrent token refreshes and scheduled publishing",
      "Validated webhook cryptographic signature authentication using SHA-256 HMAC verification against fake payloads"
    ],
    results: [
      "Single-click simultaneous broadcast across LinkedIn, Facebook, and Instagram",
      "Reduced lead response time from ~4 hours to under 30 seconds via instant WhatsApp routing",
      "Deployed and running live in production at nunessocialpostmachine-app.vercel.app"
    ],
    lessons: [
      "Enterprise social media automation requires treating API tokens as critical cryptographic secrets with automatic rotation",
      "Separating content generation logic from platform dispatch adapters ensures resilience against upstream API deprecations"
    ],
    liveUrl: "https://nunessocialpostmachine-app.vercel.app",
    githubUrl: "https://github.com/AbishekPranavGV/social-command-center"
  },
  {
    id: "autonomous-temp-cleaner",
    title: "Autonomous System Temp Cleaner",
    subtitle: "Win32 In-Use File Lock Bypass & 4-Hour Background Automation",
    icon: HardDrive,
    problem: "Development environments and compile kiosks rapidly accumulate 15–30 GB of transient files, browser GPU caches, and crash dumps monthly. Disk bloat causes ENOSPC compilation failures and directory traversal latency.",
    constraints: [
      "Must never interrupt active compilers, browsers, or background developer processes",
      "Absolute zero-data-loss guarantee: must never touch user Desktop, Documents, or Windows System32",
      "Must execute silently without intrusive user elevation (UAC) prompts during active work"
    ],
    architecture: "Windows Task Scheduler (4-Hour Trigger) → Elevated NT AUTHORITY\\SYSTEM Daemon → Safe Path Boundary Validator → Multi-Threaded FindFirstFileW / FindNextFileW → Win32 ERROR_SHARING_VIOLATION Handler → Atomic Unlink → JSON Telemetry Logger.",
    implementation: [
      "Authored a fail-safe traversal routine that intercepts Win32 sharing violations and skips in-use locked files without process crashes",
      "Engineered hardcoded path assertion guards that immediately abort execution if target path intersects user personal directories",
      "Constructed a real-time web simulator deployed on Vercel to allow users to visualize file-lock handling interactively"
    ],
    decisions: [
      "Chose native Win32 API calls via Python ctypes and batch scripts over third-party utilities to eliminate external dependencies",
      "Implemented a 4-hour scheduled cadence balancing low background CPU consumption (<0.1%) with consistent disk hygiene"
    ],
    testing: [
      "Tested across 30 days of active developer usage with heavy Node.js, Python, and C++ compilation workloads",
      "Simulated concurrent file access locks to verify that locked active databases remained intact without corruption"
    ],
    results: [
      "Reclaimed an average of 20.4 GB disk storage per system over 30 days",
      "Zero process crashes or file corruptions recorded across 1,000+ automated execution cycles",
      "Interactive web simulator live at autonomous-system-temp-cleaner.vercel.app"
    ],
    lessons: [
      "In operating system automation, boundary verification assertions must be enforced at the root execution layer",
      "Gracefully skipping locked file handles provides superior operational safety compared to forceful process termination"
    ],
    liveUrl: "https://autonomous-system-temp-cleaner.vercel.app",
    githubUrl: "https://github.com/AbishekPranavGV/Autonomous-System-Temp-Cleaner"
  },
  {
    id: "nicms-strategic-blueprint",
    title: "NICMS Sri Lanka Strategic Blueprint",
    subtitle: "Zero-Knowledge PII Cryptography & 4-Hour Inter-Agency Handshake Architecture",
    icon: ShieldAlert,
    problem: "Survivors of SGBV and technology-facilitated violence in Sri Lanka endure 'The Trauma of the Loop'—forced to narrate sensitive trauma repeatedly across 6 uncoordinated ministries while digital evidence degrades and cases stall.",
    constraints: [
      "Survivors frequently access systems from shared or monitored domestic devices",
      "Evidence must meet strict statutory standards for Section 65B electronic court admissibility",
      "Cross-agency referrals between Police, Child Protection, and CERT must enforce strict accountability SLAs"
    ],
    architecture: "Confidential Survivor Intake Layer → 16-Digit Pseudonymous Ghost-Tracking Hash → SHA-256 Evidence Time-Capsule → Zero-Knowledge PII Vault → Central SLA Orchestration Hub → 6 Ministry API Handshake Adapters.",
    implementation: [
      "Designed an anonymous 16-digit 'Justice Key' allowing case tracking without storing SMS, email, or credentials on client devices",
      "Formulated an automated SHA-256 cryptographic time-capsule establishing immutable chain-of-custody for court submissions",
      "Engineered an automated 4-hour digital referral handshake contract that auto-escalates unresolved inter-agency cases"
    ],
    decisions: [
      "Decoupled survivor demographic identity from case metadata using Zero-Knowledge schemas to prevent unauthorized internal snooping",
      "Implemented an instantaneous 'Zero-Trace Panic Exit' flushing client browser memory upon single click or keypress"
    ],
    testing: [
      "Built a live interactive architecture prototype simulating the complete intake journey and inter-agency referral counter",
      "Authored a comprehensive 40+ page enterprise Software Requirements Specification (SRS) validated against legal standards"
    ],
    results: [
      "Eliminated redundant survivor questioning through a unified digital Single Window of Truth",
      "Guaranteed forensic admissibility of cyber harassment evidence in the Attorney General's Department",
      "Interactive case study prototype live at abishekpranavgv.github.io/NICMS-SriLanka-Strategic-Blueprint"
    ],
    lessons: [
      "Designing mission-critical enterprise systems requires aligning technical schemas with survivor dignity and legal standards",
      "Automated digital handshakes with enforced SLAs are the only effective remedy for bureaucratic inter-agency case stalling"
    ],
    liveUrl: "https://abishekpranavgv.github.io/NICMS-SriLanka-Strategic-Blueprint/",
    githubUrl: "https://github.com/AbishekPranavGV/NICMS-SriLanka-Strategic-Blueprint"
  }
];

const CaseStudiesSection = () => {
  const [activeTab, setActiveTab] = useState(caseStudiesData[0].id);
  const activeStudy = caseStudiesData.find((s) => s.id === activeTab) || caseStudiesData[0];
  const Icon = activeStudy?.icon || BookOpen;

  return (
    <section className="px-6 py-28 relative" id="case-studies">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5" /> Section 05 — Deep-Dive Case Studies
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Engineering Case Studies
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-3xl mt-3 leading-relaxed">
            Detailed technical post-mortems and architecture breakdowns: <span className="text-slate-200 font-medium">Problem → Constraints → Architecture → Decisions → Testing → Results → Lessons Learned</span>.
          </p>
        </motion.div>

        {/* Case Studies Selector Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-10 pb-4 border-b border-white/[0.08]">
          {caseStudiesData.map((study) => {
            const TabIcon = study.icon || BookOpen;
            const isActive = activeTab === study.id;
            return (
              <button
                key={study.id}
                onClick={() => setActiveTab(study.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                  isActive
                    ? "bg-cyan-500 text-[#070B14] shadow-lg shadow-cyan-500/25 scale-[1.02]"
                    : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.07]"
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? "text-[#070B14]" : "text-cyan-400"}`} />
                <span>{study.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Case Study Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStudy.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl"
          >
            {/* Header Banner */}
            <div className="p-6 sm:p-8 border-b border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {activeStudy.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-cyan-400 font-medium mt-0.5">
                    {activeStudy.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {activeStudy.liveUrl && (
                  <Button
                    asChild
                    size="sm"
                    className="gap-1.5 bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-[#070B14] border border-cyan-500/30 text-xs font-semibold h-9"
                  >
                    <a href={activeStudy.liveUrl} target="_blank" rel="noopener noreferrer">
                      Live App <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/10 hover:border-white/25 text-slate-300 hover:text-white bg-white/[0.03] text-xs h-9"
                >
                  <a href={activeStudy.githubUrl} target="_blank" rel="noopener noreferrer">
                    Repository ↗
                  </a>
                </Button>
              </div>
            </div>

            {/* Deep-Dive Grid */}
            <div className="p-6 sm:p-10 space-y-10">
              {/* Problem & Constraints */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <AlertCircle className="w-4 h-4" /> The Core Problem
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {activeStudy.problem}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <ShieldAlert className="w-4 h-4" /> Technical & Business Constraints
                  </div>
                  <ul className="space-y-2">
                    {activeStudy.constraints.map((c, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-amber-400 font-bold shrink-0">·</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Architecture Topology */}
              <div className="space-y-3 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Workflow className="w-4 h-4" /> System Architecture & Execution Topology
                </div>
                <div className="p-4 rounded-lg bg-black/40 font-mono text-xs text-cyan-300/90 leading-relaxed overflow-x-auto border border-cyan-500/20">
                  {activeStudy.architecture}
                </div>
              </div>

              {/* Implementation & Decisions */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                    <CheckCircle2 className="w-4 h-4" /> Implementation Highlights
                  </div>
                  <ul className="space-y-2">
                    {activeStudy.implementation.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                    <Cpu className="w-4 h-4" /> Key Technical Decisions
                  </div>
                  <ul className="space-y-2">
                    {activeStudy.decisions.map((dec, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <ChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Testing, Results & Lessons */}
              <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-white/[0.06]">
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Testing & Validation
                  </div>
                  <ul className="space-y-2">
                    {activeStudy.testing.map((t, i) => (
                      <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                        <span className="text-cyan-400 shrink-0">✓</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Empirical Results
                  </div>
                  <ul className="space-y-2">
                    {activeStudy.results.map((r, i) => (
                      <li key={i} className="text-xs text-emerald-300 leading-relaxed flex items-start gap-2 font-medium">
                        <span className="text-emerald-400 shrink-0">⚡</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-violet-400">
                    Engineering Lessons
                  </div>
                  <ul className="space-y-2">
                    {activeStudy.lessons.map((l, i) => (
                      <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                        <span className="text-violet-400 shrink-0">💡</span>
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
