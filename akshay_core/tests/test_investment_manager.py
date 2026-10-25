"""Unit tests for FinOS Investment Portfolio & Calendar Alert Engine."""

import pytest
from pathlib import Path
from akshay_core.finos.investment_manager import (
    InvestmentPortfolioManager,
    InvestmentHolding,
    InvestmentReminder
)


@pytest.fixture
def temp_manager(tmp_path: Path) -> InvestmentPortfolioManager:
    test_db = tmp_path / "test_investments.db"
    return InvestmentPortfolioManager(db_path=test_db)


def test_initial_holdings_seeded(temp_manager: InvestmentPortfolioManager):
    summary = temp_manager.get_portfolio_summary()
    assert summary.total_invested > 0
    assert summary.total_current_value > summary.total_invested
    assert summary.stocks_value > 0
    assert summary.mutual_funds_value > 0
    assert summary.assets_value > 0
    assert len(summary.holdings) >= 6

    # Verify category distribution
    cats = {h.category for h in summary.holdings}
    assert "STOCK" in cats
    assert "MUTUAL_FUND" in cats
    assert "ASSET" in cats


def test_add_and_delete_holding(temp_manager: InvestmentPortfolioManager):
    new_stock = temp_manager.add_holding(
        category="STOCK",
        symbol="RELIANCE",
        name="Reliance Industries Ltd",
        units=5.0,
        buy_price=2800.0,
        current_price=2950.0,
        notes="Energy and retail conglomerate"
    )
    assert new_stock.id is not None
    assert new_stock.invested_amount == 14000.0
    assert new_stock.current_value == 14750.0
    assert new_stock.pnl_amount == 750.0

    # Delete holding
    deleted = temp_manager.delete_holding(new_stock.id)
    assert deleted is True


def test_scan_and_suggest_investment_tiers(temp_manager: InvestmentPortfolioManager):
    res = temp_manager.scan_and_suggest_investment(savings_amount=100000.0, monthly_income=30000.0)
    assert res["scanned_savings_pool"] == 100000.0
    assert res["recommended_monthly_sip"] > 0
    assert len(res["tiers"]) == 4

    # Verify 4-tier allocation sums to 100%
    total_pct = sum(t["target_pct"] for t in res["tiers"])
    assert total_pct == 100.0
    total_amt = sum(t["recommended_amount"] for t in res["tiers"])
    assert total_amt == 100000.0

    # Check Tier 1 (Emergency/Assets)
    assert res["tiers"][0]["target_pct"] == 20.0
    assert res["tiers"][0]["category"] == "ASSET"

    # Check Tier 2 (Core Index)
    assert res["tiers"][1]["target_pct"] == 40.0
    assert res["tiers"][1]["category"] == "MUTUAL_FUND"


def test_create_reminder_and_ics_valarm_generation(temp_manager: InvestmentPortfolioManager):
    reminder = temp_manager.create_reminder(
        title="Monthly SIP - Nifty 50 Index Fund",
        amount=5000.0,
        frequency="Monthly",
        target_date="2026-11-01",
        target_asset="UTI Nifty 50 Index Fund",
        alert_time="09:00 AM"
    )
    assert reminder.id is not None
    assert reminder.amount == 5000.0
    assert reminder.status == "ACTIVE"

    # Generate RFC 5545 string
    ics_str = temp_manager.generate_reminders_ics()
    assert "BEGIN:VCALENDAR" in ics_str
    assert "BEGIN:VEVENT" in ics_str
    assert "BEGIN:VALARM" in ics_str
    assert "TRIGGER:-PT15M" in ics_str
    assert "ACTION:DISPLAY" in ics_str
    assert "5,000.00" in ics_str
    assert "END:VALARM" in ics_str
    assert "END:VCALENDAR" in ics_str


def test_refresh_live_prices_and_day_pnl(temp_manager: InvestmentPortfolioManager):
    summary_before = temp_manager.get_portfolio_summary()
    assert summary_before.total_current_value > 0

    # Refresh prices
    updated_summary = temp_manager.refresh_live_prices()
    assert updated_summary.total_current_value > 0
    # Day P&L must be present
    assert hasattr(updated_summary, "total_day_pnl")

    # Every holding should now have app_name and how_to_invest
    for h in updated_summary.holdings:
        assert h.app_name is not None and len(h.app_name) > 0
        assert h.how_to_invest is not None and len(h.how_to_invest) > 0
        assert h.investment_type is not None


def test_get_app_execution_guides(temp_manager: InvestmentPortfolioManager):
    guides = temp_manager.get_app_execution_guides()
    assert isinstance(guides, list)
    assert len(guides) >= 3

    app_names = [g["app_name"] for g in guides]
    assert any("Zerodha" in name for name in app_names)
    assert any("Groww" in name or "Coin" in name for name in app_names)
    assert any("RBI" in name for name in app_names)

    kite_guide = next(g for g in guides if "Zerodha Kite" in g["app_name"])
    assert len(kite_guide["steps"]) >= 4
    assert "charges" in kite_guide


