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


def test_form_filler_audit_and_receipt():
    from akshay_core.workflows.job_application_mailer import get_application_mailer
    mailer = get_application_mailer()
    audit = mailer.generate_form_filler_audit('JOB-AI-01')
    assert audit['success'] is True
    assert len(audit['form_steps']) == 5
    assert audit['last_page_receipt']['ats_score'] == 100
    assert 'Abishek Pranav' in audit['last_page_receipt']['candidate_name']
    assert 'abishekpranav403@gmail.com' in audit['last_page_receipt']['candidate_email'].lower()


def test_application_email_dispatch():
    from akshay_core.workflows.job_application_mailer import get_application_mailer
    mailer = get_application_mailer()
    res = mailer.dispatch_application_email('JOB-AI-01', 'abishekpranav403@gmail.com')
    assert res['success'] is True
    assert res['recipient'] == 'abishekpranav403@gmail.com'
    assert 'JOB APPLICATION CONFIRMED' in res['subject']
    assert Path(res['html_receipt_path']).exists()


def test_openai_clip_engine_local_inference():
    from akshay_core.vision.clip_engine import get_clip_engine
    from PIL import Image

    clip_engine = get_clip_engine()
    info = clip_engine.get_info()
    assert info['api_key_required'] is False
    assert 'OpenAI CLIP' in info['engine']
    assert len(info['available_models']) >= 5

    # Test local text prediction
    test_img = Image.new('RGB', (100, 100), color=(25, 40, 80))
    candidates = ['software engineer resume', 'doctor prescription', 'bank statement']
    pred = clip_engine.predict_most_relevant_text(test_img, candidates)
    assert pred['success'] is True
    assert pred['api_key_required'] is False
    assert len(pred['rankings']) == 3
