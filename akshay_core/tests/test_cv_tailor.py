"""Unit tests for CV Tailor & 100% ATS Optimization Engine."""

import pytest
from akshay_core.workflows.cv_tailor import CVTailorEngine, MASTER_CV
from akshay_core.workflows.job_bot import JobPosting, JobBotManager


def test_master_cv_integrity():
    assert MASTER_CV["name"] == "ABISHEK PRANAV G V"
    assert "Coimbatore" in MASTER_CV["location"]
    assert "63835 00484" in MASTER_CV["phone"]
    assert "Abishekpranav403@gmail.com" in MASTER_CV["email"]
    assert len(MASTER_CV["experience"]) >= 6
    assert len(MASTER_CV["skills"]["programming_and_automation"]) >= 7


def test_career_recommendations():
    recs = CVTailorEngine.get_career_recommendations()
    assert recs["candidate"] == "ABISHEK PRANAV G V"
    assert len(recs["target_role_clusters"]) >= 4
    first_cluster = recs["target_role_clusters"][0]
    assert "Generative AI" in first_cluster["title"]
    assert "30,000" in first_cluster["salary_range"]
    assert "mo" in first_cluster["salary_range"]
    assert "yr" in first_cluster["salary_range"]


def test_tailor_cv_100_ats_score():
    job = JobPosting(
        id="TEST-GENAI",
        company="Cognitive Dynamics",
        role="Generative AI & Automation Engineer",
        location="Bengaluru (Remote)",
        work_type="Remote",
        salary_range="₹24L - ₹30L",
        required_skills=["Generative AI", "Python", "REST APIs", "Workflow Automation"],
        description="Deploy generative AI pipelines and automated enterprise document workflows."
    )
    result = CVTailorEngine.tailor_cv_for_job(job)
    assert result["success"] is True
    assert result["ats_score"] == 100
    assert "ABISHEK PRANAV G V" in result["cv_plaintext"]
    assert "Cognitive Dynamics" in result["summary"]
    assert "Generative AI" in result["cv_plaintext"]
    assert result["scorecard"]["overall_score"] == 100
    assert result["scorecard"]["keyword_match_pct"] == 100


def test_job_bot_apply_saves_tailored_cv(tmp_path):
    bot = JobBotManager(db_path=tmp_path / "bot_test_ats.db")
    jobs = bot.get_job_stream()
    first_job = jobs[0]

    app = bot.apply_to_job(first_job.id, style="balanced")
    assert app.ats_score == 100
    assert app.tailored_cv != ""
    assert "ABISHEK PRANAV G V" in app.tailored_cv

    # Verify retrieval from database
    history = bot.get_applications()
    assert len(history) == 1
    assert history[0].ats_score == 100
    assert history[0].tailored_cv == app.tailored_cv
