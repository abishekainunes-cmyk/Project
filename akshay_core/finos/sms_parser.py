"""Universal Bank & UPI SMS Transaction Parser.

Solves the daily friction of manual expense tracking by automatically extracting
structured financial records from unstructured bank alerts and UPI notifications.
"""

from __future__ import annotations
import re
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

from akshay_core.security.validator import sanitize_text


class ParsedSMS(BaseModel):
    is_financial: bool
    transaction_type: str = Field(default="UNKNOWN", description="'DEBIT', 'CREDIT', or 'UNKNOWN'")
    amount: Decimal = Field(default=Decimal("0.00"))
    currency: str = Field(default="INR")
    merchant: str = Field(default="General Merchant")
    category: str = Field(default="Uncategorized")
    account_mask: Optional[str] = None
    raw_snippet: str = ""


# High-precision regular expressions for Indian & Global bank alerts
_AMOUNT_PATTERN = re.compile(
    r"(?i)(?:rs\.?|inr|usd|\$|eur|€|gbp|£)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:inr|rs\.?)"
)

_DEBIT_KEYWORDS = re.compile(r"(?i)\b(debited|spent|paid|withdrawn|purchase|deducted|charged|sent)\b")
_CREDIT_KEYWORDS = re.compile(r"(?i)\b(credited|received|deposited|refunded|cashback|added)\b")

_ACCOUNT_PATTERN = re.compile(r"(?i)(?:a/c|acct|card|ending|vpa|acc)\s*(?:no\.?)?\s*(?:[*xX]+|ending in\s*)?(\d{3,4})")

_MERCHANT_PATTERNS = [
    re.compile(r"(?i)(?:to|at|vpa|info|for)\s+([A-Za-z0-9\s&.\-]{2,30}?)(?:\s+on|\s+ref|\s+avail|\s+bal|\.|\,|$)"),
    re.compile(r"(?i)vpa\s+([a-zA-Z0-9.\-_]+@[a-zA-Z]+)"),
]

# Smart category matcher based on clean merchant names
_CATEGORY_RULES = [
    (re.compile(r"(?i)swiggy|zomato|starbucks|mcdonald|kfc|domino|restaurant|cafe|coffee|diner|burger"), "Dining"),
    (re.compile(r"(?i)blinkit|zepto|instamart|bigbasket|supermarket|grocery|dmart|walmart"), "Groceries"),
    (re.compile(r"(?i)uber|ola|rapido|metro|petrol|fuel|hpcl|bpcl|iocl|parking|toll"), "Transit"),
    (re.compile(r"(?i)amazon|flipkart|myntra|zara|h&m|retail|store|mall"), "Shopping"),
    (re.compile(r"(?i)netflix|spotify|prime|hotstar|pvr|inox|cinema|movie"), "Entertainment"),
    (re.compile(r"(?i)electricity|bescom|water|gas|broadband|wifi|airtel|jio|vi\b"), "Utilities"),
    (re.compile(r"(?i)salary|payroll|stipend|wages"), "Salary"),
    (re.compile(r"(?i)hospital|pharmacy|apollo|medplus|doctor|clinic"), "Healthcare"),
]


def parse_bank_sms(sms_text: str) -> ParsedSMS:
    """Parses a bank SMS or push notification into a structured transaction object.
    
    Args:
        sms_text: Raw incoming SMS or notification string.
        
    Returns:
        ParsedSMS object with amount, merchant, and detected category.
    """
    clean_text = sanitize_text(sms_text, max_length=500, field_name="sms_text")
    
    # 1. Detect transaction direction
    is_debit = bool(_DEBIT_KEYWORDS.search(clean_text))
    is_credit = bool(_CREDIT_KEYWORDS.search(clean_text))
    
    if not (is_debit or is_credit):
        return ParsedSMS(is_financial=False, raw_snippet=clean_text[:60])

    tx_type = "DEBIT" if is_debit else "CREDIT"

    # 2. Extract Amount
    amt_match = _AMOUNT_PATTERN.search(clean_text)
    if not amt_match:
        return ParsedSMS(is_financial=False, raw_snippet=clean_text[:60])

    raw_amt = amt_match.group(1) or amt_match.group(2)
    amount = Decimal(raw_amt.replace(",", ""))

    # Detect currency
    currency = "INR"
    if "$" in clean_text or "USD" in clean_text.upper():
        currency = "USD"
    elif "€" in clean_text or "EUR" in clean_text.upper():
        currency = "EUR"
    elif "£" in clean_text or "GBP" in clean_text.upper():
        currency = "GBP"

    # 3. Extract Account Mask
    acc_match = _ACCOUNT_PATTERN.search(clean_text)
    account_mask = f"**{acc_match.group(1)}" if acc_match else None

    # 4. Extract Merchant
    merchant = "Unknown Merchant"
    for p in _MERCHANT_PATTERNS:
        m = p.search(clean_text)
        if m:
            candidate = m.group(1).strip()
            # Exclude false positives like "your a/c" or "ref"
            if len(candidate) > 2 and not re.match(r"(?i)^(your|account|my|bank|rs|inr)$", candidate):
                merchant = candidate
                break

    # 5. Classify Category
    category = "General Expense" if tx_type == "DEBIT" else "General Income"
    for pattern, cat_name in _CATEGORY_RULES:
        if pattern.search(merchant) or pattern.search(clean_text):
            category = cat_name
            break

    return ParsedSMS(
        is_financial=True,
        transaction_type=tx_type,
        amount=amount,
        currency=currency,
        merchant=merchant,
        category=category,
        account_mask=account_mask,
        raw_snippet=clean_text[:120],
    )
