import { useState, useEffect } from "react";
import { FileText, Menu, X, ArrowUpRight, Github, Linkedin, Terminal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "GitHub", href: "#github" },
  { label: "Case Studies", href: "#case-studies" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-md border-b border-white/10 shadow-2xl shadow-black/80"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Terminal Identity Monogram */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="flex items-center font-bold text-lg tracking-tight">
            <span className="font-mono text-cyan-200 bg-cyan-300/10 border border-cyan-300/30 px-2.5 py-1 rounded">
              AP://desk
            </span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-white/90 group-hover:text-cyan-200 transition-colors">
              Abishek Pranav G V
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              AI Engineering Desk
            </span>
          </div>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-medium text-white/75 hover:text-cyan-200 transition-colors py-1 relative hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:w-full hover:after:h-[2px] hover:after:bg-cyan-300"
            >
              {link.label}
            </a>
          ))}
          
          <div className="flex items-center space-x-3 pl-2 border-l border-white/10">
            <a 
              href="https://github.com/AbishekPranavGV" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white/60 hover:text-cyan-200 transition-colors"
              aria-label="GitHub Profile"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="https://www.linkedin.com/in/abishek-pranav-g-v-/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white/60 hover:text-cyan-200 transition-colors"
              aria-label="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex gap-1.5 border-white/15 hover:border-cyan-300/40 text-white/80 hover:text-white bg-white/[0.04] text-xs font-mono h-9 px-3"
          >
            <a href="./Abishek_Pranav_Resume.pdf" download="Abishek_Pranav_GV_Resume.pdf">
              <FileText className="w-3.5 h-3.5 text-cyan-300" /> Resume.pdf
            </a>
          </Button>

          <Button
            asChild
            size="sm"
            className="gap-1.5 bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-bold text-xs h-9 px-4 rounded-md shadow-md shadow-cyan-300/20 transition"
          >
            <a href="#contact">
              Let's Talk <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-white/10 px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-white/80 hover:text-cyan-200 transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="https://github.com/AbishekPranavGV" target="_blank" rel="noreferrer" className="text-white/70 hover:text-cyan-200">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/abishek-pranav-g-v-/" target="_blank" rel="noreferrer" className="text-white/70 hover:text-cyan-200">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-white/15 text-white/90 text-xs h-8"
            >
              <a href="./Abishek_Pranav_Resume.pdf" download="Abishek_Pranav_GV_Resume.pdf">
                <FileText className="w-3 h-3 text-cyan-300 mr-1" /> Resume
              </a>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
