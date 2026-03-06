from __future__ import annotations

from typing import Optional


class REMError(Exception):
    """Base exception for all REM errors."""

    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}({self.message!r})"


class AuthenticationError(REMError):
    """Raised when API key is invalid or missing."""


class NotFoundError(REMError):
    """Raised when requested resource doesn't exist."""


class RateLimitError(REMError):
    """Raised when rate limit exceeded."""

    def __init__(self, message: str, retry_after: Optional[int] = None) -> None:
        super().__init__(message, 429)
        self.retry_after = retry_after


class APIError(REMError):
    """Generic API error with status code."""


class ConnectionError(REMError):
    """Raised when cannot connect to REM API."""


class ValidationError(REMError):
    """Raised when request data is invalid."""
