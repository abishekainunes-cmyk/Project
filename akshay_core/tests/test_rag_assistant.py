"""Unit and integration tests for Akshay RAG Executive Assistant & Continuous 20-30 Role Job Pipeline."""

import pytest
from pathlib import Path
from akshay_core.workflows.rag_assistant import get_rag_assistant, RAGAssistantEngine
from akshay_core.workflows.job_bot import JobBotManager


def test_rag_retrieval_and_sources():
    rag = get_rag_assistant()
    
    # 1. Medical Query
    res_med = rag.retrieve("What is Dad's daily Riverflow dose and which doctor prescribed it?")
    assert len(res_med.top_chunks) >= 1
    assert any("Riverflow" in c.content for c in res_med.top_chunks)
    assert any("Suresh" in c.content for c in res_med.top_chunks)
    assert res_med.intent_category == "medical"
    assert res_med.confidence_score >= 0.70

    # 2. Wealth / Runway Query
    res_wealth = rag.retrieve("How long can I survive with 81750 liquid cash?")
    assert len(res_wealth.top_chunks) >= 1
    assert any("81,750" in c.content or "Runway" in c.content for c in res_wealth.top_chunks)
    assert res_wealth.intent_category == "wealth"

    # 3. Job Search Query
    res_jobs = rag.retrieve("How many roles are in our continuous auto apply batch?")
    assert len(res_jobs.top_chunks) >= 1
    assert any("Batch" in c.content or "20 to 30" in c.content for c in res_jobs.top_chunks)
    assert res_jobs.intent_category == "jobs"


def test_rag_human_like_response():
    rag = get_rag_assistant()
    
    # Check conversational human persona
    reply = rag.generate_human_response("Can you give me an update on Dad's medicines and doctor visits?")
    assert reply.role == "assistant"
    assert "Abishek" in reply.text
    # Should speak naturally about Dad's medicines and doctors
    assert "Riverflow" in reply.text or "Dr. Suresh" in reply.text or "Dr. Baskar" in reply.text
    assert len(reply.rag_sources) >= 1
    assert reply.confidence >= 0.70


def test_continuous_batch_auto_apply_25_roles(tmp_path: Path):
    test_db = tmp_path / "test_jobs_rag.db"
    manager = JobBotManager(db_path=test_db)
    
    # 1. Run batch auto apply with limit 25 roles and auto_search_next_batch=True
    batch_res = manager.run_batch_auto_apply(min_match_threshold=70, style="balanced", batch_limit=25, auto_search_next_batch=True)
    assert batch_res["success"] is True
    assert batch_res["batch_limit"] == 25
    assert batch_res["applied_count"] >= 20  # Applied to 20-25 roles
    assert batch_res["auto_search_next_batch"] is True
    assert batch_res["next_batch_count"] == 25
    assert batch_res["next_batch_number"] >= 2
    assert "Auto-Search Pipeline engaged" in batch_res["message"]

    # 2. Verify all applications recorded in database
    apps = manager.get_applications()
    assert len(apps) == batch_res["applied_count"]
    for a in apps:
        assert a.user_approved is True
        assert a.status == "Approved & Submitted"
        assert a.ats_score >= 70


def test_search_next_batch_discovery(tmp_path: Path):
    test_db = tmp_path / "test_jobs_next_batch.db"
    manager = JobBotManager(db_path=test_db)
    
    initial_count = len(manager.get_job_stream())
    assert initial_count >= 30  # Peak catalog has 35+ roles
    
    # Trigger search for next batch
    next_batch = manager.search_next_batch(count=25)
    assert next_batch["success"] is True
    assert next_batch["discovered_count"] == 25
    assert len(next_batch["jobs"]) == 25
    
    # Job stream now has initial + discovered roles
    new_stream = manager.get_job_stream()
    assert len(new_stream) == initial_count + 25
