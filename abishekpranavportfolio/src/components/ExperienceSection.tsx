import { motion } from "framer-motion";
import { Briefcase, Calendar, MapPin, CheckCircle2, Building2 } from "lucide-react";

interface Experience {
  company: string;
  role: string;
  location: string;
  period: string;
  isCurrent?: boolean;
  bullets: string[];
  techStack: string[];
}

const experiences: Experience[] = [
  {
    company: "Nunes Instrumentation",
    role: "Generative AI & Forward Deployed Engineer",
    location: "Coimbatore, Tamil Nadu",
    period: "Aug 2026 – Present",
    isCurrent: true,
    bullets: [
      "Developed and improved five operational automation initiatives covering Gmail account cleaning, Windows temporary-file maintenance, IndiaMART product workflows, supplier price lookup and Google Drive indexing.",
      "Implemented Drive-to-Sheet file classification and indexing for 19,000+ records using Google Apps Script, Drive API and Sheets; long-running rescan performance remains under improvement.",
      "Built working multi-account Gmail cleaning using Python, Gmail API and OAuth; improving multi-PC monitoring and reliability across connected accounts.",
      "Tested stable scheduled TEMP-file cleaning through PowerShell and Windows background workers; extended monitoring remains a development area.",
      "Developed working IndiaMART product research and listing support with specifications, product media and PDFs; continuing to improve multi-account consistency and HTTP 429 handling.",
      "Built Price Master indexing and search across Excel, Drive/Sheets, IndiaMART and supplier records; refining matching accuracy, deduplication and search performance."
    ],
    techStack: ["Python", "REST APIs", "Google Apps Script", "PowerShell", "Gmail API", "IndiaMART API", "Google Drive API", "Next.js 16"]
  },
  {
    company: "RXG Studios",
    role: "Operations & Business Analytics Lead",
    location: "Bengaluru, Karnataka (Hybrid)",
    period: "May 2025 – Nov 2025",
    bullets: [
      "Automated export documentation using Advanced Excel and export platforms, reducing manual processing time by 30%.",
      "Streamlined invoicing, TDS documentation, Tally reconciliation and Bills of Lading workflows for export operations; maintained CRM records."
    ],
    techStack: ["Advanced Excel", "Tally ERP", "CRM Pipelines", "Export Logistics", "Financial Reconciliation"]
  },
  {
    company: "Woxsen University — Centre of Skill Development",
    role: "Intern & Event Coordinator",
    location: "Hyderabad, Telangana",
    period: "Jan 2023 – Feb 2025",
    bullets: [
      "Coordinated operations, executive communications and marketing for university events, including Campus Quest and Dinner with CEO."
    ],
    techStack: ["Operations Management", "Event Logistics", "Executive Communication"]
  },
  {
    company: "Greenwich Meridian Logistics India Pvt Ltd",
    role: "Business Development Intern",
    location: "Remote",
    period: "May 2024 – Aug 2024",
    bullets: [
      "Researched freight-forwarding prospects and CRM pipelines; streamlined invoices, quotations and shipment documentation, improving turnaround time by 30%."
    ],
    techStack: ["Freight Forwarding", "CRM Tracking", "Logistics Market Research"]
  },
  {
    company: "Smyrna Fellowship Trust",
    role: "HR & Operations Intern",
    location: "Remote",
    period: "Jun 2023 – Aug 2023",
    bullets: [
      "Restructured candidate-screening processes, reducing screening time by 50%; accelerated recruitment by 2.5x and expanded the qualified candidate pool by 5%."
    ],
    techStack: ["Process Restructuring", "HR Operations", "Candidate Screening"]
  },
  {
    company: "Foundry Patterns",
    role: "Assistant Accountant",
    location: "Remote",
    period: "Jan 2022 – Jul 2022",
    bullets: [
      "Maintained accounting ledgers, invoice tracking and Excel records; supported reconciliations and financial documentation."
    ],
    techStack: ["Accounting Ledgers", "Bank Reconciliation", "Excel Financial Sheets"]
  }
];

const ExperienceSection = () => {
  return (
    <section className="px-6 py-28 relative bg-[#070B14]/40 border-t border-white/[0.08]" id="experience">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Briefcase className="w-3.5 h-3.5" /> Section 06 — Professional Trajectory
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Professional Experience
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mt-3 leading-relaxed">
            Real-world engineering, applied AI deployments, and operations optimization across industrial technology and global trade.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative pl-6 sm:pl-8 border-l border-white/[0.12] space-y-12">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.company + exp.role}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Timeline Indicator Dot */}
              <div 
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 transition-transform duration-300 group-hover:scale-125 ${
                  exp.isCurrent 
                    ? "bg-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]" 
                    : "bg-[#070B14] border-slate-600"
                }`}
              />

              {/* Card Container */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/[0.08] hover:border-cyan-500/40 transition-all duration-300 shadow-xl">
                {/* Header */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {exp.role}
                    </h3>
                    {exp.isCurrent && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Current Role
                      </span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{exp.period}</span>
                  </div>
                </div>

                {/* Company & Location */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-5">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    {exp.company}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {exp.location}
                  </span>
                </div>

                {/* Bullets */}
                <ul className="space-y-2.5 mb-6">
                  {exp.bullets.map((bullet, i) => (
                    <li key={i} className="text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Tech Chips */}
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/[0.06]">
                  {exp.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] bg-white/[0.03] text-slate-300 border border-white/[0.06] px-2.5 py-0.5 rounded-md font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
