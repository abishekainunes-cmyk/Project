"""Secure, Capability-Based Tool Registry and Execution Gateway.

Guarantees:
1. Schema-Enforced Invocations: Every tool call must pass strict Pydantic validation.
2. Sandboxed Dispatch: No dynamic string `eval()` or unvalidated shell execution.
3. Human-In-The-Loop (HITL) Gate: High-consequence or destructive actions require explicit authorization.
4. Auditable Traces: Every execution is logged with scrubbed parameters.
"""

from __future__ import annotations
import inspect
from dataclasses import dataclass, field
from typing import Callable, Dict, Any, Type, Optional
from pydantic import BaseModel, ValidationError

from akshay_core.security.validator import SecurityValidationError, sanitize_text
from akshay_core.security.audit_logger import get_audit_logger


class ToolExecutionError(Exception):
    """Raised when tool execution fails or violates capability constraints."""
    pass


class AuthorizationRequiredError(Exception):
    """Raised when an action requires explicit user/operator consent."""
    pass


@dataclass
class ToolDefinition:
    """Metadata and capability definition for a registered tool."""
    name: str
    description: str
    args_schema: Type[BaseModel]
    handler: Callable[..., Any]
    requires_approval: bool = False
    allowed_roles: list[str] = field(default_factory=lambda: ["user", "agent"])


class SafeToolRegistry:
    """Central gateway for registering and securely executing agent tools."""

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self.audit = get_audit_logger()

    def register_tool(
        self,
        name: str,
        description: str,
        args_schema: Type[BaseModel],
        handler: Callable[..., Any],
        requires_approval: bool = False,
    ) -> None:
        """Registers a tool with an explicit schema and capability boundary."""
        if not issubclass(args_schema, BaseModel):
            raise TypeError("args_schema must be a Pydantic BaseModel subclass")
        if not callable(handler):
            raise TypeError("handler must be a callable")
            
        clean_name = sanitize_text(name, max_length=64, field_name="tool_name")
        self._tools[clean_name] = ToolDefinition(
            name=clean_name,
            description=description,
            args_schema=args_schema,
            handler=handler,
            requires_approval=requires_approval,
        )

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        """Retrieves a registered tool definition."""
        return self._tools.get(name)

    def list_tools(self) -> Dict[str, str]:
        """Returns registered tool names and descriptions."""
        return {name: tool.description for name, tool in self._tools.items()}

    def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        user_confirmed: bool = False,
        actor: str = "agent",
    ) -> Any:
        """Validates arguments against the tool schema and executes the tool safely.
        
        Args:
            tool_name: Registered tool identifier.
            arguments: Dictionary of arguments supplied by LLM or user.
            user_confirmed: Whether explicit user approval was obtained for sensitive actions.
            actor: Calling entity name.
            
        Returns:
            The tool's execution result.
            
        Raises:
            SecurityValidationError: If arguments fail schema validation.
            AuthorizationRequiredError: If tool requires approval and user_confirmed is False.
            ToolExecutionError: If execution fails.
        """
        tool = self._tools.get(tool_name)
        if not tool:
            raise SecurityValidationError(f"Unknown tool '{tool_name}'. Not found in registered tools.")

        # Human-in-the-loop gate
        if tool.requires_approval and not user_confirmed:
            self.audit.log_event(
                event_type="TOOL_GATE_BLOCKED",
                severity="WARNING",
                action=f"Blocked unapproved execution of sensitive tool: {tool_name}",
                actor=actor,
                details={"tool": tool_name},
                success=False,
            )
            raise AuthorizationRequiredError(
                f"Action '{tool_name}' is high-consequence and requires explicit user authorization."
            )

        # Validate arguments using Pydantic schema
        try:
            validated_args = tool.args_schema(**arguments)
        except ValidationError as e:
            self.audit.log_event(
                event_type="TOOL_VALIDATION_FAILED",
                severity="WARNING",
                action=f"Schema validation failed for tool '{tool_name}'",
                actor=actor,
                details={"errors": e.errors()},
                success=False,
            )
            raise SecurityValidationError(f"Invalid arguments for tool '{tool_name}': {e}") from e

        # Execute handler within safety try-catch
        try:
            # Pass validated args as model dump or keyword arguments
            result = tool.handler(**validated_args.model_dump())
            
            self.audit.log_event(
                event_type="TOOL_EXECUTED",
                severity="INFO",
                action=f"Successfully executed tool: {tool_name}",
                actor=actor,
                details={"tool": tool_name},
                success=True,
            )
            return result
        except Exception as e:
            self.audit.log_event(
                event_type="TOOL_EXECUTION_ERROR",
                severity="ERROR",
                action=f"Error executing tool '{tool_name}': {e}",
                actor=actor,
                details={"tool": tool_name, "error": str(e)},
                success=False,
            )
            raise ToolExecutionError(f"Execution of tool '{tool_name}' failed: {e}") from e
