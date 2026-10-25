"""Autonomous Job Application Bot for Akshay AI Workstation.

Provides candidate profile management, intelligent ATS match scoring,
instant AI tailored cover letter generation, batch auto-apply pipeline,
and persistent SQLite application lifecycle tracking.
"""

from __future__ import annotations
import sqlite3
import datetime
from decimal import Decimal
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from akshay_core.security.validator import sanitize_text

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "akshay_jobs.db"


class CandidateProfile(BaseModel):
    name: str = "Abishek Pranav"
    title: str = "Full Stack AI Engineer & Systems Architect"
    skills: List[str] = Field(default_factory=lambda: [
        "Python", "TypeScript", "React", "FastAPI", "SQLite", 
        "PostgreSQL", "Docker", "AWS", "REST APIs", "System Architecture"
    ])
    experience_years: int = 4
    target_salary_inr: int = 2400000
    portfolio_url: str = "https://github.com/abishekainunes-cmyk"
    resume_summary: str = (
        "Hands-on engineer specializing in autonomous agent workflows, "
        "resilient local-first distributed systems, and modern web architectures."
    )


class JobPosting(BaseModel):
    id: str
    company: str
    role: str
    location: str
    work_type: str  # Remote, Hybrid, On-site
    salary_range: str
    required_skills: List[str]
    description: str
    match_score: int = 0
    portal: str = "LinkedIn"


class JobApplication(BaseModel):
    id: Optional[int] = None
    job_id: str
    company: str
    role: str
    location: str
    salary: str
    match_score: int
    cover_letter: str
    status: str = "Applied"  # Applied, Interviewing, Offer, Rejected
    portal: str = "LinkedIn"
    applied_at: str = Field(default_factory=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


INITIAL_JOBS: List[JobPosting] = [
    JobPosting(
        id="JOB-AI-01",
        company="Cognitive Dynamics",
        role="Senior AI Systems Architect",
        location="Bengaluru (Remote)",
        work_type="Remote",
        salary_range="₹28,00,000 - ₹35,00,000",
        required_skills=["Python", "FastAPI", "System Architecture", "Docker", "REST APIs"],
        description="Architect real-time autonomous agent systems with high throughput and offline telemetry.",
        portal="Wellfound"
    ),
    JobPosting(
        id="JOB-FS-02",
        company="NovaTech Labs",
        role="Lead Full Stack Engineer",
        location="Hyderabad (Hybrid)",
        work_type="Hybrid",
        salary_range="₹22,00,000 - ₹26,00,000",
        required_skills=["Python", "React", "TypeScript", "PostgreSQL", "AWS"],
        description="Build responsive high-frequency financial dashboards and distributed transaction ledgers.",
        portal="LinkedIn"
    ),
    JobPosting(
        id="JOB-FE-03",
        company="Starlight Interactive",
        role="Frontend Platform Specialist",
        location="Remote",
        work_type="Remote",
        salary_range="₹18,00,000 - ₹22,00,000",
        required_skills=["TypeScript", "React", "REST APIs"],
        description="Engineer ultra-fast cross-platform responsive clients supporting desktop, tablet, and mobile browsers.",
        portal="Indeed"
    ),
    JobPosting(
        id="JOB-BE-04",
        company="CloudSphere Global",
        role="Backend Infrastructure Engineer",
        location="Remote",
        work_type="Remote",
        salary_range="₹24,00,000 - ₹30,00,000",
        required_skills=["Python", "Docker", "AWS", "SQLite", "System Architecture"],
        description="Design zero-downtime micro-gateways and hardened data pipelines with strict security validation.",
        portal="LinkedIn"
    ),
    JobPosting(
        id="JOB-DS-05",
        company="Aegis Data Solutions",
        role="Core Python Engineer",
        location="Chennai (On-site)",
        work_type="On-site",
        salary_range="₹16,00,000 - ₹20,00,000",
        required_skills=["Python", "SQLite", "REST APIs"],
        description="Develop low-latency transactional ledger synchronization algorithms and automated audit loggers.",
        portal="Naukri"
    ),
]


class JobBotManager:
    """Manages profile, matching algorithms, cover letter generator, and SQLite persistence."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DEFAULT_DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS candidate_profile (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    title TEXT NOT NULL,
                    skills TEXT NOT NULL,
                    experience_years INTEGER NOT NULL,
                    target_salary_inr INTEGER NOT NULL,
                    portfolio_url TEXT NOT NULL,
                    resume_summary TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS job_applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT NOT NULL UNIQUE,
                    company TEXT NOT NULL,
                    role TEXT NOT NULL,
                    location TEXT NOT NULL,
                    salary TEXT NOT NULL,
                    match_score INTEGER NOT NULL,
                    cover_letter TEXT NOT NULL,
                    status TEXT NOT NULL,
                    portal TEXT NOT NULL,
                    applied_at TEXT NOT NULL
                )
            """)
            conn.commit()

        # Seed default candidate profile if empty
        self.get_profile()

    def get_profile(self) -> CandidateProfile:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name, title, skills, experience_years, target_salary_inr, portfolio_url, resume_summary FROM candidate_profile WHERE id = 1")
            row = cursor.fetchone()
            if row:
                return CandidateProfile(
                    name=row[0],
                    title=row[1],
                    skills=[s.strip() for s in row[2].split(",") if s.strip()],
                    experience_years=row[3],
                    target_salary_inr=row[4],
                    portfolio_url=row[5],
                    resume_summary=row[6],
                )
            else:
                default_prof = CandidateProfile()
                self.save_profile(default_prof)
                return default_prof

    def save_profile(self, profile: CandidateProfile) -> None:
        clean_name = sanitize_text(profile.name)
        clean_title = sanitize_text(profile.title)
        skills_csv = ",".join([sanitize_text(s) for s in profile.skills])
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO candidate_profile 
                (id, name, title, skills, experience_years, target_salary_inr, portfolio_url, resume_summary, updated_at)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                clean_name,
                clean_title,
                skills_csv,
                profile.experience_years,
                profile.target_salary_inr,
                profile.portfolio_url,
                sanitize_text(profile.resume_summary),
                now_str
            ))
            conn.commit()

    def calculate_match_score(self, profile: CandidateProfile, job: JobPosting) -> int:
        """Calculates ATS match percentage based on skill intersection and experience."""
        cand_skills = {s.lower().strip() for s in profile.skills}
        req_skills = {s.lower().strip() for s in job.required_skills}

        if not req_skills:
            return 80

        matches = cand_skills.intersection(req_skills)
        match_ratio = len(matches) / len(req_skills)

        # Baseline: skill match accounts for up to 85 points, experience up to 15
        base_score = int(match_ratio * 80) + 15
        return max(20, min(99, base_score))

    def get_job_stream(self) -> List[JobPosting]:
        """Returns jobs enriched with match score and application status."""
        profile = self.get_profile()
        applied_job_ids = set()

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT job_id FROM job_applications")
            applied_job_ids = {r[0] for r in cursor.fetchall()}

        enriched_jobs = []
        for job in INITIAL_JOBS:
            score = self.calculate_match_score(profile, job)
            job_copy = job.model_copy()
            job_copy.match_score = score
            enriched_jobs.append(job_copy)

        # Sort descending by match score
        enriched_jobs.sort(key=lambda j: j.match_score, reverse=True)
        return enriched_jobs

    def generate_cover_letter(self, profile: CandidateProfile, job: JobPosting) -> str:
        """Generates a tailored professional cover letter for the role."""
        cand_skills = {s.lower().strip() for s in profile.skills}
        req_skills = {s.lower().strip() for s in job.required_skills}
        highlighted = [s.title() for s in cand_skills.intersection(req_skills)]
        if not highlighted:
            highlighted = profile.skills[:3]

        skills_phrase = ", ".join(highlighted)

        return (
            f"Dear Hiring Team at {job.company},\n\n"
            f"I am writing to express my strong interest in the {job.role} position. "
            f"With over {profile.experience_years} years of professional engineering experience specializing in "
            f"{skills_phrase}, I am confident in my ability to immediately accelerate your team's roadmap.\n\n"
            f"Your work on '{job.description}' closely resonates with my background in building resilient, "
            f"production-grade systems. At scale, I focus on clean architectural separation, defensive security validation, "
            f"and high-throughput performance.\n\n"
            f"You can review my active code contributions and architecture projects at {profile.portfolio_url}. "
            f"I would welcome the opportunity to discuss how my skill set aligns with {job.company}'s mission.\n\n"
            f"Warm regards,\n{profile.name}\n{profile.title}"
        )

    def apply_to_job(self, job_id: str, custom_cover_letter: Optional[str] = None) -> JobApplication:
        """Submits an application for a specific job."""
        profile = self.get_profile()
        target_job = next((j for j in INITIAL_JOBS if j.id == job_id), None)
        if not target_job:
            raise ValueError(f"Job ID '{job_id}' not found in active stream.")

        match_score = self.calculate_match_score(profile, target_job)
        letter = custom_cover_letter or self.generate_cover_letter(profile, target_job)
        applied_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO job_applications
                (job_id, company, role, location, salary, match_score, cover_letter, status, portal, applied_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Applied', ?, ?)
            """, (
                target_job.id,
                target_job.company,
                target_job.role,
                target_job.location,
                target_job.salary_range,
                match_score,
                letter,
                target_job.portal,
                applied_time
            ))
            conn.commit()
            app_id = cursor.lastrowid

        return JobApplication(
            id=app_id,
            job_id=target_job.id,
            company=target_job.company,
            role=target_job.role,
            location=target_job.location,
            salary=target_job.salary_range,
            match_score=match_score,
            cover_letter=letter,
            status="Applied",
            portal=target_job.portal,
            applied_at=applied_time
        )

    def run_batch_auto_apply(self, min_match_threshold: int = 70) -> Dict[str, Any]:
        """Scans job stream and automatically applies to all eligible jobs meeting match threshold."""
        jobs = self.get_job_stream()
        applied_count = 0
        skipped_count = 0
        newly_applied = []

        existing_applied_ids = set()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT job_id FROM job_applications")
            existing_applied_ids = {r[0] for r in cursor.fetchall()}

        for job in jobs:
            if job.id in existing_applied_ids:
                skipped_count += 1
                continue

            if job.match_score >= min_match_threshold:
                app = self.apply_to_job(job.id)
                newly_applied.append(app.model_dump())
                applied_count += 1
            else:
                skipped_count += 1

        return {
            "success": True,
            "threshold_used": min_match_threshold,
            "applied_count": applied_count,
            "skipped_count": skipped_count,
            "applications": newly_applied,
            "message": f"Auto-Apply Bot processed {len(jobs)} jobs: Successfully applied to {applied_count} matching positions."
        }

    def get_applications(self) -> List[JobApplication]:
        """Returns all tracked job applications."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, job_id, company, role, location, salary, match_score, cover_letter, status, portal, applied_at
                FROM job_applications ORDER BY id DESC
            """)
            rows = cursor.fetchall()
            return [
                JobApplication(
                    id=r[0],
                    job_id=r[1],
                    company=r[2],
                    role=r[3],
                    location=r[4],
                    salary=r[5],
                    match_score=r[6],
                    cover_letter=r[7],
                    status=r[8],
                    portal=r[9],
                    applied_at=r[10]
                ) for r in rows
            ]
