__version__ = "0.1.0"

from .client import REMClient
from .types import Agent, RetrieveResult, SemanticMemory, WriteResult
from .exceptions import (
    REMError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    APIError,
    ConnectionError,
    ValidationError,
)

__all__ = [
    "REMClient",
    "WriteResult",
    "RetrieveResult",
    "SemanticMemory",
    "Agent",
    "REMError",
    "AuthenticationError",
    "NotFoundError",
    "RateLimitError",
    "APIError",
    "ConnectionError",
    "ValidationError",
]

