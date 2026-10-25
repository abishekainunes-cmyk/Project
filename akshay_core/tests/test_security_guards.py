"""Security and vulnerability defense tests.

Covers:
- SQL injection immunity
- Path traversal prevention
- Null byte and ADS injection defense
- Zero-leak audit log scrubbing
- Capability-based tool execution & HITL gating
"""

import json
from decimal import Decimal
from pathlib import Path
import pytest
from pydantic import BaseModel, Field

from akshay_core.security.validator import (
    resolve_safe_path,
    validate_identifier,
    sanitize_text,
    SecurityValidationError,
)
from akshay_core.security.audit_logger import scrub_sensitive_data, AuditLogger
from akshay_core.finos.ledger import FinOSLedger
from akshay_core.finos.models import TransactionCreate
from akshay_core.core.tool_registry import (
    SafeToolRegistry,
    AuthorizationRequiredError,
    ToolExecutionError,
)


# =========================================================================
# 1. SQL Injection Defense Tests
# =========================================================================

def test_sql_injection_in_account_name_rejected():
    """Validates that SQL injection attempts in account names are caught before query execution."""
    injection_payloads = [
        "Assets'; DROP TABLE accounts; --",
        "Expenses' OR '1'='1",
        "admin'--",
        "UNION SELECT * FROM accounts",
        "'; EXEC xp_cmdshell('dir');--",
        "Assets:Bank/*comment*/",
    ]
    for payload in injection_payloads:
        with pytest.raises(SecurityValidationError):
            validate_identifier(payload, field_name="account_name")


def test_sql_injection_payload_in_description_is_parameterized():
    """Ensures raw SQL strings inside transaction descriptions are treated strictly as literal data."""
    ledger = FinOSLedger(db_path=":memory:")
    malicious_desc = "Coffee '; DROP TABLE splits; SELECT * FROM accounts WHERE '1'='1"
    
    tx = TransactionCreate(
        description=malicious_desc,
        debit_account="Expenses:Food",
        credit_account="Assets:Cash",
        amount=Decimal("150.00"),
    )
    tx_id = ledger.record_transaction(tx)
    assert tx_id > 0

    # Ensure tables were NOT dropped and query executed safely via parameterized bindings
    assert ledger.verify_global_invariants() is True
    assert ledger.get_account_balance("Expenses:Food") == Decimal("150.00")


# =========================================================================
# 2. Path Traversal & Filesystem Sandbox Tests
# =========================================================================

def test_path_traversal_blocked(tmp_path):
    """Verifies that attempts to escape base directory via '..' or absolute paths are blocked."""
    base_dir = tmp_path / "sandbox"
    base_dir.mkdir()

    traversal_payloads = [
        "../secret.txt",
        "..\\..\\Windows\\System32\\cmd.exe",
        "folder/../../outside.txt",
        "/etc/passwd",
        "C:\\Windows\\System32\\drivers\\etc\\hosts",
    ]
    for payload in traversal_payloads:
        with pytest.raises(SecurityValidationError, match="Path traversal detected"):
            resolve_safe_path(base_dir, payload)


def test_null_byte_path_injection_blocked(tmp_path):
    """Verifies that null-byte path injection is rejected."""
    base_dir = tmp_path / "sandbox"
    base_dir.mkdir()

    with pytest.raises(SecurityValidationError, match="Null byte injection detected"):
        resolve_safe_path(base_dir, "document.pdf\x00.exe")


def test_alternate_data_stream_blocked(tmp_path):
    """Verifies Windows alternate data stream syntax is rejected."""
    base_dir = tmp_path / "sandbox"
    base_dir.mkdir()

    with pytest.raises(SecurityValidationError, match="Alternate Data Stream"):
        resolve_safe_path(base_dir, "test.txt:$DATA")


def test_legitimate_subpath_allowed(tmp_path):
    """Verifies legitimate subpaths within the sandbox resolve safely."""
    base_dir = tmp_path / "sandbox"
    base_dir.mkdir()

    resolved = resolve_safe_path(base_dir, "documents/notes.txt")
    assert resolved == (base_dir / "documents" / "notes.txt").resolve()
    assert str(resolved).startswith(str(base_dir.resolve()))


# =========================================================================
# 3. Zero-Leak Audit Log Scrubbing Tests
# =========================================================================

def test_sensitive_data_scrubbed():
    """Ensures passwords, bearer tokens, API keys, and credit cards are redacted."""
    raw_message = (
        "User logged in with password='SuperSecretPassword123!', "
        "Authorization: Bearer ya29.a0AfH6SMD9876543210abcdef, "
        "using Card 4111-2222-3333-4444 and api_key='sk_live_998877665544332211'."
    )
    scrubbed = scrub_sensitive_data(raw_message)

    assert "SuperSecretPassword123!" not in scrubbed
    assert "ya29.a0AfH6SMD9876543210abcdef" not in scrubbed
    assert "4111-2222-3333-4444" not in scrubbed
    assert "sk_live_998877665544332211" not in scrubbed
    assert "[REDACTED_PASSWORD]" in scrubbed
    assert "[REDACTED_TOKEN]" in scrubbed
    assert "[REDACTED_CARD_NUMBER]" in scrubbed
    assert "[REDACTED_API_KEY]" in scrubbed


def test_audit_logger_records_safe_event(tmp_path):
    """Verifies audit logger creates clean, uncorrupted, scrubbed JSON entries."""
    log_file = tmp_path / "audit.log"
    logger = AuditLogger(log_file=log_file, log_to_stdout=False)

    record = logger.log_event(
        event_type="AUTH",
        severity="INFO",
        action="Login attempt",
        actor="user_123",
        details={"token": "Bearer abcdef1234567890xyz", "card": "4111 2222 3333 4444"},
        success=True,
    )

    assert "abcdef1234567890xyz" not in json.dumps(record)
    assert "4111 2222 3333 4444" not in json.dumps(record)
    assert log_file.exists()


# =========================================================================
# 4. Safe Tool Registry & Human-In-The-Loop (HITL) Gate Tests
# =========================================================================

class TransferArgs(BaseModel):
    destination_account: str = Field(..., min_length=2, max_length=64)
    amount: Decimal = Field(..., gt=Decimal("0.00"))


def dummy_transfer_handler(destination_account: str, amount: Decimal) -> str:
    return f"Transferred {amount} to {destination_account}"


def test_tool_registry_enforces_hitl_approval():
    """Ensures sensitive operations cannot execute without explicit confirmation."""
    registry = SafeToolRegistry()
    registry.register_tool(
        name="transfer_funds",
        description="Transfers money to another account",
        args_schema=TransferArgs,
        handler=dummy_transfer_handler,
        requires_approval=True,  # Mandatory human gate
    )

    # 1. Attempt execution without confirmation -> Must be blocked
    with pytest.raises(AuthorizationRequiredError, match="Action 'transfer_funds' is high-consequence"):
        registry.execute_tool(
            tool_name="transfer_funds",
            arguments={"destination_account": "Assets:External", "amount": "5000.00"},
            user_confirmed=False,
        )

    # 2. Execution with explicit confirmation -> Must succeed
    result = registry.execute_tool(
        tool_name="transfer_funds",
        arguments={"destination_account": "Assets:External", "amount": "5000.00"},
        user_confirmed=True,
    )
    assert "Transferred 5000.00 to Assets:External" in result


def test_tool_registry_rejects_unvalidated_arguments():
    """Ensures malformed or malicious inputs are rejected by the Pydantic schema."""
    registry = SafeToolRegistry()
    registry.register_tool(
        name="transfer_funds",
        description="Transfers money to another account",
        args_schema=TransferArgs,
        handler=dummy_transfer_handler,
        requires_approval=False,
    )

    # Negative amount payload
    with pytest.raises(SecurityValidationError):
        registry.execute_tool(
            tool_name="transfer_funds",
            arguments={"destination_account": "Assets:External", "amount": "-100.00"},
        )
