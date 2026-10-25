"""Candidate Experience Evidence Audit & Timeline Calculation Engine.

Performs rigorous chronological audit, prevents double-counting of overlapping
roles, separates professional automation experience from general operations,
internships, academic work, and personal projects, and flags unverified metrics.
"""

from __future__ import annotations
import datetime
from typing import Dict, Any, List, Optional, Tuple, Set
from pydantic import BaseModel, Field


class EmploymentRecord(BaseModel):
    id: str
    organization: str
    official_title: str
    functional_title: Optional[str] = None
    start_date: str  # YYYY-MM
    end_date: str    # YYYY-MM or 'Present'
    employment_type: str  # 'Contract / Automation Project', 'Full-time', 'Internship', 'Student Employment', 'Accounting Support'
    category: str         # 'automation', 'operations_analytics', 'operations', 'hr', 'finance'
    has_automation_responsibilities: bool = False
    documented_responsibilities: List[str] = Field(default_factory=list)
    relevant_automation_responsibilities: List[str] = Field(default_factory=list)
    evidence_source: str = ""
    verification_status: str = "DOCUMENTED"  # 'VERIFIED', 'DOCUMENTED_PROJECT', 'DOCUMENTED_EMPLOYMENT', 'NEEDS_VERIFICATION'
    verified_outcomes: List[str] = Field(default_factory=list)
    flagged_claims: List[str] = Field(default_factory=list)


# Verified Chronological Employment History
RAW_EMPLOYMENT_RECORDS: List[EmploymentRecord] = [
    EmploymentRecord(
        id="EMP-NUNES",
        organization="Nunes Instrumentation",
        official_title="Automation Contributor / Forward Deployed Automation",
        functional_title="Generative AI & Forward Deployed Engineer",
        start_date="2026-08",
        end_date="Present",
        employment_type="Contract / Automation Project",
        category="automation",
        has_automation_responsibilities=True,
        documented_responsibilities=[
            "Contributed to five business automation workflows across Google Workspace, product lookup, and Windows maintenance.",
            "Implemented IGNIS file classification and indexing for 19,000+ Google Drive records using Google Apps Script and Sheets.",
            "Built multi-account Gmail cleaning script with Python, Gmail API, and OAuth authentication.",
            "Automated scheduled Windows temporary-file cleaning using PowerShell and Windows Task Scheduler.",
            "Developed AI-assisted IndiaMART product research, specification extraction, and media lookup workflows.",
            "Built Price Master search and indexing prototype across Excel, Drive, and supplier records."
        ],
        relevant_automation_responsibilities=[
            "Python automation scripts for Gmail API OAuth message triage and cleaning.",
            "Google Apps Script & Drive API indexing 19,000+ records in IGNIS.",
            "PowerShell maintenance automation scheduled via Windows Task Scheduler.",
            "API and prompt workflows for product specification extraction and price lookup."
        ],
        evidence_source="Git codebases, Apps Script sheets, and project deliverables at Nunes Instrumentation.",
        verification_status="DOCUMENTED_PROJECT",
        verified_outcomes=[
            "Successfully indexed 19,000+ files in IGNIS spreadsheet index (rescan runtime ongoing optimization).",
            "Functional multi-account Gmail cleaning script operating with OAuth tokens."
        ],
        flagged_claims=[
            "Production deployment across multi-PC environments is in progress; avoid claiming enterprise-wide unattended deployment until verified."
        ]
    ),
    EmploymentRecord(
        id="EMP-RXG",
        organization="RXG Studios",
        official_title="Operations & Business Analytics",
        functional_title="Operations & Business Analytics Lead",
        start_date="2025-05",
        end_date="2025-11",
        employment_type="Full-time",
        category="operations_analytics",
        has_automation_responsibilities=True,
        documented_responsibilities=[
            "Managed export documentation, export platform submissions, and shipment workflows.",
            "Streamlined invoicing, TDS records, Tally reconciliation, and Bills of Lading tracking.",
            "Maintained CRM customer records and coordinated international buyer documentation.",
            "Standardized financial reconciliation workflows across ledger entries and bank statements."
        ],
        relevant_automation_responsibilities=[
            "Advanced Excel automation and template standardization for export shipping documents, reducing repetitive data entry.",
            "Structured spreadsheet reconciliation models for Tally ledger and TDS data."
        ],
        evidence_source="Employment verification and export operational records at RXG Studios.",
        verification_status="DOCUMENTED_EMPLOYMENT",
        verified_outcomes=[
            "Observed ~30% reduction in manual documentation processing effort across export platform entries."
        ],
        flagged_claims=[
            "Ensure 30% time-saving metric is cited as an internal process observation, not an independently audited benchmark."
        ]
    ),
    EmploymentRecord(
        id="EMP-GML",
        organization="Greenwich Meridian Logistics India Pvt Ltd",
        official_title="Business Development Intern",
        functional_title="Business Development Intern",
        start_date="2024-05",
        end_date="2024-08",
        employment_type="Internship",
        category="operations",
        has_automation_responsibilities=False,
        documented_responsibilities=[
            "Researched freight-forwarding client prospects and maintained CRM sales pipelines.",
            "Mapped cross-border logistics workflows and coordinated client account shipment status.",
            "Supported documentation turnaround for ocean and air freight tracking."
        ],
        relevant_automation_responsibilities=[
            "Process mapping and spreadsheet pipeline tracking (process improvement, not coded software automation)."
        ],
        evidence_source="Internship completion letter from Greenwich Meridian Logistics.",
        verification_status="VERIFIED_INTERNSHIP",
        verified_outcomes=[
            "Improved shipment-document turnaround tracking across assigned client accounts."
        ],
        flagged_claims=[
            "Do not count as software engineering or coding automation experience."
        ]
    ),
    EmploymentRecord(
        id="EMP-SMYRNA",
        organization="Smyrna Fellowship Trust",
        official_title="HR & Operations Intern",
        functional_title="HR & Operations Intern",
        start_date="2023-06",
        end_date="2023-08",
        employment_type="Internship",
        category="hr",
        has_automation_responsibilities=False,
        documented_responsibilities=[
            "Restructured candidate screening rubrics and applicant intake spreadsheets.",
            "Coordinated interview schedules and streamlined applicant record tracking.",
            "Assisted HR operations and volunteer intake pipelines."
        ],
        relevant_automation_responsibilities=[
            "Applicant spreadsheet intake and screening workflow design (administrative workflow, not programming)."
        ],
        evidence_source="Internship certificate from Smyrna Fellowship Trust.",
        verification_status="VERIFIED_INTERNSHIP",
        verified_outcomes=[
            "Structured applicant tracking reduced initial screening turnaround time."
        ],
        flagged_claims=[
            "Avoid claims of '2.5x recruitment acceleration' unless backed by formal recruitment logs; present as structured rubric turnaround."
        ]
    ),
    EmploymentRecord(
        id="EMP-WOXSEN",
        organization="Woxsen University, Centre of Skill Development",
        official_title="Intern & Event Coordinator",
        functional_title="Intern & Event Coordinator",
        start_date="2023-01",
        end_date="2025-02",
        employment_type="Student Employment / Operational Support",
        category="operations",
        has_automation_responsibilities=False,
        documented_responsibilities=[
            "Coordinated event operations, executive communications, and marketing for Campus Quest and Dinner with CEO.",
            "Managed multi-stakeholder logistics and operational workflows for university summits.",
            "Assisted skill development center workshops and guest speaker itineraries."
        ],
        relevant_automation_responsibilities=[],
        evidence_source="Woxsen University student coordinator appointment and event documentation.",
        verification_status="VERIFIED_UNIVERSITY_ROLE",
        verified_outcomes=[
            "Executed event logistics for multiple university leadership events."
        ],
        flagged_claims=[
            "Overlaps with degree studies (Sep 2022 – Jun 2025) and summer internships; must not be double-counted as full-time employment."
        ]
    ),
    EmploymentRecord(
        id="EMP-FOUNDRY",
        organization="Foundry Patterns",
        official_title="Assistant Accountant",
        functional_title="Assistant Accountant",
        start_date="2022-01",
        end_date="2022-07",
        employment_type="Accounting Support",
        category="finance",
        has_automation_responsibilities=False,
        documented_responsibilities=[
            "Maintained day-to-day general ledgers, invoice tracking, and Excel transaction records.",
            "Assisted bank reconciliations and verified double-entry accounting entries.",
            "Supported statutory filing documentation and audit preparation."
        ],
        relevant_automation_responsibilities=[],
        evidence_source="Foundry Patterns accounting records and experience reference.",
        verification_status="VERIFIED_EMPLOYMENT",
        verified_outcomes=[
            "Accurate monthly ledger maintenance and reconciliation verification."
        ],
        flagged_claims=[
            "Strictly financial accounting support; zero software programming."
        ]
    )
]

# Separate Technical & Academic Projects (NOT counted as employment tenure)
TECHNICAL_PROJECTS = [
    {
        "id": "PROJ-FACE-REC",
        "name": "Face Recognition Attendance & Access System",
        "tech": "Python, OpenCV, Haar Cascades / FaceNet",
        "description": "Real-time webcam video stream facial detection and attendance logging prototype.",
        "type": "Technical Project / Prototype",
        "status": "COMPLETED_PROTOTYPE",
        "repository": "https://github.com/AbishekPranavGV"
    },
    {
        "id": "PROJ-CHURN",
        "name": "Customer Churn Decision Analysis Platform",
        "tech": "Python, Scikit-Learn, Streamlit, Pandas",
        "description": "Interpretable ML classification dashboard predicting customer churn risk with feature importance.",
        "type": "Data Analytics Project",
        "status": "COMPLETED_PROJECT",
        "repository": "https://github.com/AbishekPranavGV"
    },
    {
        "id": "PROJ-FORECAST",
        "name": "Retail Inventory & Demand Forecasting",
        "tech": "Python, SQL, Power BI, ARIMA/SARIMA",
        "description": "Time-series forecasting models and interactive Power BI inventory health dashboards.",
        "type": "Analytics & Forecasting Project",
        "status": "COMPLETED_PROJECT",
        "repository": "https://github.com/AbishekPranavGV"
    }
]


class ExperienceAuditEngine:
    """Calculates non-overlapping timeline periods, distinguishes automation experience, and audits evidence."""

    @staticmethod
    def _parse_year_month(ym_str: str) -> Tuple[int, int]:
        """Parses 'YYYY-MM' or 'Present' into (year, month)."""
        if ym_str.lower() == "present":
            now = datetime.datetime.now()
            return now.year, now.month
        parts = ym_str.split("-")
        return int(parts[0]), int(parts[1])

    @classmethod
    def _get_month_set(cls, start_ym: str, end_ym: str) -> Set[str]:
        """Returns a set of 'YYYY-MM' string keys between start and end inclusive."""
        s_y, s_m = cls._parse_year_month(start_ym)
        e_y, e_m = cls._parse_year_month(end_ym)

        months = set()
        cur_y, cur_m = s_y, s_m
        while (cur_y < e_y) or (cur_y == e_y and cur_m <= e_m):
            months.add(f"{cur_y:04d}-{cur_m:02d}")
            cur_m += 1
            if cur_m > 12:
                cur_m = 1
                cur_y += 1
        return months

    @classmethod
    def calculate_audit(cls) -> Dict[str, Any]:
        """Computes true non-overlapping employment time and categorizes experience types."""
        all_work_months: Set[str] = set()
        automation_work_months: Set[str] = set()
        internship_months: Set[str] = set()
        student_work_months: Set[str] = set()
        full_time_months: Set[str] = set()

        records_summary = []
        for r in RAW_EMPLOYMENT_RECORDS:
            months = cls._get_month_set(r.start_date, r.end_date)
            count = len(months)

            all_work_months.update(months)
            if r.has_automation_responsibilities:
                automation_work_months.update(months)

            if "Internship" in r.employment_type:
                internship_months.update(months)
            elif "Student" in r.employment_type:
                student_work_months.update(months)
            elif "Full-time" in r.employment_type:
                full_time_months.update(months)

            records_summary.append({
                "id": r.id,
                "organization": r.organization,
                "official_title": r.official_title,
                "functional_title": r.functional_title,
                "period": f"{r.start_date} to {r.end_date}",
                "duration_months": count,
                "employment_type": r.employment_type,
                "has_automation": r.has_automation_responsibilities,
                "verification_status": r.verification_status,
                "evidence_source": r.evidence_source,
                "verified_outcomes": r.verified_outcomes,
                "flagged_claims": r.flagged_claims
            })

        total_elapsed_months = len(all_work_months)
        total_automation_months = len(automation_work_months)

        # Convert months to years and months representation
        total_elapsed_str = f"{total_elapsed_months // 12} yrs, {total_elapsed_months % 12} mos ({total_elapsed_months} distinct months)"
        automation_str = f"{total_automation_months // 12} yrs, {total_automation_months % 12} mos ({total_automation_months} distinct months)"

        return {
            "success": True,
            "candidate": "Abishek Pranav G V",
            "headline": "Generative AI & Automation | Python | Business Analysis & Data Analytics",
            "education": [
                {
                    "degree": "Bachelor of Business Administration (BBA), Data Science & AI",
                    "status": "Completed",
                    "period": "Sep 2022 – Jun 2025",
                    "institution": "University Program"
                },
                {
                    "degree": "Master of Business Administration (MBA), Artificial Intelligence",
                    "status": "In progress",
                    "period": "Aug 2025 – May 2027",
                    "institution": "Postgraduate Program"
                },
                {
                    "degree": "Chartered Accountancy (CA) Preparation (Foundation & Intermediate)",
                    "status": "Foundation & Intermediate Level Study",
                    "period": "Jan 2019 – Jan 2022",
                    "institution": "ICAI"
                }
            ],
            "timeline_audit": {
                "total_elapsed_employment_months": total_elapsed_months,
                "total_elapsed_employment_display": total_elapsed_str,
                "relevant_automation_months": total_automation_months,
                "relevant_automation_display": automation_str,
                "overlap_prevention_applied": True,
                "note_on_seniority": (
                    "Do NOT claim '4+ Years Automation Experience'. Total distinct professional automation "
                    f"experience is {total_automation_months} months across Nunes Instrumentation and RXG Studios, "
                    "supplemented by technical projects (IGNIS, churn prediction, OpenCV) and relevant coursework."
                )
            },
            "employment_breakdown": {
                "full_time_months": len(full_time_months),
                "internship_months": len(internship_months),
                "student_employment_months": len(student_work_months),
                "contract_automation_months": len(cls._get_month_set("2026-08", "Present"))
            },
            "records": records_summary,
            "technical_projects_note": (
                "Personal and academic projects (OpenCV Face Recognition, Customer Churn, Inventory Forecasting) "
                "are categorized under Projects and are NOT counted as employment tenure."
            ),
            "projects": TECHNICAL_PROJECTS
        }
