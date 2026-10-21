import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import FeaturedProjectsSection from "@/components/FeaturedProjectsSection";
import ProjectDirectorySection from "@/components/ProjectDirectorySection";
import CaseStudiesSection from "@/components/CaseStudiesSection";
import ExperienceSection from "@/components/ExperienceSection";
import EducationSection from "@/components/EducationSection";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-[#F8FAFC] selection:bg-cyan-300 selection:text-black">
      {/* 01 — Terminal Navigation Desk */}
      <Navbar />

      {/* 02 — Hero Section: AI Engineering Desk & Telemetry Scan */}
      <HeroSection />

      {/* 03 — Operator Profile: Bio & Triple Intersection Visualizer */}
      <AboutSection />

      {/* 04 — AI Build Pipeline: 8-Stage Methodology (Reason -> Observe) */}
      <SkillsSection />

      {/* 05 — Project Case Files: Before / Built / After Architecture */}
      <FeaturedProjectsSection />

      {/* 06 — GitHub Live Console: All 20 Repositories Deployed */}
      <ProjectDirectorySection />

      {/* 07 — In-Depth Systems Case Studies */}
      <CaseStudiesSection />

      {/* 08 — Professional Industry Experience */}
      <ExperienceSection />

      {/* 09 — Education & Foundational Training */}
      <EducationSection />

      {/* 10 — Uplink & Contact */}
      <ContactSection />
    </div>
  );
};

export default Index;
