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
