"""Zero-leak, structured security audit logger.

Automatically scrubs credentials, bearer tokens, credit card numbers, and PII from log streams.
"""

from __future__ import annotations
import json
import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict


# Regex patterns for sensitive data redaction
_REDACTION_PATTERNS = [
    # API Keys / Bearer tokens
    (re.compile(r"(?i)(bearer\s+)[a-zA-Z0-9_\-\.]{15,}"), r"\1[REDACTED_TOKEN]"),
    (re.compile(r"(?i)(api[_-]?key[\s:=]+)['\"]?[a-zA-Z0-9_\-]{16,}['\"]?"), r"\1[REDACTED_API_KEY]"),
    (re.compile(r"(?i)(password[\s:=]+)['\"]?[^\s'\"]+['\"]?"), r"\1[REDACTED_PASSWORD]"),
    (re.compile(r"(?i)(secret[\s:=]+)['\"]?[^\s'\"]+['\"]?"), r"\1[REDACTED_SECRET]"),
    # Credit Card Numbers (13-19 digits, with optional spaces or hyphens)
    (re.compile(r"\b(?:\d[ -]*?){13,19}\b"), "[REDACTED_CARD_NUMBER]"),
    # Bank Account numbers (loose pattern for 9-18 continuous digits in sensitive contexts)
    (re.compile(r"(?i)(account[\s_]?no|a/c[\s_]?no)[\s:=]+(\d{4})\d{4,10}(\d{4})"), r"\1 \2****\3"),
]


def scrub_sensitive_data(message: str) -> str:
    """Scrubs known sensitive patterns (passwords, keys, card numbers) from text.
    
    Args:
        message: Raw log message or string.
        
    Returns:
        Redacted string safe for logging.
    """
    if not isinstance(message, str):
        message = str(message)
        
    scrubbed = message
    for pattern, replacement in _REDACTION_PATTERNS:
        scrubbed = pattern.sub(replacement, scrubbed)
    return scrubbed


class AuditLogger:
    """Security audit logger providing structured, scrubbed event records."""
    
    def __init__(self, log_file: Path | str | None = None, log_to_stdout: bool = True):
        self.log_file = Path(log_file) if log_file else None
        self.log_to_stdout = log_to_stdout
        
        if self.log_file:
            self.log_file.parent.mkdir(parents=True, exist_ok=True)

    def log_event(
        self,
        event_type: str,
        severity: str,
        action: str,
        actor: str = "system",
        details: Dict[str, Any] | None = None,
        success: bool = True,
    ) -> Dict[str, Any]:
        """Records an auditable security event.
        
        Args:
            event_type: Category (e.g. 'AUTH', 'FIN_TRANSACTION', 'TOOL_DISPATCH', 'PATH_ACCESS').
            severity: 'INFO', 'WARNING', 'ERROR', 'CRITICAL'.
            action: Specific action performed or attempted.
            actor: Calling entity or user identifier.
            details: Contextual payload dictionary.
            success: Whether the operation completed successfully.
            
        Returns:
            The sanitized event record dictionary.
        """
        payload = details or {}
        # Serialize details to JSON, then scrub before recording
        raw_json = json.dumps(payload, default=str)
        safe_details = json.loads(scrub_sensitive_data(raw_json))
        
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type.upper(),
            "severity": severity.upper(),
            "action": scrub_sensitive_data(action),
            "actor": scrub_sensitive_data(actor),
            "success": success,
            "details": safe_details,
        }
        
        line = json.dumps(record)
        
        if self.log_to_stdout:
            print(f"[AUDIT][{record['severity']}] {record['event_type']} - {record['action']} (Success: {success})")
            
        if self.log_file:
            try:
                with open(self.log_file, "a", encoding="utf-8") as f:
                    f.write(line + "\n")
            except Exception as e:
                # Fail-safe: do not crash application if audit file write fails, but log to stderr
                import sys
                print(f"CRITICAL: Failed to write to audit log: {e}", file=sys.stderr)
                
        return record


_DEFAULT_AUDIT_LOGGER: AuditLogger | None = None

def get_audit_logger() -> AuditLogger:
    """Returns the global singleton audit logger."""
    global _DEFAULT_AUDIT_LOGGER
    if _DEFAULT_AUDIT_LOGGER is None:
        _DEFAULT_AUDIT_LOGGER = AuditLogger(log_to_stdout=False)
    return _DEFAULT_AUDIT_LOGGER
