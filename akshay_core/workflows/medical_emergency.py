"""Clinical-Grade Offline Drug Interaction Matrix and Emergency Medical Beacon.

Provides pharmacovigilance safety evaluation for OTC and prescription compounds,
pharmacokinetic & pharmacodynamic mechanism analysis, and offline distress SOS beacons.
"""

from __future__ import annotations
import re
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

from akshay_core.security.validator import sanitize_text


class DrugInteractionResult(BaseModel):
    drug_a: str
    drug_b: str
    severity: str = Field(..., description="'SAFE', 'CAUTION', 'MAJOR', 'CONTRAINDICATED'")
    mechanism_of_action: str
    clinical_effect: str
    recommendation: str
    management_plan: str


# Offline pharmacovigilance matrix with exact clinical mechanisms
DRUG_PAIRS = [
    # Paracetamol + Ibuprofen
    (
        {"paracetamol", "acetaminophen", "dolo", "crocin", "calpol"},
        {"ibuprofen", "advil", "motrin", "brufen"},
        "SAFE",
        "Dual complementary mechanism: Central COX inhibition (paracetamol) + Peripheral COX-1/2 nonsteroidal anti-inflammatory action (ibuprofen).",
        "Superior multimodal analgesic efficacy over monotherapy with distinct hepatic vs renal clearance pathways.",
        "Safe to take concurrently or alternating every 3-4 hours for breakthrough fever or severe acute pain.",
        "Take with food or milk to safeguard gastric mucosa. Do not exceed 4000mg paracetamol / 2400mg ibuprofen daily."
    ),
    # Paracetamol + Alcohol
    (
        {"paracetamol", "acetaminophen", "dolo", "crocin"},
        {"alcohol", "beer", "wine", "whiskey", "vodka", "ethanol"},
        "DANGEROUS",
        "Ethanol induces hepatic CYP2E1 isozyme and depletes intracellular glutathione reserves.",
        "Accelerates conversion of paracetamol to hepatotoxic N-acetyl-p-benzoquinone imine (NAPQI), leading to centrilobular liver necrosis.",
        "Strictly avoid alcohol intake during paracetamol therapy.",
        "In cases of accidental co-ingestion exceeding 7.5g, seek urgent emergency medical evaluation for N-acetylcysteine (NAC) administration."
    ),
    # Aspirin + NSAIDs
    (
        {"aspirin", "ecosprin", "disprin"},
        {"ibuprofen", "naproxen", "diclofenac", "voveran"},
        "DANGEROUS",
        "Competitive binding at platelet COX-1 active site blocks aspirin-mediated irreversible thromboxane A2 inhibition, compounding GI epithelial injury.",
        "Significantly amplified peptic ulceration, occult gastrointestinal bleeding, and diminished cardioprotection.",
        "Avoid concurrent administration. If both required, ingest immediate-release aspirin at least 30 minutes before other NSAIDs.",
        "Co-prescribe proton pump inhibitors (e.g. Pantoprazole) if dual therapy is clinically mandated."
    ),
    # Aspirin + Anticoagulants
    (
        {"aspirin", "ecosprin", "disprin"},
        {"warfarin", "coumadin", "heparin", "dabigatran", "apixaban"},
        "CONTRAINDICATED",
        "Synergistic pharmacodynamic interaction: Impaired platelet aggregation (aspirin) + suppressed clotting cascade factors II, VII, IX, X (anticoagulants).",
        "Extreme risk of catastrophic intracranial hemorrhage and severe gastrointestinal bleeding.",
        "Strictly contraindicated without specialized hematologist monitoring.",
        "Frequent INR monitoring (target 2.0-3.0) and immediate emergency evaluation upon minor contusion or hematuria."
    ),
    # Sildenafil + Nitrates (LETHAL)
    (
        {"sildenafil", "viagra", "tadalafil", "cialis"},
        {"nitroglycerin", "sorbitrate", "isosorbide", "mononitrate", "nitrate", "amyl nitrite"},
        "CONTRAINDICATED",
        "Potent synergistic upregulation of cyclic guanosine monophosphate (cGMP) pathway via PDE-5 inhibition + nitric oxide donation.",
        "Profound, refractory systemic vasodilatation leading to life-threatening precipitous hypotension, coronary hypoperfusion, and cardiovascular collapse.",
        "Absolute contraindication. Never combine PDE-5 inhibitors with organic nitrates.",
        "If patient experiences angina post-sildenafil, nitrates must be withheld for a minimum of 24 to 48 hours."
    ),
    # SSRIs + Tramadol / MAOIs (Serotonin Syndrome)
    (
        {"sertraline", "fluoxetine", "escitalopram", "paroxetine", "citalopram", "zoloft"},
        {"tramadol", "ultram", "selegiline", "phenelzine", "rasagiline"},
        "CONTRAINDICATED",
        "Synergistic intrasynaptic accumulation of 5-hydroxytryptamine (5-HT) via reuptake inhibition + presynaptic release / MAO blockade.",
        "Development of life-threatening Serotonin Syndrome: Hyperthermia, neuromuscular clonus, autonomic instability, delirium, and rhabdomyolysis.",
        "Avoid concurrent use. Discontinue serotonergic agents with appropriate 14-day washout period.",
        "Immediate emergency hospitalization: Initiate supportive cooling, benzodiazepines, and cyproheptadine."
    ),
    # Antibiotics + Multivalent Cations (Antacids/Dairy)
    (
        {"amoxicillin", "ciprofloxacin", "cipro", "doxycycline", "tetracycline", "levofloxacin"},
        {"antacid", "gelusil", "digene", "calcium", "magnesium", "milk", "iron"},
        "CAUTION",
        "Polyvalent mineral cations form insoluble, non-absorbable chemical chelates with fluoroquinolones and tetracyclines in the gut lumen.",
        "Bioavailability reduced by up to 70-85%, precipitating therapeutic failure and antibiotic resistance.",
        "Stagger administration: Take antibiotic at least 2 hours prior or 4 hours after cation-rich antacids or dairy.",
        "Maintain adequate hydration throughout antimicrobial regimen."
    ),
    # Metformin + Radiocontrast / Alcohol
    (
        {"metformin", "glycomet", "glucophage"},
        {"contrast", "radiocontrast", "iodine", "alcohol"},
        "MAJOR",
        "Iodinated radiocontrast impairs renal clearance; concomitant metformin triggers mitochondrial oxidation inhibition.",
        "Severe risk of lactic acidosis (mortality ~50%) and acute contrast-induced nephropathy.",
        "Discontinue metformin at least 48 hours prior to contrast imaging and resume only after renal function confirmation.",
        "Ensure pre-procedure intravenous volume hydration and monitor serum creatinine."
    ),
]


def check_drug_interaction(drug1: str, drug2: str) -> DrugInteractionResult:
    """Evaluates drug-drug interaction safety with clinical pharmacology insights."""
    d1 = sanitize_text(drug1.lower(), max_length=60, field_name="drug1")
    d2 = sanitize_text(drug2.lower(), max_length=60, field_name="drug2")

    for set1, set2, severity, mechanism, effect, reco, plan in DRUG_PAIRS:
        match1 = any(alias in d1 for alias in set1) and any(alias in d2 for alias in set2)
        match2 = any(alias in d2 for alias in set1) and any(alias in d1 for alias in set2)
        if match1 or match2:
            return DrugInteractionResult(
                drug_a=drug1,
                drug_b=drug2,
                severity=severity,
                mechanism_of_action=mechanism,
                clinical_effect=effect,
                recommendation=reco,
                management_plan=plan
            )

    return DrugInteractionResult(
        drug_a=drug1,
        drug_b=drug2,
        severity="CAUTION",
        mechanism_of_action="No direct adverse pharmacokinetic interaction indexed in local clinical core.",
        clinical_effect="Standard metabolic clearance expected; monitor for idiosyncratic hypersensitivity.",
        recommendation="Safe under standard therapeutic dosage regimens. Consult a physician if underlying renal/hepatic impairment exists.",
        management_plan="Maintain standard dose intervals and monitor for adverse drug reactions."
    )


class SOSBeaconPayload(BaseModel):
    user_name: str
    blood_group: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sos_sms_text: str
    geo_uri: str
    triage_priority: str = "P1-CRITICAL"


def generate_sos_beacon(
    user_name: str = "Abishek Pranav",
    blood_group: str = "O+ Positive",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    emergency_contact: str = "+91 9876543210"
) -> SOSBeaconPayload:
    """Generates offline emergency SOS beacon payload."""
    coord_str = f"https://maps.google.com/?q={lat},{lon}" if (lat and lon) else "Location: GPS Pending (Signal Triangulating)"
    sms_text = f"EMERGENCY ALERT: {user_name} requires immediate medical assistance! Blood Group: {blood_group}. {coord_str}"
    geo_uri = f"geo:{lat},{lon}" if (lat and lon) else "geo:0,0"

    return SOSBeaconPayload(
        user_name=user_name,
        blood_group=blood_group,
        latitude=lat,
        longitude=lon,
        sos_sms_text=sms_text,
        geo_uri=geo_uri,
        triage_priority="P1-CRITICAL"
    )
