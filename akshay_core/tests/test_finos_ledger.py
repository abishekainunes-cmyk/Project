"""Comprehensive unit and integrity tests for FinOS deterministic double-entry accounting engine.
"""

from decimal import Decimal
import pytest
from pydantic import ValidationError

from akshay_core.finos.ledger import FinOSLedger, LedgerIntegrityError
from akshay_core.finos.models import (
    AccountType,
    TransactionCreate,
    MultiSplitTransactionCreate,
    SplitCreate,
)


@pytest.fixture
def ledger():
    """Provides an isolated, in-memory ledger instance for testing."""
    return FinOSLedger(db_path=":memory:")


def test_standard_transaction_and_balances(ledger):
    """Verifies that recording a standard transaction updates asset and expense balances correctly."""
    tx = TransactionCreate(
        description="Grocery shopping",
        debit_account="Expenses:Food:Groceries",
        credit_account="Assets:Bank:HDFC",
        amount=Decimal("1250.50"),
        currency="INR",
        category="Groceries",
        source="manual",
    )
    tx_id = ledger.record_transaction(tx)
    assert tx_id > 0

    # Normal balance of Expense is Debits - Credits
    assert ledger.get_account_balance("Expenses:Food:Groceries") == Decimal("1250.50")
    # Normal balance of Asset is Debits - Credits (Asset was credited, so balance is -1250.50)
    assert ledger.get_account_balance("Assets:Bank:HDFC") == Decimal("-1250.50")

    # Invariants must hold
    assert ledger.verify_global_invariants() is True


def test_salary_deposit_and_net_worth(ledger):
    """Verifies income crediting and net worth calculation."""
    # 1. Receive Salary: Debit Asset, Credit Revenue
    salary_tx = TransactionCreate(
        description="Monthly Salary",
        debit_account="Assets:Bank:HDFC",
        credit_account="Revenue:Salary",
        amount=Decimal("80000.00"),
        currency="INR",
    )
    ledger.record_transaction(salary_tx)

    # 2. Spend on Utilities: Debit Expense, Credit Asset
    bill_tx = TransactionCreate(
        description="Electricity Bill",
        debit_account="Expenses:Utilities",
        credit_account="Assets:Bank:HDFC",
        amount=Decimal("3500.00"),
        currency="INR",
        category="Utilities",
    )
    ledger.record_transaction(bill_tx)

    # Net bank balance should be 80000 - 3500 = 76500
    assert ledger.get_account_balance("Assets:Bank:HDFC") == Decimal("76500.00")
    assert ledger.get_net_worth() == Decimal("76500.00")
    assert ledger.verify_global_invariants() is True


def test_multi_split_transaction(ledger):
    """Tests multi-leg balanced transactions (e.g. restaurant bill + GST)."""
    tx = MultiSplitTransactionCreate(
        description="Dinner with Friends",
        splits=[
            SplitCreate(account_name="Expenses:Food:Dining", amount=Decimal("1000.00"), is_debit=True),
            SplitCreate(account_name="Expenses:Tax:GST", amount=Decimal("180.00"), is_debit=True),
            SplitCreate(account_name="Assets:Bank:HDFC", amount=Decimal("1180.00"), is_debit=False),
        ],
        currency="INR",
    )
    tx_id = ledger.record_multi_split_transaction(tx)
    assert tx_id > 0

    assert ledger.get_account_balance("Expenses:Food:Dining") == Decimal("1000.00")
    assert ledger.get_account_balance("Expenses:Tax:GST") == Decimal("180.00")
    assert ledger.get_account_balance("Assets:Bank:HDFC") == Decimal("-1180.00")
    assert ledger.verify_global_invariants() is True


def test_unbalanced_multi_split_rejected(ledger):
    """Verifies that an unbalanced multi-split transaction is rejected at model validation."""
    with pytest.raises(ValidationError, match="Unbalanced transaction"):
        MultiSplitTransactionCreate(
            description="Fraudulent Unbalanced Entry",
            splits=[
                SplitCreate(account_name="Expenses:Food", amount=Decimal("500.00"), is_debit=True),
                SplitCreate(account_name="Assets:Cash", amount=Decimal("400.00"), is_debit=False),
            ],
            currency="INR",
        )


def test_same_account_transaction_rejected():
    """Verifies that debiting and crediting the same account is rejected to prevent circular wash entries."""
    with pytest.raises(ValidationError, match="must be distinct"):
        TransactionCreate(
            description="Circular transfer",
            debit_account="Assets:Cash",
            credit_account="Assets:Cash",
            amount=Decimal("100.00"),
        )


def test_negative_or_zero_amounts_rejected():
    """Ensures amounts less than or equal to 0 are rejected by strict validation."""
    with pytest.raises(ValidationError):
        TransactionCreate(
            description="Negative amount attack",
            debit_account="Expenses:Food",
            credit_account="Assets:Cash",
            amount=Decimal("-50.00"),
        )

    with pytest.raises(ValidationError):
        TransactionCreate(
            description="Zero amount entry",
            debit_account="Expenses:Food",
            credit_account="Assets:Cash",
            amount=Decimal("0.00"),
        )


def test_category_spending_breakdown(ledger):
    """Verifies deterministic category aggregation."""
    ledger.record_transaction(
        TransactionCreate(
            description="Lunch",
            debit_account="Expenses:Food",
            credit_account="Assets:Cash",
            amount=Decimal("300.00"),
            category="Dining",
        )
    )
    ledger.record_transaction(
        TransactionCreate(
            description="Dinner",
            debit_account="Expenses:Food",
            credit_account="Assets:Cash",
            amount=Decimal("700.00"),
            category="Dining",
        )
    )
    ledger.record_transaction(
        TransactionCreate(
            description="Bus ticket",
            debit_account="Expenses:Travel",
            credit_account="Assets:Cash",
            amount=Decimal("50.00"),
            category="Transit",
        )
    )

    summary = ledger.get_spending_by_category()
    cat_map = {item.category: item.total_spent for item in summary}
    assert cat_map["Dining"] == Decimal("1000.00")
    assert cat_map["Transit"] == Decimal("50.00")
