"""Deterministic Bill Splitting and Settlement Optimizer for FinOS.

Solves the real-world daily problem of splitting expenses among friends, roommates,
or teams, calculating minimal payment transactions to settle all debts.
Uses exact integer cents to eliminate floating-point arithmetic errors.
"""

from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple
from pydantic import BaseModel, Field, field_validator

from akshay_core.security.validator import validate_identifier, SecurityValidationError


class ExpenseParticipant(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    paid: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    share: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))

    @field_validator("paid", "share")
    @classmethod
    def round_two_decimals(cls, v: Decimal) -> Decimal:
        return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class SettlementTransaction(BaseModel):
    debtor: str
    creditor: str
    amount: Decimal


class BillSplitResult(BaseModel):
    total_bill: Decimal
    settlements: List[SettlementTransaction]
    balances: Dict[str, Decimal]


def split_bill_equally(
    total_amount: Decimal,
    payer: str,
    participants: List[str]
) -> BillSplitResult:
    """Convenience helper to split a single bill equally among participants.
    
    Args:
        total_amount: Total expense amount.
        payer: Name of person who fronted the payment.
        participants: List of all people sharing the expense (including payer if applicable).
    """
    if not participants:
        raise SecurityValidationError("At least one participant required to split bill")
    
    clean_payer = validate_identifier(payer.replace(" ", "_"), field_name="payer")
    clean_participants = [validate_identifier(p.replace(" ", "_"), field_name="participant") for p in participants]
    
    n = len(clean_participants)
    cents_total = int((total_amount * 100).to_integral_value())
    base_share_cents = cents_total // n
    remainder_cents = cents_total % n

    records: List[ExpenseParticipant] = []
    for i, p in enumerate(clean_participants):
        p_share_cents = base_share_cents + (1 if i < remainder_cents else 0)
        p_paid_cents = cents_total if p == clean_payer else 0
        records.append(ExpenseParticipant(
            name=p,
            paid=Decimal(p_paid_cents) / Decimal(100),
            share=Decimal(p_share_cents) / Decimal(100)
        ))

    return calculate_optimal_settlements(records)


def calculate_optimal_settlements(participants: List[ExpenseParticipant]) -> BillSplitResult:
    """Calculates minimal debt settlement transactions using a greedy balance-clearing algorithm.
    
    Guarantees:
    1. Net balance sum is always 0.
    2. Minimizes total transfers required.
    3. Exact integer arithmetic.
    """
    total_cents_paid = sum(int((p.paid * 100).to_integral_value()) for p in participants)
    total_cents_share = sum(int((p.share * 100).to_integral_value()) for p in participants)

    if total_cents_paid != total_cents_share:
        raise SecurityValidationError(
            f"Bill totals mismatch: Total Paid ({total_cents_paid}c) != Total Share ({total_cents_share}c)"
        )

    # Calculate net balance in cents: balance = paid - share
    # positive = is owed money (creditor)
    # negative = owes money (debtor)
    net_balances: Dict[str, int] = {}
    for p in participants:
        clean_name = validate_identifier(p.name.replace(" ", "_"), field_name="participant_name")
        cents_balance = int((p.paid * 100).to_integral_value()) - int((p.share * 100).to_integral_value())
        net_balances[clean_name] = cents_balance

    debtors: List[Tuple[str, int]] = []
    creditors: List[Tuple[str, int]] = []

    for name, bal in net_balances.items():
        if bal < 0:
            debtors.append((name, -bal))  # store positive debt
        elif bal > 0:
            creditors.append((name, bal))

    debtors.sort(key=lambda x: x[1], reverse=True)
    creditors.sort(key=lambda x: x[1], reverse=True)

    settlements: List[SettlementTransaction] = []
    i, j = 0, 0

    while i < len(debtors) and j < len(creditors):
        debtor_name, debt = debtors[i]
        creditor_name, credit = creditors[j]

        transfer_cents = min(debt, credit)
        settlements.append(SettlementTransaction(
            debtor=debtor_name.replace("_", " "),
            creditor=creditor_name.replace("_", " "),
            amount=Decimal(transfer_cents) / Decimal(100)
        ))

        debt -= transfer_cents
        credit -= transfer_cents

        if debt == 0:
            i += 1
        else:
            debtors[i] = (debtor_name, debt)

        if credit == 0:
            j += 1
        else:
            creditors[j] = (creditor_name, credit)

    display_balances = {
        name.replace("_", " "): Decimal(cents) / Decimal(100)
        for name, cents in net_balances.items()
    }

    return BillSplitResult(
        total_bill=Decimal(total_cents_paid) / Decimal(100),
        settlements=settlements,
        balances=display_balances
    )
