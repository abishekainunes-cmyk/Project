"""Input validation, path traversal prevention, and injection defense.
"""

from __future__ import annotations
import os
import re
from pathlib import Path


class SecurityValidationError(ValueError):
    """Raised when an input or operation violates security constraints."""
    pass


# Strict identifier regex: alphanumeric, underscores, hyphens, colons (for hierarchical accounts)
_IDENTIFIER_PATTERN = re.compile(r"^[a-zA-Z0-9_:\-]{1,64}$")

# Suspicious control characters (null bytes, carriage-return control injections)
_CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")


def validate_identifier(name: str, field_name: str = "identifier") -> str:
    """Validates that a string is a safe, alphanumeric identifier.
    
    Prevents SQL injection, command injection, and formatting vulnerabilities.
    
    Args:
        name: The identifier string to validate.
        field_name: Descriptive name for error messages.
        
    Returns:
        The validated identifier.
        
    Raises:
        SecurityValidationError: If the identifier contains invalid characters.
    """
    if not isinstance(name, str):
        raise SecurityValidationError(f"{field_name} must be a string, got {type(name).__name__}")
    
    cleaned = name.strip()
    if not cleaned:
        raise SecurityValidationError(f"{field_name} cannot be empty or whitespace only")
    
    if len(cleaned) > 64:
        raise SecurityValidationError(f"{field_name} exceeds maximum length of 64 characters")
        
    if not _IDENTIFIER_PATTERN.match(cleaned):
        raise SecurityValidationError(
            f"Invalid {field_name} '{cleaned}'. Only alphanumeric characters, dashes, underscores, and colons are permitted."
        )
        
    return cleaned


def resolve_safe_path(base_dir: str | Path, untrusted_target: str | Path) -> Path:
    """Safely resolves an untrusted path within an approved base directory.
    
    Guarantees that the resulting canonical path cannot escape base_dir via:
    - Path traversal sequences ('..', '../', '..\\')
    - Null byte injection ('\x00')
    - Alternate data streams (':$DATA' on Windows)
    - Absolute path override
    
    Args:
        base_dir: The approved root directory boundary.
        untrusted_target: The user-supplied or untrusted relative path.
        
    Returns:
        A canonicalized Path object guaranteed to reside within base_dir.
        
    Raises:
        SecurityValidationError: If traversal or boundary violation is detected.
    """
    if not base_dir:
        raise SecurityValidationError("base_dir must be specified")
        
    target_str = str(untrusted_target)
    
    # Null byte check
    if "\x00" in target_str:
        raise SecurityValidationError("Null byte injection detected in target path")
        
    # Windows Alternate Data Stream (ADS) check
    if ":$" in target_str:
        raise SecurityValidationError("Alternate Data Stream (ADS) pattern detected in target path")
        
    base_path = Path(base_dir).resolve()
    
    # Check if target tries to be an absolute path
    target_path = Path(target_str)
    if target_path.is_absolute():
        # Disallow absolute paths from escaping base_dir
        resolved = target_path.resolve()
    else:
        resolved = (base_path / target_path).resolve()
        
    # Ensure resolved path is strictly within base_path
    try:
        resolved.relative_to(base_path)
    except ValueError:
        raise SecurityValidationError(
            f"Path traversal detected: '{untrusted_target}' attempts to escape base directory '{base_dir}'"
        )
        
    return resolved


def sanitize_text(text: str, max_length: int = 1000, field_name: str = "text") -> str:
    """Sanitizes free-form text input by removing dangerous control characters and bounding length.
    
    Args:
        text: Untrusted text input.
        max_length: Maximum allowed character length.
        field_name: Field description for error reporting.
        
    Returns:
        Sanitized string.
        
    Raises:
        SecurityValidationError: If text exceeds length limits.
    """
    if not isinstance(text, str):
        raise SecurityValidationError(f"{field_name} must be a string, got {type(text).__name__}")
        
    if len(text) > max_length:
        raise SecurityValidationError(
            f"{field_name} exceeds maximum length limit of {max_length} characters (got {len(text)})"
        )
        
    # Strip null bytes and non-printable control characters, but preserve tabs, newlines, CR
    sanitized = _CONTROL_CHAR_PATTERN.sub("", text)
    return sanitized.strip()
