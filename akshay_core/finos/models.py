"""Strict Pydantic schemas for the FinOS deterministic double-entry accounting engine.
"""

from __future__ import annotations
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class AccountType(str, Enum):
    """Standard accounting equation types."""
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"


class SplitCreate(BaseModel):
    """A single leg of a double-entry transaction."""
    account_name: str = Field(..., min_length=2, max_length=64, description="Full hierarchical account name")
    amount: Decimal = Field(..., gt=Decimal("0.00"), lt=Decimal("100000000.00"), description="Positive split amount")
    is_debit: bool = Field(..., description="True if debit, False if credit")

    @field_validator("amount")
    @classmethod
    def round_two_decimals(cls, v: Decimal) -> Decimal:
        return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class TransactionCreate(BaseModel):
    """Payload to record a standard balanced transaction."""
    description: str = Field(..., min_length=1, max_length=255)
    debit_account: str = Field(..., min_length=2, max_length=64)
    credit_account: str = Field(..., min_length=2, max_length=64)
    amount: Decimal = Field(..., gt=Decimal("0.00"), lt=Decimal("100000000.00"))
    currency: str = Field(default="INR", min_length=3, max_length=3)
    category: Optional[str] = Field(default=None, max_length=64)
    note: Optional[str] = Field(default=None, max_length=500)
    source: str = Field(default="manual", max_length=32, description="'sms', 'receipt_ocr', 'voice', or 'manual'")

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("amount")
    @classmethod
    def round_amount(cls, v: Decimal) -> Decimal:
        return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @model_validator(mode="after")
    def validate_different_accounts(self) -> TransactionCreate:
        if self.debit_account.strip().lower() == self.credit_account.strip().lower():
            raise ValueError("Debit and credit accounts must be distinct to preserve double-entry balance")
        return self


class MultiSplitTransactionCreate(BaseModel):
    """Payload for multi-leg split transactions (e.g. itemized receipts with tax)."""
    description: str = Field(..., min_length=1, max_length=255)
    splits: List[SplitCreate] = Field(..., min_length=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    note: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_balanced_splits(self) -> MultiSplitTransactionCreate:
        total_debits = sum(s.amount for s in self.splits if s.is_debit)
        total_credits = sum(s.amount for s in self.splits if not s.is_debit)
        if total_debits != total_credits:
            raise ValueError(
                f"Unbalanced transaction: Debits ({total_debits}) != Credits ({total_credits})"
            )
        return self


class AccountResponse(BaseModel):
    """Public account summary representation."""
    id: int
    name: str
    account_type: AccountType
    currency: str
    balance: Decimal
    is_active: bool
    created_at: str


class SpendingCategorySummary(BaseModel):
    """Aggregated spending summary by category."""
    category: str
    total_spent: Decimal
    transaction_count: int
    currency: str
