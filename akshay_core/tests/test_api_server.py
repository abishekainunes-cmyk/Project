"""Integration test for the Akshay native API server endpoints.
"""

from decimal import Decimal
import json
import pytest

from akshay_core.finos.ledger import FinOSLedger
from akshay_core.finos.models import TransactionCreate, AccountType


def test_ledger_api_integration(tmp_path):
    """Verifies that the ledger backend records transactions and returns summaries as consumed by the API."""
    db_file = tmp_path / "test_api.db"
    ledger = FinOSLedger(db_path=db_file)

    # 1. Record deposit
    tx = TransactionCreate(
        description="Salary deposit",
        debit_account="Assets:Bank:HDFC",
        credit_account="Revenue:Salary",
        amount=Decimal("50000.00"),
    )
    tx_id = ledger.record_transaction(tx)
    assert tx_id > 0

    # 2. Record expense
    tx_exp = TransactionCreate(
        description="Coffee at Blue Tokai",
        debit_account="Expenses:Dining",
        credit_account="Assets:Bank:HDFC",
        amount=Decimal("250.00"),
        category="Dining",
    )
    exp_id = ledger.record_transaction(tx_exp)
    assert exp_id > 0

    # 3. Check summary calculations
    net_worth = ledger.get_net_worth()
    assert net_worth == Decimal("49750.00")

    categories = ledger.get_spending_by_category()
    assert len(categories) == 1
    assert categories[0].category == "Dining"
    assert categories[0].total_spent == Decimal("250.00")


def test_investment_portfolio_api_integration(tmp_path):
    """Verifies that the Investment Manager backend generates portfolio, suggestions, and RFC 5545 ICS alerts."""
    from akshay_core.finos.investment_manager import InvestmentPortfolioManager
    mgr = InvestmentPortfolioManager(db_path=tmp_path / "test_invest_api.db")

    summary = mgr.get_portfolio_summary()
    assert summary.total_invested > 0
    assert summary.stocks_value > 0
    assert summary.mutual_funds_value > 0
    assert summary.assets_value > 0

    # Scan & Suggest
    suggestion = mgr.scan_and_suggest_investment(savings_amount=81750.0, monthly_income=25000.0)
    assert len(suggestion["tiers"]) == 4
    assert suggestion["scanned_savings_pool"] == 81750.0
    assert suggestion["recommended_monthly_sip"] == 6250.0  # 25% of 25,000

    # Reminders & ICS
    rem = mgr.create_reminder(
        title="Monthly Nifty 50 SIP",
        amount=5000.0,
        frequency="Monthly",
        target_asset="UTI Nifty 50 Index Fund"
    )
    assert rem.id is not None
    ics = mgr.generate_reminders_ics()
    assert "BEGIN:VALARM" in ics
    assert "TRIGGER:-PT15M" in ics
    assert "UTI Nifty 50 Index Fund" in ics


def test_rag_assistant_chat_api_integration():
    """Verifies RAG Assistant chat returns human-like response with groundings and confidence."""
    from akshay_core.workflows.rag_assistant import get_rag_assistant
    rag = get_rag_assistant()
    msg = rag.generate_human_response("Who am I and what did I do at Nunes Instrumentation?")
    assert msg.role == "assistant"
    assert "Abishek" in msg.text
    assert "Nunes" in msg.text
    assert "IGNIS" in msg.text
    assert len(msg.rag_sources) >= 1
    assert msg.confidence >= 0.70


def test_job_bot_continuous_batch_api_integration(tmp_path):
    """Verifies continuous 20-30 role batch auto apply and next-batch discovery."""
    from akshay_core.workflows.job_bot import JobBotManager
    mgr = JobBotManager(db_path=tmp_path / "test_continuous_batch.db")
    res = mgr.run_batch_auto_apply(min_match_threshold=70, batch_limit=25, auto_search_next_batch=True)
    assert res["success"] is True
    assert res["batch_limit"] == 25
    assert res["applied_count"] >= 20
    assert res["auto_search_next_batch"] is True
    assert res["next_batch_count"] == 25
    assert "Auto-Search Pipeline engaged" in res["message"]

def test_portals_status_and_sync_api_integration(tmp_path):
    """Verifies that 5 portal gateways and sync endpoints function properly."""
    from akshay_core.workflows.job_bot import JobBotManager
    mgr = JobBotManager(db_path=tmp_path / "test_portals_api.db")
    accounts = mgr.get_portal_accounts()
    assert len(accounts) == 5
    emails = {a.email for a in accounts}
    assert emails == {"abishekpranav403@gmail.com"}
    
    sync_res = mgr.sync_portal_account("naukri")
    assert sync_res["success"] is True
    assert sync_res["candidate_email"] == "abishekpranav403@gmail.com"
