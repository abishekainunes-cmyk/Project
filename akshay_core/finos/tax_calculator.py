"""Offline Income Tax and Monthly Take-Home Salary Calculator.

Supports:
1. New Tax Regime (Section 115BAC - FY 2024-25 / 2025-26)
2. Old Tax Regime (with Section 80C, 80D, HRA, and Standard Deductions)
3. Side-by-side comparison with net monthly take-home pay.
"""

from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from pydantic import BaseModel, Field


class TaxComparisonResult(BaseModel):
    annual_gross_income: Decimal
    new_regime_tax: Decimal
    old_regime_tax: Decimal
    recommended_regime: str
    tax_savings: Decimal
    monthly_take_home_new: Decimal
    monthly_take_home_old: Decimal
    breakdown_notes: str


def calculate_new_regime_tax(gross_income: Decimal) -> Decimal:
    """Calculates income tax under the revised New Tax Regime (Sec 115BAC).
    
    Slabs:
    Up to 3,00,000: 0%
    3,00,001 - 7,00,000: 5%
    7,00,001 - 10,00,000: 10%
    10,00,001 - 12,00,000: 15%
    12,00,001 - 15,00,000: 20%
    Above 15,00,000: 30%
    Standard Deduction: ₹75,000
    Sec 87A rebate: Tax zero if taxable income <= 7,00,000
    """
    std_deduction = Decimal("75000.00")
    taxable = max(Decimal("0.00"), gross_income - std_deduction)

    if taxable <= Decimal("700000.00"):
        return Decimal("0.00")  # Full rebate under 87A

    tax = Decimal("0.00")

    # 3L to 7L @ 5%
    if taxable > Decimal("300000.00"):
        tax += min(taxable - Decimal("300000.00"), Decimal("400000.00")) * Decimal("0.05")

    # 7L to 10L @ 10%
    if taxable > Decimal("700000.00"):
        tax += min(taxable - Decimal("700000.00"), Decimal("300000.00")) * Decimal("0.10")

    # 10L to 12L @ 15%
    if taxable > Decimal("1000000.00"):
        tax += min(taxable - Decimal("1000000.00"), Decimal("200000.00")) * Decimal("0.15")

    # 12L to 15L @ 20%
    if taxable > Decimal("1200000.00"):
        tax += min(taxable - Decimal("1200000.00"), Decimal("300000.00")) * Decimal("0.20")

    # Above 15L @ 30%
    if taxable > Decimal("1500000.00"):
        tax += (taxable - Decimal("1500000.00")) * Decimal("0.30")

    # Add 4% Health & Education Cess
    tax += tax * Decimal("0.04")
    return tax.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_old_regime_tax(
    gross_income: Decimal,
    sec_80c: Decimal = Decimal("150000.00"),
    sec_80d: Decimal = Decimal("25000.00"),
    hra_exemption: Decimal = Decimal("0.00"),
) -> Decimal:
    """Calculates income tax under the Old Tax Regime with standard deductions."""
    std_deduction = Decimal("50000.00")
    capped_80c = min(sec_80c, Decimal("150000.00"))
    total_deductions = std_deduction + capped_80c + sec_80d + hra_exemption
    taxable = max(Decimal("0.00"), gross_income - total_deductions)

    if taxable <= Decimal("500000.00"):
        return Decimal("0.00")  # Sec 87A rebate

    tax = Decimal("0.00")
    if taxable > Decimal("250000.00"):
        tax += min(taxable - Decimal("250000.00"), Decimal("250000.00")) * Decimal("0.05")
    if taxable > Decimal("500000.00"):
        tax += min(taxable - Decimal("500000.00"), Decimal("500000.00")) * Decimal("0.20")
    if taxable > Decimal("1000000.00"):
        tax += (taxable - Decimal("1000000.00")) * Decimal("0.30")

    tax += tax * Decimal("0.04")
    return tax.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compare_tax_regimes(
    annual_gross: Decimal,
    sec_80c: Decimal = Decimal("150000.00"),
    sec_80d: Decimal = Decimal("25000.00"),
    hra: Decimal = Decimal("0.00"),
) -> TaxComparisonResult:
    """Generates side-by-side comparison of tax regimes and monthly take-home salary."""
    tax_new = calculate_new_regime_tax(annual_gross)
    tax_old = calculate_old_regime_tax(annual_gross, sec_80c, sec_80d, hra)

    monthly_gross = annual_gross / Decimal(12)
    take_home_new = (annual_gross - tax_new) / Decimal(12)
    take_home_old = (annual_gross - tax_old) / Decimal(12)

    if tax_new <= tax_old:
        rec = "NEW REGIME"
        savings = tax_old - tax_new
        note = f"New Regime saves you ₹{savings:,.2f} annually with zero paperwork required."
    else:
        rec = "OLD REGIME"
        savings = tax_new - tax_old
        note = f"Old Regime saves you ₹{savings:,.2f} annually utilizing your 80C, 80D, and HRA deductions."

    return TaxComparisonResult(
        annual_gross_income=annual_gross,
        new_regime_tax=tax_new,
        old_regime_tax=tax_old,
        recommended_regime=rec,
        tax_savings=savings.quantize(Decimal("0.01")),
        monthly_take_home_new=take_home_new.quantize(Decimal("0.01")),
        monthly_take_home_old=take_home_old.quantize(Decimal("0.01")),
        breakdown_notes=note,
    )
