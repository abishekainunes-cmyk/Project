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
