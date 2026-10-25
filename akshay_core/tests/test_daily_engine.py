"""Tests for the daily human workflow engine, universal SMS parser, and bill splitter.
"""

from decimal import Decimal
import pytest

from akshay_core.finos.bill_splitter import (
    split_bill_equally,
    calculate_optimal_settlements,
    ExpenseParticipant,
)
from akshay_core.finos.sms_parser import parse_bank_sms
from akshay_core.workflows.daily_engine import (
    extract_action_items_from_text,
    prioritize_tasks_eisenhower,
    get_first_aid_guide,
)


def test_bill_split_equal_and_settlement():
    """Tests splitting ₹3000 dinner among 3 people where Abishek paid for everyone."""
    res = split_bill_equally(
        total_amount=Decimal("3000.00"),
        payer="Abishek",
        participants=["Abishek", "Rahul", "Pooja"]
    )
    assert res.total_bill == Decimal("3000.00")
    # Rahul and Pooja each owe ₹1000 to Abishek
    assert len(res.settlements) == 2
    settle_map = {s.debtor: (s.creditor, s.amount) for s in res.settlements}
    assert settle_map["Rahul"] == ("Abishek", Decimal("1000.00"))
    assert settle_map["Pooja"] == ("Abishek", Decimal("1000.00"))


def test_complex_unequal_bill_split():
    """Tests an unequal group expense where multiple people paid different amounts."""
    participants = [
        ExpenseParticipant(name="Alice", paid=Decimal("60.00"), share=Decimal("40.00")),   # net +20
        ExpenseParticipant(name="Bob", paid=Decimal("20.00"), share=Decimal("40.00")),     # net -20
        ExpenseParticipant(name="Charlie", paid=Decimal("40.00"), share=Decimal("40.00")), # net 0
    ]
    res = calculate_optimal_settlements(participants)
    assert len(res.settlements) == 1
    assert res.settlements[0].debtor == "Bob"
    assert res.settlements[0].creditor == "Alice"
    assert res.settlements[0].amount == Decimal("20.00")


def test_bank_sms_parser_debit_hdfc():
    """Verifies Indian bank debit SMS extraction."""
    sms = "Alert: INR 450.00 debited from HDFC Bank A/c **4921 to Starbucks Coffee on 25-OCT-26. Avail Bal: INR 45,200.00"
    parsed = parse_bank_sms(sms)
    assert parsed.is_financial is True
    assert parsed.transaction_type == "DEBIT"
    assert parsed.amount == Decimal("450.00")
    assert parsed.currency == "INR"
    assert "Starbucks" in parsed.merchant or "Coffee" in parsed.merchant
    assert parsed.category == "Dining"
    assert parsed.account_mask == "**4921"


def test_bank_sms_parser_credit_salary():
    """Verifies salary credit alert parsing."""
    sms = "Your a/c ending 8812 is credited with INR 75,000.00 on 25-OCT-26 by Salary Payroll Ref 991823."
    parsed = parse_bank_sms(sms)
    assert parsed.is_financial is True
    assert parsed.transaction_type == "CREDIT"
    assert parsed.amount == Decimal("75000.00")
    assert parsed.category == "Salary"


def test_action_item_extraction_from_meeting():
    """Verifies action items, deadlines, and urgency are parsed from messy speech."""
    notes = (
        "Good call today. David will update the database schema by Friday. "
        "Need to fix the payment gateway bug urgently. "
        "Sarah to review the design document tomorrow."
    )
    items = extract_action_items_from_text(notes)
    assert len(items) >= 2
    task_texts = [it.task for it in items]
    assert any("fix the payment gateway bug" in t for t in task_texts)
    
    urgent_item = [it for it in items if "payment gateway" in it.task][0]
    assert urgent_item.priority == "URGENT"


def test_eisenhower_prioritization():
    """Verifies task classification into Eisenhower quadrants."""
    tasks = [
        "Urgent: Server crash in production",
        "Study deep learning fundamentals",
        "Schedule dentist appointment",
        "Browse social media feeds",
    ]
    matrix = prioritize_tasks_eisenhower(tasks)
    assert len(matrix.do_first) >= 1
    assert "Urgent: Server crash in production" in matrix.do_first[0]
    assert any("Study" in t for t in matrix.schedule)


def test_first_aid_offline_triage():
    """Verifies instant emergency guide matching."""
    burn_guide = get_first_aid_guide("burn")
    assert burn_guide is not None
    assert "Cool the burn immediately under cool running tap water" in burn_guide["steps"][0]

    cpr_guide = get_first_aid_guide("cpr")
    assert cpr_guide is not None
    assert "100-120 compressions per minute" in cpr_guide["steps"][2]
