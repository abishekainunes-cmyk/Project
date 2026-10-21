import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ExternalLink, 
  Github, 
  Filter, 
  Sparkles, 
  Terminal, 
  Code2, 
  Play, 
  CheckCircle,
  Clock,
  Layers,
  Database,
  BrainCircuit,
  Cpu
} from "lucide-react";
import { Input } from "@/components/ui/input";

export type ProjectTier = "Flagship Production" | "Deployed System" | "Research & Colab" | "Enterprise Tool";
export type ProjectCategory = "All" | "GenAI & Full-Stack" | "Machine Learning & Analytics" | "Enterprise Automation" | "Computer Vision & Edge AI" | "System Architecture";

export interface DirectoryProject {
  name: string;
  repoName: string;
  tier: ProjectTier;
  category: ProjectCategory;
  summary: string;
  stack: string[];
  githubUrl: string;
  liveDemoUrl?: string;
  colabUrl?: string;
  statusBadge: string;
}

const allRepositories: DirectoryProject[] = [
  {
    name: "Autonomous Social Command Center",
    repoName: "social-command-center",
    tier: "Flagship Production",
    category: "GenAI & Full-Stack",
    summary: "Production Next.js 16 social automation hub integrating Meta Graph API v24, WhatsApp Cloud API, and scheduled Generative AI content dispatch.",
    stack: ["Next.js 16", "React 19", "Meta Graph API", "WhatsApp Cloud", "AES-256-GCM"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/social-command-center",
    liveDemoUrl: "https://nunessocialpostmachine-app.vercel.app",
    statusBadge: "Live Production"
  },
  {
    name: "IndiaMART AI Content & Catalog Studio",
    repoName: "IndiaMART-AI-Content-Catalog-Generator",
    tier: "Flagship Production",
    category: "GenAI & Full-Stack",
    summary: "Multimodal AI catalog engine extracting raw industrial instrument specs and compiling print-ready 300-DPI vector PDF sales brochures.",
    stack: ["Next.js 16", "Multimodal GenAI", "ReportLab 4.1", "Tailwind CSS", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/IndiaMART-AI-Content-Catalog-Generator",
    liveDemoUrl: "https://indiamart-ai-catalog-studio.vercel.app",
    statusBadge: "Live Production"
  },
  {
    name: "Autonomous System Temp Cleaner",
    repoName: "Autonomous-System-Temp-Cleaner",
    tier: "Flagship Production",
    category: "Enterprise Automation",
    summary: "Production Windows background daemon with Win32 file-lock bypass algorithms executing every 4 hours without user interruption.",
    stack: ["Windows API", "Python 3.12", "Task Scheduler", "Batch", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Autonomous-System-Temp-Cleaner",
    liveDemoUrl: "https://autonomous-system-temp-cleaner.vercel.app",
    statusBadge: "Live Production"
  },
  {
    name: "NICMS Sri Lanka Strategic Blueprint",
    repoName: "NICMS-SriLanka-Strategic-Blueprint",
    tier: "Flagship Production",
    category: "System Architecture",
    summary: "Comprehensive systems architecture and interactive prototype for Sri Lanka's National Integrated Case Management System with 4-hour SLA handshakes.",
    stack: ["Enterprise SRS", "Zero-Knowledge Vault", "Agile Scrum", "HTML5"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/NICMS-SriLanka-Strategic-Blueprint",
    liveDemoUrl: "https://abishekpranavgv.github.io/NICMS-SriLanka-Strategic-Blueprint/",
    statusBadge: "Live Prototype"
  },
  {
    name: "Retail Sales Demand Forecasting & ROP",
    repoName: "Retail-Sales-Performance-Predictive-Analytics",
    tier: "Flagship Production",
    category: "Machine Learning & Analytics",
    summary: "SQL Server POS data pipeline over 500K records, comparing Prophet vs. ARIMA seasonality models for dynamic safety stock reorder points.",
    stack: ["SQL Server", "Facebook Prophet", "ARIMA", "Power BI", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Retail-Sales-Performance-Predictive-Analytics",
    liveDemoUrl: "https://retail-sales-predictive-analytics.vercel.app",
    statusBadge: "Live Dashboard"
  },
  {
    name: "Personal Portfolio & Engineering Hub",
    repoName: "abishekpranavportfolio",
    tier: "Flagship Production",
    category: "GenAI & Full-Stack",
    summary: "High-performance portfolio showcase built on React 18, Vite, and Tailwind CSS with automated GitHub Actions CI/CD pipelines.",
    stack: ["React 18", "TypeScript", "Vite", "Tailwind CSS", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/abishekpranavportfolio",
    liveDemoUrl: "https://abishekpranavportfolio.vercel.app",
    statusBadge: "Live Web App"
  },
  {
    name: "Customer Churn Decision Framework",
    repoName: "Customer-Churn-Decision-Analysis",
    tier: "Research & Colab",
    category: "Machine Learning & Analytics",
    summary: "Cost-sensitive machine learning framework formulating churn as an asymmetric financial loss matrix, paired with TreeSHAP feature attributions.",
    stack: ["Scikit-Learn", "XGBoost", "TreeSHAP", "SMOTE", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Customer-Churn-Decision-Analysis",
    liveDemoUrl: "https://customer-churn-decision-analysis.vercel.app",
    colabUrl: "https://colab.research.google.com/github/abishekainunes-cmyk/Project/blob/main/Customer-Churn-Decision-Analysis/case%20study/customer-churn-decision-analysis/case.ipynb",
    statusBadge: "Live Studio"
  },
  {
    name: "Financial Stock Forecasting (ARIMA vs LSTM)",
    repoName: "Stock-Price-Prediction-using-ARIMA",
    tier: "Research & Colab",
    category: "Machine Learning & Analytics",
    summary: "Econometric Box-Jenkins ARIMA stationarity testing versus deep sequential Keras LSTM networks on high-frequency equity price data.",
    stack: ["ARIMA", "Keras LSTM", "Statsmodels", "yfinance", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Stock-Price-Prediction-using-ARIMA",
    liveDemoUrl: "https://stock-price-prediction-arima.vercel.app",
    colabUrl: "https://colab.research.google.com/github/abishekainunes-cmyk/Project/blob/main/Stock-Price-Prediction-using-ARIMA/Stock%20Price%20Prediction%20using%20ARIMA.ipynb",
    statusBadge: "Live Studio"
  },
  {
    name: "Financial News Sentiment & Topic Mining",
    repoName: "Sentimental-analysis-of-News-Headlines",
    tier: "Research & Colab",
    category: "Machine Learning & Analytics",
    summary: "Real-time Finviz news scraping pipeline quantifying market sentiment with NLTK VADER and segmenting macro themes via TF-IDF K-Means.",
    stack: ["NLTK VADER", "TF-IDF", "K-Means", "BeautifulSoup4", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Sentimental-analysis-of-News-Headlines",
    liveDemoUrl: "https://sentiment-news-analysis.vercel.app",
    colabUrl: "https://colab.research.google.com/github/abishekainunes-cmyk/Project/blob/main/Sentimental-analysis-of-News-Headlines/Sentimental%20analysis%20of%20News%20Headlines.ipynb",
    statusBadge: "Live Studio"
  },
  {
    name: "Intelligent Climate ESG Decision System",
    repoName: "Climate-Impact-ESG-Dashboard",
    tier: "Research & Colab",
    category: "Machine Learning & Analytics",
    summary: "Enterprise logistics environmental governance cockpit combining Scope 1/2 GHG carbon calculations with live OpenWeather air quality APIs.",
    stack: ["Streamlit", "Plotly Express", "OpenWeather API", "SQLite3", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Climate-Impact-ESG-Dashboard",
    liveDemoUrl: "https://climate-impact-esg-dashboard.vercel.app",
    colabUrl: "https://colab.research.google.com/github/abishekainunes-cmyk/Project/blob/main/Climate-Impact-ESG-Dashboard/real-time%20ESG%20monitoring%20system.ipynb",
    statusBadge: "Live Studio"
  },
  {
    name: "Emotion-Driven Movie Recommendation",
    repoName: "Movie_recommendation_using_emotion",
    tier: "Research & Colab",
    category: "Computer Vision & Edge AI",
    summary: "Affective computing vision engine classifying facial micro-expressions with DeepFace and dynamically fetching live IMDb genre recommendations.",
    stack: ["DeepFace CNN", "OpenCV", "BeautifulSoup4", "Flask", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Movie_recommendation_using_emotion",
    liveDemoUrl: "https://movie-emotion-recommendation.vercel.app",
    colabUrl: "https://colab.research.google.com/github/abishekainunes-cmyk/Project/blob/main/Movie_recommendation_using_emotion/app.ipynb",
    statusBadge: "Live Studio"
  },
  {
    name: "Hybrid E-Commerce Recommendation Engine",
    repoName: "E-commerce-Recommendation-Engine",
    tier: "Research & Colab",
    category: "Machine Learning & Analytics",
    summary: "Industrial hybrid recommender system combining Truncated SVD matrix factorization with an ensemble Random Forest purchase propensity regressor.",
    stack: ["Truncated SVD", "Random Forest", "Scikit-Learn", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/E-commerce-Recommendation-Engine",
    liveDemoUrl: "https://ecommerce-recommendation-engine-vert.vercel.app",
    colabUrl: "https://colab.research.google.com/github/abishekainunes-cmyk/Project/blob/main/E-commerce-Recommendation-Engine/Ecommerce%20Product%20Recommendation%20Analysis.ipynb",
    statusBadge: "Live Studio"
  },
  {
    name: "COVID-19 Epidemiological Forecasting",
    repoName: "COVID-19-Global-Forecasting-Predictive-Analysis",
    tier: "Research & Colab",
    category: "Machine Learning & Analytics",
    summary: "Global public health time-series surveillance with interactive Plotly choropleths and regional ARIMA mortality models across 5 high-burden corridors.",
    stack: ["ARIMA", "Statsmodels", "Plotly Choropleth", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/COVID-19-Global-Forecasting-Predictive-Analysis",
    liveDemoUrl: "https://covid19-global-forecasting.vercel.app",
    colabUrl: "https://colab.research.google.com/github/abishekainunes-cmyk/Project/blob/main/COVID-19-Global-Forecasting-Predictive-Analysis/COVID-19%20Global%20Forecasting%20Predictive%20Analysis.ipynb",
    statusBadge: "Live Studio"
  },
  {
    name: "Real-Time Biometric Face Recognition",
    repoName: "Facedetection",
    tier: "Enterprise Tool",
    category: "Computer Vision & Edge AI",
    summary: "Sub-30ms edge biometric pipeline using multi-scale Haar Cascades (face, eyes, nose, mouth) and Local Binary Patterns Histograms (LBPH).",
    stack: ["OpenCV 4.x", "LBPH Recognizer", "Haar Cascades", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Facedetection",
    liveDemoUrl: "https://face-detection-biometrics.vercel.app",
    statusBadge: "Live Studio"
  },
  {
    name: "Multi-Account Gmail Hygiene Agent (GmCL)",
    repoName: "Multi-Account-Gmail-Inbox-Hygiene-Agent",
    tier: "Enterprise Tool",
    category: "Enterprise Automation",
    summary: "Enterprise daemon managing 10 concurrent Gmail accounts with OAuth2 token isolation, rule-based triage, and Business Guard safety protections.",
    stack: ["Gmail REST API", "OAuth 2.0", "Python 3.10", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Multi-Account-Gmail-Inbox-Hygiene-Agent",
    liveDemoUrl: "https://gmail-inbox-hygiene-agent.vercel.app",
    statusBadge: "Live Console"
  },
  {
    name: "Smart Price Master & Catalog Generator",
    repoName: "Smart-Price-Master-Catalog-Generator",
    tier: "Enterprise Tool",
    category: "Enterprise Automation",
    summary: "Google Drive price book synchronizer, volume margin calculator, vector PDF generator, dynamic QR codes, and WhatsApp dispatch.",
    stack: ["Google Drive API", "ReportLab", "OpenPyXL", "QRCode", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Smart-Price-Master-Catalog-Generator",
    liveDemoUrl: "https://smart-price-master.vercel.app",
    statusBadge: "Live Studio"
  },
  {
    name: "Smart Brochure-to-Catalog AI Converter",
    repoName: "Smart-Brochure-to-Catalog-Converter",
    tier: "Enterprise Tool",
    category: "Enterprise Automation",
    summary: "Document AI pipeline using PyMuPDF and pdfplumber to extract unstructured OEM brochure specs and re-render branded commercial PDF catalogs.",
    stack: ["PyMuPDF fitz", "pdfplumber", "ReportLab", "Pydantic", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Smart-Brochure-to-Catalog-Converter",
    liveDemoUrl: "https://brochure-to-catalog-ai.vercel.app",
    statusBadge: "Live Studio"
  },
  {
    name: "NUNES Local AI Marketing Suite",
    repoName: "NUNES-Local-AI-Marketing-Starter",
    tier: "Enterprise Tool",
    category: "Enterprise Automation",
    summary: "Privacy-first, zero-data-egress enterprise marketing suite with local Ollama LLMs (Llama-3/Mistral), n8n workflow blueprints, and Docker Compose.",
    stack: ["Ollama Local LLM", "n8n Automation", "Docker Compose", "FastAPI", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/NUNES-Local-AI-Marketing-Starter",
    liveDemoUrl: "https://nunes-local-ai-marketing.vercel.app",
    statusBadge: "Live Studio"
  },
  {
    name: "Serverless B2B AI CRM Engine",
    repoName: "Crm",
    tier: "Enterprise Tool",
    category: "Enterprise Automation",
    summary: "Serverless B2B CRM on Google Apps Script and Sheets with NLP lead intent parsing, fuzzy SKU inventory matching, and automated quotes.",
    stack: ["Google Apps Script", "Google Sheets DB", "Gmail OAuth2", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Crm",
    liveDemoUrl: "https://nunes-b2b-ai-crm.vercel.app",
    statusBadge: "Live Studio"
  },
  {
    name: "NUNES Google Drive Cloud File Indexer (V3.7)",
    repoName: "drive-file-index",
    tier: "Enterprise Tool",
    category: "Enterprise Automation",
    summary: "Distributed lock coordination daemon in Google Apps Script that recursively crawls nested Drive folders, cleans instrumentation model names, and syncs master sheets.",
    stack: ["Google Apps Script", "Drive API", "Sheets API", "Distributed Locks", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/drive-file-index",
    liveDemoUrl: "https://nunes-drive-file-indexer.vercel.app",
    statusBadge: "Live Engine"
  },
  {
    name: "NUNES Catalogue Studio (Clinical & Metrology AI)",
    repoName: "MedX",
    tier: "Flagship Production",
    category: "GenAI & Full-Stack",
    summary: "Enterprise metrology catalogue publishing engine extracting specifications via Gemini 2.5 Flash and rendering certified 2-page A4 vector PDFs.",
    stack: ["Flask Serverless", "Gemini 2.5 Flash", "ReportLab 4.2", "Pillow Studio", "Vercel"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/MedX",
    liveDemoUrl: "https://nunes-catalogue-studio-live.vercel.app/",
    statusBadge: "Live Production"
  },
  {
    name: "NICMS Sri Lanka Enterprise Specification & SRS",
    repoName: "NICMS-SriLanka-Strategic-Blueprint_Project",
    tier: "Flagship Production",
    category: "System Architecture",
    summary: "Enterprise systems architecture, 40+ page formal SRS specification, and interactive simulator uniting 6 ministries under a 4-hour SLA referral contract.",
    stack: ["Enterprise SRS", "Zero-Knowledge PII", "SHA-256 Vault", "HTML5 Simulator"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/NICMS-SriLanka-Strategic-Blueprint_Project",
    liveDemoUrl: "https://abishekpranavgv.github.io/NICMS-SriLanka-Strategic-Blueprint/",
    statusBadge: "Live Specification"
  },
  {
    name: "SocmedX: Multi-Platform Social Orchestrator",
    repoName: "SocmedX",
    tier: "Flagship Production",
    category: "GenAI & Full-Stack",
    summary: "Automated multi-channel social marketing orchestrator with Next.js 16 App Router, Turbopack, Meta Graph API v24, and instant WhatsApp lead dispatch.",
    stack: ["Next.js 16", "React 19", "Meta Graph API", "WhatsApp Cloud", "AES-256-GCM"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/SocmedX",
    liveDemoUrl: "https://nunessocialpostmachine-app.vercel.app",
    statusBadge: "Live Production"
  },
  {
    name: "Streamlit AI Analytics & Decision Studio",
    repoName: "Streamlit",
    tier: "Research & Colab",
    category: "Machine Learning & Analytics",
    summary: "Interactive data science decision studio with asymmetric loss matrix optimization, Prophet/ARIMA demand forecasting, and real-time LLM token cost calculator.",
    stack: ["Streamlit", "Plotly Express", "Pandas", "Scikit-Learn", "NumPy"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/Streamlit",
    statusBadge: "Live Studio"
  },
  {
    name: "GitHub Profile Master Portal",
    repoName: "AbishekPranavGV",
    tier: "Enterprise Tool",
    category: "System Architecture",
    summary: "Master directory linking all 24 public repositories, live deployments, and credentials for recruiter and technical reviewer audits.",
    stack: ["GitHub Markdown", "Shields.io", "Mermaid", "CI/CD Badges"],
    githubUrl: "https://github.com/abishekainunes-cmyk/Project/tree/main/AbishekPranavGV",
    statusBadge: "Profile Portal"
  }
];

const categoryTabs: ProjectCategory[] = [
  "All",
  "GenAI & Full-Stack",
  "Machine Learning & Analytics",
  "Enterprise Automation",
  "Computer Vision & Edge AI",
  "System Architecture"
];

const ProjectDirectorySection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");

  const filteredProjects = useMemo(() => {
    return allRepositories.filter((repo) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.repoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.stack.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" || repo.category === selectedCategory;

      const matchesTier =
        selectedTier === "All" || repo.tier === selectedTier;

      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [searchQuery, selectedCategory, selectedTier]);

  return (
    <section className="px-6 py-24 relative lab-grid border-t border-white/10" id="github">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Code2 className="w-3.5 h-3.5" /> Section 04 — Complete GitHub Portfolio (24 Repositories)
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Complete GitHub Project Directory
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-3xl mt-3 leading-relaxed">
            Inspect all 24 open-source repositories from <a href="https://github.com/abishekainunes-cmyk?tab=repositories" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline decoration-cyan-500/30 hover:decoration-cyan-400">@abishekainunes-cmyk</a>. Every repository is reviewed, formatted with Mermaid flowcharts, and verified for technical reproducibility.
          </p>
        </motion.div>

        {/* Search & Filter Bar */}
        <div className="space-y-4 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by keyword, technology, or model (e.g., ARIMA, Next.js, OpenCV)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/60 h-11 text-sm rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-xs text-slate-400 font-mono">
              Showing <span className="text-cyan-400 font-bold">{filteredProjects.length}</span> of {allRepositories.length} repositories
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categoryTabs.map((cat) => {
              const count = cat === "All" 
                ? allRepositories.length 
                : allRepositories.filter((r) => r.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "bg-cyan-500 text-[#070B14] shadow-md shadow-cyan-500/25 scale-[1.02]"
                      : "bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-white/[0.07]"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat ? "bg-[#070B14]/20 text-[#070B14]" : "bg-white/10 text-slate-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Repositories Cards Grid */}
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((repo) => (
              <motion.div
                key={repo.repoName}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="glass-card p-5 rounded-xl border border-white/[0.08] hover:border-cyan-500/40 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                      {repo.statusBadge}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      {repo.category}
                    </span>
                  </div>

                  {/* Title & Repo Link */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {repo.name}
                  </h3>

                  <div className="text-[11px] font-mono text-slate-400 mb-3 flex items-center gap-1">
                    <Github className="w-3 h-3 text-slate-500" />
                    <span>{repo.repoName}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {repo.summary}
                  </p>
                </div>

                <div>
                  {/* Stack Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4 pt-2 border-t border-white/[0.06]">
                    {repo.stack.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-white/[0.03] text-slate-400 px-2 py-0.5 rounded border border-white/[0.06] font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Links Row */}
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={repo.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white font-medium transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" /> Source Code ↗
                    </a>

                    {repo.liveDemoUrl && (
                      <a
                        href={repo.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-md"
                      >
                        Live Demo <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {repo.colabUrl && (
                      <a
                        href={repo.colabUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 font-semibold transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-md"
                      >
                        <Play className="w-3 h-3 fill-amber-300" /> Colab ↗
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectDirectorySection;
