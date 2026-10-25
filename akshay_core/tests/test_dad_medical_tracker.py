"""Unit and integration tests for Dad's Medical Tracker."""

import pytest
import datetime
from pathlib import Path
from akshay_core.workflows.dad_medical_tracker import (
    DadMedicalTracker,
    add_months
)


@pytest.fixture
def temp_tracker(tmp_path: Path) -> DadMedicalTracker:
    db = tmp_path / "test_dad_medical.db"
    return DadMedicalTracker(db_path=db)


def test_add_months_deterministic():
    d = datetime.date(2026, 8, 15)
    # +5 months -> 2027-01-15
    res5 = add_months(d, 5)
    assert res5 == datetime.date(2027, 1, 15)

    # +6 months -> 2027-02-15
    res6 = add_months(d, 6)
    assert res6 == datetime.date(2027, 2, 15)

    # Month end clipping (e.g. Aug 31 + 6 months -> Feb 28)
    d31 = datetime.date(2026, 8, 31)
    res_feb = add_months(d31, 6)
    assert res_feb == datetime.date(2027, 2, 28)


def test_medicine_projection_reorder_date(temp_tracker: DadMedicalTracker):
    # 20 pills, 2/day = 10 days remaining. With 12 days lead time, urgency is REORDER_NOW!
    proj = temp_tracker.calculate_medicine_projection(current_qty=20, daily_dose=2, lead_days=12)
    assert proj["days_remaining"] == 10
    assert proj["urgency"] == "REORDER_NOW"

    # 40 pills, 1/day = 40 days remaining. Reorder is 40 - 12 = 28 days from now
    proj2 = temp_tracker.calculate_medicine_projection(current_qty=40, daily_dose=1, lead_days=12)
    assert proj2["days_remaining"] == 40
    assert proj2["urgency"] == "HEALTHY"


def test_appointments_recurrence_and_booking_dates(temp_tracker: DadMedicalTracker):
    appts = temp_tracker.get_appointments()
    assert len(appts) == 2

    neuro = next(a for a in appts if a.id == "DOC-NEURO")
    assert neuro.doctor_name == "Dr. Baskar"
    assert neuro.specialty == "Neurology"
    assert neuro.interval_months == 5
    assert neuro.booking_reminder_date < neuro.next_due_date

    heart = next(a for a in appts if a.id == "DOC-HEART")
    assert heart.doctor_name == "Dr. Suresh"
    assert heart.specialty == "Cardiology"
    assert heart.interval_months == 6
    assert heart.booking_reminder_date < heart.next_due_date


def test_refill_and_log_dose(temp_tracker: DadMedicalTracker):
    meds = temp_tracker.get_medicines()
    first_med = meds[0]
    initial_qty = first_med.current_qty

    # Refill +30
    refilled = temp_tracker.refill_medicine(first_med.id, qty_added=30)
    assert refilled.current_qty == initial_qty + 30

    # Log daily dose
    dosed = temp_tracker.log_daily_dose(first_med.id)
    assert dosed.current_qty == initial_qty + 30 - first_med.daily_dose


def test_prescription_ocr_auto_ingestion(temp_tracker: DadMedicalTracker):
    prescription_text = (
        "Prescription from Neuro Care Institute\n"
        "Consultant: Dr. Baskar (Neurology)\n"
        "Rx:\n"
        "1. Levetiracetam 500mg - Qty: 60 tabs (1-0-1)\n"
        "2. Donepezil 5mg - Qty: 30 tabs (0-0-1)\n"
        "Review after 5 months."
    )
    result = temp_tracker.process_prescription_ocr(text_snippet=prescription_text)
    assert result["success"] is True
    assert result["doctor_name"] == "Dr. Baskar"
    assert result["specialty"] == "Neurology"
    assert result["interval_months"] == 5
    assert len(result["medicines_extracted"]) >= 2

    # Verify updated appointment
    appts = temp_tracker.get_appointments()
    neuro = next(a for a in appts if a.id == "DOC-NEURO")
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    assert neuro.last_visit_date == today_str


def test_ics_export(temp_tracker: DadMedicalTracker):
    ics = temp_tracker.generate_appointment_ics("DOC-HEART")
    assert "BEGIN:VCALENDAR" in ics
    assert "Dr. Suresh" in ics
    assert "Cardiology" in ics
    assert "VALARM" in ics


def test_voice_medicine_command_parsing(temp_tracker: DadMedicalTracker):
    cmd = "remind me to add riverflow 2.5mg qty 30 , for heart"
    res = temp_tracker.parse_voice_medicine_command(cmd)
    assert res["success"] is True
    med = res["medicine"]
    assert "Riverflow" in med["name"] or "riverflow" in med["name"].lower()
    assert med["current_qty"] == 30
    assert med["category"] == "Cardiac"
    assert "Suresh" in med["prescribed_by"]
    assert res["reorder_alert_date"] < res["runout_date"]
    assert "VALARM" in res["voice_response"] or "Calendar" in res["voice_response"]


def test_bulk_medicine_addition(temp_tracker: DadMedicalTracker):
    bulk_input = """
    Riverflow 2.5mg, 30, Heart, 1
    Donepezil 5mg, 45, Neuro, 1
    Telmisartan 40mg, 60, Heart, 1
    """
    added = temp_tracker.parse_and_add_bulk_text(bulk_input)
    assert len(added) == 3

    rf = next(m for m in added if "Riverflow" in m.name)
    assert rf.current_qty == 30
    assert rf.category == "Cardiac"

    dp = next(m for m in added if "Donepezil" in m.name)
    assert dp.current_qty == 45
    assert dp.category == "Neuro"


def test_unified_calendar_and_master_ics(temp_tracker: DadMedicalTracker):
    # Add a medicine
    temp_tracker.parse_voice_medicine_command("remind me to add riverflow 2.5mg qty 30 , for heart")
    events = temp_tracker.get_unified_calendar_events()
    assert len(events) >= 3

    # Check event types
    event_types = {e["type"] for e in events}
    assert "MEDICINE_REORDER" in event_types
    assert "DOCTOR_BOOKING_OPEN" in event_types
    assert "DOCTOR_CONSULTATION" in event_types

    ics = temp_tracker.generate_unified_calendar_ics()
    assert "BEGIN:VCALENDAR" in ics
    assert "BEGIN:VEVENT" in ics
    assert "BEGIN:VALARM" in ics
    assert "Riverflow" in ics or "reorder" in ics.lower()
