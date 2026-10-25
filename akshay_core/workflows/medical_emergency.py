"""Offline Medical Drug Interaction Matrix and Emergency SOS Beacon.

Provides offline clinical safety lookups for common over-the-counter medications
and emergency SOS beacon generation for Galaxy tablets and mobile phones.
"""

from __future__ import annotations
import re
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

from akshay_core.security.validator import sanitize_text


class DrugInteractionResult(BaseModel):
    drug_a: str
    drug_b: str
    severity: str = Field(..., description="'SAFE', 'CAUTION', 'DANGEROUS'")
    clinical_effect: str
    recommendation: str


# Offline curated pharmacovigilance matrix
DRUG_PAIRS = [
    # Paracetamol / Acetaminophen
    (
        {"paracetamol", "acetaminophen"},
        {"ibuprofen", "advil", "motrin"},
        "SAFE",
        "Different metabolic pathways (hepatic vs renal). Minimal risk when taken at recommended doses.",
        "Can be taken together or staggered every 3-4 hours for persistent fever or severe pain."
    ),
    (
        {"paracetamol", "acetaminophen"},
        {"alcohol", "beer", "wine", "whiskey"},
        "DANGEROUS",
        "Increased production of toxic metabolite NAPQI, significantly elevating liver toxicity risk.",
        "Do not consume alcohol while taking paracetamol."
    ),
    # Aspirin
    (
        {"aspirin", "ecosprin"},
        {"ibuprofen", "naproxen", "diclofenac"},
        "DANGEROUS",
        "Dual COX inhibition severely increases gastric ulceration and gastrointestinal bleeding risk.",
        "Avoid concurrent use unless strictly directed by a cardiologist."
    ),
    (
        {"aspirin", "warfarin", "heparin"},
        {"ibuprofen", "painkiller"},
        "DANGEROUS",
        "Compounded antiplatelet and anticoagulant effects leading to uncontrollable internal bleeding.",
        "Contraindicated. Seek immediate medical guidance."
    ),
    # Antibiotics
    (
        {"amoxicillin", "ciprofloxacin", "doxycycline", "antibiotic"},
        {"antacid", "gelusil", "digene", "calcium", "milk"},
        "CAUTION",
        "Multivalent cations (Ca2+, Mg2+, Al3+) bind to antibiotics forming unabsorbable chelates.",
        "Space antacids or dairy at least 2 hours before or after taking antibiotics."
    ),
    # Antihistamines
    (
        {"cetirizine", "levocetirizine", "allegra", "fexofenadine"},
        {"alcohol", "sedative", "sleeping pill"},
        "DANGEROUS",
        "Compounded central nervous system depression leading to extreme drowsiness and motor impairment.",
        "Do not drive or operate machinery. Avoid alcohol."
    ),
    # Metformin
    (
        {"metformin", "glycomet"},
        {"alcohol"},
        "DANGEROUS",
        "Increases risk of life-threatening lactic acidosis.",
        "Avoid heavy or binge drinking while on metformin."
    ),
]


def check_drug_interaction(drug1: str, drug2: str) -> DrugInteractionResult:
    """Checks interaction safety between two medications offline."""
    d1 = sanitize_text(drug1.lower(), max_length=50, field_name="drug1")
    d2 = sanitize_text(drug2.lower(), max_length=50, field_name="drug2")

    for set1, set2, severity, effect, reco in DRUG_PAIRS:
        match1 = any(alias in d1 for alias in set1) and any(alias in d2 for alias in set2)
        match2 = any(alias in d2 for alias in set1) and any(alias in d1 for alias in set2)
        if match1 or match2:
            return DrugInteractionResult(
                drug_a=drug1,
                drug_b=drug2,
                severity=severity,
                clinical_effect=effect,
                recommendation=reco,
            )

    return DrugInteractionResult(
        drug_a=drug1,
        drug_b=drug2,
        severity="CAUTION",
        clinical_effect="No direct contraindication found in primary offline database.",
        recommendation="Always check with a certified pharmacist or physician before combining unlisted medications.",
    )


class SOSBeaconPayload(BaseModel):
    user_name: str
    blood_group: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sos_sms_text: str
    geo_uri: str


def generate_sos_beacon(
    user_name: str = "Abishek Pranav",
    blood_group: str = "O+ Positive",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    emergency_contact: str = "+91 9876543210"
) -> SOSBeaconPayload:
    """Generates offline emergency SOS beacon payload."""
    coord_str = f"https://maps.google.com/?q={lat},{lon}" if (lat and lon) else "Location: Signal Pending"
    sms_text = f"EMERGENCY ALERT: {user_name} needs urgent assistance! Blood Group: {blood_group}. {coord_str}"
    geo_uri = f"geo:{lat},{lon}" if (lat and lon) else "geo:0,0"

    return SOSBeaconPayload(
        user_name=user_name,
        blood_group=blood_group,
        latitude=lat,
        longitude=lon,
        sos_sms_text=sms_text,
        geo_uri=geo_uri,
    )
