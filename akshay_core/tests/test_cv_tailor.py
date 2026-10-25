"""Unit tests for Evidence-Based CV Tailor & ATS Optimization Engine."""

import pytest
from pathlib import Path
from akshay_core.workflows.cv_tailor import CVTailorEngine, MASTER_CV
from akshay_core.workflows.experience_audit import ExperienceAuditEngine
from akshay_core.workflows.job_bot import JobPosting, JobBotManager


def test_master_cv_integrity():
    assert MASTER_CV["name"] == "ABISHEK PRANAV G V"
    assert "Coimbatore" in MASTER_CV["location"]
    assert "63835 00484" in MASTER_CV["phone"]
    assert "Abishekpranav403@gmail.com" in MASTER_CV["email"]
    assert len(MASTER_CV["experience"]) >= 6
    assert len(MASTER_CV["skills"]["programming_and_automation"]) >= 7

    # Check authentic headline and educational status
    assert "Generative AI & Automation | Python | Business Analysis & Data Analytics" in MASTER_CV["headline"]
    edu_degrees = {e["degree"]: e["status"] for e in MASTER_CV["education"]}
    assert any("BBA" in d and "Completed" in s for d, s in edu_degrees.items())
    assert any("MBA" in d and "In progress" in s for d, s in edu_degrees.items())


def test_experience_audit_overlap_prevention():
    audit = ExperienceAuditEngine.calculate_audit()
    assert audit["success"] is True
    assert audit["candidate"] == "Abishek Pranav G V"

    timeline = audit["timeline_audit"]
    # Total elapsed months should be ~43 distinct months (no double-counting of overlapping Woxsen + internships)
    assert timeline["total_elapsed_employment_months"] >= 36
    # Relevant automation should be ~10 distinct months (Nunes + RXG automation)
    assert timeline["relevant_automation_months"] == 10
    assert "10 distinct months" in timeline["relevant_automation_display"]
    assert timeline["overlap_prevention_applied"] is True

    # Check personal projects are not counted in employment records
    assert len(audit["projects"]) >= 3
    assert all("Project" in p["type"] for p in audit["projects"])


def test_career_recommendations_evidence_grounded():
    recs = CVTailorEngine.get_career_recommendations()
    assert recs["candidate"] == "ABISHEK PRANAV G V"
    assert len(recs["target_role_clusters"]) >= 5
    first_cluster = recs["target_role_clusters"][0]
    assert "Generative AI" in first_cluster["title"]
    assert "30,000" in first_cluster["salary_range"]
    assert "mo" in first_cluster["salary_range"]
    assert "yr" in first_cluster["salary_range"]


def test_tailor_cv_evidence_based_diagnostic():
    job = JobPosting(
        id="TEST-GENAI",
        company="Cognitive Dynamics",
        role="Generative AI & Automation Engineer",
        location="Bengaluru (Remote)",
        work_type="Remote",
        salary_range="₹30,000 - ₹45,000/mo (₹3.6L - ₹5.4L/yr)",
        required_skills=["Generative AI", "Python", "REST APIs", "Google Apps Script", "Workflow Automation"],
        description="Deploy generative AI pipelines and automated enterprise document workflows."
    )
    result = CVTailorEngine.tailor_cv_for_job(job)
    assert result["success"] is True
    # ATS diagnostic score is honest and evidence-weighted (between 75 and 95, not fake 100)
    assert 75 <= result["ats_diagnostic_score"] <= 95
    assert "ABISHEK PRANAV G V" in result["cv_plaintext"]
    assert "Cognitive Dynamics" in result["summary"]
    assert "Generative AI" in result["cv_plaintext"]

    # Matrix checks
    matrix = result["ats_matrix"]
    assert matrix["mandatory_qualifications_met"] is True
    assert len(matrix["matched_keywords"]) >= 3
    assert result["suitability_verdict"] in ["Apply", "Apply after CV changes"]

    # Interview prep check
    prep = result["interview_prep"]
    assert len(prep["recruiter_questions"]) == 5
    assert len(prep["technical_questions"]) == 5
    assert len(prep["achievement_questions"]) == 3
    assert len(prep["practical_demo_checklist"]) >= 4


def test_job_bot_apply_saves_tailored_cv(tmp_path):
    bot = JobBotManager(db_path=tmp_path / "bot_test_ats.db")
    jobs = bot.get_job_stream()
    first_job = jobs[0]

    # Prepares review gate
    review = bot.prepare_application_review(first_job.id, style="balanced")
    assert review["success"] is True
    assert review["user_approval_required"] is True

    # User approves and submits
    app = bot.approve_and_submit_application(first_job.id, style="balanced")
    assert app.user_approved is True
    assert app.status == "Approved & Submitted"
    assert app.tailored_cv != ""
    assert "ABISHEK PRANAV G V" in app.tailored_cv

    # Verify retrieval from database
    history = bot.get_applications()
    assert len(history) == 1
    assert history[0].user_approved is True
    assert history[0].status == "Approved & Submitted"
    assert history[0].tailored_cv == app.tailored_cv
