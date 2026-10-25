"""Voice Brain-Dump to Multi-Artifacts & Calendar .ICS Generator.

Parses unstructured speech into:
1. Actionable task checklist.
2. Standard RFC 5545 iCalendar (.ics) events ready to import into Samsung/Google Calendar.
3. Formatted email and WhatsApp drafts.
"""

from __future__ import annotations
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

from akshay_core.security.validator import sanitize_text


class CalendarEvent(BaseModel):
    summary: str
    description: str = ""
    start_time_iso: str
    duration_minutes: int = 60
    location: str = "Office / Remote"


class BrainDumpArtifacts(BaseModel):
    tasks: List[str]
    calendar_events: List[CalendarEvent]
    ics_file_content: str
    email_draft: dict
    whatsapp_draft: str


def generate_ics_string(events: List[CalendarEvent]) -> str:
    """Generates an RFC 5545 standard .ics file string from calendar events."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Akshay Personal AI//BrainDump Calendar Engine//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]

    for ev in events:
        try:
            dt = datetime.fromisoformat(ev.start_time_iso)
        except Exception:
            dt = datetime.now(timezone.utc) + timedelta(days=1)

        dt_start_str = dt.strftime("%Y%m%dT%H%M%SZ")
        dt_end_str = (dt + timedelta(minutes=ev.duration_minutes)).strftime("%Y%m%dT%H%M%SZ")
        dt_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        uid = str(uuid.uuid4())

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{dt_stamp}",
            f"DTSTART:{dt_start_str}",
            f"DTEND:{dt_end_str}",
            f"SUMMARY:{ev.summary}",
            f"DESCRIPTION:{ev.description}",
            f"LOCATION:{ev.location}",
            "STATUS:CONFIRMED",
            "END:VEVENT",
        ])

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)


def process_braindump(text: str) -> BrainDumpArtifacts:
    """Decomposes messy brain-dumps into calendar events, tasks, and communications."""
    clean = sanitize_text(text, max_length=2000, field_name="braindump_text")
    sentences = [s.strip() for s in re.split(r"[.\n;]", clean) if s.strip()]

    tasks: List[str] = []
    events: List[CalendarEvent] = []

    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)

    for s in sentences:
        lower = s.lower()
        # Calendar events detection
        if any(w in lower for w in ["meet", "meeting", "call", "appointment", "sync", "demo", "interview"]):
            events.append(CalendarEvent(
                summary=s[:50],
                description=s,
                start_time_iso=tomorrow.isoformat(),
                duration_minutes=45
            ))
        else:
            tasks.append(s)

    if not events:
        # Default follow-up event
        events.append(CalendarEvent(
            summary="Follow up on Brain-Dump Notes",
            description=clean[:120],
            start_time_iso=tomorrow.isoformat(),
            duration_minutes=30
        ))

    ics_content = generate_ics_string(events)

    # Email & WhatsApp drafts
    first_task = tasks[0] if tasks else "Review shared notes"
    email_draft = {
        "subject": f"Action Items & Follow-up: {first_task[:40]}",
        "body": f"Hi team,\n\nFollowing up on our discussions:\n\n" + "\n".join(f"- {t}" for t in tasks) + "\n\nBest regards,\nAbishek"
    }

    whatsapp_draft = "⚡ *Akshay Action Items:*\n" + "\n".join(f"• {t}" for t in tasks)

    return BrainDumpArtifacts(
        tasks=tasks,
        calendar_events=events,
        ics_file_content=ics_content,
        email_draft=email_draft,
        whatsapp_draft=whatsapp_draft,
    )
