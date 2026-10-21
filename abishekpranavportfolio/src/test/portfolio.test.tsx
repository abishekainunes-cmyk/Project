import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Navbar from "@/components/Navbar";
import SkillsSection from "@/components/SkillsSection";
import EducationSection from "@/components/EducationSection";
import ContactSection from "@/components/ContactSection";

describe("Portfolio V3 Essential Components", () => {
  it("renders Navbar with brand and action link", () => {
    render(<Navbar />);
    expect(screen.getByText(/ABISHEK PRANAV/i)).toBeInTheDocument();
    expect(screen.getByText(/Let's (Talk|Connect)/i)).toBeInTheDocument();
  });

  it("renders AI Build Pipeline and Technical Skills", () => {
    render(<SkillsSection />);
    expect(screen.getByText(/AI Build Pipeline/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reason" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orchestrate" })).toBeInTheDocument();
  });

  it("renders Education and Certifications", () => {
    render(<EducationSection />);
    expect(screen.getByText(/Education & Certifications/i)).toBeInTheDocument();
    expect(screen.getByText(/MBA in Artificial Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Woxsen University/i)).toBeInTheDocument();
  });

  it("renders Contact Section with requested headline", () => {
    render(<ContactSection />);
    expect(screen.getByText(/Have a complex problem\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Let's build a clear solution\./i)).toBeInTheDocument();
    expect(screen.getByText(/Abishekpranav403@gmail\.com/i)).toBeInTheDocument();
  });

  it("renders full Index page without throwing", async () => {
    const { default: Index } = await import("@/pages/Index");
    const { container } = render(<Index />);
    expect(container).toBeDefined();
  });

  it("renders full App component with Providers and Router", async () => {
    const { default: App } = await import("@/App");
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
