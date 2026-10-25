"""Real-World Daily Work Engine & Action Item Extractor for Akshay.

Solves everyday human work friction:
1. Instant Action Item Extraction from unstructured notes / meeting transcripts.
2. Eisenhower Matrix Task Prioritization.
3. Offline First Aid & Emergency Triage.
4. Leftover Pantry Meal Synthesizer.
"""

from __future__ import annotations
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from akshay_core.security.validator import sanitize_text


class ActionItem(BaseModel):
    task: str
    assignee: str = "Self"
    deadline: Optional[str] = None
    priority: str = Field(default="MEDIUM", description="'URGENT', 'HIGH', 'MEDIUM', 'LOW'")


class PrioritizedTasks(BaseModel):
    do_first: List[str] = Field(default_factory=list, description="Urgent & Important")
    schedule: List[str] = Field(default_factory=list, description="Important, Not Urgent")
    delegate: List[str] = Field(default_factory=list, description="Urgent, Not Important")
    eliminate: List[str] = Field(default_factory=list, description="Not Urgent, Not Important")


class RecipeSuggestion(BaseModel):
    title: str
    match_percentage: int
    used_ingredients: List[str]
    missing_ingredients: List[str]
    steps: List[str]


_ACTION_VERBS = re.compile(
    r"(?i)\b(need to|must|will|shall|todo|to-do|action|fix|review|prepare|submit|email|send|call|build|deploy|update|finish)\b"
)
_DEADLINE_PATTERN = re.compile(
    r"(?i)\b(by\s+[a-zA-Z0-9]+|tomorrow|today|tonight|next\s+week|eod|friday|monday|end of day)\b"
)
_URGENT_KEYWORDS = re.compile(r"(?i)\b(asap|urgent|urgently|immediately|critical|blocking|blocker)\b")


def extract_action_items_from_text(raw_text: str) -> List[ActionItem]:
    """Parses meeting notes or voice transcripts into actionable tasks.
    
    Args:
        raw_text: Messy transcribed speech or raw meeting notes.
        
    Returns:
        List of structured ActionItem objects.
    """
    clean = sanitize_text(raw_text, max_length=2000, field_name="meeting_notes")
    lines = [s.strip() for s in re.split(r"[.\n;]", clean) if s.strip()]

    items: List[ActionItem] = []

    for line in lines:
        if not _ACTION_VERBS.search(line):
            continue

        # Detect assignee
        assignee = "Self"
        name_match = re.search(r"^(?:(?P<name>[A-Z][a-z]+)\s+(?:will|to|should|needs to))", line)
        if name_match:
            assignee = name_match.group("name")

        # Detect deadline
        deadline_match = _DEADLINE_PATTERN.search(line)
        deadline = deadline_match.group(0).strip() if deadline_match else None

        # Priority
        if _URGENT_KEYWORDS.search(line):
            priority = "URGENT"
        elif deadline and ("today" in deadline.lower() or "eod" in deadline.lower()):
            priority = "HIGH"
        else:
            priority = "MEDIUM"

        items.append(ActionItem(
            task=line,
            assignee=assignee,
            deadline=deadline,
            priority=priority,
        ))

    return items


def prioritize_tasks_eisenhower(tasks: List[str]) -> PrioritizedTasks:
    """Classifies a list of daily tasks into the Eisenhower Matrix."""
    result = PrioritizedTasks()
    for t in tasks:
        clean_t = sanitize_text(t, max_length=200, field_name="task_item")
        lower = clean_t.lower()

        if any(w in lower for w in ["urgent", "asap", "critical", "client", "deploy", "break", "fix", "deadline"]):
            result.do_first.append(clean_t)
        elif any(w in lower for w in ["study", "exercise", "strategy", "plan", "write", "learn", "review", "refactor"]):
            result.schedule.append(clean_t)
        elif any(w in lower for w in ["call", "email", "schedule", "order", "clean", "meeting"]):
            result.delegate.append(clean_t)
        else:
            result.eliminate.append(clean_t)

    return result


# Deterministic Offline Emergency First-Aid Triage Protocols
FIRST_AID_PROTOCOLS: Dict[str, Dict[str, Any]] = {
    "burn": {
        "title": "Thermal / Heat Burn Protocol",
        "severity_check": "If skin is charred, white, or burn is larger than palm, seek emergency hospital care immediately.",
        "steps": [
            "1. Cool the burn immediately under cool running tap water for 10-20 minutes. (DO NOT use ice or ice water).",
            "2. Remove tight rings, clothing, or jewellery near the area before swelling starts.",
            "3. Cover with a sterile, non-adherent dressing or clean plastic wrap.",
            "4. Never pop blisters or apply butter, toothpaste, or home grease.",
            "5. Take ibuprofen or paracetamol for pain management if required."
        ]
    },
    "cpr": {
        "title": "Cardiopulmonary Resuscitation (Adult CPR)",
        "severity_check": "Person is unresponsive, not breathing normally, or gasping.",
        "steps": [
            "1. Call local emergency services (112 / 911 / 108) and put phone on speaker.",
            "2. Place heel of hand on center of chest; interlock second hand on top.",
            "3. Push hard and fast: 100-120 compressions per minute (to the rhythm of 'Stayin Alive').",
            "4. Compress down at least 2 inches (5 cm), allowing full chest recoil.",
            "5. Do NOT pause compressions until emergency medics arrive or an AED is ready."
        ]
    },
    "choking": {
        "title": "Choking Emergency (Heimlich Maneuver)",
        "severity_check": "Person cannot speak, cough forcefully, or breathe; clutching neck.",
        "steps": [
            "1. Stand behind the person and wrap your arms around their waist.",
            "2. Make a fist with one hand and place the thumb side just above the navel.",
            "3. Grasp fist with your other hand.",
            "4. Perform quick, inward and upward abdominal thrusts.",
            "5. Repeat until the foreign object is expelled or person becomes unconscious."
        ]
    },
    "bleeding": {
        "title": "Severe Bleeding Control",
        "severity_check": "Blood is spurting or will not stop after 5 minutes of direct pressure.",
        "steps": [
            "1. Apply direct, firm pressure on the wound using a clean cloth or sterile gauze.",
            "2. Maintain continuous pressure for at least 10 minutes without lifting the cloth to check.",
            "3. If blood soaks through, add another cloth on top—DO NOT remove the first layer.",
            "4. Elevate the injured limb above heart level if no bone fracture is suspected.",
            "5. If bleeding is arterial/catastrophic, apply a medical tourniquet 2-3 inches above wound."
        ]
    }
}


def get_first_aid_guide(condition: str) -> Optional[Dict[str, Any]]:
    """Returns step-by-step offline medical protocol for emergencies."""
    cond_clean = sanitize_text(condition.lower(), max_length=50, field_name="condition")
    for key, protocol in FIRST_AID_PROTOCOLS.items():
        if key in cond_clean or cond_clean in key:
            return protocol
    return None
