"""Unit tests for multi-portal candidate gateways (LinkedIn, Indeed, Foundit, Shine, Naukri)
and applications dispatched from abishekpranav403@gmail.com.
"""

import pytest
from pathlib import Path
from akshay_core.workflows.job_bot import JobBotManager, PEAK_JOB_CATALOG, PortalAccount


@pytest.fixture
def temp_job_bot(tmp_path: Path):
    db_file = tmp_path / "test_portals_jobs.db"
    return JobBotManager(db_path=db_file)


def test_five_authenticated_portals_registered(temp_job_bot: JobBotManager):
    """Verifies that all 5 user-requested portals are registered and active under abishekpranav403@gmail.com."""
    accounts = temp_job_bot.get_portal_accounts()
    assert len(accounts) == 5
    
    expected_portals = {
        "linkedin": "LinkedIn",
        "indeed": "Indeed",
        "foundit": "Foundit",
        "shine": "Shine",
        "naukri": "Naukri"
    }
    
    portal_map = {a.id: a for a in accounts}
    for p_id, p_name in expected_portals.items():
        assert p_id in portal_map, f"Portal {p_id} missing"
        account = portal_map[p_id]
        assert account.name == p_name
        assert account.email == "abishekpranav403@gmail.com"
        assert account.connected is True
        assert account.sync_percentage == 100
        assert account.auth_status == "Authenticated & Active"


def test_base_catalog_balanced_across_five_portals():
    """Verifies that the 35 peak base vacancies are evenly distributed across the 5 target portals."""
    from collections import Counter
    counts = Counter(j.portal for j in PEAK_JOB_CATALOG)
    assert len(PEAK_JOB_CATALOG) == 35
    for portal in ["LinkedIn", "Indeed", "Foundit", "Shine", "Naukri"]:
        assert counts[portal] >= 6, f"Portal {portal} has fewer than 6 roles in base catalog"


def test_application_stamped_with_candidate_email_and_submission_id(temp_job_bot: JobBotManager):
    """Verifies that every submitted application is stamped with abishekpranav403@gmail.com and a portal submission ID."""
    job = PEAK_JOB_CATALOG[0]
    app = temp_job_bot.approve_and_submit_application(job.id)
    
    assert app.applicant_email == "abishekpranav403@gmail.com"
    assert app.submission_id != ""
    assert app.status == "Approved & Submitted"
    assert app.portal == job.portal

    # Verify persistence in SQLite
    apps = temp_job_bot.get_applications()
    persisted = next(a for a in apps if a.job_id == job.id)
    assert persisted.applicant_email == "abishekpranav403@gmail.com"
    assert persisted.submission_id == app.submission_id


def test_portal_sync_token_verification(temp_job_bot: JobBotManager):
    """Verifies that portal synchronization re-verifies session tokens for abishekpranav403@gmail.com."""
    for p_id in ["linkedin", "indeed", "foundit", "shine", "naukri"]:
        res = temp_job_bot.sync_portal_account(p_id)
        assert res["success"] is True
        assert res["candidate_email"] == "abishekpranav403@gmail.com"
        assert res["portal_id"] == p_id
        assert "Verified & Active" in res["sync_status"]


def test_batch_auto_apply_with_portal_filter(temp_job_bot: JobBotManager):
    """Verifies that batch auto-apply can be filtered to a specific portal (e.g. Foundit or Naukri)."""
    res_foundit = temp_job_bot.run_batch_auto_apply(min_match_threshold=50, batch_limit=5, portal_filter="foundit", auto_search_next_batch=False)
    assert res_foundit["success"] is True
    for app in res_foundit["applications"]:
        assert app["portal"] == "Foundit"
        assert app["applicant_email"] == "abishekpranav403@gmail.com"
        assert app["submission_id"].startswith("FND-")

    # Check that portal accounts correctly count the submitted applications
    accounts = temp_job_bot.get_portal_accounts()
    foundit_acc = next(a for a in accounts if a.id == "foundit")
    assert foundit_acc.total_applied == res_foundit["applied_count"]
