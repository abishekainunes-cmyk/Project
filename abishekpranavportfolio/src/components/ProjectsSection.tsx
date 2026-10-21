import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Newspaper, 
  Leaf, 
  ExternalLink, 
  Bot, 
  ScanFace,
  Share2,
  FileSpreadsheet,
  Globe,
  Mail,
  Github,
  Sparkles,
  LucideIcon
} from "lucide-react";

interface ProjectItem {
  icon: LucideIcon;
  title: string;
  category: "GenAI & Automation" | "Analytics & BI" | "Enterprise Systems";
  description: string;
  tags: string[];
  github: string;
  liveDemo?: string;
  isFlagship?: boolean;
}

const projects: ProjectItem[] = [
  {
    icon: Share2,
    title: "Autonomous Social Command Center",
    category: "GenAI & Automation",
    description: "Next.js 16 multi-platform social marketing command center with automated scheduling, Meta Graph API integration, WhatsApp lead routing, and Generative AI copy generation.",
    tags: ["Next.js 16", "React 19", "Meta Graph API", "WhatsApp Business", "Vercel"],
    github: "https://github.com/AbishekPranavGV/social-command-center",
    liveDemo: "https://nunessocialpostmachine-app.vercel.app",
    isFlagship: true,
  },
  {
    icon: FileSpreadsheet,
    title: "IndiaMART AI Content & Catalog Generator",
    category: "GenAI & Automation",
    description: "Generative AI catalog engine extracting product specs, generating search-optimized marketing descriptions, keywords, and automated branded PDF catalogs for commercial marketplace postings.",
    tags: ["Next.js", "Generative AI", "PDF Generation", "Product Research"],
    github: "https://github.com/AbishekPranavGV/IndiaMART-AI-Content-Catalog-Generator",
    liveDemo: "https://indiamart-ai-catalog-studio.vercel.app",
    isFlagship: true,
  },
  {
    icon: Sparkles,
    title: "Autonomous System Temp Cleaner",
    category: "GenAI & Automation",
    description: "Autonomous background disk optimization daemon executing every 4 hours. Incorporates Win32 in-use file lock bypass, strict path safety boundary guards, and non-destructive cache purging.",
    tags: ["Windows API", "Python 3.12", "Task Scheduler", "Batch", "Vercel"],
    github: "https://github.com/AbishekPranavGV/Autonomous-System-Temp-Cleaner",
    liveDemo: "https://autonomous-system-temp-cleaner.vercel.app",
    isFlagship: true,
  },
  {
    icon: Globe,
    title: "NICMS Sri Lanka Strategic Blueprint",
    category: "Enterprise Systems",
    description: "Comprehensive systems architecture and strategic operational blueprint for the National Integrated Case Management System (Sri Lanka) with digital workflow specifications.",
    tags: ["Systems Architecture", "SRS Blueprint", "Enterprise Workflow", "HTML5"],
    github: "https://github.com/AbishekPranavGV/NICMS-SriLanka-Strategic-Blueprint",
    liveDemo: "https://abishekpranavgv.github.io/NICMS-SriLanka-Strategic-Blueprint/",
    isFlagship: true,
  },
  {
    icon: BarChart3,
    title: "Retail Performance & Predictive Analytics",
    category: "Analytics & BI",
    description: "End-to-end data pipeline in SQL Server for 500K+ records. Developed ARIMA & Prophet models with 85% forecast accuracy and interactive Power BI dashboards for ABC/XYZ inventory optimization.",
    tags: ["SQL Server", "Power BI", "ARIMA", "Prophet", "Time-Series"],
    github: "https://github.com/AbishekPranavGV/Retail-Sales-Performance-Predictive-Analytics",
    liveDemo: "https://retail-sales-predictive-analytics.vercel.app",
    isFlagship: true,
  },
  {
    icon: Bot,
    title: "Customer Churn Decision Analysis",
    category: "Analytics & BI",
    description: "Interpretable machine learning framework identifying customer departure drivers, paired with an interactive decision-support application evaluating targeted business retention interventions.",
    tags: ["Python", "Streamlit", "Scikit-Learn", "SHAP", "Decision Science"],
    github: "https://github.com/AbishekPranavGV/Customer-Churn-Decision-Analysis",
  },
  {
    icon: ScanFace,
    title: "Emotion-Based Recommendation Engine",
    category: "GenAI & Automation",
    description: "Computer vision engine using DeepFace and OpenCV to detect emotional valence from live video feeds, dynamically streaming personalized content matching real-time user engagement.",
    tags: ["DeepFace", "OpenCV", "Computer Vision", "Python"],
    github: "https://github.com/AbishekPranavGV/Movie_recommendation_using_emotion",
  },
  {
    icon: TrendingUp,
    title: "Financial Time Series Forecasting",
    category: "Analytics & BI",
    description: "ARIMA-based forecasting engine predicting closing prices for volatile equity assets. Includes automated API data extraction and rigorous ADF stationarity testing.",
    tags: ["ARIMA", "Statsmodels", "yfinance", "Matplotlib"],
    github: "https://github.com/AbishekPranavGV/Stock-Price-Prediction-using-ARIMA",
  },
  {
    icon: Mail,
    title: "Multi-Account Gmail Hygiene Agent",
    category: "GenAI & Automation",
    description: "Automated background email triage agent managing up to 10 Gmail accounts simultaneously, auto-archiving and clearing promotional clutter via Gmail APIs.",
    tags: ["Python", "Gmail API", "Workflow Automation"],
    github: "https://github.com/AbishekPranavGV/Multi-Account-Gmail-Inbox-Hygiene-Agent",
  },
  {
    icon: Leaf,
    title: "Climate Impact ESG Dashboard",
    category: "Analytics & BI",
    description: "Environmental, Social & Governance monitoring system with real-time weather/air quality API integration and interactive Plotly analytics for risk trend visualization.",
    tags: ["Streamlit", "Plotly", "SQLite", "API Integration"],
    github: "https://github.com/AbishekPranavGV/Climate-Impact-ESG-Dashboard",
  },
  {
    icon: Newspaper,
    title: "Sentiment Analysis of News Headlines",
    category: "Analytics & BI",
    description: "NLP pipeline quantifying market sentiment for Tier-1 equities using NLTK VADER, scraping financial news to identify thematic trends and trading signals.",
    tags: ["NLP", "NLTK", "BeautifulSoup", "Scikit-learn"],
    github: "https://github.com/AbishekPranavGV/Sentimental-analysis-of-News-Headlines",
  },
];

const categories = ["All", "GenAI & Automation", "Analytics & BI", "Enterprise Systems"] as const;

const ProjectsSection = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredProjects = activeCategory === "All"
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <section className="px-6 py-24" id="projects">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-divider mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Technical & AI Projects</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Production-grade generative AI automation workflows, enterprise blueprints, and predictive data pipelines.
          </p>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                    : "bg-secondary/40 text-secondary-foreground hover:bg-secondary/80 border border-border/40"
                }`}
              >
                {cat}
                {cat === "All" && ` (${projects.length})`}
                {cat !== "All" && ` (${projects.filter(p => p.category === cat).length})`}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div layout className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((proj) => (
              <motion.div
                key={proj.title}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className={`glass-card p-6 transition-all border rounded-xl shadow-sm ${
                  proj.isFlagship
                    ? "border-primary/40 bg-primary/[0.03] shadow-md ring-1 ring-primary/20" 
                    : "hover:border-primary/30 hover:bg-secondary/10"
                }`}
              >
                <div className="flex items-start gap-4 md:gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    proj.isFlagship ? "bg-primary/20 scale-105 shadow-inner" : "bg-primary/10"
                  }`}>
                    <proj.icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold tracking-tight">{proj.title}</h3>
                        {proj.isFlagship && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">
                            Flagship
                          </span>
                        )}
                        <span className="text-[10px] bg-secondary text-secondary-foreground border border-border/50 px-2 py-0.5 rounded-full font-medium">
                          {proj.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {proj.liveDemo && (
                          <a
                            href={proj.liveDemo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-md transition-colors"
                          >
                            Live App <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <a
                          href={proj.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Github className="w-4 h-4" /> Code
                        </a>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {proj.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {proj.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="text-[11px] bg-secondary/80 text-secondary-foreground border border-border/50 px-2.5 py-0.5 rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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

export default ProjectsSection;
