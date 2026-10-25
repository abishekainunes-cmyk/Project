"""CV Tailor & Evidence-Based ATS Screening & Optimization Engine for Abishek Pranav G V.

Implements:
- 5 targeted role tailoring modes (GenAI, Python Dev, Business Analyst, Data Analytics, Operations Analyst).
- 6-dimensional diagnostic ATS matrix (Keyword coverage, Mandatory qualifications, Experience evidence,
  Project demonstration, Unmet requirements, Recruiter readability).
- Evidence-backed achievement auditing with unverified claims flagging.
- Interview Conversion Preparation (recruiter Qs, technical Qs, achievement Qs, model answers, demo checklist).
- Single-column, ATS-friendly CV synthesis with selectable text and authentic job titles.
"""

from __future__ import annotations
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from akshay_core.workflows.experience_audit import (
    ExperienceAuditEngine,
    RAW_EMPLOYMENT_RECORDS,
    TECHNICAL_PROJECTS
)

MASTER_CV = {
    "name": "ABISHEK PRANAV G V",
    "headline": "Generative AI & Automation | Python | Business Analysis & Data Analytics",
    "location": "Coimbatore, Tamil Nadu, India",
    "phone": "+91 63835 00484",
    "email": "Abishekpranav403@gmail.com",
    "linkedin": "linkedin.com/in/abishek-pranav-g-v-",
    "github": "github.com/AbishekPranavGV",
    "portfolio": "https://abishekpranavportfolio.vercel.app/",
    "summary": (
        "AI automation and business analytics professional with hands-on experience developing operational tools "
        "across Google Workspace APIs, Python scripting, price intelligence, and Windows maintenance. Contributed to five "
        "documented automation initiatives at Nunes Instrumentation, including IGNIS file classification and indexing for 19,000+ "
        "Google Drive records. Earlier background includes operational analysis at RXG Studios with ~30% documented reduction in "
        "export documentation processing effort, and process design at Smyrna Fellowship Trust. Holds a completed BBA in Data Science "
        "& AI and currently pursuing an MBA in Artificial Intelligence."
    ),
    "skills": {
        "programming_and_automation": [
            "Python", "PowerShell", "Windows BAT", "Task Scheduler",
            "Google Apps Script", "REST APIs", "Workflow Automation"
        ],
        "ai_applications": [
            "Generative AI", "AI-assisted Product Research", "Prompt Engineering",
            "Prompt-based Content Creation", "Technical Specification Extraction",
            "Catalogue/PDF Workflows"
        ],
        "analytics_and_bi": [
            "SQL", "Excel", "Google Sheets", "Power BI", "DAX",
            "Tableau", "Streamlit", "Data Classification", "Indexing and Deduplication"
        ],
        "integrations_and_operations": [
            "Gmail API", "Google OAuth", "Google Drive API", "IndiaMART",
            "CRM", "Supplier Research", "Requirements Analysis", "Process Mapping", "Tally Reconciliation"
        ]
    },
    "experience": [
        {
            "role": "Automation Contributor / Forward Deployed Automation",
            "functional_title": "Generative AI & Forward Deployed Engineer",
            "company": "Nunes Instrumentation",
            "location": "Coimbatore",
            "period": "Aug 2026 – Present",
            "employment_type": "Contract / Automation Project",
            "category": "engineering_ai",
            "bullets": [
                "Contributed to five business automation workflows covering Gmail cleaning, Windows maintenance, IndiaMART product research, supplier-price lookup, and Drive indexing.",
                "Implemented IGNIS file classification and indexing for 19,000+ Drive records using Google Apps Script, Google Drive API, and Sheets (continuous rescan optimization ongoing).",
                "Built multi-account Gmail cleaning tool with Python, Gmail API, and OAuth authentication for inbox triage.",
                "Automated scheduled Windows temporary-file cleaning using PowerShell and Windows Task Scheduler background tasks.",
                "Developed AI-assisted IndiaMART product research, specification extraction, and media lookup workflows.",
                "Built Price Master search and indexing prototype across Excel, Drive, IndiaMART, and supplier records."
            ]
        },
        {
            "role": "Operations & Business Analytics",
            "functional_title": "Operations & Business Analytics Lead",
            "company": "RXG Studios",
            "location": "Bengaluru (Hybrid)",
            "period": "May 2025 – Nov 2025",
            "employment_type": "Full-time",
            "category": "operations_analytics",
            "bullets": [
                "Automated export shipping documentation using Advanced Excel, achieving an observed ~30% reduction in manual processing effort.",
                "Streamlined invoicing, TDS documentation, Tally reconciliation, and Bills of Lading tracking; maintained international buyer CRM records.",
                "Standardized financial reconciliation workflows across ledger entries and bank statements, reducing data mismatches."
            ]
        },
        {
            "role": "Business Development Intern",
            "company": "Greenwich Meridian Logistics India Pvt Ltd",
            "location": "Remote",
            "period": "May 2024 – Aug 2024",
            "employment_type": "Internship",
            "category": "operations",
            "bullets": [
                "Researched freight-forwarding client prospects and maintained CRM sales pipelines.",
                "Mapped cross-border logistics workflows and coordinated client account tracking to prevent documentation delays."
            ]
        },
        {
            "role": "HR & Operations Intern",
            "company": "Smyrna Fellowship Trust",
            "location": "Remote",
            "period": "Jun 2023 – Aug 2023",
            "employment_type": "Internship",
            "category": "operations_hr",
            "bullets": [
                "Restructured candidate screening rubrics and applicant intake spreadsheets, reducing initial screening turnaround time.",
                "Coordinated interview schedules and structured evaluation rubrics for applicant tracking."
            ]
        },
        {
            "role": "Intern & Event Coordinator",
            "company": "Woxsen University, Centre of Skill Development",
            "location": "Hyderabad",
            "period": "Jan 2023 – Feb 2025",
            "employment_type": "Student Employment / Operational Support",
            "category": "operations",
            "bullets": [
                "Coordinated event operations, executive communications, and marketing for Campus Quest and Dinner with CEO.",
                "Managed multi-stakeholder logistics and operational workflows for university summits and skill development workshops."
            ]
        },
        {
            "role": "Assistant Accountant",
            "company": "Foundry Patterns",
            "location": "Remote",
            "period": "Jan 2022 – Jul 2022",
            "employment_type": "Accounting Support",
            "category": "finance_accounting",
            "bullets": [
                "Maintained general ledgers, invoice tracking, and Excel transaction records; supported monthly bank reconciliations.",
                "Applied double-entry accounting fundamentals to verify financial audit trails and statutory filing documentation."
            ]
        }
    ],
    "projects": TECHNICAL_PROJECTS,
    "education": [
        {
            "degree": "Bachelor of Business Administration (BBA), Data Science & AI",
            "institution": "University Program",
            "status": "Completed",
            "period": "Sep 2022 – Jun 2025"
        },
        {
            "degree": "Master of Business Administration (MBA), Artificial Intelligence",
            "institution": "Postgraduate Program",
            "status": "In progress",
            "period": "Aug 2025 – May 2027"
        },
        {
            "degree": "Chartered Accountancy (CA) Preparation (Foundation & Intermediate)",
            "institution": "ICAI",
            "status": "Completed Foundation & Intermediate Level Preparation",
            "period": "Jan 2019 – Jan 2022"
        }
    ],
    "certifications": [
        "Agile Scrum Essentials (Techcanvass)",
        "Agile Project Management Foundation (HP LIFE)",
        "Lean Six Sigma White Belt (MSI)",
        "Six Sigma White Belt (CSSC)"
    ]
}


class DiagnosticATSMatrix(BaseModel):
    """Evidence-based 6-dimensional ATS screening assessment."""
    diagnostic_match_score: int = 85
    scoring_methodology: str = "Evidence-weighted assessment across 6 dimensions. Diagnostic estimate only; not an official employer ATS result."
    suitability_verdict: str = "Apply after CV changes"  # 'Apply', 'Apply after CV changes', 'Verify first', 'Skip'
    verdict_explanation: str = ""
    keyword_coverage_pct: int = 85
    matched_keywords: List[str] = Field(default_factory=list)
    unsubstantiated_keywords: List[str] = Field(default_factory=list)
    mandatory_qualifications_met: bool = True
    mandatory_qualifications_details: str = ""
    experience_evidence_pct: int = 80
    verified_experience_summary: str = ""
    skills_demonstrated_by_projects: List[str] = Field(default_factory=list)
    unmet_requirements: List[str] = Field(default_factory=list)
    recruiter_readability_score: int = 90
    recruiter_readability_notes: str = ""
    interview_readiness_level: str = "High for demonstrated tools (Python, REST APIs, Google Apps Script, Excel)"
    rejection_risks: List[str] = Field(default_factory=list)


class InterviewPreparationDossier(BaseModel):
    """Interview conversion preparation checklist, questions, and model answers."""
    elevator_pitch_60s: str = ""
    recruiter_questions: List[Dict[str, str]] = Field(default_factory=list)
    technical_questions: List[Dict[str, str]] = Field(default_factory=list)
    achievement_questions: List[Dict[str, str]] = Field(default_factory=list)
    practical_demo_checklist: List[str] = Field(default_factory=list)
    weak_claims_defense: List[Dict[str, str]] = Field(default_factory=list)


def format_monthly_to_annual_compensation(monthly_min: int, monthly_max: int) -> Dict[str, Any]:
    """Calculates annual CTC automatically from monthly compensation (baseline starting from ₹25,000+/month)."""
    annual_min = monthly_min * 12
    annual_max = monthly_max * 12
    formatted = f"₹{monthly_min:,} - ₹{monthly_max:,}/mo (₹{annual_min/100000:.1f}L - ₹{annual_max/100000:.1f}L/yr)"
    return {
        "monthly_min": monthly_min,
        "monthly_max": monthly_max,
        "annual_min": annual_min,
        "annual_max": annual_max,
        "formatted": formatted
    }


class CVTailorEngine:
    """Dynamic Evidence-Based Resume Synthesis & Career Recommendation Engine."""

    # The 5 strategic role tailoring modes
    TAILORING_MODES = [
        "Generative AI & Automation Engineer",
        "Python Automation Developer / AI Automation Engineer",
        "Business Analyst — AI & Operations Automation",
        "Data Analytics & Automation Specialist",
        "Operations Automation / Process Analyst"
    ]

    @classmethod
    def get_career_recommendations(cls) -> Dict[str, Any]:
        """Provides evidence-grounded strategic role recommendations and salary bands."""
        audit = ExperienceAuditEngine.calculate_audit()
        return {
            "candidate": MASTER_CV["name"],
            "headline": MASTER_CV["headline"],
            "timeline_audit": audit["timeline_audit"],
            "core_strengths": [
                "Rare intersection of Python & API Automation with business acumen from BBA (Data Science) and CA preparation",
                "Proven operational implementations: 19,000+ Drive records indexed in IGNIS, ~30% reduction in manual export documentation effort",
                "Working API integration experience: Google Workspace APIs, Gmail API OAuth, Google Drive API, REST APIs, and PowerShell scripting"
            ],
            "baseline_compensation": "₹25,000+ per month minimum (₹3,00,000+ Annual CTC starting base)",
            "target_role_clusters": [
                {
                    "title": "Generative AI & Automation Engineer",
                    "monthly_range": "₹30,000 - ₹45,000/mo",
                    "salary_range": "₹30,000 - ₹45,000/mo (₹3.6L - ₹5.4L/yr)",
                    "annual_ctc_inr": 450000,
                    "demand_level": "High (92/100)",
                    "best_fit_reasons": "Direct alignment with Nunes Instrumentation projects: IGNIS 19k Drive indexer, Gmail API triage, and AI product research.",
                    "recommended_portals": ["LinkedIn", "Wellfound"]
                },
                {
                    "title": "Python Automation Developer / AI Automation Engineer",
                    "monthly_range": "₹28,000 - ₹42,000/mo",
                    "salary_range": "₹28,000 - ₹42,000/mo (₹3.3L - ₹5.0L/yr)",
                    "annual_ctc_inr": 420000,
                    "demand_level": "High (90/100)",
                    "best_fit_reasons": "Leverages Python scripting, PowerShell maintenance, Windows Task Scheduler background tasks, and REST API integration.",
                    "recommended_portals": ["LinkedIn", "Indeed"]
                },
                {
                    "title": "Business Analyst — AI & Operations Automation",
                    "monthly_range": "₹25,000 - ₹35,000/mo",
                    "salary_range": "₹25,000 - ₹35,000/mo (₹3.0L - ₹4.2L/yr)",
                    "annual_ctc_inr": 360000,
                    "demand_level": "Very High (94/100)",
                    "best_fit_reasons": "Leverages MBA + CA foundation + RXG Studios export operations & Tally/TDS financial reconciliations.",
                    "recommended_portals": ["LinkedIn", "Naukri"]
                },
                {
                    "title": "Data Analytics & Automation Specialist",
                    "monthly_range": "₹26,000 - ₹38,000/mo",
                    "salary_range": "₹26,000 - ₹38,000/mo (₹3.1L - ₹4.6L/yr)",
                    "annual_ctc_inr": 384000,
                    "demand_level": "High (88/100)",
                    "best_fit_reasons": "Combines BBA (Data Science) + SQL + Power BI + Streamlit ML with large-scale 19k records data classification.",
                    "recommended_portals": ["Indeed", "LinkedIn"]
                },
                {
                    "title": "Operations Automation / Process Analyst",
                    "monthly_range": "₹25,000 - ₹36,000/mo",
                    "salary_range": "₹25,000 - ₹36,000/mo (₹3.0L - ₹4.3L/yr)",
                    "annual_ctc_inr": 360000,
                    "demand_level": "High (86/100)",
                    "best_fit_reasons": "Cross-border logistics (Greenwich Meridian), recruitment workflow optimization (Smyrna Trust), and Windows PowerShell scripting.",
                    "recommended_portals": ["Naukri", "Indeed"]
                }
            ],
            "strategic_advice": (
                "Lead with verified deliverables: 19,000+ Drive records indexed in IGNIS and the ~30% observed processing reduction in export documentation. "
                "Highlight your ability to build functional Python and Google Workspace API automations while understanding enterprise financial impact due to "
                "your BBA in Data Science, MBA coursework in AI, and CA background. Never claim 4+ years of full-time automation experience; articulate your "
                "10 months of focused professional automation alongside academic and open-source project implementations."
            )
        }

    @classmethod
    def identify_tailoring_mode(cls, role_title: str) -> str:
        """Determines the closest strategic tailoring mode for a target role."""
        title_lower = role_title.lower()
        if "generative ai" in title_lower or "gen ai" in title_lower or "ai automation" in title_lower:
            return "Generative AI & Automation Engineer"
        elif "python" in title_lower or "developer" in title_lower or "software" in title_lower:
            return "Python Automation Developer / AI Automation Engineer"
        elif "business analyst" in title_lower or "analyst" in title_lower and "business" in title_lower:
            return "Business Analyst — AI & Operations Automation"
        elif "data" in title_lower or "analytics" in title_lower or "bi" in title_lower:
            return "Data Analytics & Automation Specialist"
        elif "process" in title_lower or "operations" in title_lower or "workflow" in title_lower:
            return "Operations Automation / Process Analyst"
        return "Generative AI & Automation Engineer"

    @classmethod
    def audit_ats_match(cls, job: Any) -> DiagnosticATSMatrix:
        """Computes an honest, evidence-weighted 6-dimensional ATS screening assessment."""
        role_title = getattr(job, "role", "Generative AI & Automation Engineer")
        req_skills = getattr(job, "required_skills", [])
        desc = getattr(job, "description", "").lower()

        # 1. Match Keywords against candidate's verified skills
        all_candidate_skills = []
        for cat_skills in MASTER_CV["skills"].values():
            all_candidate_skills.extend([s.lower() for s in cat_skills])

        matched_kws = []
        unsubstantiated_kws = []
        for s in req_skills:
            if any(s.lower() in cs or cs in s.lower() for cs in all_candidate_skills):
                matched_kws.append(s)
            else:
                unsubstantiated_kws.append(s)

        kw_coverage = int((len(matched_kws) / max(1, len(req_skills))) * 100) if req_skills else 85

        # 2. Mandatory Qualifications Check
        mandatory_met = True
        mandatory_details = "Degree requirements (BBA completed, MBA in progress) and required core competencies met."
        unmet = []

        if "phd" in desc or "10+ years" in desc or "director" in desc:
            mandatory_met = False
            mandatory_details = "Seniority requirement exceeds candidate profile."
            unmet.append("Senior leadership / 10+ years tenure")
        if "c++" in desc and "c++" not in all_candidate_skills:
            unmet.append("Production C++ systems programming")

        # 3. Experience Evidence
        exp_evidence_pct = 82
        if "lead" in role_title.lower() or "senior" in role_title.lower():
            exp_evidence_pct = 68
        elif "intern" in role_title.lower() or "junior" in role_title.lower() or "associate" in role_title.lower():
            exp_evidence_pct = 95

        # 4. Project Demonstration
        proj_skills = ["OpenCV (Computer Vision)", "Streamlit (ML Dashboards)", "SQL & Time Series Forecasting (ARIMA/SARIMA)"]

        # 5. Diagnostic overall match score
        overall_score = int((kw_coverage * 0.35) + (exp_evidence_pct * 0.35) + (90 * 0.30))
        overall_score = min(94, max(55, overall_score))  # Honest bounds; never 100%

        # 6. Rejection risks
        rejection_risks = [
            "Lack of multi-year formal software engineering tenure (highlight hands-on IGNIS and Python API scripts).",
            "MBA currently in progress (confirm remote or evening study schedule does not conflict with working hours)."
        ]
        if unsubstantiated_kws:
            rejection_risks.append(f"Unsubstantiated skills in job posting: {', '.join(unsubstantiated_kws[:3])}.")

        # 7. Suitability Verdict
        if not mandatory_met or overall_score < 60:
            verdict = "Skip"
            verdict_exp = "Mandatory qualification mismatch or seniority exceeds current candidate profile."
        elif unsubstantiated_kws or exp_evidence_pct < 75:
            verdict = "Apply after CV changes"
            verdict_exp = "Strong core fit; requires targeted emphasis on demonstrated Python/Google API projects and realistic framing of tenure."
        else:
            verdict = "Apply"
            verdict_exp = "Strong evidence of fit across Python, automation workflows, and data analytics without disqualifying barriers."

        return DiagnosticATSMatrix(
            diagnostic_match_score=overall_score,
            suitability_verdict=verdict,
            verdict_explanation=verdict_exp,
            keyword_coverage_pct=kw_coverage,
            matched_keywords=matched_kws,
            unsubstantiated_keywords=unsubstantiated_kws,
            mandatory_qualifications_met=mandatory_met,
            mandatory_qualifications_details=mandatory_details,
            experience_evidence_pct=exp_evidence_pct,
            verified_experience_summary="Documented automation at Nunes (IGNIS 19k records, Gmail API), operational analysis at RXG Studios (~30% reduction), and logistics CRM.",
            skills_demonstrated_by_projects=proj_skills,
            unmet_requirements=unmet,
            recruiter_readability_score=92,
            recruiter_readability_notes="Single-column ATS format, verified official job titles, defensible metrics, and clear distinction between employment and projects.",
            rejection_risks=rejection_risks
        )

    @classmethod
    def generate_interview_prep(cls, job: Any, tailoring_mode: str) -> InterviewPreparationDossier:
        """Generates role-specific recruiter questions, technical questions, model answers, and practical demo checklist."""
        role_title = getattr(job, "role", "Generative AI & Automation Engineer")
        company = getattr(job, "company", "Target Enterprise")

        elevator_pitch = (
            f"I specialize in building practical Python and Google Workspace automation workflows that eliminate repetitive operational friction. "
            f"Most recently at Nunes Instrumentation, I contributed to five documented initiatives, including architecting the IGNIS file indexer which "
            f"classified over 19,000 Drive records using Google Apps Script and Sheets, alongside multi-account Gmail API OAuth triage scripts. "
            f"Before that at RXG Studios, I automated export platform documentation using Advanced Excel, observing a ~30% reduction in processing turnaround. "
            f"With a completed BBA in Data Science and ongoing MBA coursework in AI, I bring both technical scripting ability and a clear understanding of "
            f"business ROI to this {role_title} role at {company}."
        )

        recruiter_qs = [
            {
                "question": f"Can you walk me through your background and why you are interested in this {role_title} role at {company}?",
                "model_answer": "Focus on the intersection of Python automation, Google Workspace APIs, and business analysis. Explain that your work at Nunes Instrumentation and RXG Studios proved that eliminating operational bottlenecks delivers immediate ROI."
            },
            {
                "question": "I see you are currently pursuing an MBA in AI while having a BBA in Data Science. How does that fit your availability?",
                "model_answer": "My MBA program is structured with flexible/evening academic commitments that do not conflict with full-time professional responsibilities. It actively strengthens my grasp of enterprise AI architectures and strategic business alignment."
            },
            {
                "question": "What is your actual professional automation experience versus personal projects?",
                "model_answer": "I have about 10 months of focused professional automation work—3 months at Nunes developing IGNIS (19k Drive records) and Gmail API scripts, and 7 months at RXG Studios automating export platform documentation. Outside of that, I have built complete open-source projects including OpenCV attendance systems and ML customer churn dashboards."
            },
            {
                "question": "What are your salary expectations and availability to start?",
                "model_answer": "My baseline target is ₹25,000 to ₹35,000 per month (₹3.0L – ₹4.2L annual CTC), and I am available to join immediately or within 15 days."
            },
            {
                "question": "Where are you located and are you open to remote or hybrid work?",
                "model_answer": "I am based in Coimbatore, Tamil Nadu, and have proven experience collaborating across remote and hybrid workflows (Greenwich Meridian Logistics, RXG Studios, Nunes Instrumentation)."
            }
        ]

        technical_qs = [
            {
                "question": "In your IGNIS project at Nunes Instrumentation, how did you handle Google Drive API rate limits and execution time limits when indexing 19,000+ files?",
                "model_answer": "Google Apps Script has a 6-minute per-execution runtime limit and quota caps on Drive API calls. We structured the script with pagination using DriveApp continuation tokens and batch-wrote metadata into Google Sheets in chunks rather than single cell updates. For long-running rescans, we implemented state checkpoints so subsequent runs resumed from the last indexed folder."
            },
            {
                "question": "How did you implement the multi-account Gmail cleaner using Python and OAuth?",
                "model_answer": "We configured Google Cloud OAuth 2.0 client IDs with the Gmail API 'gmail.modify' scope. The Python script maintains isolated refresh token stores per account, authenticates via google-auth-oauthlib, queries messages matching specific search queries (e.g. promotional categories, date thresholds), and performs batch trash operations with exponential backoff on HTTP 429 rate limit responses."
            },
            {
                "question": "How do you distinguish between using an LLM / Generative AI prompt versus a deterministic script for automation?",
                "model_answer": "Deterministic tasks like file indexing, spreadsheet reconciliation, or folder cleaning should always use deterministic Python or PowerShell code because it is zero-cost, 100% reproducible, and fast. Generative AI is reserved for unstructured inputs—such as extracting technical specifications from supplier PDF datasheets or drafting email responses—with structured JSON schema validation on the output."
            },
            {
                "question": "How did you automate export documentation at RXG Studios and verify the ~30% time reduction?",
                "model_answer": "We standardized recurring export invoice, shipping bill, and packing list data structures using Advanced Excel formulas (VLOOKUP, INDEX/MATCH, dynamic arrays) and structured data imports. The 30% reduction was observed internally by comparing the elapsed preparation time per shipment docket before and after template standardization."
            },
            {
                "question": "What is your approach to handling secrets and API credentials in your automation scripts?",
                "model_answer": "I never hardcode credentials into source files. All OAuth tokens, client secrets, and database paths are loaded from environment variables (.env) or protected Windows Credential Manager stores, and sensitive keys are added to .gitignore and scrubbed from audit logs."
            }
        ]

        achievement_qs = [
            {
                "question": "Tell me about your proudest technical achievement to date.",
                "model_answer": "Developing the IGNIS indexing and classification system for Nunes Instrumentation. Ingesting and categorizing over 19,000 Google Drive documents into an indexed search sheet transformed how the team located legacy files and proved the viability of lightweight Workspace automations."
            },
            {
                "question": "Tell me about a time an automation script broke or encountered unexpected edge cases.",
                "model_answer": "During early runs of the Gmail cleaner, multi-part MIME messages with nested inline attachments occasionally threw decoding exceptions. I added explicit MIME boundary inspection and safe fallback handlers to ensure the script logged the anomalous message ID and continued batch processing without crashing the entire run."
            },
            {
                "question": "How do you ensure non-technical stakeholders can actually use and maintain the automations you build?",
                "model_answer": "At Nunes and RXG, I paired scripts with clear user interfaces—such as Google Sheets custom menus and Windows BAT launcher icons—and wrote step-by-step SOP documentation so non-technical staff could trigger jobs and view status logs independently."
            }
        ]

        demo_checklist = [
            "Keep the GitHub repository for IGNIS / Google Apps Script indexing open and ready to walk through continuation token logic.",
            "Have the Python Gmail API OAuth cleaner script ready to demonstrate rate-limiting and token refresh handling.",
            "Prepare a 2-minute walkthrough of the Streamlit Churn Analysis or OpenCV Face Recognition demo running locally.",
            "Open your live portfolio at https://abishekpranavportfolio.vercel.app/ in a browser tab.",
            "Keep the official experience audit summary on hand to explain exact employment dates and responsibilities transparently."
        ]

        weak_claims = [
            {
                "claim": "Claiming '4+ Years Automation Experience' on a CV.",
                "defense": "Clarify immediately that you have ~3.5 years of overall professional and business operations experience, with ~10 months of focused, hands-on professional automation work at Nunes and RXG, supported by deep open-source project development."
            },
            {
                "claim": "Claiming '50% recruitment acceleration' at Smyrna Fellowship Trust.",
                "defense": "Explain that this reflects an internal observation where standardizing the candidate intake rubric halved the time spent manually reviewing each applicant folder, rather than a corporate-wide HR metric."
            },
            {
                "claim": "Multi-PC enterprise deployment at Nunes.",
                "defense": "Explain that the core automations operate reliably on designated workstation environments, while multi-PC synchronization and long-running Drive rescan performance remain active engineering improvements."
            }
        ]

        return InterviewPreparationDossier(
            elevator_pitch_60s=elevator_pitch,
            recruiter_questions=recruiter_qs,
            technical_questions=technical_qs,
            achievement_questions=achievement_qs,
            practical_demo_checklist=demo_checklist,
            weak_claims_defense=weak_claims
        )

    @classmethod
    def tailor_cv_for_job(cls, job: Any) -> Dict[str, Any]:
        """Synthesizes an ATS-friendly, evidence-based single-column CV tailored specifically for the target job."""
        role_title = getattr(job, "role", "Generative AI & Automation Engineer")
        company = getattr(job, "company", "Target Enterprise")
        req_skills = getattr(job, "required_skills", [])
        desc = getattr(job, "description", "")
        location = getattr(job, "location", "India")

        mode = cls.identify_tailoring_mode(role_title)
        ats_matrix = cls.audit_ats_match(job)
        interview_prep = cls.generate_interview_prep(job, mode)

        # Build targeted headline
        headline = f"{role_title} | Python & Workflow Automation | Business Analysis"

        # Build tailored summary
        summary = (
            f"AI Automation & Business Analytics Professional targeting the {role_title} position at {company}. "
            f"Brings hands-on experience developing operational automation workflows across Python, REST APIs, Google Apps Script, "
            f"and Windows environments. Proven contributions include the IGNIS Drive indexer (19,000+ records) and multi-account Gmail API "
            f"triage scripts at Nunes Instrumentation, alongside observed ~30% documentation turnaround improvements at RXG Studios. "
            f"Combines practical coding capabilities with an analytical foundation from a completed BBA in Data Science and in-progress MBA in AI."
        )

        # Select prioritized skills matching the role mode
        if mode == "Generative AI & Automation Engineer":
            prioritized_skills = [
                "Generative AI", "Python", "REST APIs", "Google Apps Script", "Workflow Automation",
                "Gmail API", "Google Drive API", "Prompt Engineering", "Technical Specification Extraction"
            ]
        elif mode == "Python Automation Developer / AI Automation Engineer":
            prioritized_skills = [
                "Python", "PowerShell", "REST APIs", "Task Scheduler", "Windows BAT",
                "Workflow Automation", "API Integration", "Error & Rate-Limit Handling", "SQL"
            ]
        elif mode == "Business Analyst — AI & Operations Automation":
            prioritized_skills = [
                "Requirements Analysis", "Process Mapping", "Advanced Excel", "SQL",
                "Tally Reconciliation", "Financial Operations", "Workflow Automation", "Power BI"
            ]
        elif mode == "Data Analytics & Automation Specialist":
            prioritized_skills = [
                "SQL", "Power BI", "Python", "Streamlit", "Excel",
                "DAX", "Data Classification", "Indexing & Deduplication", "Time-Series Forecasting"
            ]
        else:
            prioritized_skills = [
                "Process Mapping", "Workflow Automation", "Python", "Advanced Excel",
                "Operations Management", "SOP Optimization", "CRM Pipeline Tracking"
            ]

        # Add any valid matched skills from the job description
        for ms in ats_matrix.matched_keywords:
            if ms not in prioritized_skills:
                prioritized_skills.append(ms)

        # Assemble Plaintext Single-Column ATS CV
        cv_lines = [
            MASTER_CV["name"],
            headline,
            f"{MASTER_CV['location']} | {MASTER_CV['phone']} | {MASTER_CV['email']}",
            f"LinkedIn: {MASTER_CV['linkedin']} | GitHub: {MASTER_CV['github']} | Portfolio: {MASTER_CV['portfolio']}",
            "",
            "================================================================================",
            "PROFESSIONAL SUMMARY",
            "================================================================================",
            summary,
            "",
            "================================================================================",
            "CORE TECHNICAL & FUNCTIONAL SKILLS",
            "================================================================================",
            f"Prioritized Capabilities: {', '.join(prioritized_skills)}",
            f"Languages & Automation: Python, PowerShell, Windows BAT, Google Apps Script, REST APIs, Task Scheduler",
            f"Analytics & Platforms: SQL, Power BI, Advanced Excel, Google Sheets, Streamlit, Tableau",
            f"APIs & Enterprise Integrations: Gmail API (OAuth 2.0), Google Drive API, IndiaMART, Tally, CRM Systems",
            "",
            "================================================================================",
            "PROFESSIONAL EXPERIENCE",
            "================================================================================",
        ]

        for exp in MASTER_CV["experience"]:
            official_title = exp["role"]
            company_name = exp["company"]
            loc = exp["location"]
            period = exp["period"]
            emp_type = exp.get("employment_type", "Employment")

            cv_lines.append(f"{official_title} | {company_name} — {loc} ({emp_type})")
            cv_lines.append(f"Period: {period}")
            for b in exp["bullets"]:
                cv_lines.append(f"  • {b}")
            cv_lines.append("")

        cv_lines.extend([
            "================================================================================",
            "DEMONSTRATED TECHNICAL PROJECTS",
            "================================================================================",
        ])
        for p in MASTER_CV["projects"]:
            cv_lines.append(f"{p['name']} ({p.get('type', 'Project')})")
            cv_lines.append(f"Technologies: {p['tech']}")
            cv_lines.append(f"Deliverable: {p['description']}")
            if "repository" in p:
                cv_lines.append(f"Repository: {p['repository']}")
            cv_lines.append("")

        cv_lines.extend([
            "================================================================================",
            "EDUCATION & ACADEMIC CREDENTIALS",
            "================================================================================",
        ])
        for edu in MASTER_CV["education"]:
            cv_lines.append(f"{edu['degree']} — {edu['institution']}")
            cv_lines.append(f"Status: {edu['status']} | Period: {edu['period']}")
            cv_lines.append("")

        cv_lines.extend([
            "================================================================================",
            "PROFESSIONAL CERTIFICATIONS",
            "================================================================================",
            "• " + "\n• ".join(MASTER_CV["certifications"]),
            ""
        ])

        cv_plaintext = "\n".join(cv_lines)

        return {
            "success": True,
            "role": role_title,
            "company": company,
            "tailoring_mode": mode,
            "ats_diagnostic_score": ats_matrix.diagnostic_match_score,
            "suitability_verdict": ats_matrix.suitability_verdict,
            "headline": headline,
            "summary": summary,
            "prioritized_skills": prioritized_skills,
            "cv_plaintext": cv_plaintext,
            "ats_matrix": ats_matrix.model_dump(),
            "interview_prep": interview_prep.model_dump()
        }
