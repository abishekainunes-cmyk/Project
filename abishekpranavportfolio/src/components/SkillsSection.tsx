import { motion } from "framer-motion";
import { 
  Brain, 
  Database, 
  Workflow, 
  Server, 
  Layout, 
  Cloud, 
  Eye, 
  BarChart3,
  Cpu,
  Layers,
  Sparkles
} from "lucide-react";

interface PipelineStage {
  step: string;
  name: string;
  icon: typeof Brain;
  color: string;
  description: string;
  tools: string[];
}

const pipelineStages: PipelineStage[] = [
  {
    step: "01",
    name: "Reason",
    icon: Brain,
    color: "text-cyan-200",
    description: "Design AI workflows with structured outputs, tool calling, memory, and multi-turn decision-making.",
    tools: ["Structured Output", "Tool Calling", "Memory Chains", "Prompt Engineering", "Pydantic Models"]
  },
  {
    step: "02",
    name: "Retrieve",
    icon: Database,
    color: "text-lime-200",
    description: "Connect models to internal business knowledge using dense embeddings, vector search, and hybrid retrievers.",
    tools: ["Vector Embeddings", "Qdrant", "LlamaIndex", "pgvector", "Hybrid Search"]
  },
  {
    step: "03",
    name: "Orchestrate",
    icon: Workflow,
    color: "text-emerald-200",
    description: "Build autonomous agents and automation daemons that can reason, invoke APIs, and handle task retry logic.",
    tools: ["LangGraph", "LangChain", "n8n Automation", "MCP Protocol", "State Machines"]
  },
  {
    step: "04",
    name: "Serve",
    icon: Server,
    color: "text-sky-200",
    description: "Expose AI capabilities through low-latency microservices, relational databases, and background queue workers.",
    tools: ["FastAPI", "Python 3.12", "PostgreSQL", "Redis", "Docker"]
  },
  {
    step: "05",
    name: "Interface",
    icon: Layout,
    color: "text-purple-200",
    description: "Craft responsive, high-performance web products where humans interact seamlessly with intelligent systems.",
    tools: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "shadcn/ui"]
  },
  {
    step: "06",
    name: "Deploy",
    icon: Cloud,
    color: "text-indigo-200",
    description: "Package, automate, and ship AI systems with reproducibility, isolation, and edge scalability.",
    tools: ["Docker Compose", "GitHub Actions", "Vercel Edge", "AWS", "Google Cloud"]
  },
  {
    step: "07",
    name: "Evaluate",
    icon: Eye,
    color: "text-rose-200",
    description: "Quantify retrieval accuracy, agent performance, hallucination rates, and business regression metrics.",
    tools: ["Ragas Benchmark", "DeepEval", "LangSmith", "Vitest Suites", "Automated E2E"]
  },
  {
    step: "08",
    name: "Observe",
    icon: BarChart3,
    color: "text-amber-200",
    description: "Monitor end-to-end token consumption, latency traces, and production behavior to continuously refine pipelines.",
    tools: ["Langfuse", "OpenTelemetry", "Grafana", "Prometheus", "Audit Trails"]
  }
];

const SkillsSection = () => {
  return (
    <section id="skills" className="relative py-24 lab-grid border-t border-white/10 overflow-hidden">
      {/* Ambient gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.42),rgba(2,6,23,0.92)),radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.08),transparent_38%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.08),transparent_42%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-left mb-16">
          <div className="inline-flex items-center gap-2 border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-cyan-200 mb-3">
            <span>// 02 · Methodology & Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            AI Build Pipeline
          </h2>
          <p className="text-base text-white/60 mt-3 max-w-2xl font-normal">
            The tools and frameworks I use are organized by how I turn a commercial idea into a deployed, production-grade product.
          </p>
        </div>

        {/* 8-Stage Modular Grid (2x4 desktop, 1x8 mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden border border-white/10 bg-white/10 rounded-xl mb-10">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div 
                key={stage.step}
                className="group bg-slate-950/85 p-6 backdrop-blur-md transition-all duration-300 hover:bg-slate-900/95 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Icon + Step Counter */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-200/20 bg-cyan-200/5 text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-white/40 font-bold tracking-widest">{stage.step}</span>
                  </div>

                  {/* Stage Name & Description */}
                  <h3 className="text-2xl font-bold text-white tracking-tight">{stage.name}</h3>
                  <p className="mt-2.5 text-xs text-white/60 leading-relaxed min-h-[56px]">
                    {stage.description}
                  </p>
                </div>

                {/* Tool Pills */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                  {stage.tools.map((tool) => (
                    <span 
                      key={tool}
                      className="border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-mono text-white/75 rounded hover:border-cyan-300/40 hover:text-cyan-200 transition-colors"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Operating Range Callout Banner */}
        <div className="border border-lime-300/30 bg-lime-300/[0.04] p-6 rounded-xl">
          <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.24em] text-lime-300/80 font-bold">
                // Current Operating Range
              </div>
              <h3 className="mt-1.5 text-xl font-bold text-white tracking-tight">
                Turning AI capabilities into verified, zero-drift products
              </h3>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-white/60">
              My engineering core lies in applied software engineering for AI-powered systems—specifically enterprise platforms that harmonize language models, multi-source knowledge retrieval, operational automation, and intuitive user experiences.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SkillsSection;
