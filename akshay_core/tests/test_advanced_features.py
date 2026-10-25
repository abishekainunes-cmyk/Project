"""Unit and AppSec tests for Options A, B, C, D:
- Voice Brain-Dump to .ICS calendar generator
- Offline Income Tax & Take-home salary engine
- Offline Medical Drug Interaction & Emergency SOS Beacon
"""

from decimal import Decimal
import pytest

from akshay_core.workflows.braindump_engine import process_braindump
from akshay_core.finos.tax_calculator import (
    calculate_new_regime_tax,
    calculate_old_regime_tax,
    compare_tax_regimes,
)
from akshay_core.workflows.medical_emergency import (
    check_drug_interaction,
    generate_sos_beacon,
)


def test_braindump_calendar_ics_generation():
    """Verifies that unstructured speech produces a compliant RFC 5545 .ics file and tasks."""
    notes = "Need to meet with David for product sync tomorrow. Buy groceries on way home."
    artifacts = process_braindump(notes)

    assert len(artifacts.tasks) >= 1
    assert len(artifacts.calendar_events) >= 1
    assert "BEGIN:VCALENDAR" in artifacts.ics_file_content
    assert "END:VCALENDAR" in artifacts.ics_file_content
    assert "BEGIN:VEVENT" in artifacts.ics_file_content
    assert "meet with david" in artifacts.calendar_events[0].summary.lower()


def test_tax_calculator_rebate_and_slabs():
    """Verifies tax exemption under 7L for New Regime and correct tax computation above 15L."""
    # Under 7L taxable income is 0 tax
    tax_6l = calculate_new_regime_tax(Decimal("600000.00"))
    assert tax_6l == Decimal("0.00")

    # ₹15,00,000 CTC in New Regime
    # Taxable = 15,00,000 - 75,000 = 14,25,000
    # 3L to 7L (4L @ 5%) = 20,000
    # 7L to 10L (3L @ 10%) = 30,000
    # 10L to 12L (2L @ 15%) = 30,000
    # 12L to 14.25L (2.25L @ 20%) = 45,000
    # Total Base Tax = 1,25,000 + 4% cess (5,000) = 1,30,000
    tax_15l = calculate_new_regime_tax(Decimal("1500000.00"))
    assert tax_15l == Decimal("130000.00")

    comparison = compare_tax_regimes(Decimal("1500000.00"))
    assert comparison.annual_gross_income == Decimal("1500000.00")
    assert comparison.monthly_take_home_new > Decimal("100000.00")


def test_drug_interaction_safety():
    """Verifies offline drug-drug safety lookups."""
    # Safe combination
    res_safe = check_drug_interaction("Paracetamol", "Ibuprofen")
    assert res_safe.severity == "SAFE"

    # Dangerous combination
    res_danger = check_drug_interaction("Aspirin", "Ibuprofen")
    assert res_danger.severity == "DANGEROUS"

    # Paracetamol + Alcohol
    res_alcohol = check_drug_interaction("Paracetamol", "Alcohol")
    assert res_alcohol.severity == "DANGEROUS"


def test_sos_beacon_generation():
    """Verifies emergency distress beacon with GPS coordinates."""
    sos = generate_sos_beacon(
        user_name="Abishek",
        blood_group="B+",
        lat=12.9716,
        lon=77.5946
    )
    assert "EMERGENCY ALERT: Abishek" in sos.sos_sms_text
    assert "https://maps.google.com/?q=12.9716,77.5946" in sos.sos_sms_text
    assert sos.geo_uri == "geo:12.9716,77.5946"


def test_wealth_runway_and_sip_compounding():
    """Verifies precision wealth runway and monthly SIP exponential compounding."""
    from akshay_core.finos.tax_calculator import calculate_financial_runway, calculate_sip_compounding

    # Runway check
    runway = calculate_financial_runway(liquid_assets=Decimal("81750.00"), monthly_burn=Decimal("15000.00"))
    assert runway.runway_months == Decimal("5.5")
    assert runway.financial_status == "CRITICAL"

    runway_safe = calculate_financial_runway(liquid_assets=Decimal("200000.00"), monthly_burn=Decimal("15000.00"))
    assert runway_safe.runway_months >= Decimal("12.0")
    assert runway_safe.financial_status == "FORTIFIED"

    # SIP compounding check: ₹10,000/mo @ 12% CAGR for 10 years
    sip = calculate_sip_compounding(monthly_investment=Decimal("10000.00"), annual_cagr_pct=Decimal("12.0"), years=10)
    assert sip.total_invested == Decimal("1200000.00")
    # Expected corpus ~23.2 Lakhs
    assert sip.estimated_wealth_corpus > Decimal("2300000.00")
    assert sip.wealth_gain > Decimal("1100000.00")


def test_fatal_drug_contraindications():
    """Verifies high-risk lethal drug contraindication detection."""
    from akshay_core.workflows.medical_emergency import check_drug_interaction

    # Sildenafil + Nitrates = CONTRAINDICATED
    res_viagra = check_drug_interaction("Viagra", "Nitroglycerin")
    assert res_viagra.severity == "CONTRAINDICATED"
    assert "hypotension" in res_viagra.clinical_effect.lower()

    # SSRI + Tramadol = CONTRAINDICATED
    res_serotonin = check_drug_interaction("Sertraline", "Tramadol")
    assert res_serotonin.severity == "CONTRAINDICATED"
    assert "serotonin syndrome" in res_serotonin.clinical_effect.lower()


def test_job_bot_multi_style_cover_letters_and_csv(tmp_path):
    """Verifies triple-style AI tailored cover letters and CSV export."""
    from akshay_core.workflows.job_bot import JobBotManager, CandidateProfile

    bot = JobBotManager(db_path=tmp_path / "bot_test.db")
    prof = bot.get_profile()
    job = bot.get_job_stream()[0]

    # Technical letter
    tech_letter = bot.generate_cover_letter(prof, job, style="technical")
    assert "low-latency architectures" in tech_letter
    assert prof.name in tech_letter

    # Executive letter
    exec_letter = bot.generate_cover_letter(prof, job, style="executive")
    assert "ROI" in exec_letter

    # Balanced letter
    balanced_letter = bot.generate_cover_letter(prof, job, style="balanced")
    assert "proven expertise" in balanced_letter

    # Apply & export CSV
    bot.apply_to_job(job.id, style="technical")
    csv_out = bot.export_applications_csv()
    assert "Company,Role,Location" in csv_out
    assert job.company in csv_out
