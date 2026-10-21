import { motion } from "framer-motion";
import { GraduationCap, Award, BookOpen, Calendar, Building, Sparkles } from "lucide-react";

interface EducationItem {
  degree: string;
  institution: string;
  period: string;
  focus: string;
  highlight?: string;
}

const educationList: EducationItem[] = [
  {
    degree: "MBA in Artificial Intelligence",
    institution: "JAIN University | Bangalore, Karnataka",
    period: "Aug 2025 – May 2027 (In Progress)",
    focus: "Executive Decision Support Systems, AI Product Strategy, Operations Analytics, Machine Learning Systems.",
    highlight: "Advanced Applied AI"
  },
  {
    degree: "BBA in Data Science & Artificial Intelligence",
    institution: "Woxsen University | Hyderabad, Telangana",
    period: "Sep 2022 – Jun 2025",
    focus: "Relational Database Design (SQL), Applied Data Analytics, Applied Business Statistics, Quantitative Modeling.",
    highlight: "Core Data Engineering"
  },
  {
    degree: "Chartered Accountancy (CA) Preparation",
    institution: "The Institute of Chartered Accountants of India (ICAI)",
    period: "Jan 2019 – Jan 2022 (3 Years Intensive)",
    focus: "Double-Entry Financial Accounting, Cost Accounting, Corporate Law, Direct/Indirect Taxation Compliance.",
    highlight: "Financial Rigor"
  },
];

const certifications = [
  { title: "Agile Scrum Essentials", issuer: "Techcanvass (2026)", badge: "Agile/Scrum" },
  { title: "Agile Project Management Foundation", issuer: "HP LIFE", badge: "Project Delivery" },
  { title: "Lean Six Sigma White Belt", issuer: "Management & Strategy Institute (MSI)", badge: "Process Optimization" },
  { title: "Six Sigma White Belt", issuer: "The Council for Six Sigma Certification (CSSC)", badge: "Quality Engineering" },
];

const EducationSection = () => {
  return (
    <section className="px-6 py-28 relative bg-[#070B14]/40 border-t border-white/[0.08]" id="education">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <GraduationCap className="w-3.5 h-3.5" /> Section 08 — Academic Foundations
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Education &amp; Certifications
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mt-3 leading-relaxed">
            Rigorous interdisciplinary training combining Artificial Intelligence, Data Science, and Financial Accounting.
          </p>
        </motion.div>

        {/* Education Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {educationList.map((item, i) => (
            <motion.div
              key={item.degree}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card p-6 sm:p-7 rounded-2xl border border-white/[0.08] hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-cyan-300 border border-white/[0.08]">
                    {item.highlight}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {item.degree}
                </h3>
                <p className="text-xs text-slate-300 font-medium mb-3">
                  {item.institution}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.period}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] text-xs text-slate-300 leading-relaxed">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                  Core Focus:
                </span>
                {item.focus}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certifications Sub-Section */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" /> Verified Professional Certifications
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {certifications.map((cert, i) => (
              <motion.div
                key={cert.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card p-4 rounded-xl border border-white/[0.07] hover:border-cyan-500/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Award className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] font-mono text-slate-400 bg-white/[0.03] px-2 py-0.5 rounded">
                    {cert.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-white leading-snug mb-1">
                  {cert.title}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {cert.issuer}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationSection;
