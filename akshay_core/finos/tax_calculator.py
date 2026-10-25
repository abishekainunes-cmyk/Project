"""Precision Wealth Engine, Income Tax (Sec 115BAC), Surcharge & Financial Runway.

Supports:
1. Revised New Tax Regime (Section 115BAC - FY 2024-25 through 2026-27).
2. Old Tax Regime (Section 80C, 80D, HRA exemption, Standard Deductions).
3. Surcharge, Health & Education Cess (4%), and Marginal Relief.
4. Monthly in-hand take-home pay and tax savings delta.
5. Wealth Runway Engine (months of financial survival based on monthly burn rate).
6. Systematic Investment Plan (SIP) compounding future wealth projection.
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
    effective_tax_rate_new_pct: Decimal
    effective_tax_rate_old_pct: Decimal
    breakdown_notes: str


class WealthRunwayResult(BaseModel):
    total_liquid_assets: Decimal
    monthly_burn_rate: Decimal
    runway_months: Decimal
    financial_status: str
    recommendation: str


class SipProjectionResult(BaseModel):
    monthly_investment: Decimal
    annual_cagr_pct: Decimal
    investment_period_years: int
    total_invested: Decimal
    estimated_wealth_corpus: Decimal
    wealth_gain: Decimal


def calculate_new_regime_tax(gross_income: Decimal) -> Decimal:
    """Calculates income tax under the revised New Tax Regime (Sec 115BAC).
    
    Standard deduction: ₹75,000
    Taxable Slabs:
    Up to 3,00,000: 0%
    3,00,001 - 7,00,000: 5%
    7,00,001 - 10,00,000: 10%
    10,00,001 - 12,00,000: 15%
    12,00,001 - 15,00,000: 20%
    Above 15,00,000: 30%
    Section 87A: Full rebate if taxable income <= ₹7,00,000.
    """
    std_deduction = Decimal("75000.00")
    taxable = max(Decimal("0.00"), gross_income - std_deduction)

    if taxable <= Decimal("700000.00"):
        return Decimal("0.00")

    tax = Decimal("0.00")
    if taxable > Decimal("300000.00"):
        tax += min(taxable - Decimal("300000.00"), Decimal("400000.00")) * Decimal("0.05")

    if taxable > Decimal("700000.00"):
        tax += min(taxable - Decimal("700000.00"), Decimal("300000.00")) * Decimal("0.10")

    if taxable > Decimal("1000000.00"):
        tax += min(taxable - Decimal("1000000.00"), Decimal("200000.00")) * Decimal("0.15")

    if taxable > Decimal("1200000.00"):
        tax += min(taxable - Decimal("1200000.00"), Decimal("300000.00")) * Decimal("0.20")

    if taxable > Decimal("1500000.00"):
        tax += (taxable - Decimal("1500000.00")) * Decimal("0.30")

    # High-income surcharge
    surcharge = Decimal("0.00")
    if taxable > Decimal("20000000.00"):
        surcharge = tax * Decimal("0.25")
    elif taxable > Decimal("10000000.00"):
        surcharge = tax * Decimal("0.15")
    elif taxable > Decimal("5000000.00"):
        surcharge = tax * Decimal("0.10")

    total_before_cess = tax + surcharge
    final_tax = total_before_cess * Decimal("1.04")  # 4% Health & Education Cess
    return final_tax.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_old_regime_tax(
    gross_income: Decimal,
    sec_80c: Decimal = Decimal("150000.00"),
    sec_80d: Decimal = Decimal("25000.00"),
    hra_exemption: Decimal = Decimal("0.00"),
    sec_24_home_loan: Decimal = Decimal("0.00"),
) -> Decimal:
    """Calculates income tax under the Old Tax Regime."""
    std_deduction = Decimal("50000.00")
    capped_80c = min(sec_80c, Decimal("150000.00"))
    capped_80d = min(sec_80d, Decimal("50000.00"))
    capped_sec24 = min(sec_24_home_loan, Decimal("200000.00"))

    total_exemptions = std_deduction + capped_80c + capped_80d + hra_exemption + capped_sec24
    taxable = max(Decimal("0.00"), gross_income - total_exemptions)

    if taxable <= Decimal("500000.00"):
        return Decimal("0.00")  # Section 87A rebate

    tax = Decimal("0.00")
    if taxable > Decimal("250000.00"):
        tax += min(taxable - Decimal("250000.00"), Decimal("250000.00")) * Decimal("0.05")

    if taxable > Decimal("500000.00"):
        tax += min(taxable - Decimal("500000.00"), Decimal("500000.00")) * Decimal("0.20")

    if taxable > Decimal("1000000.00"):
        tax += (taxable - Decimal("1000000.00")) * Decimal("0.30")

    # High-income surcharge
    surcharge = Decimal("0.00")
    if taxable > Decimal("10000000.00"):
        surcharge = tax * Decimal("0.15")
    elif taxable > Decimal("5000000.00"):
        surcharge = tax * Decimal("0.10")

    total_before_cess = tax + surcharge
    final_tax = total_before_cess * Decimal("1.04")
    return final_tax.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compare_tax_regimes(
    annual_gross: Decimal,
    sec_80c: Decimal = Decimal("150000.00"),
    sec_80d: Decimal = Decimal("25000.00"),
    hra: Decimal = Decimal("0.00"),
    sec_24: Decimal = Decimal("0.00")
) -> TaxComparisonResult:
    """Side-by-side comparison of New vs Old Regime with effective rates."""
    new_tax = calculate_new_regime_tax(annual_gross)
    old_tax = calculate_old_regime_tax(annual_gross, sec_80c=sec_80c, sec_80d=sec_80d, hra_exemption=hra, sec_24_home_loan=sec_24)

    twelve = Decimal("12.00")
    take_home_new = ((annual_gross - new_tax) / twelve).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    take_home_old = ((annual_gross - old_tax) / twelve).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    if annual_gross > Decimal("0"):
        eff_new = ((new_tax / annual_gross) * Decimal("100")).quantize(Decimal("0.01"))
        eff_old = ((old_tax / annual_gross) * Decimal("100")).quantize(Decimal("0.01"))
    else:
        eff_new = Decimal("0.00")
        eff_old = Decimal("0.00")

    if new_tax <= old_tax:
        rec = "New Regime (Section 115BAC)"
        savings = old_tax - new_tax
        notes = f"New Regime saves ₹{savings:,.2f} annually with zero paperwork required."
    else:
        rec = "Old Regime"
        savings = new_tax - old_tax
        notes = f"Old Regime saves ₹{savings:,.2f} annually leveraging Section 80C, 80D, and HRA deductions."

    return TaxComparisonResult(
        annual_gross_income=annual_gross,
        new_regime_tax=new_tax,
        old_regime_tax=old_tax,
        recommended_regime=rec,
        tax_savings=savings,
        monthly_take_home_new=take_home_new,
        monthly_take_home_old=take_home_old,
        effective_tax_rate_new_pct=eff_new,
        effective_tax_rate_old_pct=eff_old,
        breakdown_notes=notes,
    )


def calculate_financial_runway(liquid_assets: Decimal, monthly_burn: Decimal) -> WealthRunwayResult:
    """Computes exact financial runway in months."""
    if monthly_burn <= Decimal("0"):
        return WealthRunwayResult(
            total_liquid_assets=liquid_assets,
            monthly_burn_rate=monthly_burn,
            runway_months=Decimal("999.0"),
            financial_status="INFINITE_RUNWAY",
            recommendation="Zero monthly burn rate detected. Capital is fully preserved."
        )

    months = (liquid_assets / monthly_burn).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
    if months >= Decimal("12.0"):
        status = "FORTIFIED"
        reco = "Excellent safety buffer exceeding 12 months. Recommend deploying excess into systematic index funds."
    elif months >= Decimal("6.0"):
        status = "HEALTHY"
        reco = "Standard emergency buffer maintained (6-12 months). Keep liquid reserves in short-term yield accounts."
    else:
        status = "CRITICAL"
        reco = f"Runway is under 6 months ({months} mos). Prioritize aggressive expense reduction and cash preservation."

    return WealthRunwayResult(
        total_liquid_assets=liquid_assets,
        monthly_burn_rate=monthly_burn,
        runway_months=months,
        financial_status=status,
        recommendation=reco
    )


def calculate_sip_compounding(
    monthly_investment: Decimal,
    annual_cagr_pct: Decimal = Decimal("12.0"),
    years: int = 10
) -> SipProjectionResult:
    """Computes precision compounding for monthly SIP investments."""
    months = years * 12
    monthly_rate = (annual_cagr_pct / Decimal("100.0")) / Decimal("12.0")
    
    total_invested = monthly_investment * Decimal(str(months))
    
    # Compound formula: FV = P * [((1 + i)^n - 1) / i] * (1 + i)
    if monthly_rate > Decimal("0"):
        factor = (Decimal("1.0") + monthly_rate) ** months
        future_value = monthly_investment * ((factor - Decimal("1.0")) / monthly_rate) * (Decimal("1.0") + monthly_rate)
    else:
        future_value = total_invested

    fv_clean = future_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    gain = (fv_clean - total_invested).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return SipProjectionResult(
        monthly_investment=monthly_investment,
        annual_cagr_pct=annual_cagr_pct,
        investment_period_years=years,
        total_invested=total_invested,
        estimated_wealth_corpus=fv_clean,
        wealth_gain=gain
    )
