"""Unit and integration tests for Autonomous Job Application Bot."""

import pytest
import sqlite3
from pathlib import Path
from akshay_core.workflows.job_bot import JobBotManager, CandidateProfile, JobPosting


@pytest.fixture
def temp_job_bot(tmp_path: Path) -> JobBotManager:
    test_db = tmp_path / "test_jobs.db"
    return JobBotManager(db_path=test_db)


def test_job_bot_initial_profile_and_stream(temp_job_bot: JobBotManager):
    profile = temp_job_bot.get_profile()
    assert "Abishek Pranav" in profile.name
    assert "Python" in profile.skills

    jobs = temp_job_bot.get_job_stream()
    assert len(jobs) >= 5
    # Should be sorted descending by match score
    for i in range(len(jobs) - 1):
        assert jobs[i].match_score >= jobs[i+1].match_score


def test_match_score_calculation(temp_job_bot: JobBotManager):
    profile = CandidateProfile(
        name="Tester",
        title="Python Dev",
        skills=["Python", "FastAPI", "Docker"],
        experience_years=3
    )
    job = JobPosting(
        id="JOB-TEST-1",
        company="TestCorp",
        role="Python Backend",
        location="Remote",
        work_type="Remote",
        salary_range="₹20L",
        required_skills=["Python", "FastAPI"],
        description="Test desc"
    )
    score = temp_job_bot.calculate_match_score(profile, job)
    assert score >= 85


def test_tailored_cover_letter_generation(temp_job_bot: JobBotManager):
    profile = temp_job_bot.get_profile()
    jobs = temp_job_bot.get_job_stream()
    first_job = jobs[0]

    letter = temp_job_bot.generate_cover_letter(profile, first_job)
    assert first_job.company in letter
    assert first_job.role in letter
    assert profile.name in letter
    assert profile.portfolio_url in letter


def test_single_job_apply(temp_job_bot: JobBotManager):
    jobs = temp_job_bot.get_job_stream()
    target_job = jobs[0]

    application = temp_job_bot.apply_to_job(target_job.id)
    assert application.job_id == target_job.id
    assert application.company == target_job.company
    assert application.status == "Applied"

    history = temp_job_bot.get_applications()
    assert len(history) == 1
    assert history[0].job_id == target_job.id


def test_batch_auto_apply_with_threshold(temp_job_bot: JobBotManager):
    result = temp_job_bot.run_batch_auto_apply(min_match_threshold=70)
    assert result["success"] is True
    assert result["applied_count"] > 0

    # Running batch auto-apply again should skip already applied jobs
    result_second = temp_job_bot.run_batch_auto_apply(min_match_threshold=70)
    assert result_second["applied_count"] == 0
    assert result_second["skipped_count"] >= result["applied_count"]


def test_sql_injection_defense_in_job_profile(temp_job_bot: JobBotManager):
    malicious_profile = CandidateProfile(
        name="Hacker'; DROP TABLE job_applications; --",
        title="Admin' OR '1'='1",
        skills=["Python", "SQL'; --"],
        experience_years=5
    )
    temp_job_bot.save_profile(malicious_profile)

    # Table should still exist intact
    with sqlite3.connect(temp_job_bot.db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='job_applications'")
        assert cursor.fetchone()[0] == 1
