import { motion } from "framer-motion";
import { Mail, Phone, Linkedin, Github, FileText, Eye, ArrowUpRight, MapPin, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResumeViewer } from "@/context/ResumeViewerContext";

const ContactSection = () => {
  const { openResume } = useResumeViewer();
  return (
    <section className="px-6 py-28 relative border-t border-white/[0.08] overflow-hidden" id="contact">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-t from-cyan-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Section 09 — Direct Inquiries
          </div>

          {/* Requested Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Have a complex problem? <br />
            <span className="text-gradient">Let's build a clear solution.</span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            I am actively open to opportunities as an <strong>AI Engineer</strong>, <strong>Generative AI Developer</strong>, <strong>Forward Deployed Engineer</strong>, and <strong>AI Automation Engineer</strong>. Whether you need production GenAI architectures, automated business workflows, or predictive data pipelines—let's build together.
          </p>

          {/* Direct Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-14">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-[#070B14] font-bold text-sm h-12 px-6 shadow-xl shadow-cyan-500/25 transition-all duration-200"
            >
              <a href="mailto:Abishekpranav403@gmail.com">
                <Send className="w-4 h-4" /> Send Direct Email <ArrowUpRight className="w-4 h-4" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 border-white/15 hover:border-cyan-500/40 text-slate-200 hover:text-white bg-white/[0.04] text-sm h-12 px-6 transition-all duration-200"
            >
              <a href="https://www.linkedin.com/in/abishek-pranav-g-v-/" target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4 text-cyan-400" /> Connect on LinkedIn <ArrowUpRight className="w-4 h-4" />
              </a>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={openResume}
              className="gap-2 border-white/15 hover:border-white/30 text-slate-300 hover:text-white bg-white/[0.04] text-sm h-12 px-6 transition-all duration-200 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" /> View Executive CV
            </Button>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-16">
            <a
              href="mailto:Abishekpranav403@gmail.com"
              className="glass-card p-4 rounded-xl border border-white/[0.07] hover:border-cyan-500/30 transition-all flex flex-col items-center group"
            >
              <Mail className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Email</div>
              <div className="text-xs text-slate-200 font-medium mt-0.5">Abishekpranav403@gmail.com</div>
            </a>

            <a
              href="tel:+916383500484"
              className="glass-card p-4 rounded-xl border border-white/[0.07] hover:border-cyan-500/30 transition-all flex flex-col items-center group"
            >
              <Phone className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Direct Phone</div>
              <div className="text-xs text-slate-200 font-medium mt-0.5">+91 63835 00484</div>
            </a>

            <div className="glass-card p-4 rounded-xl border border-white/[0.07] flex flex-col items-center">
              <MapPin className="w-5 h-5 text-cyan-400 mb-1" />
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Location</div>
              <div className="text-xs text-slate-200 font-medium mt-0.5">Coimbatore, Tamil Nadu</div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © 2026 Abishek Pranav G V · Engineered with React 18, TypeScript, Vite &amp; Tailwind CSS
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/abishekainunes-cmyk"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/abishek-pranav-g-v-/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
              <button
                onClick={openResume}
                className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> View CV
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
